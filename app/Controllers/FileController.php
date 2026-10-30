<?php
namespace App\Controllers;

class FileController
{
    public function serve(): void
    {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $path = preg_replace('#^/api/files/#', '', $uri);
        $path = str_replace(['..', '\\'], '', urldecode($path));
        $path = ltrim($path, '/');

        $baseDir = __DIR__ . '/../../storage/';
        $filePath = realpath($baseDir . $path);

        if (!$filePath || !is_file($filePath) || strpos($filePath, realpath($baseDir)) !== 0) {
            http_response_code(404);
            echo "File not found: " . htmlspecialchars($path);
            return;
        }

        $mime = mime_content_type($filePath) ?: 'application/octet-stream';
        
        // === BADILISHA HEADERS HAPA ===
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . filesize($filePath));
        header('Content-Disposition: inline; filename="' . basename($filePath) . '"');
        
        // Ruhusu iframe kutoka localhost (Vite) kuonyesha PDF hii
        header('X-Frame-Options: ALLOWALL');
        header("Content-Security-Policy: frame-ancestors 'self' http://localhost:5173 http://127.0.0.1:5173");
        // ==============================

        readfile($filePath);
        exit;
    }
}