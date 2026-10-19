<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\User;
use App\Services\ActivityLogger;

class AuthController
{
    public function login(): void
    {
        try {
            $data = Validator::require(Request::body(), ['email', 'password']);
            $user = User::findByEmail($data['email']);

            if (!$user || !password_verify($data['password'], $user['password_hash'])) {
                Response::error('Invalid credentials', 401);
            }
            if (!$user['is_active']) Response::error('Account disabled', 403);

            // Hapa tunaweka last_login_at ikiwa ni string, lakini BaseModel yetu sasa inashughulikia hili
            // Kama bado kuna shida, tunaweza kuiondoa kabisa kwa muda
            // User::update($user['id'], ['last_login_at' => date('Y-m-d H:i:s')]);
            
            $token = Auth::issueToken($user);
            unset($user['password_hash']);
            
            // Safisha is_active ili React isome true/false
            $user['is_active'] = ($user['is_active'] === true || $user['is_active'] === 't' || $user['is_active'] == 1);

            ActivityLogger::log($user['id'], null, 'login');

            Response::success([
                'token' => $token,
                'user'  => $user,
            ], 'Login successful');

        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Login Failed',
                'error_detail' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            exit;
        }
    }

    public function me(): void
    {
        try {
            $u = Auth::requireAuth();
            $u['is_active'] = ($u['is_active'] === true || $u['is_active'] === 't' || $u['is_active'] == 1);
            Response::success($u);
        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Failed to get user',
                'error_detail' => $e->getMessage()
            ]);
            exit;
        }
    }

    public function changePassword(): void
    {
        $u = Auth::requireAuth();
        $data = Validator::require(Request::body(), ['current_password', 'new_password']);

        $full = User::find($u['id']);
        if (!password_verify($data['current_password'], $full['password_hash'])) {
            Response::error('Current password is incorrect', 422);
        }
        if (strlen($data['new_password']) < 8) {
            Response::error('New password must be at least 8 characters', 422);
        }
        User::update($u['id'], [
            'password_hash' => password_hash($data['new_password'], PASSWORD_BCRYPT)
        ]);
        ActivityLogger::log($u['id'], null, 'password_changed');
        Response::success(null, 'Password changed');
    }
}