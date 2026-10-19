<?php
// router.php kwa ajili ya PHP Built-in Server

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Kama ni API request, tuma kwenye index.php
if (str_starts_with($uri, '/api/')) {
    require_once __DIR__ . '/public/index.php';
    return true;
}

// Kama ni faili halisi (kama CSS, JS, n.k.), tuma moja kwa moja
if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri)) {
    return false;
}

// Kama ni ukurasa mwingine, tuma kwenye index.php
require_once __DIR__ . '/public/index.php';
return true;