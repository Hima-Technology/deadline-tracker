<?php
namespace App\Models;

class ReminderLog extends BaseModel
{
    protected static string $table = 'reminder_logs';
    protected static array $fillable = [
        'closing_id', 'channel', 'recipient',
        'message_template', 'status', 'provider_response'
    ];

    public static function alreadySentToday(int $closingId, string $channel, int $daysBefore): bool
    {
        $stmt = self::pdo()->prepare(
            "SELECT 1 FROM reminder_logs
             WHERE closing_id = ? AND channel = ?
               AND message_template = ?
               AND sent_at::date = CURRENT_DATE
             LIMIT 1"
        );
        $stmt->execute([$closingId, $channel, "reminder_d{$daysBefore}"]);
        return (bool) $stmt->fetchColumn();
    }
}