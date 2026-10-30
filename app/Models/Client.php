<?php
namespace App\Models;

class Client extends BaseModel
{
    protected static string $table = 'clients';
    
    protected static array $fillable = [
        'company_name', 'contact_person', 'phone', 'email', 'notes', 'created_by',
        'contract_start_date', 'contract_end_date', 'service_type', 
        'total_contract_amount', 'amount_paid', 'assessment_info',
        
        // Vigezo vya Msingi
        'location', 'tin', 'industry', 'financial_year_start',
        
        // Namba za Usajili
        'tra_number', 'zra_number', 'bpra_number', 'zssf_number',
        
        // Credentials za TRA
        'tra_username', 'tra_password', 'tra_phone', 'tra_reg_date',
        'tra_start_date', 'tra_end_date', 'tra_attachment',
        
        // Credentials za ZRA
        'zra_username', 'zra_password', 'zra_phone', 'zra_reg_date',
        'zra_start_date', 'zra_end_date', 'zra_attachment',
        
        // Credentials za BPRA
        'bpra_username', 'bpra_password', 'bpra_reg_date',
        'bpra_start_date', 'bpra_end_date', 'bpra_attachment',
        
        // Credentials za ZSSF
        'zssf_username', 'zssf_password', 'zssf_contract_file', 'zssf_reg_date',
        'zssf_start_date', 'zssf_end_date', 'zssf_attachment',
        
        // Auditor
        'auditor_id'
    ];
}