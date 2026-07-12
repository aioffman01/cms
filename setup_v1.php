<?php
/**
 * CMS 데이터베이스 초기화 스크립트 (1차 Release 버전 통합본)
 * http://localhost:8711/setup_v1.php
 */
header('Content-Type: text/html; charset=utf-8');
$basePath = __DIR__;

// ── 1. DB 연결 및 생성
try {
    $config = require $basePath . '/conf/database.php';
    $dsn = sprintf('mysql:host=%s;port=%d', $config['host'], $config['port']);
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    $dbname = $config['dbname'];
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$dbname}`");
    $pdo->exec("SET NAMES utf8mb4");
} catch (Throwable $e) {
    die('<div style="color:red;padding:20px"><b>DB 연결 및 생성 실패:</b> ' . htmlspecialchars($e->getMessage()) . '</div>');
}

$logs = [];

// ── 2. 기존 테이블 삭제 (외래키 체크 비활성화 후 의존관계 제거)
try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $tables = ['product_history', 'inspection_member', 'inspection', 'product', 'hardware', 'customer', 'member', 'mng_item', 'mng_category'];
    foreach ($tables as $tbl) {
        $pdo->exec("DROP TABLE IF EXISTS `{$tbl}`");
        $logs[] = "✓ 테이블 삭제 완료: {$tbl}";
    }
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
} catch (Throwable $e) {
    $logs[] = "✕ 테이블 Drop 오류: " . $e->getMessage();
}

// ── 3. 테이블 신규 재생성
$schemas = [];

// member
$schemas['member'] = "
CREATE TABLE `member` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '회원 고유 식별 번호',
  `login_id` VARCHAR(50) NOT NULL COMMENT '로그인 ID',
  `password` VARCHAR(255) NOT NULL COMMENT '해시 암호',
  `name` VARCHAR(100) NOT NULL COMMENT '이름',
  `role` VARCHAR(20) NOT NULL DEFAULT 'engineer' COMMENT '권한(admin, engineer)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_member_login_id` (`login_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

// customer
$schemas['customer'] = "
CREATE TABLE `customer` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '고객사 ID',
  `company_name` VARCHAR(200) NOT NULL COMMENT '회사명',
  `company_addr` VARCHAR(500) NOT NULL DEFAULT '' COMMENT '회사 주소',
  `contact_name` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '담당자 이름',
  `contact_phone` VARCHAR(20) NOT NULL DEFAULT '' COMMENT '담당자 연락처',
  `contact_email` VARCHAR(200) NOT NULL DEFAULT '' COMMENT '담당자 이메일',
  `description` TEXT NULL DEFAULT NULL COMMENT '고객 등록 기타 비고',
  `is_hidden` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '숨김 플래그 (0:노출, 1:숨김)',
  `created_by` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_company_name` (`company_name`),
  KEY `idx_customer_is_hidden` (`is_hidden`),
  KEY `idx_customer_created_at` (`created_at`),
  CONSTRAINT `fk_customer_member` FOREIGN KEY (`created_by`) REFERENCES `member` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";


// product
$schemas['product'] = "
CREATE TABLE `product` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '설치 제품 ID',
  `customer_id` INT UNSIGNED NOT NULL COMMENT '소속 고객 ID',
  `name` VARCHAR(255) NOT NULL COMMENT '설치 제품 이름',
  `model_name` VARCHAR(200) NOT NULL COMMENT '제품 모델명',
  `version` VARCHAR(500) NOT NULL DEFAULT '' COMMENT '제품 버전',
  `os_type` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '설치 OS',
  `installed_at` DATE NULL DEFAULT NULL COMMENT '설치 일자',
  `description` TEXT NULL DEFAULT NULL COMMENT '세부 비고 사항',
  `created_by` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prod_customer_id` (`customer_id`),
  KEY `idx_prod_installed_at` (`installed_at`),
  CONSTRAINT `fk_prod_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prod_member` FOREIGN KEY (`created_by`) REFERENCES `member` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

// mng_category
$schemas['mng_category'] = "
CREATE TABLE `mng_category` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '대항목 카테고리 ID',
  `code` VARCHAR(100) NOT NULL COMMENT '대항목 고유 코드 (HW, MAGUX_VER, OS)',
  `name` VARCHAR(255) NOT NULL COMMENT '대항목 이름',
  `description` TEXT NULL COMMENT '설명',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cat_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

// mng_item
$schemas['mng_item'] = "
CREATE TABLE `mng_item` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '세부 항목 ID',
  `category_id` INT UNSIGNED NOT NULL COMMENT '소속 대항목 ID',
  `code` VARCHAR(100) NOT NULL COMMENT '세부 항목 고유 코드',
  `name` VARCHAR(255) NOT NULL COMMENT '세부 항목 명칭',
  `is_use` ENUM('Y','N') NOT NULL DEFAULT 'Y' COMMENT '사용 플래그',
  `description` TEXT NULL DEFAULT NULL COMMENT '설명',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_item_code` (`code`),
  CONSTRAINT `fk_item_category` FOREIGN KEY (`category_id`) REFERENCES `mng_category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

// product_history
$schemas['product_history'] = "
CREATE TABLE `product_history` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '이력 고유 번호',
  `product_id` INT UNSIGNED NOT NULL COMMENT '대상 제품 ID',
  `old_version_code` VARCHAR(100) NULL DEFAULT NULL,
  `old_version_name` VARCHAR(255) NULL DEFAULT NULL,
  `new_version_code` VARCHAR(100) NULL DEFAULT NULL,
  `new_version_name` VARCHAR(255) NULL DEFAULT NULL,
  `old_os_code` VARCHAR(100) NULL DEFAULT NULL,
  `old_os_name` VARCHAR(255) NULL DEFAULT NULL,
  `new_os_code` VARCHAR(100) NULL DEFAULT NULL,
  `new_os_name` VARCHAR(255) NULL DEFAULT NULL,
  `notes` TEXT NULL DEFAULT NULL COMMENT '업그레이드 참고사항',
  `created_by` INT UNSIGNED NOT NULL COMMENT '작업 담당자 ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_history_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_member` FOREIGN KEY (`created_by`) REFERENCES `member` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

// inspection
$schemas['inspection'] = "
CREATE TABLE `inspection` (
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
";

// inspection_member
$schemas['inspection_member'] = "
CREATE TABLE `inspection_member` (
    `inspection_id` INT UNSIGNED NOT NULL                         COMMENT '점검 ID (FK)',
    `member_id`     INT UNSIGNED NOT NULL                         COMMENT '담당자 회원 ID (FK)',
    PRIMARY KEY (`inspection_id`, `member_id`),
    CONSTRAINT `fk_ins_member_inspection` FOREIGN KEY (`inspection_id`) REFERENCES `inspection` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ins_member_member`     FOREIGN KEY (`member_id`)     REFERENCES `member`     (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='점검 다중 담당자 매핑 테이블';
";

foreach ($schemas as $name => $sql) {
    try {
        $pdo->exec($sql);
        $logs[] = "✓ 테이블 생성 성공: {$name}";
    } catch (Throwable $e) {
        $logs[] = "✕ 테이블 생성 오류 ({$name}): " . $e->getMessage();
    }
}

// ── 4. 기초 고정 데이터 시딩 (Seed Data)
try {
    // 4-1. 관리자 회원 등록
    $adminPassHash = password_hash('admin1234', PASSWORD_BCRYPT, ['cost' => 12]);
    $stmt = $pdo->prepare("INSERT INTO `member` (`login_id`, `password`, `name`, `role`) VALUES ('admin', ?, '시스템 관리자', 'admin')");
    $stmt->execute([$adminPassHash]);
    $logs[] = "✓ 기초 데이터 삽입: 시스템 관리자 계정 생성 완료 (admin / admin1234)";

    // 4-2. 카테고리 대항목 추가
    $pdo->exec("INSERT INTO `mng_category` (`id`, `code`, `name`, `description`) VALUES
        (1, 'HW', '하드웨어', '서버 제조사 및 장비 계열 정보'),
        (2, 'MAGUX_VER', '제품 버젼', 'Magux 소프트웨어 업그레이드 배포 버전'),
        (3, 'OS', '설치 OS', '서버 환경 구성 인프라 OS')");
    $logs[] = "✓ 기초 데이터 삽입: 대항목 카테고리 3종 (HW, MAGUX_VER, OS) 등록 완료";

    // 4-3. 세부 코드 항목 추가
    $pdo->exec("INSERT INTO `mng_item` (`category_id`, `code`, `name`, `is_use`) VALUES
        (1, 'M1', 'SuperServer 1U-A100', 'Y'),
        (1, 'M2', 'PowerEdge R750', 'Y'),
        (1, 'M3', 'ProLiant DL380 Gen10', 'Y'),
        (2, 'V1.0', 'Magux V1.0', 'Y'),
        (2, 'V2.0', 'Magux V2.0', 'Y'),
        (2, 'V3.0', 'Magux V3.0', 'Y'),
        (3, 'ROCKY9', 'Rocky Linux 9.2', 'Y'),
        (3, 'CENTOS7', 'CentOS 7', 'Y'),
        (3, 'WIN2022', 'Windows Server 2022', 'Y')");
    $logs[] = "✓ 기초 데이터 삽입: 세부 코드 항목 9종 등록 완료";


} catch (Throwable $e) {
    $logs[] = "✕ 기초 데이터 씨드 삽입 오류: " . $e->getMessage();
}

?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>CMS 1차 Release 데이터베이스 초기화</title>
  <style>
    body { background: #030712; color: #f3f4f6; font-family: monospace; padding: 40px; }
    .card { border: 1px solid rgba(255,255,255,0.08); background: #111827; padding: 28px; max-width: 650px; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    h1 { color: #14b8a6; margin-bottom: 20px; font-size: 22px; font-weight: 800; }
    .log { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; }
    .ok { color: #10b981; }
    .err { color: #ef4444; }
    .btn { display: inline-block; margin-top: 24px; padding: 10px 24px; background: #14b8a6; color: #030712; text-decoration: none; font-weight: bold; border-radius: 4px; }
    .btn:hover { background: #0d9488; }
  </style>
</head>
<body>
  <div class="card">
    <h1>CMS 1차 Release DB 초기화 수행 리포트</h1>
    <?php foreach ($logs as $log): ?>
      <div class="log <?= str_contains($log, '✓') ? 'ok' : (str_contains($log, '✕') ? 'err' : '') ?>">
        <?= htmlspecialchars($log) ?>
      </div>
    <?php endforeach; ?>
    <a href="index.html" class="btn">시스템 메인으로</a>
  </div>
</body>
</html>
