<?php
namespace App\Models;

class Client extends BaseModel
{
    protected static string $table = 'clients';
    protected static array $fillable = [
        'company_name', 'contact_person', 'phone', 'email', 'notes', 'created_by',
        'contract_start_date', 'contract_end_date', 'service_type', 
        'total_contract_amount', 'amount_paid', 'assessment_info'
    ];

    // Kazi ya kuhesabu deni (Remaining Balance)
    public static function getBalance(int $clientId): float
    {
        $client = self::find($clientId);
        if (!$client) return 0;
        
        // Tunahakikisha tunasoma kama float
        $total = isset($client['total_contract_amount']) ? (float)$client['total_contract_amount'] : 0;
        $paid = isset($client['amount_paid']) ? (float)$client['amount_paid'] : 0;
        
        return $total - $paid;
    }
}