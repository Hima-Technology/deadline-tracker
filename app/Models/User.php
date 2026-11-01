<?php
namespace App\Models;

class User extends BaseModel
{
    protected static string $table = 'users';
    protected static array $fillable = [
        'name', 'email', 'phone', 'password_hash', 'role', 'is_active', 'avatar_path', 'last_login_at'
    ];

    public static function findByEmail(string $email): ?array
    {
        $stmt = self::pdo()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ? self::normalizeRow($row) : null;
    }

    public static function staff(): array
    {
        $stmt = self::pdo()->prepare(
            "SELECT id, name, email, phone, role, is_active, created_at
             FROM users 
             ORDER BY name ASC"
        );
        $stmt->execute();
        $results = $stmt->fetchAll();
        
        // Hakikisha is_active ni true/false
        foreach ($results as &$row) {
            $row['is_active'] = ($row['is_active'] === true || $row['is_active'] === 't' || $row['is_active'] == 1);
        }
        
        return $results;
    }

    public static function activeStaff(): array
    {
        $stmt = self::pdo()->prepare(
            "SELECT id, name
             FROM users
             WHERE role = 'staff' AND is_active = TRUE
             ORDER BY name ASC"
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }
}