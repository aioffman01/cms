-- ============================================================
-- hardware 테이블 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS `hardware` (
    `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT        COMMENT '하드웨어 고유 ID',
    `model_name`  VARCHAR(200)  NOT NULL                       COMMENT '모델명',
    `cpu_count`   INT UNSIGNED  NOT NULL DEFAULT 0             COMMENT 'CPU 갯수',
    `disk_tb`     DECIMAL(10,2) NOT NULL DEFAULT 0.00          COMMENT 'DISK 용량 (Tb)',
    `nic_count`   INT UNSIGNED  NOT NULL DEFAULT 0             COMMENT 'NIC card 갯수',
    `note`        TEXT          NOT NULL                       COMMENT '비고',
    `is_active`   TINYINT(1)    NOT NULL DEFAULT 1             COMMENT '활성 여부 (1=활성, 0=비활성)',
    `created_by`  INT UNSIGNED  NOT NULL                       COMMENT '등록자 회원 ID',
    `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_hardware_member` FOREIGN KEY (`created_by`) REFERENCES `member` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='하드웨어 제품 테이블';
