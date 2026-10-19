<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Models\Closing;
use App\Services\ActivityLogger;
use App\Core\Database;

class ClosingController
{
    public function index(): void
    {
        try {
            Auth::requireAdmin();
            $filters = [
                'assigned_staff_id' => $_GET['staff_id'] ?? null,
                'client_id'         => $_GET['client_id'] ?? null,
                'status'            => $_GET['status'] ?? null,
                'period'            => $_GET['period'] ?? null,
            ];
            Response::success(Closing::filter($filters));
        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch closings',
                'error_detail' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            exit;
        }
    }

    public function mine(): void
    {
        $u = Auth::requireAuth();
        Response::success(Closing::forStaff($u['id']));
    }

    public function show(string $id): void
    {
        $u = Auth::requireAuth();
        $c = Closing::findFull((int)$id);
        if (!$c) Response::error('Closing not found', 404);
        if ($u['role'] === 'staff' && (int)$c['assigned_staff_id'] !== (int)$u['id']) {
            Response::error('Forbidden', 403);
        }
        Response::success($c);
    }

    public function close(string $id): void
    {
        $u = Auth::requireAuth();
        $c = Closing::find((int)$id);
        if (!$c) Response::error('Closing not found', 404);
        if ($u['role'] === 'staff' && (int)$c['assigned_staff_id'] !== (int)$u['id']) {
            Response::error('Forbidden', 403);
        }
        if ($c['status'] === 'closed') Response::error('Already closed', 422);

        $data = Request::body();
        $ref  = $data['reference_number'] ?? null;
        if (!$ref) Response::error('reference_number is required', 422);

        $proofPath = null;
        if (!empty($_FILES['proof']['tmp_name'])) {
            $file = $_FILES['proof'];
            if ($file['size'] > 5 * 1024 * 1024) Response::error('File too large (max 5MB)', 422);
            $allowed = ['application/pdf','image/jpeg','image/png'];
            if (!in_array($file['type'], $allowed)) Response::error('Invalid file type', 422);

            $dir = __DIR__ . '/../../storage/uploads/' . date('Y/m');
            if (!is_dir($dir)) mkdir($dir, 0775, true);
            $name = uniqid('proof_') . '_' . basename($file['name']);
            move_uploaded_file($file['tmp_name'], "$dir/$name");
            $proofPath = "/uploads/" . date('Y/m') . "/$name";
        }

        $old = $c;
        $updated = Closing::markClosed((int)$id, $u['id'], $ref, $proofPath);
        ActivityLogger::log($u['id'], (int)$id, 'closing_closed', $old, $updated);
        Response::success($updated, 'Closing marked as done');
    }

    public function update(string $id): void
    {
        try {
            $u = Auth::requireAuth();
            $c = Closing::find((int)$id);
            if (!$c) Response::error('Closing not found', 404);
            
            if ($u['role'] === 'staff' && (int)$c['assigned_staff_id'] !== (int)$u['id']) {
                Response::error('Forbidden', 403);
            }

            $data = Request::body();
            
            if (isset($data['reference_number'])) {
                $stmt = Database::pdo()->prepare(
                    "UPDATE closings 
                     SET reference_number = ?, updated_at = NOW() 
                     WHERE id = ? RETURNING *"
                );
                $stmt->execute([$data['reference_number'], $id]);
                $updated = $stmt->fetch();
                
                // Tumeondoa Closing::normalizeRow hapa ili kuepuka kosa
                ActivityLogger::log($u['id'], (int)$id, 'closing_updated', $c, $updated);
                Response::success($updated, 'Reference number updated');
            } else {
                Response::error('No data to update', 422);
            }
        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Update failed',
                'error_detail' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            exit;
        }
    }

    public function destroy(string $id): void
    {
        Auth::requireAdmin();
        $c = Closing::find((int)$id);
        if (!$c) Response::error('Closing not found', 404);

        Closing::delete((int)$id);
        ActivityLogger::log(null, (int)$id, 'closing_deleted', $c);
        Response::success(null, 'Closing deleted');
    }
}