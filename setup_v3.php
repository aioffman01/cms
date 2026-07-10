<?php
/**
 * CMS 스키마 업데이트 스크립트 (V3: product 테이블에 os_type 컬럼 추가)
 * http://localhost:8711/setup_v3.php
 */
header('Content-Type: text/html; charset=utf-8');
$basePath = __DIR__;

try {
    $config = require $basePath . '/conf/database.php';
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $config['host'], $config['port'], $config['dbname'], $config['charset']);
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (Throwable $e) {
    die('<div style="color:red;padding:20px"><b>DB 연결 실패:</b> ' . htmlspecialchars($e->getMessage()) . '</div>');
}

$logs = [];

// 1. product 테이블에 os_type 컬럼 추가
try {
    // os_type 컬럼 존재 여부 확인
    $stmt = $pdo->query("SHOW COLUMNS FROM `product` LIKE 'os_type'");
    $columnExists = $stmt->fetch();

    if (!$columnExists) {
        $pdo->exec("ALTER TABLE `product` ADD `os_type` VARCHAR(100) NOT NULL DEFAULT '' COMMENT '설치 OS' AFTER `license`");
        $logs[] = "✓ product 테이블에 os_type 컬럼이 추가되었습니다.";
    } else {
        $logs[] = "ℹ product 테이블에 os_type 컬럼이 이미 존재합니다.";
    }
} catch (Throwable $e) {
    $logs[] = "✕ 컬럼 추가 오류: " . $e->getMessage();
}

// 2. 기존 샘플 데이터에 OS 정보 업데이트 (테스트용 편의 제공)
try {
    $pdo->exec("UPDATE `product` SET `os_type` = 'Rocky Linux 9.2' WHERE `model_name` = 'CMS Enterprise v2.0' AND `os_type` = ''");
    $pdo->exec("UPDATE `product` SET `os_type` = 'Windows Server 2022' WHERE `model_name` = 'Security Suite Pro' AND `os_type` = ''");
    $logs[] = "✓ 기존 데이터의 os_type 샘플 정보 업데이트 완료";
} catch (Throwable $e) {
    $logs[] = "⚠ 샘플 데이터 업데이트 경고: " . $e->getMessage();
}

?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>CMS V3 스키마 업데이트</title>
  <style>
    body { background: #000; color: #fff; font-family: monospace; padding: 40px; }
    .card { border: 1px solid #fff; padding: 24px; max-width: 600px; margin: 0 auto; }
    h1 { color: #ffff00; margin-bottom: 20px; }
    .log { padding: 5px 0; border-bottom: 1px solid #222; }
    .ok { color: #44ff88; }
    .err { color: #ff4444; }
    .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #ffff00; color: #000; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <h1>CMS V3 스키마 업데이트 완료</h1>
    <?php foreach ($logs as $log): ?>
      <div class="log <?= str_contains($log, '✓') ? 'ok' : (str_contains($log, '✕') ? 'err' : '') ?>">
        <?= htmlspecialchars($log) ?>
      </div>
    <?php endforeach; ?>
    <a href="index.php" class="btn">시스템으로 이동</a>
  </div>
</body>
</html>
