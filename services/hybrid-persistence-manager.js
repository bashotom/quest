/**
 * HybridPersistenceManager - Extended localStorage + Server persistence
 * Supports localstorage, server, and hybrid persistence modes
 */
export class HybridPersistenceManager {
    static debounceTimers = new Map(); // Track debounce timers per questionnaire
    
    /**
     * Generates a storage key for the current questionnaire
     * @param {string} folder - The questionnaire folder name
     * @returns {string} The localStorage key
     */
    static getStorageKey(folder) {
        return `quest_answers_${folder}`;
    }
    
    /**
     * Generates or retrieves a session token for server communication
     * @returns {string} UUID v4 session token
     */
    static getOrCreateSessionToken() {
        const tokenKey = 'quest_session_token';
        let token = localStorage.getItem(tokenKey);
        
        if (!token || !this.isValidUUID(token)) {
            token = this.generateUUID();
            localStorage.setItem(tokenKey, token);
        }
        
        return token;
    }
    
    /**
     * Generates a UUID v4
     * @returns {string} UUID v4
     */
    static generateUUID() {
        if (crypto.randomUUID) {
            return crypto.randomUUID();
        }
        
        // Fallback for older browsers
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Validates UUID v4 format
     * @param {string} uuid - UUID to validate
     * @returns {boolean} True if valid UUID v4
     */
    static isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    /**
     * Checks if persistence is enabled in the configuration
     * @param {Object} config - The questionnaire configuration
     * @returns {boolean} True if persistence is enabled
     */
    static isPersistenceEnabled(config) {
        return config && 
               config.persistence && 
               config.persistence.enabled === true;
    }
    
    /**
     * Gets the persistence type from config
     * @param {Object} config - The questionnaire configuration
     * @returns {string} Persistence type: 'localstorage', 'server', or 'hybrid'
     */
    static getPersistenceType(config) {
        if (!this.isPersistenceEnabled(config)) {
            return 'none';
        }
        return config.persistence.type || 'localstorage';
    }

    /**
     * Main save method - routes to appropriate persistence strategy
     * @param {string} folder - The questionnaire folder name
     * @param {Object} answers - Answers as key-value pairs {questionId: answerValue}
     * @param {Object} config - The questionnaire configuration
     */
    static async saveAnswers(folder, answers, config) {
        if (!this.isPersistenceEnabled(config)) {
            return;
        }

        const persistenceType = this.getPersistenceType(config);
        
        try {
            switch (persistenceType) {
                case 'localstorage':
                    this.saveToLocalStorage(folder, answers, config);
                    break;
                    
                case 'server':
                    await this.saveToServer(folder, answers, config);
                    break;
                    
                case 'hybrid':
                    // Save locally immediately for best UX
                    this.saveToLocalStorage(folder, answers, config);
                    // Debounced server sync
                    this.scheduleServerSync(folder, answers, config);
                    break;
                    
                default:
                    console.warn(`[HybridPersistenceManager] Unknown persistence type: ${persistenceType}`);
                    this.saveToLocalStorage(folder, answers, config);
            }
        } catch (error) {
            console.error('[HybridPersistenceManager] Save failed:', error);
            // Fallback to localStorage on any error
            this.saveToLocalStorage(folder, answers, config);
        }
    }

    /**
     * Main load method - routes to appropriate persistence strategy
     * @param {string} folder - The questionnaire folder name
     * @param {Object} config - The questionnaire configuration
     * @returns {Object|null} Loaded answers or null
     */
    static async loadAnswers(folder, config) {
        if (!this.isPersistenceEnabled(config)) {
            return null;
        }

        const persistenceType = this.getPersistenceType(config);
        
        try {
            switch (persistenceType) {
                case 'localstorage':
                    return this.loadFromLocalStorage(folder, config);
                    
                case 'server':
                    return await this.loadFromServer(folder, config);
                    
                case 'hybrid':
                    // Try server first, fallback to localStorage
                    try {
                        const serverData = await this.loadFromServer(folder, config);
                        if (serverData) {
                            return serverData;
                        }
                    } catch (error) {
                        console.warn('[HybridPersistenceManager] Server load failed, trying localStorage:', error);
                    }
                    return this.loadFromLocalStorage(folder, config);
                    
                default:
                    return this.loadFromLocalStorage(folder, config);
            }
        } catch (error) {
            console.error('[HybridPersistenceManager] Load failed:', error);
            return this.loadFromLocalStorage(folder, config);
        }
    }

    /**
     * Clear answers - handles all persistence types
     * @param {string} folder - The questionnaire folder name
     * @param {Object} config - The questionnaire configuration
     */
    static async clearAnswers(folder, config = null) {
        const persistenceType = config ? this.getPersistenceType(config) : 'localstorage';
        
        try {
            // Always clear localStorage
            this.clearFromLocalStorage(folder);
            
            // Clear from server if applicable
            if (config && (persistenceType === 'server' || persistenceType === 'hybrid')) {
                await this.clearFromServer(folder, config);
            }
        } catch (error) {
            console.error('[HybridPersistenceManager] Clear failed:', error);
            // Still clear localStorage even if server clear fails
            this.clearFromLocalStorage(folder);
        }
    }

    // ======= LOCAL STORAGE METHODS =======

    /**
     * Save answers to localStorage
     */
    static saveToLocalStorage(folder, answers, config) {
        try {
            const storageKey = this.getStorageKey(folder);
            const timestamp = new Date().toISOString();
            
            const persistenceData = {
                answers: answers,
                timestamp: timestamp,
                version: '1.0'
            };

            localStorage.setItem(storageKey, JSON.stringify(persistenceData));
        } catch (error) {
            console.error('[HybridPersistenceManager] LocalStorage save failed:', error);
        }
    }

    /**
     * Load answers from localStorage
     */
    static loadFromLocalStorage(folder, config) {
        try {
            const storageKey = this.getStorageKey(folder);
            const storedData = localStorage.getItem(storageKey);
            
            if (!storedData) {
                return null;
            }

            const persistenceData = JSON.parse(storedData);
            
            // Basic validation
            if (!persistenceData.answers || typeof persistenceData.answers !== 'object') {
                console.warn('[HybridPersistenceManager] Invalid localStorage data format, clearing');
                localStorage.removeItem(storageKey);
                return null;
            }

            // Return full data structure with timestamp for ask_reloading feature
            return {
                ...persistenceData.answers,
                timestamp: persistenceData.timestamp
            };
        } catch (error) {
            console.error('[HybridPersistenceManager] LocalStorage load failed:', error);
            return null;
        }
    }

    /**
     * Clear answers from localStorage
     */
    static clearFromLocalStorage(folder) {
        try {
            const storageKey = this.getStorageKey(folder);
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('[HybridPersistenceManager] LocalStorage clear failed:', error);
        }
    }

    // ======= SERVER METHODS =======

    /**
     * Save answers to server
     */
    static async saveToServer(folder, answers, config) {
        const endpoint = config.persistence.server?.endpoint || '/api/questionnaire-data.php';
        const timeout = config.persistence.server?.timeout || 5000;
        const sessionToken = this.getOrCreateSessionToken();
        
        const requestData = {
            session_token: sessionToken,
            questionnaire: folder,
            answers: answers,
            timestamp: new Date().toISOString()
        };
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Server save failed');
            }
            
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Load answers from server
     */
    static async loadFromServer(folder, config) {
        const endpoint = config.persistence.server?.endpoint || '/api/questionnaire-data.php';
        const timeout = config.persistence.server?.timeout || 5000;
        const sessionToken = this.getOrCreateSessionToken();
        
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set('session_token', sessionToken);
        url.searchParams.set('questionnaire', folder);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.status === 404) {
                return null; // No data found
            }
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                return null; // No data or error
            }
            
            // Return full data structure with timestamp for ask_reloading feature
            return {
                ...result.data.answers,
                timestamp: result.data.timestamp
            };
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Clear answers from server
     */
    static async clearFromServer(folder, config) {
        const endpoint = config.persistence.server?.endpoint || '/api/questionnaire-data.php';
        const timeout = config.persistence.server?.timeout || 5000;
        const sessionToken = this.getOrCreateSessionToken();
        
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set('session_token', sessionToken);
        url.searchParams.set('questionnaire', folder);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url.toString(), {
                method: 'DELETE',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok && response.status !== 404) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // ======= HYBRID-SPECIFIC METHODS =======

    /**
     * Schedule debounced server sync for hybrid mode
     */
    static scheduleServerSync(folder, answers, config) {
        // Clear existing timer for this questionnaire
        const existingTimer = this.debounceTimers.get(folder);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        
        // Schedule new sync after 2 seconds of inactivity
        const timer = setTimeout(async () => {
            try {
                await this.saveToServer(folder, answers, config);
            } catch (error) {
                console.warn('[HybridPersistenceManager] Background server sync failed:', error);
                // localStorage already saved, so this is not critical
            } finally {
                this.debounceTimers.delete(folder);
            }
        }, 2000);
        
        this.debounceTimers.set(folder, timer);
    }

    // ======= UTILITY METHODS =======

    /**
     * Get list of all saved questionnaires (localStorage keys)
     * @returns {Array<string>} Array of questionnaire folder names
     */
    static listSavedQuestionnaires() {
        const questionnaires = [];
        const prefix = 'quest_answers_';
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    questionnaires.push(key.substring(prefix.length));
                }
            }
        } catch (error) {
            console.error('[HybridPersistenceManager] Failed to list questionnaires:', error);
        }
        
        return questionnaires;
    }

    /**
     * Check if a questionnaire has stored answers
     * @param {string} folder - The questionnaire folder name
     * @returns {boolean} True if answers are stored
     */
    static hasStoredAnswers(folder) {
        try {
            const storageKey = this.getStorageKey(folder);
            return localStorage.getItem(storageKey) !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Clean up old persistence data
     * @param {number} maxAgeInDays - Maximum age of data to keep
     * @returns {number} Number of records cleaned up
     */
    static cleanupOldData(maxAgeInDays = 90) {
        let cleaned = 0;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);
        
        try {
            const prefix = 'quest_answers_';
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        const timestamp = new Date(data.timestamp);
                        
                        if (timestamp < cutoffDate) {
                            keysToRemove.push(key);
                        }
                    } catch (error) {
                        // Invalid data format, mark for removal
                        keysToRemove.push(key);
                    }
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                cleaned++;
            });
        } catch (error) {
            console.error('[HybridPersistenceManager] Cleanup failed:', error);
        }
        
        return cleaned;
    }
}

// Export for backward compatibility
export { HybridPersistenceManager as PersistenceManager };