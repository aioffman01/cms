<?php
/**
 * CMS 스키마 업데이트 스크립트 (V6: Inspection 테이블 및 매핑 테이블 추가)
 * http://localhost:8711/setup_v6.php
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

// 1. 신규 테이블 생성 DDL 실행
$sqlFiles = ['inspection.tbl.sql'];
foreach ($sqlFiles as $file) {
    $path = $basePath . '/table/' . $file;
    if (!file_exists($path)) { $logs[] = "⚠ 파일 없음: $file"; continue; }
    try {
        $pdo->exec(file_get_contents($path));
        $logs[] = "✓ 테이블 생성/확인: $file";
    } catch (Throwable $e) {
        $logs[] = "✕ 오류 ($file): " . $e->getMessage();
    }
}

// 2. 인덱스 생성
$idxFiles = ['inspection.idx.sql'];
foreach ($idxFiles as $file) {
    $path = $basePath . '/table/' . $file;
    if (!file_exists($path)) continue;
    try {
        $sql = file_get_contents($path);
        foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
            if ($stmt) {
                try { $pdo->exec($stmt); } catch (Throwable $ie) { /* 무시 */ }
            }
        }
        $logs[] = "✓ 인덱스 생성/확인: $file";
    } catch (Throwable $e) {
        $logs[] = "⚠ 인덱스 ($file): " . $e->getMessage();
    }
}

// 3. 초기값 삽입 (데이터가 없을 때만)
$stmt = $pdo->query('SELECT COUNT(*) FROM `inspection`');
if ((int)$stmt->fetchColumn() === 0) {
    $path = $basePath . '/table/inspection.value.sql';
    if (file_exists($path)) {
        try {
            $pdo->exec(file_get_contents($path));
            $logs[] = "✓ 점검 초기 데이터 삽입 완료";
        } catch (Throwable $e) {
            $logs[] = "✕ 점검 초기 데이터 오류: " . $e->getMessage();
        }
    }
} else {
    $logs[] = "ℹ 점검 데이터가 이미 존재하여 초기화 스킵";
}

?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>CMS V6 스키마 업데이트</title>
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
    <h1>CMS V6 스키마 업데이트 완료</h1>
    <?php foreach ($logs as $log): ?>
      <div class="log <?= str_contains($log, '✓') ? 'ok' : (str_contains($log, '✕') ? 'err' : '') ?>">
        <?= htmlspecialchars($log) ?>
      </div>
    <?php endforeach; ?>
    <a href="index.html" class="btn">시스템으로 이동</a>
  </div>
</body>
</html>
