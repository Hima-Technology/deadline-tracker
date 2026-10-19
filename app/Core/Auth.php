<?php
namespace App\Core;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Auth
{
    private static array $config;
    private static ?array $user = null;

    public static function init(): void
    {
        self::$config = require __DIR__ . '/../../config/config.php';
    }

    public static function issueToken(array $user): string
    {
        self::init();
        $payload = [
            'sub'  => $user['id'],
            'role' => $user['role'],
            'iat'  => time(),
            'exp'  => time() + self::$config['jwt']['ttl'],
        ];
        // v7 API is the same — JWT::encode is unchanged
        return JWT::encode($payload, self::$config['jwt']['secret'], 'HS256');
    }

    public static function user(): ?array
    {
        if (self::$user !== null) return self::$user;

        self::init();
        $token = Request::bearerToken();
        if (!$token) return null;

        try {
            // v7 enforces the key object — this is already how we call it
            $decoded = JWT::decode($token, new Key(self::$config['jwt']['secret'], 'HS256'));
            $stmt = Database::pdo()->prepare(
                'SELECT id, name, email, phone, role, is_active FROM users WHERE id = ? LIMIT 1'
            );
            $stmt->execute([$decoded->sub]);
            $user = $stmt->fetch();
            if (!$user || !$user['is_active']) return null;
            return self::$user = $user;
        } catch (\Throwable $e) {
            return null;
        }
    }

    public static function requireAuth(): array
    {
        $u = self::user();
        if (!$u) Response::error('Unauthorized', 401);
        return $u;
    }

    public static function requireAdmin(): array
    {
        $u = self::requireAuth();
        if ($u['role'] !== 'admin') Response::error('Forbidden — admin only', 403);
        return $u;
    }
}