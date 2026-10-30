<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\User;
use App\Services\ActivityLogger;

class UserController
{
    public function index(): void
    {
        Auth::requireAdmin();
        Response::success(User::staff());
    }

    public function show(string $id): void
    {
        Auth::requireAdmin();
        $u = User::find((int)$id);
        if (!$u) Response::error('User not found', 404);
        unset($u['password_hash']);
        Response::success($u);
    }

    public function store(): void
    {
        $admin = Auth::requireAdmin();
        $data = Validator::require(Request::body(), ['name','email','password','role']);
        
        // RUHUSU AUDITOR PIA
        if (!in_array($data['role'], ['admin','staff','auditor'])) {
            Response::error('Invalid role', 422);
        }
        
        if (User::findByEmail($data['email'])) Response::error('Email already exists', 409);
        if (strlen($data['password']) < 8) Response::error('Password too short', 422);

        $user = User::create([
            'name'          => $data['name'],
            'email'         => $data['email'],
            'phone'         => $data['phone'] ?? null,
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
            'role'          => $data['role'],
            'is_active'     => true,
        ]);
        unset($user['password_hash']);
        ActivityLogger::log($admin['id'], null, 'user_created', null, ['user_id' => $user['id']]);
        Response::success($user, 'User created', 201);
    }

    public function update(string $id): void
    {
        $admin = Auth::requireAdmin();
        $data = Request::body();
        $user = User::find((int)$id);
        if (!$user) Response::error('User not found', 404);

        $patch = [];
        foreach (['name','phone','role','is_active'] as $f) {
            if (isset($data[$f])) $patch[$f] = $data[$f];
        }
        if (!empty($data['password'])) {
            if (strlen($data['password']) < 8) Response::error('Password too short', 422);
            $patch['password_hash'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }
        $updated = User::update((int)$id, $patch);
        unset($updated['password_hash']);
        ActivityLogger::log($admin['id'], null, 'user_updated', null, ['user_id' => $id]);
        Response::success($updated, 'User updated');
    }

    public function destroy(string $id): void
    {
        $admin = Auth::requireAdmin();
        if ((int)$id === (int)$admin['id']) Response::error('Cannot delete yourself', 422);
        User::delete((int)$id);
        ActivityLogger::log($admin['id'], null, 'user_deleted', null, ['user_id' => $id]);
        Response::success(null, 'User deleted');
    }

    // ==========================================
    // METHODS MPYA KWA AJILI YA PROFILE NA PASSWORD
    // ==========================================

    public function updateProfile(): void
    {
        $u = Auth::requireAuth();
        $data = Request::body();

        $patch = [];
        if (isset($data['name'])) $patch['name'] = $data['name'];
        if (isset($data['phone'])) $patch['phone'] = $data['phone'];
        
        if (isset($data['email'])) {
            $existing = User::findByEmail($data['email']);
            if ($existing && (int)$existing['id'] !== (int)$u['id']) {
                Response::error('Email is already in use by another user', 409);
            }
            $patch['email'] = $data['email'];
        }

        if (empty($patch)) Response::error('No data to update', 422);

        $updated = User::update((int)$u['id'], $patch);
        unset($updated['password_hash']);
        Response::success($updated, 'Profile updated successfully');
    }

    public function changeMyPassword(): void
    {
        $u = Auth::requireAuth();
        $data = Validator::require(Request::body(), ['current_password', 'new_password']);

        $full = User::find((int)$u['id']);
        if (!password_verify($data['current_password'], $full['password_hash'])) {
            Response::error('Current password is incorrect', 422);
        }
        if (strlen($data['new_password']) < 8) {
            Response::error('New password must be at least 8 characters', 422);
        }

        User::update((int)$u['id'], [
            'password_hash' => password_hash($data['new_password'], PASSWORD_BCRYPT)
        ]);
        Response::success(null, 'Password changed successfully');
    }
}