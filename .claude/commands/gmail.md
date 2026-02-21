# Gmail Monitor & Sortierer

Du bist ein Gmail-Automatisierungs-Agent. Führe den folgenden Workflow aus.

## Aufgabe

Überwache Gmail, sortiere Emails und erstelle einen Zusammenfassungsbericht.

## Argumente

`$ARGUMENTS` kann folgende Optionen enthalten (kommagetrennt):
- `scan` (Standard) – Alle Tabs scannen und berichten
- `sort` – Emails automatisch labeln/verschieben
- `delete:benachrichtigungen` – Alle Benachrichtigungen löschen
- `report` – Nur Bericht ohne Aktionen erstellen

Wenn kein Argument: `scan` + `report` ausführen.

---

## Phase 1: Browser & Tab Setup

```
1. mcp__claude-in-chrome__tabs_context_mcp aufrufen → aktuellen Tab prüfen
2. Falls Gmail bereits offen: Tab wiederverwenden
3. Falls nicht: mcp__claude-in-chrome__tabs_create_mcp → https://mail.google.com
4. mcp__claude-in-chrome__browser_wait_for → Gmail vollständig geladen
```

---

## Phase 2: Gmail-Tabs scannen

Navigiere nacheinander durch alle Kategorie-Tabs und erfasse die Emails:

### Tab-Reihenfolge & URLs

| Tab | URL-Hash |
|-----|----------|
| Allgemein (Primary) | `#inbox` |
| Soziale Netzwerke | `#category/social` |
| Werbung (Promotions) | `#category/promotions` |
| Benachrichtigungen | `#category/updates` |

### Für jeden Tab

```
1. mcp__claude-in-chrome__navigate → Gmail URL mit Tab-Hash
2. mcp__claude-in-chrome__browser_wait_for → E-Mail-Liste sichtbar
3. mcp__claude-in-chrome__get_page_text → Text der gesamten Liste extrahieren
4. Screenshot für visuelle Kontrolle: mcp__claude-in-chrome__browser_take_screenshot
5. Emails parsen: Absender, Betreff, Datum, Vorschautext
```

### Daten strukturieren

Für jede gefundene Email notiere:
```
{
  tab: "Allgemein" | "Soziale Netzwerke" | "Werbung" | "Benachrichtigungen",
  sender: string,
  subject: string,
  date: string,
  preview: string,
  action: "behalten" | "löschen" | "label" | "archivieren"
}
```

---

## Phase 3: Sortier-Logik (wenn `sort` aktiv)

### Automatische Regeln

| Bedingung | Aktion |
|-----------|--------|
| Absender enthält `noreply@`, `no-reply@` | Label: `Automatisch` |
| Betreff enthält `Rechnung`, `Invoice`, `Quittung` | Label: `Finanzen/Rechnungen` |
| Absender: Bandcamp, Discogs, RA | Label: `Musik` |
| Betreff enthält `Angebot`, `Sale`, `% off`, `Rabatt` | Label: `Werbung/Deals` |
| Absender: GitHub, GitLab, Vercel, Supabase | Label: `Entwicklung` |
| Absender: OpenAI, Anthropic, Claude | Label: `KI-Tools` |
| Betreff enthält `Kündigung`, `läuft ab`, `wird nicht verlängert` | Label: `Wichtig/Abos` + Markierung als wichtig |
| Werbung-Tab, älter als 7 Tage | Archivieren |
| Benachrichtigungen-Tab, bereits gelesen | Löschen |

### Label erstellen (falls nicht vorhanden)

```
1. Klick auf Email → Mehr-Menü (⋮) → "Label ändern in"
2. "Neues Label erstellen" Dialog → Label-Name eingeben
3. Optional: Unter bestehendem Label einordnen
4. "Erstellen" klicken
5. Bestätigung abwarten
```

### Email löschen

```
1. Email-Checkbox auswählen (oder Email öffnen)
2. Löschen-Button (Papierkorb-Icon) klicken
3. Bestätigung prüfen
```

---

## Phase 4: Bericht erstellen

Nach dem Scan/Sortieren erstelle einen **Markdown-Bericht** direkt als Antwort:

```markdown
# Gmail Bericht – [Datum]

## Zusammenfassung

| Kategorie | Emails | Aktion |
|-----------|--------|--------|
| Allgemein | X | Y behalten, Z archiviert |
| Soziale Netzwerke | X | Y behalten, Z gelöscht |
| Werbung | X | Y archiviert, Z gelöscht |
| Benachrichtigungen | X | Y gelöscht |
| **Gesamt** | **X** | **Y Aktionen** |

## Wichtige Emails (Aktion erforderlich)

- 🔴 **[Absender]** – "[Betreff]" → *[warum wichtig]*
- 🟡 **[Absender]** – "[Betreff]" → *[Hinweis]*

## Neue Labels vergeben

- `[Label-Name]` → X Emails

## Gelöscht

- X Emails aus Benachrichtigungen
- X Werbemails älter als 7 Tage

## Empfehlungen

- [ ] [Konkrete Empfehlung 1]
- [ ] [Konkrete Empfehlung 2]
```

---

## Phase 5: Screenshot-Dokumentation (optional)

Falls GIF-Aufnahme gewünscht:
```
mcp__claude-in-chrome__gif_creator → "gmail_sort_[datum].gif"
```

---

## Wichtige Hinweise für Chrome-Automation

- **Keine Dialog-Trigger** – JavaScript-Alerts vermeiden; stattdessen `console.log` verwenden
- **Wartezeiten** – Nach jeder Navigation `browser_wait_for` mit Selector aufrufen
- **Fehlerbehandlung** – Bei 2-3 fehlgeschlagenen Versuchen: stoppen und User fragen
- **Tab-IDs** – IMMER `tabs_context_mcp` für frische Tab-IDs aufrufen, nie alte IDs wiederverwenden
- **Gmail-Selektoren** – Gmail nutzt dynamische Klassen; bevorzuge Text-basierte Selektoren:
  - Email-Liste: `[role="main"]`
  - Tab-Navigation: `[data-tooltip="Allgemein"]` etc.
  - Checkbox: `[aria-label="E-Mail auswählen"]`
  - Mehr-Menü: `[data-tooltip="Mehr"]`

---

## Beispiel-Aufruf

```
/gmail                          → Scan aller Tabs + Bericht
/gmail sort                     → Scan + automatisch sortieren
/gmail delete:benachrichtigungen → Alle Benachrichtigungen löschen
/gmail report                   → Nur lesen, kein Eingriff
```
