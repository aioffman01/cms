<?php
/**
 * PUT /backend/product/upgrade.php
 * [관리자] 판매 제품 버전/OS 업그레이드
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/ProductSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') Response::error('PUT만 허용됩니다.', 405);

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$id    = (int)($input['id'] ?? 0);

if ($id <= 0) Response::error('유효하지 않은 제품 ID입니다.');

try {
    $productSQL = new ProductSQL(DB::getInstance());
    $oldProduct = $productSQL->findById($id);
    if (!$oldProduct) Response::error('존재하지 않는 제품입니다.', 404);

    $oldVer = $oldProduct['version'];
    $newVer = trim($input['version'] ?? '');
    $oldOs  = $oldProduct['os_type'];
    $newOs  = trim($input['os_type'] ?? '');

    if ($oldVer === $newVer && $oldOs === $newOs) {
        Response::error('변경할 버전이나 OS 정보가 기존 정보와 동일합니다.');
    }

    $notes = trim($input['notes'] ?? '');

    // 코드 조회 및 이력 생성
    $oldVerCode = $productSQL->getItemCode($oldVer, 'MAGUX_VER');
    $newVerCode = $productSQL->getItemCode($newVer, 'MAGUX_VER');
    $oldOsCode  = $productSQL->getItemCode($oldOs, 'OS');
    $newOsCode  = $productSQL->getItemCode($newOs, 'OS');
    
    $user = Auth::getUser();
    $productSQL->createHistory([
        'product_id'       => $id,
        'old_version_code' => $oldVerCode,
        'old_version_name' => $oldVer,
        'new_version_code' => $newVerCode,
        'new_version_name' => $newVer,
        'old_os_code'      => $oldOsCode,
        'old_os_name'      => $oldOs,
        'new_os_code'      => $newOsCode,
        'new_os_name'      => $newOs,
        'notes'            => $notes !== '' ? $notes : null,
        'created_by'       => $user['id']
    ]);

    // 실제 테이블 업데이트
    $productSQL->upgrade($id, $newVer, $newOs);

    Response::success(null, '제품 업그레이드가 성공적으로 수행되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
