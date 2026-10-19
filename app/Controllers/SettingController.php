<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Models\Setting;

class SettingController
{
    public function getSettings(): void
    {
        try {
            $u = Auth::requireAuth(); // Ruhusu Staff na Admin

            // Kama ni Staff, usirudishe taarifa za SMTP/WhatsApp
            if ($u['role'] !== 'admin') {
                Response::success([
                    'smtp'              => [],
                    'whatsapp'          => [],
                    'message_templates' => [],
                    'reminder_rules'    => Setting::get('reminder_rules', ['days' => [30,7,1,0]]),
                ]);
                return;
            }

            // Kama ni Admin, rudisha kila kitu
            Response::success([
                'smtp'              => Setting::get('smtp', []),
                'whatsapp'          => Setting::get('whatsapp', []),
                'message_templates' => Setting::get('message_templates', []),
                'reminder_rules'    => Setting::get('reminder_rules', ['days' => [30,7,1,0]]),
            ]);
        } catch (\Throwable $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch settings',
                'error_detail' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            exit;
        }
    }

    public function update(): void
    {
        Auth::requireAdmin(); // Admin pekee anaweza kubadilisha
        $u = Auth::requireAuth();
        $data = Request::body();
        foreach (['smtp','whatsapp','message_templates','reminder_rules'] as $key) {
            if (isset($data[$key])) Setting::set($key, $data[$key], $u['id']);
        }
        Response::success(null, 'Settings saved');
    }
}