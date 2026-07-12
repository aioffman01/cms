<?php
/**
 * MngItemSQL 클래스 - mng_item 테이블 쿼리 모음
 */
class MngItemSQL
{
    public function __construct(private readonly PDO $db) {}

    /** 세부 항목 생성 */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `mng_item` (`category_id`, `code`, `name`, `is_use`, `description`)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['category_id'],
            $data['code'],
            $data['name'],
            $data['is_use'] ?? 'Y',
            $data['description'] ?? null
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** 세부 항목 수정 */
    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `mng_item`
             SET `code` = ?, `name` = ?, `is_use` = ?, `description` = ?
             WHERE `id` = ?'
        );
        return $stmt->execute([
            $data['code'],
            $data['name'],
            $data['is_use'] ?? 'Y',
            $data['description'] ?? null,
            $id
        ]);
    }

    /** 세부 항목 삭제 */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM `mng_item` WHERE `id` = ?');
        return $stmt->execute([$id]);
    }

    /** ID로 조회 (대항목 정보 포함) */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT i.*, c.code AS category_code, c.name AS category_name, 
                    CONCAT(c.code, \'.\', i.code) AS full_code
             FROM `mng_item` i
             JOIN `mng_category` c ON i.category_id = c.id
             WHERE i.`id` = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    /** 대항목 ID & 항목코드로 조회 (중복 검사 전용) */
    public function findByCategoryAndCode(int $categoryId, string $code): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM `mng_item` WHERE `category_id` = ? AND `code` = ? LIMIT 1'
        );
        $stmt->execute([$categoryId, $code]);
        return $stmt->fetch() ?: null;
    }

    /** 특정 대항목에 속한 세부 항목 목록 조회 */
    public function listByCategory(int $categoryId, ?string $isUse = null): array
    {
        $sql = 'SELECT i.*, c.code AS category_code, c.name AS category_name, 
                       CONCAT(c.code, \'.\', i.code) AS full_code
                FROM `mng_item` i
                JOIN `mng_category` c ON i.category_id = c.id
                WHERE i.`category_id` = ?';
        
        if ($isUse === 'Y' || $isUse === 'N') {
            $sql .= ' AND i.`is_use` = ?';
            $sql .= ' ORDER BY i.`code` ASC';
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$categoryId, $isUse]);
            return $stmt->fetchAll();
        }
        
        $sql .= ' ORDER BY i.`code` ASC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$categoryId]);
        return $stmt->fetchAll();
    }

    /** 존재 여부 확인 */
    public function exists(int $id): bool
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM `mng_item` WHERE `id` = ?');
        $stmt->execute([$id]);
        return (int) $stmt->fetchColumn() > 0;
    }
}
