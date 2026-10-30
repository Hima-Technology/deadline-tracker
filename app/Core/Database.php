<?php
namespace App\Core;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo === null) {
            $config = require __DIR__ . '/../../config/config.php';
            $db = $config['db'];
            $dsn = "pgsql:host={$db['host']};port={$db['port']};dbname={$db['name']}";
            try {
                self::$pdo = new PDO($dsn, $db['user'], $db['pass'], [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'DB connection failed', 'detail' => $e->getMessage()]);
                exit;
            }
        }
        return self::$pdo;
    }

    /**
     * Alias ya pdo() — inatumika na ClientController n.k.
     */
    public static function getInstance(): PDO
    {
        return self::pdo();
    }
}