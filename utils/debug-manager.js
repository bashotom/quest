/**
 * Debug Mode Manager
 * Handles debug mode detection and UI element visibility
 */
export class DebugManager {
    static debugMode = false;

    static isDebugMode() {
        return this.debugMode;
    }

    static initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Check URL parameters (both search and hash)
        const debugParam = urlParams.get('debug') || hashParams.get('debug');
        if (debugParam !== null && (debugParam === 'true' || debugParam === 'on' || debugParam === '1' || debugParam === '')) {
            this.debugMode = true;
            console.log('Debug mode activated from URL:', debugParam);
        }
    }
    
    static initializeFromUrl() {
        // Alias for backwards compatibility
        this.initialize();
    }

    static showDebugElements() {
        if (this.debugMode) {
            // Show all elements with debug class
            document.querySelectorAll('.debug-only').forEach(element => {
                element.classList.remove('hidden');
                element.classList.add('debug-visible');
            });

            // Add debug indicator to page
            this.addDebugIndicator();
        }
    }

    static hideDebugElements() {
        document.querySelectorAll('.debug-only').forEach(element => {
            element.classList.add('hidden');
            element.classList.remove('debug-visible');
        });
        
        // Remove debug indicator
        const indicator = document.getElementById('debug-indicator-container');
        if (indicator) indicator.remove();
    }

    static addDebugIndicator() {
        // Remove existing indicator first
        const existing = document.getElementById('debug-indicator-container');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.id = 'debug-indicator-container';
        container.className = 'fixed top-2 right-2 z-50 flex items-center space-x-2';

        const indicator = document.createElement('div');
        indicator.id = 'debug-indicator';
        indicator.className = 'bg-red-500 text-white px-3 py-1 text-sm rounded';
        indicator.textContent = 'DEBUG MODE';
        indicator.style.animation = 'pulse 2s infinite';
        indicator.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
        
        const stopButton = document.createElement('button');
        stopButton.id = 'stop-debug-button';
        stopButton.className = 'bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 text-sm rounded';
        stopButton.textContent = 'Stop Debugging';
        stopButton.title = 'Stop Debugging';
        stopButton.onclick = () => {
            // Hide all debug-related elements
            this.hideDebugElements();

            // Also remove the debug parameter from the URL without reloading the page
            const url = new URL(window.location.href);
            url.searchParams.delete('debug');
            history.pushState({}, '', url.toString());
        };

        container.appendChild(indicator);
        container.appendChild(stopButton);
        document.body.appendChild(container);
    }

    static log(message, data = null) {
        if (!this.isDebugMode()) return;
        
        console.group(`🐛 DEBUG: ${message}`);
        if (data) console.log(data);
        console.groupEnd();
    }

    static addDebugButton(text, onClick, container = null) {
        if (!this.isDebugMode()) return;
        
        const button = document.createElement('button');
        button.className = 'debug-only bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm mr-2 mb-2 transition-transform hover:scale-105';
        button.textContent = text;
        button.onclick = onClick;
        
        if (container) {
            container.appendChild(button);
        } else {
            // Add to debug panel or create one
            this.getOrCreateDebugPanel().appendChild(button);
        }
        
        return button;
    }

    static getOrCreateDebugPanel() {
        let panel = document.getElementById('debug-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'debug-panel';
            panel.className = 'debug-only fixed bottom-4 left-4 bg-gray-800 text-white p-3 rounded max-w-sm z-50';
            panel.style.border = '2px solid #7c3aed';
            panel.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            
            const title = document.createElement('h4');
            title.className = 'font-bold mb-2';
            title.innerHTML = '🐛 Debug Panel';
            
            const infoContainer = document.createElement('div');
            infoContainer.id = 'debug-panel-info';
            infoContainer.className = 'text-xs space-y-1';

            panel.appendChild(title);
            panel.appendChild(infoContainer);
            document.body.appendChild(panel);
        }
        return panel;
    }

    static addDebugInfo(key, value) {
        if (!this.isDebugMode()) return;
        
        const panel = this.getOrCreateDebugPanel();
        const infoContainer = panel.querySelector('#debug-panel-info');
        if (!infoContainer) return;

        // Remove existing entry for the key
        const existingEntry = infoContainer.querySelector(`[data-debug-key="${key}"]`);
        if (existingEntry) {
            existingEntry.remove();
        }

        const infoLine = document.createElement('div');
        infoLine.className = 'flex justify-between items-center';
        infoLine.setAttribute('data-debug-key', key);
        
        const keySpan = document.createElement('span');
        keySpan.className = 'font-semibold text-gray-400 mr-2';
        keySpan.textContent = `${key}:`;
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'text-purple-300 font-mono';
        valueSpan.textContent = value;
        
        infoLine.appendChild(keySpan);
        infoLine.appendChild(valueSpan);
        infoContainer.appendChild(infoLine);
    }

    static clearDebugInfo() {
        if (!this.isDebugMode()) return;
        const infoContainer = document.getElementById('debug-panel-info');
        if (infoContainer) {
            infoContainer.innerHTML = '';
        }
    }

    static exportData(data, filename = 'debug-data.json') {
        if (!this.isDebugMode()) return;
        
        const dataStr = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(dataStr).then(() => {
            this.showNotification(`Data copied to clipboard! (${filename})`);
        }).catch(() => {
            // Fallback: download as file
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            this.showNotification(`Data exported as ${filename}`);
        });
    }

    static showNotification(message, type = 'info') {
        if (!this.isDebugMode()) return;
        
        const notification = document.createElement('div');
        const colors = {
            info: 'bg-blue-500',
            success: 'bg-green-500',
            warning: 'bg-yellow-500',
            error: 'bg-red-500'
        };
        
        notification.className = `fixed top-12 right-2 ${colors[type]} text-white px-4 py-2 rounded z-50 text-sm`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    static measurePerformance(name, fn) {
        if (!this.isDebugMode()) return fn();
        
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        this.log(`Performance: ${name}`, `${(end - start).toFixed(2)}ms`);
        return result;
    }
}