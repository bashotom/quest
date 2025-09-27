#!/usr/bin/env php
<?php
/**
 * MariaDB 10.11 Compatibility Test for Quest API
 * Run this script to verify MariaDB setup and API functionality
 */

// Include the API functions
require_once __DIR__ . '/questionnaire-data.php';

echo "🔍 Quest API MariaDB 10.11 Compatibility Test\n";
echo "==============================================\n\n";

// Test 1: Database Connection
echo "1. Testing database connection...\n";

try {
    // Use the same config as the API
    $config = [
        'host' => 'localhost',
        'dbname' => 'quest_app',
        'username' => 'quest_user',
        'password' => 'quest_password', // Update this!
        'charset' => 'utf8mb4'
    ];
    
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}", 
        $config['username'], 
        $config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ]
    );
    
    echo "   ✅ Database connection successful\n";
} catch (PDOException $e) {
    echo "   ❌ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 2: Database Version
echo "\n2. Checking database version...\n";

try {
    $stmt = $pdo->query("SELECT VERSION() as version");
    $version = $stmt->fetchColumn();
    
    $isMariaDB = stripos($version, 'mariadb') !== false;
    $isMySQL = !$isMariaDB;
    
    if ($isMariaDB) {
        echo "   ✅ MariaDB detected: $version\n";
        
        // Extract version number
        preg_match('/(\d+\.\d+)/', $version, $matches);
        $versionNumber = $matches[1] ?? '0.0';
        
        if (version_compare($versionNumber, '10.11', '>=')) {
            echo "   ✅ MariaDB version 10.11+ confirmed\n";
        } else {
            echo "   ⚠️  MariaDB version is $versionNumber (recommend 10.11+)\n";
        }
    } else {
        echo "   ℹ️  MySQL detected: $version (also compatible)\n";
    }
} catch (Exception $e) {
    echo "   ❌ Version check failed: " . $e->getMessage() . "\n";
}

// Test 3: Table Structure
echo "\n3. Checking table structure...\n";

try {
    $stmt = $pdo->query("DESCRIBE questionnaire_answers");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $requiredColumns = ['id', 'session_token', 'questionnaire_name', 'answers_json', 'expires_at'];
    
    foreach ($requiredColumns as $column) {
        if (in_array($column, $columns)) {
            echo "   ✅ Column '$column' exists\n";
        } else {
            echo "   ❌ Missing column '$column'\n";
        }
    }
} catch (Exception $e) {
    echo "   ❌ Table check failed: " . $e->getMessage() . "\n";
}

// Test 4: JSON Functionality
echo "\n4. Testing JSON functionality...\n";

try {
    $stmt = $pdo->query("SELECT JSON_VALID('{\"test\": 123, \"array\": [1,2,3]}') as json_test");
    $jsonSupport = $stmt->fetchColumn();
    
    if ($jsonSupport) {
        echo "   ✅ JSON_VALID function works\n";
    } else {
        echo "   ❌ JSON_VALID function failed\n";
    }
    
    // Test JSON extraction
    $stmt = $pdo->query("SELECT JSON_EXTRACT('{\"A1\": 3, \"B2\": 5}', '\$.A1') as extracted_value");
    $extractedValue = $stmt->fetchColumn();
    
    if ($extractedValue == 3) {
        echo "   ✅ JSON_EXTRACT function works\n";
    } else {
        echo "   ❌ JSON_EXTRACT function failed\n";
    }
    
} catch (Exception $e) {
    echo "   ❌ JSON test failed: " . $e->getMessage() . "\n";
}

// Test 5: Computed Column
echo "\n5. Testing computed column (expires_at)...\n";

try {
    // Insert test record
    $testToken = '550e8400-e29b-41d4-a716-446655440000';
    $testQuestionnaire = 'test_compatibility';
    $testAnswers = '{"A1": 3, "B2": 5}';
    
    $stmt = $pdo->prepare("
        INSERT INTO questionnaire_answers 
        (session_token, questionnaire_name, answers_json, created_at) 
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE updated_at = NOW()
    ");
    $stmt->execute([$testToken, $testQuestionnaire, $testAnswers]);
    
    // Check computed column
    $stmt = $pdo->prepare("
        SELECT created_at, expires_at, 
               DATEDIFF(expires_at, created_at) as days_diff
        FROM questionnaire_answers 
        WHERE session_token = ? AND questionnaire_name = ?
    ");
    $stmt->execute([$testToken, $testQuestionnaire]);
    $result = $stmt->fetch();
    
    if ($result && $result['days_diff'] == 90) {
        echo "   ✅ Computed column works (90 days expiry)\n";
    } else {
        echo "   ❌ Computed column failed or incorrect calculation\n";
    }
    
    // Cleanup test record
    $stmt = $pdo->prepare("DELETE FROM questionnaire_answers WHERE session_token = ? AND questionnaire_name = ?");
    $stmt->execute([$testToken, $testQuestionnaire]);
    echo "   🧹 Test record cleaned up\n";
    
} catch (Exception $e) {
    echo "   ❌ Computed column test failed: " . $e->getMessage() . "\n";
}

// Test 6: API Functions
echo "\n6. Testing API validation functions...\n";

try {
    // Test session token validation
    validateSessionToken('550e8400-e29b-41d4-a716-446655440000');
    echo "   ✅ Session token validation works\n";
    
    // Test questionnaire name validation
    validateQuestionnaireName('autonomie');
    echo "   ✅ Questionnaire name validation works\n";
    
    // Test answers validation
    validateAnswers(['A1' => 3, 'B2' => 5, 'C1' => 0]);
    echo "   ✅ Answers validation works\n";
    
} catch (Exception $e) {
    echo "   ❌ API validation test failed: " . $e->getMessage() . "\n";
}

// Test 7: Performance Check
echo "\n7. Performance check...\n";

try {
    $start = microtime(true);
    
    // Simulate API operations
    for ($i = 0; $i < 10; $i++) {
        $stmt = $pdo->query("SELECT JSON_VALID('{\"test\": " . $i . "}') as valid");
        $stmt->fetchColumn();
    }
    
    $end = microtime(true);
    $duration = round(($end - $start) * 1000, 2);
    
    echo "   ✅ 10 JSON operations completed in {$duration}ms\n";
    
    if ($duration < 100) {
        echo "   🚀 Performance: Excellent\n";
    } elseif ($duration < 500) {
        echo "   ⚡ Performance: Good\n";
    } else {
        echo "   ⚠️  Performance: Consider optimization\n";
    }
    
} catch (Exception $e) {
    echo "   ❌ Performance test failed: " . $e->getMessage() . "\n";
}

echo "\n🎉 MariaDB compatibility test completed!\n";

// Summary
echo "\n📋 Setup Checklist:\n";
echo "□ MariaDB 10.11+ installed and running\n";
echo "□ quest_app database created\n";
echo "□ quest_user with proper permissions\n";
echo "□ questionnaire_answers table created\n";
echo "□ JSON functions working\n";
echo "□ Computed columns working\n";
echo "□ API validation functions working\n";

echo "\n💡 Next steps:\n";
echo "1. Update password in api/questionnaire-data.php\n";
echo "2. Test with actual HTTP requests\n";
echo "3. Configure web server (Apache/Nginx)\n";
echo "4. Enable CORS if needed\n";

?>