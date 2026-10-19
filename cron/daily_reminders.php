<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Services\ReminderService;

echo "[" . date('Y-m-d H:i:s') . "] Starting daily job\n";

$created = ReminderService::generateClosings();
echo "Created closings: {$created}\n";

$stats = ReminderService::sendReminders();
echo json_encode($stats) . "\n";

echo "[" . date('Y-m-d H:i:s') . "] Done\n";