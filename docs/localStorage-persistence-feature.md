# LocalStorage Persistence Feature

## Overview
Die localStorage-Persistierung ermöglicht es, Antworten von Fragebögen automatisch im Browser zu speichern und beim erneuten Öffnen wiederherzustellen, wenn die entsprechende Konfiguration aktiviert ist.

## Configuration
Um localStorage-Persistierung zu aktivieren, fügen Sie folgende Konfiguration zur `config.json` eines Fragebogens hinzu:

```json
{
  "persistence": {
    "enabled": true,
    "type": "localstorage"
  }
}
```

## Funktionalität

### Automatisches Speichern
- **Bei Änderung**: Antworten werden automatisch gespeichert, sobald ein Radiobutton geändert wird
- **Bei Formular-Submission**: Antworten werden beim Absenden des Formulars gespeichert
- **Bei Schnell-Buttons**: Antworten werden gespeichert, wenn "Alle Minimalwerte", "Alle Zufallswerte" oder "Alle Maximalwerte" geklickt wird

### Automatisches Laden
- **Beim Öffnen**: Gespeicherte Antworten werden automatisch wiederhergestellt, wenn der Fragebogen geöffnet wird
- **Priorität**: LocalStorage hat Vorrang vor URL-Hash-Parametern
- **Feedback**: Benutzer erhält eine Benachrichtigung, wenn gespeicherte Antworten geladen wurden

### Benutzer-Kontrolle
- **Löschen-Button**: "Gespeicherte löschen" Button erscheint nur bei aktivierter Persistierung
- **Bestätigung**: Benutzer muss das Löschen explizit bestätigen
- **Sofortiges Clearing**: Form wird sofort geleert und neu gerendert

## Technische Details

### Storage-Schlüssel
- Format: `quest_answers_{folder}`
- Beispiel: `quest_answers_autonomie`

### Datenstruktur
```json
{
  "answers": {
    "A1": 2,
    "A2": 3,
    "B1": 1
  },
  "timestamp": "2025-09-27T14:30:00.000Z",
  "version": "1.0"
}
```

### Automatische Bereinigung
- `PersistenceManager.cleanupOldData(maxAgeInDays)` entfernt alte Daten
- Standard: 30 Tage
- Kann manuell oder in einem Wartungsskript aufgerufen werden

## API

### PersistenceManager
```javascript
// Check if persistence is enabled
PersistenceManager.isPersistenceEnabled(config)

// Save answers
PersistenceManager.saveAnswers(folder, answers, config)

// Load answers
PersistenceManager.loadAnswers(folder, config)

// Clear answers
PersistenceManager.clearAnswers(folder)

// List all saved questionnaires
PersistenceManager.listSavedQuestionnaires()

// Cleanup old data
PersistenceManager.cleanupOldData(maxAgeInDays)
```

### Integration in bestehende Module
- **FormHandler**: Automatisches Speichern bei Änderungen
- **QuestionnaireApp**: Laden beim Start, UI-Controls
- **QuestionRenderer**: Unterstützung für das Setzen geladener Antworten

## Browser-Kompatibilität
- **localStorage**: Unterstützt von allen modernen Browsern
- **Speicherlimit**: Typischerweise 5-10MB pro Domain
- **Persistence**: Daten bleiben erhalten bis sie manuell gelöscht werden

## Datenschutz
- **Lokal**: Alle Daten verbleiben im Browser des Benutzers
- **Kein Server**: Keine Übertragung an externe Server
- **Benutzer-Kontrolle**: Benutzer kann Daten jederzeit löschen
- **Automatische Bereinigung**: Schutz vor unbegrenztem Speicherverbrauch

## Debugging
```javascript
// Console-Logs für Debugging
console.log('💾 [PersistenceManager] Answers saved to localStorage')
console.log('📥 [PersistenceManager] Answers loaded from localStorage')
console.log('🗑️ [PersistenceManager] Answers cleared from localStorage')

// Manuelle Überprüfung im Browser
localStorage.getItem('quest_answers_autonomie')
PersistenceManager.listSavedQuestionnaires()
```

## Migration
- **Rückwärts-kompatibel**: Bestehende Fragebögen ohne Persistierung funktionieren unverändert
- **Opt-in**: Persistierung muss explizit in der Konfiguration aktiviert werden
- **Graceful fallback**: Bei Fehlern wird auf URL-Hash zurückgegriffen

## Fehlerbehebung

### Häufige Probleme
1. **Button nicht sichtbar**: Prüfen Sie die `persistence`-Konfiguration in `config.json`
2. **Antworten werden nicht geladen**: Browser-Konsole prüfen, localStorage-Unterstützung verifizieren
3. **Speicher voll**: `cleanupOldData()` ausführen oder manuell löschen

### Debugging-Schritte
1. Browser-Konsole öffnen
2. `PersistenceManager.isPersistenceEnabled(config)` prüfen
3. `localStorage.getItem('quest_answers_[folder]')` kontrollieren
4. Browser-Entwicklertools → Application → Local Storage prüfen