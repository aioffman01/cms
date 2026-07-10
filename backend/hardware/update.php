<?php
/**
 * PUT /backend/hardware/update.php
 * [관리자] 하드웨어 수정
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/HardwareSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') Response::error('PUT만 허용됩니다.', 405);

$input     = json_decode(file_get_contents('php://input'), true) ?? [];
$id        = (int)($input['id'] ?? 0);
$modelName = trim($input['model_name'] ?? '');

if ($id <= 0 || $modelName === '') Response::error('유효하지 않은 요청입니다.');

try {
    $hwSQL = new HardwareSQL(DB::getInstance());
    if (!$hwSQL->exists($id)) Response::error('존재하지 않는 하드웨어입니다.', 404);

    $hwSQL->update($id, [
        'model_name' => $modelName,
        'cpu_count'  => (int)($input['cpu_count'] ?? 0),
        'disk_tb'    => (float)($input['disk_tb'] ?? 0),
        'nic_count'  => (int)($input['nic_count'] ?? 0),
        'note'       => trim($input['note'] ?? ''),
    ]);
    Response::success(null, '하드웨어 정보가 수정되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
