
# Produktspezifikation: Dynamischer Fragebogen

**Datum:** Oktober 2025  
**Version:** 2.1 (Hybrid-Persistierung, API-Backend & Stepper-Modus)

## 1. Zielsetzung
Die Anwendung ermöglicht das bro## 10. Roadmap

### 10.1 Version 2.1 (Abgeschlossen - September/Oktober 2025)
- ✅ **Hybrid-Persistierung**: LocalStorage + Server-Backup implementiert
- ✅ **Server-Persistierung**: Reine Server-basierte Speicherung
- ✅ **PHP-REST-API**: Production-ready Backend mit MySQL/MariaDB
- ✅ **Strategy Pattern**: PersistenceManagerFactory für flexible Strategien
- ✅ **Try-Reloading**: Intelligente Retry-Mechanismen bei Server-Fehlern
- ✅ **Request-Deduplication**: Optimierte Server-Kommunikation
- ✅ **Stepper/Wizard-Modus**: Schrittweise Navigation mit Auto-Submit Feature

### 10.2 Version 2.2 (geplant)
- **Bar Chart Implementation**: Vollständige `charts/bar-chart.js` Implementierung
- **Unit Tests**: Test-Suite für alle Module inkl. Persistence-Strategien
- **Error Monitoring**: Erweiterte Fehlerbehandlung und Logging
- **Performance Monitoring**: Metriken für Server-Response-Zeiten

### 10.3 Version 3.0 (Zukunft)
- **TypeScript-Migration**: Bessere Typisierung für alle Module
- **PWA-Features**: Offline-Nutzung mit Service Worker
- **Multi-User-Support**: Erweiterte Session-Verwaltung
- **Real-time Sync**: WebSocket-basierte Echtzeit-Synchronisatione Ausfüllen, Auswerten und Visualisieren von beliebigen Fragebögen. Mit Version 2.1 (September/Oktober 2025) wurde eine Hybrid-Persistierung eingeführt, die LocalStorage-Performance mit Server-Backup-Sicherheit kombiniert. Zusätzlich bietet der neue Stepper/Wizard-Modus eine moderne, schrittweise Navigation durch Fragebögen mit optionalem Auto-Submit nach der letzten Frage. Die Anwendung unterstützt drei Persistierungs-Modi: reine LocalStorage, Hybrid (LocalStorage + Server), und reine Server-Persistierung.

## 2. Hauptfunktionen

### 2.1 Kern-Features
- **Dynamisches Laden**: Fragebögen werden aus Unterordnern in `quests/` erkannt und per Menü auswählbar gemacht.
- **Fragen & Konfiguration**: Jede Umfrage besteht aus `questions.txt` (Pipe-separierte Fragen) und `config.json` (JSON mit Titel, Beschreibung, Antwortoptionen, Kategorien, Chart-Optionen).
- **Antworten**: Antwortoptionen und deren Werte werden aus JSON geladen und dynamisch als Radio-Buttons gerendert.
- **Kategorien**: Jede Frage ist per ID-Präfix einer Kategorie zugeordnet, Kategorien werden in der Auswertung aggregiert.
- **Diagramm-Auswertung**: Die Auswertung erfolgt als Radar-, Balken- oder Gauge-Chart (D3.js/Chart.js), gesteuert durch die JSON-Konfiguration.
- **Antwort-Persistenz & Teilen**: Antworten werden im URL-Hash gespeichert, sodass sie beim Reload oder Teilen des Links erhalten bleiben.
- **Responsive UI**: Vier Darstellungsmodi (Tabellen-, Karten-, Responsive- und Stepper-Modus), automatische Umschaltung bei 900px Breakpoint, moderne Optik mit TailwindCSS.
- **Stepper/Wizard-Modus**: Schrittweise Bearbeitung mit einer Frage pro Schritt, optionalem Auto-Submit und visueller Fortschrittsanzeige.

### 2.2 Erweiterte Features (Version 2.1 - Hybrid-Persistierung)
- **Hybrid-Persistierung**: LocalStorage + Server-Backup für optimale Performance und Datensicherheit
- **Server-Persistierung**: Reine Server-basierte Speicherung für zentrale Datenhaltung
- **PHP-REST-API**: Production-ready Backend mit MySQL/MariaDB-Support
- **Try-Reloading**: Intelligente Retry-Mechanismen bei Server-Verbindungsfehlern
- **Session-Management**: UUID-basierte Session-Tokens für Benutzer-Zuordnung
- **Request-Deduplication**: Optimierte Server-Kommunikation mit Caching
- **Strategy Pattern**: PersistenceManagerFactory für flexible Persistierungs-Strategien
- **Database-Integration**: Vollständiges MySQL/MariaDB-Setup mit automatischen Cleanup-Mechanismen

### 2.3 Modulare Architektur (Version 2.0)
- **Modulare Architektur**: ES6-Module für bessere Code-Organisation und Wartbarkeit
- **Chart-Interferenz-Schutz**: Container-Isolation verhindert Rendering-Konflikte zwischen verschiedenen Chart-Typen
- **Form-Validation**: Intelligente Fehlermarkierung mit Scroll-Navigation zu unvollständigen Fragen
- **Gauge-Chart-Optimierung**: Präzise D3.js-Implementierung mit konsistentem Koordinatensystem
- **Responsive-Modus**: Automatische UI-Anpassung basierend auf Bildschirmbreite (>900px = Tabelle, ≤900px = Karten)
- **Entwicklungsfreundlich**: Modulare Struktur ermöglicht einfaches Testing und Debugging einzelner Komponenten

## 3. Technische Details

### 3.1 Hybrid-Architektur (Version 2.1)
- **Frontend**: Modulare ES6-Struktur mit drei Persistierungs-Strategien
- **Backend**: PHP-REST-API mit MySQL/MariaDB für Server-Persistierung
- **Persistierung**: Strategy Pattern mit LocalStorage, Hybrid oder Server-Modus
- **API-Endpoints**: 
  - `POST /api/questionnaire-data-prod.php` - Save answers
  - `GET /api/questionnaire-data-prod.php` - Load answers  
  - `DELETE /api/questionnaire-data-prod.php` - Delete answers
- **Database**: MySQL/MariaDB mit optimiertem Schema für JSON-Storage
- **Session-Management**: UUID v4 Tokens für Benutzer-Zuordnung ohne Authentifizierung

### 3.2 Modulare Frontend-Architektur (Version 2.0)
- **Frontend**: Modulare ES6-Struktur mit klarer Trennung der Verantwortlichkeiten
- **Hauptkomponenten**:
  - `index.html` (~160 Zeilen): HTML-Struktur und Module-Bootstrap
  - `app/questionnaire-app.js`: Zentrale Anwendungslogik und Orchestrierung
  - `components/`: UI-Komponenten (QuestionRenderer, FormHandler)
  - `charts/`: Chart-Module (ChartRenderer, GaugeChart, RadarChart)
  - `services/`: Datenverarbeitung (QuestionnaireLoader, ConfigParser)
  - `utils/`: Hilfsfunktionen (URLHashManager)
  - `css/styles.css`: Alle Styles (ausgelagert aus index.html)

### 3.3 Erweiterte Dateistruktur (Version 2.1)
```
quest/
├── index.html                    # Haupteingang (~160 Zeilen)
├── api/                          # Server-Backend (PHP)
│   ├── questionnaire-data-prod.php # Production API (MySQL/MariaDB)
│   ├── questionnaire-data.php    # Development API
│   ├── mariadb-config.php        # Database configuration
│   └── test-mariadb.php          # Database connection test
├── database/
│   └── schema.sql                # MySQL/MariaDB database schema
├── app/
│   └── questionnaire-app.js      # Hauptanwendungsklasse
├── components/                   # UI-Komponenten
│   ├── question-renderer.js      # Fragebogen-Rendering
│   └── form-handler.js           # Form-Validation
├── charts/                       # Chart-Module
│   ├── chart-renderer.js         # Chart-Management
│   └── gauge-chart.js            # D3.js Gauge-Charts
├── css/
│   └── styles.css                # Zentrale Styles
├── services/                     # Backend-Services
│   ├── questionnaire-loader.js   # Datenlade-Service
│   ├── config-parser.js          # JSON-Parsing
│   ├── persistence-manager.js    # LocalStorage (Legacy)
│   ├── hybrid-persistence-manager.js # Hybrid LocalStorage + Server
│   ├── server-persistence-manager.js # Pure Server Persistence
│   └── persistence-manager-factory.js # Strategy Factory
├── utils/                        # Hilfsfunktionen
│   └── url-hash-manager.js       # URL-Hash-Management
└── quests/                      # Fragebogen-Daten
    ├── <name>/questions.txt     # Fragen (Format: <ID>|<Fragetext>)
    └── <name>/config.json       # JSON-Konfiguration
```

### 3.4 Konfigurationsoptionen in JSON (Version 2.1)
- `title`: Titel des Fragebogens
- `description`: Beschreibung
- `answers`: Array von Antwortoptionen (`[{"Label": Wert}]`)
- `categories`: Array von Kategorien (`[{"A": "Autonomie"}]`)
- `chart`: Chart-Objekt (`{"type": "radar|bar|gauge"}`, optional `"top": "<Kategorie>"`)
- `input`: (optional) UI-Optionen (`{"display": "inline|column|responsive", "size": N, "header_repeating_rows": N}`)
  - `"column"`: Immer Tabellen-Modus
  - `"inline"`: Immer Karten-Modus
  - `"responsive"`: Automatische Umschaltung bei 900px Breakpoint
- `question-ui`: (optional) Fragebogen-UI-Konfiguration
  - `"autoscroll": true/false`: Automatisches Scrollen bei Responsive-Modus
  - `"stepper": true/false`: Stepper/Wizard-Modus aktivieren (eine Frage pro Schritt)
  - `"stepper_fade_duration": <ms>`: Fade-Dauer zwischen Schritten (Standard: 250ms)
  - `"stepper_autosend": true/false`: Automatisches Submit nach letzter Frage (Standard: false)
- `persistence`: (optional) Persistierungs-Konfiguration
  - `{"enabled": false}`: Keine Speicherung (Standard)
  - `{"enabled": true, "type": "localstorage"}`: Reine LocalStorage-Speicherung
  - `{"enabled": true, "type": "hybrid", "server_endpoint": "api/questionnaire-data-prod.php"}`: Hybrid-Modus
  - `{"enabled": true, "type": "server", "server_endpoint": "api/questionnaire-data-prod.php"}`: Server-Modus
  - `"try_reloading": true`: "Erneut versuchen"-Button bei Server-Verbindungsfehlern

#### Beispiel: Stepper-Modus Konfiguration
```json
{
  "title": "ACE-Fragebogen",
  "question-ui": {
    "autoscroll": true,
    "stepper": true,
    "stepper_fade_duration": 250,
    "stepper_autosend": true
  },
  "input": {
    "display": "inline",
    "size": 5
  }
}
```
Mit dieser Konfiguration wird der Fragebogen im Stepper-Modus angezeigt, wobei nach Beantwortung der letzten Frage automatisch die Auswertung erfolgt.

### 3.5 Datenfluss (Hybrid-Architektur)
1. **Bootstrap**: `index.html` lädt `QuestionnaireApp` via ES6-Import
2. **Initialisierung**: QuestionnaireApp koordiniert alle Services und Komponenten
3. **Persistence-Strategy**: PersistenceManagerFactory wählt basierend auf Konfiguration:
   - LocalStoragePersistenceManager (Legacy)
   - HybridPersistenceManager (LocalStorage + Server-Backup)
   - ServerPersistenceManager (Pure Server)
4. **Datenladung**: QuestionnaireLoader fetcht `questions.txt` und `config.json`
5. **Antworten-Wiederherstellung**: Gewählter PersistenceManager lädt gespeicherte Antworten
6. **UI-Rendering**: QuestionRenderer generiert Form basierend auf Display-Modus
7. **Form-Handling**: FormHandler verwaltet Validation, Auto-Save und Server-Synchronisation
8. **Chart-Rendering**: ChartRenderer wählt entsprechenden Chart-Typ und Container
9. **Persistenz**: URLHashManager + PersistenceManager behandeln Speicherung und Sharing

## 4. Bedienung

### 4.1 Standard-Workflow
- Auswahl des Fragebogens über das Menü (automatisch generiert)
- Wechsel zwischen Tabellen-, Karten- und Stepper-Darstellungsmodus
- Beantwortung der Fragen durch Radio-Buttons (Tabellen-, Karten- oder Stepper-Modus)
- Im Stepper-Modus: Schrittweise Navigation durch die Fragen mit automatischem Fortschritt
- Optionale Schnell-Ausfüllung mit Min/Max/Zufallswerten für Testing
- Auswertung per Button oder automatisch (bei `stepper_autosend: true`)
- Anzeige des entsprechenden Diagramms und eines Teil-Links
- Navigation zurück zum Fragebogen mit Erhalt der Antworten

### 4.2 Fehlerbehandlung (Version 2.0)
- Automatische Validation beim Absenden
- Visuelle Markierung unvollständiger Fragen (rote Umrandung)
- Smooth-Scroll-Navigation zur ersten unvollständigen Frage
- Interaktive Fehler-Entfernung beim Beantworten von Fragen

## 5. Besondere Features

### 5.1 Basis-Features
- **Vollständig statisch**: Keine Server-Logik, keine Authentifizierung, keine Speicherung auf dem Server
- **Flexible Erweiterbarkeit**: Neue Fragebögen durch Anlegen eines neuen Unterordners in `quests/`
- **Barrierearm**: Tastaturbedienung, visuelle Hervorhebung, responsive Darstellung
- **Debug-Modus**: Per URL-Parameter aktivierbar, zeigt Maximalwerte an

### 5.2 Version 2.0 Erweiterungen
- **Chart-Stabilität**: Container-Isolation verhindert Chart-Rendering-Konflikte
- **Entwicklerfreundlich**: Modulare Struktur ermöglicht einfaches Testing einzelner Komponenten
- **Performance-optimiert**: Reduzierte Hauptdatei (~160 Zeilen statt 800+)
- **Wartbarkeit**: Klare Trennung von UI-, Chart- und Datenlogik
- **Erweiterbar**: Plugin-ähnliche Struktur für neue Chart-Typen und UI-Komponenten

### 5.3 Stepper/Wizard-Modus (Version 2.1+)
- **Schrittweise Navigation**: Zeigt eine Frage pro Schritt mit Vor/Zurück-Navigation
- **Visueller Fortschritt**: Fortschrittsbalken und Zähler zeigen den Bearbeitungsstand
- **Konfigurierbarer Übergang**: Fade-Dauer zwischen Schritten einstellbar (Standard: 250ms)
- **Auto-Advance**: Automatischer Wechsel zur nächsten Frage nach Beantwortung
- **Automatisches Submit**: Optional automatische Auswertung nach letzter Frage (`stepper_autosend: true`)
- **Smart-Button-Logik**: Auswertungs-Button erscheint erst nach Beantwortung aller Fragen
- **State-Persistenz**: Antworten bleiben bei Navigation vor/zurück erhalten
- **Responsive Design**: Optimiert für mobile und Desktop-Ansichten

## 6. Server-Setup (für Hybrid/Server-Persistierung)

### 6.1 Systemanforderungen
- **Web Server**: Apache/Nginx mit PHP-Support
- **PHP**: Version 7.4 oder höher
- **Database**: MySQL 8.0+ oder MariaDB 10.11+
- **Extensions**: php-pdo, php-mysql, php-json

### 6.2 Installation
```bash
# 1. Database Setup
mysql -u root -p < database/schema.sql

# 2. API-Konfiguration
# Editieren Sie api/questionnaire-data-prod.php:
$config = [
    'host' => 'localhost',
    'dbname' => 'quest_app', 
    'username' => 'quest_user',
    'password' => 'IHR_PASSWORT',
    'charset' => 'utf8mb4'
];

# 3. Permissions setzen
chmod 644 api/questionnaire-data-prod.php
chown www-data:www-data api/questionnaire-data-prod.php

# 4. Test der Installation
curl -X GET http://localhost/quest/api/questionnaire-data-prod.php
# Sollte HTTP 405 zurückgeben (Method Not Allowed für GET ohne Parameter)
```

### 6.3 Sicherheit
- **Keine Authentifizierung**: Bewusste Design-Entscheidung für einfache Umfragen
- **Session-Tokens**: UUID v4 Tokens zur Benutzer-Zuordnung
- **Automatisches Cleanup**: Alte Daten werden nach 90 Tagen gelöscht
- **CORS-Konfiguration**: Explizite Allow-Headers für Client-Integration

## 7. Erweiterbarkeit

### 6.1 Fragebogen-Erweiterung
- Neue Fragebögen: Einfach neuen Ordner in `quests/` mit `questions.txt` und `config.json` anlegen
- Bestehende Fragebögen: Vollständig kompatibel mit Version 1.x

### 6.2 Modul-Erweiterung (Version 2.0)
- **Neue Chart-Typen**: Erstellung in `charts/` und Integration in `ChartRenderer`
- **UI-Komponenten**: Erweiterung von `QuestionRenderer` für neue Display-Modi
- **Validation**: Anpassung von `FormHandler` für spezifische Validierungsregeln
- **Services**: Neue Datenquellen durch Erweiterung der `services/` Module

## 7. Technische Verbesserungen (Version 2.0)

### 7.1 Chart-Interferenz-Lösung
- **Problem**: Chart-Rendering-Konflikte zwischen verschiedenen Chart-Typen
- **Lösung**: Container-Isolation-Pattern mit dedizierten DOM-Containern
- **Benefit**: Mathematische Unmöglichkeit von Chart-Interferenz

### 7.2 D3.js Gauge-Chart-Optimierung
- **Problem**: Koordinatensystem-Konflikte zwischen Arcs, Pointer und Tick-Marks
- **Lösung**: Konsistente Angle-Calculation-Pipeline mit einheitlichen Radian-Werten
- **Pattern**: "Use Same Coordinate System Throughout" für alle D3.js-Komponenten

### 7.3 Performance & Wartbarkeit
- **Code-Reduktion**: Von 800+ auf ~160 Zeilen in der Hauptdatei
- **Modularisierung**: 7 spezialisierte Module mit klaren Verantwortlichkeiten
- **Memory-Optimierung**: Bessere Garbage Collection durch modulare Event-Handler

### 7.4 Responsive-Modus-Implementation
- **Automatische Erkennung**: DOM-basierte Erkennung des aktuellen Rendering-Modus
- **Throttled Resize Events**: 150ms Verzögerung verhindert excessive Re-Rendering
- **State-Erhaltung**: Antworten bleiben beim Modus-Wechsel vollständig erhalten
- **Event-Cleanup**: Intelligente Bereinigung von Resize-Listenern beim Modus-Wechsel

## 8. Migration & Kompatibilität

### 8.1 Backwards Compatibility
- **Fragebogen-Daten**: Alle bestehenden `quests/` funktionieren ohne Änderungen
- **URL-Hash-Format**: Sharing-Links bleiben vollständig kompatibel
- **JSON-Schema**: Keine Breaking Changes in der Konfiguration

### 8.2 Browser-Anforderungen
- **ES6-Module**: Chrome 61+, Firefox 60+, Safari 11+, Edge 16+
- **Fallback**: Automatische Fehlermeldung für ältere Browser
- **Progressive Enhancement**: Grundfunktionen auch ohne moderne Features

## 9. Nicht-Funktionen
- Keine Benutzerverwaltung, kein Login, keine serverseitige Speicherung
- Keine dynamischen API-Calls, keine Build-Tools, keine externen JS-Module (außer CDN)
- Keine Offline-Funktionalität (PWA-Features geplant für Version 2.1)

## 10. Roadmap

### 10.1 Version 2.1 (geplant)
- **Bar Chart Implementation**: Vollständige `charts/bar-chart.js` Implementierung
- **Unit Tests**: Test-Suite für alle Module
- **TypeScript-Migration**: Bessere Typisierung und IDE-Support

### 10.2 Version 3.0 (Zukunft)
- **PWA-Features**: Offline-Nutzung und App-Installation
- **Bundle-Splitting**: Performance-Optimierung für große Anwendungen
- **Plugin-System**: Dynamisches Laden von Chart- und UI-Erweiterungen

---

**Letzte Aktualisierung**: 18.09.2025 (Version 2.0 - Modulare Architektur)
