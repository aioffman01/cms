<?php
/**
 * GET /backend/mng_category/list.php
 * 대항목 목록 조회
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/MngCategorySQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

$isUse = $_GET['is_use'] ?? null;

try {
    $categorySQL = new MngCategorySQL(DB::getInstance());
    $categories = $categorySQL->listAll($isUse);
    Response::success($categories);
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
