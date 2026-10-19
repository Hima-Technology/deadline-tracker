<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;

class ReportController
{
    public function weeklySummary(): void
    {
        Auth::requireAdmin();
        $pdo = Database::pdo();
        $rows = $pdo->query(
            "SELECT u.name AS staff, c.status, COUNT(*) AS total
             FROM closings c LEFT JOIN users u ON u.id = c.assigned_staff_id
             GROUP BY u.name, c.status ORDER BY u.name"
        )->fetchAll();
        Response::success($rows);
    }

    public function activityLog(): void
    {
        Auth::requireAdmin();
        $pdo = Database::pdo();
        $rows = $pdo->query(
            "SELECT a.*, u.name AS user_name
             FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id
             ORDER BY a.created_at DESC LIMIT 200"
        )->fetchAll();
        Response::success($rows);
    }

    public function reminderLogs(): void
    {
        Auth::requireAdmin();
        $pdo = Database::pdo();
        $rows = $pdo->query(
            "SELECT r.*, c.period_label FROM reminder_logs r
             LEFT JOIN closings c ON c.id = r.closing_id
             ORDER BY r.sent_at DESC LIMIT 200"
        )->fetchAll();
        Response::success($rows);
    }
}