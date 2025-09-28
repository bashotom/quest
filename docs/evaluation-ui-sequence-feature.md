# Evaluation UI Sequence Feature

## Überblick
Das `evaluation_ui.sequence` Feature ermöglicht es, die Reihenfolge der Elemente auf der Auswertungsseite frei zu konfigurieren. Die drei verfügbaren Elemente sind:

- `"chart"` - Das Diagramm (Radar, Gauge oder Bar Chart)
- `"table"` - Die Ergebnistabelle  
- `"tiles"` - Die Ergebnis-Kacheln

## Konfiguration

### Standard-Reihenfolge (Default)
```json
{
  "evaluation_ui": {
    "sequence": [ "chart", "table", "tiles" ]
  }
}
```

### Alternative Reihenfolgen
```json
// Kacheln zuerst, dann Tabelle, dann Diagramm
{
  "evaluation_ui": {
    "sequence": [ "tiles", "table", "chart" ]
  }
}

// Nur Tabelle und Diagramm (Tiles werden übersprungen)
{
  "evaluation_ui": {
    "sequence": [ "table", "chart" ]
  }
}

// Diagramm am Ende
{
  "evaluation_ui": {
    "sequence": [ "tiles", "chart", "table" ]
  }
}
```

## Funktionsweise

### ConfigParser Integration
Die Konfiguration wird im `ConfigParser` verarbeitet:

```javascript
// Evaluation-UI Konfiguration verarbeiten
if (jsonData['evaluation_ui'] && typeof jsonData['evaluation_ui'] === 'object') {
    result.evaluationUi = {
        sequence: Array.isArray(jsonData['evaluation_ui'].sequence) 
            ? jsonData['evaluation_ui'].sequence 
            : ['chart', 'table', 'tiles']
    };
} else {
    result.evaluationUi = {
        sequence: ['chart', 'table', 'tiles']
    };
}
```

### ResultApp Implementation
Die `ResultApp` rendert die Elemente dynamisch in der konfigurierten Reihenfolge:

```javascript
renderEvaluation(scores) {
    const sequence = this.config.evaluationUi?.sequence || ['chart', 'table', 'tiles'];
    
    // Render elements in the specified sequence
    sequence.forEach(element => {
        this.renderSequenceElement(element, scores, processedData, chartType);
    });
}
```

### Bedingte Anzeige
- **Tabelle**: Wird nur angezeigt wenn `resulttable.enabled = true`
- **Kacheln**: Werden nur angezeigt wenn `resulttiles.enabled = true`  
- **Diagramm**: Wird immer angezeigt (basierend auf `chart.type`)

## Beispiel-Konfigurationen

### Autonomie Questionnaire (Standard)
```json
{
  "evaluation_ui": {
    "sequence": [ "chart", "table", "tiles" ]
  },
  "resulttable": {
    "enabled": true
  },
  "resulttiles": {
    "enabled": true
  }
}
```
**Ergebnis**: Diagramm → Tabelle → Kacheln

### Test-Autoscroll (Alternative Reihenfolge)
```json
{
  "evaluation_ui": {
    "sequence": [ "tiles", "table", "chart" ]
  },
  "resulttable": {
    "enabled": true
  },
  "resulttiles": {
    "enabled": true
  }
}
```
**Ergebnis**: Kacheln → Tabelle → Diagramm

## Technische Details

### HTML Struktur
Die `result.html` wurde erweitert um:
- Dynamischen Content-Bereich `#evaluation-content`
- Template-Elemente für Tabelle und Kacheln
- Flexibles Chart-Section Element

### Sequence Rendering
Jedes Element wird durch separate Methoden gerendert:
- `renderChartInSequence()` - Bewegt Chart-Section in dynamischen Bereich
- `renderTableInSequence()` - Klont Tabellen-Template und rendert Inhalt
- `renderTilesInSequence()` - Klont Kachel-Template und rendert Inhalt

### Kompatibilität
- **Rückwärtskompatibel**: Ohne `evaluation_ui` wird Standard-Reihenfolge verwendet
- **Fehlerbehandlung**: Unbekannte Sequence-Elemente werden übersprungen mit Warnung
- **Bedingte Anzeige**: Deaktivierte Elemente (enabled=false) werden übersprungen

## Verwendung

1. **Konfiguration hinzufügen** zu `config.json`:
   ```json
   "evaluation_ui": {
     "sequence": [ "tiles", "chart", "table" ]
   }
   ```

2. **Elemente aktivieren**:
   ```json
   "resulttable": { "enabled": true },
   "resulttiles": { "enabled": true }
   ```

3. **Testen**: Fragebogen ausfüllen und Auswertungsseite besuchen

Die Reihenfolge ist vollständig konfigurierbar und alle Kombinationen der drei Elemente sind möglich.