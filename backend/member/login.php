<?php
/**
 * POST /backend/member/login.php
 * 로그인
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/MemberSQL.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('POST 요청만 허용됩니다.', 405);
}

$input    = json_decode(file_get_contents('php://input'), true) ?? [];
$loginId  = trim($input['login_id'] ?? '');
$password = $input['password'] ?? '';

if ($loginId === '' || $password === '') {
    Response::error('아이디와 비밀번호를 입력해주세요.');
}

try {
    $memberSQL = new MemberSQL(DB::getInstance());
    $member    = $memberSQL->findByLoginId($loginId);

    // 타이밍 공격 방지: 회원이 없어도 password_verify 실행
    $dummyHash = '$2y$12$InvalidHashForTimingAttackPrevention00000000000000000';
    $hash      = $member['password'] ?? $dummyHash;

    if (!$member || !password_verify($password, $hash)) {
        Response::error('아이디 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    Auth::login($member);

    Response::success([
        'id'   => (int) $member['id'],
        'name' => $member['name'],
        'role' => $member['role'],
    ], '로그인되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
