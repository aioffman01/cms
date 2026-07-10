-- ============================================================
-- product 테이블 초기 샘플 데이터 (setup_v2.php 실행 후)
-- ============================================================
-- 고객 ID 1에 대한 샘플 제품
INSERT INTO `product` (`customer_id`, `hardware_id`, `model_name`, `license`, `os_type`, `installed_at`, `created_by`) VALUES
(1, 1, 'CMS Enterprise v2.0', 'ENT-2024-XXXX-0001', 'Rocky Linux 9.2', '2024-01-15', 1),
(1, 2, 'Security Suite Pro',  'SEC-2024-YYYY-0002', 'Windows Server 2022', '2024-03-20', 1);
