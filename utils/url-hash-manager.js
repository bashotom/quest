/**
 * Service für das Management von URL-Hash-Parametern
 * Abstrahiert die URL-Hash-Logik für bessere Testbarkeit
 */
export class URLHashManager {
    /**
     * Parst Scores aus dem URL-Hash
     * @param {Array} questions - Die Fragen für die Validierung
     * @returns {Object|null} Scores nach Kategorien oder null bei unvollständigen Daten
     */
    static parseScoresFromHash(questions) {
        const hash = window.location.hash.substring(1);
        if (!hash) return null;

        const scores = {};
        const params = new URLSearchParams(hash);
        let hasIncompleteData = false;
        
        for (const [key, value] of params.entries()) {
            const question = questions.find(q => q.id === key);
            if (question) {
                const score = parseInt(value, 10);
                if (!isNaN(score)) {
                    const category = question.category;
                    scores[category] = (scores[category] || 0) + score;
                } else {
                    hasIncompleteData = true;
                }
            }
        }

        if (hasIncompleteData) {
            return null;
        }

        return Object.keys(scores).length > 0 ? scores : null;
    }

    /**
     * Setzt Antworten aus dem URL-Hash in die Form-Elemente
     * @param {Array} questions - Die verfügbaren Fragen
     */
    static setAnswersFromHash(questions) {
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
     */
    static updateHash(answers) {
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
    static collectAnswersFromForm(questions) {
        const answers = {};
        questions.forEach(question => {
            const selectedRadio = document.querySelector(`input[name="question-${question.id}"]:checked`);
            if (selectedRadio) {
                answers[question.id] = selectedRadio.value;
            }
        });
        return answers;
    }

    /**
     * Berechnet Scores aus gegebenen Antworten
     * @param {Object} answers - Antworten als Key-Value-Paare
     * @param {Array} questions - Die Fragen mit Kategorie-Zuordnung
     * @param {Array} answerOptions - Die verfügbaren Antwortoptionen mit Werten
     * @returns {Object} Scores nach Kategorien
     */
    static calculateScores(answers, questions, answerOptions) {
        const scores = {};
        
        Object.entries(answers).forEach(([questionId, answerIndex]) => {
            const question = questions.find(q => q.id === questionId);
            const answerOption = answerOptions[parseInt(answerIndex, 10)];
            
            if (question && answerOption) {
                const category = question.category;
                const score = answerOption.value;
                scores[category] = (scores[category] || 0) + score;
            }
        });
        
        return scores;
    }

    /**
     * Erstellt einen Share-Link mit den aktuellen Antworten
     * @param {Object} answers - Antworten als Key-Value-Paare
     * @returns {string} Vollständige Share-URL
     */
    static createShareLink(answers) {
        const hashParams = new URLSearchParams();
        Object.entries(answers).forEach(([questionId, answerIndex]) => {
            hashParams.set(questionId, answerIndex);
        });
        
        const baseUrl = window.location.origin + window.location.pathname + window.location.search;
        return `${baseUrl}#${hashParams.toString()}`;
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
}
