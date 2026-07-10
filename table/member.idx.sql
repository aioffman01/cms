-- ============================================================
-- 회원 테이블 인덱스
-- (login_id는 UNIQUE KEY로 이미 인덱스 생성됨)
-- ============================================================
CREATE INDEX IF NOT EXISTS `idx_member_role`       ON `member` (`role`);
CREATE INDEX IF NOT EXISTS `idx_member_created_at` ON `member` (`created_at`);
