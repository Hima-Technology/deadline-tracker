<?php
namespace App\Models;

use App\Core\Database;
use PDO;

abstract class BaseModel
{
    protected static string $table;
    protected static array $fillable = [];

    protected static function pdo(): PDO
    {
        return Database::pdo();
    }

    public static function normalizeRow(array $row): array
    {
        foreach ($row as $key => $value) {
            if ($value === 't' || $value === 'true') {
                $row[$key] = true;
            } elseif ($value === 'f' || $value === 'false') {
                $row[$key] = false;
            } elseif (is_numeric($value) && in_array($key, ['total_contract_amount', 'amount_paid', 'amount'])) {
                $row[$key] = (float) $value;
            }
        }
        return $row;
    }

    protected static function prepareValue($v)
    {
        // Kama ni array tupu, usihifadhi "[]", rudisha null
        if (is_array($v)) {
            if (empty($v)) return null;
            return json_encode($v);
        }
        if (is_bool($v)) {
            return $v ? 1 : 0;
        }
        if ($v === '') {
            return null;
        }
        return $v;
    }

    public static function all(array $where = [], string $order = 'id DESC'): array
    {
        $sql = 'SELECT * FROM ' . static::$table;
        $params = [];
        if ($where) {
            $conds = [];
            foreach ($where as $k => $v) {
                $conds[] = "{$k} = ?";
                $params[] = self::prepareValue($v);
            }
            $sql .= ' WHERE ' . implode(' AND ', $conds);
        }
        $sql .= " ORDER BY {$order}";
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return array_map([static::class, 'normalizeRow'], $stmt->fetchAll());
    }

    public static function find(int $id): ?array
    {
        $stmt = self::pdo()->prepare('SELECT * FROM ' . static::$table . ' WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::normalizeRow($row) : null;
    }

    public static function create(array $data): array
    {
        $cols = array_intersect_key($data, array_flip(static::$fillable));
        $keys = array_keys($cols);
        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $sql = 'INSERT INTO ' . static::$table
             . ' (' . implode(',', $keys) . ') VALUES (' . $placeholders . ') RETURNING *';
        $stmt = self::pdo()->prepare($sql);
        
        $vals = array_map([static::class, 'prepareValue'], array_values($cols));

        $stmt->execute($vals);
        $row = $stmt->fetch();
        return $row ? self::normalizeRow($row) : [];
    }

    public static function update(int $id, array $data): ?array
    {
        $cols = array_intersect_key($data, array_flip(static::$fillable));
        if (!$cols) return static::find($id);
        
        $sets = implode(', ', array_map(fn($k) => "{$k} = ?", array_keys($cols)));
        
        $vals = array_map([static::class, 'prepareValue'], array_values($cols));
        
        $vals[] = $id;
        $sql = 'UPDATE ' . static::$table . " SET {$sets}, updated_at = NOW() WHERE id = ? RETURNING *";
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($vals);
        $row = $stmt->fetch();
        return $row ? self::normalizeRow($row) : null;
    }

    public static function delete(int $id): bool
    {
        $stmt = self::pdo()->prepare('DELETE FROM ' . static::$table . ' WHERE id = ?');
        return $stmt->execute([$id]);
    }
}