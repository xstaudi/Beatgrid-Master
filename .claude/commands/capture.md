# /capture - Figma Screen Capture via Playwright CDP

Capture App-Screens und sende sie an Figma via HTML-to-Design.

## Argumente

```
$ARGUMENTS
```

Format: `<figma-file-url | new> [screen-beschreibung]`

Beispiele:
- `/capture new "Event Erstellen - alle Screens"`
- `/capture https://figma.com/design/ABC123/... "Event Bearbeiten Tabs"`

---

## Voraussetzung

Chrome muss mit Remote-Debugging laufen:

```
chrome.exe --remote-debugging-port=9222
```

---

## Workflow

### Schritt 1: Verbindung pruefen

- `browser_navigate` zu `about:blank` testen
- Falls Fehler → User auffordern Chrome mit CDP zu starten:
  ```
  Chrome komplett schliessen, dann:
  chrome.exe --remote-debugging-port=9222
  ```

### Schritt 2: Figma-File Setup

- Argument parsen: `new` oder existierende Figma-URL
- Bei `new`: `generate_figma_design` ohne captureId aufrufen → File/Plan auswaehlen
- Bei URL: `fileKey` aus URL extrahieren

### Schritt 3: Login (falls noetig)

- Zu `localhost:5173/login` navigieren
- Pruefen ob bereits eingeloggt (Redirect zu `/home` oder Auth-State)
- Falls nicht eingeloggt:
  - `browser_fill_form` mit Email: `donstaudi@gmail.com`
  - `browser_fill_form` mit Password: `Fordtransit2021!`
  - Login-Button klicken
  - Warten auf Redirect

### Schritt 4: Screen-Liste definieren

- User nach Screens fragen ODER aus Argument ableiten
- Fuer jeden Screen definieren:
  - Ziel-URL (z.B. `localhost:5173/events/create`)
  - Optionale Interaktions-Schritte (Tab-Klicks, Dialog oeffnen, etc.)
  - Selector zum Warten (z.B. `form`, `[role="dialog"]`)

### Schritt 5: Pro Screen capturen

Fuer JEDEN Screen diesen Ablauf ausfuehren:

#### 5a. Capture-ID generieren

`generate_figma_design` mit `existingFile: true` und `fileKey` aufrufen → `captureId` + `endpoint` erhalten.

#### 5b. Zur Seite navigieren

```
browser_navigate → Ziel-URL
browser_wait_for → Relevanter Selector sichtbar
```

Falls Interaktions-Schritte noetig (z.B. Tab wechseln, Dialog oeffnen): `browser_click` ausfuehren.

#### 5c. H2D Script injizieren + Capture ausfuehren

`browser_run_code` mit folgendem Script (CAPTURE_ID und ENDPOINT ersetzen):

```javascript
// H2D Script injizieren
const response = await fetch('https://mcp.figma.com/mcp/html-to-design/capture.js');
const scriptText = await response.text();
const scriptEl = document.createElement('script');
scriptEl.textContent = scriptText;
document.head.appendChild(scriptEl);

// Warten bis Script initialisiert
await new Promise(resolve => setTimeout(resolve, 2000));

// Capture ausfuehren
const result = await window.figma.captureForDesign({
  captureId: 'CAPTURE_ID',
  endpoint: 'ENDPOINT',
  selector: 'body'
});
result;
```

**WICHTIG:** Bei jedem Screen NEU injizieren! SPA-Navigation entfernt das Script.

#### 5d. Status pruefen

`generate_figma_design` mit captureId aufrufen um Status zu pollen.
Ergebnis loggen.

### Schritt 6: Ergebnis

- Figma-File-URL ausgeben
- Zusammenfassung: `X von Y Screens erfolgreich captured`

---

## Fehlerfaelle

| Fehler | Loesung |
|--------|---------|
| Chrome nicht mit CDP | Anleitung ausgeben: `chrome.exe --remote-debugging-port=9222` |
| `requestAnimationFrame timed out` | Script erneut injizieren, 3s warten, Retry 1x |
| Figma MCP nicht erreichbar | Fehlermeldung + Hinweis auf Figma MCP Config |
| `fetch` blocked (CSP) | Script-Text direkt als String einbetten statt fetch |
| Seite nicht geladen | `browser_wait_for` mit laengerem Timeout, ggf. Reload |

---

## Hinweise

- Das H2D-Script muss nach JEDER SPA-Navigation neu injiziert werden
- `captureId` und `endpoint` kommen von `generate_figma_design`
- Bei komplexen Screens (Modals, Dropdowns): Erst Interaktion ausfuehren, dann capturen
- Playwright CDP verbindet sich zu einem BESTEHENDEN Chrome-Prozess (kein eigener Browser)
