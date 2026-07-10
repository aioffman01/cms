<?php
/**
 * GET /backend/member/me.php
 * 현재 로그인 사용자 정보 조회
 */
require_once __DIR__ . '/../../common/Auth.php';
require_once __DIR__ . '/../../common/Response.php';

header('Content-Type: application/json; charset=utf-8');

Auth::requireLogin();

Response::success(Auth::getUser());
