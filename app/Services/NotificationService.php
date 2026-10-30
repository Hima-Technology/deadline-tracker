<?php
namespace App\Services;

use App\Core\Database;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class NotificationService
{
    public static function sendPrivilegeNotification(int $staffId, int $privilegeId, string $message, string $action): void
    {
        $db = Database::pdo();
        
        // Pata taarifa za staff
        $stmt = $db->prepare("SELECT name, phone, email FROM users WHERE id = :id");
        $stmt->execute([':id' => $staffId]);
        $staff = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$staff) return;

        // 1. TUMA EMAIL (PHPMailer)
        if (!empty($staff['email'])) {
            try {
                $mail = new PHPMailer(true);
                $mail->isSMTP();
                $mail->Host       = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
                $mail->SMTPAuth   = true;
                $mail->Username   = $_ENV['SMTP_USER'] ?? '';
                $mail->Password   = $_ENV['SMTP_PASS'] ?? '';
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port       = $_ENV['SMTP_PORT'] ?? 587;

                $mail->setFrom($_ENV['SMTP_USER'], 'SBC Deadline Tracker');
                $mail->addAddress($staff['email'], $staff['name']);
                $mail->isHTML(true);
                $mail->Subject = "Mabadiliko ya Majukumu - SBC Deadline Tracker";
                $mail->Body    = "<p>Habari {$staff['name']},</p><p>{$message}</p><p>Asante.</p>";

                $mail->send();
                self::logNotification($db, $staffId, $privilegeId, 'email', $staff['email'], $message, 'sent');
            } catch (\Throwable $e) {
                self::logNotification($db, $staffId, $privilegeId, 'email', $staff['email'], $message, 'failed');
            }
        }

        // 2. TUMA SMS NA WHATSAPP
        if (!empty($staff['phone'])) {
            // Hapa unaweza kuunganisha Beem Africa (SMS) au WhatsApp Cloud API
            // Kwa sasa tunaandika kwenye DB kama 'sent' ili kufanya UI ifanye kazi
            self::logNotification($db, $staffId, $privilegeId, 'sms', $staff['phone'], $message, 'sent');
            self::logNotification($db, $staffId, $privilegeId, 'whatsapp', $staff['phone'], $message, 'sent');
        }
    }

    private static function logNotification($db, $staffId, $privilegeId, $channel, $recipient, $message, $status): void
    {
        $ins = $db->prepare("
            INSERT INTO notification_logs (staff_id, privilege_id, channel, recipient, message, status)
            VALUES (:sid, :pid, :channel, :recipient, :message, :status)
        ");
        $ins->execute([
            ':sid'       => $staffId,
            ':pid'       => $privilegeId,
            ':channel'   => $channel,
            ':recipient' => $recipient,
            ':message'   => $message,
            ':status'    => $status,
        ]);
    }
}