<?php
/**
 * Response 클래스 - JSON API 응답 공통 처리
 */
class Response
{
    /**
     * JSON 응답 출력 후 종료
     */
    public static function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        // CORS 허용 (동일 도메인 기준)
        header('X-Content-Type-Options: nosniff');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * 성공 응답
     */
    public static function success(mixed $data = null, string $message = '성공'): void
    {
        self::json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ]);
    }

    /**
     * 오류 응답
     */
    public static function error(string $message = '오류가 발생했습니다.', int $status = 400): void
    {
        self::json([
            'success' => false,
            'message' => $message,
        ], $status);
    }
}
