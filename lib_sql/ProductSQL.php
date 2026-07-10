<?php
/**
 * ProductSQL 클래스 - product 테이블 쿼리 모음
 */
class ProductSQL
{
    public function __construct(private readonly PDO $db) {}

    /** 판매 제품 등록 */
    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `product`
             (`customer_id`, `hardware_id`, `model_name`, `license`, `os_type`, `installed_at`, `created_by`)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            (int) $data['customer_id'],
            !empty($data['hardware_id']) ? (int) $data['hardware_id'] : null,
            $data['model_name'],
            $data['license']      ?? '',
            $data['os_type']      ?? '',
            !empty($data['installed_at']) ? $data['installed_at'] : null,
            (int) $data['created_by'],
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** 판매 제품 수정 */
    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `product`
             SET `hardware_id`=?, `model_name`=?, `license`=?, `os_type`=?, `installed_at`=?
             WHERE `id`=?'
        );
        return $stmt->execute([
            !empty($data['hardware_id']) ? (int) $data['hardware_id'] : null,
            $data['model_name'],
            $data['license']      ?? '',
            $data['os_type']      ?? '',
            !empty($data['installed_at']) ? $data['installed_at'] : null,
            $id,
        ]);
    }

    /** ID로 단건 조회 */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT p.*,
                    h.model_name  AS hw_model,
                    h.cpu_count   AS hw_cpu,
                    h.disk_tb     AS hw_disk,
                    h.nic_count   AS hw_nic,
                    m.name        AS created_by_name
             FROM `product` p
             LEFT JOIN `hardware` h ON p.hardware_id = h.id
             LEFT JOIN `member`   m ON p.created_by  = m.id
             WHERE p.`id` = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    /** 고객별 제품 목록 */
    public function listByCustomer(int $customerId): array
    {
        $stmt = $this->db->prepare(
            'SELECT p.*,
                    h.model_name AS hw_model,
                    m.name       AS created_by_name
             FROM `product` p
             LEFT JOIN `hardware` h ON p.hardware_id = h.id
             LEFT JOIN `member`   m ON p.created_by  = m.id
             WHERE p.`customer_id` = ?
             ORDER BY p.`id` DESC'
        );
        $stmt->execute([$customerId]);
        return $stmt->fetchAll();
    }

    /** 삭제 */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM `product` WHERE `id` = ?');
        return $stmt->execute([$id]);
    }

    /** 존재 여부 */
    public function exists(int $id): bool
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM `product` WHERE `id` = ?');
        $stmt->execute([$id]);
        return (int) $stmt->fetchColumn() > 0;
    }
}
