/**
 * ServerPersistenceManager - Pure server-side persistence
 * Stores all data exclusively on the server, no localStorage fallback
 * Compatible with the existing Quest API architecture
 */
export class ServerPersistenceManager {
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
     * Checks if server persistence is enabled in the configuration
     * @param {Object} config - The questionnaire configuration
     * @returns {boolean} True if server persistence is enabled
     */
    static isPersistenceEnabled(config) {
        return config && 
               config.persistence && 
               config.persistence.enabled === true && 
               config.persistence.type === 'server';
    }

    /**
     * Save answers exclusively to server
     * @param {string} folder - The questionnaire folder name
     * @param {Object} answers - Answers as key-value pairs {questionId: answerValue}
     * @param {Object} config - The questionnaire configuration
     * @returns {Promise<boolean>} True if successful
     */
    static async saveAnswers(folder, answers, config) {
        if (!this.isPersistenceEnabled(config)) {
            console.warn('[ServerPersistenceManager] Server persistence not enabled');
            return false;
        }

        const endpoint = config.persistence?.server?.endpoint;
        if (!endpoint) {
            console.error('[ServerPersistenceManager] Server endpoint not configured');
            return false;
        }

        try {
            const sessionToken = this.getOrCreateSessionToken();
            const timeout = config.persistence.server?.timeout || 5000;
            
            const requestData = {
                session_token: sessionToken,
                questionnaire: folder,
                answers: answers,
                timestamp: new Date().toISOString()
            };
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            console.log('[ServerPersistenceManager] Saving to server:', {
                endpoint,
                questionnaire: folder,
                answerCount: Object.keys(answers).length
            });
            
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
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${response.statusText}. ${errorText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Server save failed');
            }
            
            console.log('[ServerPersistenceManager] Successfully saved to server:', result.message);
            return true;
            
        } catch (error) {
            console.error('[ServerPersistenceManager] Failed to save to server:', error);
            
            // Show user-friendly error message
            if (window.questionnaireApp) {
                if (error.name === 'AbortError') {
                    window.questionnaireApp.showTemporaryMessage(
                        'Speichern dauerte zu lange. Bitte versuchen Sie es erneut.', 
                        'error'
                    );
                } else {
                    window.questionnaireApp.showTemporaryMessage(
                        'Fehler beim Speichern der Antworten. Bitte versuchen Sie es erneut.', 
                        'error'
                    );
                }
            }
            
            throw error; // Re-throw for caller handling
        }
    }

    /**
     * Load answers exclusively from server
     * @param {string} folder - The questionnaire folder name
     * @param {Object} config - The questionnaire configuration
     * @returns {Promise<Object|null>} Loaded answers or null
     */
    static async loadAnswers(folder, config) {
        if (!this.isPersistenceEnabled(config)) {
            return null;
        }

        const endpoint = config.persistence?.server?.endpoint;
        if (!endpoint) {
            console.error('[ServerPersistenceManager] Server endpoint not configured');
            return null;
        }

        try {
            const sessionToken = this.getOrCreateSessionToken();
            const timeout = config.persistence.server?.timeout || 5000;
            
            const url = new URL(endpoint);
            url.searchParams.set('session_token', sessionToken);
            url.searchParams.set('questionnaire', folder);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            console.log('[ServerPersistenceManager] Loading from server:', {
                endpoint: url.toString(),
                questionnaire: folder
            });
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.status === 404) {
                console.log('[ServerPersistenceManager] No saved answers found on server');
                return null; // No saved data available
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${response.statusText}. ${errorText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                console.log('[ServerPersistenceManager] Server returned no data:', result.message);
                return null;
            }
            
            if (result.data && result.data.answers) {
                console.log('[ServerPersistenceManager] Successfully loaded from server:', {
                    answerCount: Object.keys(result.data.answers).length,
                    timestamp: result.data.timestamp
                });
                return result.data.answers;
            }
            
            return null;
            
        } catch (error) {
            console.error('[ServerPersistenceManager] Failed to load from server:', error);
            
            // Show user-friendly error message
            if (window.questionnaireApp) {
                if (error.name === 'AbortError') {
                    window.questionnaireApp.showTemporaryMessage(
                        'Laden dauerte zu lange. Bitte versuchen Sie es erneut.', 
                        'error'
                    );
                } else {
                    window.questionnaireApp.showTemporaryMessage(
                        'Fehler beim Laden der gespeicherten Antworten.', 
                        'error'
                    );
                }
            }
            
            return null; // Return null instead of throwing to allow graceful degradation
        }
    }

    /**
     * Clear answers exclusively from server
     * @param {string} folder - The questionnaire folder name
     * @param {Object} config - The questionnaire configuration
     * @returns {Promise<boolean>} True if successful
     */
    static async clearAnswers(folder, config) {
        if (!this.isPersistenceEnabled(config)) {
            return false;
        }

        const endpoint = config.persistence?.server?.endpoint;
        if (!endpoint) {
            console.error('[ServerPersistenceManager] Server endpoint not configured');
            return false;
        }

        try {
            const sessionToken = this.getOrCreateSessionToken();
            const timeout = config.persistence.server?.timeout || 5000;
            
            const url = new URL(endpoint);
            url.searchParams.set('session_token', sessionToken);
            url.searchParams.set('questionnaire', folder);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            console.log('[ServerPersistenceManager] Clearing from server:', {
                endpoint: url.toString(),
                questionnaire: folder
            });
            
            const response = await fetch(url.toString(), {
                method: 'DELETE',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok && response.status !== 404) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${response.statusText}. ${errorText}`);
            }
            
            const result = await response.json();
            
            console.log('[ServerPersistenceManager] Successfully cleared from server:', result.message);
            return true;
            
        } catch (error) {
            console.error('[ServerPersistenceManager] Failed to clear from server:', error);
            
            // Show user-friendly error message
            if (window.questionnaireApp) {
                if (error.name === 'AbortError') {
                    window.questionnaireApp.showTemporaryMessage(
                        'Löschen dauerte zu lange. Bitte versuchen Sie es erneut.', 
                        'error'
                    );
                } else {
                    window.questionnaireApp.showTemporaryMessage(
                        'Fehler beim Löschen der gespeicherten Antworten.', 
                        'error'
                    );
                }
            }
            
            throw error; // Re-throw for caller handling
        }
    }

    /**
     * Check if there are stored answers on server
     * @param {string} folder - The questionnaire folder name
     * @param {Object} config - The questionnaire configuration
     * @returns {Promise<boolean>} True if answers exist on server
     */
    static async hasStoredAnswers(folder, config) {
        try {
            const answers = await this.loadAnswers(folder, config);
            return answers !== null && Object.keys(answers).length > 0;
        } catch (error) {
            console.error('[ServerPersistenceManager] Error checking stored answers:', error);
            return false;
        }
    }

    /**
     * Get server connection info (for debugging)
     * @param {Object} config - The questionnaire configuration
     * @returns {Object} Connection information
     */
    static getServerInfo(config) {
        if (!this.isPersistenceEnabled(config)) {
            return { enabled: false };
        }
        
        return {
            enabled: true,
            endpoint: config.persistence.server?.endpoint,
            timeout: config.persistence.server?.timeout || 5000,
            sync: config.persistence.server?.sync || 'auto',
            authentication: config.persistence.server?.authentication || 'session',
            sessionToken: this.getOrCreateSessionToken()
        };
    }

    /**
     * Test server connection
     * @param {Object} config - The questionnaire configuration
     * @returns {Promise<Object>} Test result with status and details
     */
    static async testConnection(config) {
        const info = this.getServerInfo(config);
        
        if (!info.enabled) {
            return {
                success: false,
                message: 'Server persistence not enabled',
                details: info
            };
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), info.timeout);
            
            // Test with OPTIONS request first (CORS preflight)
            const response = await fetch(info.endpoint, {
                method: 'OPTIONS',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            return {
                success: response.ok,
                message: response.ok ? 'Server connection successful' : `Server returned ${response.status}`,
                details: {
                    ...info,
                    status: response.status,
                    statusText: response.statusText
                }
            };
            
        } catch (error) {
            return {
                success: false,
                message: 'Server connection failed',
                error: error.message,
                details: info
            };
        }
    }

    /**
     * Sync answers immediately (for manual sync mode)
     * @param {string} folder - The questionnaire folder name
     * @param {Object} answers - Current answers
     * @param {Object} config - The questionnaire configuration
     * @returns {Promise<boolean>} True if successful
     */
    static async syncNow(folder, answers, config) {
        console.log('[ServerPersistenceManager] Manual sync triggered');
        return await this.saveAnswers(folder, answers, config);
    }
}