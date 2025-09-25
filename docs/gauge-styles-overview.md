# Gauge Chart Styles - Übersicht

## Verfügbare Styles

Das Quest-Projekt unterstützt jetzt zwei verschiedene Gauge Chart Styles:

### 1. Tachometer Style (`"tachometer"`)
**Standard-Style** - Wird auch verwendet, wenn kein `style` angegeben wird.

```json
{
  "chart": {
    "type": "gauge",
    "style": "tachometer",
    "scale_angles": [200, 270, 340]
  }
}
```

**Eigenschaften:**
- Klassischer Tachometer mit Bogensegmenten
- Konfigurierbarer Winkelbereich über `scale_angles`
- Unterstützt Traffic-Light-Segmente (rot, orange, grün)
- Zeiger zeigt aktuellen Wert an
- Skalierungsmarkierungen mit Werten

### 2. Simple Style (`"simple"`)
**Moderne Variante** - Basierend auf d3-simple-gauge

```json
{
  "chart": {
    "type": "gauge",
    "style": "simple",
    "scale_angles": [210, 270, 330]
  }
}
```

**Eigenschaften:**
- 3 farbige Segmente (rot, orange, grün)
- Animierter Zeiger mit Elastic Ease
- Moderne Optik mit Schatten und Effekten
- Automatische Active-State-Hervorhebung
- Responsive Design

## Verwendung in Questionnaires

### Beispiel: ACE-Fragebogen (Simple Style)
```json
{
  "title": "ACE-Fragebogen",
  "chart": {
    "type": "gauge",
    "style": "simple"
  }
}
```

### Beispiel: Autonomie-Fragebogen (Tachometer Style)  
```json
{
  "title": "Autonomie",
  "chart": {
    "type": "gauge",
    "style": "tachometer",
    "scale_angles": [200, 270, 340]
  }
}
```

## Fallback-Verhalten

- **Kein `style` angegeben**: Verwendet Tachometer (Standard)
- **Unbekannter `style`**: Verwendet Tachometer (Standard)
- **`style: "tachometer"`**: Explizit Tachometer
- **`style: "simple"`**: Simple Gauge mit Animation

## Kompatibilität

Beide Styles sind vollständig:
- ✅ Responsiv (Desktop/Mobile)
- ✅ Container-isoliert (keine Interferenz)
- ✅ Mit bestehender Chart-Renderer-Architektur kompatibel
- ✅ Mit allen Questionnaire-Konfigurationen kompatibel

## Wann welchen Style verwenden?

### Tachometer Style verwenden wenn:
- Klassisches, professionelles Design gewünscht
- Präzise Skalierung wichtig
- Traffic-Light-Segmente benötigt
- Bewährte, stabile Darstellung erforderlich

### Simple Style verwenden wenn:  
- Moderne, ansprechende Optik gewünscht
- Animation und Interaktivität wichtig
- Einfache 3-Segmente-Darstellung ausreichend
- Fokus auf visueller Attraktivität

## Technische Details

Beide Styles nutzen dieselbe API und sind über die GaugeChart-Klasse verfügbar:

```javascript
const chart = new GaugeChart(container, { style: "simple" });
chart.render(value, maxScore, categoryLabel);
```