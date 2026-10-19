<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Response;

class FileController
{
    public function serve(string $path): void
    {
        // Auth::requireAuth(); // Kwa majaribio, tunaiacha wazi

        // Safisha path
        $safePath = ltrim(str_replace(['..', '\\'], '', $path), '/');

        // Njia kamili ya Windows (badilisha kama folda yako iko tofauti)
        $fullPath = 'C:/xampp/htdocs/deadline-tracker/storage/' . $safePath;

        // Kama haipo, jaribu public/storage
        if (!file_exists($fullPath)) {
            $fullPath = 'C:/xampp/htdocs/deadline-tracker/public/storage/' . $safePath;
        }

        if (!file_exists($fullPath)) {
            Response::error('File not found at: ' . $fullPath, 404);
        }

        $mimeType = mime_content_type($fullPath);
        $allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];

        if (!in_array($mimeType, $allowedMimes)) {
            Response::error('Invalid file type: ' . $mimeType, 403);
        }

        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($fullPath));
        header('Content-Disposition: inline; filename="' . basename($fullPath) . '"');
        
        readfile($fullPath);
        exit;
    }
}