<?php
/**
 * POST /backend/mng_item/create.php
 * 세부 항목 등록
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/MngItemSQL.php';
require_once __DIR__ . '/../../lib_sql/MngCategorySQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('POST 요청만 허용됩니다.', 405);
}

$input      = json_decode(file_get_contents('php://input'), true) ?? [];
$categoryId = isset($input['category_id']) ? (int)$input['category_id'] : 0;
$code       = strtoupper(trim($input['code'] ?? ''));
$name       = trim($input['name'] ?? '');
$isUse      = trim($input['is_use'] ?? 'Y');
$desc       = trim($input['description'] ?? '');

if ($categoryId <= 0) {
    Response::error('대상 대항목 지정(category_id)은 필수 항목입니다.');
}
if ($code === '') {
    Response::error('세부 항목 코드는 필수 항목입니다.');
}
if (!preg_match('/^[A-Z0-9_-]+$/', $code)) {
    Response::error('세부 항목 코드는 영문 대문자, 숫자, 하이픈(-), 언더바(_)만 사용 가능합니다.');
}
if ($name === '') {
    Response::error('세부 항목 이름은 필수 항목입니다.');
}

try {
    $db = DB::getInstance();
    $categorySQL = new MngCategorySQL($db);
    if (!$categorySQL->exists($categoryId)) {
        Response::error('지정한 대항목이 존재하지 않습니다.');
    }

    $itemSQL = new MngItemSQL($db);
    
    // 동일 대항목 내 코드 중복 검사
    if ($itemSQL->findByCategoryAndCode($categoryId, $code)) {
        Response::error('이 대항목 내에 이미 동일한 세부 항목 코드가 등록되어 있습니다.');
    }

    $id = $itemSQL->create([
        'category_id' => $categoryId,
        'code'        => $code,
        'name'        => $name,
        'is_use'      => $isUse,
        'description' => $desc
    ]);

    Response::success(['id' => $id], '세부 항목이 성공적으로 등록되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
