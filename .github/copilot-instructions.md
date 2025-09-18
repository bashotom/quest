# Copilot AI Coding Agent Instructions for `quest`

## Project Overview
- **Type:** Dynamic questionnaire web app (single-page, no build step)
- **Main UI/Logic:** `index.html` (HTML, JS, TailwindCSS, Chart.js)
- **Questionnaires:** Located in `quests/<name>/` (each with `questions.txt` and `config.json`)
- **No backend/server**: All logic is client-side, fetches static files

## Key Components
- `index.html`: Contains all JavaScript for loading, rendering, evaluating, and charting questionnaires. No external JS files.
- `quests/`: Each subfolder (e.g. `autonomie`, `ace`) is a questionnaire with:
  - `questions.txt`: Pipe-separated lines (`<ID>|<Fragetext>`) for each question
  - `config.json`: JSON with `title`, `description`, `answers`, `categories`, `chart`, and `input` options

## Data Flow
- On load, JS fetches `questions.txt` and `config.json` for the selected questionnaire
- Questions and config are parsed in JS, then rendered as a table with radio buttons
- User answers are stored in the URL hash for persistence/sharing
- On submit, results are evaluated and shown as a chart (radar/bar/gauge via Chart.js)

## Patterns & Conventions
- **Dynamic menu**: Top menu is generated from available folders in `quests/`
- **JSON parsing**: Native JSON.parse() in `index.html` (no external library)
- **Answer mapping**: `answers` in JSON define both label and value (e.g. `{"Ja": 1}`)
- **Categories**: Each question's ID prefix (e.g. `A1`) maps to a category in JSON
- **Chart type**: Controlled by `chart.type` in JSON (`radar`, `bar`, `gauge`)
- **No build/test scripts**: All development is direct file editing; reload browser to test

## D3.js Gauge Chart Implementation Guide

### Critical Success Pattern for Gauge Charts
When implementing gauge charts with D3.js, the biggest challenge is synchronizing arcs, pointer, and tick marks. Use this proven pattern:

#### 1. Define Gauge Range (tachometer-style semicircle)
```javascript
const startAngleDeg = 225; // bottom-left
const endAngleDeg = 315;   // bottom-right  
const totalAngleDeg = endAngleDeg - startAngleDeg; // 90 degrees
```

#### 2. CRITICAL: Use Same Coordinate System Throughout
```javascript
// Convert degrees to radians ONCE
const startAngle = (startAngleDeg * Math.PI) / 180;
const endAngle = (endAngleDeg * Math.PI) / 180;

// Calculate value position using SAME system
const valueRatio = Math.min(value / maxScore, 1);
const valueAngleDeg = startAngleDeg + valueRatio * totalAngleDeg;
const valueAngle = (valueAngleDeg * Math.PI) / 180;
```

#### 3. D3 Arcs - Use Identical Radian Values
```javascript
// Background arc
const backgroundArc = d3.arc()
    .innerRadius(radius * 0.7)
    .outerRadius(radius * 0.9)
    .startAngle(startAngle)  // SAME as below
    .endAngle(endAngle);

// Value arc - SAME coordinate origin
const valueArc = d3.arc()
    .innerRadius(radius * 0.7)
    .outerRadius(radius * 0.9)
    .startAngle(startAngle)  // SAME as above
    .endAngle(valueAngle);   // Uses SAME calculation
```

#### 4. Pointer/Needle - IDENTICAL Angle Calculation
```javascript
// Use SAME valueAngle as arcs
const needleX = Math.cos(valueAngle) * (radius * 0.8);
const needleY = Math.sin(valueAngle) * (radius * 0.8);
```

#### 5. Tick Marks - CONSISTENT System
```javascript
const scaleAngles = [225, 270, 315]; // degrees
scaleAngles.forEach((angleDeg) => {
    const angle = (angleDeg * Math.PI) / 180; // SAME conversion
    const x = Math.cos(angle) * (radius * 0.6);
    const y = Math.sin(angle) * (radius * 0.6);
    // Position labels at x, y
});
```

### Key Lessons Learned
- **Coordinate System Conflicts**: SVG Y-axis points DOWN, math Y-axis points UP
- **Solution**: Use ONE consistent angle calculation throughout - don't mix systems
- **Critical**: D3 arc(), trigonometry, and positioning must use IDENTICAL radian values
- **Debug Strategy**: Console.log angle values to verify synchronization
- **Common Mistake**: Trying to "fix" misalignment with transforms instead of using consistent math

### Gauge Chart Debugging Checklist
1. ✅ All angles calculated with same degree-to-radian conversion
2. ✅ Arcs use startAngle/endAngle with same origin point  
3. ✅ Pointer uses SAME valueAngle calculation as value arc
4. ✅ Tick marks use SAME coordinate system as arcs/pointer
5. ✅ No mixing of SVG transforms with mathematical rotations

## Examples
- To add a new questionnaire: create a new folder in `quests/` with `questions.txt` and `config.json`
- To change answer options or chart type: edit the relevant `config.json`
- To change UI logic: edit JS in `index.html` (all logic is inline)

## External Dependencies
- [TailwindCSS](https://cdn.tailwindcss.com) (CDN)
- [Chart.js](https://cdn.jsdelivr.net/npm/chart.js) (CDN)
- [Google Fonts: Inter](https://fonts.googleapis.com/css2?family=Inter)

## Project-Specific Advice
- Do not add a build step or server logic
- Keep all questionnaire logic in `index.html` (no splitting into modules)
- When adding config options, update both the JSON parser and the render logic
- Use only static file fetches for data (no dynamic API calls)
- Maintain compatibility with existing JSON/question formats
- For gauge charts: ALWAYS use the proven D3.js pattern above to avoid coordinate system conflicts

## Chart Interference Prevention - Critical Lessons Learned (Sep 2025)

### Problem: Chart Rendering Conflicts
When multiple chart types (RadarChart, GaugeChart) are rendered in the same DOM container, persistent event listeners and D3.js selections can cause chart interference, where one chart type overwrites another unexpectedly.

### Root Cause Analysis
1. **Global Event Listeners**: RadarChart adds `window.addEventListener('resize', handleResize)` that persists across navigation
2. **Shared Container**: Using same DOM element (`#radarChart`) for different chart types creates race conditions
3. **D3.js State Persistence**: D3 selections and event handlers remain active even after navigating away from chart

### ❌ Failed Solutions (Avoid These Approaches)
- **Complex Event Listener Management**: Trying to cleanup/track global event listeners is error-prone
- **MutationObserver Protection**: DOM watching adds complexity without solving root cause
- **Chart Rendering IDs**: Tracking render states is fragile and doesn't prevent interference
- **Shadow DOM Isolation**: Adds architectural complexity for D3.js charts

### ✅ Proven Solution: Separate Container Architecture
```html
<!-- Each chart type gets its own dedicated container -->
<div id="radar-chart-container" class="chart-type-container hidden">
    <div id="radarChart"></div>
</div>
<div id="gauge-chart-container" class="chart-type-container hidden">  
    <div id="gaugeChart"></div>
</div>
<div id="bar-chart-container" class="chart-type-container hidden">
    <div id="barChart"></div>
</div>
```

```javascript
// Show/hide containers based on chart type
function renderChart(chartType) {
    // Hide all containers
    document.querySelectorAll('.chart-type-container').forEach(c => c.classList.add('hidden'));
    
    // Show only needed container
    const targetContainer = document.getElementById(`${chartType}-chart-container`);
    if (targetContainer) {
        targetContainer.classList.remove('hidden');
        // Render chart in dedicated container - no interference possible!
    }
}
```

### Key Benefits of Separate Containers
1. **Mathematical Impossibility of Interference**: Different DOM elements cannot overwrite each other
2. **Event Listener Isolation**: Resize events remain contained to their specific chart containers
3. **Architectural Simplicity**: No complex state management or cleanup logic needed
4. **Performance**: No DOM watchers or protection mechanisms required
5. **Maintainability**: Clear separation of concerns, easy to debug

### Architecture Principle
**"Solve interference through isolation, not through protection"**
- Prevention via architecture > Detection via monitoring
- Simple container separation > Complex event management
- DOM isolation > JavaScript state tracking

## Key Files/Dirs
- `index.html` — main app logic, UI, and data flow
- `quests/` — all questionnaire data
- Example: `quests/autonomie/config.json`, `quests/autonomie/questions.txt`

---
For more, see the top of `index.html` and example configs in `quests/`.
