import { ConfigParser } from './config-parser.js';

/**
 * Service für das Laden und Parsen von Fragebogen-Daten
 * Extrahiert aus der ursprünglichen index.html-Logik
 */
export class QuestionnaireLoader {
    static questionnairesConfig = null; // Cache für die Konfiguration
    static isLoading = false; // Loading state to prevent concurrent requests
    static loadingPromise = null; // Shared promise for concurrent calls
    
    /**
     * Clears all configuration caches
     */
    static clearConfigCache() {
        console.log('[QuestionnaireLoader] Clearing configuration cache');
        this.questionnairesConfig = null;
        this.isLoading = false;
        this.loadingPromise = null;
    }

    /**
     * Lädt einen vollständigen Fragebogen (Fragen + Konfiguration)
     * @param {string} folder - Der Ordnername des Fragebogens
     * @returns {Promise<{questions: Array, config: Object}>}
     */
    static async loadQuestionnaire(folder) {
        const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        
        // Check if caching is disabled in questionnaires config
        const questionnairesConfig = await this.loadQuestionnairesConfig();
        const cacheDisabled = questionnairesConfig?.settings?.config_cache === false;
        
        // Enhanced cache busting when caching is disabled
        let cacheBuster;
        if (cacheDisabled) {
            // Aggressive cache busting: timestamp + random + explicit nocache flags
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            cacheBuster = `?v=${timestamp}&r=${random}&nocache=1&_cb=${timestamp}`;
            console.log('[QuestionnaireLoader] config_cache=false - using aggressive cache busting for', folder);
        } else {
            // Standard cache busting
            cacheBuster = '?v=' + Date.now();
        }
        
        const questionsUrl = new URL(`quests/${folder}/questions.txt${cacheBuster}`, base).toString();
        const configUrl = new URL(`quests/${folder}/config.json${cacheBuster}`, base).toString();

        try {
            // Prepare fetch options with anti-cache headers when caching is disabled
            const fetchOptions = cacheDisabled ? {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            } : {};
            
            const [questionsResponse, configResponse] = await Promise.all([
                fetch(questionsUrl, fetchOptions),
                fetch(configUrl, fetchOptions)
            ]);

            const questionsText = await questionsResponse.text();
            const configText = await configResponse.text();
            const configData = JSON.parse(configText);

            return {
                questions: this.parseQuestions(questionsText),
                config: ConfigParser.parse(configData),
                folder: folder
            };
        } catch (error) {
            console.error(`Fehler beim Laden des Fragebogens '${folder}':`, error);
            throw new Error(`Fragebogen '${folder}' konnte nicht geladen werden`);
        }
    }

    /**
     * Parst Fragen aus dem Text-Format
     * @param {string} questionsText - Der Fragen-Text (pipe-separiert)
     * @returns {Array<{id: string, text: string, category: string}>}
     */
    static parseQuestions(questionsText) {
        return questionsText
            .split('\n')
            .filter(line => line.trim()) // Leere Zeilen ignorieren
            .map(line => {
                const [id, text] = line.split('|');
                if (!id || !text) {
                    console.warn('Ungültige Frage-Zeile:', line);
                    return null;
                }
                return { 
                    id: id.trim(), 
                    text: text.trim(), 
                    category: id.trim().charAt(0) 
                };
            })
            .filter(Boolean); // Null-Werte entfernen
    }

    /**
     * Lädt die Fragebogen-Konfiguration aus der JSON-Datei
     * @returns {Promise<Object>} Die Fragebogen-Konfiguration
     */
    static async loadQuestionnairesConfig() {
        // If already loading, return the same promise to prevent double loading
        if (this.isLoading && this.loadingPromise) {
            console.log('[QuestionnaireLoader] Already loading questionnaires.json - reusing promise');
            return this.loadingPromise;
        }

        // Check cache only if not currently loading
        if (!this.isLoading && this.questionnairesConfig) {
            // If cache is explicitly disabled, we still use cached version within same session
            // to prevent double loading while respecting the cache setting
            if (this.questionnairesConfig.settings?.config_cache === false) {
                console.log('[QuestionnaireLoader] config_cache=false - using cached version to prevent double load');
                return this.questionnairesConfig;
            } else {
                return this.questionnairesConfig;
            }
        }

        // Set loading state and create shared promise
        this.isLoading = true;
        this.loadingPromise = this._performLoad();
        
        try {
            const config = await this.loadingPromise;
            return config;
        } finally {
            // Reset loading state
            this.isLoading = false;
            this.loadingPromise = null;
        }
    }

    /**
     * Performs the actual loading of questionnaires.json
     * @returns {Promise<Object>} Die Fragebogen-Konfiguration
     */
    static async _performLoad() {
        const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        
        // Enhanced cache busting for questionnaires.json
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const cacheBuster = `?v=${timestamp}&r=${random}&nocache=1`;
        const configUrl = new URL(`config/questionnaires.json${cacheBuster}`, base).toString();

        try {
            // Use anti-cache headers for questionnaires.json fetch
            const fetchOptions = {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            };
            
            const response = await fetch(configUrl, fetchOptions);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const config = await response.json();
            
            // Always cache the result (even if config_cache=false)
            // This prevents double loading within the same session
            this.questionnairesConfig = config;
            
            return config;
        } catch (error) {
            console.error('Fehler beim Laden der Fragebogen-Konfiguration:', error);
            // Fallback zur statischen Liste
            return this.getFallbackQuestionnaires();
        }
    }

    /**
     * Holt alle verfügbaren Fragebogen-Ordner
     * @returns {Promise<Array<{name: string, folder: string, description?: string}>>}
     */
    static async getQuestionnaireFolders() {
        try {
            const config = await this.loadQuestionnairesConfig();
            if (config.questionnaires) {
                return config.questionnaires
                    .filter(q => q.enabled !== false) // Deaktivierte ausblenden
                    .sort((a, b) => (a.order || 999) - (b.order || 999)) // Nach Reihenfolge sortieren
                    .map(q => ({
                        name: q.name,
                        folder: q.folder,
                        description: q.description
                    }));
            } else {
                return this.getFallbackQuestionnaires();
            }
        } catch (error) {
            console.warn('Verwende Fallback-Liste:', error);
            return this.getFallbackQuestionnaires();
        }
    }

    /**
     * Ermittelt den aktiven Fragebogen aus URL-Parametern oder Konfiguration
     * @returns {Promise<string>} Der Ordnername des aktiven Fragebogens
     */
    static async getActiveQuestionnaire() {
        const params = new URLSearchParams(window.location.search);
        const urlParam = params.get('q');
        
        if (urlParam) {
            return urlParam;
        }

        // Fallback aus Konfiguration
        try {
            const config = await this.loadQuestionnairesConfig();
            return config.settings?.defaultQuestionnaire || 'autonomie';
        } catch (error) {
            return 'autonomie'; // Hard fallback
        }
    }

    /**
     * Fallback-Liste für den Fall, dass die Konfigurationsdatei nicht geladen werden kann
     * @returns {Array<{name: string, folder: string}>}
     */
    static getFallbackQuestionnaires() {
        return [
            { name: 'Autonomie', folder: 'autonomie' },
            { name: 'ACE', folder: 'ace' },
            { name: 'Resilienz', folder: 'resilienz' }
        ];
    }
}
