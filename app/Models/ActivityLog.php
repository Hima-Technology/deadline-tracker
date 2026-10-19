<?php
namespace App\Models;

class ActivityLog extends BaseModel
{
    protected static string $table = 'activity_logs';
    protected static array $fillable = [
        'user_id', 'closing_id', 'action', 'old_value', 'new_value', 'ip_address'
    ];
}