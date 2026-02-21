# Create GitHub Issue (Gold Standard)

Erstellt ein GitHub Issue im Gold Standard Format.

## Usage
```
/issue                     # Interaktive Erstellung
/issue "Titel"             # Issue mit Titel
/issue feature "Titel"     # Feature-Issue
/issue bug "Titel"         # Bug-Issue
/issue research "Thema"    # Research + Issue-Erstellung
```

## Was dieser Command macht

1. **Duplikat-Prüfung** - IMMER zuerst bestehende Issues checken
2. **Typ bestimmen** - Feature, Bug, Wartung, Security, Docs
3. **Kontext sammeln** - Codebase, Docs, verwandte Issues analysieren
4. **Gold Standard anwenden** - Template: `.claude/prompts/issue-gold-standard-template.md`
5. **Labels zuweisen** - typ:, prio:, bereich:, domain:, modul:
6. **Issue erstellen** - Nach User-Bestätigung
7. **Oder anpassen** - Bestehendes Issue erweitern falls sinnvoll

---

## Gold Standard Referenz

**Template-Datei:** `.claude/prompts/issue-gold-standard-template.md`

### Pflicht-Sektionen nach Typ

| Sektion | Feature | Bug | Wartung |
|---------|---------|-----|---------|
| Zusammenfassung + Leitsatz | PFLICHT | PFLICHT | PFLICHT |
| Motivation (4-6 Punkte) | PFLICHT | - | - |
| Abgrenzung zu Issues | PFLICHT | - | - |
| Architektur-Kontext | Falls relevant | - | - |
| Spezifikations-Bloecke | PFLICHT | - | PFLICHT |
| Reproduktionsschritte | - | PFLICHT | - |
| Erwartetes vs. Aktuelles | - | PFLICHT | - |
| DB-Schema | Falls relevant | - | Falls relevant |
| API-Endpoints | Falls relevant | - | Falls relevant |
| UI-Komponenten | Falls relevant | - | Falls relevant |
| Akzeptanzkriterien | PFLICHT | PFLICHT | PFLICHT |
| Abhängigkeiten | PFLICHT | Falls relevant | Falls relevant |
| Empfohlene Reihenfolge | Bei Feature-Serien | - | - |

---

## Workflow

### 1. Duplikat-Prüfung (PFLICHT - IMMER ZUERST!)

**Mehrere Suchmethoden anwenden:**

```bash
# 1. Direkte Titelsuche
gh issue list --search "<exakter titel>" --limit 20 --json number,title,state,labels

# 2. Keyword-Suche (mehrere Varianten!)
gh issue list --search "<keyword1>" --limit 30 --json number,title,state
gh issue list --search "<keyword2>" --limit 30 --json number,title,state

# 3. Label-basierte Suche
gh issue list --label "modul:<modul>" --state open --json number,title,body

# 4. Auch geschlossene Issues prüfen!
gh issue list --state closed --search "<suchbegriff>" --limit 20 --json number,title
```

**Entscheidung bei Fund:**

| Situation | Aktion |
|-----------|--------|
| Exaktes Duplikat gefunden | -> User informieren, KEIN neues Issue |
| Ähnliches Issue (erweitert Scope) | -> Bestehendes Issue erweitern vorschlagen |
| Verwandtes Issue (andere Facette) | -> Neues Issue mit Abgrenzung erstellen |
| Geschlossenes Issue (nicht geloest) | -> Reopenen oder neues Issue mit Referenz |

**Output bei Fund:**

```markdown
## Aehnliche Issues gefunden

| # | Titel | Status | Aehnlichkeit |
|---|-------|--------|--------------|
| #XXX | [Titel] | open | 90% - Vermutlich Duplikat |
| #XXX | [Titel] | closed | 60% - Verwandt |

### Empfehlung
- [ ] Issue #XXX erweitern (empfohlen)
- [ ] Neues Issue mit Abgrenzung erstellen
- [ ] Trotzdem neues Issue erstellen

Was moechtest du tun?
```

### 2. Kontext sammeln

**Für Features:**
- Welche Module betroffen? (docs/technik/architecture.md)
- Welche verwandten Issues existieren?
- Welche Patterns im Projekt? (docs/entwicklung/engineering-rules.md)

**Für Bugs:**
- Wo tritt es auf?
- Was ist das erwartete Verhalten?
- Reproduktionsschritte sammeln

### 3. Issue-Body generieren

Template aus `.claude/prompts/issue-gold-standard-template.md` verwenden.

**Struktur-Beispiel Feature-Issue:**

```markdown
## Zusammenfassung

[2-3 Saetze die das Feature beschreiben]

Leitsatz: "[Einpraegamer Satz der das Kernprinzip zusammenfasst]"

## Motivation

- **[Keyword 1]:** [Erklaerung warum das wichtig ist]
- **[Keyword 2]:** [Erklaerung]
- **[Keyword 3]:** [Erklaerung]
- **[Keyword 4]:** [Erklaerung]

## Abgrenzung zu bestehenden Issues

| Issue | Fokus | Abgrenzung |
|-------|-------|------------|
| #XXX | [Was macht das Issue] | [Warum ist DIESES Issue anders] |

**Dieses Issue:** [Kurze Beschreibung des Fokus]

## Zusammenspiel der Architektur

(ASCII-Diagramm zeigt wo dieses Feature in der Architektur sitzt)

---

## 1. [Hauptkonzept]

### A. [Unterkonzept]

| Aspekt | Beschreibung |
|--------|--------------|
| Ausloeser | [Was triggert das] |
| Aktion | [Was passiert] |
| Wirkung | [Was ist das Ergebnis] |

---

## Akzeptanzkriterien

- [ ] [Konkretes, testbares Kriterium]
- [ ] [Konkretes, testbares Kriterium]
- [ ] [Konkretes, testbares Kriterium]

---

## Abhaengigkeiten

### Baut auf
- #XXX [Feature-Name] ([Beschreibung])

### Ergaenzt
- #XXX [Feature-Name] ([Beschreibung])
```

### 4. Labels bestimmen

| Kategorie | Optionen | Pflicht |
|-----------|----------|---------|
| **typ:** | feature, bug, wartung, security, docs, performance | JA |
| **prio:** | critical, high, medium, low | JA |
| **bereich:** | frontend, backend, datenbank, infra, ux | JA |
| **domain:** | theweekend, thedancefloor, thebackstage, shared | JA |
| **model:** | opus, sonnet | JA |
| **status:** | blocker, triage, blocked, ready | Nein |
| **modul:** | auth, events, bookings, social, messages, checkins, reviews, etc. | Nein |

**Model-Label Entscheidung:**

```
model:opus (lila) - Komplexe Tasks:
- Multi-System (Backend + Frontend + DB)
- Neue DB-Schemas, komplexe Migrationen
- Security/Auth Features
- Real-time (WebSocket, SSE)
- Algorithmen (Recommendations, Ranking)
- Performance/Infra (Caching, CDN)
- API-Architektur
- Epics
- Komplexe Integrationen (Payment, OAuth)

model:sonnet (cyan) - Einfachere Tasks:
- Einzelne UI-Komponenten
- Bug-Fixes
- Styling/UX
- Loading States, Skeletons
- Dokumentation
- Refactoring
- Kleine API-Endpoints (CRUD)
```

**Domain-Zuordnung:**

| Domain | Beschreibung |
|--------|--------------|
| `theweekend` | Event-Discovery, Suche, Kalender, Event-Details |
| `thedancefloor` | Social Feed, Messages, Community |
| `thebackstage` | DJ/Club/Organizer Profiles, Dashboards |
| `shared` | Auth, Notifications, Profiles (Member), Media, Core |

### 5. Milestone zuweisen

| Milestone | Kriterien |
|-----------|-----------|
| MVP | Security, Launch-kritisch, Deployment-Blocker |
| Beta | Stabilisierung, Performance, UX-Verbesserungen |
| Launch | Feature-Complete, Polish |
| Future | Nice-to-have, Low-Priority |

### 6. User-Bestätigung einholen

```markdown
## Issue-Vorschau

**Titel:** [Titel]
**Labels:** typ:feature, prio:high, bereich:backend, domain:theweekend, model:opus
**Milestone:** MVP

### Body:
[Generierter Issue-Body]

---

Soll ich dieses Issue erstellen?
```

### 7. Issue erstellen

```bash
gh issue create \
  --title "Titel ohne Emojis" \
  --label "typ:feature,prio:high,bereich:backend,domain:theweekend,model:opus,modul:events" \
  --milestone "MVP" \
  --body "$(cat <<'EOF'
[Issue-Body]
EOF
)"
```

### 8. Zum Project hinzufügen

```bash
# Frontend-Issue -> Project 4
gh project item-add 4 --owner @me --url "https://github.com/xstaudi/The-Weekend/issues/XXX"

# Backend-Issue -> Project 5
gh project item-add 5 --owner @me --url "https://github.com/xstaudi/The-Weekend/issues/XXX"

# Infra-Issue -> Project 6
gh project item-add 6 --owner @me --url "https://github.com/xstaudi/The-Weekend/issues/XXX"
```

---

## Bestehendes Issue erweitern (Alternative zu neu)

Falls Duplikat-Check ein erweiterbares Issue findet:

```bash
# 1. Bestehendes Issue lesen
gh issue view XXX --json body

# 2. Erweiterten Body erstellen (bestehenden Inhalt BEWAHREN!)

# 3. Issue updaten
gh issue edit XXX --body "$(cat <<'EOF'
[Erweiterter Body]
EOF
)"

# 4. Kommentar hinzufügen
gh issue comment XXX --body "Issue erweitert: [Beschreibung der Erweiterung]"
```

---

## Regeln (NICHT VERHANDELBAR)

1. **Duplikat-Check zuerst** - IMMER mehrere Suchmethoden
2. **Keine Schätzungen** - Aufwand/Tage NIEMALS angeben
3. **Keine Umlaute** - ae, oe, ue verwenden (ASCII-Kompatibilitaet)
4. **Keine Emojis im Titel** - Nur im Body erlaubt
5. **User-Bestätigung** - NIEMALS automatisch erstellen
6. **Labels Pflicht** - typ: + prio: + bereich: + domain: + model: mindestens
7. **Deutsche Sprache** - Ausser bei technischen Begriffen
8. **Bei Duplikat** - Erweitern statt neu erstellen vorziehen
9. **model-Label PFLICHT** - opus für komplexe, sonnet für einfache Tasks

---

## Checkliste vor Erstellen

- [ ] Duplikat-Check mit mehreren Suchmethoden durchgeführt
- [ ] Zusammenfassung ist praegnant (2-3 Saetze)
- [ ] Leitsatz ist einpraegsam
- [ ] Motivation hat 4-6 Punkte (bei Features)
- [ ] Abgrenzung zu verwandten Issues ist klar
- [ ] Architektur-Kontext zeigt wo es hingehört
- [ ] Spezifikation ist vollständig
- [ ] DB-Schema ist korrekt (falls relevant)
- [ ] API-Endpoints sind definiert (falls relevant)
- [ ] Akzeptanzkriterien sind testbar
- [ ] Abhängigkeiten sind verlinkt
- [ ] Keine Umlaute (ae, oe, ue verwenden)
- [ ] Keine Schätzungen/Aufwand angegeben
- [ ] Labels vollständig (typ + prio + bereich + domain + model)
- [ ] **model-Label gesetzt** (model:opus oder model:sonnet)

---

## Output

Nach erfolgreicher Erstellung:

```markdown
Issue #XXX erstellt: [Titel]
URL: https://github.com/xstaudi/The-Weekend/issues/XXX
Labels: typ:feature, prio:high, bereich:backend, domain:theweekend, model:opus
Milestone: MVP
Project: Backend (#5)
```

Nach Erweiterung eines bestehenden Issues:

```markdown
Issue #XXX erweitert: [Titel]
URL: https://github.com/xstaudi/The-Weekend/issues/XXX
Erweiterung: [Was wurde hinzugefügt]
```
