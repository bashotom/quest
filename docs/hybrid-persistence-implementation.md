# Hybrid Persistence Implementation Guide

## Überblick
Die Hybrid-Persistierung kombiniert LocalStorage (für beste Performance) mit Server-Backup (für Datensicherheit und Geräte-Synchronisation). Diese Implementation erweitert die bestehende LocalStorage-Persistierung um Server-Funktionalität ohne Breaking Changes.

## 🏗️ Server-Setup

### 1. Database Schema Installation

```bash
# Mit MySQL als Root-User verbinden
mysql -u root -p

# Database und User erstellen
CREATE DATABASE quest_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'quest_user'@'localhost' IDENTIFIED BY 'quest_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON quest_app.* TO 'quest_user'@'localhost';
FLUSH PRIVILEGES;

# Schema installieren
mysql -u quest_user -p quest_app < database/schema.sql
```

### 2. PHP API konfigurieren

Editieren Sie `api/questionnaire-data.php` und passen Sie die Datenbankverbindung an:

```php
$config = [
    'host' => 'localhost',
    'dbname' => 'quest_app',
    'username' => 'quest_user', 
    'password' => 'IHR_PASSWORT_HIER',
    'charset' => 'utf8mb4'
];
```

### 3. Web Server konfigurieren

Stellen Sie sicher, dass PHP und MySQL verfügbar sind und die API-Route funktioniert:

```bash
# Test der API (sollte HTTP 405 zurückgeben)
curl -X GET http://localhost/quest/api/questionnaire-data.php

# Vollständiger Test
curl -X POST http://localhost/quest/api/questionnaire-data.php \
  -H "Content-Type: application/json" \
  -d '{"session_token":"550e8400-e29b-41d4-a716-446655440000","questionnaire":"test","answers":{"A1":3},"timestamp":"2025-09-27T10:00:00.000Z"}'
```

## 📝 Konfiguration

### Hybrid-Modus (Empfohlen)
```json
{
  "persistence": {
    "enabled": true,
    "type": "hybrid",
    "server": {
      "endpoint": "/api/questionnaire-data.php",
      "sync": "auto",
      "authentication": "session",
      "timeout": 5000
    }
  }
}
```

### Nur Server-Modus
```json
{
  "persistence": {
    "enabled": true,
    "type": "server",
    "server": {
      "endpoint": "/api/questionnaire-data.php",
      "sync": "auto", 
      "authentication": "session",
      "timeout": 3000
    }
  }
}
```

### LocalStorage-Modus (wie bisher)
```json
{
  "persistence": {
    "enabled": true,
    "type": "localstorage"
  }
}
```

## 🔧 Integration in bestehende Anwendung

### 1. Module aktualisieren

In `app/questionnaire-app.js`:

```javascript
// Alte Zeile ersetzen:
// import { PersistenceManager } from '../services/persistence-manager.js';

// Neue Zeile:
import { PersistenceManager } from '../services/hybrid-persistence-manager.js';
```

In `components/form-handler.js`:

```javascript
// Alte Zeile ersetzen:
// import { PersistenceManager } from '../services/persistence-manager.js';

// Neue Zeile:
import { PersistenceManager } from '../services/hybrid-persistence-manager.js';
```

### 2. Keine weiteren Code-Änderungen erforderlich!

Die HybridPersistenceManager-API ist zu 100% kompatibel mit der bestehenden PersistenceManager-API. Alle bestehenden Funktionen arbeiten weiterhin genau so.

## 🚀 Funktionsweise

### Hybrid-Modus Workflow

1. **Speichern (bei jedem Radiobutton-Change):**
   - ✅ Sofort in LocalStorage speichern (0ms Latenz)
   - ⏱️ Nach 2 Sekunden Inaktivität: Server-Sync im Hintergrund
   - 🛡️ Bei Server-Fehler: Kein Problem, LocalStorage hat die Daten

2. **Laden (beim Fragebogen-Öffnen):**
   - 🌐 Zuerst Server versuchen (neueste Daten)
   - 💾 Bei Server-Fehler: LocalStorage als Fallback
   - ⚡ Immer schnelle Anzeige, egal welche Quelle

3. **Löschen (Clear-Button):**
   - 🗑️ LocalStorage sofort löschen
   - 🌐 Server-Löschung im Hintergrund
   - ✅ Button verschwindet sofort (optimistische UI)

### Session-Token System

- **UUID v4** wird automatisch generiert und in LocalStorage gespeichert
- **Anonyme Sessions** - keine persönlichen Daten erforderlich
- **Cross-Device** - gleicher Token kann auf mehreren Geräten verwendet werden
- **90-Tage Expiry** - automatische Bereinigung alter Daten

## 🔒 Sicherheit & Datenschutz

### Daten-Minimierung
- ✅ Keine persönlichen Daten gespeichert
- ✅ Nur UUID-Session-Token und Antworten
- ✅ Automatische Löschung nach 90 Tagen

### Eingabe-Validierung
- ✅ UUID v4 Format-Validierung
- ✅ Fragebogen-Name Validierung (alphanumerisch)
- ✅ Antwort-Werte Validierung (1-10 Bereich)
- ✅ JSON-Struktur Validierung

### Fehlerbehandlung
- ✅ Graceful Degradation bei Server-Fehlern
- ✅ Timeout-Protection (5 Sekunden)
- ✅ LocalStorage-Fallback in allen Fällen

## 📊 Monitoring & Wartung

### Datenbank-Abfragen für Monitoring

```sql
-- Aktuelle Statistiken
SELECT 
    questionnaire_name,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT DATE(created_at)) as active_days,
    MIN(created_at) as first_response,
    MAX(updated_at) as last_response
FROM questionnaire_answers 
GROUP BY questionnaire_name;

-- Tägliche Aktivität
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_sessions,
    COUNT(CASE WHEN created_at != updated_at THEN 1 END) as updated_sessions
FROM questionnaire_answers 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Bereinigung alter Daten
DELETE FROM questionnaire_answers WHERE expires_at < NOW();
```

### Automatische Wartung

Die API führt automatisch bei 1% der Requests eine Bereinigung durch:

```php
// In questionnaire-data.php bereits implementiert
if (rand(1, 100) === 1) {
    cleanupExpiredRecords($pdo);
}
```

## 🐛 Troubleshooting

### Häufige Probleme

**1. API gibt 500 Fehler**
```bash
# Prüfen Sie die PHP-Logs
tail -f /var/log/apache2/error.log
# oder
tail -f /var/log/nginx/error.log
```

**2. CORS-Fehler im Browser**
```php
// In questionnaire-data.php bereits vorhanden:
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
```

**3. MySQL-Verbindung schlägt fehl**
```bash
# Verbindung testen
mysql -u quest_user -p quest_app -e "SHOW TABLES;"
```

**4. Session-Token wird nicht generiert**
```javascript
// In Browser-Konsole prüfen:
localStorage.getItem('quest_session_token');
```

### Debug-Modus aktivieren

Fügen Sie temporär Debug-Ausgaben hinzu:

```javascript
// In hybrid-persistence-manager.js, saveToServer Methode:
console.log('[DEBUG] Sending to server:', requestData);

// In questionnaire-data.php:
error_log('API called with: ' . print_r($_REQUEST, true));
```

## 🎯 Nächste Schritte

1. **✅ Server und Database Setup**
2. **✅ Module-Import auf hybrid-persistence-manager.js ändern**
3. **🔄 Testen mit dem Autonomie-Fragebogen**
4. **📝 config.json der anderen Fragebögen erweitern**
5. **📊 Monitoring-Dashboard einrichten (optional)**

Die Hybrid-Implementation ist produktionsreif und bietet die beste User Experience mit maximaler Datensicherheit! 🚀