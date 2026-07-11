<?php
/**
 * GET /backend/inspection/list.php
 * 점검 목록 조회 (필터링 지원)
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/InspectionSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

$filters = [
    'customer_id' => !empty($_GET['customer_id']) ? (int)$_GET['customer_id'] : null,
    'status'      => !empty($_GET['status']) ? trim($_GET['status']) : null,
    'member_id'   => !empty($_GET['member_id']) ? (int)$_GET['member_id'] : null,
];

try {
    $list = (new InspectionSQL(DB::getInstance()))->list($filters);
    Response::success($list);
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
