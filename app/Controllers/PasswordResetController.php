<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\User;
use App\Core\Database;
use App\Services\EmailService;

class PasswordResetController
{
    // 1. Tuma barua pepe ya reset
    public function forgot(): void
    {
        try {
            $data = Request::body();
            $email = $data['email'] ?? '';
            if (!$email) Response::error('Email is required', 422);

            $user = User::findByEmail($email);
            if (!$user) Response::error('Email not found in our system', 404);

            // Tengeneza token ya kipekee
            $token = bin2hex(random_bytes(32));
            $expiry = date('Y-m-d H:i:s', strtotime('+15 minutes')); // Inaisha baada ya dakika 15

            // Hifadhi kwenye database
            $stmt = Database::pdo()->prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?');
            $stmt->execute([$token, $expiry, $user['id']]);

            // Tuma Email
            $resetLink = "http://localhost:5173/reset-password?token=" . $token;
            $subject = "Password Reset Request - SBC Deadline Tracker";
            $body = "
                <h2>Hello {$user['name']},</h2>
                <p>You requested to reset your password. Click the link below to set a new password:</p>
                <p><a href='{$resetLink}' style='padding:10px 20px; background:#06b6d4; color:white; text-decoration:none; border-radius:5px;'>Reset Password</a></p>
                <p>Or copy this link: <br> {$resetLink}</p>
                <p>This link will expire in 15 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            ";

            $result = EmailService::send($email, $subject, $body);
            if (!$result['ok']) {
                Response::error('Failed to send email', 500, ['detail' => $result['response']]);
            }

            Response::success(null, 'Password reset link sent to your email');
        } catch (\Throwable $e) {
            Response::error('Server error', 500, ['detail' => $e->getMessage()]);
        }
    }

    // 2. Reset password kwa kutumia token
    public function reset(): void
    {
        try {
            $data = Request::body();
            $token = $data['token'] ?? '';
            $newPassword = $data['password'] ?? '';

            if (!$token || !$newPassword) Response::error('Token and new password are required', 422);
            if (strlen($newPassword) < 8) Response::error('Password must be at least 8 characters', 422);

            $stmt = Database::pdo()->prepare('SELECT * FROM users WHERE reset_token = ? LIMIT 1');
            $stmt->execute([$token]);
            $user = $stmt->fetch();

            if (!$user) Response::error('Invalid or expired token', 400);

            // Angalia kama muda haujaisha
            if (strtotime($user['reset_token_expiry']) < time()) {
                Response::error('Token has expired', 400);
            }

            // Sasisha password
            $hash = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = Database::pdo()->prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?');
            $stmt->execute([$hash, $user['id']]);

            Response::success(null, 'Password reset successful. You can now login.');
        } catch (\Throwable $e) {
            Response::error('Server error', 500, ['detail' => $e->getMessage()]);
        }
    }
}