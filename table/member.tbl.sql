-- ============================================================
-- 회원(member) 테이블 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS `member` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT        COMMENT '회원 고유 ID',
    `login_id`   VARCHAR(50)  NOT NULL                       COMMENT '로그인 아이디',
    `password`   VARCHAR(255) NOT NULL                       COMMENT '비밀번호 (bcrypt)',
    `name`       VARCHAR(100) NOT NULL                       COMMENT '이름',
    `role`       ENUM('admin','user') NOT NULL DEFAULT 'user' COMMENT '역할 (admin=관리자, user=일반사용자)',
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_member_login_id` (`login_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='회원 테이블';
