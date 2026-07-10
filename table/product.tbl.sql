-- ============================================================
-- product 테이블 생성
-- customer 1개에 product 복수 연결
-- ============================================================
CREATE TABLE IF NOT EXISTS `product` (
    `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT          COMMENT '판매 제품 고유 ID',
    `customer_id`  INT UNSIGNED NOT NULL                         COMMENT '고객 ID (FK)',
    `hardware_id`  INT UNSIGNED NULL     DEFAULT NULL            COMMENT '연결 하드웨어 ID (선택, FK)',
    `model_name`   VARCHAR(200) NOT NULL                         COMMENT '제품 모델명',
    `license`      VARCHAR(500) NOT NULL DEFAULT ''              COMMENT '라이센스',
    `os_type`      VARCHAR(100) NOT NULL DEFAULT ''              COMMENT '설치 OS',
    `installed_at` DATE         NULL     DEFAULT NULL            COMMENT '설치일',
    `created_by`   INT UNSIGNED NOT NULL                         COMMENT '등록자 회원 ID',
    `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_product_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_product_hardware` FOREIGN KEY (`hardware_id`) REFERENCES `hardware` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_product_member`   FOREIGN KEY (`created_by`)  REFERENCES `member`   (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='판매 제품 테이블';
