<?php
/**
 * CMS 스키마 업데이트 스크립트 (V10: inspection 테이블에 title 컬럼 추가)
 * http://localhost:8711/setup_v10.php
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

try {
    // title 컬럼 존재 여부 확인 후 추가
    $stmt = $pdo->query("SHOW COLUMNS FROM `inspection` LIKE 'title'");
    $titleCol = $stmt->fetch();

    if (!$titleCol) {
        $pdo->exec("ALTER TABLE `inspection` ADD `title` VARCHAR(255) NOT NULL DEFAULT '정기 시스템 점검' COMMENT '점검 제목' AFTER `customer_id`");
        $logs[] = "✓ inspection 테이블에 title(점검 제목) 컬럼이 추가되었습니다.";
    } else {
        $logs[] = "ℹ title 컬럼이 이미 존재합니다.";
    }
} catch (Throwable $e) {
    $logs[] = "✕ 컬럼 추가 오류: " . $e->getMessage();
}

?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>CMS V10 스키마 업데이트</title>
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
    <h1>CMS V10 스키마 업데이트 완료</h1>
    <?php foreach ($logs as $log): ?>
      <div class="log <?= str_contains($log, '✓') ? 'ok' : (str_contains($log, '✕') ? 'err' : '') ?>">
        <?= htmlspecialchars($log) ?>
      </div>
    <?php endforeach; ?>
    <a href="index.html" class="btn">시스템으로 이동</a>
  </div>
</body>
</html>
