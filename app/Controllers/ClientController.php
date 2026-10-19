<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Models\Client;
use App\Services\ActivityLogger;

class ClientController
{
    public function index(): void
    {
        try {
            Auth::requireAuth();
            $clients = Client::all([], 'company_name ASC');
            Response::success($clients);
        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch clients',
                'error_detail' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            exit;
        }
    }

    public function show(string $id): void
    {
        try {
            Auth::requireAuth();
            $c = Client::find((int)$id);
            if (!$c) Response::error('Client not found', 404);
            Response::success($c);
        } catch (\Throwable $e) {
            Response::error('Failed to fetch client', 500, ['detail' => $e->getMessage()]);
        }
    }

    public function store(): void
    {
        $u = Auth::requireAdmin();
        $data = Request::body();
        $data['created_by'] = $u['id'];
        
        try {
            $client = Client::create($data);
            ActivityLogger::log($u['id'], null, 'client_created', null, ['client_id' => $client['id']]);
            Response::success($client, 'Client created', 201);
        } catch (\Throwable $e) {
            Response::error('Failed to create client', 500, ['detail' => $e->getMessage()]);
        }
    }

    public function update(string $id): void
    {
        $u = Auth::requireAdmin();
        try {
            $client = Client::update((int)$id, Request::body());
            if (!$client) Response::error('Client not found', 404);
            ActivityLogger::log($u['id'], null, 'client_updated', null, ['client_id' => $id]);
            Response::success($client, 'Client updated');
        } catch (\Throwable $e) {
            Response::error('Failed to update client', 500, ['detail' => $e->getMessage()]);
        }
    }

    public function destroy(string $id): void
    {
        $u = Auth::requireAdmin();
        try {
            Client::delete((int)$id);
            ActivityLogger::log($u['id'], null, 'client_deleted', null, ['client_id' => $id]);
            Response::success(null, 'Client deleted');
        } catch (\Throwable $e) {
            Response::error('Failed to delete client', 500, ['detail' => $e->getMessage()]);
        }
    }
}