# Quest - Dynamische Fragebogen-App

Eine schlanke, einseitige Web-Anwendung für dynamische Fragebögen mit Chart-Visualisierung.

## 🎯 Projektübersicht

- **Typ:** Dynamische Fragebogen-Web-App (Single-Page, kein Build-Step)
- **Architektur:** Client-seitig, statische Dateien
- **Charts:** D3.js Radar-Charts, Chart.js für Bar/Gauge
- **Styling:** TailwindCSS (CDN)

## 📁 Dateistruktur

```
quest/
├── index.html                    # Hauptanwendung (modulare Architektur)
├── services/                     # Minimale Services
│   └── questionnaire-loader.js   # Datenlade-Service
├── utils/                        # Hilfsfunktionen
│   └── url-hash-manager.js       # URL-Hash-Management
├── js/                          # Chart-Libraries
│   └── radarChart.js            # Custom D3.js Radar-Chart
└── quests/                      # Fragebogen-Daten
    ├── autonomie/               # Autonomie-Fragebogen
    │   ├── questions.txt        # Fragen (ID|Text Format)
    │   └── config.json          # Konfiguration
    ├── ace/                     # ACE-Fragebogen
    └── resilienz/               # Resilienz-Fragebogen
```

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
  }
}
```

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

---

Für detaillierte Informationen siehe [Coding Instructions](.github/copilot-instructions.md) und Beispiel-Konfigurationen in `quests/`.
