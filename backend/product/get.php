<?php
/**
 * GET /backend/product/get.php?id={id}
 * 판매 제품 단건 조회
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/ProductSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) Response::error('유효하지 않은 ID입니다.');

try {
    $productSQL = new ProductSQL(DB::getInstance());
    $product = $productSQL->findById($id);
    if (!$product) Response::error('존재하지 않는 제품입니다.', 404);
    
    // 업그레이드 이력 조회 병합
    $product['history'] = $productSQL->findHistoryByProductId($id);
    
    Response::success($product);
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
