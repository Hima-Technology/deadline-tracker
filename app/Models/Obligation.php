<?php
namespace App\Models;

class Obligation extends BaseModel
{
    protected static string $table = 'obligations';
    protected static array $fillable = [
        'client_id', 'title', 'frequency', 'due_day',
        'default_staff_id', 'reminder_days', 'is_active'
    ];

    public static function active(): array
    {
        $stmt = self::pdo()->prepare('SELECT * FROM obligations WHERE is_active = TRUE');
        $stmt->execute();
        return $stmt->fetchAll();
    }
}