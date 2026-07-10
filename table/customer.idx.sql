-- ============================================================
-- 고객 테이블 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS `idx_customer_is_hidden`    ON `customer` (`is_hidden`);
CREATE INDEX IF NOT EXISTS `idx_customer_created_by`   ON `customer` (`created_by`);
CREATE INDEX IF NOT EXISTS `idx_customer_company_name` ON `customer` (`company_name`);
CREATE INDEX IF NOT EXISTS `idx_customer_created_at`   ON `customer` (`created_at`);
