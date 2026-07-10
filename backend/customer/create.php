<?php
/**
 * POST /backend/customer/create.php
 * 고객 등록
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/CustomerSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('POST 요청만 허용됩니다.', 405);
}

$input       = json_decode(file_get_contents('php://input'), true) ?? [];
$user        = Auth::getUser();
$companyName = trim($input['company_name'] ?? '');

if ($companyName === '') {
    Response::error('회사명은 필수 항목입니다.');
}

try {
    $customerSQL = new CustomerSQL(DB::getInstance());
    $id = $customerSQL->create([
        'company_name'  => $companyName,
        'company_addr'  => trim($input['company_addr']  ?? ''),
        'contact_name'  => trim($input['contact_name']  ?? ''),
        'contact_phone' => trim($input['contact_phone'] ?? ''),
        'contact_email' => trim($input['contact_email'] ?? ''),
        'created_by'    => $user['id'],
    ]);

    Response::success(['id' => $id], '고객이 등록되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
