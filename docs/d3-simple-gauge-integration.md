# Simple Gauge Integration

## Übersicht
Das Quest-Projekt wurde erweitert, um eine zusätzliche Gauge-Chart-Variante zu unterstützen, die auf dem [d3-simple-gauge](https://github.com/antoinebeland/d3-simple-gauge) Projekt von Antoine Béland basiert.

## Konfiguration

Das GaugeChart unterstützt jetzt zwei Style-Varianten:

### Tachometer Style (Standard)
```json
{
  "chart": {
    "type": "gauge",
    "style": "tachometer",
    "scale_angles": [210, 270, 330]
  }
}
```

### Simple Gauge Style
```json
{
  "chart": {
    "type": "gauge",
    "style": "simple",
    "scale_angles": [210, 270, 330]
  }
}
```

### Parameter

- **`type`**: Muss auf `"gauge"` gesetzt werden
- **`style`**: 
  - `"tachometer"` (Standard) - Klassischer Tachometer mit Arcs und Zeiger
  - `"simple"` - Moderne Gauge mit animierten Segmenten
- **`scale_angles`**: Bei `"simple"` wird das interne Sektionen-System verwendet

## Funktionen

### Visual Design
- **Sektionen**: 3 farbige Segmente (Rot, Orange, Grün)
- **Animierter Zeiger**: Smooth Animation mit Elastic Ease
- **Responsive**: Passt sich an Container-Größe an
- **Interaktive Elemente**: Active-State für aktuelles Segment

### Anpassbare Eigenschaften
- Animationsdauer: 1500ms
- Animationsverzögerung: 100ms  
- Farben: Rot (#ef4444), Orange (#f97316), Grün (#22c55e)
- Zeiger-Farbe: Dunkelgrau (#1f2937)

## Technische Details

### Implementierung
Die Implementierung erfolgte in zwei Hauptklassen:

1. **`SimpleGauge`**: Hauptklasse basierend auf dem d3-simple-gauge Projekt
2. **`Needle`**: Zeiger-Klasse mit Animation und Pfad-Generierung

### CSS-Klassen
Folgende CSS-Klassen stehen für Anpassungen zur Verfügung:

```css
.simple-gauge .arc { /* Segment-Styling */ }
.simple-gauge .arc.active { /* Aktives Segment */ }
.simple-gauge .needle { /* Zeiger-Styling */ }
.simple-gauge .needle-center { /* Zeiger-Mittelpunkt */ }
.simple-gauge.min { /* Minimum-Status */ }
.simple-gauge.max { /* Maximum-Status */ }
.simple-gauge .chart-color1 { /* Erstes Segment (rot) */ }
.simple-gauge .chart-color2 { /* Zweites Segment (orange) */ }
.simple-gauge .chart-color3 { /* Drittes Segment (grün) */ }
```

## Beispiel

Das ACE-Questionnaire (`quests/ace/config.json`) wurde als Beispiel konfiguriert:

```json
{
  "title": "ACE-Fragebogen",
  "chart": {
    "type": "gauge",
    "style": "simple",
    "scale_angles": [210, 270, 330]
  }
}
```

## Fallback-Verhalten

Falls die simple Variante nicht verfügbar ist oder ein Fehler auftritt, fällt das System automatisch auf den Standard-Tachometer-Gauge zurück. Ebenso wird bei nicht erkannten `style`-Werten der Tachometer verwendet.

## Kompatibilität

- **D3.js Versionen**: Kompatibel mit D3.js v5+
- **Browser-Support**: Moderne Browser mit ES6-Unterstützung
- **Responsiv**: Funktioniert auf Desktop und Mobile
- **Integration**: Nahtlos in die bestehende Chart-Renderer-Architektur integriert

## Entwicklung

Zum Testen der neuen Funktion:

1. Server starten: `python3 -m http.server 8080`
2. Browser öffnen: `http://localhost:8080/#ace`
3. Questionnaire ausfüllen und submitten
4. Die d3-simple-gauge wird in der Evaluation angezeigt

Die Implementierung respektiert alle bestehenden Patterns des Quest-Projekts, einschließlich Container-Isolation und Race-Condition-Prevention.