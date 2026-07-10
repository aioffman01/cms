<?php
/**
 * GET  /backend/product/list.php?customer_id={id}
 * 고객별 판매 제품 목록
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/ProductSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

$customerId = (int)($_GET['customer_id'] ?? 0);
if ($customerId <= 0) Response::error('customer_id가 필요합니다.');

try {
    $products = (new ProductSQL(DB::getInstance()))->listByCustomer($customerId);
    Response::success($products);
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
