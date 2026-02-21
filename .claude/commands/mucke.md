# Musik-Discovery (Electronic Music)

Multi-Phasen-Recherche für elektronische Musik-Releases.

## Usage

/mucke "Hardgroove" --bpm 140-150 --zeitraum "letzter Monat"
/mucke "Melodic Techno" --zeitraum "letzte Woche"
/mucke trend --genre "Hard Techno"

## Parameter

| Parameter   | Default         | Beschreibung             |
| ----------- | --------------- | ------------------------ |
| Genre/Query | Pflicht         | Genre oder Freitext      |
| --bpm       | Genre-Default   | BPM-Range (z.B. 140-150) |
| --zeitraum  | "letzter Monat" | Suchzeitraum             |
| --label     | -               | Label-Filter             |

## BPM-Defaults

| Genre            | BPM     |
| ---------------- | ------- |
| Deep House       | 120-125 |
| Tech House       | 125-130 |
| Melodic Techno   | 122-128 |
| Peak Time Techno | 130-140 |
| Hard Techno      | 140-150 |
| Hardgroove       | 138-148 |

## Phasen-Suche (PFLICHT)

### Phase 1: Discovery (max 6 Queries)

- `"<genre> new releases <monat> <jahr>"`
- `"<genre> <bpm>bpm tracks <zeitraum>"`
- `"best <genre> <monat> <jahr> beatport"`

### Phase 2: Validierung

- Release-Datum STRIKT prüfen (Ergebnisse ausserhalb Zeitraum = RAUS)
- Duplikate entfernen

### Phase 3: Enrichment (1 Query pro Track)

- `"<artist> <track> youtube"` (KEIN site: Operator!)
- Beatport/Bandcamp Links ergaenzen

## Verbotene Patterns

- NIEMALS `site:youtube.com` in WebSearch
- NIEMALS `site:` Operator generell
- NIEMALS >15 WebSearch Calls total
- NIEMALS Tracks ausserhalb des Zeitraums anzeigen

## Bevorzugte Quellen

Beatport, Bandcamp, SoundCloud, Resident Advisor, 1001Tracklists

## Output-Format

| #   | Track | Artist | Label | BPM | Release | Links |
| --- | ----- | ------ | ----- | --- | ------- | ----- |

Immer mit Release-Datum und Quellen-Links.
