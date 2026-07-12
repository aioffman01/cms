<?php
/**
 * PUT /backend/product/update.php
 * [관리자] 판매 제품 수정
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/ProductSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') Response::error('PUT만 허용됩니다.', 405);

$input     = json_decode(file_get_contents('php://input'), true) ?? [];
$id        = (int)($input['id'] ?? 0);
$modelName = trim($input['model_name'] ?? '');
$name      = trim($input['name'] ?? '');

if ($id <= 0 || $name === '' || $modelName === '') Response::error('유효하지 않은 요청입니다.');

try {
    $productSQL = new ProductSQL(DB::getInstance());
    if (!$productSQL->exists($id)) Response::error('존재하지 않는 제품입니다.', 404);

    $productSQL->update($id, [
        'name'         => $name,
        'model_name'   => $modelName,
        'version'      => trim($input['version']      ?? ''),
        'os_type'      => trim($input['os_type']      ?? ''),
        'installed_at' => trim($input['installed_at'] ?? ''),
        'description'  => trim($input['description']  ?? ''),
    ]);
    Response::success(null, '제품 정보가 수정되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
