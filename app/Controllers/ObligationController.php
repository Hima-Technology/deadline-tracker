<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Models\Client;
use App\Models\Obligation;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\ReminderService;

class ObligationController
{
    public function index(): void
    {
        $user = Auth::requireAuth();
        $obligations = Obligation::all();
        if (($user['role'] ?? '') !== 'admin') {
            $clientController = new ClientController();
            $permissionsByClient = [];
            $obligations = array_values(array_filter(
                $obligations,
                function (array $obligation) use ($clientController, $user, &$permissionsByClient): bool {
                    $clientId = (int)$obligation['client_id'];
                    if (!array_key_exists($clientId, $permissionsByClient)) {
                        $permissionsByClient[$clientId] = $clientController->permissionsFor($user, $clientId);
                    }
                    return in_array('assign_tasks', $permissionsByClient[$clientId], true);
                }
            ));
        }
        Response::success($obligations);
    }

    public function byClient(string $clientId): void
    {
        $user = Auth::requireAuth();
        $clientId = (int)$clientId;
        $this->requireAssignmentPermission($user, $clientId);
        Response::success(Obligation::all(['client_id' => $clientId]));
    }

    public function staffOptions(string $clientId): void
    {
        $user = Auth::requireAuth();
        $clientId = (int)$clientId;
        if (!Client::find($clientId)) Response::error('Client not found', 404);
        $this->requireAssignmentPermission($user, $clientId);
        Response::success(User::activeStaff());
    }

    public function store(): void
    {
        try {
            $u = Auth::requireAuth();
            $data = $this->validatedData(Request::body());
            $this->requireValidClient((int)$data['client_id']);
            $this->requireAssignmentPermission($u, (int)$data['client_id']);
            if (($u['role'] ?? '') !== 'admin') {
                $this->requireValidStaff((int)$data['default_staff_id']);
            }
            $data['reminder_days'] = json_encode($data['reminder_days'] ?? [5,1,0]);
            
            $ob = Obligation::create($data);

            // Tengeneza Closing na Tuma Taarifa (Reminders) papo hapo
            if (!empty($data['default_staff_id'])) {
                ReminderService::generateClosings(); // Tengeneza kazi
                ReminderService::sendReminders();    // Tuma Email/WhatsApp
            }

            ActivityLogger::log($u['id'], null, 'obligation_created', null, ['obligation_id' => $ob['id']]);
            Response::success($ob, 'Obligation created', 201);
        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create obligation',
                'error_detail' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            exit;
        }
    }

    public function update(string $id): void
    {
        try {
            $u = Auth::requireAuth();
            $existing = Obligation::find((int)$id);
            if (!$existing) Response::error('Obligation not found', 404);
            $data = $this->validatedData(Request::body());
            $this->requireValidClient((int)$data['client_id']);
            $this->requireAssignmentPermission($u, (int)$existing['client_id']);
            $this->requireAssignmentPermission($u, (int)$data['client_id']);
            if (($u['role'] ?? '') !== 'admin') {
                $this->requireValidStaff((int)$data['default_staff_id']);
            }
            $data['reminder_days'] = json_encode($data['reminder_days']);
            $ob = Obligation::update((int)$id, $data);
            if (!$ob) Response::error('Obligation not found', 404);

            // Kama Staff amebadilishwa, tengeneza Closing na Tuma Taarifa
            if (isset($data['default_staff_id'])) {
                ReminderService::generateClosings();
                ReminderService::sendReminders();
            }

            ActivityLogger::log($u['id'], null, 'obligation_updated', null, ['obligation_id' => $id]);
            Response::success($ob, 'Obligation updated');
        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update obligation',
                'error_detail' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            exit;
        }
    }

    public function destroy(string $id): void
    {
        $u = Auth::requireAuth();
        $obligation = Obligation::find((int)$id);
        if (!$obligation) Response::error('Obligation not found', 404);
        $this->requireAssignmentPermission($u, (int)$obligation['client_id']);
        Obligation::delete((int)$id);
        ActivityLogger::log($u['id'], null, 'obligation_deleted', null, ['obligation_id' => $id]);
        Response::success(null, 'Obligation deleted');
    }

    private function requireAssignmentPermission(array $user, int $clientId): void
    {
        if (($user['role'] ?? '') === 'admin') return;

        $permissions = (new ClientController())->permissionsFor($user, $clientId);
        if (!in_array('assign_tasks', $permissions, true)) {
            Response::error('You do not have permission to assign tasks for this client', 403);
        }
    }

    private function requireValidStaff(int $staffId): void
    {
        foreach (User::activeStaff() as $staff) {
            if ((int)$staff['id'] === $staffId) return;
        }
        Response::error('Active staff member not found', 404);
    }

    private function requireValidClient(int $clientId): void
    {
        if (!Client::find($clientId)) {
            Response::error('Client not found', 404);
        }
    }

    private function validatedData(array $data): array
    {
        $required = ['client_id', 'title', 'frequency', 'due_day', 'default_staff_id', 'authority', 'document_type', 'confirmed_due_date'];
        $errors = [];
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                $errors[$field] = "{$field} is required";
            }
        }

        if (isset($data['client_id']) && (int)$data['client_id'] < 1) {
            $errors['client_id'] = 'Select a client';
        }
        if (isset($data['default_staff_id']) && (int)$data['default_staff_id'] < 1) {
            $errors['default_staff_id'] = 'Select a staff member';
        }
        if (isset($data['title']) && trim((string)$data['title']) === '') {
            $errors['title'] = 'Task name is required';
        }
        if (isset($data['document_type']) && trim((string)$data['document_type']) === '') {
            $errors['document_type'] = 'Document type is required';
        }
        if (isset($data['frequency']) && !in_array($data['frequency'], ['monthly', 'quarterly', 'annual', 'one_off'], true)) {
            $errors['frequency'] = 'Invalid frequency';
        }
        if (isset($data['authority']) && !in_array($data['authority'], ['TRA', 'ZRA', 'BPRA', 'ZSSF', 'ALL', 'TWO'], true)) {
            $errors['authority'] = 'Invalid authority';
        }
        if (isset($data['due_day']) && ((int)$data['due_day'] < 1 || (int)$data['due_day'] > 31)) {
            $errors['due_day'] = 'Due day must be between 1 and 31';
        }

        $date = $data['confirmed_due_date'] ?? '';
        $parsedDate = is_string($date) ? \DateTime::createFromFormat('!Y-m-d', $date) : false;
        if (!$parsedDate || $parsedDate->format('Y-m-d') !== $date) {
            $errors['confirmed_due_date'] = 'Select a valid due date';
        }

        if (!isset($data['reminder_days']) || !is_array($data['reminder_days']) || !$data['reminder_days']) {
            $errors['reminder_days'] = 'Select at least one reminder';
        } elseif (count(array_filter($data['reminder_days'], static fn($day): bool => !is_numeric($day) || (int)$day < 0 || (int)$day > 365)) > 0) {
            $errors['reminder_days'] = 'Reminder days must be between 0 and 365';
        }

        if ($errors) {
            Response::error('Validation failed', 422, $errors);
        }

        $data['title'] = trim((string)$data['title']);
        $data['document_type'] = trim((string)$data['document_type']);
        $data['instructions'] = trim((string)($data['instructions'] ?? ''));
        $data['requires_upload'] = filter_var($data['requires_upload'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $data['reminder_days'] = array_values(array_unique(array_map('intval', $data['reminder_days'])));
        return $data;
    }
}