<?php
/**
 * PUT /backend/member/update.php
 * 내 정보 수정 (이름, 비밀번호)
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/MemberSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('PUT 요청만 허용됩니다.', 405);
}

$input    = json_decode(file_get_contents('php://input'), true) ?? [];
$user     = Auth::getUser();
$name     = trim($input['name'] ?? '');
$password = $input['password'] ?? '';

if ($name === '') {
    Response::error('이름은 필수 항목입니다.');
}

$hashedPw = null;
if ($password !== '') {
    if (strlen($password) < 6) {
        Response::error('비밀번호는 6자 이상이어야 합니다.');
    }
    $hashedPw = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

try {
    $memberSQL = new MemberSQL(DB::getInstance());
    $memberSQL->update($user['id'], $name, $hashedPw);

    // 세션 이름 즉시 반영
    Auth::start();
    $_SESSION['user_name'] = $name;

    Response::success(null, '정보가 수정되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
