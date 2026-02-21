# Issue Gold Standard Template

Kopiere dieses Template und fülle es aus, um ein Issue im Gold Standard Format zu erstellen.

---

## Hinweis für Bug-Issues

Für Bug-Issues gelten folgende Anpassungen:

- **Motivation** = Impact + Risiko (Was passiert wenn nicht gefixt? Wer ist betroffen?)
- **Architektur-Zusammenspiel** = optional (nur wenn Architektur-Kontext relevant ist)
- **Fokus auf:** Reproduktion (Schritte zum Nachstellen) + Fix (Was muss geändert werden?)
- **Akzeptanzkriterien:** Regression-Test + Fix-Verifikation

---

## Template (Feature-Issues)

---

## Zusammenfassung

[2-3 Sätze die das Feature/Problem beschreiben]

Leitsatz: "[Einprägsamer Satz der das Kernprinzip zusammenfasst]"

## Motivation

- **[Keyword 1]:** [Erklärung warum das wichtig ist]
- **[Keyword 2]:** [Erklärung]
- **[Keyword 3]:** [Erklärung]
- **[Keyword 4]:** [Erklärung]
- **[Keyword 5]:** [Erklärung] (optional)
- **[Keyword 6]:** [Erklärung] (optional)

**Hinweis:** 4-6 Bullet-Points sind optimal.

## Abgrenzung zu bestehenden Issues

| Issue | Fokus | Abgrenzung |
|-------|-------|------------|
| #XXX | [Was macht das Issue] | [Warum ist DIESES Issue anders] |
| #XXX | [Was macht das Issue] | [Warum ist DIESES Issue anders] |

**Dieses Issue:** [Kurze Beschreibung des Fokus]

## Architektur-Zusammenspiel

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARCHITEKTUR-KONTEXT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  #XXX [Feature A] → [Wirkung im System]                         │
│                                                                 │
│  #XXX [Feature B] → [Wirkung im System]                         │
│                                                                 │
│  DIESES ISSUE    → [Wirkung im System]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. [Hauptkonzept A]

### A. [Unterkonzept]

| Aspekt | Beschreibung |
|--------|--------------|
| Ausloeser | [Was triggert das] |
| Aktion | [Was passiert] |
| Wirkung | [Was ist das Ergebnis] |
| [Weiterer Aspekt] | [Beschreibung] |

### B. [Unterkonzept]

| Aspekt | Beschreibung |
|--------|--------------|
| ... | ... |

---

## 2. [Hauptkonzept B]

[Beschreibung]

### [Unterkonzept]

```
[Diagramm oder Fluss falls relevant]

Status A → Status B → Status C
              ↓
         Status D
```

---

## 3. Datenbank-Schema (falls relevant)

### Erweiterung: [table_name]

```sql
ALTER TABLE [table_name]
ADD COLUMN [column_name] [TYPE] [CONSTRAINTS],
ADD COLUMN [column_name] [TYPE] [CONSTRAINTS];
```

### Neue Tabelle: [table_name]

```sql
CREATE TABLE [table_name] (
  id VARCHAR(30) PRIMARY KEY,
  [column_name] [TYPE] NOT NULL,
  [column_name] [TYPE],
  [foreign_key] VARCHAR(30) REFERENCES [other_table](id),
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_[name] ([column]),
  INDEX idx_[name] ([column1], [column2])
);
```

---

## 4. API-Endpoints (falls relevant)

### [Aktion beschreiben]

```
POST /api/[resource]/:id/[action]
Body: {
  [field]: [type],
  [field]: [type]
}
Response: {
  [field]: [Type]
}
```

### [Weitere Aktion]

```
GET /api/[resource]?[param]=[value]
Response: {
  [items]: [Type][]
}
```

---

## 5. Background-Jobs (falls relevant)

**Hinweis:** Diese Sektion nur ausfüllen wenn Background-Jobs betroffen sind.

### [Job-Name]

```typescript
async function [jobName]() {
  // [Beschreibung was der Job macht]
  const items = await [getItems]();

  for (const item of items) {
    if ([condition]) {
      await [action](item);
      await [notify](item);
    }
  }
}
```

**Intervall:** [z.B. alle 15 Minuten, täglich]

---

## 6. UI-Komponenten

### [Bereich A]
- `[ComponentName]` - [Kurze Beschreibung]
- `[ComponentName]` - [Kurze Beschreibung]

### [Bereich B]
- `[ComponentName]` - [Kurze Beschreibung]
- `[ComponentName]` - [Kurze Beschreibung]

### UI-Mockup (optional)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Titel]                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [UI-Element Beschreibung]                                      │
│                                                                 │
│  [Button/Input/etc]                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Akzeptanzkriterien

**Regel:** Jedes Akzeptanzkriterium muss objektiv pruefbar sein (manuell oder automatisiert).

### [Bereich A]
- [ ] [Konkretes, testbares Kriterium]
- [ ] [Konkretes, testbares Kriterium]
- [ ] [Konkretes, testbares Kriterium]

### [Bereich B]
- [ ] [Konkretes, testbares Kriterium]
- [ ] [Konkretes, testbares Kriterium]

---

## 8. Abhängigkeiten

### Baut auf
- #XXX [Feature-Name] ([Beschreibung der Abhängigkeit])
- #XXX [Feature-Name] ([Beschreibung der Abhängigkeit])

**Falls keine:** Keine.

### Ergaenzt
- #XXX [Feature-Name] ([Beschreibung wie es ergänzt wird])

**Falls keine:** Keine.

---

## 9. Empfohlene Reihenfolge (optional, bei Feature-Serien)

**Hinweis:** Diese Sektion nur ausfüllen wenn mehrere Issues in einer bestimmten Reihenfolge umgesetzt werden müssen.

| Reihenfolge | Issue | Fokus |
|-------------|-------|-------|
| 1. | #XXX | [Beschreibung] |
| 2. | #XXX | [Beschreibung] |
| 3. | **DIESES** | [Beschreibung] |
| 4. | #XXX | [Beschreibung] |

---

# Model-Label Kategorisierung (PFLICHT)

Jedes Issue benötigt ein `model:opus` oder `model:sonnet` Label.

## model:opus (lila) - Komplexe Tasks

Verwende `model:opus` wenn EINES dieser Kriterien zutrifft:

| Kriterium | Beispiele |
|-----------|-----------|
| **Multi-System** | Backend + Frontend + DB gleichzeitig |
| **Neue DB-Schemas** | Neue Tabellen, komplexe Migrationen |
| **Security/Auth** | Authentifizierung, Autorisierung, Encryption |
| **Real-time** | WebSocket, SSE, Presence-System |
| **Algorithmen** | Recommendations, Ranking, Matching |
| **Performance/Infra** | Caching, CDN, Query-Optimierung |
| **API-Architektur** | Versioning, Error-Format, Rate-Limiting |
| **Epics** | Multi-Issue Features |
| **Komplexe Integrationen** | Payment, OAuth, External APIs |

## model:sonnet (cyan) - Einfachere Tasks

Verwende `model:sonnet` wenn ALLE diese Kriterien zutreffen:

| Kriterium | Beispiele |
|-----------|-----------|
| **Einzelne Schicht** | Nur Frontend ODER nur Backend |
| **UI-Komponenten** | Cards, Buttons, Modals, Forms |
| **Bug-Fixes** | Einzelne Fehler beheben |
| **Styling/UX** | CSS, Animationen, Responsive |
| **Loading States** | Skeletons, Spinner, Empty States |
| **Dokumentation** | Docs, Comments, README |
| **Refactoring** | Code-Cleanup ohne neue Features |
| **Kleine API-Endpoints** | CRUD ohne komplexe Logik |

## Entscheidungshilfe

```
Betrifft es mehrere Schichten (DB + API + UI)?
  JA  -> model:opus
  NEIN -> Weiter prüfen

Ist es Security, Real-time oder Algorithmus?
  JA  -> model:opus
  NEIN -> Weiter prüfen

Ist es ein Epic oder Multi-Issue Feature?
  JA  -> model:opus
  NEIN -> model:sonnet
```

---

# Checkliste vor Erstellen

- [ ] Zusammenfassung ist praegnant (2-3 Saetze)
- [ ] Leitsatz ist einpraegsam
- [ ] Motivation hat 4-6 Bullet-Points
- [ ] Abgrenzung zu verwandten Issues ist klar
- [ ] Architektur-Kontext zeigt wo es hingehört
- [ ] Spezifikation ist vollständig
- [ ] DB-Schema ist korrekt (falls relevant)
- [ ] API-Endpoints sind definiert (falls relevant)
- [ ] Akzeptanzkriterien sind testbar
- [ ] Abhängigkeiten sind verlinkt
- [ ] Keine Umlaute (ae, oe, ue verwenden)
- [ ] Keine Schätzungen/Aufwand angegeben
- [ ] **model-Label gesetzt** (model:opus oder model:sonnet)
