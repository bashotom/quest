/**
 * Service für das Parsen und Normalisieren von Fragebogen-Konfigurationen
 * Extrahiert aus der                  /            const parsedTryReloading = rawTryReloading !== false;
            
            result.persistence = {ce-Konfiguration verarbeiten
        if (jsonData.persistence && typeof jsonData.persistence === 'object') {
            const rawTryReloading = jsonData.persistence.try_reloading;
            const parsedTryReloading = rawTryReloading !== false;
            
            result.persistence = {
                enabled: jsonData.persistence.enabled === true,persistence && typeof jsonData.persistence === 'object') {
            const rawTryReloading = jsonData.persistence.try_reloading;
            const parsedTryReloading = rawTryReloading !== false;
            
            result.persistence = {
                enabled: jsonData.persistence.enabled === true,
                type: jsonData.persistence.type || 'localstorage',
                try_reloading: rawTryReloading === true, // Explicit check: only true if explicitly set to true rawTryReloading = jsonData.persistence.try_reloading;
            
            result.persistence = {ult.persistence = {
                enabled: jsonData.persistence.enabled === true,
                type: jsonData.persistence.type || 'localstorage',
                try_reloading: jsonData.persistence.try_reloading === true // Explicit check: only true if explicitly set to true parseJsonConfig-Funktion
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
            input: {},
            resulttable: {},
            persistence: {},
            questionUi: {}, // Add question-ui configuration
            evaluationUi: {} // Add evaluation-ui configuration
        };
            // trafficlights initialisieren
            result.trafficlights = [];
        
        // Titel und Beschreibung direkt übernehmen
        result.title = jsonData.title || '';
        result.description = jsonData.description || '';
        
        // Bookmark-Encoding übernehmen (für Base64-URL-Komprimierung)
        result.bookmark_encoding = jsonData.bookmark_encoding || null;
        
        // Answers verarbeiten - unterstützt beide Strukturen
        if (jsonData.answers && Array.isArray(jsonData.answers)) {
            result.answers = jsonData.answers.map(answerObj => {
                // Neue Struktur: {label: "...", value: X, color: "..."}
                if (answerObj.label !== undefined && answerObj.value !== undefined) {
                    return {
                        label: answerObj.label,
                        value: answerObj.value,
                        color: answerObj.color || null
                    };
                }
                // Alte Struktur: {"Text": value}
                else {
                    const key = Object.keys(answerObj)[0];
                    const value = answerObj[key];
                    return { 
                        label: key, 
                        value: value,
                        color: null
                    };
                }
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
        
    // Chart- und Input-Konfigurationen
    result.chart = jsonData.chart || {};
    result.input = jsonData.input || {};
    result.resulttable = jsonData.resulttable || {};
    // resulttiles übernehmen, falls vorhanden
    result.resulttiles = jsonData.resulttiles || {};
            // trafficlights aus Root übernehmen (neue Struktur)
            if (Array.isArray(jsonData.trafficlights)) {
                result.trafficlights = jsonData.trafficlights.map(tl => ({ ...tl }));
            }
        // Spezialfall: scale_angles für GaugeChart an die oberste Ebene kopieren
        if (jsonData.chart && Array.isArray(jsonData.chart.scale_angles)) {
            result.scale_angles = jsonData.chart.scale_angles;
        }
        
        // Question-UI Konfiguration verarbeiten
        if (jsonData['question-ui'] && typeof jsonData['question-ui'] === 'object') {
            result.questionUi = {
                autoscroll: jsonData['question-ui'].autoscroll === true,
                stepper: jsonData['question-ui'].stepper === true
            };
        } else {
            result.questionUi = {
                autoscroll: false,
                stepper: false
            };
        }
        
        // Evaluation-UI Konfiguration verarbeiten
        if (jsonData['evaluation_ui'] && typeof jsonData['evaluation_ui'] === 'object') {
            result.evaluationUi = {
                sequence: Array.isArray(jsonData['evaluation_ui'].sequence) 
                    ? jsonData['evaluation_ui'].sequence 
                    : ['chart', 'table', 'tiles']
            };
        } else {
            result.evaluationUi = {
                sequence: ['chart', 'table', 'tiles']
            };
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
        
        // Persistence-Konfiguration verarbeiten
        if (jsonData.persistence && typeof jsonData.persistence === 'object') {
            const rawTryReloading = jsonData.persistence.try_reloading;
            const parsedTryReloading = rawTryReloading !== false;
            
            result.persistence = {
                enabled: jsonData.persistence.enabled === true,
                type: jsonData.persistence.type || 'localstorage',
                try_reloading: rawTryReloading === true, // Explicit check: only true if explicitly set to true
                ask_reloading: jsonData.persistence.ask_reloading === true // Ask before loading saved answers
            };
            
            // Server-Konfiguration für Hybrid-Modus
            if (jsonData.persistence.server && typeof jsonData.persistence.server === 'object') {
                result.persistence.server = {
                    endpoint: jsonData.persistence.server.endpoint || '/api/questionnaire-data.php',
                    sync: jsonData.persistence.server.sync || 'auto',
                    authentication: jsonData.persistence.server.authentication || 'session',
                    timeout: parseInt(jsonData.persistence.server.timeout) || 5000
                };
            } else if (jsonData.persistence.type === 'hybrid' || jsonData.persistence.type === 'server') {
                // Default server config für hybrid/server Modus
                result.persistence.server = {
                    endpoint: '/api/questionnaire-data.php',
                    sync: 'auto',
                    authentication: 'session',
                    timeout: 5000
                };
            }
        } else {
            result.persistence = {
                enabled: false,
                type: 'localstorage',
                try_reloading: false, // Default: false (no persistence = no reloading)
                ask_reloading: false // Default: false
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
        const validDisplayModes = ['column', 'inline', 'responsive'];
        if (config.input.display && !validDisplayModes.includes(config.input.display)) {
            errors.push(`Ungültiger Display-Modus: ${config.input.display}. Erlaubt: ${validDisplayModes.join(', ')}`);
        }

        // Validiere Persistence-Typ
        const validPersistenceTypes = ['localstorage', 'server', 'hybrid'];
        if (config.persistence.type && !validPersistenceTypes.includes(config.persistence.type)) {
            errors.push(`Ungültiger Persistence-Typ: ${config.persistence.type}. Erlaubt: ${validPersistenceTypes.join(', ')}`);
        }

        // Validiere Server-Konfiguration für server/hybrid Modi
        if ((config.persistence.type === 'server' || config.persistence.type === 'hybrid') && config.persistence.server) {
            if (!config.persistence.server.endpoint) {
                errors.push('Server-Endpoint ist erforderlich für server/hybrid Persistierung');
            }
            
            const validSyncModes = ['auto', 'manual'];
            if (config.persistence.server.sync && !validSyncModes.includes(config.persistence.server.sync)) {
                errors.push(`Ungültiger Sync-Modus: ${config.persistence.server.sync}. Erlaubt: ${validSyncModes.join(', ')}`);
            }
            
            const validAuthMethods = ['session', 'none'];
            if (config.persistence.server.authentication && !validAuthMethods.includes(config.persistence.server.authentication)) {
                errors.push(`Ungültige Authentifizierung: ${config.persistence.server.authentication}. Erlaubt: ${validAuthMethods.join(', ')}`);
            }
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
