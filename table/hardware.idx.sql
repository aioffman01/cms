-- ============================================================
-- hardware 테이블 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS `idx_hardware_is_active`  ON `hardware` (`is_active`);
CREATE INDEX IF NOT EXISTS `idx_hardware_model_name` ON `hardware` (`model_name`);
CREATE INDEX IF NOT EXISTS `idx_hardware_created_by` ON `hardware` (`created_by`);
