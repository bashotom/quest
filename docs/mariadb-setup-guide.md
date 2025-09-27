# MariaDB 10.11 Setup Guide für Quest Questionnaire App

## 🗄️ MariaDB 10.11 Installation

### Ubuntu/Debian:
```bash
# MariaDB 10.11 Repository hinzufügen
curl -sS https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | sudo bash -s -- --mariadb-server-version="mariadb-10.11"

# Installation
sudo apt update
sudo apt install mariadb-server mariadb-client

# Sicherheit konfigurieren
sudo mysql_secure_installation
```

### macOS (mit Homebrew):
```bash
# MariaDB installieren
brew install mariadb@10.11

# Starten
brew services start mariadb@10.11

# Sicherheit konfigurieren
mysql_secure_installation
```

### CentOS/RHEL/Rocky Linux:
```bash
# MariaDB Repository
sudo dnf install wget
wget https://downloads.mariadb.com/MariaDB/mariadb_repo_setup
chmod +x mariadb_repo_setup
sudo ./mariadb_repo_setup --mariadb-server-version="mariadb-10.11"

# Installation
sudo dnf install MariaDB-server MariaDB-client

# Service starten
sudo systemctl enable --now mariadb

# Sicherheit konfigurieren
sudo mysql_secure_installation
```

## 🔧 MariaDB 10.11 Konfiguration für Quest

### 1. Database und User erstellen

```sql
-- Als Root-User verbinden
mysql -u root -p

-- Database erstellen
CREATE DATABASE quest_app 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Dedizierten User erstellen
CREATE USER 'quest_user'@'localhost' IDENTIFIED BY 'quest_secure_password_123';

-- Berechtigungen vergeben (minimal für Sicherheit)
GRANT SELECT, INSERT, UPDATE, DELETE ON quest_app.questionnaire_answers TO 'quest_user'@'localhost';
GRANT SELECT ON quest_app.questionnaire_metadata TO 'quest_user'@'localhost';

-- Event-Berechtigung für Cleanup (optional)
GRANT EVENT ON quest_app.* TO 'quest_user'@'localhost';

-- Änderungen anwenden
FLUSH PRIVILEGES;

-- Datenbank wählen
USE quest_app;
```

### 2. Schema installieren

```bash
# MariaDB-optimiertes Schema installieren
mysql -u root -p quest_app < database/schema.sql

# Oder Schritt für Schritt:
mysql -u quest_user -p quest_app < database/schema.sql
```

### 3. MariaDB-spezifische Konfiguration

```sql
-- Event Scheduler aktivieren (für automatische Bereinigung)
SET GLOBAL event_scheduler = ON;

-- JSON-Funktionen testen (MariaDB 10.11)
SELECT JSON_VALID('{"A1": 3, "B2": 5}') as is_valid_json;

-- Computed Column testen
SELECT expires_at FROM questionnaire_answers LIMIT 1;
```

## ⚙️ MariaDB 10.11 Besonderheiten

### JSON-Handling Unterschiede zu MySQL:

```sql
-- MariaDB 10.11: JSON als LONGTEXT mit Validierung
CREATE TABLE test_json (
    data LONGTEXT,
    CONSTRAINT chk_json CHECK (JSON_VALID(data))
);

-- JSON-Extraktion (MariaDB-Syntax)
SELECT 
    JSON_EXTRACT(answers_json, '$.A1') as answer_A1,
    JSON_UNQUOTE(JSON_EXTRACT(answers_json, '$.B1')) as answer_B1
FROM questionnaire_answers;

-- Alternativ (MariaDB 10.11+):
SELECT 
    answers_json->>'$.A1' as answer_A1,
    answers_json->>'$.B1' as answer_B1  
FROM questionnaire_answers;
```

### Computed Columns (PERSISTENT vs VIRTUAL):

```sql
-- MariaDB 10.11: PERSISTENT (gespeichert) vs VIRTUAL (berechnet)
expires_at TIMESTAMP AS (DATE_ADD(created_at, INTERVAL 90 DAY)) PERSISTENT

-- PERSISTENT: Wert wird gespeichert (empfohlen für Indizierung)
-- VIRTUAL: Wert wird bei jeder Abfrage berechnet
```

### Performance-Optimierungen:

```sql
-- MariaDB 10.11: Columnstore Engine für Analytics (optional)
-- ALTER TABLE questionnaire_answers ENGINE=ColumnStore;

-- InnoDB Kompression aktivieren
ALTER TABLE questionnaire_answers ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;

-- Partitionierung (MariaDB 10.11 compatible)
ALTER TABLE questionnaire_answers 
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

## 🔍 MariaDB 10.11 Testing & Validation

### Verbindung testen:
```bash
# Verbindung als quest_user
mysql -u quest_user -p quest_app

# Version prüfen
mysql --version
# Sollte zeigen: mariadb Ver 15.1 Distrib 10.11.x-MariaDB
```

### Funktionalität testen:
```sql
-- JSON-Validierung testen
INSERT INTO questionnaire_answers 
(session_token, questionnaire_name, answers_json, client_timestamp) 
VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'test', '{"A1": 3, "B2": 5}', NOW());

-- Computed Column testen
SELECT session_token, expires_at, 
       DATEDIFF(expires_at, created_at) as days_until_expiry
FROM questionnaire_answers 
WHERE questionnaire_name = 'test';

-- JSON-Extraktion testen
SELECT JSON_EXTRACT(answers_json, '$.A1') as answer_A1 
FROM questionnaire_answers 
WHERE questionnaire_name = 'test';

-- Cleanup testen
DELETE FROM questionnaire_answers WHERE questionnaire_name = 'test';
```

## 🔧 PHP-Konfiguration für MariaDB

### PDO-Verbindung optimiert:
```php
$config = [
    'host' => 'localhost',
    'dbname' => 'quest_app',
    'username' => 'quest_user',
    'password' => 'quest_secure_password_123',
    'charset' => 'utf8mb4'
];

$pdo = new PDO(
    "mysql:host={$config['host']};dbname={$config['dbname']};charset={$config['charset']}", 
    $config['username'], 
    $config['password'],
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        // MariaDB-spezifisch: UTF8MB4 strict mode
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ]
);
```

### JSON-Queries in PHP:
```php
// MariaDB 10.11: JSON-Extraktion
$stmt = $pdo->prepare("
    SELECT session_token, questionnaire_name,
           JSON_EXTRACT(answers_json, ?) as specific_answer
    FROM questionnaire_answers 
    WHERE questionnaire_name = ?
");
$stmt->execute(['$.A1', 'autonomie']);
```

## 🚨 MariaDB 10.11 Troubleshooting

### Häufige Probleme:

**1. JSON_VALID Fehler:**
```sql
-- Prüfen ob JSON-Support aktiviert ist
SHOW PLUGINS LIKE '%json%';

-- Falls nicht verfügbar, Plugin laden (meist nicht nötig in 10.11)
-- INSTALL PLUGIN JSON SONAME 'ha_connect.so';
```

**2. Computed Column Fehler:**
```sql
-- Alternative falls AS-Syntax nicht funktioniert:
ALTER TABLE questionnaire_answers 
ADD COLUMN expires_at TIMESTAMP 
DEFAULT (DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 90 DAY));
```

**3. Event Scheduler nicht verfügbar:**
```sql
-- Event Scheduler Status prüfen
SHOW VARIABLES LIKE 'event_scheduler';

-- Aktivieren
SET GLOBAL event_scheduler = ON;

-- Permanent in my.cnf:
-- [mysqld]
-- event_scheduler = ON
```

## 📈 Monitoring für MariaDB 10.11

### Performance-Queries:
```sql
-- Storage Engine Status
SHOW ENGINE InnoDB STATUS;

-- JSON-Performance überwachen
SELECT TABLE_NAME, DATA_LENGTH, INDEX_LENGTH 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'quest_app';

-- Event Status prüfen
SELECT * FROM information_schema.EVENTS 
WHERE EVENT_SCHEMA = 'quest_app';
```

## ✅ Installations-Checkliste

- [ ] MariaDB 10.11 installiert und gestartet
- [ ] `quest_app` Datenbank erstellt
- [ ] `quest_user` mit korrekten Berechtigungen erstellt
- [ ] Schema erfolgreich installiert
- [ ] JSON-Validierung funktioniert
- [ ] Computed Columns funktionieren
- [ ] Event Scheduler aktiviert (optional)
- [ ] PHP-PDO Verbindung getestet
- [ ] Test-Datensatz erfolgreich eingefügt

Die MariaDB 10.11 Version ist jetzt vollständig kompatibel und optimiert! 🚀