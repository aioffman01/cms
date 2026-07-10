-- ============================================================
-- hardware 테이블 초기 샘플 데이터
-- ============================================================
INSERT INTO `hardware` (`model_name`, `cpu_count`, `disk_tb`, `nic_count`, `note`, `is_active`, `created_by`) VALUES
('SuperServer 1U-A100', 2, 10.00, 2, '고성능 1U 서버', 1, 1),
('PowerEdge R750',      2, 20.00, 4, 'Dell 엔터프라이즈 서버', 1, 1),
('ProLiant DL380 Gen10',4, 15.00, 4, 'HPE 2U 서버', 1, 1);
