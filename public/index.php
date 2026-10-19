<?php
declare(strict_types=1);

// ONGEZA HIZI MBILI ILI TUONE MAKOSA
ini_set('display_errors', '1');
error_reporting(E_ALL);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Request;
use App\Core\Response;
use App\Core\Auth;

// CORS (adjust origin in production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if (Request::method() === 'OPTIONS') { http_response_code(204); exit; }

// Badilisha exception handler ili ionyeshe kosa halisi wakati wa development
set_exception_handler(function (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Server error',
        'error_detail' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    exit;
});

Auth::init();

$router = require __DIR__ . '/../app/routes.php';
$path = Request::path();

$router->dispatch(Request::method(), $path);