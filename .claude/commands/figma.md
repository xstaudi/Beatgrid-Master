# Figma Migration Workflow

Automatische Migration von Figma-Designs in Code via MCP + Code to Canvas.

**Wann einsetzen:**

- Figma-Designs in Code umsetzen (Figma -> Code)
- Code in Figma-Designs umwandeln (Code -> Figma)
- Neue UI-Komponenten aus Design
- Screen-Updates basierend auf Figma
- Design-System-Komponenten migrieren
- FigJam-Diagramme erstellen

**Ziel:** Bidirektionaler Figma-Workflow mit direktem MCP-Zugriff.

## Usage

```
/figma <URL>                    # Figma-URL direkt verarbeiten
/figma <URL> plan               # Nur Plan, keine Umsetzung
/figma <URL> "Feature Name"     # Mit Titel fuer Issue
/figma code-to-canvas <desc>    # Code -> Figma Design generieren
/figma diagram <desc>           # FigJam-Diagramm erstellen
```

## Input

**Figma-URL mit Node-ID:**

```
https://figma.com/design/<fileKey>/<fileName>?node-id=<nodeId>
```

**Beispiel:**

```
/figma https://figma.com/design/ABC123xyz/TheWeekend?node-id=1234-5678
```

---

## Workflow-Phasen (Figma -> Code)

### 0. CONTEXT-BUDGET PRUEFEN

**Ziel:** Context-Overflow verhindern vor Multi-Step-Workflow.

**Aufgaben:**

- Wenn >80%: Warnung ausgeben + Empfehlung `/compact`
- Wenn >90%: Abbruch empfehlen (neuer Chat oder `/compact`)
- Wenn >95%: Automatischer Stop

---

### 1. FIGMA-DATEN AUTOMATISCH HOLEN (MCP)

**Ziel:** Alle Figma-Daten automatisch via MCP laden.

**URL parsen:**

```
https://figma.com/design/<fileKey>/<fileName>?node-id=<nodeId>
```

- `fileKey` extrahieren (z.B. `ABC123xyz`)
- `nodeId` extrahieren und Format anpassen (`1234-5678` -> `1234:5678`)

**MCP-Tools ausfuehren (parallel wo moeglich):**

1. `get_design_context` - Code + Assets (Haupttool)
2. `get_screenshot` - Visuelles Bild zur Referenz
3. `get_variable_defs` - Design Tokens/Variablen
4. `get_code_connect_map` - Bestehende Code-Mappings

**Output sammeln:**

- `designContext`: Generierter Code + Asset-URLs
- `screenshot`: Visuelles Bild zur Referenz
- `variables`: Figma-Tokens (Farben, Spacing, etc.)
- `codeConnectMap`: Bereits gemappte Komponenten

---

### 2. KONTEXT LADEN

**Ziel:** Bestehende Design-Regeln und Patterns verstehen.

**Lese automatisch:**

- `docs/entwicklung/styling-rules.md` - Design Tokens (Source of Truth)
- `docs/produkt/app-layout.md` - Routes/Screens
- Bestehende Komponenten scannen (`frontend/src/components/`)

---

### 3. ANALYSE + TOKEN-MAPPING

**Ziel:** Figma-Daten mit Codebase abgleichen.

**Automatisches Token-Mapping erstellen:**

| Figma-Variable     | Figma-Wert | Design Token   | Tailwind        |
| ------------------ | ---------- | -------------- | --------------- |
| `color/primary`    | #6B1018    | `--primary`    | `text-primary`  |
| `color/background` | #343A3D    | `--background` | `bg-background` |
| ...                | ...        | ...            | ...             |

**Komponenten-Analyse:**
| Figma-Element | Code Connect? | Bestehend? | Aktion |
|---------------|---------------|------------|--------|
| Button | Ja -> Button.tsx | Ja | NUTZEN |
| CustomCard | Nein | Nein | NEU |
| ... | ... | ... | ... |

**Gap-Analyse:**

- NEU: Komponente existiert nicht -> Erstellen
- AENDERN: Komponente existiert, aber anders -> Erweitern
- NUTZEN: Code Connect vorhanden -> Direkt verwenden
- SKIP: Bereits identisch implementiert

---

### 4. ISSUE ERSTELLEN (automatisch)

**Ziel:** Tracking und Dokumentation im Gold Standard Format.

**GitHub Issue erstellen:**

- Labels: `typ:feature`, `bereich:frontend`, ggf. `bereich:backend`
- Milestone zuordnen
- Token-Mapping + Komponenten-Analyse als Body

---

### 5. PLAN (Freigabe erforderlich!)

**Ziel:** Strukturierter Implementierungsplan zur Freigabe.

**WICHTIG:** Nach Plan auf User-Freigabe warten!

---

### 6. IMPLEMENTIERUNG

**Ziel:** Code schreiben nach freigegebenem Plan.

**Voraussetzung:** User hat Plan freigegeben

**Reihenfolge:**

1. Backend (wenn noetig) - API Endpoints, Services, Zod DTOs
2. Frontend - Komponenten, React Query Hooks, Design Tokens
3. Tests + Docs

---

### 7. ABSCHLUSS

**Ziel:** Sauberer Abschluss mit dokumentiertem Ergebnis.

**Aufgaben:**

1. `/test` ausfuehren
2. User fragen: `/done #XX` ausfuehren? (KEIN automatischer Commit!)

---

## Code to Canvas Workflow (Code -> Figma)

### Wann nutzen

- Bestehende Komponenten in Figma visualisieren
- Design-System aus Code in Figma uebertragen
- Diagramme/Flowcharts fuer FigJam erstellen

### Ablauf

1. **Design-System-Regeln erstellen:**
   - `create_design_system_rules` aufrufen
   - Generiert Regeln basierend auf Codebase-Konventionen

2. **Design generieren:**
   - `generate_figma_design` mit Komponenten-Beschreibung aufrufen
   - Erzeugt Figma-Design aus Code-Komponenten

3. **FigJam-Diagramme:**
   - `generate_diagram` mit Mermaid.js-Syntax
   - Unterstuetzt: Flowcharts, Sequenz, State, Gantt

4. **Code Connect aktualisieren:**
   - `get_code_connect_suggestions` fuer Vorschlaege
   - `send_code_connect_mappings` / `add_code_connect_map` zum Verknuepfen

---

## Kritische Regeln

### Farben-Policy (NICHT VERHANDELBAR)

```
NIEMALS Figma-Farben/Hex-Werte uebernehmen:
- Kein #6B1018, #343A3D, etc. aus Figma
- Keine bg-[#...] oder text-[#...] Klassen

IMMER bestehende Design Tokens mappen:
- Primary: text-primary, bg-primary
- Secondary: text-secondary, bg-secondary
- Background: bg-background, bg-card
- Border: border-border, border-input
- Muted: text-muted-foreground

Source of Truth: docs/entwicklung/styling-rules.md
```

### Komponenten-Policy

```
Priorisierte Entscheidungsreihenfolge:
1. CODE CONNECT - Figma bereits mit Code verbunden -> direkt verwenden
2. ERWEITERN - Bestehende Komponente erweitern (Props/Variants)
3. NEU - Komplett neue Komponente (shadcn/ui als Basis)
NIEMALS duplizieren!
```

---

## MCP-Tools Referenz (13 Tools)

| Tool                           | Zweck                       | Wann                        |
| ------------------------------ | --------------------------- | --------------------------- |
| `get_design_context`           | Code + Assets holen         | Immer (Haupttool)           |
| `get_screenshot`               | Visuelles Bild              | Immer (zur Referenz)        |
| `get_variable_defs`            | Design Tokens               | Immer (fuer Mapping)        |
| `get_code_connect_map`         | Bestehende Mappings         | Immer (Duplikate vermeiden) |
| `get_metadata`                 | Struktur-Uebersicht (XML)   | Bei komplexen Screens       |
| `whoami`                       | Auth-Status pruefen         | Bei Verbindungsproblemen    |
| `get_code_connect_suggestions` | Mapping-Vorschlaege         | Nach Implementation         |
| `send_code_connect_mappings`   | Mappings an Figma senden    | Nach Implementation         |
| `add_code_connect_map`         | Einzelnes Mapping erstellen | Nach Implementation         |
| `create_design_system_rules`   | Design-System-Regeln        | Code to Canvas              |
| `generate_figma_design`        | Design aus Code generieren  | Code to Canvas              |
| `generate_diagram`             | FigJam-Diagramme (Mermaid)  | Flowcharts, Sequenz, etc.   |
| `get_figjam`                   | FigJam-Node-Daten           | FigJam-Dateien lesen        |

---

## Quality Gates (vor Abschluss)

- [ ] Keine Hex-Farben im Code
- [ ] Alle Design Tokens korrekt gemappt
- [ ] Responsive getestet (Mobile, Tablet, Desktop)
- [ ] A11y geprueft (Keyboard, ARIA, Fokus)
- [ ] Tests gruen
- [ ] Code Connect Mapping aktualisiert (optional)

---

## Delegierte Agents

| Agent                | Wann                | Zweck               |
| -------------------- | ------------------- | ------------------- |
| `backend-architect`  | API/DB-Aenderungen  | Backend-Architektur |
| `frontend-developer` | UI-Komponenten      | React/TypeScript    |
| `code-reviewer`      | Nach Implementation | Quality Check       |

---

## Fallback (wenn MCP fehlschlaegt)

Falls MCP-Tools nicht funktionieren (Netzwerk, Auth, etc.):

1. User gibt Figma Dev Mode Code (Copy/Paste)
2. User gibt Screenshot (Bild einfuegen)
3. Workflow ab Phase 2 fortsetzen

---

## Referenzen

- [styling-rules.md](../../docs/entwicklung/styling-rules.md) - Design Tokens (Source of Truth)
- [app-layout.md](../../docs/produkt/app-layout.md) - Routes/Screens
- [figma.md](../rules/figma.md) - Permanente Figma-Regeln

---

## Siehe auch

- `/feature` - Fuer Feature-Entwicklung ohne Figma
- `/review` - Fuer Code-Review nach Implementation
- `/done` - Fuer Issue-Abschluss
