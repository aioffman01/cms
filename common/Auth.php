<?php
/**
 * Auth 클래스 - 세션 기반 인증 관리
 */
class Auth
{
    /** 세션 시작 */
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    /** 로그인 처리 (세션에 사용자 정보 저장) */
    public static function login(array $user): void
    {
        self::start();
        session_regenerate_id(true); // 세션 고정 공격 방지
        $_SESSION['user_id']   = (int) $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_role'] = $user['role'];
    }

    /** 로그아웃 처리 */
    public static function logout(): void
    {
        self::start();
        $_SESSION = [];

        // 세션 쿠키 삭제
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(), '', time() - 42000,
                $params['path'], $params['domain'],
                $params['secure'], $params['httponly']
            );
        }
        session_destroy();
    }

    /** 로그인 여부 확인 */
    public static function check(): bool
    {
        self::start();
        return isset($_SESSION['user_id']);
    }

    /** 로그인 필수 - 미로그인 시 401 반환 */
    public static function requireLogin(): void
    {
        if (!self::check()) {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'message' => '로그인이 필요합니다.'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    /** 관리자 권한 필수 - 권한 없으면 403 반환 */
    public static function requireAdmin(): void
    {
        self::requireLogin();
        if ($_SESSION['user_role'] !== 'admin') {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'message' => '관리자 권한이 필요합니다.'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    /** 현재 로그인 사용자 정보 반환 */
    public static function getUser(): ?array
    {
        self::start();
        if (!isset($_SESSION['user_id'])) {
            return null;
        }
        return [
            'id'   => $_SESSION['user_id'],
            'name' => $_SESSION['user_name'],
            'role' => $_SESSION['user_role'],
        ];
    }

    /** 관리자 여부 확인 */
    public static function isAdmin(): bool
    {
        self::start();
        return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
    }
}
