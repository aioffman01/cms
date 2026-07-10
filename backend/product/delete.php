<?php
/**
 * DELETE /backend/product/delete.php
 * [관리자] 판매 제품 삭제
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/ProductSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') Response::error('DELETE만 허용됩니다.', 405);

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$id    = (int)($input['id'] ?? 0);
if ($id <= 0) Response::error('유효하지 않은 ID입니다.');

try {
    $productSQL = new ProductSQL(DB::getInstance());
    if (!$productSQL->exists($id)) Response::error('존재하지 않는 제품입니다.', 404);
    $productSQL->delete($id);
    Response::success(null, '제품이 삭제되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
