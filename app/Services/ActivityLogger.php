<?php
namespace App\Services;

use App\Models\ActivityLog;

class ActivityLogger
{
    public static function log(?int $userId, ?int $closingId, string $action, $old = null, $new = null): void
    {
        ActivityLog::create([
            'user_id'    => $userId,
            'closing_id' => $closingId,
            'action'     => $action,
            'old_value'  => $old ? json_encode($old) : null,
            'new_value'  => $new ? json_encode($new) : null,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
        ]);
    }
}