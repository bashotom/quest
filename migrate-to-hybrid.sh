#!/bin/bash
# Migration Script: LocalStorage -> Hybrid Persistence
# Dieses Skript zeigt die notwendigen Schritte zur Migration

echo "🚀 Quest Hybrid Persistence Migration"
echo "====================================="

# Schritt 1: Server-Setup prüfen
echo "1. Server-Setup prüfen..."

if command -v mysql &> /dev/null; then
    echo "   ✅ MySQL ist verfügbar"
else
    echo "   ❌ MySQL nicht gefunden. Bitte installieren Sie MySQL/MariaDB"
    exit 1
fi

if command -v php &> /dev/null; then
    echo "   ✅ PHP ist verfügbar"
else
    echo "   ❌ PHP nicht gefunden. Bitte installieren Sie PHP"
    exit 1
fi

# Schritt 2: Datenbank einrichten
echo ""
echo "2. Datenbank-Setup..."
echo "   Führen Sie diese Befehle manuell aus:"
echo "   mysql -u root -p < database/schema.sql"

# Schritt 3: API-Dateien prüfen
echo ""
echo "3. API-Dateien prüfen..."

if [ -f "api/questionnaire-data.php" ]; then
    echo "   ✅ API-Datei gefunden: api/questionnaire-data.php"
else
    echo "   ❌ API-Datei nicht gefunden. Erstelle sie aus dem Template..."
    mkdir -p api
    # Die Datei wurde bereits durch das Implementierungs-Script erstellt
fi

# Schritt 4: Hybrid-PersistenceManager prüfen
echo ""
echo "4. Hybrid-PersistenceManager prüfen..."

if [ -f "services/hybrid-persistence-manager.js" ]; then
    echo "   ✅ Hybrid-PersistenceManager gefunden"
else
    echo "   ❌ Hybrid-PersistenceManager nicht gefunden"
    exit 1
fi

# Schritt 5: Module-Imports aktualisieren
echo ""
echo "5. Module-Imports aktualisieren..."

# Backup der originalen Dateien erstellen
if [ ! -f "app/questionnaire-app.js.backup" ]; then
    cp app/questionnaire-app.js app/questionnaire-app.js.backup
    echo "   📁 Backup erstellt: app/questionnaire-app.js.backup"
fi

if [ ! -f "components/form-handler.js.backup" ]; then
    cp components/form-handler.js components/form-handler.js.backup
    echo "   📁 Backup erstellt: components/form-handler.js.backup"
fi

# Import-Zeilen ersetzen
echo "   🔄 Aktualisiere Import in app/questionnaire-app.js..."
sed -i.tmp "s|import.*PersistenceManager.*from.*services/persistence-manager.js|import { PersistenceManager } from '../services/hybrid-persistence-manager.js';|g" app/questionnaire-app.js

echo "   🔄 Aktualisiere Import in components/form-handler.js..."
sed -i.tmp "s|import.*PersistenceManager.*from.*services/persistence-manager.js|import { PersistenceManager } from '../services/hybrid-persistence-manager.js';|g" components/form-handler.js

# Temporäre Dateien bereinigen
rm -f app/questionnaire-app.js.tmp
rm -f components/form-handler.js.tmp

# Schritt 6: Test-Konfiguration erstellen
echo ""
echo "6. Test-Konfiguration erstellen..."

if [ ! -d "examples" ]; then
    mkdir examples
fi

echo "   📝 Hybrid-Konfiguration erstellt: examples/autonomie-hybrid-config.json"
echo "   📝 Implementation-Guide erstellt: docs/hybrid-persistence-implementation.md"

# Schritt 7: Validierung
echo ""
echo "7. Validierung..."

# JavaScript-Syntax prüfen (falls node verfügbar)
if command -v node &> /dev/null; then
    echo "   🔍 Prüfe JavaScript-Syntax..."
    
    if node -c app/questionnaire-app.js 2>/dev/null; then
        echo "   ✅ app/questionnaire-app.js syntax OK"
    else
        echo "   ❌ app/questionnaire-app.js syntax Error"
    fi
    
    if node -c components/form-handler.js 2>/dev/null; then
        echo "   ✅ components/form-handler.js syntax OK"
    else
        echo "   ❌ components/form-handler.js syntax Error"
    fi
    
    if node -c services/hybrid-persistence-manager.js 2>/dev/null; then
        echo "   ✅ services/hybrid-persistence-manager.js syntax OK"
    else
        echo "   ❌ services/hybrid-persistence-manager.js syntax Error"
    fi
else
    echo "   ⚠️  Node.js nicht verfügbar, Syntax-Prüfung übersprungen"
fi

echo ""
echo "✅ Migration abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "1. Datenbank-Setup mit: mysql -u root -p < database/schema.sql"
echo "2. API-Konfiguration in api/questionnaire-data.php anpassen"
echo "3. Web-Server neu starten"
echo "4. Browser-Test mit Autonomie-Fragebogen"
echo ""
echo "📖 Vollständige Anleitung: docs/hybrid-persistence-implementation.md"
echo "🔧 Test-Konfiguration: examples/autonomie-hybrid-config.json"