<?php
/**
 * MemberSQL 클래스 - 회원(member) 테이블 쿼리 모음
 */
class MemberSQL
{
    public function __construct(private readonly PDO $db) {}

    /** 로그인 ID로 회원 조회 */
    public function findByLoginId(string $loginId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM `member` WHERE `login_id` = ? LIMIT 1');
        $stmt->execute([$loginId]);
        return $stmt->fetch() ?: null;
    }

    /** ID로 회원 조회 (비밀번호 제외) */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT `id`, `login_id`, `name`, `role`, `created_at`, `updated_at`
             FROM `member` WHERE `id` = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    /** 회원 생성 */
    public function create(string $loginId, string $hashedPassword, string $name): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO `member` (`login_id`, `password`, `name`) VALUES (?, ?, ?)'
        );
        $stmt->execute([$loginId, $hashedPassword, $name]);
        return (int) $this->db->lastInsertId();
    }

    /** 회원 정보 수정 */
    public function update(int $id, string $name, ?string $hashedPassword = null): bool
    {
        if ($hashedPassword !== null) {
            $stmt = $this->db->prepare(
                'UPDATE `member` SET `name` = ?, `password` = ? WHERE `id` = ?'
            );
            return $stmt->execute([$name, $hashedPassword, $id]);
        }
        $stmt = $this->db->prepare('UPDATE `member` SET `name` = ? WHERE `id` = ?');
        return $stmt->execute([$name, $id]);
    }

    /** 전체 회원 목록 (관리자용) */
    public function listAll(): array
    {
        return $this->db->query(
            'SELECT `id`, `login_id`, `name`, `role`, `created_at` FROM `member` ORDER BY `id` DESC'
        )->fetchAll();
    }

    /** 역할 변경 */
    public function setRole(int $id, string $role): bool
    {
        $stmt = $this->db->prepare('UPDATE `member` SET `role` = ? WHERE `id` = ?');
        return $stmt->execute([$role, $id]);
    }

    /** 로그인 ID 중복 확인 */
    public function loginIdExists(string $loginId): bool
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM `member` WHERE `login_id` = ?');
        $stmt->execute([$loginId]);
        return (int) $stmt->fetchColumn() > 0;
    }
}
