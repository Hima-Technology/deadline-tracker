<?php
use Dotenv\Dotenv;

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

return [
    'app' => [
        'name' => $_ENV['APP_NAME'] ?? 'Deadline Tracker',
        'url'  => $_ENV['APP_URL'] ?? 'http://localhost:8000',
        'env'  => $_ENV['APP_ENV'] ?? 'production',
    ],
    'db' => [
        'host' => $_ENV['DB_HOST'],
        'port' => $_ENV['DB_PORT'],
        'name' => $_ENV['DB_NAME'],
        'user' => $_ENV['DB_USER'],
        'pass' => $_ENV['DB_PASS'],
    ],
    'jwt' => [
        'secret' => $_ENV['JWT_SECRET'],
        'ttl'    => 60 * 60 * 24 * 7, // 7 days
    ],
    'smtp' => [
        'host'      => $_ENV['SMTP_HOST'],
        'port'      => (int) $_ENV['SMTP_PORT'],
        'user'      => $_ENV['SMTP_USER'],
        'pass'      => $_ENV['SMTP_PASS'],
        'from'      => $_ENV['SMTP_FROM'],
        'from_name' => $_ENV['SMTP_FROM_NAME'],
    ],
    'whatsapp' => [
        'api_url'  => $_ENV['WHATSAPP_API_URL'],
        'phone_id' => $_ENV['WHATSAPP_PHONE_ID'],
        'token'    => $_ENV['WHATSAPP_TOKEN'],
    ],
];