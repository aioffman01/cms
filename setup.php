<?php
/**
 * ================================================================
 * CMS 초기 설정 스크립트
 * ================================================================
 * 브라우저에서 한 번만 실행하세요:
 *   http://your-server/setup.php
 *
 * 실행 후 보안을 위해 이 파일을 삭제하거나 접근을 차단하세요.
 * ================================================================
 */

// 헤더 설정
header('Content-Type: text/html; charset=utf-8');

$basePath = __DIR__;

// ── DB 연결
try {
    $config = require $basePath . '/conf/database.php';

    // DB 없이 접속해서 먼저 데이터베이스 생성
    $dsn = sprintf('mysql:host=%s;port=%d;charset=%s', $config['host'], $config['port'], $config['charset']);
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    // 데이터베이스 생성 (없으면)
    $dbname = $config['dbname'];
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$dbname}`");

} catch (Throwable $e) {
    die('<div style="color:red;font-family:monospace;padding:20px">
        <b>DB 연결 실패:</b> ' . htmlspecialchars($e->getMessage()) . '
        <p>conf/database.php 설정을 확인해주세요.</p>
    </div>');
}

$logs = [];

// ── 테이블 생성
$sqlFiles = [
    'member.tbl.sql',
    'customer.tbl.sql',
];

foreach ($sqlFiles as $file) {
    $path = $basePath . '/table/' . $file;
    if (!file_exists($path)) { $logs[] = "⚠ 파일 없음: $file"; continue; }
    try {
        $pdo->exec(file_get_contents($path));
        $logs[] = "✓ 테이블 생성: $file";
    } catch (Throwable $e) {
        $logs[] = "✕ 오류 ($file): " . $e->getMessage();
    }
}

// ── 인덱스 생성
$idxFiles = ['member.idx.sql', 'customer.idx.sql'];
foreach ($idxFiles as $file) {
    $path = $basePath . '/table/' . $file;
    if (!file_exists($path)) continue;
    try {
        // 인덱스는 이미 존재할 수 있으므로 개별 실행
        $sql = file_get_contents($path);
        foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
            if ($stmt) {
                try { $pdo->exec($stmt); } catch (Throwable $ie) { /* 이미 존재하는 경우 무시 */ }
            }
        }
        $logs[] = "✓ 인덱스 생성: $file";
    } catch (Throwable $e) {
        $logs[] = "⚠ 인덱스 ($file): " . $e->getMessage();
    }
}

// ── 관리자 계정 생성
$adminLoginId = 'admin';
$adminPass    = 'admin1234';
$adminName    = '관리자';

$stmt = $pdo->prepare('SELECT COUNT(*) FROM `member` WHERE `login_id` = ?');
$stmt->execute([$adminLoginId]);
$exists = (int) $stmt->fetchColumn() > 0;

if (!$exists) {
    $hash = password_hash($adminPass, PASSWORD_BCRYPT, ['cost' => 12]);
    $stmt = $pdo->prepare(
        "INSERT INTO `member` (`login_id`, `password`, `name`, `role`) VALUES (?, ?, ?, 'admin')"
    );
    $stmt->execute([$adminLoginId, $hash, $adminName]);
    $logs[] = "✓ 관리자 계정 생성 완료 (ID: admin / PW: admin1234)";
} else {
    $logs[] = "ℹ 관리자 계정이 이미 존재합니다.";
}

// ── HTML 출력
?>
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>CMS 초기 설정</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #000; color: #fff; font-family: 'Courier New', monospace; padding: 40px 20px; min-height: 100vh; }
    h1   { color: #ffff00; font-size: 32px; letter-spacing: 8px; margin-bottom: 6px; }
    .sub { color: #555; font-size: 12px; letter-spacing: 3px; margin-bottom: 40px; }
    .card { border: 1px solid #fff; padding: 24px; max-width: 600px; margin: 0 auto; }
    .card-title { color: #00ffff; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; border-bottom: 1px solid #333; padding-bottom: 8px; }
    .log-item { padding: 7px 0; border-bottom: 1px solid #111; font-size: 13px; }
    .log-item.ok   { color: #44ff88; }
    .log-item.warn { color: #ffaa00; }
    .log-item.err  { color: #ff4444; }
    .log-item.info { color: #aaa; }
    .creds { margin-top: 24px; padding: 16px; border: 1px solid #ffff00; }
    .creds-title { color: #ffff00; font-size: 11px; letter-spacing: 2px; margin-bottom: 10px; }
    .cred-row { display: flex; gap: 16px; font-size: 13px; padding: 4px 0; }
    .cred-label { color: #555; width: 80px; }
    .cred-value { color: #ffff00; font-weight: bold; }
    .btn { display: inline-block; margin-top: 24px; padding: 12px 28px; background: #ffff00; color: #000; font-weight: bold; text-decoration: none; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; }
    .btn:hover { background: #000; color: #ffff00; border: 2px solid #ffff00; }
    .warn-box { margin-top: 20px; border: 1px solid #ff4444; padding: 14px; color: #ff4444; font-size: 12px; }
    .center { text-align: center; }
  </style>
</head>
<body>
  <div class="center" style="margin-bottom:32px">
    <div style="font-size:32px;font-weight:900;color:#ffff00;letter-spacing:8px">CMS</div>
    <div style="font-size:10px;color:#555;letter-spacing:3px;margin-top:4px">초기 설정 완료</div>
  </div>

  <div class="card">
    <div class="card-title">설정 결과</div>
    <?php foreach ($logs as $log): ?>
      <?php
        $cls = 'info';
        if (str_starts_with($log, '✓')) $cls = 'ok';
        elseif (str_starts_with($log, '✕')) $cls = 'err';
        elseif (str_starts_with($log, '⚠')) $cls = 'warn';
      ?>
      <div class="log-item <?= $cls ?>"><?= htmlspecialchars($log) ?></div>
    <?php endforeach; ?>

    <div class="creds">
      <div class="creds-title">기본 관리자 계정</div>
      <div class="cred-row"><span class="cred-label">아이디</span><span class="cred-value">admin</span></div>
      <div class="cred-row"><span class="cred-label">비밀번호</span><span class="cred-value">admin1234</span></div>
    </div>

    <div class="warn-box">
      ⚠ 보안 주의: 초기 설정 완료 후 반드시 비밀번호를 변경하고,
      이 파일(setup.php)을 삭제하거나 서버 설정으로 접근을 차단하세요.
    </div>

    <div class="center">
      <a class="btn" href="index.php">로그인 화면으로 이동</a>
    </div>
  </div>
</body>
</html>
