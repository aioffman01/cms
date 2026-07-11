<?php
/**
 * CMS 스키마 업데이트 스크립트 (V7: planned_date, actual_date를 시작/종료일 기간제로 변경)
 * http://localhost:8711/setup_v7.php
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

// 1. 컬럼 변경 및 추가
try {
    // planned_date 컬럼이 있는지 확인
    $stmt = $pdo->query("SHOW COLUMNS FROM `inspection` LIKE 'planned_date'");
    $plannedDateCol = $stmt->fetch();

    if ($plannedDateCol) {
        $pdo->exec("ALTER TABLE `inspection` CHANGE `planned_date` `planned_start_date` DATE NOT NULL COMMENT '점검 계획 시작일'");
        $logs[] = "✓ planned_date 컬럼을 planned_start_date 컬럼으로 변경 완료.";
    } else {
        $logs[] = "ℹ planned_date 컬럼이 존재하지 않거나 이미 변경되었습니다.";
    }

    // planned_end_date 컬럼 확인 및 추가
    $stmt = $pdo->query("SHOW COLUMNS FROM `inspection` LIKE 'planned_end_date'");
    $plannedEndDateCol = $stmt->fetch();
    if (!$plannedEndDateCol) {
        $pdo->exec("ALTER TABLE `inspection` ADD `planned_end_date` DATE NULL DEFAULT NULL COMMENT '점검 계획 종료일' AFTER `planned_start_date`");
        $logs[] = "✓ planned_end_date 컬럼이 추가되었습니다.";
    } else {
        $logs[] = "ℹ planned_end_date 컬럼이 이미 존재합니다.";
    }

    // actual_date 컬럼이 있는지 확인
    $stmt = $pdo->query("SHOW COLUMNS FROM `inspection` LIKE 'actual_date'");
    $actualDateCol = $stmt->fetch();
    if ($actualDateCol) {
        $pdo->exec("ALTER TABLE `inspection` CHANGE `actual_date` `actual_start_date` DATE NULL DEFAULT NULL COMMENT '실제 점검 시작일'");
        $logs[] = "✓ actual_date 컬럼을 actual_start_date 컬럼으로 변경 완료.";
    } else {
        $logs[] = "ℹ actual_date 컬럼이 존재하지 않거나 이미 변경되었습니다.";
    }

    // actual_end_date 컬럼 확인 및 추가
    $stmt = $pdo->query("SHOW COLUMNS FROM `inspection` LIKE 'actual_end_date'");
    $actualEndDateCol = $stmt->fetch();
    if (!$actualEndDateCol) {
        $pdo->exec("ALTER TABLE `inspection` ADD `actual_end_date` DATE NULL DEFAULT NULL COMMENT '실제 점검 종료일' AFTER `actual_start_date`");
        $logs[] = "✓ actual_end_date 컬럼이 추가되었습니다.";
    } else {
        $logs[] = "ℹ actual_end_date 컬럼이 이미 존재합니다.";
    }

    // 2. 기존 데이터 보존을 위한 값 복사
    $pdo->exec("UPDATE `inspection` SET `planned_end_date` = `planned_start_date` WHERE `planned_end_date` IS NULL");
    $pdo->exec("UPDATE `inspection` SET `actual_end_date` = `actual_start_date` WHERE `actual_start_date` IS NOT NULL AND `actual_end_date` IS NULL");
    $logs[] = "✓ 기존 데이터의 예정/완료 종료일을 시작일 정보로 동기화 적재 완료.";

} catch (Throwable $e) {
    $logs[] = "✕ 컬럼 변경/추가 오류: " . $e->getMessage();
}

?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>CMS V7 스키마 업데이트</title>
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
    <h1>CMS V7 스키마 업데이트 완료</h1>
    <?php foreach ($logs as $log): ?>
      <div class="log <?= str_contains($log, '✓') ? 'ok' : (str_contains($log, '✕') ? 'err' : '') ?>">
        <?= htmlspecialchars($log) ?>
      </div>
    <?php endforeach; ?>
    <a href="index.html" class="btn">시스템으로 이동</a>
  </div>
</body>
</html>
