<?php
use App\Core\Router;
use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Controllers\ClientController;
use App\Controllers\ObligationController;
use App\Controllers\ClosingController;
use App\Controllers\DashboardController;
use App\Controllers\ReportController;
use App\Controllers\SettingController;
use App\Controllers\PasswordResetController;
use App\Controllers\FileController;

$router = new Router();

// Files (Mpya) - Lazima iwe JUU ili isigongane na {id}
$router->get('/api/files/{path}', [FileController::class, 'serve']);

// Auth
$router->post('/api/auth/login',           [AuthController::class, 'login']);
$router->get ('/api/auth/me',              [AuthController::class, 'me']);
$router->post('/api/auth/change-password', [AuthController::class, 'changePassword']);

// Password Reset
$router->post('/api/auth/forgot-password', [PasswordResetController::class, 'forgot']);
$router->post('/api/auth/reset-password',  [PasswordResetController::class, 'reset']);

// User Profile
$router->put('/api/users/profile',         [UserController::class, 'updateProfile']);
$router->put('/api/users/change-password', [UserController::class, 'changeMyPassword']);

// Staff management (admin)
$router->get   ('/api/users',       [UserController::class, 'index']);
$router->get   ('/api/users/{id}',  [UserController::class, 'show']);
$router->post  ('/api/users',       [UserController::class, 'store']);
$router->put   ('/api/users/{id}',  [UserController::class, 'update']);
$router->delete('/api/users/{id}',  [UserController::class, 'destroy']);

// Clients
$router->get   ('/api/clients',      [ClientController::class, 'index']);
$router->get   ('/api/clients/{id}', [ClientController::class, 'show']);
$router->post  ('/api/clients',      [ClientController::class, 'store']);
$router->put   ('/api/clients/{id}', [ClientController::class, 'update']);
$router->delete('/api/clients/{id}', [ClientController::class, 'destroy']);

// Obligations
$router->get   ('/api/obligations',                 [ObligationController::class, 'index']);
$router->get   ('/api/obligations/client/{clientId}',[ObligationController::class, 'byClient']);
$router->post  ('/api/obligations',                 [ObligationController::class, 'store']);
$router->put   ('/api/obligations/{id}',            [ObligationController::class, 'update']);
$router->delete('/api/obligations/{id}',            [ObligationController::class, 'destroy']);

// Closings
$router->get   ('/api/closings',              [ClosingController::class, 'index']);
$router->get   ('/api/closings/mine',         [ClosingController::class, 'mine']);
$router->get   ('/api/closings/{id}',         [ClosingController::class, 'show']);
$router->post  ('/api/closings/{id}/close',   [ClosingController::class, 'close']);
$router->put   ('/api/closings/{id}',         [ClosingController::class, 'update']);
$router->delete('/api/closings/{id}',         [ClosingController::class, 'destroy']);

// Dashboard
$router->get('/api/dashboard/admin', [DashboardController::class, 'admin']);
$router->get('/api/dashboard/staff', [DashboardController::class, 'staff']);

// Reports
$router->get('/api/reports/weekly-summary', [ReportController::class, 'weeklySummary']);
$router->get('/api/reports/activity-log',   [ReportController::class, 'activityLog']);
$router->get('/api/reports/reminder-logs',  [ReportController::class, 'reminderLogs']);

// Settings
$router->get('/api/settings', [SettingController::class, 'getSettings']);
$router->put('/api/settings', [SettingController::class, 'update']);

return $router;