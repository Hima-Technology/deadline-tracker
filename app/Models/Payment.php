<?php
namespace App\Models;

class Payment extends BaseModel
{
    protected static string $table = 'payments';
    protected static array $fillable = [
        'client_id', 'amount', 'payment_date', 'receipt_number', 'created_by'
    ];
}