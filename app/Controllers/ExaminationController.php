<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;

class ExaminationController
{
    private const EXAM_TYPES = ['principal', 'penalties', 'interest'];
    private const FREQUENCIES = ['monthly', 'annual', 'quarterly', 'one_off'];

    public function index(): void
    {
        Auth::requireAdmin();
        $stmt = Database::pdo()->query(
            'SELECT e.*, c.company_name
             FROM examinations e
             JOIN clients c ON c.id = e.client_id
             ORDER BY e.exam_date DESC, e.id DESC'
        );
        Response::success($stmt->fetchAll());
    }

    public function store(): void
    {
        $admin = Auth::requireAdmin();
        $data = $this->validatedData(Request::body());
        $attachmentPath = $this->saveAttachment();

        try {
            $stmt = Database::pdo()->prepare(
                'INSERT INTO examinations (client_id, exam_type, frequency, exam_date, attachment_path, fee_amount, fee_paid, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 RETURNING id'
            );
            $stmt->execute([
                $data['client_id'],
                $data['exam_type'],
                $data['frequency'],
                $data['exam_date'],
                $attachmentPath,
                $data['fee_amount'],
                $data['fee_paid'],
                $admin['id'],
            ]);
            Response::success($this->find((int) $stmt->fetchColumn()), 'Examination saved', 201);
        } catch (\Throwable $e) {
            $this->removeAttachment($attachmentPath);
            throw $e;
        }
    }

    public function update(string $id): void
    {
        Auth::requireAdmin();
        $existing = $this->find((int) $id);
        if (!$existing) Response::error('Examination not found', 404);

        $data = $this->validatedData(Request::body());
        $newAttachmentPath = $this->saveAttachment();
        $attachmentPath = $newAttachmentPath ?? $existing['attachment_path'];

        $stmt = Database::pdo()->prepare(
            'UPDATE examinations
             SET client_id = ?, exam_type = ?, frequency = ?, exam_date = ?,
                 attachment_path = ?, fee_amount = ?, fee_paid = ?, updated_at = NOW()
             WHERE id = ?'
        );
        try {
            $stmt->execute([
                $data['client_id'],
                $data['exam_type'],
                $data['frequency'],
                $data['exam_date'],
                $attachmentPath,
                $data['fee_amount'],
                $data['fee_paid'],
                (int) $id,
            ]);
        } catch (\Throwable $e) {
            if ($newAttachmentPath !== null) $this->removeAttachment($newAttachmentPath);
            throw $e;
        }

        if ($newAttachmentPath !== null) {
            $this->removeAttachment($existing['attachment_path']);
        }
        Response::success($this->find((int) $id), 'Examination updated');
    }

    public function destroy(string $id): void
    {
        Auth::requireAdmin();
        $existing = $this->find((int) $id);
        if (!$existing) Response::error('Examination not found', 404);

        $stmt = Database::pdo()->prepare('DELETE FROM examinations WHERE id = ?');
        $stmt->execute([(int) $id]);
        $this->removeAttachment($existing['attachment_path']);
        Response::success(null, 'Examination deleted');
    }

    private function validatedData(array $input): array
    {
        $clientId = filter_var($input['client_id'] ?? null, FILTER_VALIDATE_INT);
        if (!$clientId || $clientId < 1) Response::error('Select a client', 422);

        $examType = $input['exam_type'] ?? '';
        if (!in_array($examType, self::EXAM_TYPES, true)) Response::error('Select a valid examination type', 422);

        $frequency = $input['frequency'] ?? '';
        if (!in_array($frequency, self::FREQUENCIES, true)) Response::error('Select a valid payment frequency', 422);

        $examDate = $input['exam_date'] ?? '';
        $parsedDate = \DateTime::createFromFormat('!Y-m-d', $examDate);
        if (!$parsedDate || $parsedDate->format('Y-m-d') !== $examDate) {
            Response::error('Select a valid examination date', 422);
        }

        $client = Database::pdo()->prepare('SELECT 1 FROM clients WHERE id = ?');
        $client->execute([$clientId]);
        if (!$client->fetchColumn()) Response::error('Client not found', 404);

        $feeAmount = 0.0;
        $feePaid = false;
        if ($examType === 'penalties') {
            $rawFee = $input['fee_amount'] ?? '0';
            if (!is_numeric($rawFee) || (float) $rawFee < 0 || (float) $rawFee > 999999999999.99) {
                Response::error('Enter a valid non-negative penalty fee', 422);
            }
            $feeAmount = round((float) $rawFee, 2);

            $rawPaid = $input['fee_paid'] ?? false;
            $feePaid = in_array($rawPaid, [true, 1, '1', 'true', 'on'], true);
            if ($feePaid && $feeAmount <= 0) {
                Response::error('A penalty fee is required before marking it paid', 422);
            }
        }

        return [
            'client_id' => $clientId,
            'exam_type' => $examType,
            'frequency' => $frequency,
            'exam_date' => $examDate,
            'fee_amount' => $feeAmount,
            'fee_paid' => $feePaid ? 'true' : 'false',
        ];
    }

    private function saveAttachment(): ?string
    {
        if (!isset($_FILES['attachment']) || $_FILES['attachment']['error'] === UPLOAD_ERR_NO_FILE) {
            return null;
        }

        $file = $_FILES['attachment'];
        if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
            Response::error('Examination attachment upload failed', 422);
        }
        if ($file['size'] > 10 * 1024 * 1024) Response::error('Attachment must be 10MB or smaller', 422);

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
            Response::error('Attachment must be a PDF, image, or Word document', 422);
        }

        $relativeDir = 'examinations/' . date('Y/m');
        $directory = __DIR__ . '/../../storage/uploads/' . $relativeDir;
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            Response::error('Could not create attachment storage directory', 500);
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        if (!move_uploaded_file($file['tmp_name'], $directory . '/' . $filename)) {
            Response::error('Could not save examination attachment', 500);
        }
        return 'uploads/' . $relativeDir . '/' . $filename;
    }

    private function find(int $id): ?array
    {
        $stmt = Database::pdo()->prepare(
            'SELECT e.*, c.company_name
             FROM examinations e
             JOIN clients c ON c.id = e.client_id
             WHERE e.id = ?'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    private function removeAttachment(?string $relativePath): void
    {
        if (!$relativePath) return;
        $base = realpath(__DIR__ . '/../../storage/uploads/examinations');
        $path = realpath(__DIR__ . '/../../storage/' . $relativePath);
        if ($base && $path && str_starts_with($path, $base . DIRECTORY_SEPARATOR) && is_file($path)) {
            unlink($path);
        }
    }
}
