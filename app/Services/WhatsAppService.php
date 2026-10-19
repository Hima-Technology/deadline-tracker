<?php
namespace App\Services;

use GuzzleHttp\Client;

class WhatsAppService
{
    public static function sendTemplate(string $toPhone, string $templateName, array $params = []): array
    {
        $config = require __DIR__ . '/../../config/config.php';
        $wa = $config['whatsapp'];

        if (empty($wa['token']) || empty($wa['phone_id'])) {
            return ['ok' => false, 'response' => 'WhatsApp not configured'];
        }

        $url = "{$wa['api_url']}/{$wa['phone_id']}/messages";

        $body = [
            'messaging_product' => 'whatsapp',
            'to'   => $toPhone,
            'type' => 'template',
            'template' => [
                'name'     => $templateName,
                'language' => ['code' => 'en'],
                'components' => [[
                    'type' => 'body',
                    'parameters' => array_map(
                        fn($p) => ['type' => 'text', 'text' => $p],
                        $params
                    ),
                ]],
            ],
        ];

        try {
            $client = new Client();
            $resp = $client->post($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $wa['token'],
                    'Content-Type'  => 'application/json',
                ],
                'json' => $body,
                'timeout' => 10,
            ]);
            return ['ok' => true, 'response' => $resp->getBody()->getContents()];
        } catch (\Throwable $e) {
            return ['ok' => false, 'response' => $e->getMessage()];
        }
    }
}