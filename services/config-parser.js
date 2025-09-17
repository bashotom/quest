/**
 * Service für das Parsen und Normalisieren von Fragebogen-Konfigurationen
 * Extrahiert aus der ursprünglichen parseJsonConfig-Funktion
 */
export class ConfigParser {
    /**
     * Parst und normalisiert eine Fragebogen-Konfiguration
     * @param {Object} jsonData - Die rohe JSON-Konfiguration
     * @returns {Object} Normalisierte Konfiguration
     */
    static parse(jsonData) {
        const result = { 
            answers: [], 
            categories: {}, 
            categoriesArray: [],
            title: '',
            description: '',
            chart: {},
            input: {}
        };
        
        // Titel und Beschreibung direkt übernehmen
        result.title = jsonData.title || '';
        result.description = jsonData.description || '';
        
        // Answers verarbeiten - aus Array von Objekten zu Array mit label/value
        if (jsonData.answers && Array.isArray(jsonData.answers)) {
            result.answers = jsonData.answers.map(answerObj => {
                const key = Object.keys(answerObj)[0];
                const value = answerObj[key];
                return { label: key, value: value };
            });
        }
        
        // Categories verarbeiten - aus Array von Objekten zu Objekten und Array
        if (jsonData.categories && Array.isArray(jsonData.categories)) {
            jsonData.categories.forEach(categoryObj => {
                const key = Object.keys(categoryObj)[0];
                const value = categoryObj[key];
                result.categories[key] = value;
                result.categoriesArray.push({ key, value });
            });
        }
        
        // Chart-Konfiguration übernehmen
        if (jsonData.chart && typeof jsonData.chart === 'object') {
            result.chart = { ...jsonData.chart };
        }
        
        // Input-Konfiguration verarbeiten
        if (jsonData.input && typeof jsonData.input === 'object') {
            result.input = {
                element: jsonData.input.element || 'radiobox',
                size: jsonData.input.size || 5,
                display: jsonData.input.display || 'column',
                header_repeating_rows: parseInt(jsonData.input.header_repeating_rows) || 0
            };
        } else {
            result.input = {
                element: 'radiobox',
                size: 5,
                display: 'column',
                header_repeating_rows: 0
            };
        }
        
        return result;
    }

    /**
     * Validiert eine Konfiguration
     * @param {Object} config - Die zu validierende Konfiguration
     * @returns {Array<string>} Array von Validierungsfehlern (leer wenn gültig)
     */
    static validate(config) {
        const errors = [];

        if (!config.title) {
            errors.push('Titel ist erforderlich');
        }

        if (!config.answers || config.answers.length === 0) {
            errors.push('Mindestens eine Antwortmöglichkeit ist erforderlich');
        }

        if (!config.categories || Object.keys(config.categories).length === 0) {
            errors.push('Mindestens eine Kategorie ist erforderlich');
        }

        // Validiere Chart-Typ
        const validChartTypes = ['radar', 'bar', 'gauge'];
        if (config.chart.type && !validChartTypes.includes(config.chart.type)) {
            errors.push(`Ungültiger Chart-Typ: ${config.chart.type}. Erlaubt: ${validChartTypes.join(', ')}`);
        }

        // Validiere Input-Element
        const validInputElements = ['radiobox'];
        if (config.input.element && !validInputElements.includes(config.input.element)) {
            errors.push(`Ungültiges Input-Element: ${config.input.element}. Erlaubt: ${validInputElements.join(', ')}`);
        }

        // Validiere Display-Modus
        const validDisplayModes = ['column', 'inline'];
        if (config.input.display && !validDisplayModes.includes(config.input.display)) {
            errors.push(`Ungültiger Display-Modus: ${config.input.display}. Erlaubt: ${validDisplayModes.join(', ')}`);
        }

        return errors;
    }

    /**
     * Gibt die Standard-Konfiguration zurück
     * @returns {Object} Standard-Konfiguration
     */
    static getDefault() {
        return {
            title: 'Fragebogen',
            description: '',
            answers: [
                { label: 'Nein', value: 0 },
                { label: 'Ja', value: 1 }
            ],
            categories: { A: 'Standard-Kategorie' },
            categoriesArray: [{ key: 'A', value: 'Standard-Kategorie' }],
            chart: { type: 'radar' },
            input: {
                element: 'radiobox',
                size: 5,
                display: 'column'
            }
        };
    }
}
