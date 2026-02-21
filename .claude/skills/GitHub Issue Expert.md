---
name: github-issue-expert
description: GitHub Issue Erstellung und Verbesserung im Gold Standard Format. Aktiviert bei Issue-Erstellung, Issue-Qualität, Issue-Verbesserung, Feature-Planung.
allowed-tools: Read, Bash, Grep, Glob, WebSearch
---

# GitHub Issue Expert

GitHub Issue Erstellung/Review im Gold Standard Format.

**Template:** `.claude/prompts/issue-gold-standard-template.md`

---

## Gold Standard Struktur

**Header (Pflicht):**
- Zusammenfassung (2-3 Sätze + Leitsatz in Quotes)
- Motivation (4-6 Bullet-Points: `**Keyword:** Erklärung`)
- Abgrenzung (Tabelle: Issue | Fokus | Abgrenzung)

**Spezifikations-Blöcke:**
```markdown
## 1. Konzept-Name

### A. Unterkonzept

| Aspekt | Beschreibung |
|--------|--------------|
| Auslöser | Was triggert |
| Aktion | Was passiert |
```

**Technische Blöcke:**
- DB-Schema: `ALTER TABLE` Statements
- API-Endpoints: `POST /api/resource` + Auth + Body/Response
- UI-Komponenten: Bereich A - ComponentName Liste

**Abschluss (Pflicht):**
- Akzeptanzkriterien (testbar!)
- Abhängigkeiten (Baut auf / Ergänzt)
- Empfohlene Reihenfolge (bei Feature-Serien)

---

## Definition of Ready (DoR)

Issue gilt als `status:ready`, wenn:
- ✅ Header-Block vollständig
- ✅ Akzeptanzkriterien testbar
- ✅ model-Label gesetzt (opus/sonnet)
- ✅ Abhängigkeiten geklärt
- ✅ Keine offenen Unklarheiten

---

## Label-System

**Pflicht-Labels:**
- **typ:** feature, bug, wartung, security, docs, performance
- **prio:** critical, high, medium, low
- **bereich:** frontend, backend, datenbank, infra, ux
- **domain:** theweekend, thedancefloor, thebackstage, shared
- **model:** opus, sonnet

**Optional:** status, modul

**Model-Entscheidung:**
```
model:opus → Komplexe Tasks:
- Multi-System (Backend + Frontend + DB)
- Security/Auth, Real-time, Algorithmen
- DB-Schemas, komplexe Migrationen
- Epics, API-Architektur

model:sonnet → Einfachere Tasks:
- UI-Komponenten, Bug-Fixes, Styling
- Loading States, Skeletons
- Dokumentation, Refactoring
- Kleine API-Endpoints (CRUD)
```

**Security-Issues:** typ:security → IMMER model:opus + Impact-Beschreibung

---

## Typ-spezifische Templates

**Feature:** Alle Sektionen (Header, Motivation, Abgrenzung, Spezifikation, Technisch, Akzeptanz, Abhängigkeiten)

**Bug:** Fokus Reproduktion (Zusammenfassung, Environment, Schritte, Erwartet/Aktuell, Akzeptanz)

**Wartung:** Fokus Technisch (Zusammenfassung, Technische Details, Betroffene Files, Akzeptanz)

---

## Verbotene Praktiken

1. Keine Schätzungen (Aufwand/Tage)
2. Keine Emojis im Titel
3. Kein automatisches Erstellen (IMMER User-Bestätigung)
4. Keine Duplikate (erst `gh issue list --search` prüfen)
5. Kein Issue ohne model-Label

---

## Best Practices

- Duplikat-Check zuerst (`gh issue list --search`)
- Kontext aus Docs (architecture.md, workflows.md)
- Verwandte Issues verlinken (Abgrenzung, Abhängigkeiten)
- Testbare Kriterien (jedes Akzeptanzkriterium prüfbar)
- Tabellen für strukturierte Infos

---

## Wann aktiv

Issue-Erstellung, Issue-Verbesserung, Issue-Qualitäts-Review, Feature-Planung, Bug-Reports.
