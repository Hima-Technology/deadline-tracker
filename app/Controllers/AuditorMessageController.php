<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

class AuditorMessageController
{
    public function index(): void
    {
        $user = Auth::requireAuth();
        $db = Database::pdo();

        if ($user['role'] === 'admin') {
            $auditorId = (int) ($_GET['auditor_id'] ?? 0);
            $auditors = $db->query(
                "SELECT id, name, email FROM users
                 WHERE role = 'auditor' AND is_active = true
                 ORDER BY name"
            )->fetchAll(\PDO::FETCH_ASSOC);

            if ($auditorId > 0 && !in_array($auditorId, array_map(
                static fn(array $auditor): int => (int) $auditor['id'],
                $auditors
            ), true)) {
                Response::error('Active auditor not found', 404);
            }
        } elseif ($user['role'] === 'auditor') {
            $auditorId = (int) $user['id'];
            $auditors = [];
        } else {
            Response::error('Only admins and auditors can access messages', 403);
        }

        $messages = [];
        if ($auditorId > 0) {
            $stmt = $db->prepare(
                'SELECT id, auditor_id, sender_role, sender_name, message, created_at
                 FROM auditor_messages
                 WHERE auditor_id = ?
                 ORDER BY created_at, id'
            );
            $stmt->execute([$auditorId]);
            $messages = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }

        Response::success(['auditors' => $auditors, 'messages' => $messages]);
    }

    public function store(): void
    {
        $user = Auth::requireAuth();
        if (!in_array($user['role'], ['admin', 'auditor'], true)) {
            Response::error('Only admins and auditors can send messages', 403);
        }

        $body = Request::body();
        $message = trim((string) ($body['message'] ?? ''));
        if ($message === '') Response::error('Message cannot be empty', 422);
        if (mb_strlen($message) > 5000) Response::error('Message must be 5000 characters or fewer', 422);

        $db = Database::pdo();
        if ($user['role'] === 'admin') {
            $auditorId = (int) ($body['auditor_id'] ?? 0);
            $stmt = $db->prepare(
                "SELECT id FROM users WHERE id = ? AND role = 'auditor' AND is_active = true"
            );
            $stmt->execute([$auditorId]);
            if (!$stmt->fetchColumn()) Response::error('Select an active auditor', 422);
        } else {
            $auditorId = (int) $user['id'];
        }

        $stmt = $db->prepare(
            'INSERT INTO auditor_messages (auditor_id, sender_id, sender_role, sender_name, message)
             VALUES (?, ?, ?, ?, ?)
             RETURNING id, auditor_id, sender_role, sender_name, message, created_at'
        );
        $stmt->execute([$auditorId, $user['id'], $user['role'], $user['name'], $message]);
        Response::success($stmt->fetch(\PDO::FETCH_ASSOC), 'Message sent', 201);
    }
}
