# Modulare Fragebogen-App

Diese Implementierung zeigt die modernisierte, modulare Version der ursprünglichen Fragebogen-Anwendung mit WebComponents.

## 🚀 Neues modulares Design

### Dateistruktur

```
quest/
├── index-modular.html          # Neue modulare Version
├── index.html                  # Original (noch funktionsfähig)
├── components/                 # WebComponents
│   ├── questionnaire-app.js    # Haupt-App-Component
│   └── questionnaire-form.js   # Formular-Component
├── services/                   # Business Logic
│   ├── questionnaire-loader.js # Datenlade-Service
│   └── config-parser.js       # Konfigurations-Parser
├── utils/                     # Utility-Funktionen
│   └── url-hash-manager.js    # URL-Hash-Management
├── js/                        # Legacy (Chart-Library)
│   └── radarChart.js          # D3.js Radar-Chart
└── quests/                    # Fragebogen-Daten (unverändert)
    ├── autonomie/
    ├── ace/
    └── resilienz/
```

## 🎯 Vorteile der modularen Architektur

### 1. **Bessere Wartbarkeit**
- Klare Trennung von Verantwortlichkeiten
- Einzelne Module können isoliert bearbeitet werden
- Weniger Code-Duplikation

### 2. **Erhöhte Testbarkeit**
- Services können einzeln getestet werden
- Mocking von Abhängigkeiten möglich
- Unit-Tests für WebComponents

### 3. **Verbesserte Entwicklerfreundlichkeit**
- Gleichzeitige Arbeit mehrerer Entwickler möglich
- Klarere Code-Struktur
- Bessere IDE-Unterstützung

### 4. **Skalierbarkeit**
- Neue Komponenten einfach hinzufügbar
- Services erweiterbar
- Modularer Aufbau für größere Anwendungen

## 🛠️ Verwendung

### Original-Version verwenden
```bash
# Einfach die ursprüngliche index.html öffnen
open index.html
```

### Modulare Version verwenden
```bash
# Die neue modulare Version öffnen
open index-modular.html
```

**Hinweis:** Beide Versionen verwenden dieselben Fragebogen-Daten in `quests/` und sind vollständig kompatibel.

## 📋 WebComponent-APIs

### QuestionnaireApp
Haupt-WebComponent, die alle anderen Komponenten koordiniert.

```html
<questionnaire-app></questionnaire-app>
```

### QuestionnaireForm
Formular-Component für die Darstellung der Fragen.

```html
<questionnaire-form display-mode="column"></questionnaire-form>
```

**Attribute:**
- `display-mode`: `"column"` oder `"inline"`

**Events:**
- `formSubmit`: Wird ausgelöst, wenn das Formular abgesendet wird
- `answerChanged`: Wird ausgelöst, wenn eine Antwort geändert wird
- `displayModeChanged`: Wird ausgelöst, wenn der Anzeigemodus geändert wird

## 🔧 Services

### QuestionnaireLoader
Lädt und parst Fragebogen-Daten.

```javascript
import { QuestionnaireLoader } from './services/questionnaire-loader.js';

const data = await QuestionnaireLoader.loadQuestionnaire('autonomie');
// { questions: [...], config: {...}, folder: 'autonomie' }
```

### ConfigParser
Parst und validiert Fragebogen-Konfigurationen.

```javascript
import { ConfigParser } from './services/config-parser.js';

const config = ConfigParser.parse(jsonData);
const errors = ConfigParser.validate(config);
```

### URLHashManager
Verwaltet URL-Hash-Parameter für Antworten.

```javascript
import { URLHashManager } from './utils/url-hash-manager.js';

const scores = URLHashManager.parseScoresFromHash(questions);
URLHashManager.updateHash(answers);
```

## 🌐 Browser-Kompatibilität

**Unterstützte Browser:**
- Chrome 67+
- Firefox 63+
- Safari 13.1+
- Edge 79+

**Erforderliche Features:**
- ES6 Modules
- Custom Elements v1
- Shadow DOM v1
- Fetch API
- URLSearchParams

Die Anwendung prüft automatisch die Browser-Kompatibilität und zeigt entsprechende Fehlermeldungen bei nicht unterstützten Browsern.

## 🔄 Migration von der Original-Version

Die modulare Version ist vollständig rückwärtskompatibel:

1. **Fragebogen-Daten**: Keine Änderungen erforderlich
2. **URLs**: Funktionieren weiterhin (Parameter und Hash-Navigation)
3. **Benutzerfreundlichkeit**: Identische User Experience

## 🚀 Zukünftige Erweiterungen

### Geplante Verbesserungen
1. **Chart-WebComponents**: Modernisierung der D3.js-Charts
2. **State Management**: Zentrales State Management mit Redux/MobX
3. **TypeScript**: Type-Safety für bessere Entwicklerfreundlichkeit
4. **Testing**: Unit- und Integration-Tests
5. **PWA-Features**: Offline-Funktionalität
6. **Build-Pipeline**: Optional für Optimierung

### Erweiterungsmöglichkeiten
- Neue Chart-Typen
- Erweiterte Fragebogen-Features
- Multi-Language-Support
- Export-Funktionalitäten
- Analytics und Tracking

## 📝 Entwicklung

### Neue Komponente hinzufügen
```javascript
// components/my-component.js
class MyComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
    }
    
    render() {
        this.shadowRoot.innerHTML = `
            <style>/* styles */</style>
            <div>Content</div>
        `;
    }
}

customElements.define('my-component', MyComponent);
```

### Service erweitern
```javascript
// services/my-service.js
export class MyService {
    static async doSomething() {
        // Implementation
    }
}
```

## 🤝 Kompatibilität mit der Original-Version

- ✅ Gleiche Fragebogen-Daten
- ✅ Identische URLs und Navigation
- ✅ Gleiche Funktionalität
- ✅ Kompatible Chart-Darstellung
- ✅ Gleiche Browser-Anforderungen (modern)

Die modulare Version kann parallel zur Original-Version existieren und als schrittweise Migration verwendet werden.
