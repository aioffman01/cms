<?php
/**
 * POST /backend/member/register.php
 * 회원가입
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/MemberSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('POST 요청만 허용됩니다.', 405);
}

$input    = json_decode(file_get_contents('php://input'), true) ?? [];
$loginId  = trim($input['login_id'] ?? '');
$password = $input['password'] ?? '';
$name     = trim($input['name'] ?? '');

// 유효성 검사
if ($loginId === '' || $password === '' || $name === '') {
    Response::error('아이디, 비밀번호, 이름은 필수 항목입니다.');
}
if (strlen($loginId) < 4 || strlen($loginId) > 50) {
    Response::error('아이디는 4~50자여야 합니다.');
}
if (!preg_match('/^[a-zA-Z0-9_]+$/', $loginId)) {
    Response::error('아이디는 영문, 숫자, 밑줄(_)만 사용 가능합니다.');
}
if (strlen($password) < 6) {
    Response::error('비밀번호는 6자 이상이어야 합니다.');
}

try {
    $memberSQL = new MemberSQL(DB::getInstance());

    if ($memberSQL->loginIdExists($loginId)) {
        Response::error('이미 사용 중인 아이디입니다.');
    }

    $hashedPw = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    $id       = $memberSQL->create($loginId, $hashedPw, $name);

    Response::success(['id' => $id], '회원가입이 완료되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
