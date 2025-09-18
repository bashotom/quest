// Temporärer Fix für RadarChart Event-Listener Problem

// Diese Funktion überschreibt problematische Event-Listener
function fixRadarChartEventListeners() {
    // Alle resize Event-Listener entfernen
    const newWindow = document.defaultView;
    const oldEventListeners = [];
    
    // Original addEventListener merken
    const originalAddEventListener = newWindow.addEventListener;
    const originalRemoveEventListener = newWindow.removeEventListener;
    
    // Override addEventListener für resize events
    newWindow.addEventListener = function(type, listener, options) {
        if (type === 'resize') {
            // Prüfen ob es ein RadarChart-Listener ist
            const listenerString = listener.toString();
            if (listenerString.includes('RadarChart') || listenerString.includes('d3.select')) {
                return; // Blockiere den Listener
            }
        }
        return originalAddEventListener.call(this, type, listener, options);
    };
}

// Fix sofort anwenden wenn verfügbar
if (typeof window !== 'undefined') {
    fixRadarChartEventListeners();
}

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fixRadarChartEventListeners };
}
