<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Core\Database;
use App\Models\Client;
use App\Services\ActivityLogger;

class ClientController
{
    public function index(): void
    {
        try {
            $u = Auth::requireAuth();
            $clients = Client::all([], 'company_name ASC');
            $clients = array_map(fn($c) => $this->maskPasswords($this->hideUploadedDocuments($c, $u), $u), $clients);
            Response::success($clients);
        } catch (\Throwable $e) {
            Response::error('Failed to fetch clients', 500, ['detail' => $e->getMessage()]);
        }
    }

    public function show(string $id): void
    {
        try {
            $u = Auth::requireAuth();
            $clientId = (int)$id;

            if (($u['role'] ?? '') !== 'admin') {
                $perms = $this->permissionsFor($u, $clientId);
                $canView = in_array('view_clients', $perms, true)
                    || in_array('edit_clients', $perms, true)
                    || count(array_intersect($perms, [
                        'upload_tra', 'upload_zra', 'upload_bpra', 'upload_zssf'
                    ])) > 0;

                if (!$canView) {
                    Response::error('Huna ruhusa ya kuona taarifa za mteja', 403);
                    return;
                }
            }

            $c = Client::find($clientId);
            if (!$c) {
                Response::error('Client not found', 404);
                return;
            }
            Response::success($this->maskPasswords($this->hideUploadedDocuments($c, $u), $u));
        } catch (\Throwable $e) {
            Response::error('Failed to fetch client', 500, ['detail' => $e->getMessage()]);
        }
    }

    public function store(): void
    {
        try {
            $u = Auth::requireAuth();

            // Admin au staff mwenye add_clients
            if (($u['role'] ?? '') !== 'admin') {
                if (!$this->staffHasPermission($u['id'], 'add_clients')) {
                    Response::error('Huna ruhusa ya kuongeza mteja', 403);
                    return;
                }
            }

            $data = Request::body();
            Validator::require($data, ['company_name']);
            $data['created_by'] = $u['id'];

            if (($u['role'] ?? '') !== 'admin') {
                foreach (['tra_attachment', 'zra_attachment', 'bpra_attachment', 'zssf_attachment'] as $field) {
                    if (isset($_FILES[$field]) && ($_FILES[$field]['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
                        Response::error('Register the client first, then upload institution documents from My Work after permission is assigned', 403);
                    }
                }
            }

            foreach (['tra_attachment', 'zra_attachment', 'bpra_attachment', 'zssf_attachment'] as $f) {
                if (isset($data[$f]) && (is_array($data[$f]) && empty($data[$f]) || $data[$f] === '[]')) {
                    unset($data[$f]);
                }
            }

            $data = $this->sanitizeDates($data);
            $data = $this->handleUploads($data, null);

            $clientResult = Client::create($data);
            $clientId = is_array($clientResult) ? ($clientResult['id'] ?? 0) : (int)$clientResult;

            if (!$clientId) {
                throw new \Exception("Client imeundwa lakini ID haijapatikana.");
            }

            $client = Client::find($clientId);
            if (!$client) {
                throw new \Exception("Client imeundwa lakini haipatikani kwa ID: $clientId");
            }

            ActivityLogger::log($u['id'], null, 'client_created', null, ['client_id' => $clientId]);

            http_response_code(201);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Client created',
                'data'    => $this->maskPasswords($this->hideUploadedDocuments($client, $u), $u)
            ]);
            exit;

        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success'      => false,
                'message'      => 'Failed to create client',
                'error_detail' => $e->getMessage(),
                'file'         => $e->getFile(),
                'line'         => $e->getLine(),
            ]);
            exit;
        }
    }

    public function update(string $id): void
    {
        try {
            $u = Auth::requireAuth();
            $clientId = (int)$id;
            $existing = Client::find($clientId);
            if (!$existing) {
                Response::error('Client not found', 404);
                return;
            }

            $perms     = $this->permissionsFor($u, $clientId);
            $canEdit   = in_array('edit_clients', $perms, true);
            $canUpload = count(array_intersect($perms, [
                'upload_tra', 'upload_zra', 'upload_bpra', 'upload_zssf'
            ])) > 0;

            if (($u['role'] ?? '') !== 'admin' && !$canEdit && !$canUpload) {
                Response::error('Huna ruhusa ya kubadilisha taarifa hizi', 403);
                return;
            }

            // Admin ana ruhusa kamili
            if (($u['role'] ?? '') === 'admin') {
                $canEdit = true;
                $canUpload = true;
            }

            $data = Request::body();

            foreach (['tra_attachment', 'zra_attachment', 'bpra_attachment', 'zssf_attachment'] as $f) {
                if (isset($data[$f]) && (is_array($data[$f]) && empty($data[$f]) || $data[$f] === '[]')) {
                    unset($data[$f]);
                }
            }

            $data = $this->sanitizeDates($data);

            if (!$canEdit) {
                $textFields = [
                    'company_name', 'location', 'industry', 'contact_person', 'phone', 'email',
                    'financial_year_start', 'contract_start_date', 'contract_end_date',
                    'total_contract_amount', 'amount_paid',
                    'tra_number', 'tra_username', 'tra_reg_date', 'tra_start_date', 'tra_end_date',
                    'zra_number', 'zra_username', 'zra_reg_date', 'zra_start_date', 'zra_end_date',
                    'bpra_number', 'bpra_username', 'bpra_reg_date', 'bpra_start_date', 'bpra_end_date',
                    'zssf_number', 'zssf_username', 'zssf_reg_date', 'zssf_start_date', 'zssf_end_date',
                ];
                foreach ($textFields as $f) {
                    unset($data[$f]);
                }
            }

            foreach (['tra_password', 'zra_password', 'bpra_password', 'zssf_password'] as $pf) {
                if (!$canEdit) {
                    unset($data[$pf]);
                } elseif (array_key_exists($pf, $data) && trim((string)$data[$pf]) === '') {
                    unset($data[$pf]);
                }
            }

            $uploadMap = [
                'tra_attachment'  => 'upload_tra',
                'zra_attachment'  => 'upload_zra',
                'bpra_attachment' => 'upload_bpra',
                'zssf_attachment' => 'upload_zssf',
            ];
            foreach ($uploadMap as $field => $perm) {
                if (($u['role'] ?? '') !== 'admin') {
                    unset($_FILES[$field]);
                }
            }

            $data = $this->handleUploads($data, $existing);

            $hasUpload = false;
            foreach ($uploadMap as $field => $perm) {
                if (isset($_FILES[$field]) && ($_FILES[$field]['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
                    $hasUpload = true;
                    break;
                }
            }

            if (empty($data) && !$hasUpload) {
                Response::error('Hakuna mabadiliko ya kuhifadhi au huna ruhusa', 403);
                return;
            }

            if (!empty($data)) {
                Client::update($clientId, $data);
            }
            $client = Client::find($clientId);

            ActivityLogger::log($u['id'], null, 'client_updated', null, ['client_id' => $clientId]);
            Response::success($this->maskPasswords($this->hideUploadedDocuments($client, $u), $u), 'Client updated');

        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success'      => false,
                'message'      => 'Failed to update client',
                'error_detail' => $e->getMessage(),
                'file'         => $e->getFile(),
                'line'         => $e->getLine(),
            ]);
            exit;
        }
    }

    public function destroy(string $id): void
    {
        try {
            $u = Auth::requireAuth();
            $clientId = (int)$id;

            if (($u['role'] ?? '') !== 'admin') {
                $perms = $this->permissionsFor($u, $clientId);
                if (!in_array('delete_clients', $perms, true)) {
                    // Angalia pia global
                    if (!$this->staffHasPermission($u['id'], 'delete_clients')) {
                        Response::error('Huna ruhusa ya kufuta mteja', 403);
                        return;
                    }
                }
            }

            Client::delete($clientId);
            ActivityLogger::log($u['id'], null, 'client_deleted', null, ['client_id' => $clientId]);
            Response::success(null, 'Client deleted');
        } catch (\Throwable $e) {
            Response::error('Failed to delete client', 500, ['detail' => $e->getMessage()]);
        }
    }

    public function revealPasswords(string $id): void
    {
        try {
            $u = Auth::requireAuth();
            $clientId = (int)$id;

            if (($u['role'] ?? '') !== 'admin') {
                $perms = $this->permissionsFor($u, $clientId);
                if (!in_array('view_passwords', $perms, true)) {
                    Response::error('Huna ruhusa ya kuona password', 403);
                    return;
                }
            }

            $body = Request::body();
            $systemPassword = $body['system_password'] ?? '';

            if (!$systemPassword) {
                Response::error('Password ya mfumo inahitajika', 422);
                return;
            }

            $db = Database::pdo();
            $stmt = $db->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $u['id']]);
            $userRow = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$userRow) {
                Response::error('Mtumiaji hajapatikana kwenye database', 404);
                return;
            }

            $hash = $userRow['password'] ?? $userRow['password_hash'] ?? null;
            if (!$hash) {
                Response::error('Column ya password haipo kwenye table ya users', 500);
                return;
            }

            if (!password_verify($systemPassword, $hash)) {
                Response::error('Password ya mfumo si sahihi', 401);
                return;
            }

            $client = Client::find($clientId);
            if (!$client) {
                Response::error('Client not found', 404);
                return;
            }

            Response::success([
                'tra_password'  => $client['tra_password'],
                'zra_password'  => $client['zra_password'],
                'bpra_password' => $client['bpra_password'],
                'zssf_password' => $client['zssf_password'],
            ]);
        } catch (\Throwable $e) {
            Response::error('Failed to reveal passwords', 500, [
                'detail' => $e->getMessage(),
                'file'   => $e->getFile(),
                'line'   => $e->getLine(),
            ]);
        }
    }

    public function permissions(string $id): void
    {
        Auth::requireAdmin();
        try {
            $db = Database::pdo();
            $stmt = $db->prepare("
                SELECT tp.id, tp.staff_id, tp.role_type, tp.can_view_passwords,
                       tp.can_upload, tp.granted_at,
                       u.name AS staff_name, u.email AS staff_email, u.role AS staff_role
                FROM task_permissions tp
                JOIN users u ON u.id = tp.staff_id
                WHERE tp.client_id = :cid AND tp.revoked_at IS NULL
                ORDER BY tp.granted_at DESC
            ");
            $stmt->execute([':cid' => (int)$id]);
            Response::success($stmt->fetchAll(\PDO::FETCH_ASSOC));
        } catch (\Throwable $e) {
            Response::error('Failed to fetch permissions', 500, ['detail' => $e->getMessage()]);
        }
    }

    public function assignPermissions(string $id): void
    {
        $u = Auth::requireAdmin();
        $db = null;
        try {
            $body = Request::body();
            $clientId = (int)$id;
            $assignments = $body['assignments'] ?? [];
            if (!is_array($assignments)) {
                Response::error('assignments must be an array', 422);
                return;
            }

            $db = Database::pdo();
            $db->beginTransaction();

            $db->prepare("UPDATE task_permissions SET revoked_at = NOW() WHERE client_id = :cid AND revoked_at IS NULL")
               ->execute([':cid' => $clientId]);

            $ins = $db->prepare("
                INSERT INTO task_permissions (client_id, staff_id, role_type, can_view_passwords, can_upload, created_by)
                VALUES (:cid, :sid, :role, CAST(:pw AS JSONB), :upload, :by)
            ");

            foreach ($assignments as $a) {
                $staffId   = (int)($a['staff_id'] ?? 0);
                $role      = $a['role_type'] ?? '';
                $passwords = $a['can_view_passwords'] ?? [];
                $upload    = !empty($a['can_upload']);
                if (!$staffId || !$role) continue;

                $ins->execute([
                    ':cid'    => $clientId,
                    ':sid'    => $staffId,
                    ':role'   => $role,
                    ':pw'     => json_encode(array_values($passwords)),
                    ':upload' => $upload ? 'true' : 'false',
                    ':by'     => $u['id'],
                ]);
            }

            $db->commit();
            ActivityLogger::log($u['id'], null, 'client_permissions_updated', null, ['client_id' => $clientId]);
            Response::success(null, 'Permissions updated');
        } catch (\Throwable $e) {
            if ($db && $db->inTransaction()) $db->rollBack();
            Response::error('Failed to assign permissions', 500, ['detail' => $e->getMessage()]);
        }
    }

    // =========================================================
    // HELPERS
    // =========================================================

    /**
     * Angalia kama staff ana permission fulani (global au client yoyote)
     */
    private function staffHasPermission(int $staffId, string $permission): bool
    {
        try {
            $db = Database::pdo();
            $stmt = $db->prepare("
                SELECT permissions FROM staff_privileges
                WHERE staff_id = :sid
            ");
            $stmt->execute([':sid' => $staffId]);

            foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
                $arr = $row['permissions'];
                if (is_string($arr)) {
                    $decoded = json_decode($arr, true);
                    $arr = is_array($decoded) ? $decoded : [];
                }
                if (is_array($arr) && in_array($permission, $arr, true)) {
                    return true;
                }
            }
        } catch (\Throwable $e) {
            error_log('staffHasPermission error: ' . $e->getMessage());
        }
        return false;
    }

    /**
     * Rudi permissions za user kwa client fulani.
     */
    public function permissionsFor(array $user, int $clientId): array
    {
        if (($user['role'] ?? '') === 'admin') {
            return [
                'edit_clients',
                'view_clients',
                'view_passwords',
                'upload_tra',
                'upload_zra',
                'upload_bpra',
                'upload_zssf',
                'add_clients',
                'delete_clients',
            ];
        }

        $perms = [];
        $db = Database::pdo();

        // 1) task_permissions
        try {
            $stmt = $db->prepare("
                SELECT role_type, can_view_passwords, can_upload
                FROM task_permissions
                WHERE client_id = :cid
                  AND staff_id = :sid
                  AND revoked_at IS NULL
                LIMIT 1
            ");
            $stmt->execute([
                ':cid' => $clientId,
                ':sid' => $user['id'],
            ]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($row) {
                $role = $row['role_type'] ?? '';
                $perms[] = 'view_clients';

                $editRoles = [
                    'editor', 'manager', 'admin',
                    'all_authorities',
                    'tra_annual', 'zra_annual', 'bpra_annual', 'zssf_annual',
                ];
                if (in_array($role, $editRoles, true)) {
                    $perms[] = 'edit_clients';
                }

                if (!empty($row['can_upload'])) {
                    if (in_array($role, ['tra_only', 'tra_annual', 'all_authorities', 'upload_only'], true)) {
                        $perms[] = 'upload_tra';
                    }
                    if (in_array($role, ['zra_only', 'zra_annual', 'all_authorities', 'upload_only'], true)) {
                        $perms[] = 'upload_zra';
                    }
                    if (in_array($role, ['bpra_only', 'bpra_annual', 'all_authorities', 'upload_only'], true)) {
                        $perms[] = 'upload_bpra';
                    }
                    if (in_array($role, ['zssf_only', 'zssf_annual', 'all_authorities', 'upload_only'], true)) {
                        $perms[] = 'upload_zssf';
                    }
                    if (in_array($role, ['all_authorities', 'upload_only'], true)) {
                        $perms = array_merge($perms, ['upload_tra', 'upload_zra', 'upload_bpra', 'upload_zssf']);
                    }
                }

                $pw = $row['can_view_passwords'] ?? '[]';
                if (is_string($pw)) {
                    $decoded = json_decode($pw, true);
                    $pwList = is_array($decoded) ? $decoded : [];
                } else {
                    $pwList = is_array($pw) ? $pw : [];
                }
                if (in_array('all', $pwList, true) || count($pwList) > 0) {
                    $perms[] = 'view_passwords';
                }
            }
        } catch (\Throwable $e) {
            error_log('permissionsFor task_permissions error: ' . $e->getMessage());
        }

        // 2) staff_privileges (client-specific + global)
        try {
            $stmt2 = $db->prepare("
                SELECT permissions
                FROM staff_privileges
                WHERE staff_id = :sid
                  AND (client_id = :cid OR client_id IS NULL)
            ");
            $stmt2->execute([
                ':cid' => $clientId,
                ':sid' => $user['id'],
            ]);

            foreach ($stmt2->fetchAll(\PDO::FETCH_ASSOC) as $p) {
                $arr = $p['permissions'];
                if (is_string($arr)) {
                    $decoded = json_decode($arr, true);
                    $arr = is_array($decoded) ? $decoded : [];
                }
                if (is_array($arr)) {
                    $perms = array_merge($perms, $arr);
                }
            }
        } catch (\Throwable $e) {
            error_log('permissionsFor staff_privileges error: ' . $e->getMessage());
        }

        return array_values(array_unique(array_filter($perms)));
    }

    private function hideUploadedDocuments(array $client, array $user): array
    {
        if (($user['role'] ?? '') !== 'admin') {
            foreach (['tra_attachment', 'zra_attachment', 'bpra_attachment', 'zssf_attachment'] as $field) {
                unset($client[$field]);
            }
        }
        return $client;
    }

    private function maskPasswords(array $c, array $user): array
    {
        foreach (['tra_password', 'zra_password', 'bpra_password', 'zssf_password'] as $f) {
            if (!empty($c[$f])) {
                $c[$f] = '••••••••';
            }
        }
        return $c;
    }

    private function sanitizeDates(array $data): array
    {
        $dateFields = [
            'contract_start_date', 'contract_end_date',
            'tra_reg_date', 'tra_start_date', 'tra_end_date',
            'zra_reg_date', 'zra_start_date', 'zra_end_date',
            'bpra_reg_date', 'bpra_start_date', 'bpra_end_date',
            'zssf_reg_date', 'zssf_start_date', 'zssf_end_date'
        ];
        foreach ($dateFields as $field) {
            if (array_key_exists($field, $data) && trim((string)$data[$field]) === '') {
                $data[$field] = null;
            }
        }
        return $data;
    }

    private function handleUploads(array $data, ?array $existing): array
    {
        $map = [
            'tra_attachment'  => 'tra',
            'zra_attachment'  => 'zra',
            'bpra_attachment' => 'bpra',
            'zssf_attachment' => 'zssf',
        ];
        $allowedExt = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
        $allowedMime = [
            'application/pdf', 'image/jpeg', 'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        $maxSize = 10 * 1024 * 1024;
        $dir = __DIR__ . '/../../storage/uploads/clients/';
        if (!is_dir($dir)) @mkdir($dir, 0775, true);

        foreach ($map as $field => $auth) {
            if (!isset($_FILES[$field]) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) {
                continue;
            }

            $file = $_FILES[$field];

            if (is_array($file['name'])) {
                $file['name']     = $file['name'][0];
                $file['tmp_name'] = $file['tmp_name'][0];
                $file['size']     = $file['size'][0];
                $file['error']    = $file['error'][0];
            }

            if ($file['error'] !== UPLOAD_ERR_OK) {
                Response::error("Upload error on $field", 422);
                return $data;
            }
            if ($file['size'] > $maxSize) {
                Response::error("File too large ($field, max 10MB)", 422);
                return $data;
            }

            $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $mime = mime_content_type($file['tmp_name']) ?: '';
            if (!in_array($ext, $allowedExt, true) || !in_array($mime, $allowedMime, true)) {
                Response::error("File type not allowed ($field)", 422);
                return $data;
            }

            $safe = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($file['name'], PATHINFO_FILENAME));
            $name = "{$auth}_attachment_" . time() . "_{$safe}.{$ext}";
            $dest = $dir . $name;

            if (!move_uploaded_file($file['tmp_name'], $dest)) {
                Response::error("Failed to save $field", 500);
                return $data;
            }

            if (!empty($existing[$field])) {
                $oldPath = $dir . basename($existing[$field]);
                if (is_file($oldPath)) @unlink($oldPath);
            }

            $data[$field] = (string) $name;
        }

        return $data;
    }
}