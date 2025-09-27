# `config_cache: false` Feature - Dokumentation

## Übersicht
Das `config_cache: false` Feature deaktiviert das Caching von Konfigurationsdateien. Bei aktiviertem Flag werden alle Konfigurationsdateien bei jeder Anfrage frisch vom Server geladen.

## Konfiguration

### questionnaires.json
```json
{
  "settings": {
    "config_cache": false
  }
}
```

### Standardwerte
- **Default**: `config_cache: true` (Caching aktiviert)
- **Verhalten**: Wenn nicht gesetzt, werden Konfigurationsdateien gecacht

## Betroffene Dateien

### 1. QuestionnaireLoader Caching
- **Datei**: `services/questionnaire-loader.js`
- **In-Memory Cache**: `static questionnairesConfig = null`
- **Browser Cache-Busting**: Erweiterte URL-Parameter

### Arten von Caching die deaktiviert werden:

#### A) In-Memory Cache der questionnaires.json
```javascript
// Normal: Einmal geladen, dann gecacht
static questionnairesConfig = null;

// config_cache: false: Jedes Mal neu laden
if (this.questionnairesConfig.settings?.config_cache === false) {
    this.questionnairesConfig = null; // Clear cache
}
```

#### B) Aggressive Browser-Cache-Busting für ALLE Konfigurationsdateien
```javascript
// Normal: Standard Cache-Buster
const cacheBuster = '?v=' + Date.now();

// config_cache: false: Aggressive Multi-Parameter Cache-Busting
const timestamp = Date.now();
const random = Math.random().toString(36).substring(7);
const cacheBuster = `?v=${timestamp}&r=${random}&nocache=1&_cb=${timestamp}`;
```

#### C) HTTP-Header basierte Cache-Kontrolle
```javascript
// config_cache: false: Anti-Cache HTTP Headers
const fetchOptions = {
    cache: 'no-store',
    headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
};
```

## Implementierung

### 1. loadQuestionnairesConfig() Anpassung
```javascript
static async loadQuestionnairesConfig() {
    // Check if caching is disabled and clear cache if needed
    if (this.questionnairesConfig?.settings?.config_cache === false) {
        console.log('[QuestionnaireLoader] config_cache=false - bypassing cache');
        this.questionnairesConfig = null;
    }
    
    // Only cache result if caching is enabled
    if (config.settings?.config_cache !== false) {
        this.questionnairesConfig = config;
    }
    
    return config;
}
```

### 2. loadQuestionnaire() Anpassung
```javascript
static async loadQuestionnaire(folder) {
    // Check questionnaires config for cache setting
    const questionnairesConfig = await this.loadQuestionnairesConfig();
    const cacheDisabled = questionnairesConfig?.settings?.config_cache === false;
    
    // Enhanced cache busting when caching is disabled
    const cacheBuster = cacheDisabled 
        ? '?v=' + Date.now() + '&nocache=1'
        : '?v=' + Date.now();
}
```

### 3. Utility Method
```javascript
/**
 * Clears all configuration caches
 */
static clearConfigCache() {
    console.log('[QuestionnaireLoader] Clearing configuration cache');
    this.questionnairesConfig = null;
}
```

## Verhalten

### `config_cache: true` (Standard)
- ✅ questionnaires.json wird im Memory gecacht
- ✅ Browser-Cache wird mit Standard Cache-Busting umgangen
- ✅ Bessere Performance bei wiederholten Aufrufen
- ✅ Einzelne Konfigurationsdateien werden bei jedem Aufruf neu geladen (wegen Cache-Busting)

### `config_cache: false`
- ❌ **Kein** Memory-Cache für questionnaires.json
- ❌ **Aggressive** Cache-Busting mit mehreren zufälligen Parametern
- ❌ **Anti-Cache HTTP-Headers** für alle Requests
- ❌ questionnaires.json wird bei **jedem** Aufruf neu geladen
- ❌ **Alle** Fragebogen-Dateien (config.json + questions.txt) werden ohne Cache geladen
- ✅ **Garantiert frische Daten** bei jeder Anfrage - keine Cache-Probleme möglich

## Anwendungsfälle

### 1. Entwicklungsmodus
```json
{
  "settings": {
    "config_cache": false
  }
}
```
- Konfigurationsänderungen sind sofort ohne Browser-Refresh sichtbar
- Ideal für Entwicklung und Testing
- Verhindert verwirrende Cache-Probleme

### 2. Produktionsmodus
```json
{
  "settings": {
    "config_cache": true
  }
}
```
- Bessere Performance durch Caching
- Reduzierte Server-Anfragen
- Stabilere Benutzererfahrung

### 3. Demo/Präsentationsmodus
- Ermöglicht Live-Konfigurationsänderungen während Präsentationen
- Sofortige Aktualisierung ohne Browser-Refresh
- Dynamische Fragebogen-Anpassungen

## Cache-Busting Strategien

### Standard Cache-Busting
```
/config/questionnaires.json?v=1727447123456
/quests/autonomie/config.json?v=1727447123456
/quests/autonomie/questions.txt?v=1727447123456
```

### Aggressive Cache-Busting (config_cache: false)
```
/config/questionnaires.json?v=1727447123456&initial_load=1
/quests/autonomie/config.json?v=1727447123456&r=abc123&nocache=1&_cb=1727447123456
/quests/autonomie/questions.txt?v=1727447123456&r=xyz789&nocache=1&_cb=1727447123456
```

**Plus HTTP-Headers:**
```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

## Debugging

### Console-Ausgaben
```javascript
console.log('[QuestionnaireLoader] config_cache=false - bypassing cache');
console.log('[QuestionnaireLoader] Clearing configuration cache');
```

### URL-Parameter Überprüfung
- Normale Requests: Nur `?v=timestamp`
- Cache-disabled Requests: `?v=timestamp&nocache=1` oder `&initial_load=1`

## Technische Details

### Memory Management
- Cache wird explizit auf `null` gesetzt bei `config_cache: false`
- Verhindert Memory-Leaks durch kontinuierliches Neu-Laden
- Garbage Collection kann ungenutzten Cache freigeben

### Browser-Kompatibilität
- Funktioniert mit allen modernen Browsern
- URL-Parameter werden von allen HTTP-Clients unterstützt
- Fallback auf Standard Cache-Busting wenn Feature nicht erkannt wird

### Performance Impact
- **config_cache: false**: Höhere Netzwerk-Last, langsamere Ladezeiten
- **config_cache: true**: Bessere Performance, mögliche Cache-Inkonsistenzen
- **Empfehlung**: `false` für Development, `true` für Production

## Implementation Status
- ✅ **In-Memory Cache Control**: questionnaires.json Cache respektiert config_cache
- ✅ **Aggressive Cache-Busting**: Multi-Parameter URLs + Random-Strings
- ✅ **HTTP-Header Cache Control**: Anti-Cache Headers für alle Requests
- ✅ **Complete Coverage**: questionnaires.json + config.json + questions.txt
- ✅ **Utility Methods**: clearConfigCache() für explizite Cache-Kontrolle
- ✅ **Console Logging**: Debug-Ausgaben für Cache-Operationen
- ✅ **Backward Compatibility**: Standard-Verhalten bleibt unverändert

---
*Implementiert: September 2025*