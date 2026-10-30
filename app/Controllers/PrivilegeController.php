<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Services\NotificationService;

class PrivilegeController
{
    public function index(): void
    {
        Auth::requireAdmin();
        try {
            $db = Database::pdo();
            $stmt = $db->query("
                SELECT sp.*, u.name AS staff_name, c.company_name 
                FROM staff_privileges sp
                JOIN users u ON u.id = sp.staff_id
                LEFT JOIN clients c ON c.id = sp.client_id
                ORDER BY sp.created_at DESC
            ");
            $privileges = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            foreach ($privileges as &$p) {
                if (is_string($p['permissions'])) {
                    $p['permissions'] = json_decode($p['permissions'], true) ?: [];
                } elseif (!$p['permissions']) {
                    $p['permissions'] = [];
                }

                $stmt2 = $db->prepare("SELECT channel, status, sent_at FROM notification_logs WHERE privilege_id = :pid");
                $stmt2->execute([':pid' => $p['id']]);
                $p['notifications'] = $stmt2->fetchAll(\PDO::FETCH_ASSOC);
            }

            Response::success($privileges);
        } catch (\Throwable $e) {
            Response::error('Failed to fetch privileges', 500, ['detail' => $e->getMessage()]);
        }
    }

    // =========================================================
    // MY PRIVILEGES (Kwa ajili ya Staff aliyelogin)
    // =========================================================
    public function myPrivileges(): void
    {
        try {
            $u = Auth::requireAuth();
            $db = Database::pdo();
            
            $stmt = $db->prepare("
                SELECT sp.*, c.company_name 
                FROM staff_privileges sp
                LEFT JOIN clients c ON c.id = sp.client_id
                WHERE sp.staff_id = :sid
                ORDER BY sp.created_at DESC
            ");
            $stmt->execute([':sid' => $u['id']]);
            $privileges = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            foreach ($privileges as &$p) {
                if (is_string($p['permissions'])) {
                    $p['permissions'] = json_decode($p['permissions'], true) ?: [];
                } elseif (!$p['permissions']) {
                    $p['permissions'] = [];
                }
            }

            Response::success($privileges);
        } catch (\Throwable $e) {
            Response::error('Failed to fetch your privileges', 500, ['detail' => $e->getMessage()]);
        }
    }

    public function store(): void
    {
        $db = null;
        try {
            $u = Auth::requireAdmin();
            $body = Request::body();
            
            $staffId = (int)($body['staff_id'] ?? 0);
            $clientId = (int)($body['client_id'] ?? 0);
            $taskType = $body['task_type'] ?? '';
            $permissions = $body['permissions'] ?? [];
            $description = $body['description'] ?? '';

            if (!$staffId || !$taskType) {
                Response::error('Staff na Task Type vinahitajika', 422);
                return;
            }

            $db = Database::pdo();
            $db->beginTransaction();

            $finalClientId = $clientId > 0 ? $clientId : null;

            $stmt = $db->prepare("
                INSERT INTO staff_privileges (staff_id, client_id, task_type, permissions, description, created_by)
                VALUES (:sid, :cid, :type, CAST(:perms AS JSONB), :desc, :by) RETURNING id
            ");
            $stmt->execute([
                ':sid'   => $staffId,
                ':cid'   => $finalClientId,
                ':type'  => $taskType,
                ':perms' => json_encode($permissions),
                ':desc'  => $description,
                ':by'    => $u['id'],
            ]);
            $privilegeId = (int)$stmt->fetchColumn();

            $message = "Habari, umepangiwa majukumu mapya ya mfumo. Tafadhali ingia kwenye mfumo kuona kazi zako.";
            
            if (class_exists('\App\Services\NotificationService')) {
                NotificationService::sendPrivilegeNotification($staffId, $privilegeId, $message, 'assigned');
            }

            $db->commit();
            
            http_response_code(201);
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'message' => 'Privilege assigned']);
            exit;

        } catch (\Throwable $e) {
            if ($db && $db->inTransaction()) $db->rollBack();
            Response::error('Failed to assign privilege', 500, ['detail' => $e->getMessage()]);
        }
    }

    public function update(string $id): void
    {
        $db = null;
        try {
            $u = Auth::requireAdmin();
            $body = Request::body();
            
            $staffId = (int)($body['staff_id'] ?? 0);
            $clientId = (int)($body['client_id'] ?? 0);
            $permissions = $body['permissions'] ?? [];
            $description = $body['description'] ?? '';

            $db = Database::pdo();
            $db->beginTransaction();

            $finalClientId = $clientId > 0 ? $clientId : null;

            $stmt = $db->prepare("
                UPDATE staff_privileges 
                SET staff_id = :sid, client_id = :cid, permissions = CAST(:perms AS JSONB), description = :desc
                WHERE id = :id
            ");
            $stmt->execute([
                ':sid'   => $staffId,
                ':cid'   => $finalClientId,
                ':perms' => json_encode($permissions),
                ':desc'  => $description,
                ':id'    => (int)$id,
            ]);

            $message = "Habari, majukumu yako kwenye mfumo yamefanyiwa mabadiliko. Tafadhali ingia kuangalia.";
            
            if (class_exists('\App\Services\NotificationService')) {
                NotificationService::sendPrivilegeNotification($staffId, (int)$id, $message, 'updated');
            }

            $db->commit();
            Response::success(null, 'Privilege updated');
        } catch (\Throwable $e) {
            if ($db && $db->inTransaction()) $db->rollBack();
            Response::error('Failed to update privilege', 500, ['detail' => $e->getMessage()]);
        }
    }

    public function destroy(string $id): void
    {
        Auth::requireAdmin();
        try {
            $db = Database::pdo();
            $db->prepare("DELETE FROM staff_privileges WHERE id = :id")->execute([':id' => (int)$id]);
            Response::success(null, 'Privilege deleted');
        } catch (\Throwable $e) {
            Response::error('Failed to delete privilege', 500, ['detail' => $e->getMessage()]);
        }
    }
}