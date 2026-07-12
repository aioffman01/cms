<?php
/**
 * POST /backend/mng_category/create.php
 * 대항목 등록
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/MngCategorySQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('POST 요청만 허용됩니다.', 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$code  = strtoupper(trim($input['code'] ?? ''));
$name  = trim($input['name'] ?? '');
$isUse = trim($input['is_use'] ?? 'Y');
$desc  = trim($input['description'] ?? '');

if ($code === '') {
    Response::error('대항목 코드는 필수 항목입니다.');
}
if (!preg_match('/^[A-Z0-9_-]+$/', $code)) {
    Response::error('대항목 코드는 영문 대문자, 숫자, 하이픈(-), 언더바(_)만 사용 가능합니다.');
}
if ($name === '') {
    Response::error('대항목 이름은 필수 항목입니다.');
}

try {
    $categorySQL = new MngCategorySQL(DB::getInstance());
    
    // 코드 중복 검사
    if ($categorySQL->findByCode($code)) {
        Response::error('이미 사용 중인 대항목 코드입니다.');
    }

    $id = $categorySQL->create([
        'code'        => $code,
        'name'        => $name,
        'is_use'      => $isUse,
        'description' => $desc
    ]);

    Response::success(['id' => $id], '대항목이 성공적으로 등록되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
