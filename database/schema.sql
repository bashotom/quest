-- Quest Questionnaire Database Schema
-- Compatible with MariaDB 10.11+ and MySQL 8.0+
-- Generic schema for all questionnaire types (autonomie, ace, resilienz)
-- Supports hybrid localStorage + server persistence

-- Create database (optional - adjust as needed)
-- CREATE DATABASE IF NOT EXISTS quest_app 
-- CHARACTER SET utf8mb4 
-- COLLATE utf8mb4_unicode_ci;

-- USE quest_app;

-- Main table for questionnaire answers
CREATE TABLE questionnaire_answers (
    -- Primary key
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Session identification (UUID v4 format)
    session_token VARCHAR(36) NOT NULL COMMENT 'Client-generated UUID for anonymous sessions',
    
    -- Questionnaire identification
    questionnaire_name VARCHAR(100) NOT NULL COMMENT 'Questionnaire folder name (autonomie, ace, resilienz, etc.)',
    
    -- Answer data (JSON format for flexibility)
    -- MariaDB 10.11: Use LONGTEXT with JSON validation
    answers_json LONGTEXT NOT NULL COMMENT 'Question answers in JSON format {"A1": 3, "B2": 5}',
    
    -- Timestamps
    client_timestamp TIMESTAMP NULL COMMENT 'Timestamp from client when answers were saved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Server timestamp when record was first created',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Server timestamp when record was last updated',
    
    -- MariaDB 10.11 compatible expiration (computed column)
    expires_at TIMESTAMP AS (DATE_ADD(created_at, INTERVAL 90 DAY)) PERSISTENT COMMENT 'Auto-calculated expiration date (90 days from creation)',
    
    -- Constraints
    UNIQUE KEY unique_session_questionnaire (session_token, questionnaire_name) COMMENT 'One record per session per questionnaire',
    
    -- Indexes for performance
    INDEX idx_session_token (session_token) COMMENT 'Fast lookup by session',
    INDEX idx_questionnaire_name (questionnaire_name) COMMENT 'Fast lookup by questionnaire type',
    INDEX idx_expires_at (expires_at) COMMENT 'Fast cleanup of expired records',
    INDEX idx_created_at (created_at) COMMENT 'Fast lookup by creation date',
    INDEX idx_updated_at (updated_at) COMMENT 'Fast lookup by update date',
    
    -- MariaDB 10.11: JSON validation constraint
    CONSTRAINT chk_answers_json CHECK (JSON_VALID(answers_json))
    
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci 
  COMMENT='Stores questionnaire answers with automatic expiration';

-- Optional: Table for questionnaire metadata (if needed for analytics)
CREATE TABLE questionnaire_metadata (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    questionnaire_name VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL COMMENT 'Human-readable questionnaire title',
    description TEXT COMMENT 'Questionnaire description',
    version VARCHAR(20) DEFAULT '1.0' COMMENT 'Version of the questionnaire structure',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (questionnaire_name)
    
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci 
  COMMENT='Metadata for available questionnaires';

-- Insert initial questionnaire metadata
INSERT INTO questionnaire_metadata (questionnaire_name, title, description) VALUES
('autonomie', 'Autonomie-Fragebogen', 'Messung der wahrgenommenen Autonomie am Arbeitsplatz'),
('ace', 'ACE-Fragebogen', 'Assessment Center Evaluation'),
('resilienz', 'Resilienz-Fragebogen', 'Messung der psychischen Widerstandsfähigkeit')
ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    description = VALUES(description);

-- Optional: Create database user with limited permissions
-- CREATE USER IF NOT EXISTS 'quest_user'@'localhost' IDENTIFIED BY 'quest_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON quest_app.questionnaire_answers TO 'quest_user'@'localhost';
-- GRANT SELECT ON quest_app.questionnaire_metadata TO 'quest_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Example data structure for reference (MariaDB 10.11 compatible)
-- INSERT INTO questionnaire_answers (session_token, questionnaire_name, answers_json, client_timestamp) VALUES
-- ('550e8400-e29b-41d4-a716-446655440000', 'autonomie', '{"A1": 3, "A2": 4, "B1": 2, "B2": 5}', NOW()),
-- ('550e8400-e29b-41d4-a716-446655440001', 'ace', '{"A1": 1, "A2": 3, "C1": 4}', NOW()),
-- ('550e8400-e29b-41d4-a716-446655440002', 'resilienz', '{"R1": 5, "R2": 4, "R3": 3}', NOW());

-- Useful queries for administration:

-- 1. Count answers by questionnaire type
-- SELECT questionnaire_name, COUNT(*) as total_responses, 
--        MIN(created_at) as first_response, 
--        MAX(updated_at) as last_response
-- FROM questionnaire_answers 
-- GROUP BY questionnaire_name;

-- 2. Find sessions with multiple questionnaires completed
-- SELECT session_token, GROUP_CONCAT(questionnaire_name) as completed_questionnaires, 
--        COUNT(*) as questionnaire_count
-- FROM questionnaire_answers 
-- GROUP BY session_token 
-- HAVING COUNT(*) > 1;

-- 3. Clean up expired records manually
-- DELETE FROM questionnaire_answers WHERE expires_at < NOW();

-- 4. View recent activity
-- SELECT questionnaire_name, COUNT(*) as responses_today
-- FROM questionnaire_answers 
-- WHERE DATE(created_at) = CURDATE() 
-- GROUP BY questionnaire_name;

-- 5. JSON queries (MariaDB 10.11 compatible)
-- SELECT session_token, questionnaire_name, 
--        JSON_EXTRACT(answers_json, '$.A1') as answer_A1,
--        JSON_EXTRACT(answers_json, '$.B1') as answer_B1
-- FROM questionnaire_answers 
-- WHERE questionnaire_name = 'autonomie';

-- 6. Average completion time analysis (if you add completion_time field later)
-- ALTER TABLE questionnaire_answers ADD COLUMN completion_time_seconds INT UNSIGNED NULL COMMENT 'Time taken to complete questionnaire in seconds';

-- Performance optimization: Partition by questionnaire_name (for large datasets)
-- Note: MariaDB 10.11 supports partitioning
-- ALTER TABLE questionnaire_answers 
-- PARTITION BY HASH(CRC32(questionnaire_name)) 
-- PARTITIONS 4;

-- MariaDB 10.11 specific: Event scheduler for automated cleanup
-- Note: Enable event scheduler with: SET GLOBAL event_scheduler = ON;
-- CREATE EVENT IF NOT EXISTS cleanup_expired_answers
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_TIMESTAMP
-- DO DELETE FROM questionnaire_answers WHERE expires_at < NOW();