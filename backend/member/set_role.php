<?php
/**
 * PUT /backend/member/set_role.php
 * [관리자] 회원 역할 변경
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/MemberSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('PUT 요청만 허용됩니다.', 405);
}

$input    = json_decode(file_get_contents('php://input'), true) ?? [];
$memberId = (int) ($input['member_id'] ?? 0);
$role     = $input['role'] ?? '';

if ($memberId <= 0 || !in_array($role, ['admin', 'worker', 'user'], true)) {
    Response::error('유효하지 않은 요청입니다.');
}

// 자기 자신 변경 방지
$currentUser = Auth::getUser();
if ($currentUser['id'] === $memberId) {
    Response::error('자기 자신의 역할은 변경할 수 없습니다.');
}

try {
    $memberSQL = new MemberSQL(DB::getInstance());
    $memberSQL->setRole($memberId, $role);
    Response::success(null, '역할이 변경되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
