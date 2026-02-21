# Weekly Review

Strukturierter Wochen-Rueckblick nach GTD-Methodik (Getting Things Done).

**Output:** Weekly Review Report mit Velocity-Metriken, Blocker-Analyse und Top-5-Empfehlungen für nächste Woche.

---

## Quickstart

```
/review-week              # Review der aktuellen Woche (Mo-So)
/review-week last         # Review der letzten Woche
```

---

## Was dieser Command macht

```
┌─────────────────────────────────────┐
│ 1. GESCHLOSSENE ISSUES              │
│    - Issues dieser Woche (closed)   │
│    - Gruppiert nach Typ             │
│    - Commit-Count pro Issue         │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 2. VELOCITY-METRIKEN                │
│    - Issues geschlossen             │
│    - Commits erstellt               │
│    - Vergleich zur Vorwoche         │
│    - Trend-Indikator                │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 3. BLOCKER-ANALYSE                  │
│    - Issues mit status:blocked      │
│    - Issues in Review >24h          │
│    - Critical Issues >7d offen      │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 4. NAECHSTE WOCHE (TOP 5)           │
│    - Aus aktuellem Arbeitsplan      │
│    - Priorisiert: Phase + Effort    │
│    - Quick Wins zuerst              │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ 5. INBOX-CHECK                      │
│    - Unassigned Issues              │
│    - Draft PRs                      │
│    - Issues ohne Pflicht-Labels     │
└─────────────────────────────────────┘
```

---

## Workflow

### Phase 1: Geschlossene Issues laden

```bash
# Aktuelle Woche (KW berechnen)
# Montag der aktuellen Woche als Start-Datum
START_DATE=$(date -v-monday +%Y-%m-%d 2>/dev/null || date -d "last monday" +%Y-%m-%d)

# Issues diese Woche geschlossen
gh issue list --state closed --search "closed:>=$START_DATE" --limit 100 \
  --json number,title,labels,closedAt

# Vorwoche für Vergleich
PREV_START=$(date -v-1w -v-monday +%Y-%m-%d 2>/dev/null || date -d "2 weeks ago monday" +%Y-%m-%d)
PREV_END=$(date -v-monday -v-1d +%Y-%m-%d 2>/dev/null || date -d "last sunday" +%Y-%m-%d)
gh issue list --state closed --search "closed:$PREV_START..$PREV_END" --limit 100 \
  --json number,title
```

**Gruppierung nach Typ:**

| Typ | Label |
|-----|-------|
| Features | typ:feature |
| Bugfixes | typ:bug |
| Wartung | typ:wartung |
| Docs | typ:docs |

### Phase 2: Velocity-Metriken

```bash
# Commits diese Woche
git log --since="$START_DATE" --oneline | wc -l

# Commits letzte Woche
git log --since="$PREV_START" --until="$PREV_END" --oneline | wc -l
```

**Trend-Berechnung:**

```
Trend = (Diese Woche - Letzte Woche) / Letzte Woche * 100

Anzeige:
- +10% oder mehr: ⬆️
- -10% bis +10%:  ➡️
- -10% oder weniger: ⬇️
```

### Phase 3: Blocker-Analyse

```bash
# Blockierte Issues
gh issue list --state open --label "status:blocked" --json number,title,labels

# Issues mit status:review (prüfen ob >24h)
gh issue list --state open --label "status:review" --json number,title,updatedAt

# Critical Issues >7 Tage offen
gh issue list --state open --label "prio:critical" --json number,title,createdAt | \
  jq '[.[] | select((now - (.createdAt | fromdateiso8601)) / 86400 > 7)]'
```

### Phase 4: Top 5 für nächste Woche

```bash
# Arbeitsplan laden
cat docs/planung/arbeitsplan.md

# Offene Issues aus aktueller Phase (aus Arbeitsplan)
# Priorisiert nach: Phase-Prioritaet × 10 + (10 - Effort-Score)
```

**Effort-Scores:**

| Label | Score | Beschreibung |
|-------|-------|--------------|
| effort:xs | 9 | ~1 Stunde |
| effort:s | 7 | Halber Tag |
| effort:m | 5 | 1 Tag |
| effort:l | 2 | Mehrere Tage |
| effort:xl | 0 | Woche+ |

**Quick-Win-Priorisierung:** Issues mit hohem Effort-Score (xs, s) werden bevorzugt, um Momentum aufzubauen.

### Phase 5: Inbox-Check

```bash
# Unassigned Issues
gh issue list --state open --search "no:assignee" --json number,title --limit 10

# Issues ohne Pflicht-Labels
gh issue list --state open --json number,title,labels | \
  jq '[.[] | select(
    (.labels | map(.name) | map(select(startswith("typ:"))) | length == 0) or
    (.labels | map(.name) | map(select(startswith("prio:"))) | length == 0) or
    (.labels | map(.name) | map(select(startswith("domain:"))) | length == 0)
  )]'

# Offene PRs (Draft oder Review)
gh pr list --state open --json number,title,isDraft
```

---

## Output-Format

```markdown
# Weekly Review - KW XX/2026

**Zeitraum:** YYYY-MM-DD bis YYYY-MM-DD

---

## ✅ Erledigt (X Issues)

### Features (Y)
| # | Titel |
|---|-------|
| #415 | RefreshButton mit Visual Feedback |
| #416 | Skeleton Loading für Event-Cards |

### Bugfixes (Z)
| # | Titel |
|---|-------|
| #420 | Login-Validierung Fix |

### Wartung (W)
| # | Titel |
|---|-------|
| #425 | Dependency Updates |

---

## 📊 Velocity

| Metrik | Diese Woche | Letzte Woche | Trend |
|--------|-------------|--------------|-------|
| Issues geschlossen | 8 | 6 | +33% ⬆️ |
| Commits | 24 | 18 | +33% ⬆️ |
| Neue Issues erstellt | 3 | 5 | -40% ⬇️ |

**Burn-Rate:** -5 Issues/Woche (Backlog schrumpft) ✅

---

## ⚠️ Blocker & Risiken

### Blockierte Issues (X)
| # | Titel | Blockiert durch |
|---|-------|-----------------|
| #600 | Security Rate Limiting | Infra-Entscheidung |

### In Review >24h (Y)
| # | Titel | Wartet seit |
|---|-------|-------------|
| #610 | Auth Refactoring | 2 Tage |

### Critical >7d offen (Z)
| # | Titel | Alter |
|---|-------|-------|
| #590 | Session Timeout Bug | 9 Tage |

---

## 📋 Naechste Woche (Top 5)

**Aus Phase:** [Aktuelle Phase aus Arbeitsplan]

| Prio | # | Titel | Effort | Warum jetzt |
|------|---|-------|--------|-------------|
| 1 | #600 | Security Rate Limiting | M | Phase 1 Blocker |
| 2 | #601 | Suspicious Login Detection | S | Security Prio |
| 3 | #610 | Button Component Update | XS | Quick Win |
| 4 | #611 | Form Validation | S | User Feedback |
| 5 | #612 | Error Handling | M | UX Improvement |

---

## 📥 Inbox

### Unassigned Issues (X)
| # | Titel |
|---|-------|
| #700 | Neuer Feature Request |

### Issues ohne Pflicht-Labels (Y)
| # | Titel | Fehlend |
|---|-------|---------|
| #701 | Bug XYZ | domain:*, prio:* |

### Offene PRs (Z)
| # | Titel | Status |
|---|-------|--------|
| #50 | Feature Branch | Draft |

---

## 🎯 Action Items

1. **Blocker loesen:** #600 Infra-Entscheidung treffen
2. **Review abschliessen:** #610 (wartet 2 Tage)
3. **Critical bearbeiten:** #590 (9 Tage alt!)
4. **Labels ergaenzen:** #701 (domain, prio)
5. **Top 5 starten:** Montag mit #600 beginnen
```

---

## Kalender-Berechnung

```bash
# Montag der aktuellen Woche (macOS)
date -v-monday +%Y-%m-%d

# Montag der aktuellen Woche (Linux)
date -d "last monday" +%Y-%m-%d

# Kalenderwoche (ISO)
date +%V
```

---

## Optionen

| Option | Beschreibung |
|--------|--------------|
| (keine) | Aktuelle Woche |
| `last` | Letzte Woche |
| `--no-inbox` | Inbox-Check überspringen |
| `--json` | Output als JSON (für Metriken-Export) |

---

## Verwandte Commands

| Command | Zweck |
|---------|-------|
| `/work` | Nächstes Issue starten |
| `/scan-issues` | Vollständiger Issue-Scan |
| `/done #XXX` | Issue abschliessen |

---

## GTD-Integration

Dieser Command implementiert die "Weekly Review" Phase der GTD-Methodik:

1. **Collect** - Alle geschlossenen Issues sammeln
2. **Process** - Blocker und Risiken identifizieren
3. **Organize** - Top 5 für nächste Woche priorisieren
4. **Review** - Velocity-Trends analysieren
5. **Engage** - Action Items definieren

**Best Practice:** Freitag nachmittags durchfuehren, um die Woche abzuschliessen und Montag vorbereitet zu starten.

---

## Regeln

- **Keine Implementierung** - Nur Analyse und Empfehlungen
- **Arbeitsplan-konform** - Top 5 aus aktueller Phase
- **Quick Wins bevorzugen** - Momentum aufbauen
- **Blocker zuerst** - Kritische Items priorisieren
