/**
 * Debug Mode Manager
 * Handles debug mode detection and UI element visibility
 */
export class DebugManager {
    static isDebugMode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('debug') === 'on' || urlParams.get('debug') === 'true';
    }

    static showDebugElements() {
        if (!this.isDebugMode()) return;
        
        // Show all elements with debug class
        document.querySelectorAll('.debug-only').forEach(element => {
            element.classList.remove('hidden');
            element.classList.add('debug-visible');
        });

        // Add debug indicator to page
        this.addDebugIndicator();
    }

    static hideDebugElements() {
        document.querySelectorAll('.debug-only').forEach(element => {
            element.classList.add('hidden');
            element.classList.remove('debug-visible');
        });
        
        // Remove debug indicator
        const indicator = document.getElementById('debug-indicator');
        if (indicator) indicator.remove();
    }

    static addDebugIndicator() {
        // Remove existing indicator first
        const existing = document.getElementById('debug-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.id = 'debug-indicator';
        indicator.className = 'fixed top-2 right-2 bg-red-500 text-white px-3 py-1 text-sm rounded z-50';
        indicator.textContent = 'DEBUG MODE';
        indicator.style.animation = 'pulse 2s infinite';
        indicator.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
        document.body.appendChild(indicator);
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
            panel.innerHTML = '<h4 class="font-bold mb-2">🐛 Debug Panel</h4>';
            document.body.appendChild(panel);
        }
        return panel;
    }

    static addDebugInfo(key, value) {
        if (!this.isDebugMode()) return;
        
        let infoDiv = document.getElementById('debug-info');
        if (!infoDiv) {
            infoDiv = document.createElement('div');
            infoDiv.id = 'debug-info';
            infoDiv.className = 'debug-only hidden bg-yellow-100 border border-yellow-400 p-4 mb-4';
            infoDiv.innerHTML = '<h3 class="font-bold text-yellow-800">🐛 Debug Information</h3><div id="debug-info-content" class="text-sm text-yellow-700 mt-2"></div>';
            
            // Insert at top of main content
            const mainContent = document.querySelector('main') || document.body;
            mainContent.insertBefore(infoDiv, mainContent.firstChild);
            infoDiv.classList.remove('hidden');
        }
        
        const content = document.getElementById('debug-info-content');
        const item = document.createElement('div');
        item.className = 'mb-1';
        item.innerHTML = `<strong>${key}:</strong> ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`;
        content.appendChild(item);
    }

    static clearDebugInfo() {
        const infoDiv = document.getElementById('debug-info-content');
        if (infoDiv) {
            infoDiv.innerHTML = '';
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