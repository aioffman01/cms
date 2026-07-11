<?php
/**
 * GET /backend/inspection/get.php
 * 점검 단건 정보 조회
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/InspectionSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) Response::error('유효하지 않은 요청입니다.');

try {
    $inspection = (new InspectionSQL(DB::getInstance()))->findById($id);
    if (!$inspection) {
        Response::error('존재하지 않는 점검 정보입니다.', 404);
    }
    Response::success($inspection);
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
