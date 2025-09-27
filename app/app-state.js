/**
 * AppState - Central state management for the questionnaire application
 * Manages all application state in one place
 */
export class AppState {
    constructor() {
        this.questions = [];
        this.config = {};
        this.currentFolder = '';
        this.labelState = null;
        this._suppressHashUpdates = false;
        this._forceShowForm = false;
        this.formHandler = null;
    }

    /**
     * Reset all state to initial values
     */
    reset() {
        this.questions = [];
        this.config = {};
        this.currentFolder = '';
        this.labelState = null;
        this._suppressHashUpdates = false;
        this._forceShowForm = false;
        this.formHandler = null;
    }

    /**
     * Update state with provided data
     * @param {Object} data - State data to update
     */
    update(data) {
        Object.assign(this, data);
    }

    /**
     * Get effective display mode based on responsive settings
     * @param {string} displayMode - The configured display mode
     * @returns {string} The effective display mode
     */
    getEffectiveDisplayMode(displayMode) {
        if (displayMode === 'responsive') {
            return window.innerWidth > 900 ? 'column' : 'inline';
        }
        return displayMode;
    }
}