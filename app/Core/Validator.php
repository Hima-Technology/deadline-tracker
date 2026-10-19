<?php
namespace App\Core;

class Validator
{
    public static function require(array $data, array $fields): array
    {
        $errors = [];
        foreach ($fields as $f) {
            if (!isset($data[$f]) || $data[$f] === '' || $data[$f] === null) {
                $errors[$f] = "{$f} is required";
            }
        }
        if ($errors) Response::error('Validation failed', 422, $errors);
        return $data;
    }
}