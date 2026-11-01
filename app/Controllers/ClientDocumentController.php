<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Models\Client;

class ClientDocumentController
{
    private const AUTHORITIES = ['TRA', 'ZRA', 'BPRA', 'ZSSF'];

    public function index(string $clientId): void
    {
        $user = Auth::requireAuth();
        $clientId = (int) $clientId;
        if (!Client::find($clientId)) Response::error('Client not found', 404);

        $documents = $this->fetchClientDocuments($clientId, $user);
        Response::success($documents);
    }

    public function auditorDocuments(): void
    {
        Auth::requireAdmin();
        $stmt = Database::pdo()->query(
            'SELECT d.id, d.client_id, d.authority, d.original_name, d.feedback, d.feedback_at,
                    d.created_at, c.company_name, COALESCE(uploader.name, d.uploader_name) AS uploader_name,
                    reviewer.name AS feedback_by_name
             FROM client_documents d
             JOIN clients c ON c.id = d.client_id
             LEFT JOIN users uploader ON uploader.id = d.uploaded_by
             LEFT JOIN users reviewer ON reviewer.id = d.feedback_by
             WHERE d.uploader_role = \'auditor\'
             ORDER BY d.created_at DESC, d.id DESC'
        );
        Response::success($stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    public function store(string $clientId): void
    {
        $user = Auth::requireAuth();
        $clientId = (int) $clientId;
        if (!in_array($user['role'] ?? '', ['staff', 'auditor'], true)) {
            Response::error('Only staff and auditors can upload work documents', 403);
        }
        if (!Client::find($clientId)) Response::error('Client not found', 404);

        $authority = strtoupper((string) ($_POST['authority'] ?? ''));
        if (!in_array($authority, self::AUTHORITIES, true)) {
            Response::error('Select a valid institution', 422);
        }
        if (!$this->hasUploadPermission($user, $clientId, $authority)) {
            Response::error('You do not have permission to upload documents for this institution', 403);
        }

        $file = $_FILES['document'] ?? null;
        if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            Response::error('Choose a document to upload', 422);
        }
        if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
            Response::error('Document upload failed', 422);
        }
        if ($file['size'] > 10 * 1024 * 1024) Response::error('Document must be 10MB or smaller', 422);

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedTypes = [
            'pdf' => ['application/pdf'],
            'jpg' => ['image/jpeg'],
            'jpeg' => ['image/jpeg'],
            'png' => ['image/png'],
            'doc' => ['application/msword', 'application/vnd.ms-office'],
            'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        ];
        $mime = mime_content_type($file['tmp_name']) ?: '';
        if (!isset($allowedTypes[$extension]) || !in_array($mime, $allowedTypes[$extension], true)) {
            Response::error('Document must be a PDF, image, or Word file', 422);
        }

        $role = $user['role'];
        $relativeDirectory = 'uploads/client-documents/' . $role . '/' . date('Y/m');
        $directory = __DIR__ . '/../../storage/' . $relativeDirectory;
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            Response::error('Could not create document storage directory', 500);
        }

        $fileName = bin2hex(random_bytes(16)) . '.' . $extension;
        $destination = $directory . '/' . $fileName;
        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            Response::error('Could not save uploaded document', 500);
        }

        $relativePath = $relativeDirectory . '/' . $fileName;
        try {
            $stmt = Database::pdo()->prepare(
                'INSERT INTO client_documents
                    (client_id, uploaded_by, uploader_name, uploader_role, authority, original_name, file_path)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 RETURNING id'
            );
            $stmt->execute([
                $clientId,
                $user['id'],
                $user['name'],
                $role,
                $authority,
                basename($file['name']),
                $relativePath,
            ]);
            Response::success(
                $this->fetchDocument((int) $stmt->fetchColumn(), $user),
                'Document uploaded',
                201
            );
        } catch (\Throwable $e) {
            if (is_file($destination)) unlink($destination);
            throw $e;
        }
    }

    public function download(string $id): void
    {
        $user = Auth::requireAuth();
        $document = $this->findDocument((int) $id);
        if (!$document || !$this->canViewDocument($user, $document)) {
            Response::error('Document not found', 404);
        }

        $storageRoot = realpath(__DIR__ . '/../../storage');
        $filePath = realpath(__DIR__ . '/../../storage/' . $document['file_path']);
        if (!$storageRoot || !$filePath || !str_starts_with($filePath, $storageRoot . DIRECTORY_SEPARATOR) || !is_file($filePath)) {
            Response::error('Document file not found', 404);
        }

        $safeName = str_replace(["\r", "\n", '"'], '', basename($document['original_name']));
        header('Content-Type: ' . (mime_content_type($filePath) ?: 'application/octet-stream'));
        header('Content-Length: ' . filesize($filePath));
        header('Content-Disposition: inline; filename="' . $safeName . '"');
        header('X-Content-Type-Options: nosniff');
        readfile($filePath);
        exit;
    }

    public function feedback(string $id): void
    {
        $user = Auth::requireAdmin();
        $document = $this->findDocument((int) $id);
        if (!$document || $document['uploader_role'] !== 'auditor') {
            Response::error('Auditor document not found', 404);
        }

        $feedback = trim((string) (Request::body()['feedback'] ?? ''));
        if (mb_strlen($feedback) > 5000) Response::error('Feedback must be 5000 characters or fewer', 422);

        $stmt = Database::pdo()->prepare(
            'UPDATE client_documents
             SET feedback = ?, feedback_by = ?, feedback_at = NOW()
             WHERE id = ?
             RETURNING id'
        );
        $stmt->execute([$feedback, $user['id'], (int) $id]);
        Response::success($this->fetchDocument((int) $id, $user), 'Auditor feedback saved');
    }

    public function destroyAuditorDocument(string $id): void
    {
        Auth::requireAdmin();
        $document = $this->findDocument((int) $id);
        if (!$document || $document['uploader_role'] !== 'auditor') {
            Response::error('Auditor document not found', 404);
        }

        $storageRoot = realpath(__DIR__ . '/../../storage');
        $filePath = realpath(__DIR__ . '/../../storage/' . $document['file_path']);
        if ($filePath && (!$storageRoot || !str_starts_with($filePath, $storageRoot . DIRECTORY_SEPARATOR))) {
            Response::error('Document file path is invalid', 500);
        }

        $pdo = Database::pdo();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'DELETE FROM client_documents WHERE id = ? AND uploader_role = ?'
            );
            $stmt->execute([(int) $id, 'auditor']);
            if ($stmt->rowCount() !== 1) {
                $pdo->rollBack();
                Response::error('Auditor document not found', 404);
            }
            $pdo->commit();
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }

        if ($filePath && is_file($filePath) && !unlink($filePath)) {
            Response::error('Document record deleted, but the stored file could not be removed', 500);
        }
        Response::success(null, 'Auditor document deleted');
    }

    private function fetchClientDocuments(int $clientId, array $user): array
    {
        $stmt = Database::pdo()->prepare(
            'SELECT d.*, COALESCE(uploader.name, d.uploader_name) AS uploader_name, reviewer.name AS feedback_by_name
             FROM client_documents d
             LEFT JOIN users uploader ON uploader.id = d.uploaded_by
             LEFT JOIN users reviewer ON reviewer.id = d.feedback_by
             WHERE d.client_id = ?
             ORDER BY d.created_at DESC, d.id DESC'
        );
        $stmt->execute([$clientId]);
        return array_values(array_filter(
            $stmt->fetchAll(\PDO::FETCH_ASSOC),
            fn(array $document): bool => $this->canViewDocument($user, $document)
        ));
    }

    private function findDocument(int $id): ?array
    {
        $stmt = Database::pdo()->prepare(
            'SELECT d.*, c.company_name, COALESCE(uploader.name, d.uploader_name) AS uploader_name, reviewer.name AS feedback_by_name
             FROM client_documents d
             JOIN clients c ON c.id = d.client_id
             LEFT JOIN users uploader ON uploader.id = d.uploaded_by
             LEFT JOIN users reviewer ON reviewer.id = d.feedback_by
             WHERE d.id = ?'
        );
        $stmt->execute([$id]);
        $document = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $document ?: null;
    }

    private function fetchDocument(int $id, array $user): ?array
    {
        $document = $this->findDocument($id);
        return $document && $this->canViewDocument($user, $document) ? $document : null;
    }

    private function canViewDocument(array $user, array $document): bool
    {
        if (($user['role'] ?? '') === 'admin') {
            return $document['uploader_role'] === 'auditor';
        }
        return ($user['role'] ?? '') === $document['uploader_role']
            && $this->hasUploadPermission($user, (int) $document['client_id'], $document['authority']);
    }

    private function hasUploadPermission(array $user, int $clientId, string $authority): bool
    {
        $permissions = (new ClientController())->permissionsFor($user, $clientId);
        return in_array('upload_' . strtolower($authority), $permissions, true);
    }
}
