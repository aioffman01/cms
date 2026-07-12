<?php
/**
 * PUT /backend/customer/update.php
 * 고객 정보 수정
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/CustomerSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('PUT 요청만 허용됩니다.', 405);
}

$input       = json_decode(file_get_contents('php://input'), true) ?? [];
$id          = (int) ($input['id'] ?? 0);
$companyName = trim($input['company_name'] ?? '');

if ($id <= 0 || $companyName === '') {
    Response::error('유효하지 않은 요청입니다.');
}

try {
    $customerSQL = new CustomerSQL(DB::getInstance());

    if (!$customerSQL->exists($id)) {
        Response::error('존재하지 않는 고객입니다.', 404);
    }

    $customerSQL->update($id, [
        'company_name'  => $companyName,
        'company_addr'  => trim($input['company_addr']  ?? ''),
        'contact_name'  => trim($input['contact_name']  ?? ''),
        'contact_phone' => trim($input['contact_phone'] ?? ''),
        'contact_email' => trim($input['contact_email'] ?? ''),
        'description'   => trim($input['description']   ?? ''),
    ]);

    Response::success(null, '고객 정보가 수정되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
