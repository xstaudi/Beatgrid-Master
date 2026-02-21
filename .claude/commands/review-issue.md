# Review GitHub Issue Quality

Analysiert ein GitHub Issue gegen das Gold Standard Template und generiert eine verbesserte Version.

**Output:** Score, Analyse, verbesserter Body

**Kein Zwangs-Update:** Immer User-Bestätigung erforderlich

**Keine inhaltliche Neuerfindung:** Nur Struktur verbessern, Inhalt bewahren

**Vertrauensanker:** Dieser Command veraendert keine Inhalte ohne explizite Bestätigung und fuegt keine Schätzungen hinzu.

## Default Workflow

```
/work #123
  -> Plan + Umsetzung

/review-issue #123
  -> Issue Quality Review durchfuehren

[Bei niedrigem Score]
  -> Body verbessern, Labels ergaenzen, Update bestätigen
```

## Quick Start

1. `/review-issue #123` → Issue analysieren
2. Score & Verbesserungsvorschläge prüfen
3. Body/Labels updaten (falls bestätigt)

## Usage
```
/review-issue <issue-number>
/review-issue #123
```

## Was dieser Command macht

1. **Fetches** das Issue von GitHub
2. **Analysiert** Struktur gegen Gold Standard Template
3. **Prueft** Labels (typ:, prio:, bereich:, domain:)
4. **Scores** Qualität (0-50 Punkte)
5. **Generiert** verbesserten Issue-Body
6. **Optionally updates** das Issue nach Bestätigung

---

## Gold Standard Referenz

**Template-Datei:** `.claude/prompts/issue-gold-standard-template.md`

**Hinweis:** Nicht alle Sektionen gelten für jeden Issue-Typ. Der Typ (`typ:feature`, `typ:bug`, `typ:wartung`) steuert die Bewertung.

### Pflicht-Sektionen nach Typ

| Sektion | Feature | Bug | Wartung | Punkte |
|---------|---------|-----|---------|--------|
| Zusammenfassung + Leitsatz | PFLICHT | PFLICHT | PFLICHT | 10 |
| Motivation (4-6 Punkte) | PFLICHT | - | - | 5 |
| Abgrenzung zu Issues | PFLICHT | - | - | 5 |
| Architektur-Kontext | Falls relevant | - | - | 5 |
| Spezifikations-Bloecke | PFLICHT | - | PFLICHT | 10 |
| Reproduktionsschritte | - | PFLICHT | - | 5 |
| Technische Details | Falls relevant | Falls relevant | Falls relevant | 5 |
| Akzeptanzkriterien | PFLICHT | PFLICHT | PFLICHT | 5 |
| Abhängigkeiten | PFLICHT | Falls relevant | Falls relevant | 5 |

**Gesamt: 50 Punkte**

---

## Workflow

### 1. Issue abrufen

```bash
gh issue view <NUMBER> --json number,title,body,labels,milestone,state
```

### 2. Struktur-Check

| Sektion | Vorhanden | Qualität (1-5) | Notizen |
|---------|-----------|-----------------|---------|
| Zusammenfassung | OK/FEHLT | X/5 | ... |
| Leitsatz | OK/FEHLT | X/5 | ... |
| Motivation | OK/FEHLT/N/A | X/5 | ... |
| Abgrenzung | OK/FEHLT/N/A | X/5 | ... |
| Architektur-Kontext | OK/FEHLT/N/A | X/5 | ... |
| Spezifikation | OK/FEHLT | X/5 | ... |
| DB-Schema | OK/FEHLT/N/A | X/5 | ... |
| API-Endpoints | OK/FEHLT/N/A | X/5 | ... |
| UI-Komponenten | OK/FEHLT/N/A | X/5 | ... |
| Akzeptanzkriterien | OK/FEHLT | X/5 | ... |
| Abhängigkeiten | OK/FEHLT | X/5 | ... |

### 3. Label-Check

| Kategorie | Vorhanden | Korrekt | Empfehlung |
|-----------|-----------|---------|------------|
| typ: | OK/FEHLT | OK/FALSCH | ... |
| prio: | OK/FEHLT | OK/FALSCH | ... |
| bereich: | OK/FEHLT | OK/FALSCH | ... |
| domain: | OK/FEHLT | OK/FALSCH | ... |
| status: | OK/FEHLT/N/A | OK/FALSCH | ... |
| modul: | OK/FEHLT/N/A | OK/FALSCH | ... |

**Pflicht-Labels:** typ: + prio: + bereich: + domain:

**Domain-Zuordnung:**

| Domain | Beschreibung |
|--------|--------------|
| `theweekend` | Event-Discovery, Suche, Kalender, Event-Details |
| `thedancefloor` | Social Feed, Messages, Community |
| `thebackstage` | DJ/Club/Organizer Profiles, Dashboards |
| `shared` | Auth, Notifications, Profiles (Member), Media, Core |

### 4. Qualitäts-Score berechnen

```
Gesamt-Score: X/50 (X%)

Kategorie:
- 90-100%: Gold Standard - Keine Änderungen noetig
- 70-89%:  Gut, kleine Verbesserungen möglich
- 50-69%:  Akzeptabel, sollte verbessert werden
- <50%:    Braucht komplette Überarbeitung
```

### 5. Verbesserungsvorschläge generieren

Für jede fehlende/schwache Sektion:
1. Was fehlt konkret
2. Vorgeschlagener Text/Struktur
3. Beispiel basierend auf Issue-Kontext

---

## Output-Format

```markdown
# Issue #XXX Quality Review

**Datum:** [Heute]
**Issue:** #XXX
**Typ:** [typ:feature|typ:bug|typ:wartung]

## Qualitaets-Score

**Score:** X/50 (X%)

**Kategorie:** 
- 🟢 90-100%: Gold Standard - Keine Änderungen noetig
- 🟡 70-89%:  Gut, kleine Verbesserungen möglich
- 🟠 50-69%:  Akzeptabel, sollte verbessert werden
- 🔴 <50%:    Braucht komplette Überarbeitung

## Struktur-Analyse
[Tabelle mit allen Sektionen]

## Label-Analyse
[Tabelle mit allen Labels]
**Fehlende Pflicht-Labels:** [Liste]

## Verbesserungsvorschlaege

### [Sektion 1]
**Aktuell:** [Zitat oder "fehlt"]
**Vorschlag:**
[Verbesserter Text]

### [Sektion 2]
...

---

## Verbesserter Issue-Body

[Kompletter Issue-Body im Gold Standard Format]

---

## Naechste Schritte

**Update:**
- [ ] ✅ Ja, Issue Body updaten
- [ ] ❌ Nein, nur anzeigen

**Labels:**
- [ ] ✅ Ja, Labels ergaenzen: [fehlende Labels]
- [ ] ❌ Nein, Labels manuell setzen
```

## Definition of Done (DoD) - Review ist abgeschlossen

Ein Issue-Review gilt als abgeschlossen, wenn:

- [x] **Issue abgerufen:** Metadaten und Body von GitHub geladen
- [x] **Struktur analysiert:** Alle Sektionen gegen Gold Standard geprüft
- [x] **Labels geprüft:** Pflicht-Labels (typ, prio, bereich, domain) vorhanden
- [x] **Score berechnet:** 0-50 Punkte mit Kategorie-Zuordnung
- [x] **Verbesserungsvorschläge generiert:** Fehlende/schwache Sektionen identifiziert
- [x] **Verbesserter Body erstellt:** Im Gold Standard Format
- [x] **Update-Entscheidung getroffen:** Body Update ja/nein, Labels ja/nein

**Dann:** Issue aktualisieren (falls bestätigt) oder Analyse als Kommentar posten

---

## Regeln

1. **Keine Schätzungen** - Aufwand/Tage NICHT hinzufügen
2. **Keine Umlaute** - ae, oe, ue statt Umlaute (ASCII-Kompatibilitaet)
3. **Keine Emojis im Titel** - Nur im Body erlaubt
4. **Inhalt bewahren** - Struktur verbessern, Inhalt NICHT ändern
5. **Labels respektieren** - Issue-Typ beeinflusst benötigte Sektionen:
   - `typ:feature` -> Alle Sektionen
   - `typ:bug` -> Zusammenfassung, Reproduktion, Akzeptanzkriterien
   - `typ:wartung` -> Zusammenfassung, Technische Details, Akzeptanzkriterien
6. **domain-Label prüfen** - theweekend, thedancefloor, thebackstage, oder shared
7. **User-Bestätigung** - Vor jedem Update fragen

---

## Update-Prozess (nach Bestätigung)

```bash
# Issue Body updaten
gh issue edit <NUMBER> --body "$(cat <<'EOF'
[Verbesserter Body]
EOF
)"

# Labels ergaenzen
gh issue edit <NUMBER> --add-label "domain:theweekend"

# Kommentar hinzufügen
gh issue comment <NUMBER> --body "Issue gegen Gold Standard verbessert. Score: X/50 -> 50/50"
```

## Hinweise

- **Score ist Entscheidungshilfe:** 90-100% = Gold Standard, <50% = komplett überarbeiten
- **Kein Zwangs-Update:** Immer User-Bestätigung erforderlich (Body Update ja/nein, Labels ja/nein)
- **Inhalt bewahren:** Struktur verbessern, Inhalt NICHT ändern
- **Issue-Typ steuert Bewertung:** Nicht alle Sektionen gelten für jeden Typ (siehe Gold Standard Referenz)
