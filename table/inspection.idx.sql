-- ============================================================
-- inspection 인덱스 생성
-- ============================================================
CREATE INDEX `idx_inspection_customer` ON `inspection` (`customer_id`);
CREATE INDEX `idx_inspection_planned_date` ON `inspection` (`planned_date`);
CREATE INDEX `idx_inspection_status` ON `inspection` (`status`);
