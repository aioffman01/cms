<?php
/**
 * CustomerSQL 클래스 - 고객(customer) 테이블 쿼리 모음
 */
class CustomerSQL
{
    public function __construct(private readonly PDO $db) {}

    /** 고객 생성 */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `customer`
             (`company_name`, `company_addr`, `contact_name`, `contact_phone`, `contact_email`, `description`, `created_by`)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['company_name'],
            $data['company_addr']  ?? '',
            $data['contact_name']  ?? '',
            $data['contact_phone'] ?? '',
            $data['contact_email'] ?? '',
            $data['description']   ?? null,
            $data['created_by'],
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** 고객 정보 수정 */
    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `customer`
             SET `company_name` = ?, `company_addr` = ?,
                 `contact_name` = ?, `contact_phone` = ?, `contact_email` = ?, `description` = ?
             WHERE `id` = ?'
        );
        return $stmt->execute([
            $data['company_name'],
            $data['company_addr']  ?? '',
            $data['contact_name']  ?? '',
            $data['contact_phone'] ?? '',
            $data['contact_email'] ?? '',
            $data['description']   ?? null,
            $id,
        ]);
    }

    /** ID로 고객 조회 */
    public function findById(int $id, bool $includeHidden = false): ?array
    {
        $sql = 'SELECT c.*, m.name AS created_by_name FROM `customer` c
                LEFT JOIN `member` m ON c.created_by = m.id
                WHERE c.`id` = ?';
        if (!$includeHidden) {
            $sql .= ' AND c.`is_hidden` = 0';
        }
        $stmt = $this->db->prepare($sql . ' LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    /** 전체 고객 목록 */
    public function listAll(bool $includeHidden = false): array
    {
        $sql = 'SELECT c.*, m.name AS created_by_name FROM `customer` c
                LEFT JOIN `member` m ON c.created_by = m.id';
        if (!$includeHidden) {
            $sql .= ' WHERE c.`is_hidden` = 0';
        }
        $sql .= ' ORDER BY c.`id` DESC';
        return $this->db->query($sql)->fetchAll();
    }

    /** 숨김 상태 변경 */
    public function setHidden(int $id, bool $hidden): bool
    {
        $stmt = $this->db->prepare('UPDATE `customer` SET `is_hidden` = ? WHERE `id` = ?');
        return $stmt->execute([$hidden ? 1 : 0, $id]);
    }

    /** 존재 여부 확인 */
    public function exists(int $id): bool
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM `customer` WHERE `id` = ?');
        $stmt->execute([$id]);
        return (int) $stmt->fetchColumn() > 0;
    }

    /** 통계 정보 */
    public function getStats(): array
    {
        $row = $this->db->query(
            'SELECT COUNT(*) AS total,
                    SUM(is_hidden = 1) AS hidden,
                    SUM(is_hidden = 0) AS visible
             FROM `customer`'
        )->fetch();
        return [
            'total'   => (int) $row['total'],
            'hidden'  => (int) $row['hidden'],
            'visible' => (int) $row['visible'],
        ];
    }
}
