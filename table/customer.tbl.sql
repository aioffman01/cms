-- ============================================================
-- 고객(customer) 테이블 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS `customer` (
    `id`            INT UNSIGNED  NOT NULL AUTO_INCREMENT      COMMENT '고객 고유 ID',
    `company_name`  VARCHAR(200)  NOT NULL                     COMMENT '회사명',
    `company_addr`  VARCHAR(500)  NOT NULL DEFAULT ''          COMMENT '회사 주소',
    `contact_name`  VARCHAR(100)  NOT NULL DEFAULT ''          COMMENT '담당자 이름',
    `contact_phone` VARCHAR(20)   NOT NULL DEFAULT ''          COMMENT '담당자 전화번호',
    `contact_email` VARCHAR(200)  NOT NULL DEFAULT ''          COMMENT '담당자 이메일',
    `is_hidden`     TINYINT(1)    NOT NULL DEFAULT 0           COMMENT '숨김 여부 (0=표시, 1=숨김)',
    `created_by`    INT UNSIGNED  NOT NULL                     COMMENT '등록자 회원 ID',
    `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
    `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_customer_member` FOREIGN KEY (`created_by`) REFERENCES `member` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='고객 테이블';
