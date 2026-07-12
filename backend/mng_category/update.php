<?php
/**
 * PUT /backend/mng_category/update.php
 * 대항목 수정
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/MngCategorySQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('PUT 또는 POST 요청만 허용됩니다.', 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$id    = isset($input['id']) ? (int)$input['id'] : 0;
$code  = strtoupper(trim($input['code'] ?? ''));
$name  = trim($input['name'] ?? '');
$isUse = trim($input['is_use'] ?? 'Y');
$desc  = trim($input['description'] ?? '');

if ($id <= 0) {
    Response::error('잘못된 요청입니다. ID가 누락되었습니다.');
}
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
    
    // 대상 존재 확인
    $existing = $categorySQL->findById($id);
    if (!$existing) {
        Response::error('존재하지 않는 대항목입니다.');
    }

    // 코드 변경 시 중복 검사
    if ($existing['code'] !== $code) {
        if ($categorySQL->findByCode($code)) {
            Response::error('이미 사용 중인 대항목 코드입니다.');
        }
    }

    $success = $categorySQL->update($id, [
        'code'        => $code,
        'name'        => $name,
        'is_use'      => $isUse,
        'description' => $desc
    ]);

    if ($success) {
        Response::success(null, '대항목 정보가 성공적으로 수정되었습니다.');
    } else {
        Response::error('수정에 실패했습니다.');
    }
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
