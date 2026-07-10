<?php
/**
 * GET /backend/hardware/get.php?id={id}
 * 하드웨어 단건 조회
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/HardwareSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) Response::error('유효하지 않은 ID입니다.');

try {
    $hw = (new HardwareSQL(DB::getInstance()))->findById($id);
    if (!$hw) Response::error('존재하지 않는 하드웨어입니다.', 404);
    Response::success($hw);
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
