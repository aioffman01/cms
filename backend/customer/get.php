<?php
/**
 * GET /backend/customer/get.php?id={id}
 * 고객 상세 조회
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/CustomerSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    Response::error('유효하지 않은 고객 ID입니다.');
}

try {
    $customerSQL   = new CustomerSQL(DB::getInstance());
    $includeHidden = Auth::isAdmin();
    $customer      = $customerSQL->findById($id, $includeHidden);

    if (!$customer) {
        Response::error('존재하지 않는 고객입니다.', 404);
    }

    Response::success($customer);
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
