<?php
namespace App\Services;

use App\Core\Database;
use App\Models\Closing;
use App\Models\ReminderLog;
use App\Models\User;

class ReminderService
{
    public static function generateClosings(): int
    {
        $pdo = Database::pdo();
        $obligations = $pdo->query(
            'SELECT o.*, c.financial_year_end 
             FROM obligations o 
             JOIN clients c ON c.id = o.client_id 
             WHERE o.is_active = TRUE'
        )->fetchAll();
        
        $count = 0;

        foreach ($obligations as $o) {
            try {
                $period = self::currentPeriod($o['frequency']);
                if ($period === null) continue;

                if ($o['frequency'] === 'annual' && !empty($o['financial_year_end'])) {
                    $fye = explode('-', $o['financial_year_end']);
                    $month = (int)$fye[0];
                    $day = (int)$fye[1];
                    $year = (int)date('Y');
                    
                    $dueDateObj = new \DateTime("{$year}-{$month}-{$day}");
                    if ($dueDateObj < new \DateTime('today')) {
                        $year++;
                    }
                    $dueDate = sprintf('%04d-%02d-%02d', $year, $month, $day);
                } else {
                    $dueDate = self::dueDate($period, (int)$o['due_day'], $o['frequency']);
                }

                $sql = "INSERT INTO closings
                        (obligation_id, client_id, assigned_staff_id, period_label, due_date, status)
                        VALUES (?,?,?,?,?, 'open')
                        ON CONFLICT (obligation_id, period_label) DO UPDATE 
                        SET due_date = EXCLUDED.due_date, assigned_staff_id = EXCLUDED.assigned_staff_id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $o['id'], $o['client_id'], $o['default_staff_id'],
                    $period, $dueDate
                ]);
                
                if ($stmt->rowCount() > 0) {
                    $count++;
                }
            } catch (\Throwable $e) {
                echo "Kosa kwenye Obligation ID {$o['id']}: " . $e->getMessage() . PHP_EOL;
            }
        }
        return $count;
    }

    private static function currentPeriod(string $freq): ?string
    {
        $now = new \DateTime();
        return match ($freq) {
            'monthly'   => $now->format('Y-m'),
            'quarterly' => $now->format('Y') . '-Q' . ceil($now->format('n') / 3),
            'annual'    => $now->format('Y'),
            'one_off'   => $now->format('Y-m-d'),
            default     => null,
        };
    }

    private static function dueDate(string $period, int $dueDay, string $freq): string
    {
        $now = new \DateTime();
        $year = (int)$now->format('Y');
        $month = (int)$now->format('n');

        if ($freq === 'annual') {
            $month = 1;
        } elseif ($freq === 'quarterly') {
            $quarter = ceil($month / 3);
            $month = $quarter * 3;
        }

        $month = max(1, min(12, $month));

        $daysInMonth = (int)date('t', strtotime("{$year}-{$month}-01"));
        $day = min($dueDay, $daysInMonth);
        $day = max(1, $day);

        return sprintf('%04d-%02d-%02d', $year, $month, $day);
    }

    public static function sendReminders(): array
    {
        $stats = ['reminders_sent' => 0, 'escalations_sent' => 0, 'failed' => 0];

        Closing::refreshStatuses();

        $pdo = Database::pdo();

        $closings = $pdo->query(
            "SELECT c.*, o.reminder_days, o.title AS obligation_title,
                    cl.company_name, u.name AS staff_name, u.email AS staff_email,
                    u.phone AS staff_phone
             FROM closings c
             JOIN obligations o ON o.id = c.obligation_id
             JOIN clients cl ON cl.id = c.client_id
             LEFT JOIN users u ON u.id = c.assigned_staff_id
             WHERE c.status IN ('open','due_soon','overdue')"
        )->fetchAll();

        foreach ($closings as $c) {
            $dueDate = new \DateTime($c['due_date']);
            $today   = new \DateTime('today');
            $diff    = (int)$today->diff($dueDate)->format('%r%a');
            
            $offsets = json_decode($c['reminder_days'], true) ?: [10, 7, 3, 1, 0];

            foreach ($offsets as $offset) {
                if ($diff === $offset) {
                    $result = self::deliver($c, $offset, 'reminder');
                    if ($result) $stats['reminders_sent']++; else $stats['failed']++;
                }
            }

            if ($diff < 0) {
                $result = self::deliver($c, 0, 'escalation');
                if ($result) $stats['escalations_sent']++; else $stats['failed']++;
                
                foreach ($pdo->query("SELECT email, phone FROM users WHERE role='admin'") as $admin) {
                    self::deliverTo($c, $admin, 'escalation_admin');
                }
            }
        }
        return $stats;
    }

    private static function deliver(array $c, int $offset, string $type): bool
    {
        $recipient = [
            'email' => $c['staff_email'] ?? null,
            'phone' => $c['staff_phone'] ?? null,
        ];
        return self::deliverTo($c, $recipient, "{$type}_d{$offset}");
    }

    private static function deliverTo(array $c, array $recipient, string $templateKey): bool
    {
        $daysBefore = (int) filter_var($templateKey, FILTER_SANITIZE_NUMBER_INT);
        if (ReminderLog::alreadySentToday($c['id'], 'whatsapp', $daysBefore)) return false;

        $text = self::buildMessage($c, $templateKey);
        $subject = "Deadline: {$c['company_name']} — {$c['obligation_title']}";
        $sent = false;

        // 1. WhatsApp
        if (!empty($recipient['phone'])) {
            $res = WhatsAppService::sendTemplate($recipient['phone'], 'deadline_reminder', [
                $c['staff_name'] ?? 'Team',
                $c['company_name'],
                $c['obligation_title'],
                $c['due_date'],
            ]);
            ReminderLog::create([
                'closing_id' => $c['id'], 'channel' => 'whatsapp',
                'recipient'  => $recipient['phone'],
                'message_template' => "reminder_d{$daysBefore}",
                'status' => $res['ok'] ? 'sent' : 'failed',
                'provider_response' => $res['response'],
            ]);
            if ($res['ok']) $sent = true;
        }

        // 2. Email (SMTP)
        if (!empty($recipient['email'])) {
            $res = EmailService::send($recipient['email'], $subject, nl2br($text));
            ReminderLog::create([
                'closing_id' => $c['id'], 'channel' => 'email',
                'recipient'  => $recipient['email'],
                'message_template' => "reminder_d{$daysBefore}",
                'status' => $res['ok'] ? 'sent' : 'failed',
                'provider_response' => $res['response'],
            ]);
            if ($res['ok']) $sent = true;
        }

        // 3. SMS (Mpya)
        if (!empty($recipient['phone'])) {
            $res = SmsService::send($recipient['phone'], $text);
            ReminderLog::create([
                'closing_id' => $c['id'], 'channel' => 'sms',
                'recipient'  => $recipient['phone'],
                'message_template' => "reminder_d{$daysBefore}",
                'status' => $res['ok'] ? 'sent' : 'failed',
                'provider_response' => $res['response'],
            ]);
            if ($res['ok']) $sent = true;
        }

        return $sent;
    }

    private static function buildMessage(array $c, string $key): string
    {
        return "Hello {$c['staff_name']},\n\n"
             . "Reminder: '{$c['obligation_title']}' for {$c['company_name']} "
             . "is due on {$c['due_date']}.\n"
             . "Please log in and mark it closed once done.\n\n"
             . "— SBC Deadline Tracker";
    }
}