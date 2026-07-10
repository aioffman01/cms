<?php
/**
 * GET /backend/member/list.php
 * [관리자] 전체 회원 목록 조회
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/MemberSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireAdmin();

try {
    $memberSQL = new MemberSQL(DB::getInstance());
    Response::success($memberSQL->listAll());
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
