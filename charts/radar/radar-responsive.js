/**
 * RadarResponsive - Responsive handling and resize logic for radar charts
 */
export class RadarResponsive {
    /**
     * Setup responsive handling for radar chart
     * @param {string} containerId - DOM selector for container
     * @param {Array} data - Chart data
     * @param {Object} options - Chart options
     * @param {Function} renderFunction - Function to re-render chart
     */
    static setup(containerId, data, options, renderFunction) {
        // Remove any existing resize listeners for this chart
        this.cleanup(containerId);
        
        // Create debounced resize handler
        const handleResize = this.createResizeHandler(containerId, data, options, renderFunction);
        
        // Store reference for cleanup
        if (!window.radarResizeHandlers) {
            window.radarResizeHandlers = new Map();
        }
        window.radarResizeHandlers.set(containerId, handleResize);
        
        // Add event listener
        window.addEventListener('resize', handleResize);
    }

    /**
     * Create debounced resize handler
     * @param {string} containerId - DOM selector for container
     * @param {Array} data - Chart data
     * @param {Object} options - Chart options
     * @param {Function} renderFunction - Function to re-render chart
     * @returns {Function} Resize handler function
     */
    static createResizeHandler(containerId, data, options, renderFunction) {
        let resizeTimeout;
        
        return () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Check if container still exists
                const container = d3.select(containerId);
                if (container.empty()) {
                    this.cleanup(containerId);
                    return;
                }
                
                // Check if this container is still meant for RadarChart
                if (!this.isValidRadarContainer(containerId)) {
                    this.cleanup(containerId);
                    return;
                }
                
                // Clear the current chart
                d3.select(containerId).select("svg").remove();
                d3.selectAll(".radar-legend").remove();
                
                // Rebuild the chart with the same parameters
                renderFunction(containerId, data, options);
            }, 250); // 250ms delay to avoid too frequent rebuilds
        };
    }

    /**
     * Check if container is valid for radar chart
     * @param {string} containerId - DOM selector for container
     * @returns {boolean} True if valid radar container
     */
    static isValidRadarContainer(containerId) {
        const containerElement = document.querySelector(containerId);
        if (!containerElement) return false;
        
        // Check if this container is still meant for RadarChart
        const isRadarContainer = containerElement && (
            containerElement.getAttribute('data-chart-context') === 'radar' ||
            containerElement.classList.contains('radar-chart-container') ||
            containerElement.querySelector('svg[data-chart-type="radar"]')
        );
        
        // Check if we're in a gauge context (should not be handled by radar)
        const isGaugeContext = containerElement && (
            containerElement.getAttribute('data-chart-context') === 'gauge' ||
            containerElement.classList.contains('gauge-chart-container') ||
            containerElement.querySelector('svg[data-chart-type="gauge"]')
        );
        
        return isRadarContainer && !isGaugeContext;
    }

    /**
     * Clean up event listeners for specific container
     * @param {string} containerId - DOM selector for container
     */
    static cleanup(containerId) {
        if (window.radarResizeHandlers && window.radarResizeHandlers.has(containerId)) {
            const handler = window.radarResizeHandlers.get(containerId);
            window.removeEventListener('resize', handler);
            window.radarResizeHandlers.delete(containerId);
        }
    }

    /**
     * Clean up all radar chart resize handlers
     */
    static cleanupAll() {
        if (window.radarResizeHandlers) {
            window.radarResizeHandlers.forEach(handler => {
                window.removeEventListener('resize', handler);
            });
            window.radarResizeHandlers.clear();
        }
    }

    /**
     * Update chart based on current window size
     * @param {string} containerId - DOM selector for container
     * @param {Object} gridUpdate - Grid update functions
     */
    static updateForCurrentSize(containerId, gridUpdate) {
        if (gridUpdate && typeof gridUpdate.updateLabels === 'function') {
            gridUpdate.updateLabels();
        }
    }

    /**
     * Get responsive configuration based on window size
     * @param {number} windowWidth - Current window width
     * @returns {Object} Responsive configuration adjustments
     */
    static getResponsiveConfig(windowWidth = window.innerWidth) {
        const adjustments = {};
        
        // Adjust dimensions for critical screen widths to prevent label clipping
        if (windowWidth >= 650 && windowWidth <= 766) {
            adjustments.w = 700;
            adjustments.h = 700;
            adjustments.margin = { top: 30, right: 70, bottom: 30, left: 70 };
        }
        
        return adjustments;
    }

    /**
     * Check if labels should be shortened for current screen size
     * @param {number} windowWidth - Current window width
     * @returns {boolean} True if labels should be shortened
     */
    static shouldUseShortLabels(windowWidth = window.innerWidth) {
        return windowWidth < 650;
    }

    /**
     * Setup container context markers
     * @param {string} containerId - DOM selector for container
     */
    static setupContainerContext(containerId) {
        const container = document.querySelector(containerId);
        if (container) {
            container.setAttribute('data-chart-context', 'radar');
            container.classList.add('radar-chart-container');
        }
    }

    /**
     * Remove container context markers
     * @param {string} containerId - DOM selector for container
     */
    static removeContainerContext(containerId) {
        const container = document.querySelector(containerId);
        if (container) {
            container.removeAttribute('data-chart-context');
            container.classList.remove('radar-chart-container');
        }
    }

    /**
     * Handle orientation change for mobile devices
     * @param {string} containerId - DOM selector for container
     * @param {Array} data - Chart data
     * @param {Object} options - Chart options
     * @param {Function} renderFunction - Function to re-render chart
     */
    static setupOrientationHandler(containerId, data, options, renderFunction) {
        const handleOrientationChange = () => {
            setTimeout(() => {
                if (this.isValidRadarContainer(containerId)) {
                    d3.select(containerId).select("svg").remove();
                    d3.selectAll(".radar-legend").remove();
                    renderFunction(containerId, data, options);
                }
            }, 500); // Delay to allow orientation change to complete
        };
        
        // Listen for orientation changes
        window.addEventListener('orientationchange', handleOrientationChange);
        
        // Store reference for cleanup
        if (!window.radarOrientationHandlers) {
            window.radarOrientationHandlers = new Map();
        }
        window.radarOrientationHandlers.set(containerId, handleOrientationChange);
    }

    /**
     * Clean up orientation handlers
     * @param {string} containerId - DOM selector for container
     */
    static cleanupOrientationHandler(containerId) {
        if (window.radarOrientationHandlers && window.radarOrientationHandlers.has(containerId)) {
            const handler = window.radarOrientationHandlers.get(containerId);
            window.removeEventListener('orientationchange', handler);
            window.radarOrientationHandlers.delete(containerId);
        }
    }
}
