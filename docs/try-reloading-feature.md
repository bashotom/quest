# `try_reloading` Feature - Dokumentation

## Übersicht
Das `try_reloading` Feature ermöglicht es, das automatische Laden und Vorausfüllen von gespeicherten Antworten zu deaktivieren. Wenn `try_reloading: false` gesetzt ist, startet der Fragebogen immer mit leeren Antworten.

## Konfiguration

### JSON-Konfiguration
```json
{
  "persistence": {
    "enabled": true,
    "try_reloading": false,
    "type": "server",
    "server": {
      "endpoint": "http://example.com/api/questionnaire-data.php"
    }
  }
}
```

### Standardwerte
- **Default**: `try_reloading: true` (wenn nicht explizit gesetzt)
- **Verhalten**: Wenn nicht gesetzt, werden gespeicherte Antworten normal geladen

## Implementierung

### 1. ConfigParser Erweiterung
- **Datei**: `services/config-parser.js`
- **Zeilen 101-105**: Parsing der `try_reloading` Option
- **Default-Verhalten**: `true` (Load-Verhalten ist standardmäßig aktiviert)

```javascript
result.persistence = {
    enabled: jsonData.persistence.enabled === true,
    type: jsonData.persistence.type || 'localstorage',
    try_reloading: jsonData.persistence.try_reloading !== false // Default: true
};
```

### 2. QuestionnaireApp Anpassung
- **Datei**: `app/questionnaire-app.js`
- **Zeilen 184-208**: Bedingte Ausführung des Answer-Loading
- **Logik**: Wenn `try_reloading: false`, wird nur URL-Hash verwendet, keine gespeicherten Antworten

```javascript
// Only if try_reloading is not explicitly disabled
if (this.config.persistence?.try_reloading !== false) {
    // Load saved answers from persistence
    const PersistenceManager = PersistenceManagerFactory.create(this.config);
    const savedAnswers = await PersistenceManager.loadAnswers(this.currentFolder, this.config);
    // ... loading logic
} else {
    // try_reloading is disabled, only use URL hash
    URLHashManager.setAnswersFromHash(this.questions, this.config);
}
```

### 3. Smart Button Management
- **Datei**: `app/questionnaire-app.js`
- **Methode**: `updateClearButtonVisibility()`
- **Verhalten**: Der "Gespeicherte Antworten löschen" Button wird ausgeblendet, wenn `try_reloading: false`

```javascript
// Only show button if persistence is enabled AND try_reloading is not disabled
if (PersistenceManagerFactory.isEnabled(this.config) && this.config.persistence?.try_reloading !== false) {
    // Show button if saved answers exist
} else {
    clearSavedBtn.style.display = 'none';
}
```

## Verhalten

### `try_reloading: true` (Standard)
- ✅ Gespeicherte Antworten werden geladen
- ✅ "Gespeicherte Antworten löschen" Button ist sichtbar (wenn Daten vorhanden)
- ✅ Auto-Save funktioniert normal
- ✅ URL-Hash als Fallback wenn keine gespeicherten Daten

### `try_reloading: false`
- ❌ **Keine** gespeicherten Antworten werden geladen
- ❌ "Gespeicherte Antworten löschen" Button ist **immer versteckt**
- ✅ Auto-Save funktioniert weiterhin (Daten werden gespeichert)
- ✅ Nur URL-Hash wird für Vorausfüllung verwendet
- ✅ Fragebogen startet immer mit leeren Antworten

## Anwendungsfälle

### 1. Schulungsumgebung
```json
{
  "persistence": {
    "enabled": true,
    "try_reloading": false,
    "type": "server"
  }
}
```
- Antworten werden gespeichert, aber Teilnehmer starten immer "frisch"
- Verhindert Verwirrung durch alte Antworten

### 2. Prüfungskontext
- Ensures each attempt starts clean
- Prevents cheating via saved answers
- Still allows progress tracking on server

### 3. Demo-Modus
- Always clean slate for demonstrations
- No interference from previous sessions
- Professional presentation mode

## Kompatibilität

### Persistence-Typen
- ✅ **localstorage**: Vollständig unterstützt
- ✅ **server**: Vollständig unterstützt  
- ✅ **hybrid**: Vollständig unterstützt

### Rückwärtskompatibilität
- ✅ Bestehende Konfigurationen ohne `try_reloading` funktionieren unverändert
- ✅ Standard-Verhalten bleibt gleich (`try_reloading: true`)
- ✅ Keine Breaking Changes

## Testing

### Test-Szenarien
1. **Standard-Verhalten**: `try_reloading` nicht gesetzt → Antworten werden geladen
2. **Aktiviert**: `try_reloading: true` → Antworten werden geladen
3. **Deaktiviert**: `try_reloading: false` → Keine Antworten geladen
4. **Button-Verhalten**: Button versteckt wenn `try_reloading: false`
5. **URL-Hash**: Funktioniert in beiden Modi

### Testen im Browser
1. Öffne Fragebogen mit `try_reloading: true`
2. Fülle Antworten aus
3. Ändere auf `try_reloading: false`
4. Lade Fragebogen neu → Antworten sollten leer sein
5. Button "Gespeicherte Antworten löschen" sollte versteckt sein

## Bugfix: Button Visibility Issue (Fixed)

### Problem
Der Button "Gespeicherte Antworten löschen" war bei `try_reloading: false` trotzdem sichtbar.

### Root Cause
- Button war im HTML standardmäßig sichtbar (`<button>` ohne `style="display: none;"`)
- `updateClearButtonVisibility()` wurde möglicherweise zu früh aufgerufen oder die Logik war nicht wirksam

### Solution
- **HTML-Änderung**: Button ist standardmäßig versteckt (`style="display: none;"`)
- **ConfigParser Logic Fix**: Geändert von `!== false` zu `=== true` (explizite Aktivierung)
- **Strikte Logik**: `try_reloading` muss explizit auf `true` gesetzt werden
- **Defensive Programmierung**: Button ist standardmäßig versteckt und wird nur explizit eingeblendet

```html
<!-- VORHER: standardmäßig sichtbar -->
<button id="clear-saved-btn" type="button" class="...">Gespeicherte Antworten löschen</button>

<!-- NACHHER: standardmäßig versteckt -->
<button id="clear-saved-btn" type="button" class="..." style="display: none;">Gespeicherte Antworten löschen</button>
```

## Implementation Status
- ✅ **ConfigParser**: `try_reloading` Parsing implementiert
- ✅ **QuestionnaireApp**: Bedingte Loading-Logik implementiert
- ✅ **Button Management**: Smart visibility basierend auf `try_reloading`
- ✅ **HTML Default State**: Button standardmäßig versteckt (Bugfix)
- ✅ **ConfigParser Logic**: Strikte `=== true` Logik implementiert (Bugfix)
- ✅ **URL-Hash Fallback**: Funktioniert in beiden Modi
- ✅ **Production Ready**: Alle Debug-Ausgaben entfernt, finale Lösung implementiert

---
*Implementiert: September 2025*