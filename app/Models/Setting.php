<?php
namespace App\Models;

class Setting extends BaseModel
{
    protected static string $table = 'settings';
    protected static array $fillable = ['key', 'value', 'updated_by'];

    public static function get(string $key, $default = null)
    {
        $stmt = self::pdo()->prepare('SELECT value FROM settings WHERE key = ? LIMIT 1');
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        return $row ? json_decode($row['value'], true) : $default;
    }

    public static function set(string $key, $value, ?int $userId = null): void
    {
        $json = json_encode($value);
        $stmt = self::pdo()->prepare(
            'INSERT INTO settings (key, value, updated_by, updated_at)
             VALUES (?, ?, ?, NOW())
             ON CONFLICT (key) DO UPDATE
             SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()'
        );
        $stmt->execute([$key, $json, $userId]);
    }
}