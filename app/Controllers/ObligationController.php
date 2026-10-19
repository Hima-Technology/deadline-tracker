<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\Obligation;
use App\Services\ActivityLogger;

class ObligationController
{
    public function index(): void
    {
        Auth::requireAuth();
        Response::success(Obligation::all());
    }

    public function byClient(string $clientId): void
    {
        Auth::requireAuth();
        Response::success(Obligation::all(['client_id' => (int)$clientId]));
    }

    public function store(): void
    {
        $u = Auth::requireAdmin();
        $data = Validator::require(Request::body(), ['client_id','title','frequency','due_day']);
        $data['reminder_days'] = json_encode($data['reminder_days'] ?? [30,7,1,0]);
        $ob = Obligation::create($data);
        ActivityLogger::log($u['id'], null, 'obligation_created', null, ['obligation_id' => $ob['id']]);
        Response::success($ob, 'Obligation created', 201);
    }

    public function update(string $id): void
    {
        $u = Auth::requireAdmin();
        $data = Request::body();
        if (isset($data['reminder_days']) && is_array($data['reminder_days'])) {
            $data['reminder_days'] = json_encode($data['reminder_days']);
        }
        $ob = Obligation::update((int)$id, $data);
        if (!$ob) Response::error('Obligation not found', 404);
        ActivityLogger::log($u['id'], null, 'obligation_updated', null, ['obligation_id' => $id]);
        Response::success($ob, 'Obligation updated');
    }

    public function destroy(string $id): void
    {
        $u = Auth::requireAdmin();
        Obligation::delete((int)$id);
        ActivityLogger::log($u['id'], null, 'obligation_deleted', null, ['obligation_id' => $id]);
        Response::success(null, 'Obligation deleted');
    }
}