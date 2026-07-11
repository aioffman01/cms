-- ============================================================
-- inspection 테이블 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS `inspection` (
    `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT          COMMENT '점검 고유 ID',
    `customer_id`    INT UNSIGNED NOT NULL                         COMMENT '고객사 ID (FK)',
    `title`          VARCHAR(255) NOT NULL                         COMMENT '점검 제목',
    `planned_start_date` DATE NOT NULL                             COMMENT '점검 계획 시작일',
    `planned_end_date`   DATE NULL         DEFAULT NULL            COMMENT '점검 계획 종료일',
    `plan_content`       TEXT NOT NULL                             COMMENT '점검 계획 내용',
    `actual_start_date`  DATE NULL         DEFAULT NULL            COMMENT '실제 점검 시작일 (완료 시)',
    `actual_end_date`    DATE NULL         DEFAULT NULL            COMMENT '실제 점검 종료일 (완료 시)',
    `report_content`     TEXT NULL         DEFAULT NULL            COMMENT '점검 결과 보고서',
    `issues`             TEXT NULL         DEFAULT NULL            COMMENT '이슈사항',
    `status`         ENUM('scheduled', 'completed') NOT NULL DEFAULT 'scheduled' COMMENT '점검 상태 (예정/완료)',
    `created_by`     INT UNSIGNED NOT NULL                         COMMENT '등록자 회원 ID (FK)',
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_inspection_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_inspection_creator`  FOREIGN KEY (`created_by`)  REFERENCES `member`   (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='제품 점검 관리 테이블';

-- ============================================================
-- inspection_member 테이블 생성 (다중 담당자 매핑)
-- ============================================================
CREATE TABLE IF NOT EXISTS `inspection_member` (
    `inspection_id` INT UNSIGNED NOT NULL                         COMMENT '점검 ID (FK)',
    `member_id`     INT UNSIGNED NOT NULL                         COMMENT '담당자 회원 ID (FK)',
    PRIMARY KEY (`inspection_id`, `member_id`),
    CONSTRAINT `fk_ins_member_inspection` FOREIGN KEY (`inspection_id`) REFERENCES `inspection` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ins_member_member`     FOREIGN KEY (`member_id`)     REFERENCES `member`     (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='점검 다중 담당자 매핑 테이블';
