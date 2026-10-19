<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Response;

class DashboardController
{
    public function admin(): void
    {
        try {
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

            // Badilisha namba kuwa integer ili React isome vizuri
            if ($counts) {
                $counts['overdue'] = (int) $counts['overdue'];
                $counts['due_soon'] = (int) $counts['due_soon'];
                $counts['closed_this_month'] = (int) $counts['closed_this_month'];
                $counts['open'] = (int) $counts['open'];
            }

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

            // Badilisha namba za staff kuwa integer
            foreach ($perStaff as &$row) {
                $row['open_count'] = (int) $row['open_count'];
                $row['overdue_count'] = (int) $row['overdue_count'];
                $row['on_time'] = (int) $row['on_time'];
                $row['late'] = (int) $row['late'];
            }

            Response::success(['counters' => $counts, 'staff_performance' => $perStaff]);
        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch dashboard',
                'error_detail' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            exit;
        }
    }

    public function staff(): void
    {
        try {
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
            $row = $counts->fetch();
            
            if ($row) {
                $row['overdue'] = (int) $row['overdue'];
                $row['due_soon'] = (int) $row['due_soon'];
                $row['closed'] = (int) $row['closed'];
                $row['open'] = (int) $row['open'];
            }

            Response::success(['counters' => $row]);
        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch staff dashboard',
                'error_detail' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            exit;
        }
    }
}