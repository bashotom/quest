<?php
/**
 * MariaDB 10.11 specific configuration for Quest API
 * Copy this file to config.php and adjust your settings
 */

// MariaDB 10.11 optimized configuration
$config = [
    'host' => 'localhost',
    'port' => 3306,
    'dbname' => 'quest_app',
    'username' => 'quest_user',
    'password' => 'quest_secure_password_123',
    'charset' => 'utf8mb4',
    
    // MariaDB specific options
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        
        // MariaDB 10.11: Ensure proper UTF8MB4 handling
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, sql_mode='STRICT_TRANS_TABLES,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'",
        
        // Connection timeout
        PDO::ATTR_TIMEOUT => 30,
        
        // Persistent connections (optional, use with caution)
        // PDO::ATTR_PERSISTENT => true,
    ]
];

// MariaDB connection string
function createMariaDBConnection($config) {
    $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['dbname']};charset={$config['charset']}";
    
    try {
        $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
        
        // Verify MariaDB version
        $stmt = $pdo->query("SELECT VERSION() as version");
        $version = $stmt->fetchColumn();
        
        if (stripos($version, 'mariadb') === false) {
            error_log("Warning: Expected MariaDB but found: " . $version);
        } else {
            error_log("Connected to: " . $version);
        }
        
        return $pdo;
    } catch (PDOException $e) {
        error_log("MariaDB connection failed: " . $e->getMessage());
        throw $e;
    }
}

// Test JSON functionality
function testMariaDBFeatures($pdo) {
    try {
        // Test JSON_VALID function
        $stmt = $pdo->query("SELECT JSON_VALID('{\"test\": 123}') as json_test");
        $jsonSupport = $stmt->fetchColumn();
        
        if (!$jsonSupport) {
            throw new Exception("JSON functionality not available");
        }
        
        // Test computed column
        $stmt = $pdo->query("SHOW CREATE TABLE questionnaire_answers");
        $createTable = $stmt->fetch();
        
        if (stripos($createTable['Create Table'], 'expires_at') === false) {
            throw new Exception("expires_at computed column not found");
        }
        
        return true;
    } catch (Exception $e) {
        error_log("MariaDB feature test failed: " . $e->getMessage());
        return false;
    }
}

// Usage example:
// $pdo = createMariaDBConnection($config);
// $featuresOk = testMariaDBFeatures($pdo);

?>