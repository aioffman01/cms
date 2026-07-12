<?php
/**
 * MngCategorySQL 클래스 - mng_category 테이블 쿼리 모음
 */
class MngCategorySQL
{
    public function __construct(private readonly PDO $db) {}

    /** 대항목 생성 */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `mng_category` (`code`, `name`, `is_use`, `description`)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['code'],
            $data['name'],
            $data['is_use'] ?? 'Y',
            $data['description'] ?? null
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** 대항목 수정 */
    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `mng_category`
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

    /** 대항목 삭제 */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM `mng_category` WHERE `id` = ?');
        return $stmt->execute([$id]);
    }

    /** ID로 조회 */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM `mng_category` WHERE `id` = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    /** 코드(code)로 조회 (중복 검사 전용) */
    public function findByCode(string $code): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM `mng_category` WHERE `code` = ? LIMIT 1');
        $stmt->execute([$code]);
        return $stmt->fetch() ?: null;
    }

    /** 전체 목록 조회 (is_use 필터링 가능) */
    public function listAll(?string $isUse = null): array
    {
        if ($isUse === 'Y' || $isUse === 'N') {
            $stmt = $this->db->prepare('SELECT * FROM `mng_category` WHERE `is_use` = ? ORDER BY `code` ASC');
            $stmt->execute([$isUse]);
            return $stmt->fetchAll();
        }
        return $this->db->query('SELECT * FROM `mng_category` ORDER BY `code` ASC')->fetchAll();
    }

    /** 존재 여부 확인 */
    public function exists(int $id): bool
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM `mng_category` WHERE `id` = ?');
        $stmt->execute([$id]);
        return (int) $stmt->fetchColumn() > 0;
    }
}
