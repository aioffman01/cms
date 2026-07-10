<?php
/**
 * GET /backend/customer/list.php
 * 고객 목록 조회
 * - 일반 사용자: 숨김 고객 제외
 * - 관리자: 전체 포함
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/CustomerSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

try {
    $customerSQL   = new CustomerSQL(DB::getInstance());
    $includeHidden = Auth::isAdmin();
    $customers     = $customerSQL->listAll($includeHidden);

    // 관리자에게는 통계도 함께 반환
    $extra = [];
    if ($includeHidden) {
        $extra['stats'] = $customerSQL->getStats();
    }

    Response::success(array_merge(['customers' => $customers], $extra));
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
