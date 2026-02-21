# Figma Rules

**Aktiviert bei:** Figma-bezogene Arbeit (Migration, Design-Umsetzung, Code Connect)

---

## Farben-Policy (NICHT VERHANDELBAR)

NIEMALS Hex-Werte aus Figma uebernehmen. IMMER Design Tokens nutzen.

```
FALSCH: bg-[#FF0000], text-[#333333], border-[#CCCCCC]
RICHTIG: bg-primary, text-foreground, border-border
```

<!-- TODO: Token-Mapping Tabelle ans Projekt anpassen -->

---

## Komponenten-Policy

Priorisierte Entscheidungsreihenfolge:

1. **Code Connect** - Figma bereits mit Code verbunden -> direkt verwenden
2. **Erweitern** - Bestehende Komponente erweitern (Props/Variants)
3. **Neu erstellen** - shadcn/ui als Basis
4. **NIEMALS duplizieren** - Keine Kopie bestehender Komponenten

---

## Bidirektionaler Workflow

### Figma -> Code (Design Migration)

1. URL parsen (`fileKey` + `nodeId` extrahieren)
2. MCP-Tools parallel aufrufen: `get_design_context`, `get_screenshot`, `get_variable_defs`, `get_code_connect_map`
3. Token-Mapping erstellen (Figma-Variablen -> Design Tokens)
4. Komponenten-Analyse (Code Connect > Erweitern > Neu)
5. Implementieren nach Plan

### Code -> Figma (Code to Canvas)

1. Bestehende Komponente/Screen identifizieren
2. `create_design_system_rules` fuer Design-System-Regeln
3. `generate_figma_design` fuer Design-Generierung aus Code
4. `generate_diagram` fuer FigJam-Diagramme (Flowcharts, Sequenz, etc.)
5. Code Connect Mappings aktualisieren

---

## MCP-Tools Referenz (13 Tools)

| Tool                           | Zweck                                               |
| ------------------------------ | --------------------------------------------------- |
| `get_design_context`           | Code + Assets aus Figma-Node generieren (Haupttool) |
| `get_screenshot`               | Screenshot eines Figma-Nodes                        |
| `get_variable_defs`            | Design-Variablen/Tokens eines Nodes                 |
| `get_code_connect_map`         | Bestehende Code-Connect-Mappings                    |
| `get_metadata`                 | Struktur-Uebersicht (XML) fuer komplexe Screens     |
| `whoami`                       | Authentifizierter User pruefen                      |
| `get_code_connect_suggestions` | Vorschlaege fuer Code-Connect-Mappings              |
| `send_code_connect_mappings`   | Mappings an Figma senden                            |
| `add_code_connect_map`         | Einzelnes Code-Connect-Mapping erstellen            |
| `create_design_system_rules`   | Design-System-Regeln generieren                     |
| `generate_figma_design`        | Code -> Figma Design generieren (Code to Canvas)    |
| `generate_diagram`             | FigJam-Diagramme erstellen (Mermaid.js)             |
| `get_figjam`                   | FigJam-Node-Daten abrufen                           |

---

## Quality Gates (vor Abschluss jeder Figma-Migration)

- [ ] Keine Hex-Farben im Code (nur Design Tokens)
- [ ] Token-Mapping dokumentiert und korrekt
- [ ] Code Connect Mapping aktualisiert (wenn neue Komponenten)
- [ ] Responsive getestet (Mobile, Tablet, Desktop)
- [ ] A11y geprueft (Keyboard, ARIA, Fokus)
- [ ] Tests gruen
