<?php
/**
 * Quest Questionnaire Data API
 * Hybrid Persistence: LocalStorage + Server Backup
 * 
 * Endpoints:
 * POST   /api/questionnaire-data.php - Save questionnaire answers
 * GET    /api/questionnaire-data.php - Load questionnaire answers
 * DELETE /api/questionnaire-data.php - Delete questionnaire answers
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$config = [
    'host' => 'localhost',
    'dbname' => 'quest_app',
    'username' => 'quest_user',
    'password' => 'quest_password',
    'charset' => 'utf8mb4'
];

try {
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}", 
        $config['username'], 
        $config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
    exit();
}

// Route request based on HTTP method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        saveQuestionnaireAnswers($pdo);
        break;
    case 'GET':
        loadQuestionnaireAnswers($pdo);
        break;
    case 'DELETE':
        deleteQuestionnaireAnswers($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

/**
 * Save questionnaire answers to database
 */
function saveQuestionnaireAnswers($pdo) {
    try {
        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new InvalidArgumentException('Invalid JSON input');
        }
        
        // Validate required fields
        validateInput($input);
        
        $sessionToken = $input['session_token'];
        $questionnaireName = $input['questionnaire'];
        $answers = $input['answers'];
        $clientTimestamp = $input['timestamp'] ?? date('c');
        
        // Upsert questionnaire answers
        $stmt = $pdo->prepare("
            INSERT INTO questionnaire_answers 
            (session_token, questionnaire_name, answers_json, client_timestamp, created_at, updated_at) 
            VALUES (?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
                answers_json = VALUES(answers_json),
                client_timestamp = VALUES(client_timestamp),
                updated_at = NOW()
        ");
        
        $stmt->execute([
            $sessionToken,
            $questionnaireName,
            json_encode($answers, JSON_UNESCAPED_UNICODE),
            $clientTimestamp
        ]);
        
        // Get the record info
        $stmt = $pdo->prepare("
            SELECT id, created_at, updated_at 
            FROM questionnaire_answers 
            WHERE session_token = ? AND questionnaire_name = ?
        ");
        $stmt->execute([$sessionToken, $questionnaireName]);
        $record = $stmt->fetch();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Answers saved successfully',
            'data' => [
                'id' => $record['id'],
                'created_at' => $record['created_at'],
                'updated_at' => $record['updated_at'],
                'questionnaire' => $questionnaireName,
                'session_token' => $sessionToken
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Failed to save answers', 
            'details' => $e->getMessage()
        ]);
    }
}

/**
 * Load questionnaire answers from database
 */
function loadQuestionnaireAnswers($pdo) {
    try {
        $sessionToken = $_GET['session_token'] ?? '';
        $questionnaireName = $_GET['questionnaire'] ?? '';
        
        if (empty($sessionToken) || empty($questionnaireName)) {
            throw new InvalidArgumentException('Missing session_token or questionnaire parameter');
        }
        
        // Validate parameters
        validateSessionToken($sessionToken);
        validateQuestionnaireName($questionnaireName);
        
        $stmt = $pdo->prepare("
            SELECT answers_json, client_timestamp, created_at, updated_at
            FROM questionnaire_answers 
            WHERE session_token = ? AND questionnaire_name = ?
            AND expires_at > NOW()
        ");
        $stmt->execute([$sessionToken, $questionnaireName]);
        
        $record = $stmt->fetch();
        
        if ($record) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'answers' => json_decode($record['answers_json'], true),
                    'timestamp' => $record['client_timestamp'],
                    'created_at' => $record['created_at'],
                    'updated_at' => $record['updated_at'],
                    'questionnaire' => $questionnaireName,
                    'session_token' => $sessionToken
                ]
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'No saved answers found'
            ]);
        }
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Failed to load answers',
            'details' => $e->getMessage()
        ]);
    }
}

/**
 * Delete questionnaire answers from database
 */
function deleteQuestionnaireAnswers($pdo) {
    try {
        $sessionToken = $_GET['session_token'] ?? '';
        $questionnaireName = $_GET['questionnaire'] ?? '';
        
        if (empty($sessionToken) || empty($questionnaireName)) {
            throw new InvalidArgumentException('Missing session_token or questionnaire parameter');
        }
        
        // Validate parameters
        validateSessionToken($sessionToken);
        validateQuestionnaireName($questionnaireName);
        
        $stmt = $pdo->prepare("
            DELETE FROM questionnaire_answers 
            WHERE session_token = ? AND questionnaire_name = ?
        ");
        $stmt->execute([$sessionToken, $questionnaireName]);
        
        $deletedCount = $stmt->rowCount();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => "Deleted {$deletedCount} record(s)",
            'deleted_count' => $deletedCount
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Failed to delete answers',
            'details' => $e->getMessage()
        ]);
    }
}

/**
 * Validate input data for saving answers
 */
function validateInput($input) {
    $required = ['session_token', 'questionnaire', 'answers'];
    
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            throw new InvalidArgumentException("Missing required field: {$field}");
        }
    }
    
    validateSessionToken($input['session_token']);
    validateQuestionnaireName($input['questionnaire']);
    validateAnswers($input['answers']);
}

/**
 * Validate session token format (UUID v4)
 */
function validateSessionToken($token) {
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $token)) {
        throw new InvalidArgumentException('Invalid session token format');
    }
}

/**
 * Validate questionnaire name (alphanumeric + hyphens only)
 */
function validateQuestionnaireName($name) {
    if (!preg_match('/^[a-z0-9-]+$/i', $name)) {
        throw new InvalidArgumentException('Invalid questionnaire name');
    }
    
    if (strlen($name) > 100) {
        throw new InvalidArgumentException('Questionnaire name too long');
    }
}

/**
 * Validate answers structure
 */
function validateAnswers($answers) {
    if (!is_array($answers)) {
        throw new InvalidArgumentException('Answers must be an array');
    }
    
    if (count($answers) > 1000) {
        throw new InvalidArgumentException('Too many answers');
    }
    
    foreach ($answers as $questionId => $value) {
        // Validate question ID format (e.g., A1, B2, etc.)
        if (!preg_match('/^[A-Z]\d+$/i', $questionId)) {
            throw new InvalidArgumentException("Invalid question ID format: {$questionId}");
        }
        
        // Validate answer value (should be numeric for Likert scale)
        if (!is_numeric($value) || $value < 1 || $value > 10) {
            throw new InvalidArgumentException("Invalid answer value for {$questionId}: {$value}");
        }
    }
}

/**
 * Clean up expired records (called periodically)
 */
function cleanupExpiredRecords($pdo) {
    try {
        $stmt = $pdo->prepare("DELETE FROM questionnaire_answers WHERE expires_at < NOW()");
        $stmt->execute();
        
        return $stmt->rowCount();
    } catch (Exception $e) {
        error_log("Cleanup failed: " . $e->getMessage());
        return 0;
    }
}

// Optional: Run cleanup on 1% of requests
if (rand(1, 100) === 1) {
    cleanupExpiredRecords($pdo);
}

?>