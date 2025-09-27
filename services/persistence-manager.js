/**
 * PersistenceManager - Manages localStorage persistence for questionnaire answers
 * Handles saving and loading answers when persistence is enabled in config
 */
export class PersistenceManager {
    /**
     * Generates a storage key for the current questionnaire
     * @param {string} folder - The questionnaire folder name
     * @returns {string} The localStorage key
     */
    static getStorageKey(folder) {
        return `quest_answers_${folder}`;
    }

    /**
     * Checks if persistence is enabled in the configuration
     * @param {Object} config - The questionnaire configuration
     * @returns {boolean} True if persistence is enabled
     */
    static isPersistenceEnabled(config) {
        return config && 
               config.persistence && 
               config.persistence.enabled === true && 
               config.persistence.type === 'localstorage';
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
            console.error('❌ [PersistenceManager] Failed to save answers to localStorage:', error);
        }
    }

    /**
     * Loads answers from localStorage
     * @param {string} folder - The questionnaire folder name
     * @param {Object} config - The questionnaire configuration
     * @returns {Object|null} Saved answers or null if none found
     */
    static loadAnswers(folder, config) {
        if (!this.isPersistenceEnabled(config)) {
            return null;
        }

        try {
            const storageKey = this.getStorageKey(folder);
            const savedData = localStorage.getItem(storageKey);
            
            if (!savedData) {
                return null;
            }

            const persistenceData = JSON.parse(savedData);
            
            // Validate data structure
            if (!persistenceData.answers || typeof persistenceData.answers !== 'object') {
                console.warn('⚠️ [PersistenceManager] Invalid saved data structure, removing:', persistenceData);
                localStorage.removeItem(storageKey);
                return null;
            }

            // Return full data structure with timestamp for ask_reloading feature
            return {
                ...persistenceData.answers,
                timestamp: persistenceData.timestamp
            };
        } catch (error) {
            console.error('❌ [PersistenceManager] Failed to load answers from localStorage:', error);
            return null;
        }
    }

    /**
     * Clears saved answers from localStorage
     * @param {string} folder - The questionnaire folder name
     */
    static clearAnswers(folder) {
        try {
            const storageKey = this.getStorageKey(folder);
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('❌ [PersistenceManager] Failed to clear answers from localStorage:', error);
        }
    }

    /**
     * Gets the age of saved data in human-readable format
     * @param {string} timestamp - ISO timestamp string
     * @returns {string} Human-readable age
     */
    static getDataAge(timestamp) {
        if (!timestamp) return 'unknown';
        
        try {
            const saved = new Date(timestamp);
            const now = new Date();
            const diffMs = now - saved;
            const diffMinutes = Math.floor(diffMs / 60000);
            
            if (diffMinutes < 1) return 'just now';
            if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
            
            const diffHours = Math.floor(diffMinutes / 60);
            if (diffHours < 24) return `${diffHours} hours ago`;
            
            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays} days ago`;
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Lists all saved questionnaires in localStorage
     * @returns {Array} Array of saved questionnaire info
     */
    static listSavedQuestionnaires() {
        const saved = [];
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('quest_answers_')) {
                    const folder = key.replace('quest_answers_', '');
                    const data = JSON.parse(localStorage.getItem(key));
                    
                    saved.push({
                        folder: folder,
                        answersCount: Object.keys(data.answers || {}).length,
                        timestamp: data.timestamp,
                        age: this.getDataAge(data.timestamp)
                    });
                }
            }
        } catch (error) {
            console.error('❌ [PersistenceManager] Failed to list saved questionnaires:', error);
        }
        
        return saved.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Cleans up old saved data (optional maintenance function)
     * @param {number} maxAgeInDays - Maximum age in days to keep
     */
    static cleanupOldData(maxAgeInDays = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);
            
            let removedCount = 0;
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('quest_answers_')) {
                    const data = JSON.parse(localStorage.getItem(key));
                    const savedDate = new Date(data.timestamp);
                    
                    if (savedDate < cutoffDate) {
                        keysToRemove.push(key);
                    }
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                removedCount++;
            });
        } catch (error) {
            console.error('❌ [PersistenceManager] Failed to cleanup old data:', error);
        }
    }
}