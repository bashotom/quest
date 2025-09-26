import { ConfigParser } from './config-parser.js';

/**
 * Service für das Laden und Parsen von Fragebogen-Daten
 * Extrahiert aus der ursprünglichen index.html-Logik
 */
export class QuestionnaireLoader {
    static questionnairesConfig = null; // Cache für die Konfiguration

    /**
     * Lädt einen vollständigen Fragebogen (Fragen + Konfiguration)
     * @param {string} folder - Der Ordnername des Fragebogens
     * @returns {Promise<{questions: Array, config: Object}>}
     */
    static async loadQuestionnaire(folder) {
        const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const cacheBuster = '?v=' + Date.now(); // Cache-Busting
        const questionsUrl = new URL(`quests/${folder}/questions.txt${cacheBuster}`, base).toString();
        const configUrl = new URL(`quests/${folder}/config.json${cacheBuster}`, base).toString();

        try {
            const [questionsResponse, configResponse] = await Promise.all([
                fetch(questionsUrl),
                fetch(configUrl)
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
        if (this.questionnairesConfig) {
            return this.questionnairesConfig; // Bereits geladen
        }

        const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const cacheBuster = '?v=' + Date.now();
        const configUrl = new URL(`config/questionnaires.json${cacheBuster}`, base).toString();

        try {
            const response = await fetch(configUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.questionnairesConfig = await response.json();
            return this.questionnairesConfig;
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
