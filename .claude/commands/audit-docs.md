# Dokumentations-Audit

Analysiert alle Projekt-Dokumentationen auf Aktualitaet und Vollständigkeit.

**Prozess in Kuerze:** Inventur aller Docs → Code-Stand ermitteln → Abgleich durchfuehren → Diskrepanzen identifizieren → Anpassungsplan erstellen → Optional: Korrekturen vorschlagen.

## Quickstart

**Wann verwenden?**
- Vor Releases oder Major Features
- Nach umfangreichen Code-Änderungen
- Bei Verdacht auf veraltete Dokumentation
- Regelmassig (z.B. monatlich) zur Wartung

**Wann nicht verwenden?**
- Bei einzelnen kleinen Fixes (dann manuell aktualisieren)
- Nur für eine spezifische Doc (dann direkt bearbeiten)

**Schneller Einstieg:**
1. `/audit-docs` ausführen
2. Report lesen (ca. 5-10 Min)
3. Bei Diskrepanzen: `/audit-docs --fix` für Vorschläge
4. Kritische Luecken zuerst schliessen

**Hinweis:** Monetarisierung-Docs (`docs/monetarisierung/`) werden NICHT auf Code-Synchronitaet geprüft (Business-Konzepte).

## Usage
```
/audit-docs
/audit-docs --fix    # Direkt Korrekturen vorschlagen
```

## Workflow

### Phase 1: Docs inventarisieren

Lade und analysiere alle Dokumentationsdateien:

```
docs/
├── CHANGELOG.md
├── README.md
├── VISION.md
├── technik/
│   ├── architecture.md           # Hub → verweist auf Subdocs
│   ├── api-reference.md          # Hub → verweist auf Subdocs
│   ├── database-schema.md        # Hub → verweist auf Subdocs
│   ├── security.md
│   ├── api-reference/
│   │   ├── core-apis.md
│   │   ├── events.md
│   │   ├── bookings-checkins.md
│   │   ├── social-messaging.md
│   │   ├── content-moderation.md
│   │   ├── management.md
│   │   └── system.md
│   ├── architecture/
│   │   ├── backend.md
│   │   ├── frontend.md
│   │   ├── roadmaps.md
│   │   └── design-system.md
│   └── database-schema/
│       ├── users-auth.md
│       ├── events-bookings.md
│       ├── social-messaging.md
│       └── system-tables.md
├── entwicklung/
│   ├── development.md
│   ├── engineering-rules.md
│   ├── styling-rules.md
│   ├── context-loading.md
│   ├── contributing.md
│   └── vibecoding-workflow.md
├── produkt/
│   ├── app-layout.md             # Hub → verweist auf Subdocs
│   ├── app-layout/
│   │   ├── routes.md
│   │   ├── api-modules.md
│   │   ├── components.md
│   │   └── navigation.md
│   ├── workflows.md
│   ├── product.md
│   └── feature-overview.md
├── planung/
│   ├── arbeitsplan.md
│   └── sprint-4-plan.md
└── monetarisierung/              # Business-Konzepte (16 Dateien)
    └── [1-17].md
```

**Wichtige Hinweise:**
- **Hub-Dokumente** (architecture.md, app-layout.md) verweisen auf Subdokumente. Bei Prüfungen müssen auch die Subdokumente beruecksichtigt werden.
- **Monetarisierung-Docs** (`docs/monetarisierung/`) werden NICHT auf Code-Synchronitaet geprüft - das sind Business-Konzepte, keine technische Dokumentation.

### Phase 2: Code-Stand ermitteln

Prüfe den aktuellen Stand des Projekts:

**Backend-Module:**
```bash
ls backend/src/modules/
```

**Frontend-Features:**
```bash
ls frontend/src/features/
```

**API-Routen:**
```bash
grep -r "router\." backend/src/modules/*/routes.ts | head -50
```

**DB-Schema:**
```bash
ls backend/src/db/schema/
```

**Letzte Commits:**
```bash
git log --oneline -20
```

### Phase 3: Abgleich durchfuehren

Für jede Doc prüfen:

| Prüfung | Methode |
|----------|---------|
| **api-reference.md** + **api-reference/*.md** | Vergleiche dokumentierte Endpoints mit routes.ts Dateien |
| **database-schema.md** | Vergleiche dokumentierte Tabellen mit schema/*.ts |
| **app-layout.md** + **app-layout/*.md** | Vergleiche dokumentierte Routes mit frontend Router |
| **architecture.md** + **architecture/*.md** | Prüfe ob Module-Liste aktuell ist |
| **workflows.md** | Prüfe ob User Flows noch stimmen |
| **security.md** | Prüfe ob Security-Features dokumentiert sind |
| **context-loading.md** | Prüfe ob Doc-Referenzen aktuell sind |

### Phase 4: Diskrepanzen identifizieren

Erstelle eine Liste aller Abweichungen:

```markdown
## Diskrepanzen gefunden

### api-reference.md
| Status | Endpoint | Problem |
|--------|----------|---------|
| ❌ Fehlt | POST /api/xyz | Nicht dokumentiert |
| ⚠️ Veraltet | GET /api/old | Endpoint existiert nicht mehr |
| ✅ OK | GET /api/events | Aktuell |

### database-schema.md
| Status | Tabelle/Spalte | Problem |
|--------|----------------|---------|
| ❌ Fehlt | new_table | Nicht dokumentiert |
| ⚠️ Veraltet | old_column | Spalte existiert nicht mehr |

### app-layout.md
| Status | Route | Problem |
|--------|-------|---------|
| ❌ Fehlt | /new-page | Nicht dokumentiert |

### architecture.md
| Status | Modul | Problem |
|--------|-------|---------|
| ❌ Fehlt | new-module | Nicht in Modul-Liste |
```

### Phase 5: Anpassungsplan erstellen

Falls Diskrepanzen gefunden:

```markdown
## Anpassungsplan

### Prioritaet 1: Kritische Luecken
1. **api-reference.md** - X fehlende Endpoints dokumentieren
2. **database-schema.md** - X neue Tabellen/Spalten hinzufügen

### Prioritaet 2: Veraltete Infos
1. **app-layout.md** - X entfernte Routes löschen
2. **architecture.md** - Module-Liste aktualisieren

### Prioritaet 3: Optimierungen
1. **workflows.md** - User Flows überprüfen
2. **CHANGELOG.md** - Fehlende Eintraege ergaenzen

### Geschaetzter Aufwand
- Kritisch: X Dateien, ~Y Änderungen
- Veraltet: X Dateien, ~Y Änderungen
- Optimierungen: X Dateien
```

### Phase 6: Optionale Korrektur (--fix)

Falls `--fix` Flag gesetzt:
1. User um Bestätigung fragen
2. Änderungen schrittweise durchfuehren
3. CHANGELOG.md aktualisieren
4. Commit vorbereiten

## Output-Format

```markdown
# Dokumentations-Audit Report

**Datum:** YYYY-MM-DD
**Geprueft:** X Dateien (Y Hub-Docs, Z Subdocs)
**Status:** ✅ Aktuell | ⚠️ Teilweise veraltet | ❌ Überarbeitung noetig

## Zusammenfassung

| Kategorie | Dateien | Status |
|-----------|---------|--------|
| API-Docs | 1 | ✅/⚠️/❌ |
| DB-Docs | 1 | ✅/⚠️/❌ |
| Architektur | 5 (1 Hub + 4 Subdocs) | ✅/⚠️/❌ |
| Produkt | 7 (1 Hub + 4 Subdocs + 2) | ✅/⚠️/❌ |
| Entwicklung | 6 | ✅/⚠️/❌ |
| Security | 1 | ✅/⚠️/❌ |
| Planung | 2 | ✅/⚠️/❌ |

## Details
[Diskrepanzen pro Datei]

## Anpassungsplan
[Falls Diskrepanzen gefunden]

## Naechste Schritte
- [ ] Kritische Luecken schliessen
- [ ] Veraltete Infos entfernen
- [ ] Hub-Docs mit Subdocs synchronisieren
- [ ] CHANGELOG aktualisieren
```

## Wichtige Hinweise

1. **Keine automatischen Änderungen** ohne User-Bestätigung
2. **Fokus auf strukturelle Abweichungen**, nicht auf Inhalt/Formulierung
3. **CHANGELOG.md NUR bei Major Features** - nicht bei Docs-Updates oder kleinen Fixes
4. **Issue erstellen** für größere Überarbeitungen
5. **Hub-Docs beachten**: architecture.md und app-layout.md sind Hub-Dokumente die auf Subdokumente verweisen. Bei Änderungen müssen beide synchron bleiben
6. **Git History = Detail-Log**: `git log --oneline` für alle Änderungen, CHANGELOG nur für Releases
