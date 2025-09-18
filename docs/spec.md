
# Produktspezifikation: Dynamischer Fragebogen (Webanwendung)

## 1. Zielsetzung
Die Anwendung ermöglicht das browserbasierte Ausfüllen, Auswerten und Visualisieren von beliebigen Fragebögen, die rein aus statischen Dateien bestehen. Sie ist vollständig clientseitig, benötigt keinen Build-Schritt und keinen Server. Mit Version 2.0 (September 2025) wurde eine modulare ES6-Architektur eingeführt, die bessere Wartbarkeit und Erweiterbarkeit bietet.

## 2. Hauptfunktionen

### 2.1 Kern-Features
- **Dynamisches Laden**: Fragebögen werden aus Unterordnern in `quests/` erkannt und per Menü auswählbar gemacht.
- **Fragen & Konfiguration**: Jede Umfrage besteht aus `questions.txt` (Pipe-separierte Fragen) und `config.json` (JSON mit Titel, Beschreibung, Antwortoptionen, Kategorien, Chart-Optionen).
- **Antworten**: Antwortoptionen und deren Werte werden aus JSON geladen und dynamisch als Radio-Buttons gerendert.
- **Kategorien**: Jede Frage ist per ID-Präfix einer Kategorie zugeordnet, Kategorien werden in der Auswertung aggregiert.
- **Diagramm-Auswertung**: Die Auswertung erfolgt als Radar-, Balken- oder Gauge-Chart (D3.js/Chart.js), gesteuert durch die JSON-Konfiguration.
- **Antwort-Persistenz & Teilen**: Antworten werden im URL-Hash gespeichert, sodass sie beim Reload oder Teilen des Links erhalten bleiben.
- **Responsive UI**: Zwei Darstellungsmodi (Tabellen- und Kartenmodus), automatische Umschaltung auf kleinen Bildschirmen, moderne Optik mit TailwindCSS.

### 2.2 Erweiterte Features (Version 2.0)
- **Modulare Architektur**: ES6-Module für bessere Code-Organisation und Wartbarkeit
- **Chart-Interferenz-Schutz**: Container-Isolation verhindert Rendering-Konflikte zwischen verschiedenen Chart-Typen
- **Form-Validation**: Intelligente Fehlermarkierung mit Scroll-Navigation zu unvollständigen Fragen
- **Gauge-Chart-Optimierung**: Präzise D3.js-Implementierung mit konsistentem Koordinatensystem
- **Entwicklungsfreundlich**: Modulare Struktur ermöglicht einfaches Testing und Debugging einzelner Komponenten

## 3. Technische Details

### 3.1 Modulare Architektur (Version 2.0)
- **Frontend**: Modulare ES6-Struktur mit klarer Trennung der Verantwortlichkeiten
- **Hauptkomponenten**:
  - `index.html` (~160 Zeilen): HTML-Struktur und Module-Bootstrap
  - `app/questionnaire-app.js`: Zentrale Anwendungslogik und Orchestrierung
  - `components/`: UI-Komponenten (QuestionRenderer, FormHandler)
  - `charts/`: Chart-Module (ChartRenderer, GaugeChart)
  - `services/`: Datenverarbeitung (QuestionnaireLoader, ConfigParser)
  - `utils/`: Hilfsfunktionen (URLHashManager)
  - `css/styles.css`: Alle Styles (ausgelagert aus index.html)

### 3.2 Dateistruktur
```
quest/
├── index.html                    # Haupteingang (~160 Zeilen)
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
│   └── config-parser.js          # JSON-Parsing
├── utils/                        # Hilfsfunktionen
│   └── url-hash-manager.js       # URL-Hash-Management
├── js/                          # Legacy Chart-Libraries
│   └── radarChart.js            # RadarChart-Rendering (D3.js)
└── quests/                      # Fragebogen-Daten
    ├── <name>/questions.txt     # Fragen (Format: <ID>|<Fragetext>)
    └── <name>/config.json       # JSON-Konfiguration
```

### 3.3 Konfigurationsoptionen in JSON
- `title`: Titel des Fragebogens
- `description`: Beschreibung
- `answers`: Array von Antwortoptionen (`[{"Label": Wert}]`)
- `categories`: Array von Kategorien (`[{"A": "Autonomie"}]`)
- `chart`: Chart-Objekt (`{"type": "radar|bar|gauge"}`, optional `"top": "<Kategorie>"`)
- `input`: (optional) UI-Optionen (`{"display": "inline|column", "size": N, "header_repeating_rows": N}`)

### 3.4 Datenfluss (Modular)
1. **Bootstrap**: `index.html` lädt `QuestionnaireApp` via ES6-Import
2. **Initialisierung**: QuestionnaireApp koordiniert alle Services und Komponenten
3. **Datenladung**: QuestionnaireLoader fetcht `questions.txt` und `config.json`
4. **UI-Rendering**: QuestionRenderer generiert Form basierend auf Display-Modus
5. **Form-Handling**: FormHandler verwaltet Validation und Submission
6. **Chart-Rendering**: ChartRenderer wählt entsprechenden Chart-Typ und Container
7. **Persistenz**: URLHashManager behandelt URL-Hash für Sharing/Bookmarking

## 4. Bedienung

### 4.1 Standard-Workflow
- Auswahl des Fragebogens über das Menü (automatisch generiert)
- Wechsel zwischen Tabellen- und Karten-Darstellungsmodus
- Beantwortung der Fragen durch Radio-Buttons (Tabellen- oder Kartenmodus)
- Optionale Schnell-Ausfüllung mit Min/Max/Zufallswerten für Testing
- Auswertung per Button, Anzeige des entsprechenden Diagramms und eines Teil-Links
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

## 6. Erweiterbarkeit

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
