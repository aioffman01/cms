-- ============================================================
-- product 테이블 초기 샘플 데이터 (setup_v2.php 실행 후)
-- ============================================================
-- 고객 ID 1에 대한 샘플 제품
INSERT INTO `product` (`customer_id`, `hardware_id`, `model_name`, `version`, `os_type`, `installed_at`, `description`, `created_by`) VALUES
(1, 1, 'CMS Enterprise v2.0', 'v2.0.4', 'Rocky Linux 9.2', '2024-01-15', '기본 서버에 설치됨', 1),
(1, 2, 'Security Suite Pro',  'v1.8.2', 'Windows Server 2022', '2024-03-20', '백업 서버에 설치됨', 1);
