<?php
/**
 * DELETE /backend/mng_category/delete.php
 * 대항목 삭제
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/MngCategorySQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('DELETE 또는 POST 요청만 허용됩니다.', 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$id    = isset($input['id']) ? (int)$input['id'] : 0;

if ($id <= 0) {
    Response::error('잘못된 요청입니다. ID가 누락되었습니다.');
}

try {
    $categorySQL = new MngCategorySQL(DB::getInstance());
    if (!$categorySQL->exists($id)) {
        Response::error('존재하지 않는 대항목입니다.');
    }

    $success = $categorySQL->delete($id);
    if ($success) {
        Response::success(null, '대항목이 성공적으로 삭제되었습니다.');
    } else {
        Response::error('삭제에 실패했습니다.');
    }
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
