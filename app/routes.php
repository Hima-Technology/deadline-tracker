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
use App\Controllers\PrivilegeController;
use App\Controllers\ExaminationController;
use App\Controllers\ClientDocumentController;
use App\Controllers\AuditorMessageController;

$router = new Router();

// =========================================================
// FILES 
// =========================================================
$router->get('/api/files/(.*)', [FileController::class, 'serve']);

// =========================================================
// AUTH
// =========================================================
$router->post('/api/auth/login',           [AuthController::class, 'login']);
$router->get ('/api/auth/me',              [AuthController::class, 'me']);
$router->post('/api/auth/change-password', [AuthController::class, 'changePassword']);

// Password Reset
$router->post('/api/auth/forgot-password', [PasswordResetController::class, 'forgot']);
$router->post('/api/auth/reset-password',  [PasswordResetController::class, 'reset']);

// =========================================================
// USER PROFILE
// =========================================================
$router->put('/api/users/profile',         [UserController::class, 'updateProfile']);
$router->put('/api/users/change-password', [UserController::class, 'changeMyPassword']);

// =========================================================
// STAFF MANAGEMENT (admin)
// =========================================================
$router->get   ('/api/users',      [UserController::class, 'index']);
$router->get   ('/api/users/{id}', [UserController::class, 'show']);
$router->post  ('/api/users',      [UserController::class, 'store']);
$router->put   ('/api/users/{id}', [UserController::class, 'update']);
$router->post  ('/api/users/{id}', [UserController::class, 'update']);
$router->delete('/api/users/{id}', [UserController::class, 'destroy']);

// =========================================================
// CLIENTS
// =========================================================
$router->get   ('/api/clients',      [ClientController::class, 'index']);
$router->get   ('/api/clients/{id}', [ClientController::class, 'show']);
$router->post  ('/api/clients',      [ClientController::class, 'store']);
$router->put   ('/api/clients/{id}', [ClientController::class, 'update']);
$router->post  ('/api/clients/{id}', [ClientController::class, 'update']);
$router->delete('/api/clients/{id}', [ClientController::class, 'destroy']);
$router->get   ('/api/clients/{id}/documents', [ClientDocumentController::class, 'index']);
$router->post  ('/api/clients/{id}/documents', [ClientDocumentController::class, 'store']);
$router->get   ('/api/auditor-documents', [ClientDocumentController::class, 'auditorDocuments']);
$router->get   ('/api/client-documents/{id}/file', [ClientDocumentController::class, 'download']);
$router->post  ('/api/client-documents/{id}/feedback', [ClientDocumentController::class, 'feedback']);
$router->delete('/api/client-documents/{id}', [ClientDocumentController::class, 'destroyAuditorDocument']);
$router->get   ('/api/auditor-messages', [AuditorMessageController::class, 'index']);
$router->post  ('/api/auditor-messages', [AuditorMessageController::class, 'store']);

// =========================================================
// EXAMINATIONS (admin)
// =========================================================
$router->get   ('/api/examinations',      [ExaminationController::class, 'index']);
$router->post  ('/api/examinations',      [ExaminationController::class, 'store']);
$router->put   ('/api/examinations/{id}', [ExaminationController::class, 'update']);
$router->post  ('/api/examinations/{id}', [ExaminationController::class, 'update']);
$router->delete('/api/examinations/{id}', [ExaminationController::class, 'destroy']);

// Client Permissions (Staff Roles)
$router->get ('/api/clients/{id}/permissions', [ClientController::class, 'permissions']);
$router->post('/api/clients/{id}/permissions', [ClientController::class, 'assignPermissions']);
$router->get ('/api/clients/{id}/my-permissions', [ClientController::class, 'myPermissions']);
$router->post('/api/clients/{id}/passwords',   [ClientController::class, 'revealPasswords']);

// =========================================================
// PRIVILEGES (Staff Tasks)
// =========================================================
// 1. Kwa ajili ya Staff kuona zake tu (LAZIMA IWE JUU KABLA YA {id})
$router->get   ('/api/privileges/mine', [PrivilegeController::class, 'myPrivileges']);

// 2. Kwa ajili ya Admin
$router->get   ('/api/privileges',      [PrivilegeController::class, 'index']);
$router->post  ('/api/privileges',      [PrivilegeController::class, 'store']);
$router->put   ('/api/privileges/{id}', [PrivilegeController::class, 'update']);
$router->post  ('/api/privileges/{id}', [PrivilegeController::class, 'update']);
$router->delete('/api/privileges/{id}', [PrivilegeController::class, 'destroy']);

// =========================================================
// OBLIGATIONS
// =========================================================
$router->get   ('/api/obligations',                  [ObligationController::class, 'index']);
$router->get   ('/api/obligations/client/{clientId}/staff', [ObligationController::class, 'staffOptions']);
$router->get   ('/api/obligations/client/{clientId}',[ObligationController::class, 'byClient']);
$router->post  ('/api/obligations',                  [ObligationController::class, 'store']);
$router->put   ('/api/obligations/{id}',             [ObligationController::class, 'update']);
$router->post  ('/api/obligations/{id}',             [ObligationController::class, 'update']);
$router->delete('/api/obligations/{id}',             [ObligationController::class, 'destroy']);

// =========================================================
// CLOSINGS
// =========================================================
$router->get   ('/api/closings',            [ClosingController::class, 'index']);
$router->get   ('/api/closings/mine',       [ClosingController::class, 'mine']);
$router->get   ('/api/closings/{id}',       [ClosingController::class, 'show']);
$router->post  ('/api/closings/{id}/close', [ClosingController::class, 'close']);
$router->put   ('/api/closings/{id}',       [ClosingController::class, 'update']);
$router->post  ('/api/closings/{id}',       [ClosingController::class, 'update']);
$router->delete('/api/closings/{id}',       [ClosingController::class, 'destroy']);

// =========================================================
// DASHBOARD
// =========================================================
$router->get('/api/dashboard/admin', [DashboardController::class, 'admin']);
$router->get('/api/dashboard/staff', [DashboardController::class, 'staff']);

// =========================================================
// REPORTS
// =========================================================
$router->get('/api/reports/weekly-summary', [ReportController::class, 'weeklySummary']);
$router->get('/api/reports/activity-log',   [ReportController::class, 'activityLog']);
$router->get('/api/reports/reminder-logs',  [ReportController::class, 'reminderLogs']);

// =========================================================
// SETTINGS
// =========================================================
$router->get('/api/settings', [SettingController::class, 'getSettings']);
$router->put('/api/settings', [SettingController::class, 'update']);
$router->post('/api/settings', [SettingController::class, 'update']);

return $router;