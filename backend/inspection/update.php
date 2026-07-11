<?php
/**
 * PUT /backend/inspection/update.php
 * 정기 점검 계획 수정 및 결과 보고서 작성
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/InspectionSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('PUT 요청만 허용됩니다.', 405);
}

$input         = json_decode(file_get_contents('php://input'), true) ?? [];
$id            = (int)($input['id'] ?? 0);
$title         = trim($input['title'] ?? '');
$plannedStartDate = trim($input['planned_start_date'] ?? '');
$plannedEndDate   = trim($input['planned_end_date'] ?? '');
$planContent      = trim($input['plan_content'] ?? '');
$actualStartDate  = trim($input['actual_start_date'] ?? '');
$actualEndDate    = trim($input['actual_end_date'] ?? '');
$reportContent    = trim($input['report_content'] ?? '');
$issues           = trim($input['issues'] ?? '');
$status           = trim($input['status'] ?? 'scheduled');
$memberIds        = $input['member_ids'] ?? [];

if ($id <= 0) Response::error('유효하지 않은 요청입니다.');
if (empty($title)) Response::error('점검 제목을 입력해주세요.');
if (empty($plannedStartDate)) Response::error('점검 계획 시작일을 입력해주세요.');
if (empty($planContent)) Response::error('점검 계획 내용을 입력해주세요.');
if (!is_array($memberIds)) Response::error('담당자 형식이 올바르지 않습니다.');

if (empty($plannedEndDate)) {
    $plannedEndDate = $plannedStartDate;
}

// 만약 완료 상태인데 완료일이 없으면 오늘 날짜 자동 지정
if ($status === 'completed') {
    if (empty($actualStartDate)) {
        $actualStartDate = date('Y-m-d');
    }
    if (empty($actualEndDate)) {
        $actualEndDate = $actualStartDate;
    }
}

try {
    $inspectionSQL = new InspectionSQL(DB::getInstance());
    $current = $inspectionSQL->findById($id);
    if (!$current) Response::error('존재하지 않는 점검 데이터입니다.', 404);

    $inspectionSQL->update($id, [
        'title'              => $title,
        'planned_start_date' => $plannedStartDate,
        'planned_end_date'   => $plannedEndDate,
        'plan_content'       => $planContent,
        'actual_start_date'  => !empty($actualStartDate) ? $actualStartDate : null,
        'actual_end_date'    => !empty($actualEndDate) ? $actualEndDate : null,
        'report_content'     => $reportContent,
        'issues'             => $issues,
        'status'             => $status,
    ], $memberIds);

    Response::success(null, '점검 정보가 저장되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
