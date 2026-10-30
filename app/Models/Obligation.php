<?php
namespace App\Models;

class Obligation extends BaseModel
{
    protected static string $table = 'obligations';
    protected static array $fillable = [
        'client_id', 'title', 'frequency', 'due_day', 
        'default_staff_id', 'reminder_days', 'is_active',
        // Vigezo vipya
        'authority', 'filing_status', 'confirmed_due_date'
    ];
}