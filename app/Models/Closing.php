<?php
namespace App\Models;

use App\Core\Database;

class Closing extends BaseModel
{
    protected static string $table = 'closings';
    protected static array $fillable = [
        'obligation_id', 'client_id', 'assigned_staff_id',
        'period_label', 'due_date', 'status',
        'closed_at', 'closed_by', 'reference_number', 'proof_file_path',
        'updated_at'
    ];

    public static function forStaff(int $staffId): array
    {
        $stmt = self::pdo()->prepare(
            'SELECT c.*, cl.company_name, o.title AS obligation_title
             FROM closings c
             JOIN clients cl ON cl.id = c.client_id
             JOIN obligations o ON o.id = c.obligation_id
             WHERE c.assigned_staff_id = ?
             ORDER BY c.due_date ASC'
        );
        $stmt->execute([$staffId]);
        return array_map([static::class, 'normalizeRow'], $stmt->fetchAll());
    }

    public static function filter(array $filters = []): array
    {
        $sql = 'SELECT c.*, cl.company_name, o.title AS obligation_title,
                       u.name AS staff_name
                FROM closings c
                JOIN clients cl ON cl.id = c.client_id
                JOIN obligations o ON o.id = c.obligation_id
                LEFT JOIN users u ON u.id = c.assigned_staff_id
                WHERE 1=1';
        $params = [];
        foreach (['assigned_staff_id', 'client_id', 'status'] as $f) {
            if (!empty($filters[$f])) {
                $sql .= " AND c.{$f} = ?";
                $params[] = $filters[$f];
            }
        }
        if (!empty($filters['period'])) {
            $sql .= ' AND c.period_label = ?';
            $params[] = $filters['period'];
        }
        $sql .= ' ORDER BY c.due_date ASC';
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return array_map([static::class, 'normalizeRow'], $stmt->fetchAll());
    }

    public static function findFull(int $id): ?array
    {
        $stmt = self::pdo()->prepare(
            'SELECT c.*, cl.company_name, o.title AS obligation_title,
                    o.reminder_days
             FROM closings c
             JOIN clients cl ON cl.id = c.client_id
             JOIN obligations o ON o.id = c.obligation_id
             WHERE c.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::normalizeRow($row) : null;
    }

    public static function markClosed(int $id, int $userId, string $ref, ?string $proof): ?array
    {
        $stmt = self::pdo()->prepare(
            "UPDATE closings
             SET status='closed', closed_at=NOW(), closed_by=?,
                 reference_number=?, proof_file_path=?, updated_at=NOW()
             WHERE id=? RETURNING *"
        );
        $stmt->execute([$userId, $ref, $proof, $id]);
        $row = $stmt->fetch();
        return $row ? self::normalizeRow($row) : null;
    }

    public static function refreshStatuses(): void
    {
        Database::pdo()->exec(
            "UPDATE closings
             SET status = CASE
                 WHEN due_date <= CURRENT_DATE THEN 'overdue'
                 WHEN due_date <= CURRENT_DATE + INTERVAL '5 days' THEN 'due_soon'
                 ELSE 'open'
             END
             WHERE status <> 'closed'"
        );
    }
}