/**
 * PersistenceManagerFactory - Factory for creating appropriate persistence managers
 * Routes to the correct persistence strategy based on configuration
 */
import { ServerPersistenceManager } from './server-persistence-manager.js';

// Original LocalStorage PersistenceManager (keep existing functionality)
export class LocalStoragePersistenceManager {
    /**
     * Generates a storage key for the current questionnaire
     * @param {string} folder - The questionnaire folder name
     * @returns {string} The localStorage key
     */
    static getStorageKey(folder) {
        return `quest_answers_${folder}`;
    }

    /**
     * Checks if localStorage persistence is enabled in the configuration
     * @param {Object} config - The questionnaire configuration
     * @returns {boolean} True if localStorage persistence is enabled
     */
    static isPersistenceEnabled(config) {
        return config && 
               config.persistence && 
               config.persistence.enabled === true && 
               (config.persistence.type === 'localstorage' || !config.persistence.type);
    }

    /**
     * Saves answers to localStorage
     * @param {string} folder - The questionnaire folder name
     * @param {Object} answers - Answers as key-value pairs {questionId: answerValue}
     * @param {Object} config - The questionnaire configuration
     */
    static saveAnswers(folder, answers, config) {
        if (!this.isPersistenceEnabled(config)) {
            return;
        }

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
            console.error('[LocalStoragePersistenceManager] Failed to save answers:', error);
        }
    }

    /**
     * Loads answers from localStorage
     * @param {string} folder - The questionnaire folder name
     * @param {Object} config - The questionnaire configuration
     * @returns {Object|null} Loaded answers or null
     */
    static loadAnswers(folder, config) {
        if (!this.isPersistenceEnabled(config)) {
            return null;
        }

        try {
            const storageKey = this.getStorageKey(folder);
            const storedData = localStorage.getItem(storageKey);
            
            if (!storedData) {
                return null;
            }

            const persistenceData = JSON.parse(storedData);
            
            if (!persistenceData.answers || typeof persistenceData.answers !== 'object') {
                console.warn('[LocalStoragePersistenceManager] Invalid data format, clearing');
                localStorage.removeItem(storageKey);
                return null;
            }

            return persistenceData.answers;
        } catch (error) {
            console.error('[LocalStoragePersistenceManager] Failed to load answers:', error);
            return null;
        }
    }

    /**
     * Clears answers from localStorage
     * @param {string} folder - The questionnaire folder name
     * @param {Object} config - The questionnaire configuration (optional)
     */
    static clearAnswers(folder, config = null) {
        try {
            const storageKey = this.getStorageKey(folder);
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('[LocalStoragePersistenceManager] Failed to clear answers:', error);
        }
    }

    /**
     * Check if there are stored answers
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
}

/**
 * Factory for creating the appropriate persistence manager
 */
export class PersistenceManagerFactory {
    /**
     * Creates the appropriate persistence manager based on configuration
     * @param {Object} config - The questionnaire configuration
     * @returns {Object} Persistence manager class
     */
    static create(config) {
        if (!config || !config.persistence || !config.persistence.enabled) {
            return LocalStoragePersistenceManager;
        }
        
        const type = config.persistence.type;
        
        switch(type) {
            case 'server':
                return ServerPersistenceManager;
            case 'hybrid':
                // TODO: Implement HybridPersistenceManager
                console.warn('[PersistenceManagerFactory] Hybrid mode not yet implemented, using server mode');
                return ServerPersistenceManager;
            case 'localstorage':
            default:
                return LocalStoragePersistenceManager;
        }
    }
    
    /**
     * Get persistence type from config
     * @param {Object} config - The questionnaire configuration
     * @returns {string} Persistence type
     */
    static getType(config) {
        if (!config?.persistence?.enabled) {
            return 'none';
        }
        return config.persistence.type || 'localstorage';
    }
    
    /**
     * Check if any persistence is enabled
     * @param {Object} config - The questionnaire configuration
     * @returns {boolean} True if persistence is enabled
     */
    static isEnabled(config) {
        return config?.persistence?.enabled === true;
    }
}

// Export for backward compatibility
export { LocalStoragePersistenceManager as PersistenceManager };