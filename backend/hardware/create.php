<?php
/**
 * POST /backend/hardware/create.php
 * [관리자] 하드웨어 등록
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/HardwareSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') Response::error('POST만 허용됩니다.', 405);

$input     = json_decode(file_get_contents('php://input'), true) ?? [];
$modelName = trim($input['model_name'] ?? '');

if ($modelName === '') Response::error('모델명은 필수 항목입니다.');

$user = Auth::getUser();

try {
    $id = (new HardwareSQL(DB::getInstance()))->create([
        'model_name'  => $modelName,
        'cpu_count'   => (int)($input['cpu_count'] ?? 0),
        'disk_tb'     => (float)($input['disk_tb'] ?? 0),
        'nic_count'   => (int)($input['nic_count'] ?? 0),
        'note'        => trim($input['note'] ?? ''),
        'created_by'  => $user['id'],
    ]);
    Response::success(['id' => $id], '하드웨어가 등록되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
