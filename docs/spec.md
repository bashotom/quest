
# Produktspezifikation: Dynamischer Fragebogen (Webanwendung)

## 1. Zielsetzung
Die Anwendung ermöglicht das browserbasierte Ausfüllen, Auswerten und Visualisieren von beliebigen Fragebögen, die rein aus statischen Dateien bestehen. Sie ist vollständig clientseitig, benötigt keinen Build-Schritt und keinen Server.

## 2. Hauptfunktionen
- **Dynamisches Laden**: Fragebögen werden aus Unterordnern in `quests/` erkannt und per Menü auswählbar gemacht.
- **Fragen & Konfiguration**: Jede Umfrage besteht aus `questions.txt` (Pipe-separierte Fragen) und `config.json` (JSON mit Titel, Beschreibung, Antwortoptionen, Kategorien, Chart-Optionen).
- **Antworten**: Antwortoptionen und deren Werte werden aus JSON geladen und dynamisch als Radio-Buttons gerendert.
- **Kategorien**: Jede Frage ist per ID-Präfix einer Kategorie zugeordnet, Kategorien werden in der Auswertung aggregiert.
- **Diagramm-Auswertung**: Die Auswertung erfolgt als Radar-, Balken- oder Gauge-Chart (D3.js/Chart.js), gesteuert durch die JSON-Konfiguration.
- **Antwort-Persistenz & Teilen**: Antworten werden im URL-Hash gespeichert, sodass sie beim Reload oder Teilen des Links erhalten bleiben.
- **Responsive UI**: Zwei Darstellungsmodi (Tabellen- und Kartenmodus), automatische Umschaltung auf kleinen Bildschirmen, moderne Optik mit TailwindCSS.

## 3. Technische Details
- **Frontend**: Nur `index.html` (HTML, JS, TailwindCSS, D3.js, Chart.js), keine externen JS-Dateien außer für RadarChart.
- **Dateistruktur**:
  - `/index.html`: Enthält die gesamte App-Logik und das UI
  - `/quests/<name>/questions.txt`: Fragen (Format: `<ID>|<Fragetext>`)
  - `/quests/<name>/config.json`: JSON-Konfiguration (siehe unten)
  - `/js/radarChart.js`: RadarChart-Rendering (D3.js)
- **Konfigurationsoptionen in JSON**:
  - `title`: Titel des Fragebogens
  - `description`: Beschreibung
  - `answers`: Array von Antwortoptionen (`[{"Label": Wert}]`)
  - `categories`: Array von Kategorien (`[{"A": "Autonomie"}]`)
  - `chart`: Chart-Objekt (`{"type": "radar|bar|gauge"}`, optional `"top": "<Kategorie>"`)
  - `input`: (optional) UI-Optionen (`{"display": "inline|column", "size": N}`)
- **Datenfluss**:
  - Beim Laden werden Fragen und Konfiguration per `fetch` geladen und geparst.
  - Die UI wird dynamisch gerendert, Antworten werden im URL-Hash gespeichert.
  - Die Auswertung aggregiert die Werte pro Kategorie und zeigt das Ergebnis als Chart.

## 4. Bedienung
- Auswahl des Fragebogens über das Menü (automatisch generiert)
- Beantwortung der Fragen durch Radio-Buttons (Tabellen- oder Kartenmodus)
- Auswertung per Button, Anzeige des Diagramms und eines Teil-Links
- Navigation zurück zum Fragebogen mit Erhalt der Antworten

## 5. Besondere Features
- **Vollständig statisch**: Keine Server-Logik, keine Authentifizierung, keine Speicherung auf dem Server
- **Flexible Erweiterbarkeit**: Neue Fragebögen durch Anlegen eines neuen Unterordners in `quests/`
- **Barrierearm**: Tastaturbedienung, visuelle Hervorhebung, responsive Darstellung
- **Debug-Modus**: Per URL-Parameter aktivierbar, zeigt Maximalwerte an

## 6. Erweiterbarkeit
- Neue Fragebögen: Einfach neuen Ordner in `quests/` mit `questions.txt` und `config.json` anlegen
- Neue Chart-Typen oder UI-Optionen: Anpassung der Logik in `index.html` und ggf. `radarChart.js`

## 7. Nicht-Funktionen
- Keine Benutzerverwaltung, kein Login, keine serverseitige Speicherung
- Keine dynamischen API-Calls, keine Build-Tools, keine externen JS-Module (außer CDN)

---

Letzte Aktualisierung: 15.09.2025
