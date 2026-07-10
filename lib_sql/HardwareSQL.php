<?php
/**
 * HardwareSQL 클래스 - hardware 테이블 쿼리 모음
 */
class HardwareSQL
{
    public function __construct(private readonly PDO $db) {}

    /** 하드웨어 등록 */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `hardware`
             (`model_name`, `cpu_count`, `disk_tb`, `nic_count`, `note`, `is_active`, `created_by`)
             VALUES (?, ?, ?, ?, ?, 1, ?)'
        );
        $stmt->execute([
            $data['model_name'],
            (int)  ($data['cpu_count'] ?? 0),
            (float)($data['disk_tb']   ?? 0),
            (int)  ($data['nic_count'] ?? 0),
            $data['note']       ?? '',
            $data['created_by'],
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** 하드웨어 수정 */
    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `hardware`
             SET `model_name`=?, `cpu_count`=?, `disk_tb`=?, `nic_count`=?, `note`=?
             WHERE `id`=?'
        );
        return $stmt->execute([
            $data['model_name'],
            (int)  ($data['cpu_count'] ?? 0),
            (float)($data['disk_tb']   ?? 0),
            (int)  ($data['nic_count'] ?? 0),
            $data['note'] ?? '',
            $id,
        ]);
    }

    /** ID로 단건 조회 */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT h.*, m.name AS created_by_name
             FROM `hardware` h
             LEFT JOIN `member` m ON h.created_by = m.id
             WHERE h.`id` = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    /** 목록 조회 */
    public function listAll(bool $activeOnly = false): array
    {
        $sql = 'SELECT h.*, m.name AS created_by_name
                FROM `hardware` h
                LEFT JOIN `member` m ON h.created_by = m.id';
        if ($activeOnly) {
            $sql .= ' WHERE h.`is_active` = 1';
        }
        $sql .= ' ORDER BY h.`id` DESC';
        return $this->db->query($sql)->fetchAll();
    }

    /** 활성/비활성 토글 */
    public function toggleActive(int $id): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `hardware` SET `is_active` = 1 - `is_active` WHERE `id` = ?'
        );
        return $stmt->execute([$id]);
    }

    /** 존재 여부 */
    public function exists(int $id): bool
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM `hardware` WHERE `id` = ?');
        $stmt->execute([$id]);
        return (int) $stmt->fetchColumn() > 0;
    }
}
