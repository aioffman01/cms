<?php
/**
 * InspectionSQL 클래스 - 점검 관리 및 매핑 쿼리 모음
 */
class InspectionSQL
{
    public function __construct(private readonly PDO $db) {}

    /** 신규 점검 등록 */
    public function create(array $data, array $memberIds): int
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                'INSERT INTO `inspection`
                 (`customer_id`, `planned_start_date`, `planned_end_date`, `plan_content`, `actual_start_date`, `actual_end_date`, `report_content`, `status`, `created_by`)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                (int) $data['customer_id'],
                $data['planned_start_date'],
                $data['planned_end_date'] ?? $data['planned_start_date'],
                $data['plan_content'],
                !empty($data['actual_start_date']) ? $data['actual_start_date'] : null,
                !empty($data['actual_end_date']) ? $data['actual_end_date'] : null,
                !empty($data['report_content']) ? $data['report_content'] : null,
                $data['status'] ?? 'scheduled',
                (int) $data['created_by'],
            ]);
            $inspectionId = (int) $this->db->lastInsertId();

            // 담당 직원 연결 등록 (다중 담당자)
            if (!empty($memberIds)) {
                $mStmt = $this->db->prepare('INSERT INTO `inspection_member` (`inspection_id`, `member_id`) VALUES (?, ?)');
                foreach ($memberIds as $mid) {
                    $mStmt->execute([$inspectionId, (int) $mid]);
                }
            }

            $this->db->commit();
            return $inspectionId;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /** 점검 계획/보고서 수정 */
    public function update(int $id, array $data, array $memberIds): bool
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                'UPDATE `inspection`
                 SET `planned_start_date`=?, `planned_end_date`=?, `plan_content`=?, `actual_start_date`=?, `actual_end_date`=?, `report_content`=?, `status`=?
                 WHERE `id`=?'
            );
            $stmt->execute([
                $data['planned_start_date'],
                $data['planned_end_date'] ?? $data['planned_start_date'],
                $data['plan_content'],
                !empty($data['actual_start_date']) ? $data['actual_start_date'] : null,
                !empty($data['actual_end_date']) ? $data['actual_end_date'] : null,
                !empty($data['report_content']) ? $data['report_content'] : null,
                $data['status'] ?? 'scheduled',
                $id,
            ]);

            // 기존 매핑 삭제 후 재등록
            $delStmt = $this->db->prepare('DELETE FROM `inspection_member` WHERE `inspection_id` = ?');
            $delStmt->execute([$id]);

            if (!empty($memberIds)) {
                $mStmt = $this->db->prepare('INSERT INTO `inspection_member` (`inspection_id`, `member_id`) VALUES (?, ?)');
                foreach ($memberIds as $mid) {
                    $mStmt->execute([$id, (int) $mid]);
                }
            }

            $this->db->commit();
            return true;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /** 단건 조회 (담당자 매핑 목록 포함) */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT i.*,
                    c.company_name AS customer_company,
                    c.contact_name AS customer_contact,
                    m.name         AS created_by_name
             FROM `inspection` i
             LEFT JOIN `customer` c ON i.customer_id = c.id
             LEFT JOIN `member`   m ON i.created_by  = m.id
             WHERE i.`id` = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $inspection = $stmt->fetch();
        if (!$inspection) return null;

        // 담당자 리스트 바인딩
        $mStmt = $this->db->prepare(
            'SELECT m.id, m.name, m.login_id
             FROM `inspection_member` im
             JOIN `member` m ON im.member_id = m.id
             WHERE im.inspection_id = ?'
        );
        $mStmt->execute([$id]);
        $inspection['members'] = $mStmt->fetchAll();

        return $inspection;
    }

    /** 필터링 목록 조회 (다중 담당자 목록 포함) */
    public function list(array $filters): array
    {
        $sql = 'SELECT DISTINCT i.*,
                       c.company_name AS customer_company,
                       m.name         AS created_by_name
                FROM `inspection` i
                LEFT JOIN `customer` c ON i.customer_id = c.id
                LEFT JOIN `member`   m ON i.created_by  = m.id
                LEFT JOIN `inspection_member` im ON i.id = im.inspection_id
                WHERE 1=1';
        $params = [];

        if (!empty($filters['customer_id'])) {
            $sql .= ' AND i.customer_id = ?';
            $params[] = (int) $filters['customer_id'];
        }
        if (!empty($filters['status'])) {
            $sql .= ' AND i.status = ?';
            $params[] = $filters['status'];
        }
        // 특정 담당자 필터 (나의 업무만 필터링에 이용)
        if (!empty($filters['member_id'])) {
            $sql .= ' AND im.member_id = ?';
            $params[] = (int) $filters['member_id'];
        }

        $sql .= ' ORDER BY i.planned_start_date DESC, i.id DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $list = $stmt->fetchAll();

        // 각 항목에 담당자 목록 매핑 채워넣기
        foreach ($list as &$item) {
            $mStmt = $this->db->prepare(
                'SELECT m.id, m.name
                 FROM `inspection_member` im
                 JOIN `member` m ON im.member_id = m.id
                 WHERE im.inspection_id = ?'
            );
            $mStmt->execute([$item['id']]);
            $item['members'] = $mStmt->fetchAll();
        }

        return $list;
    }

    /** 삭제 */
    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM `inspection` WHERE `id` = ?');
        return $stmt->execute([$id]);
    }
}
