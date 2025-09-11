# Produktspezifikation: Dynamischer Fragebogen (Webanwendung)

## 1. Zielsetzung
Die Webanwendung dient der Durchführung, Auswertung und Visualisierung von Fragebögen mit dynamisch konfigurierbaren Fragen, Antwortoptionen und Auswertungsdiagrammen. Sie ist für verschiedene Fragebogen-Typen und -Inhalte flexibel einsetzbar.

## 2. Hauptfunktionen
- **Dynamisches Laden von Fragebögen**: Fragen und Konfiguration werden aus Text- und YAML-Dateien geladen.
- **Mehrere Fragebögen**: Auswahl über ein Top-Menü, automatische Erkennung aller verfügbaren Fragebögen.
- **Konfigurierbare Antworten**: Antwortoptionen und deren Werte werden aus der Konfiguration geladen.
- **Kategorien**: Jede Frage ist einer Kategorie zugeordnet, Kategorien werden in der Auswertung aggregiert.
- **Radar-, Balken- und Gauge-Diagramm**: Die Auswertungsart ist pro Fragebogen konfigurierbar.
- **Antwort-Persistenz**: Antworten werden beim Wechsel zwischen Auswertung und Fragebogen erhalten.
- **Teilen-Link**: Die aktuelle Beantwortung kann als Link geteilt werden.

## 3. Technische Details
- **Frontend**: HTML, Tailwind CSS, JavaScript (ohne Framework)
- **Diagramme**: Chart.js (Radar, Bar, Gauge) und optional Google Charts (Gauge)
- **Dateistruktur**:
  - `/index.html`: Hauptanwendung
  - `/quests/<fragebogen>/questions.txt`: Fragen
  - `/quests/<fragebogen>/config.yml`: Konfiguration (Antworten, Kategorien, Chart-Typ, etc.)
  - `/docs/spec.md`: Produktspezifikation
- **Konfigurationsoptionen**:
  - `answers`: Antwortoptionen mit Label und Wert
  - `categories`: Kategorien mit Schlüssel und Beschreibung
  - `chart`: Chart-Typ (`radar`, `bar`, `gauge`), optional `top` für die Ausrichtung im Radar-Chart
  - `title`, `description`: Metadaten für den Fragebogen

## 4. Bedienung
- Auswahl des Fragebogens über das Menü
- Beantwortung der Fragen durch Auswahl der Antwortoptionen
- Auswertung per Button, Anzeige des Diagramms und Teil-Link
- Navigation zurück zum Fragebogen mit Erhalt der Antworten

## 5. Besondere Features
- **Flexible Reihenfolge der Kategorien**: Über das `top`-Attribut in der YAML-Konfiguration kann die Ausrichtung der Achsen im Radar-Chart gesteuert werden.
- **Automatische URL-Korrektur**: Fetch-URLs werden so gebaut, dass sie auf beliebigen Servern funktionieren.
- **Barrierearm**: Tastaturbedienung und klare visuelle Hervorhebung der Auswahl

## 6. Erweiterbarkeit
- Neue Fragebögen können durch Anlegen eines neuen Unterordners in `/quests` mit `questions.txt` und `config.yml` hinzugefügt werden.
- Weitere Diagrammtypen oder Auswertungslogiken können durch Anpassung der JS-Logik ergänzt werden.

## 7. Nicht-Funktionen
- Keine Benutzerverwaltung oder Authentifizierung
- Keine Speicherung der Ergebnisse auf dem Server

---
Letzte Aktualisierung: 12.09.2025
