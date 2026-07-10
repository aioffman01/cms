-- ============================================================
-- product 테이블 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS `idx_product_customer_id` ON `product` (`customer_id`);
CREATE INDEX IF NOT EXISTS `idx_product_hardware_id` ON `product` (`hardware_id`);
CREATE INDEX IF NOT EXISTS `idx_product_installed_at` ON `product` (`installed_at`);
