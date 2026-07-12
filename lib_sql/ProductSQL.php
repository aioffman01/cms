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
             (`customer_id`, `name`, `model_name`, `version`, `os_type`, `installed_at`, `description`, `created_by`)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            (int) $data['customer_id'],
            $data['name']          ?? '',
            $data['model_name'],
            $data['version']       ?? '',
            $data['os_type']      ?? '',
            !empty($data['installed_at']) ? $data['installed_at'] : null,
            $data['description']  ?? '',
            (int) $data['created_by'],
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** 판매 제품 수정 */
    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `product`
             SET `name`=?, `model_name`=?, `version`=?, `os_type`=?, `installed_at`=?, `description`=?
             WHERE `id`=?'
        );
        return $stmt->execute([
            $data['name']          ?? '',
            $data['model_name'],
            $data['version']       ?? '',
            $data['os_type']      ?? '',
            !empty($data['installed_at']) ? $data['installed_at'] : null,
            $data['description']  ?? '',
            $id,
        ]);
    }

    /** ID로 단건 조회 */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT p.*,
                    c.company_name AS customer_company,
                    m.name         AS created_by_name
             FROM `product` p
             LEFT JOIN `customer` c ON p.customer_id = c.id
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
                    m.name       AS created_by_name
             FROM `product` p
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

    /** 업그레이드 이력 생성 */
    public function createHistory(array $data): bool
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `product_history`
             (`product_id`, `old_version_code`, `old_version_name`, `new_version_code`, `new_version_name`, 
              `old_os_code`, `old_os_name`, `new_os_code`, `new_os_name`, `notes`, `created_by`)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        return $stmt->execute([
            (int) $data['product_id'],
            $data['old_version_code'] ?? null,
            $data['old_version_name'] ?? null,
            $data['new_version_code'] ?? null,
            $data['new_version_name'] ?? null,
            $data['old_os_code']      ?? null,
            $data['old_os_name']      ?? null,
            $data['new_os_code']      ?? null,
            $data['new_os_name']      ?? null,
            $data['notes']            ?? null,
            (int) $data['created_by']
        ]);
    }

    /** 특정 제품의 업그레이드 이력 조회 */
    public function findHistoryByProductId(int $productId): array
    {
        $stmt = $this->db->prepare(
            'SELECT h.*,
                    m.name AS created_by_name
             FROM `product_history` h
             LEFT JOIN `member`     m ON h.created_by = m.id
             WHERE h.`product_id` = ?
             ORDER BY h.`created_at` DESC, h.`id` DESC'
        );
        $stmt->execute([$productId]);
        return $stmt->fetchAll();
    }

    /** 세부 항목 이름과 대항목 코드로 코드(Code) 조회 */
    public function getItemCode(string $name, string $categoryCode): ?string
    {
        if (trim($name) === '') return null;
        $stmt = $this->db->prepare(
            'SELECT i.code 
             FROM `mng_item` i
             JOIN `mng_category` c ON i.category_id = c.id
             WHERE i.name = ? AND c.code = ?
             LIMIT 1'
        );
        $stmt->execute([$name, $categoryCode]);
        $row = $stmt->fetch();
        return $row ? $row['code'] : null;
    }

    /** 제품 버전 및 OS 업그레이드 */
    public function upgrade(int $id, string $version, string $osType): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE `product`
             SET `version` = ?, `os_type` = ?
             WHERE `id` = ?'
        );
        return $stmt->execute([$version, $osType, $id]);
    }
}
