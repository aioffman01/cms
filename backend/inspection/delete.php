<?php
/**
 * DELETE /backend/inspection/delete.php
 * 점검 정보 삭제
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/InspectionSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    Response::error('DELETE 요청만 허용됩니다.', 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$id    = (int)($input['id'] ?? 0);

if ($id <= 0) Response::error('유효하지 않은 요청입니다.');

try {
    $inspectionSQL = new InspectionSQL(DB::getInstance());
    if (!$inspectionSQL->findById($id)) {
        Response::error('존재하지 않는 점검 정보입니다.', 404);
    }

    $inspectionSQL->delete($id);
    Response::success(null, '점검 정보가 삭제되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
