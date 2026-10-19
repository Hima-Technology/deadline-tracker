<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;

class DashboardController
{
    public function admin(): void
    {
        Auth::requireAdmin();
        $pdo = Database::pdo();

        $counts = $pdo->query(
            "SELECT
                COUNT(*) FILTER (WHERE status='overdue')   AS overdue,
                COUNT(*) FILTER (WHERE status='due_soon')  AS due_soon,
                COUNT(*) FILTER (WHERE status='closed'
                                 AND closed_at >= date_trunc('month', NOW())) AS closed_this_month,
                COUNT(*) FILTER (WHERE status='open')      AS open
             FROM closings"
        )->fetch();

        $perStaff = $pdo->query(
            "SELECT u.id, u.name,
                    COUNT(c.id) FILTER (WHERE c.status <> 'closed') AS open_count,
                    COUNT(c.id) FILTER (WHERE c.status = 'overdue') AS overdue_count,
                    COUNT(c.id) FILTER (WHERE c.status = 'closed'
                          AND c.closed_at <= c.due_date) AS on_time,
                    COUNT(c.id) FILTER (WHERE c.status = 'closed'
                          AND c.closed_at >  c.due_date) AS late
             FROM users u
             LEFT JOIN closings c ON c.assigned_staff_id = u.id
             WHERE u.role = 'staff'
             GROUP BY u.id, u.name
             ORDER BY u.name"
        )->fetchAll();

        Response::success(['counters' => $counts, 'staff_performance' => $perStaff]);
    }

    public function staff(): void
    {
        $u = Auth::requireAuth();
        $pdo = Database::pdo();
        $counts = $pdo->prepare(
            "SELECT
                COUNT(*) FILTER (WHERE status='overdue')  AS overdue,
                COUNT(*) FILTER (WHERE status='due_soon') AS due_soon,
                COUNT(*) FILTER (WHERE status='closed')   AS closed,
                COUNT(*) FILTER (WHERE status='open')     AS open
             FROM closings WHERE assigned_staff_id = ?"
        );
        $counts->execute([$u['id']]);
        Response::success(['counters' => $counts->fetch()]);
    }
}