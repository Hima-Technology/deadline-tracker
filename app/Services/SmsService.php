<?php
namespace App\Services;

class SmsService
{
    public static function send(string $phone, string $message): array
    {
        // Hapa unaweka API ya SMS (Mfano: Beem, Africa's Talking, n.k.)
        // Kwa sasa tunatumia mfano wa Beem Africa
        $apiKey = $_ENV['SMS_API_KEY'] ?? '';
        $secretKey = $_ENV['SMS_SECRET_KEY'] ?? '';
        $senderId = $_ENV['SMS_SENDER_ID'] ?? 'SBC';

        if (empty($apiKey)) {
            return ['ok' => false, 'response' => 'SMS API not configured'];
        }

        // Mfano wa kutuma SMS kupitia Beem Africa
        $url = 'https://apisms.beem.africa/v1/send';
        $payload = [
            'source_addr' => $senderId,
            'schedule_time' => '',
            'encoding' => 0,
            'message' => $message,
            'recipients' => [
                ['recipient_id' => 1, 'dest_addr' => $phone]
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Basic ' . base64_encode($apiKey . ':' . $secretKey)
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return ['ok' => $httpCode == 200, 'response' => $response];
    }
}