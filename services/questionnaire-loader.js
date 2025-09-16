import { ConfigParser } from './config-parser.js';

/**
 * Service für das Laden und Parsen von Fragebogen-Daten
 * Extrahiert aus der ursprünglichen index.html-Logik
 */
export class QuestionnaireLoader {
    /**
     * Lädt einen vollständigen Fragebogen (Fragen + Konfiguration)
     * @param {string} folder - Der Ordnername des Fragebogens
     * @returns {Promise<{questions: Array, config: Object}>}
     */
    static async loadQuestionnaire(folder) {
        const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        const questionsUrl = new URL(`quests/${folder}/questions.txt`, base).toString();
        const configUrl = new URL(`quests/${folder}/config.json`, base).toString();

        try {
            const [questionsText, configData] = await Promise.all([
                fetch(questionsUrl).then(r => r.text()),
                fetch(configUrl).then(r => r.json())
            ]);

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
     * Holt alle verfügbaren Fragebogen-Ordner
     * TODO: In Zukunft könnte dies dynamisch über eine API erfolgen
     * @returns {Array<{name: string, folder: string}>}
     */
    static getQuestionnaireFolders() {
        // Statische Liste - könnte später dynamisch werden
        return [
            { name: 'Autonomie', folder: 'autonomie' },
            { name: 'ACE', folder: 'ace' },
            { name: 'Resilienz', folder: 'resilienz' }
        ];
    }

    /**
     * Ermittelt den aktiven Fragebogen aus URL-Parametern
     * @returns {string} Der Ordnername des aktiven Fragebogens
     */
    static getActiveQuestionnaire() {
        const params = new URLSearchParams(window.location.search);
        return params.get('q') || 'autonomie';
    }
}
