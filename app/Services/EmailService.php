<?php
namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

class EmailService
{
    public static function send(string $to, string $subject, string $htmlBody): array
    {
        $config = require __DIR__ . '/../../config/config.php';
        $smtp = $config['smtp'];
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = $smtp['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $smtp['user'];
            $mail->Password   = $smtp['pass'];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $smtp['port'];

            $mail->setFrom($smtp['from'], $smtp['from_name']);
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = strip_tags($htmlBody);
            $mail->send();

            return ['ok' => true, 'response' => 'sent'];
        } catch (MailException $e) {
            return ['ok' => false, 'response' => $mail->ErrorInfo];
        }
    }
}