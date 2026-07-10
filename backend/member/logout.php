<?php
/**
 * POST /backend/member/logout.php
 * 로그아웃
 */
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';

header('Content-Type: application/json; charset=utf-8');

Auth::logout();
Response::success(null, '로그아웃되었습니다.');
