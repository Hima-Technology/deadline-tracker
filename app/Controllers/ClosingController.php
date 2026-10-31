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
        $authorities = $this->validatedAuthorities($data['authorities'] ?? null);

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
        $updated = Closing::markClosed((int)$id, $u['id'], $ref, $proofPath, $authorities);
        ActivityLogger::log($u['id'], (int)$id, 'closing_closed', $old, $updated);
        Response::success($updated, 'Closing marked as done');
    }

    public function update(string $id): void
    {
        try {
            $u = Auth::requireAuth();
            $c = Closing::find((int)$id);
            if (!$c) Response::error('Closing not found', 404);
            
            // Admin anaweza kufunga kazi yoyote
            if ($u['role'] !== 'admin' && (int)$c['assigned_staff_id'] !== (int)$u['id']) {
                Response::error('Forbidden', 403);
            }

            $data = Request::body();
            $patch = [];

            if (isset($data['status'])) $patch['status'] = $data['status'];
            if (isset($data['reference_number'])) $patch['reference_number'] = $data['reference_number'];
            
            if (isset($data['status']) && $data['status'] === 'closed') {
                $patch['authorities'] = json_encode($this->validatedAuthorities($data['authorities'] ?? null));
                $patch['closed_at'] = date('Y-m-d H:i:s');
                $patch['closed_by'] = $u['id'];
            }

            // Kushughulikia Attachment (Proof)
            if (!empty($_FILES['proof']['tmp_name'])) {
                $file = $_FILES['proof'];
                if ($file['size'] > 5 * 1024 * 1024) Response::error('File too large (max 5MB)', 422);
                $allowed = ['application/pdf','image/jpeg','image/png'];
                if (!in_array($file['type'], $allowed)) Response::error('Invalid file type', 422);

                $dir = __DIR__ . '/../../storage/uploads/' . date('Y/m');
                if (!is_dir($dir)) mkdir($dir, 0775, true);
                $name = uniqid('proof_') . '_' . basename($file['name']);
                move_uploaded_file($file['tmp_name'], "$dir/$name");
                $patch['proof_file_path'] = "/uploads/" . date('Y/m') . "/$name";
            }

            // Update Database
            if (!empty($patch)) {
                $updated = Closing::update((int)$id, $patch);
                ActivityLogger::log($u['id'], (int)$id, 'closing_updated', $c, $updated);
                Response::success($updated, 'Record updated');
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

    private function validatedAuthorities($value): array
    {
        if (is_string($value)) {
            $value = json_decode($value, true);
        }
        $allowed = ['TRA', 'ZRA', 'BPRA', 'ZSSF'];
        if (!is_array($value) || !$value) {
            Response::error('Select at least one institution', 422);
        }
        foreach ($value as $authority) {
            if (!is_string($authority) || !in_array($authority, $allowed, true)) {
                Response::error('Invalid institution selection', 422);
            }
        }
        return array_values(array_unique($value));
    }

    public function destroy(string $id): void
    {
        Auth::requireAdmin();
        $c = Closing::find((int)$id);
        if (!$c) Response::error('Closing not found', 404);

        Closing::delete((int)$id);
        ActivityLogger::log(null, null, 'closing_deleted', $c);
        Response::success(null, 'Closing deleted');
    }
}