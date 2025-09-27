/**
 * Service für das Management von URL-Hash-Parametern
 * Abstrahiert die URL-Hash-Logik für bessere Testbarkeit
 */
export class URLHashManager {
    /**
     * Parst Category-Scores direkt aus dem URL-Hash
     * @param {Array} questions - Die Fragen für die Validierung der Kategorien
     * @param {Object} config - Konfiguration
     * @returns {Object|null} Scores nach Kategorien oder null bei ungültigen Daten
     */
    static parseCategoryScoresFromHash(questions, config = null) {
        const hash = window.location.hash.substring(1);
        if (!hash) return null;

        const scores = {};
        const params = new URLSearchParams(hash);
        let hasValidData = false;
        
        // Sammle alle verfügbaren Kategorien aus den Fragen
        const availableCategories = new Set(questions.map(q => q.category));
        
        for (const [category, value] of params.entries()) {
            // Prüfe ob die Kategorie in den Fragen existiert
            if (availableCategories.has(category)) {
                const score = parseInt(value, 10);
                if (!isNaN(score) && score >= 0) {
                    scores[category] = score;
                    hasValidData = true;
                }
            }
        }

        return hasValidData ? scores : null;
    }

    /**
     * Parst Scores aus dem URL-Hash
     * @param {Array} questions - Die Fragen für die Validierung
     * @param {Object} config - Konfiguration für Score-Berechnung
     * @returns {Object|null} Scores nach Kategorien oder null bei unvollständigen Daten
     */
    static parseScoresFromHash(questions, config = null) {
        // Versuche zuerst kompakte Base64-Version (universelle Lesefähigkeit)
        const compactAnswers = this.parseCompactHash(questions);
        if (compactAnswers && config) {
            return this.calculateScoresFromAnswers(compactAnswers, questions, config);
        }
        
        // Fallback zur Standard-Hash-Methode
        const hash = window.location.hash.substring(1);
        if (!hash) return null;

        const scores = {};
        const params = new URLSearchParams(hash);
        let hasIncompleteData = false;
        let hasValidData = false;
        
        for (const [key, value] of params.entries()) {
            const question = questions.find(q => q.id === key);
            if (question) {
                const score = parseInt(value, 10);
                if (!isNaN(score)) {
                    const category = question.category;
                    scores[category] = (scores[category] || 0) + score;
                    hasValidData = true;
                } else {
                    hasIncompleteData = true;
                }
            }
            // Ignoriere Hash-Parameter, die nicht zu aktuellen Fragen gehören
        }

        // Nur gültige Scores zurückgeben wenn:
        // 1. Es gibt gültige Daten UND
        // 2. Keine unvollständigen Daten UND 
        // 3. Alle aktuellen Fragen sind im Hash enthalten
        if (!hasValidData || hasIncompleteData) {
            return null;
        }
        
        // Prüfe, ob alle Fragen beantwortet sind
        const answeredQuestions = Array.from(params.keys()).filter(key => 
            questions.find(q => q.id === key)
        );
        
        if (answeredQuestions.length !== questions.length) {
            return null;
        }

        return Object.keys(scores).length > 0 ? scores : null;
    }

    /**
     * Dekodiert eine kompakte Base64-URL
     * @param {Array} questions - Fragen für die Zuordnung
     * @returns {Object|null} Antworten als questionId->answerIndex oder null bei Fehler
     */
    static parseCompactHash(questions) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const compressed = params.get('c');
        
        if (!compressed) return null;
        
        try {
            const values = atob(compressed);
            const answers = {};
            
            questions.forEach((question, index) => {
                if (index < values.length) {
                    const value = parseInt(values[index], 10);
                    if (!isNaN(value)) {
                        answers[question.id] = value;
                    }
                }
            });
            
            return answers;
        } catch (error) {
            console.error('Failed to decode compact hash:', error);
            return null;
        }
    }

    /**
     * Berechnet Scores aus Antwort-Objekten
     * @param {Object} answers - Antworten als questionId->answerIndex
     * @param {Array} questions - Fragen mit Kategorie-Zuordnung
     * @param {Object} config - Konfiguration mit Antwortoptionen und Kategorien
     * @returns {Object} Scores nach Kategorien
     */
    static calculateScoresFromAnswers(answers, questions, config) {
        const scores = {};
        
        // Normalize categories (handle array format)
        const categories = Array.isArray(config.categories)
            ? config.categories.reduce((acc, cat) => ({ ...acc, ...cat }), {})
            : config.categories;
        
        // Initialize all categories with 0
        Object.keys(categories).forEach(category => {
            scores[category] = 0;
        });

        // Process each answer
        Object.entries(answers).forEach(([questionId, answerIndex]) => {
            const question = questions.find(q => q.id === questionId);
            if (question && config.answers[answerIndex]) {
                const category = question.category;
                const value = config.answers[answerIndex].value;
                if (scores.hasOwnProperty(category)) {
                    scores[category] += value;
                }
            }
        });

        return scores;
    }

    /**
     * Setzt Antworten aus dem URL-Hash in die Form-Elemente
     * @param {Array} questions - Die verfügbaren Fragen
     * @param {Object} config - Konfiguration (für universelle Lesefähigkeit)
     */
    static setAnswersFromHash(questions, config = null) {
        // Versuche zuerst kompakte Base64-Version (universelle Lesefähigkeit)
        const compactAnswers = this.parseCompactHash(questions);
        
        if (compactAnswers) {
            Object.entries(compactAnswers).forEach(([questionId, answerIndex]) => {
                const radio = document.querySelector(`input[name="question-${questionId}"][value="${answerIndex}"]`);
                if (radio) {
                    radio.checked = true;
                }
            });
            return;
        }
        
        // Fallback zur Standard-Hash-Methode
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        questions.forEach(q => {
            const idx = hashParams.get(q.id);
            if (idx !== null) {
                const radio = document.querySelector(`input[name="question-${q.id}"][value="${idx}"]`);
                if (radio) radio.checked = true;
            }
        });
    }

    /**
     * Aktualisiert den URL-Hash mit den aktuellen Antworten
     * @param {Object} answers - Antworten als Key-Value-Paare
     * @param {Array} questions - Fragen-Array für Base64-Encoding
     * @param {Object} config - Konfiguration mit bookmark_encoding Option
     */
    static updateHash(answers, questions = null, config = null) {        
        // Check if hash updates are suppressed (during answer restoration)
        if (window.questionnaire?._suppressHashUpdates) {
            return;
        }
        
        // Check if Base64 encoding is enabled for NEW links
        if (config && config.bookmark_encoding === 'base64' && questions) {
            const values = questions.map(question => {
                const answerIndex = answers[question.id];
                const value = answerIndex !== undefined ? answerIndex.toString() : '0';
                return value;
            }).join('');
            
            const compressed = btoa(values);
            const newHash = `#c=${compressed}`;
            
            if (window.location.hash !== newHash) {
                window.history.replaceState(null, null, newHash);
            }
            return;
        }
        
        // Default behavior - standard URL parameters
        const hashParams = new URLSearchParams();
        Object.entries(answers).forEach(([questionId, answerIndex]) => {
            hashParams.set(questionId, answerIndex);
        });
        
        // Hash setzen ohne Page-Reload
        const newHash = `#${hashParams.toString()}`;
        
        if (window.location.hash !== newHash) {
            window.history.replaceState(null, null, newHash);
        }
    }

    /**
     * Sammelt alle aktuellen Antworten aus dem DOM
     * @param {Array} questions - Die verfügbaren Fragen
     * @returns {Object} Antworten als Key-Value-Paare
     */
    static collectAnswersFromForm(questions, config) {
        const form = document.getElementById('quiz-form');
        if (!form) {
            console.error('Form with id "quiz-form" not found!');
            return [];
        }

        if (!questions || !Array.isArray(questions)) {
            console.error('Invalid questions array:', questions);
            return [];
        }

        if (!config || !config.answers || !Array.isArray(config.answers)) {
            console.error('Invalid config.answers array:', config?.answers);
            return [];
        }

        const answers = [];
        const formData = new FormData(form);
        
        // Process each form field in order
        for (let i = 0; i < questions.length; i++) {
            const questionId = questions[i].id;
            const fieldName = `question-${questionId}`;
            const selectedValue = formData.get(fieldName);
            
            if (selectedValue !== null) {
                // selectedValue is the answerIndex, convert to actual answer
                const answerIndex = parseInt(selectedValue, 10);
                
                if (!isNaN(answerIndex) && config.answers[answerIndex]) {
                    const answerOption = config.answers[answerIndex];
                    answers.push({
                        questionId: questionId,
                        label: answerOption.label,
                        value: answerOption.value,
                        index: answerIndex // Store index for hash updates
                    });
                }
            }
        }

        return answers;
    }

    /**
     * Berechnet Scores aus gegebenen Antworten
     * @param {Object} answers - Antworten als Key-Value-Paare
     * @param {Array} questions - Die Fragen mit Kategorie-Zuordnung
     * @param {Array} answerOptions - Die verfügbaren Antwortoptionen mit Werten
     * @returns {Object} Scores nach Kategorien
     */
    static calculateScores(answers, questions, config) {
        const scores = {};
        
        // Normalize categories (handle array format)
        const categories = Array.isArray(config.categories)
            ? config.categories.reduce((acc, cat) => ({ ...acc, ...cat }), {})
            : config.categories;
        
        // Initialize all categories with 0
        Object.keys(categories).forEach(category => {
            scores[category] = 0;
        });

        // Process each answer
        answers.forEach((answer) => {
            // Find the question data based on questionId
            const question = questions.find(q => q.id === answer.questionId);
            if (question && answer.value !== undefined) {
                const category = question.category;
                if (scores.hasOwnProperty(category)) {
                    scores[category] += answer.value;
                }
            }
        });

        return scores;
    }

    /**
     * Erstellt einen Share-Link mit den aktuellen Antworten
     * @param {Array} questions - Die Fragen
     * @param {Object} config - Die Konfiguration
     * @param {string} [baseUrl] - Optional: Basis-URL (für Tests)
     * @returns {string} Der vollständige Share-Link
     */
    static createShareUrl(questions, config, baseUrl = null) {
        if (!baseUrl) {
            baseUrl = `${window.location.origin}${window.location.pathname}`;
        }
        
        const answers = this.collectAnswersFromForm(questions, config);
        if (answers.length === 0) {
            return baseUrl; // Keine Antworten = normaler Link
        }
        
        // URL-Parameter für Fragebogen
        const params = new URLSearchParams(window.location.search);
        const folder = params.get('q') || 'autonomie';
        
        // Hash für Antworten erstellen
        this.updateHash(answers, questions, config);
        const hash = window.location.hash;
        
        return `${baseUrl}?q=${folder}${hash}`;
    }

    /**
     * Erstellt eine kompakte Base64-kodierte URL
     * @param {Object} answers - Antworten als Key-Value-Paare (questionId -> answerIndex)
     * @param {Array} questions - Fragen für die Reihenfolge
     * @returns {string} Kompakte Share-URL
     */
    static createCompactShareLink(answers, questions) {
        // Erstelle kompakten String: nur Werte in Fragen-Reihenfolge
        const values = questions.map(question => {
            const answerIndex = answers[question.id];
            return answerIndex !== undefined ? answerIndex.toString() : '0';
        }).join('');
        
        // Base64-kodiere den String
        const compressed = btoa(values);
        
        const baseUrl = window.location.origin + window.location.pathname + window.location.search;
        return `${baseUrl}#c=${compressed}`;
    }

    /**
     * Überprüft, ob Debug-Modus aktiv ist
     * @returns {boolean} True wenn Debug-Modus aktiv
     */
    static isDebugMode() {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        return searchParams.get('debug') === '1' || hashParams.get('debug') === '1';
    }

    /**
     * Erstellt Hash-String aus Scores für URL-Sharing
     * @param {Object} scores - Scores nach Kategorien
     * @returns {string} URL-Hash String
     */
    static buildHashFromScores(scores) {
        if (!scores || typeof scores !== 'object') {
            return '';
        }
        
        const params = new URLSearchParams();
        for (const [category, score] of Object.entries(scores)) {
            if (typeof score === 'number' && !isNaN(score)) {
                params.append(category, score.toString());
            }
        }
        
        return params.toString();
    }

    /**
     * Registriert Event-Listener für Hash-Änderungen
     * @param {Function} callback - Callback-Funktion bei Hash-Änderung
     */
    static onHashChange(callback) {
        window.addEventListener('hashchange', callback);
    }

    /**
     * Entfernt Event-Listener für Hash-Änderungen
     * @param {Function} callback - Zu entfernende Callback-Funktion
     */
    static offHashChange(callback) {
        window.removeEventListener('hashchange', callback);
    }

    /**
     * Löscht den URL-Hash komplett
     * Verwendet für das Bereinigen beim Fragebogen-Wechsel
     */
    static clearHash() {
        if (window.location.hash) {
            window.history.replaceState(null, null, window.location.pathname + window.location.search);
        }
    }
}
