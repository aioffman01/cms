<?php
/**
 * POST /backend/product/create.php
 * [관리자] 판매 제품 등록
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/ProductSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') Response::error('POST만 허용됩니다.', 405);

$input      = json_decode(file_get_contents('php://input'), true) ?? [];
$customerId = (int)($input['customer_id'] ?? 0);
$modelName  = trim($input['model_name'] ?? '');
$user       = Auth::getUser();

if ($customerId <= 0) Response::error('고객 ID가 필요합니다.');
if ($modelName === '') Response::error('제품 모델명은 필수 항목입니다.');

try {
    $id = (new ProductSQL(DB::getInstance()))->create([
        'customer_id'  => $customerId,
        'hardware_id'  => $input['hardware_id']  ?? null,
        'model_name'   => $modelName,
        'version'      => trim($input['version']      ?? ''),
        'os_type'      => trim($input['os_type']      ?? ''),
        'installed_at' => trim($input['installed_at'] ?? ''),
        'description'  => trim($input['description']  ?? ''),
        'created_by'   => $user['id'],
    ]);
    Response::success(['id' => $id], '제품이 등록되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
