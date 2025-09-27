# Quest - Dynamische Fragebogen-App

Eine schlanke, einseitige Web-Anwendung für dynamische Fragebögen mit Chart-Visualisierung.

## 🎯 Projektübersicht

- **Typ:** Dynamische Fragebogen-Web-App (Single-Page, kein Build-Step)
- **Architektur:** Modulare ES6-Module mit Hybrid-Backend-Support
- **Charts:** D3.js Radar-Charts & Gauge-Charts, Chart.js für Fallbacks
-## 📈 Externe Abhängigkeiten

### Frontend (CDN)
- [TailwindCSS](https://cdn.tailwindcss.com) (CDN)
- [Chart.js](https://cdn.jsdelivr.net/npm/chart.js) (CDN) 
- [D3.js](https://d3js.org) (für Radar-Charts)
- [Google Fonts: Inter](https://fonts.googleapis.com/css2?family=Inter)

### Backend (Server-Persistierung)
- **PHP 7.4+** (für API-Backend)
- **MySQL 8.0+ oder MariaDB 10.11+** (für Datenhaltung)
- **Web Server** (Apache/Nginx mit PHP-Support)
- **CORS-Support** (für Client-Server-Kommunikation)ling:** TailwindCSS (CDN) + modulare CSS-Dateien
- **Persistierung:** Hybrid-System (LocalStorage + Server-Backup) oder reine Server-Persistierung
- **API-Backend:** PHP-REST-API mit MySQL/MariaDB für Datensicherheit und Geräte-Synchronisation

## 📁 Modulare Dateistruktur

```
quest/
├── index.html                    # Hauptdatei (nur ~160 Zeilen!)
├── README.md                     # Projektdokumentation
├── app/
│   └── questionnaire-app.js      # Hauptanwendungsklasse
├── components/                   # UI-Komponenten
│   ├── question-renderer.js      # Fragebogen-Rendering (Tabelle/Karten)
│   ├── form-handler.js           # Form-Validation & Auto-Save
│   ├── questionnaire-form.js     # Legacy Form-Komponente
│   ├── result-renderer.js        # Ergebnis-Rendering
│   ├── result-table-renderer.js  # Tabellen-Ergebnis-Darstellung
│   └── result-tile-renderer.js   # Kachel-Ergebnis-Darstellung
├── charts/                       # Chart-Module
│   ├── chart-renderer.js         # Chart-Management mit Container-Isolation
│   ├── gauge-chart.js            # D3.js Gauge-Chart-Implementierung
│   ├── gauge-chart-legacy.js     # Legacy Gauge-Implementation
│   ├── radar-chart.js            # D3.js Radar-Chart-Implementierung (ES6)
│   ├── gauge/                    # Spezialisierte Gauge-Charts
│   │   ├── simple-gauge.js       # Einfache Gauge-Implementierung
│   │   └── tachometer-gauge.js   # Tachometer-Style Gauge
│   └── radar/                    # Modulare Radar-Chart-Komponenten
│       ├── radar-config-parser.js    # Konfiguration & Setup
│       ├── radar-data-processor.js   # Datenverarbeitung
│       ├── radar-grid.js             # Grid & Achsen-Rendering
│       ├── radar-arrows.js           # Pfeil-Rendering
│       ├── radar-data-renderer.js    # Daten-Visualisierung
│       ├── radar-interactions.js     # Tooltips & Hover-Effekte
│       ├── radar-legend.js          # Mobile Legend
│       ├── radar-responsive.js      # Responsive-Handling
│       └── utils/
│           └── radar-math-utils.js   # Mathematische Berechnungen
├── config/
│   └── questionnaires.json      # Fragebogen-Konfiguration (zentral)
├── css/
│   └── styles.css                # Alle Styles (ausgelagert aus index.html)
├── docs/                         # Dokumentation & Guides
│   ├── spec.md                   # Technische Spezifikation
│   ├── implementation-summary.md # Implementierungs-Übersicht
│   ├── gauge-charts-feature.md   # Gauge-Chart Dokumentation
│   ├── gauge-styles-overview.md  # Gauge-Styling Guide
│   ├── standard-encoding-implementation.md # Encoding-Dokumentation
│   ├── finale-universal-encoding-summary.md # Encoding-Finale
│   ├── d3-simple-gauge-integration.md # D3-Gauge Integration
│   └── gauge-validation.js       # Gauge-Validierung
├── api/                          # Server-Backend (PHP)
│   ├── questionnaire-data-prod.php # Production API (MySQL/MariaDB)
│   ├── questionnaire-data.php    # Development API
│   ├── mariadb-config.php        # Database configuration
│   └── test-mariadb.php          # Database connection test
├── database/
│   └── schema.sql                # MySQL/MariaDB database schema
├── services/                     # Backend-Services
│   ├── questionnaire-loader.js   # Datenlade-Service
│   ├── config-parser.js          # JSON-Parsing & Konfiguration
│   ├── persistence-manager.js    # LocalStorage-Persistierung (Legacy)
│   ├── hybrid-persistence-manager.js # Hybrid LocalStorage + Server
│   ├── server-persistence-manager.js # Pure Server Persistence
│   ├── persistence-manager-factory.js # Persistence Strategy Factory
│   └── result-data-processor.js  # Ergebnis-Datenverarbeitung
├── utils/                        # Hilfsfunktionen
│   └── url-hash-manager.js       # URL-Hash-Management
└── quests/                      # Fragebogen-Daten
    ├── autonomie/               # Autonomie-Fragebogen
    │   ├── questions.txt        # Fragen (ID|Text Format)
    │   └── config.json          # Konfiguration
    ├── ace/                     # ACE-Fragebogen
    │   ├── questions.txt
    │   └── config.json
    └── resilienz/               # Resilienz-Fragebogen
        ├── questions.txt
        └── config.json
```

## ✨ Neue Modulare Architektur (September 2025)

### 🔄 Refactoring-Highlights
- **Von 800+ Zeilen auf ~160 Zeilen** in der `index.html` reduziert
- **Vollständige Modularisierung** mit ES6-Modulen
- **Chart-Interferenz-Schutz** durch Container-Isolation
- **Responsive-Modus** mit automatischer Umschaltung bei 900px Breakpoint
- **Trennung der Verantwortlichkeiten** nach Single-Responsibility-Prinzip

### 📦 Modul-Übersicht

| Modul | Verantwortlichkeit | Zeilen |
|-------|-------------------|---------|
| `index.html` | HTML-Struktur, Module-Orchestrierung | ~160 |
| `app/questionnaire-app.js` | Hauptanwendungslogik, Event-Management | ~380 |
| `components/question-renderer.js` | UI-Rendering (Tabelle/Karten-Modus) | ~150 |
| `components/form-handler.js` | Form-Validation, Auto-Save | ~140 |
| `charts/chart-renderer.js` | Chart-Management, Container-Isolation | ~180 |
| `charts/gauge-chart.js` | D3.js Gauge-Chart mit bewährtem Pattern | ~140 |
| `services/persistence-manager.js` | LocalStorage-Persistierung | ~120 |
| `css/styles.css` | Alle Styles (Chart, UI, Responsive) | ~100 |

## 🔧 API-Backend

### PHP-REST-API (`api/questionnaire-data-prod.php`)
**Production-Ready Server-Backend** mit MySQL/MariaDB-Integration
```php
// Endpoints:
// POST   /api/questionnaire-data-prod.php - Save questionnaire answers
// GET    /api/questionnaire-data-prod.php - Load questionnaire answers  
// DELETE /api/questionnaire-data-prod.php - Delete questionnaire answers

// ✅ MySQL 8.0+ und MariaDB 10.11+ kompatibel
// ✅ CORS-Support für Client-Integration
// ✅ Session-Token-basierte Zuordnung
// ✅ Automatische Cleanup alter Daten (90 Tage)
// ✅ Error Handling und JSON-Response
```

### Database Schema (`database/schema.sql`)
**MySQL/MariaDB Schema** für Fragebogen-Daten
```sql
-- Tabelle: questionnaire_responses
-- ✅ UUID-basierte Session-Tokens
-- ✅ JSON-Storage für flexible Antworten
-- ✅ Timestamp-Tracking für Cleanup
-- ✅ Optimierte Indizierung für Performance
```

### Setup & Installation
```bash
# 1. Database erstellen
mysql -u root -p < database/schema.sql

# 2. API-Konfiguration anpassen
# Editieren Sie api/questionnaire-data-prod.php

# 3. Web-Server mit PHP-Support
# Apache/Nginx + PHP 7.4+ + MySQL/MariaDB
```

## 🔧 Module im Detail

### QuestionnaireApp (`app/questionnaire-app.js`)
**Hauptanwendungsklasse** - Orchestriert alle anderen Module
```javascript
import { QuestionnaireApp } from './app/questionnaire-app.js';
const app = new QuestionnaireApp();
app.init();
```

### ChartRenderer (`charts/chart-renderer.js`)
**Chart-Management** - Verhindert Interferenz durch Container-Isolation
```javascript
ChartRenderer.render(chartType, scores, questions, config);
// Automatische Container-Auswahl: radar-chart-container, gauge-chart-container, bar-chart-container
```

### GaugeChart (`charts/gauge-chart.js`)
**D3.js Gauge-Implementation** - Folgt bewährtem Coordinate-System-Pattern
```javascript
const chart = new GaugeChart(container, config);
chart.render(value, maxScore, categoryLabel);
// ✅ Synchronized arcs, pointer, and tick marks
```

### QuestionRenderer (`components/question-renderer.js`)
**UI-Rendering** - Unterstützt Tabellen-, Karten- und Responsive-Modus
```javascript
QuestionRenderer.render(questions, config, container);
// Unterstützte Modi: 'column', 'inline', 'responsive'
// Responsive-Modus: >900px = Tabelle, ≤900px = Karten
```

### FormHandler (`components/form-handler.js`)
**Form-Validation & Auto-Save** - Fehlermarkierung und automatische Persistierung
```javascript
const handler = new FormHandler(questions, config);
handler.handleSubmit(event, onSuccessCallback);
// ✅ Visual error marking, smooth scroll to first error
// ✅ Auto-save on radio button changes (wenn persistence aktiviert)
```

### Persistence Services

#### PersistenceManagerFactory (`services/persistence-manager-factory.js`)
**Strategy Pattern** - Automatische Auswahl der Persistierungs-Strategie
```javascript
import { PersistenceManagerFactory } from './services/persistence-manager-factory.js';

// Automatische Manager-Auswahl basierend auf Konfiguration
const manager = PersistenceManagerFactory.createManager(config);

// Einheitliche API für alle Persistierungs-Modi
manager.saveAnswers(folder, answers, config);
const savedAnswers = await manager.loadAnswers(folder, config);
manager.clearAnswers(folder);
```

#### HybridPersistenceManager (`services/hybrid-persistence-manager.js`)
**Hybrid-Modus** - LocalStorage + Server-Backup für optimale Performance und Datensicherheit
```javascript
// ✅ Beste Performance durch LocalStorage-Cache
// ✅ Datensicherheit durch automatisches Server-Backup
// ✅ Geräte-Synchronisation möglich
// ✅ Fallback bei Server-Ausfall
// ✅ Intelligent retry mit "try_reloading" Feature
```

#### ServerPersistenceManager (`services/server-persistence-manager.js`)
**Server-Modus** - Reine Server-basierte Persistierung
```javascript
// ✅ Zentrale Datenhaltung
// ✅ Request-Deduplication und Caching
// ✅ Session-Token-basierte Zuordnung
// ✅ Automatische Cleanup-Mechanismen
```

### 🛡️ Technische Verbesserungen

#### LocalStorage-Persistierung (Production Ready)
- **Automatische Speicherung:** Antworten werden bei Eingabe automatisch gespeichert
- **Intelligente UI:** "Gespeicherte Antworten löschen"-Button nur bei vorhandenen Daten sichtbar
- **Konfigurations-gesteuert:** Aktivierung über `"persistence": {"enabled": true, "type": "localstorage"}`
- **Silent Operation:** Läuft komplett im Hintergrund ohne Debug-Ausgaben
- **Pro Fragebogen:** Separate Speicherung für jeden Fragebogen-Ordner

#### Chart-Interferenz-Schutz
- **Problem gelöst:** Chart-Rendering-Konflikte durch Container-Isolation
- **Architektur-Prinzip:** "Solve interference through isolation, not through protection"
- **Implementierung:** Separate DOM-Container für jeden Chart-Typ

#### D3.js Gauge-Chart mit bewährtem Pattern
- **Koordinatensystem-Konsistenz:** Einheitliche Winkel-Berechnung für Arcs, Pointer und Tick-Marks
- **Critical Success Pattern:** Synchronisierte radian-Werte vermeiden Misalignment
- **Debugging-freundlich:** Konsistente Angle-Calculation-Pipeline

#### ES6-Module-Architektur
- **Import/Export:** Native ES6-Module ohne Build-Tools
- **Tree-Shaking ready:** Modulare Struktur für zukünftige Optimierungen
- **Type-Safety ready:** Vorbereitet für TypeScript-Migration

#### Responsive-Modus (Version 2.0)
- **Automatische Umschaltung:** >900px = Tabellen-Modus, ≤900px = Karten-Modus
- **Live-Responsivität:** Dynamische Anpassung bei Fenstergrößenänderung
- **Antwort-Erhaltung:** Ausgewählte Antworten bleiben beim Modus-Wechsel erhalten
- **Event-Management:** Intelligente Cleanup-Mechanismen für Resize-Listener

## 🚀 Verwendung

### Schnellstart

```bash
# Anwendung öffnen
open index.html
```

Die Anwendung:

- Verwendet modulare Services für bessere Wartbarkeit
- Lädt Fragebogen-Daten dynamisch aus `quests/`
- Benötigt keinen Build-Step oder Server
- Läuft direkt im Browser

## 📝 Fragebogen-Format

### Fragenstruktur (`questions.txt`)

```text
A1|Ich kann meine Arbeitszeit selbst einteilen
A2|Ich kann entscheiden, wie ich meine Arbeit erledige
B1|Ich erhalte regelmäßiges Feedback
```

Format: `<Kategorie-ID>|<Fragetext>`

### Konfiguration (`config.json`)

```json
{
  "title": "Autonomie-Fragebogen",
  "description": "Messung der wahrgenommenen Autonomie",
  "answers": {
    "Stimme gar nicht zu": 1,
    "Stimme eher nicht zu": 2,
    "Neutral": 3,
    "Stimme eher zu": 4,
    "Stimme voll zu": 5
  },
  "categories": {

## 🚀 Verwendung

### Schnellstart

```bash
# Anwendung öffnen
open index.html
```

Die Anwendung:
- Verwendet modulare Services für bessere Wartbarkeit
- Lädt Fragebogen-Daten dynamisch aus `quests/`
- Benötigt keinen Build-Step oder Server
- Läuft direkt im Browser

## � Fragebogen-Format

### Fragenstruktur (`questions.txt`)
```text
A1|Ich kann meine Arbeitszeit selbst einteilen
A2|Ich kann entscheiden, wie ich meine Arbeit erledige
B1|Ich erhalte regelmäßiges Feedback
```

Format: `<Kategorie-ID>|<Fragetext>`

### Konfiguration (`config.json`)
```json
{
  "title": "Autonomie-Fragebogen",
  "description": "Messung der wahrgenommenen Autonomie",
  "answers": {
    "Stimme gar nicht zu": 1,
    "Stimme eher nicht zu": 2,
    "Neutral": 3,
    "Stimme eher zu": 4,
    "Stimme voll zu": 5
  },
  "categories": {
    "A": { "name": "Zeitautonomie", "color": "#3B82F6" },
    "B": { "name": "Methodenautonomie", "color": "#10B981" }
  },
  "chart": {
    "type": "radar",
    "title": "Autonomie-Profil"
  },
  "input": {
    "display": "responsive",
    "header_repeating_rows": 5
  },
  "persistence": {
    "enabled": true,
    "type": "localstorage|hybrid|server",
    "server_endpoint": "api/questionnaire-data-prod.php",
    "try_reloading": true
  }
}
```

**Display-Modi:**
- `"column"`: Immer Tabellen-Modus
- `"inline"`: Immer Karten-Modus  
- `"responsive"`: Automatische Umschaltung bei 900px Breakpoint

**Persistierung-Optionen:**
- `"persistence": {"enabled": false}`: Keine Speicherung (Standard)
- `"persistence": {"enabled": true, "type": "localstorage"}`: Reine LocalStorage-Speicherung
- `"persistence": {"enabled": true, "type": "hybrid"}`: LocalStorage + Server-Backup (empfohlen)
- `"persistence": {"enabled": true, "type": "server"}`: Reine Server-Persistierung
- `"try_reloading": true`: "Erneut versuchen"-Button bei Server-Verbindungsfehlern
- Smart UI: Intelligente Button-Sichtbarkeit basierend auf Daten-Verfügbarkeit und Persistierungs-Modus

## 🎨 Chart-Typen

- **Radar**: Multidimensionale Darstellung mit D3.js
- **Bar**: Balkendiagramm mit Chart.js  
- **Gauge**: Tachometer-Darstellung mit D3.js

## �️ Services API

### QuestionnaireLoader
Lädt Fragebogen-Daten asynchron.

```javascript
import { QuestionnaireLoader } from './services/questionnaire-loader.js';

const data = await QuestionnaireLoader.loadQuestionnaire('autonomie');
// { questions: [...], config: {...}, folder: 'autonomie' }
```

### URLHashManager
Verwaltet URL-Hash-Parameter für Persistierung von Antworten.

```javascript
import { URLHashManager } from './utils/url-hash-manager.js';

const scores = URLHashManager.parseScoresFromHash(questions);
URLHashManager.updateHash(answers);
```

## 🌐 Browser-Kompatibilität

**Unterstützte Browser:**

- Chrome 67+
- Firefox 63+
- Safari 13.1+
- Edge 79+

**Erforderliche Features:**

- ES6 Modules
- Fetch API
- URLSearchParams
- Modern JavaScript (ES2018+)

## 🏗️ Architektur

### Modularer Aufbau

Die Anwendung (`index.html`) verwendet eine schlanke modulare Architektur:

✅ **Vorteile:**

- **Wiederverwendbare Services**: `QuestionnaireLoader` und `URLHashManager`
- **Bessere Wartbarkeit**: Klare Trennung von Datenlade-Logik und UI
- **Einfach erweiterbar**: Neue Services können problemlos hinzugefügt werden
- **Kein Build-Step**: Direkt im Browser lauffähig
- **ES6 Module**: Moderne JavaScript-Architektur

### Design-Prinzipien

- **Client-seitig**: Alle Logik läuft im Browser
- **Statische Dateien**: Nur JSON und TXT Dateien als Datenquellen
- **CDN-Dependencies**: Keine lokalen Library-Installationen
- **Hash-Navigation**: URL-basierte Persistierung von Antworten

## 🚀 Neue Fragebögen hinzufügen

1. **Ordner erstellen:** `quests/mein-fragebogen/`
2. **Fragen definieren:** `questions.txt` mit `ID|Fragetext` Format
3. **Konfiguration:** `config.json` mit Antworten, Kategorien und Chart-Typ
4. **Automatische Erkennung:** Fragebogen erscheint automatisch im Menü

## � Externe Abhängigkeiten

- [TailwindCSS](https://cdn.tailwindcss.com) (CDN)
- [Chart.js](https://cdn.jsdelivr.net/npm/chart.js) (CDN) 
- [D3.js](https://d3js.org) (für Radar-Charts)
- [Google Fonts: Inter](https://fonts.googleapis.com/css2?family=Inter)

## 📈 Entwicklungshistorie

### Version 2.1 - Hybrid-Persistierung & API-Backend (September 2025)

**Neue Features:**
- ✅ **Hybrid-Persistierung:** LocalStorage + Server-Backup für optimale Performance
- ✅ **Server-Persistierung:** Reine Server-basierte Speicherung für zentrale Datenhaltung
- ✅ **PHP-REST-API:** Production-ready Backend mit MySQL/MariaDB-Support
- ✅ **Strategy Pattern:** PersistenceManagerFactory für flexible Persistierungs-Strategien
- ✅ **Try-Reloading:** Intelligente Retry-Mechanismen bei Server-Verbindungsfehlern
- ✅ **Session-Management:** UUID-basierte Session-Tokens für Benutzer-Zuordnung
- ✅ **Request-Deduplication:** Optimierte Server-Kommunikation mit Caching
- ✅ **Database-Schema:** Vollständiges MySQL/MariaDB-Setup mit Cleanup-Mechanismen

### Version 2.0 - Modulare Architektur (September 2025)

**Grundlegende Modernisierung:**
- ✅ **Wartbarkeit:** Von 800+ auf 160 Zeilen in `index.html` reduziert
- ✅ **Modularität:** Klare Trennung der Verantwortlichkeiten
- ✅ **Chart-Stabilität:** Container-Isolation verhindert Rendering-Konflikte
- ✅ **D3.js Best Practices:** Bewährte Coordinate-System-Pattern implementiert
- ✅ **LocalStorage-Persistierung:** Automatische Antwortenspeicherung mit intelligenter UI
- ✅ **Production Ready:** Saubere Implementierung ohne Debug-Ausgaben

**Breaking Changes:**
- Umstellung auf ES6-Module (requires moderne Browser)
- CSS-Styles in separate Datei ausgelagert
- Neue Ordnerstruktur mit `app/`, `components/`, `charts/`

**Backwards Compatibility:**
- Alle bestehenden `quests/` funktionieren weiterhin
- URL-Hash-Sharing bleibt kompatibel
- API der Services unverändert

### Version 1.x - Monolithische Architektur

**Probleme gelöst:**
- ❌ Chart-Interferenz zwischen Radar und Gauge Charts
- ❌ Unübersichtliche 800+ Zeilen `index.html`
- ❌ Schwierige Wartbarkeit bei neuen Features
- ❌ D3.js Koordinatensystem-Konflikte

## 🤝 Entwicklung

### Prinzipien

- Kein Build-Step erforderlich
- Nur statische Dateien
- Client-seitige Logik
- CDN-basierte Dependencies
- Moderne Browser-Features

### Debugging

- Browser-DevTools verwenden
- Console-Logs für Service-Aufrufe
- Network-Tab für Datenlade-Vorgänge
- Sources-Tab für JavaScript-Debugging

### Nächste Schritte (Roadmap)

- [ ] **Bar Chart implementieren** in `charts/bar-chart.js`
- [ ] **Unit Tests hinzufügen** für alle Module
- [ ] **TypeScript-Migration** für bessere Typisierung
- [ ] **Bundle-Splitting** für Performance-Optimierung
- [ ] **PWA-Features** für Offline-Nutzung

---

Für detaillierte Informationen siehe [Coding Instructions](.github/copilot-instructions.md) und Beispiel-Konfigurationen in `quests/`.
