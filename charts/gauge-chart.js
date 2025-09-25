/**
 * GaugeChart - Redirected to individual gauge implementations
 * 
 * This file has been refactored. The original GaugeChart class has been split into:
 * - TachometerGauge: Traditional tachometer-style gauge (charts/gauge/tachometer-gauge.js)
 * - SimpleGauge: Modern animated gauge (charts/gauge/simple-gauge.js)
 * 
 * For backward compatibility, use gauge-chart-legacy.js
 * For new code, import the specific gauge classes directly.
 */

// Re-export individual gauge classes for direct usage
export { TachometerGauge } from './gauge/tachometer-gauge.js';
export { SimpleGauge } from './gauge/simple-gauge.js';

// Legacy compatibility wrapper
export { GaugeChart } from './gauge-chart-legacy.js';
