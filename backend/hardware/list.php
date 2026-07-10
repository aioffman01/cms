<?php
/**
 * GET  /backend/hardware/list.php
 * 하드웨어 목록 조회
 * - 관리자: 전체 (활성+비활성)
 * - 일반: 활성만
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/HardwareSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

try {
    $hwSQL      = new HardwareSQL(DB::getInstance());
    $activeOnly = !Auth::isAdmin();
    Response::success($hwSQL->listAll($activeOnly));
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
