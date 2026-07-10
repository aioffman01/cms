<?php
/**
 * DB 클래스 - PDO 싱글톤 연결 관리
 */
class DB
{
    private static ?PDO $instance = null;

    /**
     * PDO 인스턴스 반환 (싱글톤)
     */
    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $config = require __DIR__ . '/../conf/database.php';

            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $config['host'],
                $config['port'],
                $config['dbname'],
                $config['charset']
            );

            self::$instance = new PDO($dsn, $config['username'], $config['password'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        }

        return self::$instance;
    }

    /** 외부 직접 인스턴스화 방지 */
    private function __construct() {}
    private function __clone() {}
}
