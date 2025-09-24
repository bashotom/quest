# Gauge Charts in Result Tiles Feature

## Overview
This feature adds individual gauge charts to result tiles when `"evaluation_gauge": true` is set in the configuration file.

## Configuration

To enable gauge charts in result tiles, add the following to your questionnaire's `config.json`:

```json
{
  "resulttiles": {
    "enabled": true,
    "header": "{percent}% {category}",
    "content": "Details about the results for {category}.",
    "evaluation_gauge": true
  }
}
```

## How it works

1. **Configuration Check**: When `resulttiles.evaluation_gauge` is set to `true`, the system will add a gauge chart container to each result tile.

2. **Chart Rendering**: For each category, a gauge chart is rendered showing:
   - Current score vs maximum possible score
   - Category name as label
   - Percentage value
   - Visual tachometer-style gauge

3. **Responsive Design**: Gauge charts are sized to fit within the result tiles (180px height) and are responsive.

## Technical Implementation

### Files Modified:
- `components/result-renderer.js`: Added gauge chart rendering logic
- `css/styles.css`: Added gauge container styling

### Dependencies:
- D3.js (already loaded in index.html)
- `charts/gauge-chart.js`: Existing gauge chart implementation

### Integration:
- Result tiles are rendered by `ResultRenderer.render()`
- Gauge charts are rendered asynchronously after DOM creation
- Error handling included for missing D3.js or rendering issues

## Example Usage

With the autonomie questionnaire (`quests/autonomie/config.json`), gauge charts will appear in result tiles showing individual category scores like:
- A: gesunde Abgrenzung
- B: gesunder Egoismus  
- C: gesunde Aggression
- etc.

Each tile will contain both the evaluation text and a visual gauge chart representation of the score.

## Troubleshooting

- **No gauge appears**: Check that `evaluation_gauge: true` is set in config.json
- **Error messages**: Check browser console for D3.js loading issues
- **Layout issues**: Verify CSS styles are loaded correctly

## Future Enhancements

- Configurable gauge colors per category
- Custom gauge size settings
- Animation effects for gauge rendering