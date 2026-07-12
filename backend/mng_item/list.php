<?php
/**
 * GET /backend/mng_item/list.php
 * 특정 대항목의 세부 항목 목록 조회
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/MngItemSQL.php';
require_once __DIR__ . '/../../lib_sql/MngCategorySQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

$categoryId   = isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0;
$categoryCode = isset($_GET['category_code']) ? trim($_GET['category_code']) : '';
$isUse        = $_GET['is_use'] ?? null;

try {
    $db = DB::getInstance();
    if ($categoryId <= 0 && $categoryCode !== '') {
        $categorySQL = new MngCategorySQL($db);
        $cat = $categorySQL->findByCode($categoryCode);
        if ($cat) {
            $categoryId = $cat['id'];
        }
    }

    if ($categoryId <= 0) {
        Response::error('대항목 ID(category_id) 또는 대항목 코드(category_code)가 유효하지 않습니다.');
    }

    $itemSQL = new MngItemSQL($db);
    $items = $itemSQL->listByCategory($categoryId, $isUse);
    Response::success($items);
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
