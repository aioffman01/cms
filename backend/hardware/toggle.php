<?php
/**
 * PUT /backend/hardware/toggle.php
 * [관리자] 하드웨어 활성/비활성 토글
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/HardwareSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') Response::error('PUT만 허용됩니다.', 405);

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$id    = (int)($input['id'] ?? 0);
if ($id <= 0) Response::error('유효하지 않은 ID입니다.');

try {
    $hwSQL = new HardwareSQL(DB::getInstance());
    if (!$hwSQL->exists($id)) Response::error('존재하지 않는 하드웨어입니다.', 404);

    $hwSQL->toggleActive($id);
    $hw  = $hwSQL->findById($id);
    $msg = $hw['is_active'] ? '활성화되었습니다.' : '비활성화되었습니다.';
    Response::success(['is_active' => (bool)$hw['is_active']], $msg);
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
