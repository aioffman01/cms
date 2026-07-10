<?php
/**
 * PUT /backend/customer/hide.php
 * [관리자] 고객 숨김/표시 설정
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/CustomerSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('PUT 요청만 허용됩니다.', 405);
}

$input    = json_decode(file_get_contents('php://input'), true) ?? [];
$id       = (int) ($input['id'] ?? 0);
$isHidden = (bool) ($input['is_hidden'] ?? false);

if ($id <= 0) {
    Response::error('유효하지 않은 요청입니다.');
}

try {
    $customerSQL = new CustomerSQL(DB::getInstance());

    if (!$customerSQL->exists($id)) {
        Response::error('존재하지 않는 고객입니다.', 404);
    }

    $customerSQL->setHidden($id, $isHidden);
    $msg = $isHidden ? '고객이 숨김 처리되었습니다.' : '고객이 표시 처리되었습니다.';
    Response::success(['is_hidden' => $isHidden], $msg);
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
