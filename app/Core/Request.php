<?php
namespace App\Core;

class Request
{
    public static function body(): array
    {
        // Kama ni multipart/form-data (fomu yenye faili), data ipo kwenye $_POST
        if (!empty($_POST)) {
            return $_POST;
        }
        
        // Kama ni application/json, data ipo kwenye php://input
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    public static function input(string $key, $default = null)
    {
        return self::body()[$key] ?? $default;
    }

    public static function header(string $name): ?string
    {
        $headers = getallheaders();
        foreach ($headers as $k => $v) {
            if (strcasecmp($k, $name) === 0) return $v;
        }
        return null;
    }

    public static function bearerToken(): ?string
    {
        $auth = self::header('Authorization');
        if ($auth && preg_match('/Bearer\s+(.*)$/i', $auth, $m)) return $m[1];
        return null;
    }

    public static function method(): string
    {
        return $_SERVER['REQUEST_METHOD'];
    }

    public static function path(): string
    {
        return parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    }
}