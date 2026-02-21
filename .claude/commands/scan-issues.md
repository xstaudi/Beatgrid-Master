# GitHub Issues Scanner

Analysiert alle offenen Issues auf Labels, Duplikate und Priorisierung.

**Output:** GitHub Issues Scan Report + Update `docs/planung/arbeitsplan.md`

**Default:** Nur Metadaten (kein Body) - spart ~90% Tokens | Issues mit `scanned` Label werden übersprungen

**Side Effect:** `scanned` Label wird nach Bearbeitung gesetzt (nicht beim reinen Lesen)

## Quickstart

1. `/scan-issues --quick` → Überblick
2. `/scan-issues` → Plan + Findings
3. Fixe anwenden (Labels/Titel/Milestone)
4. Issue mit `scanned` markieren

## Usage

```
/scan-issues                    # Vollständiger Scan + Arbeitsplan
/scan-issues --milestone MVP    # Nur bestimmter Milestone
/scan-issues --label typ:bug    # Nur bestimmtes Label
/scan-issues --stale            # Nur alte Issues (>30 Tage)
/scan-issues --quick            # Nur Statistiken, kein Arbeitsplan
/scan-issues --all              # Auch bereits gescannte Issues einbeziehen
/scan-issues --reset            # `scanned` Label von allen Issues entfernen
```

## Parameter-Logik

| Flag | Effekt | Default |
|------|--------|---------|
| `--all` | Inkludiert auch Issues mit `scanned` Label | aus |
| `--quick` | Keine Arbeitsplan-Updates, nur Statistiken | aus |
| `--milestone` | Filter auf bestimmten Milestone | alle |
| `--label` | Filter auf bestimmtes Label | alle |
| `--stale` | Nur Issues >30 Tage ohne Update | alle |

## Danger Zone

### `--reset`

**Entfernt `scanned` Label von allen Issues** – fuehrt zu vollem Re-Scan beim nächsten `/scan-issues`.

**Warnung:** Destruktiv für den Workflow. Nur verwenden wenn:
- Alle Issues neu gescannt werden sollen
- `scanned` Labels korrupt/inconsistent sind
- Vor Release zur Vollständigkeitsprüfung

```bash
/scan-issues --reset  # Entfernt alle `scanned` Labels
```

## Workflow-Übersicht

**Phase 1-3:** Laeuft immer (Issues laden, Label-Analyse, Titel-Qualität)

**Phase 4-6:** Optional (Duplikat-Erkennung, Stale-Issues, Statistiken)

**Phase 7-8:** Nur wenn `--quick` nicht aktiv (Arbeitsplan-Update, Report)

## Workflow

### Phase 1: Issues laden

**Hinweis:** Kein `body` laden - spart Tokens und verhindert Token-Limit-Fehler!

```bash
# Standard: Alle offenen Issues OHNE `scanned` Label
gh issue list --state open --limit 500 --json number,title,labels,milestone,createdAt,updatedAt | \
  jq '[.[] | select(.labels | map(.name) | index("scanned") | not)]'

# Mit --all Flag: Auch bereits gescannte Issues einbeziehen
gh issue list --state open --limit 500 --json number,title,labels,milestone,createdAt,updatedAt

# Nach Milestone filtern (falls --milestone)
gh issue list --milestone "MVP" --state open --json number,title,labels,milestone,createdAt,updatedAt | \
  jq '[.[] | select(.labels | map(.name) | index("scanned") | not)]'

# Geschlossene Issues für Duplikat-Check
gh issue list --state closed --limit 100 --json number,title
```

**Body-Qualitätsprüfung:** Verwende `/review-issue #XXX` für detaillierte Prüfung einzelner Issues.

### Phase 2: Label-Analyse

Prüfe jedes Issue auf Pflicht-Labels:

| Label-Kategorie | Pflicht | Beispiele |
|-----------------|---------|-----------|
| `typ:*` | ✅ Ja | typ:feature, typ:bug, typ:wartung |
| `prio:*` | ✅ Ja | prio:critical, prio:high, prio:medium, prio:low |
| `bereich:*` | ✅ Ja | bereich:frontend, bereich:backend |
| `domain:*` | ✅ Ja | domain:theweekend, domain:shared |
| `modul:*` | Optional | modul:auth, modul:events |
| `status:*` | Optional | status:blocked, status:ready |

**Ausgabe:**
```markdown
## Label-Probleme

| # | Titel | Fehlende Labels |
|---|-------|-----------------|
| #123 | Feature XYZ | domain:*, prio:* |
| #456 | Bug ABC | typ:*, bereich:* |
```

### Phase 3: Titel-Qualitäts-Check

Prüfe Issue-Titel (ohne Body zu laden):

**Titel-Anforderungen:**

**Must:**
- [ ] Keine Emojis im Titel
- [ ] Keine Praefixe wie [Backend], CRITICAL:, etc.
- [ ] Klare, praegnante Beschreibung

**Should:**
- [ ] Keine Umlaute im Titel (ae/oe/ue statt ä/ö/ü)

**Body-Qualität:** Verwende `/review-issue #XXX` für detaillierte Prüfung einzelner Issues.

**Gesamt-Score basiert auf:**
- Label-Vollständigkeit (typ, prio, bereich, domain)
- Titel-Qualität
- Milestone-Zuweisung

### Phase 4: Duplikat-Erkennung

Identifiziere potentielle Duplikate (heuristisch - immer manuell prüfen):

```markdown
## Potentielle Duplikate

| Issue A | Issue B | Heuristik-Score | Empfehlung |
|---------|---------|-----------------|------------|
| #123 "Auth Token" | #456 "JWT Token" | 85% | Zusammenfuehren? |
| #789 "Login Bug" | #101 "Auth Fehler" | 70% | Prüfen |
```

### Phase 5: Stale-Issues

Issues ohne Aktivitaet >30 Tage:

```markdown
## Stale Issues

| # | Titel | Letztes Update | Alter | Empfehlung |
|---|-------|----------------|-------|------------|
| #123 | Feature X | 2025-11-01 | 45 Tage | Review oder schliessen |
| #456 | Bug Y | 2025-10-15 | 60 Tage | Noch relevant? |
```

### Phase 6: Statistiken

```markdown
## Issue-Statistiken

### Nach Typ
| Typ | Anzahl | % |
|-----|--------|---|
| typ:feature | 45 | 60% |
| typ:bug | 20 | 27% |
| typ:wartung | 10 | 13% |

### Nach Prioritaet
| Prioritaet | Anzahl | Aeltestes |
|------------|--------|-----------|
| prio:critical | 2 | #123 (5 Tage) |
| prio:high | 15 | #456 (30 Tage) |
| prio:medium | 40 | #789 (60 Tage) |
| prio:low | 18 | #101 (90 Tage) |

### Nach Domain
| Domain | Anzahl |
|--------|--------|
| domain:theweekend | 30 |
| domain:thebackstage | 25 |
| domain:thedancefloor | 15 |
| domain:shared | 5 |

### Nach Milestone
| Milestone | Offen | Geschlossen | Progress |
|-----------|-------|-------------|----------|
| MVP | 20 | 45 | 69% |
| Beta | 35 | 10 | 22% |
| Launch | 15 | 0 | 0% |
```

### Phase 7: Arbeitsplan aktualisieren

**Workflow:**
1. Tool schlaegt Änderungen vor (neue Issues, geschlossene Issues, Progress)
2. User bestätigt oder passt Priorisierung an
3. Arbeitsplan wird aktualisiert

**1. Aktuellen Arbeitsplan laden:**
```bash
cat docs/planung/arbeitsplan.md
```

**2. Abgleich durchfuehren:**

| Prüfung | Aktion |
|----------|--------|
| Issues im Plan aber geschlossen | Abhaken oder entfernen |
| Neue Critical/High Issues | In aktuelle Phase einfügen |
| Blockierte Issues | Als blocked markieren |
| Erledigte Phasen | Progress aktualisieren |

**3. Arbeitsplan-Struktur aktualisieren:**

```markdown
## Aktuelle Phase: [Name]

### In Arbeit
- [ ] #XXX - Titel (prio:high)
- [ ] #YYY - Titel (prio:high)

### Naechste Issues
- [ ] #ZZZ - Titel (prio:medium)

### Blockiert
- [ ] #AAA - Titel (blocked by #BBB)

### Kuerzlich erledigt
- [x] #CCC - Titel (erledigt YYYY-MM-DD)
```

**4. Phase-Progress berechnen:**
```
Phase X: [=====>     ] 45% (9/20 Issues)
```

**5. Empfohlene Reihenfolge aktualisieren:**
Basierend auf:
- Abhängigkeiten zwischen Issues
- Priorität (Critical > High > Medium > Low)
- Alter des Issues
- Domain-Gruppierung (zusammengehoerige Issues)

### Phase 8: Report und Empfehlungen

```markdown
## Empfehlungen

### Sofort-Massnahmen
1. **X Issues ohne Pflicht-Labels** - Labels ergaenzen
2. **Y Critical Issues >7 Tage alt** - Bearbeitung starten
3. **Z potentielle Duplikate** - Zusammenfuehren/Schliessen

### Arbeitsplan-Änderungen
1. **X neue Issues** in aktuelle Phase aufgenommen
2. **Y Issues** als erledigt markiert
3. **Z Issues** als blockiert markiert
4. **Phase-Progress:** A% -> B%

### Qualitaetsverbesserung
1. **X Issues ohne domain-Label** - Domain zuweisen
2. **Y Issues ohne Milestone** - Milestone zuweisen
3. Für Body-Qualitaet: `/review-issue #XXX` oder `/improve-issues-batch`

### Aufraeum-Kandidaten
1. **X Stale Issues** - Review auf Relevanz
2. **Y Low-Priority Issues >90 Tage** - Schliessen oder reaktivieren?
```

## Output-Format

```markdown
# GitHub Issues Scan Report

**Datum:** YYYY-MM-DD
**Gescannt:** X offene Issues
**Gesamt-Score:** ⭐⭐ (75% Qualitaet)

## Quick Stats
- 🔴 Critical: X | 🟠 High: X | 🟡 Medium: X | 🟢 Low: X
- ❌ Label-Probleme: X Issues
- 📝 Ohne Milestone: X Issues
- 🔄 Potentielle Duplikate: X Paare
- 💤 Stale (>30d): X Issues

## Details
[Label-Probleme, Qualitaet, Duplikate, Stale]

## Statistiken
[Verteilungen nach Typ, Prio, Domain, Milestone]

## Arbeitsplan-Update
[Änderungen am arbeitsplan.md]

## Empfehlungen
[Priorisierte Massnahmen]
```

## Schnell-Aktionen

| Problem | Command |
|---------|---------|
| Fehlende Labels | `gh issue edit #XXX --add-label "label"` |
| Mangelhafte Qualität | `/review-issue #XXX` |
| Batch-Verbesserung | `/improve-issues-batch --milestone MVP` |
| Issue schliessen | `gh issue close #XXX --comment "Grund"` |
| Duplikat markieren | `gh issue close #XXX --comment "Duplikat von #YYY"` |
| Arbeitsplan editieren | Edit docs/planung/arbeitsplan.md |

## Definition of Done (DoD) - Issue ist gescannt

Ein Issue gilt als "gescannt", wenn alle folgenden Bedingungen erfüllt sind:

- [x] **Pflicht-Labels vorhanden:** `typ:*`, `prio:*`, `bereich:*`, `domain:*`
- [x] **Titel-Regeln erfüllt:** Keine Emojis, keine Praefixe, klar & praegnant
- [x] **Milestone gesetzt** (oder bewusst "kein Milestone" begruendet)
- [x] **Duplikat geprüft** (falls Treffer: Entscheidung getroffen)

**Dann:** `scanned` Label setzen

## Scanned-Label Workflow

```bash
# Nach Label-Fix oder anderen Änderungen
gh issue edit #XXX --add-label "scanned"

# Beispiel: Labels fixen UND als gescannt markieren
gh issue edit #123 --add-label "typ:feature,prio:high,bereich:frontend,domain:theweekend,scanned"
```

**Wann `scanned` setzen:**
- Nach dem Hinzufügen fehlender Pflicht-Labels
- Nach Titel-Korrektur (Umlaute, Emojis entfernt)
- Nach Body-Verbesserung via `/review-issue`
- Nach Duplikat-Entscheidung (ob zusammengefuehrt oder behalten)
- Nach Zuweisung zu Milestone
- Nach jeder anderen Qualitätsverbesserung

**Wann NICHT setzen:**
- Issue hat noch offene Qualitätsprobleme
- Issue braucht weitere Review
- Issue wurde nur angesehen aber nicht verbessert

## Arbeitsplan-Format

Der arbeitsplan.md sollte folgende Struktur haben:

```markdown
# Arbeitsplan

## Status-Übersicht
| Phase | Progress | Issues |
|-------|----------|--------|
| MVP | 69% | 9/13 |
| Beta | 22% | 5/23 |

## Aktuelle Phase: MVP

### Diese Woche
- [ ] #XXX - Critical Bug (prio:critical)
- [ ] #YYY - Feature (prio:high)

### Backlog (sortiert nach Prioritaet)
- [ ] #ZZZ - Feature (prio:medium)
- [ ] #AAA - Wartung (prio:low)

### Blockiert
- [ ] #BBB - blocked by #CCC

### Erledigt (letzte 7 Tage)
- [x] #DDD - erledigt 2026-01-10
- [x] #EEE - erledigt 2026-01-09

## Naechste Phase: Beta
[...]
```

## Hinweise

- **Arbeitsplan-Update:** Tool schlaegt Änderungen vor, User bestätigt
- **Duplikat-Erkennung:** Heuristisch - immer manuell prüfen
- **CHANGELOG.md:** Aktualisieren wenn Arbeitsplan geändert wird
- **Batch-Aktionen:** Nur nach expliziter Bestätigung
