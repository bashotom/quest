# Copilot AI Coding Agent Instructions for `quest`

## Project Overview
- **Type:** Dynamic questionnaire web app (single-page, no build step)
- **Architecture:** Modular ES6 structure with dedicated modules (Sep 2025 refactor)
- **Main Entry:** `index.html` (~160 lines) + `app/questionnaire-app.js` (main orchestrator)
- **Questionnaires:** Located in `quests/<name>/` (each with `questions.txt` and `config.json`)
- **No backend/server**: All logic is client-side, fetches static files

## ⚠️ CRITICAL: Configuration Implementation Rule
**BEFORE implementing any new configuration feature, ALWAYS check and ensure that the new configuration option is properly parsed and processed in `services/config-parser.js`.** 

The ConfigParser is the central bottleneck for all configuration-to-application mappings. New config options MUST be:
1. Added to the initial `result` object structure
2. Processed in the `parse()` method with appropriate defaults
3. Validated (if needed) in the `validate()` method

**Example Pattern:**
```javascript
// 1. Add to result object
const result = { 
    // existing properties...
    newFeature: {}  // ADD HERE FIRST
};

// 2. Process in parse method
if (jsonData.newFeature && typeof jsonData.newFeature === 'object') {
    result.newFeature = {
        enabled: jsonData.newFeature.enabled === true,
        type: jsonData.newFeature.type || 'default'
    };
} else {
    result.newFeature = { enabled: false, type: 'default' };
}
```

This rule prevents configuration-related bugs where settings are defined in JSON but not processed by the application.

## Modular Architecture (Version 2.0 - Sep 2025)

### Key Modules
- **`index.html`**: HTML structure + ES6 module bootstrapping (no inline JS logic)
- **`app/questionnaire-app.js`**: Main application class, orchestrates all modules
- **`components/question-renderer.js`**: UI rendering (table/card/responsive mode)
- **`components/form-handler.js`**: Form validation, error handling
- **`charts/chart-renderer.js`**: Chart management with container isolation
- **`charts/gauge-chart.js`**: D3.js gauge chart implementation
- **`charts/radar-chart.js`**: Modular radar chart orchestrator (uses radar/ modules)
- **`css/styles.css`**: All styles (extracted from index.html)
- **`services/questionnaire-loader.js`**: Data loading service
- **`utils/url-hash-manager.js`**: URL hash persistence

### Radar Chart Modular Structure (Sep 2025)
The radar chart has been fully modularized into specialized components:

```
charts/radar/
├── radar-config-parser.js     # Configuration parsing and setup
├── radar-data-processor.js    # Data processing & axis reordering
├── radar-grid.js             # Grid, axes, tickmarks, labels rendering
├── radar-arrows.js           # Arrow rendering (radiusvector/inverseradiusvector)
├── radar-data-renderer.js    # Data paths, areas, and points
├── radar-interactions.js     # Tooltips and hover effects
├── radar-legend.js          # Mobile legend rendering
├── radar-responsive.js      # Responsive handling and resize logic
└── utils/
    └── radar-math-utils.js   # Mathematical calculations and utilities
```

#### Radar Module Responsibilities

**RadarChart (Main Orchestrator)**
```javascript
import { RadarChart } from './charts/radar-chart.js';
const chart = new RadarChart(container, config);
chart.render(id, data, options);
```
- **Role**: Central radar chart coordination
- **Coordinates**: All radar modules, maintains API compatibility
- **Maintains**: Original API for backward compatibility

**RadarConfigParser (Configuration Management)**
```javascript
const cfg = RadarConfigParser.parseConfig(options);
const chartConfig = RadarConfigParser.parseChartConfig(cfg.config);
```
- **Role**: Parse user options and chart-specific configuration
- **Handles**: Responsive adjustments, option merging, chart config parsing
- **Features**: Arrow directions, tickmarks, horizontal lines, topaxis

**RadarDataProcessor (Data Management)**
```javascript
const processed = RadarDataProcessor.process(data, cfg.config);
const { data: processedData, axes: allAxis, maxValue } = processed;
```
- **Role**: Data normalization and axis management
- **Handles**: Axis object normalization, topaxis reordering, max value calculation
- **Features**: Category mapping, data structure validation

**RadarGrid (Grid & Axes Rendering)**
```javascript
const gridResult = RadarGrid.render(g, allAxis, finalConfig, chartConfig, rScale, maxValue, angleSlice);
```
- **Role**: SVG setup, background circles, axes, tickmarks, labels
- **Features**: Responsive label switching, text wrapping, tickmark positioning
- **Manages**: SVG initialization, glow filters, axis line rendering

**RadarArrows (Arrow Rendering)**
```javascript
RadarArrows.render(gridResult.axis, allAxis, chartConfig, rScale, maxValue, angleSlice);
```
- **Role**: Render directional arrows on axes
- **Supports**: radiusvector (outward), inverseradiusvector (inward)
- **Features**: Consistent arrow sizing, configurable directions

**RadarDataRenderer (Data Visualization)**
```javascript
const dataResult = RadarDataRenderer.render(g, processedData, allAxis, chartConfig, rScale, maxValue, angleSlice, finalConfig);
```
- **Role**: Render data paths, areas, and points
- **Features**: Inverse axis support, curved/linear paths, data point circles
- **Handles**: D3 line/area generators with radius calculations

**RadarInteractions (User Interactions)**
```javascript
RadarInteractions.setup(g, processedData, allAxis, chartConfig, rScale, maxValue, angleSlice, finalConfig);
```
- **Role**: Tooltip system and hover effects
- **Features**: Invisible interaction circles, position-aware tooltips
- **Manages**: Mouse events, tooltip positioning, fade transitions

**RadarLegend (Mobile Legend)**
```javascript
RadarLegend.render(id, finalConfig);
```
- **Role**: Mobile legend for narrow screens (<650px)
- **Features**: Category list with key-value pairs, responsive visibility
- **Manages**: DOM legend creation, styling, cleanup

**RadarResponsive (Responsive Handling)**
```javascript
RadarResponsive.setup(id, data, options, renderFunction);
```
- **Role**: Window resize handling and container validation
- **Features**: Debounced resize (250ms), container context checking
- **Prevents**: Chart interference, memory leaks, invalid re-renders

**RadarMathUtils (Mathematical Utilities)**
```javascript
const angleSlice = RadarMathUtils.calculateAngleSlice(total);
const rScale = RadarMathUtils.createRadiusScale(radius, maxValue);
```
- **Role**: Mathematical calculations and D3 utilities
- **Features**: Coordinate calculations, text wrapping, scale creation
- **Utilities**: Angle calculations, text anchoring, label positioning

### Module Responsibilities (Non-Radar Components)

#### QuestionnaireApp (Main Orchestrator)
```javascript
import { QuestionnaireApp } from './app/questionnaire-app.js';
const app = new QuestionnaireApp();
app.init();
```
- **Role**: Central application state management
- **Coordinates**: All other modules, event listeners, navigation
- **Owns**: Application lifecycle, DOM element references

#### ChartRenderer (Chart Management)
```javascript
ChartRenderer.render(chartType, scores, questions, config);
```
- **Role**: Chart rendering with interference prevention
- **Implements**: Container isolation pattern (radar/gauge/bar containers)
- **Manages**: Chart-specific rendering logic, DOM cleanup

#### QuestionRenderer (UI Components)
```javascript
QuestionRenderer.render(questions, config, container);
```
- **Role**: Form UI generation (table/card/responsive mode)
- **Handles**: Display mode switching, answer persistence
- **Supports**: Table, inline card, and responsive layouts (auto-switch at 900px)
- **Features**: Live responsive switching with answer preservation

#### FormHandler (Validation & Errors)
```javascript
const handler = new FormHandler(questions, config);
handler.handleSubmit(event, onSuccessCallback);
```
- **Role**: Form submission, validation, error highlighting
- **Features**: Visual error marking, smooth scroll to errors
- **Manages**: Radio button change listeners, validation state
- **Critical**: Handles questions/config parameter separation correctly
## Data Flow (Modular Version)
- **Bootstrap**: `index.html` loads `QuestionnaireApp` via ES6 import
- **Initialization**: QuestionnaireApp coordinates all services and components  
- **Data Loading**: QuestionnaireLoader fetches `questions.txt` and `config.json`
- **UI Rendering**: QuestionRenderer generates form based on display mode
- **Form Handling**: FormHandler manages validation and submission
- **Chart Rendering**: ChartRenderer selects appropriate chart type and container
- **Radar Chart Flow**: RadarChart orchestrates all radar modules for rendering
- **Persistence**: URLHashManager handles URL hash for sharing/bookmarking

## Patterns & Conventions

### ES6 Module Pattern
```javascript
// Module exports
export class ChartRenderer { ... }
export { QuestionRenderer };

// Module imports  
import { QuestionnaireApp } from './app/questionnaire-app.js';
import { ChartRenderer } from '../charts/chart-renderer.js';
```

### Container Isolation Pattern (Chart Interference Prevention)
```javascript
// Each chart type has dedicated container
document.getElementById('radar-chart-container');
document.getElementById('gauge-chart-container'); 
document.getElementById('bar-chart-container');

// ChartRenderer automatically manages container visibility
ChartRenderer.render(chartType, scores, questions, config);
```

### Consistent Module Structure
```javascript
export class ModuleName {
    constructor(dependencies) { ... }           // Dependency injection
    static render(data, container) { ... }      // Static rendering methods
    handleEvent(event) { ... }                  // Instance event handlers
    static setupEventListeners() { ... }        // Static setup methods
}
```

### Legacy Compatibility
- **Dynamic menu**: Top menu is generated from available folders in `quests/`
- **JSON parsing**: Native JSON.parse() (no external library needed)
- **Answer mapping**: `answers` in JSON define both label and value (e.g. `{"Ja": 1}`)
- **Categories**: Each question's ID prefix (e.g. `A1`) maps to a category in JSON
- **Chart type**: Controlled by `chart.type` in JSON (`radar`, `bar`, `gauge`)
- **Display modes**: Supports `column`, `inline`, and `responsive` modes in `input.display`
- **No build/test scripts**: All development is direct file editing; reload browser to test

### Responsive Mode (Version 2.0)
- **Automatic switching**: >900px = table mode, ≤900px = card mode
- **Live responsiveness**: Real-time adaptation during window resize
- **Answer preservation**: Selected answers persist during mode switches
- **Event management**: Throttled resize events (150ms) with proper cleanup

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

## Examples (Modular Approach)

### Adding a New Questionnaire
```bash
# Create new questionnaire folder
mkdir quests/new-questionnaire
echo "A1|Sample question text" > quests/new-questionnaire/questions.txt
# Create config.json with same structure as existing questionnaires
```

### Adding a New Chart Type
```javascript
// 1. Create new chart module: charts/new-chart.js
export class NewChart {
    constructor(container, config) { ... }
    render(data) { ... }
}

// 2. Extend ChartRenderer in charts/chart-renderer.js  
import { NewChart } from './new-chart.js';
// Add case 'newtype': return ChartRenderer.renderNewChart(...)

// 3. Add container in index.html
<div id="new-chart-container" class="chart-type-container w-full h-full hidden">
    <div id="newChart" class="w-full h-full"></div>
</div>
```

### Extending Radar Chart Components
```javascript
// Extend RadarGrid for new grid features
static renderCustomGrid(g, axes, config) {
    // Custom grid rendering logic
}

// Extend RadarDataRenderer for new visualization types
static renderCustomVisualization(g, data, config) {
    // Custom data rendering
}

// Extend RadarInteractions for new interaction types
static setupCustomInteractions(g, data, config) {
    // Custom interaction handling
}
```

### Extending Components
```javascript
// Extend QuestionRenderer for new display mode
static renderCustomMode(questions, config, container) {
    // Custom rendering logic
}

// Add responsive behavior to existing components
static setupResponsiveListener(questions, config, container) {
    // Responsive switching logic with cleanup
}

// Extend FormHandler for new validation
validateCustomLogic(questions) {
    // Custom validation
}
```

### Debugging Module Issues
```javascript
// Check module loading
console.log('Module loaded:', typeof QuestionnaireApp);

// Check component initialization  
const app = new QuestionnaireApp();
console.log('App initialized:', app);

// Check chart rendering
ChartRenderer.currentRenderingId // Should increment on each render

// Check radar chart modules
console.log('RadarChart modules:', {
    ConfigParser: typeof RadarConfigParser,
    DataProcessor: typeof RadarDataProcessor,
    Grid: typeof RadarGrid,
    Arrows: typeof RadarArrows
});
```

## External Dependencies
- [TailwindCSS](https://cdn.tailwindcss.com) (CDN)
- [Chart.js](https://cdn.jsdelivr.net/npm/chart.js) (CDN)
- [Google Fonts: Inter](https://fonts.googleapis.com/css2?family=Inter)

## Project-Specific Advice
- Do not add a build step or server logic
- Maintain compatibility with existing JSON/question formats
- For gauge charts: ALWAYS use the proven D3.js pattern above to avoid coordinate system conflicts

## Legacy Compatibility (Version 1.x)
- Pre-September 2025: All logic was in `index.html` (800+ lines)
- Post-refactor: Logic split into modules, `index.html` only ~160 lines
- **Migration**: Existing questionnaires work without changes
- **Global functions**: `window.selectRadio()` preserved for backward compatibility

## Chart Interference Prevention - Critical Lessons Learned (Sep 2025)

### Problem: Chart Rendering Conflicts and Race Conditions
When multiple chart types (RadarChart, GaugeChart) are rendered or when charts are updated after form submissions, persistent event listeners, D3.js selections, and asynchronous timeouts can cause chart interference and race conditions where:
- Charts appear briefly with new data but get overwritten by old data
- One chart type overwrites another unexpectedly
- Form submissions don't update charts properly

### Root Cause Analysis
1. **Global Event Listeners**: RadarChart adds `window.addEventListener('resize', handleResize)` that persists across navigation
2. **Shared Container**: Using same DOM element (`#radarChart`) for different chart types creates race conditions
3. **D3.js State Persistence**: D3 selections and event handlers remain active even after navigating away from chart
4. **Race Conditions**: Multiple setTimeout calls from rapid navigation create competing render processes
5. **Form Data Structure Mismatch**: Code expected `config.questions` but questions are loaded separately

### ❌ Failed Solutions (Avoid These Approaches)
- **Complex Event Listener Management**: Trying to cleanup/track global event listeners is error-prone
- **MutationObserver Protection**: DOM watching adds complexity without solving root cause
- **Chart Rendering IDs**: Tracking render states is fragile and doesn't prevent interference
- **Shadow DOM Isolation**: Adds architectural complexity for D3.js charts
- **Debugging Config Pipeline**: Fixing data corruption instead of architecture

### ✅ Proven Solution: Complete DOM Recreation + Race Prevention
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
// 1. COMPLETE DOM RECREATION for each chart update
const oldChartElement = document.getElementById('radarChart');
if (oldChartElement) {
    oldChartElement.remove(); // Complete removal
}
const newChartElement = document.createElement('div');
newChartElement.id = 'radarChart';
newChartElement.className = 'w-full h-full';
radarContainer.appendChild(newChartElement);

// 2. TIMEOUT MANAGEMENT to prevent race conditions
static activeTimeouts = new Set();
static render(chartType, scores, questions, config) {
    // Cancel all previous timeouts
    ChartRenderer.activeTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
    });
    ChartRenderer.activeTimeouts.clear();
    // ... render logic
}

// 3. DISABLE RESPONSIVE HANDLERS to prevent interference
// RadarResponsive.setup() DISABLED - causes race conditions
// Complete recreation makes resize handling unnecessary

// 4. CORRECT DATA STRUCTURE HANDLING
URLHashManager.collectAnswersFromForm(questions, config) // Not config.questions!
URLHashManager.calculateScores(answers, questions, config) // Separate parameters
```

### Key Benefits of This Solution
1. **Mathematical Impossibility of Interference**: Different DOM elements cannot overwrite each other
2. **Race Condition Prevention**: Timeout cancellation + event listener cleanup
3. **Architectural Simplicity**: No complex state management or cleanup logic needed
4. **Performance**: No DOM watchers or protection mechanisms required
5. **Maintainability**: Clear separation of concerns, easy to debug
6. **Data Structure Clarity**: Explicit separation of questions and config parameters

### Architecture Principle
**"Solve interference through isolation and recreation, not through protection"**
- Prevention via architecture > Detection via monitoring
- Simple container separation > Complex event management
- Complete DOM recreation > Partial cleanup attempts
- DOM isolation > JavaScript state tracking
- Timeout cancellation > Race condition detection

### Form Submission Data Flow (Fixed)
```javascript
// CORRECT flow with proper data structures
FormHandler.handleSubmit(event, onSuccess)
  → URLHashManager.collectAnswersFromForm(this.questions, this.config) // Separate params!
  → Convert answers array to object for validation
  → URLHashManager.calculateScores(answersArray, this.questions, this.config)
  → QuestionnaireApp.showEvaluation()
  → requestAnimationFrame → QuestionnaireApp.renderEvaluation()
  → ChartRenderer.render() → Complete DOM recreation + timeout management
```

### Critical Form Handler Fixes
```javascript
// WRONG: config.questions doesn't exist
const answers = URLHashManager.collectAnswersFromForm(this.config);

// CORRECT: Pass questions and config separately  
const answersArray = URLHashManager.collectAnswersFromForm(this.questions, this.config);

// WRONG: Array/Object mismatch
const incomplete = this.questions.filter(q => !(q.id in answersArray));

// CORRECT: Convert array to object for validation
const answersObject = {};
answersArray.forEach(answer => {
    answersObject[answer.questionId] = answer.value;
});
const incomplete = this.questions.filter(q => !(q.id in answersObject));
```

### Debug Checklist for Chart Update Issues
1. ✅ DOM element completely recreated (not just innerHTML cleared)
2. ✅ All previous timeouts cancelled before new render
3. ✅ Responsive event listeners disabled or properly cleaned up
4. ✅ Data structure parameters correct (questions vs config separation)
5. ✅ Array/Object conversions handled explicitly
6. ✅ RenderingId checks prevent outdated renders
7. ✅ No mixing of chart containers between chart types

## LocalStorage Persistence Feature - PRODUCTION READY ✅ (Sep 2025)

### Overview
Complete localStorage persistence implementation for questionnaire answers. Automatically saves and restores user answers when enabled in configuration.

### Configuration Pattern
```json
{
  "persistence": {
    "enabled": true,
    "type": "localstorage"
  }
}
```

⚠️ **CRITICAL**: The persistence configuration is processed through ConfigParser. New features must be implemented there first.

### Implementation Modules (All Complete)
- **`services/persistence-manager.js`** ✅ - Core localStorage operations
- **`services/config-parser.js`** ✅ - Configuration parsing 
- **`components/form-handler.js`** ✅ - Auto-save on user interactions
- **`app/questionnaire-app.js`** ✅ - UI integration and smart button management
- **`components/question-renderer.js`** ✅ - Color reset functionality

### Smart Button Behavior (Advanced Implementation)
The "Gespeicherte Antworten löschen" button demonstrates intelligent UI:
- **Visibility Logic**: Only visible when persistence enabled AND saved answers exist
- **Dynamic Updates**: Appears/disappears based on actual data state
- **Auto-Hide**: Hidden on evaluation page, shown on form page only
- **Instant Feedback**: Updates immediately after save/clear operations
- **Complete Cleanup**: Clears form data AND color highlighting

### Key API Methods
```javascript
// Smart visibility check
PersistenceManager.isPersistenceEnabled(config)

// Data operations (auto-called)
PersistenceManager.saveAnswers(folder, answers, config)
PersistenceManager.loadAnswers(folder, config) 
PersistenceManager.clearAnswers(folder)

// Button management
app.updateClearButtonVisibility() // Updates smart button
```

### Clean Production Implementation
- **No Debug Output**: All console.log statements removed
- **Silent Operation**: Runs completely in background
- **Error Handling**: Only critical errors logged
- **User Feedback**: Temporary toast messages for actions

### Storage Architecture
- **Per-questionnaire**: Separate storage keys per folder (`quest_answers_autonomie`)
- **Structured Data**: JSON with answers, timestamp, version
- **Data Validation**: Automatic cleanup of corrupted data
- **Browser Standard**: Uses standard localStorage API

## Key Files/Dirs
- `index.html` — main entry point (~160 lines), module bootstrap
- `app/questionnaire-app.js` — main application orchestrator
- `components/` — UI components (question-renderer, form-handler)
- `charts/` — chart modules (chart-renderer, gauge-chart, radar-chart)
- `charts/radar/` — modular radar chart components (Sep 2025)
- `services/` — data services (questionnaire-loader, config-parser)
- `quests/` — all questionnaire data
- Example: `quests/autonomie/config.json`, `quests/autonomie/questions.txt`

---
For more, see the top of `index.html` and example configs in `quests/`.
