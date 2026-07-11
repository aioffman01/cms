-- ============================================================
-- inspection 초기 샘플 데이터
-- ============================================================
INSERT INTO `inspection` (`id`, `customer_id`, `planned_start_date`, `planned_end_date`, `plan_content`, `actual_start_date`, `actual_end_date`, `report_content`, `status`, `created_by`) VALUES
(1, 1, '2026-07-15', '2026-07-16', '서버 데이터베이스 최적화 점검 및 디스크 용량 모니터링', NULL, NULL, NULL, 'scheduled', 1),
(2, 1, '2026-07-05', '2026-07-05', '정기 시스템 부하 테스트 및 보안 업데이트 적용', '2026-07-05', '2026-07-05', '패치 적용 완료 및 특이사항 없음', 'completed', 1);

INSERT INTO `inspection_member` (`inspection_id`, `member_id`) VALUES
(1, 1),
(1, 2),
(2, 1);
