<?php
/**
 * POST /backend/inspection/create.php
 * 정기 점검 계획 등록
 */
require_once __DIR__ . '/../../common/DB.php';
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';
require_once __DIR__ . '/../../lib_sql/InspectionSQL.php';

header('Content-Type: application/json; charset=utf-8');
Auth::requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('POST 요청만 허용됩니다.', 405);
}

$input        = json_decode(file_get_contents('php://input'), true) ?? [];
$customerId   = (int)($input['customer_id'] ?? 0);
$title        = trim($input['title'] ?? '');
$plannedStartDate = trim($input['planned_start_date'] ?? '');
$plannedEndDate   = trim($input['planned_end_date'] ?? '');
$planContent      = trim($input['plan_content'] ?? '');
$memberIds        = $input['member_ids'] ?? []; // 담당자 배열
$user             = Auth::getUser();

if ($customerId <= 0) Response::error('고객사가 지정되지 않았습니다.');
if (empty($title)) Response::error('점검 제목을 입력해주세요.');
if (empty($plannedStartDate)) Response::error('점검 시작 예정일을 입력해주세요.');
if (empty($planContent)) Response::error('점검 계획 내용을 입력해주세요.');
if (!is_array($memberIds)) Response::error('담당자 형식이 올바르지 않습니다.');

if (empty($plannedEndDate)) {
    $plannedEndDate = $plannedStartDate;
}

try {
    $id = (new InspectionSQL(DB::getInstance()))->create([
        'customer_id'        => $customerId,
        'title'              => $title,
        'planned_start_date' => $plannedStartDate,
        'planned_end_date'   => $plannedEndDate,
        'plan_content'       => $planContent,
        'created_by'         => $user['id'],
    ], $memberIds);

    Response::success(['id' => $id], '점검 계획이 등록되었습니다.');
} catch (Throwable $e) {
    Response::error('서버 오류: ' . $e->getMessage(), 500);
}
