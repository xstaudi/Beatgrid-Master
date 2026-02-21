# Batch Improve GitHub Issues

Systematisch mehrere GitHub Issues gegen das Gold Standard Template reviewen und verbessern.

> **⚠️ Power-Tool für erfahrene Maintainer**  
> Dieses Command ist für Batch-Refactoring von Issues gedacht. Für Einsteiger empfohlen: `/review-issue` für einzelne Issues.

---

## Quickstart

**Typischer Workflow:**
```bash
# 1. Report generieren (keine Änderungen)
/improve-issues-batch --label "typ:feature" --report-only

# 2. Kritische Issues fixen (MVP ohne domain-Label)
/improve-issues-batch --milestone "MVP" --label "typ:feature"

# 3. Batch-Verarbeitung mit Limit
/improve-issues-batch --domain "theweekend" --limit 20
```

> **WICHTIG:** Erst `--report-only` nutzen, um Scope zu verstehen!

---

## Usage
```
/improve-issues-batch [options]
```

## Options

### Filter (kombinierbar)
```
--milestone "MVP"        # Filter by milestone
--label "typ:feature"    # Filter by label
--domain "theweekend"    # Filter by domain
--limit 20               # Max issues per batch (Default: 20)
```

### Verhalten
```
--report-only            # ⚡ NUR Report generieren, keine Updates
```

### ⚠️ Danger Zone
```
--auto                   # 🚨 Auto-update OHNE Bestätigung
                         # VORSICHT: Kann viele Issues gleichzeitig ändern!
                         # Empfehlung: Erst mit --report-only testen
```

## Examples

```bash
# MVP Feature Issues verbessern
/improve-issues-batch --milestone "MVP" --label "typ:feature"

# Alle theweekend Domain Issues
/improve-issues-batch --domain "theweekend"

# Alle Booking-Module Issues
/improve-issues-batch --label "modul:bookings"

# Nur Report generieren
/improve-issues-batch --limit 50 --report-only

# Issues ohne domain-Label finden und fixen
/improve-issues-batch --label "typ:feature" --report-only
```

---

## Regeln

**Pflicht-Verhalten:**
1. **User-Bestätigung** - Vor jedem Update fragen (ausser --auto)
2. **Keine Inhaltsänderung** - Nur Struktur/Format verbessern, Inhalt bewahren
3. **Labels ergaenzen** - Fehlende Labels hinzufügen, bestehende NICHT entfernen
4. **domain-Label Priorität** - Issues ohne domain-Label zuerst fixen

**Technische Limits:**
- **Batch-Limit** - Max 20 Issues pro Durchlauf ohne Pause
- **Keine Umlaute** - ae, oe, ue verwenden
- **Keine Emojis im Titel** - Nur im Body erlaubt
- **Keine Schätzungen** - Aufwand NIEMALS hinzufügen

---

## Gold Standard Referenz

> **Hinweis:** Diese Referenz wird ab Phase 3 (Batch-Verarbeitung) relevant.  
> Für den Workflow siehe Abschnitt "Workflow" weiter unten.

**Template-Datei:** `.claude/prompts/issue-gold-standard-template.md`

### Qualitäts-Score (0-50 Punkte)

| Sektion | Punkte | Pflicht bei |
|---------|--------|-------------|
| Zusammenfassung + Leitsatz | 10 | Alle |
| Motivation | 5 | Feature |
| Abgrenzung | 5 | Feature |
| Architektur-Kontext | 5 | Feature (optional) |
| Spezifikation | 10 | Feature, Wartung |
| Technische Details | 5 | Falls relevant |
| Akzeptanzkriterien | 5 | Alle |
| Abhängigkeiten | 5 | Alle |

### Label-Pflicht

| Label | Pflicht | Optionen |
|-------|---------|----------|
| typ: | JA | feature, bug, wartung, security, docs, performance |
| prio: | JA | critical, high, medium, low |
| bereich: | JA | frontend, backend, datenbank, infra, ux |
| domain: | JA | theweekend, thedancefloor, thebackstage, shared |
| status: | Nein | blocker, triage, blocked, ready |
| modul: | Nein | auth, events, bookings, social, etc. |

---

## Workflow

> **Kern-Ablauf:** Discovery → Triage → Batch → Update

### Phase 1: Discovery

```bash
# Alle offenen Issues abrufen
gh issue list --state open --limit 500 --json number,title,labels,milestone

# Nach Label filtern
gh issue list --label "typ:feature" --state open --json number,title

# Nach Milestone filtern
gh issue list --milestone "MVP" --state open --json number,title,labels

# Nach Domain filtern
gh issue list --label "domain:theweekend" --state open --json number,title

# Issues OHNE domain-Label finden (WICHTIG!)
gh issue list --state open --json number,title,labels | jq '[.[] | select(.labels | map(.name) | any(startswith("domain:")) | not)]'
```

### Phase 2: Triage

Kategorisiere Issues nach Verbesserungsbedarf:

| Priorität | Kriterien | Aktion |
|------------|-----------|--------|
| **P1: Kritisch** | Feature-Issues ohne Struktur, MVP-Milestone, fehlendes domain-Label | Sofort verbessern |
| **P2: Hoch** | Unvollständige Spezifikation, Beta-Milestone | Bald verbessern |
| **P3: Mittel** | Fehlende Abgrenzung/Abhängigkeiten | Bei Gelegenheit |
| **P4: Niedrig** | Kleine Formatierungsfehler | Optional |
| **OK** | Entspricht Gold Standard | Überspringen |

### Phase 3: Batch-Verarbeitung

**Ablauf:**
```
Für jedes Issue in Prioritaetsreihenfolge:
1. Issue abrufen (gh issue view NUMBER --json body,title,labels)
2. Quality Review durchfuehren (oder issue-quality-reviewer Agent)
3. Label-Check (insbesondere domain:!)
4. Verbesserten Body generieren
5. Update-Vorschlag praesentieren
6. Nach User-Bestätigung: Issue updaten
```

**Wichtige Hinweise:**
- **Abbrechen:** Ctrl+C stoppt aktuelles Issue, nicht gesamten Batch
- **Pausieren:** Nach --limit Issues automatisch Pause (User-Input)
- **Zu viel:** Bei >50 Issues → in kleinere Batches aufteilen

### Phase 4: Update

```bash
# Issue updaten (HEREDOC für Multiline)
gh issue edit <NUMBER> --body "$(cat <<'EOF'
[Verbesserter Issue-Body]
EOF
)"

# Labels hinzufügen falls fehlend
gh issue edit <NUMBER> --add-label "domain:theweekend"

# Kommentar hinzufügen
gh issue comment <NUMBER> --body "Issue gegen Gold Standard verbessert"
```

---

## Batch-Strategien

> **Empfehlung:** Starte immer mit Strategie D (fehlende Labels), dann A (Milestone).  
> Strategien B, C, E für spezifische Wartungsaufgaben.

### Strategie D: Nach fehlenden Labels ⚡ **START HIER**
**Wann:** Priorität 1 - Kritische Grundpflege  
**Zweck:** Fehlende Pflicht-Labels identifizieren und fixen

```bash
# Issues ohne domain-Label (KRITISCH!)
gh issue list --state open --json number,title,labels | jq '[.[] | select(.labels | map(.name) | any(startswith("domain:")) | not)]'

# Issues ohne prio-Label
gh issue list --state open --json number,title,labels | jq '[.[] | select(.labels | map(.name) | any(startswith("prio:")) | not)]'
```

### Strategie A: Nach Milestone ⭐ **HAEUFIG**
**Wann:** Release-Vorbereitung, Priorisierung nach MVP/Beta  
**Zweck:** Issues nach Release-Phase gruppieren

```bash
# MVP Issues zuerst - hoechste Prioritaet
gh issue list --milestone "MVP" --label "typ:feature" --state open --json number,title

# Dann Beta
gh issue list --milestone "Beta" --label "typ:feature" --state open --json number,title
```

### Strategie B: Nach Domain
**Wann:** Domain-spezifische Wartung, Feature-Gruppierung  
**Zweck:** Alle Issues einer Domain zusammen bearbeiten

```bash
# Alle Issues einer Domain (zusammenhaengend)
gh issue list --label "domain:theweekend" --state open --json number,title
```

### Strategie C: Nach Modul
**Wann:** Modul-spezifische Refactoring-Wellen  
**Zweck:** Alle Issues eines Moduls (z.B. bookings) zusammen

```bash
# Alle Issues eines Moduls
gh issue list --label "modul:auth" --state open --json number,title
```

### Strategie E: Nach Qualität
**Wann:** Qualitäts-Audit, Gold Standard Compliance  
**Zweck:** Issues ohne Struktur-Elemente finden

```bash
# Issues ohne Akzeptanzkriterien finden
gh issue list --state open --json number,title,body | jq '[.[] | select(.body | contains("Akzeptanzkriterien") | not)]'

# Issues ohne Zusammenfassung
gh issue list --state open --json number,title,body | jq '[.[] | select(.body | contains("Zusammenfassung") | not)]'
```

---

## Progress-Report Format

> **Ergebnis-Format** - Wird nach Phase 1-2 generiert.  
> Entscheidungsfähig: Nächste Schritte klar definiert.

```markdown
# Issue Quality Improvement Report

## Statistik
- Gesamt analysiert: X Issues
- Gold Standard (45-50): X (X%)
- Gut (35-44): X (X%)
- Verbesserungsbedarf (25-34): X (X%)
- Kritisch (<25): X (X%)

## Label-Statistik
- Mit domain-Label: X (X%)
- OHNE domain-Label: X (KRITISCH!)
- Mit allen Pflicht-Labels: X (X%)

## Issues ohne domain-Label (SOFORT FIXEN!)
| # | Titel | Empfohlene Domain |
|---|-------|-------------------|
| #XXX | [Titel] | theweekend |
| #XXX | [Titel] | shared |

## Verbesserungen nach Kategorie
| Kategorie | Vorher | Nachher |
|-----------|--------|---------|
| Fehlende Zusammenfassung | X | 0 |
| Fehlende Akzeptanzkriterien | X | 0 |
| Fehlende Abhaengigkeiten | X | 0 |
| Fehlende Labels | X | 0 |
| Fehlendes domain-Label | X | 0 |

## Naechste Schritte
1. Issues ohne domain-Label fixen (P1)
2. P2 Issues verbessern
3. Bug-Issues standardisieren
```
