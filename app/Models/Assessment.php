<?php
namespace App\Models;

class Assessment extends BaseModel
{
    protected static string $table = 'assessments';
    protected static array $fillable = [
        'client_id', 'authority', 'reference_number', 'assessment_date', 'status', 'notes'
    ];
}