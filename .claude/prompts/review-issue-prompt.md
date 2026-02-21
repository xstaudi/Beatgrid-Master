# Manueller Issue-Review Prompt

Kopiere diesen Prompt und ersetze `[ISSUE_BODY]` mit dem Issue-Inhalt.

---

## Prompt (Copy & Paste)

```
Analysiere dieses GitHub Issue gegen den Gold Standard und generiere eine verbesserte Version.

## Gold Standard Struktur

1. **Zusammenfassung** (PFLICHT)
   - 2-3 Sätze
   - Leitsatz in Anführungszeichen

2. **Motivation** (PFLICHT)
   - 4-6 Bullet-Points
   - Format: **Keyword:** Erklärung

3. **Abgrenzung zu bestehenden Issues**
   - Tabelle: Issue | Fokus | Abgrenzung

4. **Zusammenspiel der Architektur**
   - ASCII-Diagramm ODER strukturierte Liste (Layer → Verantwortung)

5. **Spezifikation** (nummerierte Kapitel)
   - Unterkonzepte als Tabellen (Aspekt | Beschreibung)

6. **Technische Details** (nur falls relevant)
   - DB-Schema (SQL)
   - API-Endpoints
   - Background-Jobs
   - UI-Komponenten
   - Keine leeren Sektionen erzeugen

7. **Akzeptanzkriterien** (PFLICHT)
   - Checkbox-Liste
   - Jedes Kriterium muss objektiv pruefbar sein
   - Keine vagen Formulierungen wie "sollte besser sein"

8. **Abhängigkeiten** (PFLICHT)
   - Baut auf: #XXX
   - Ergänzt: #XXX

## Regeln
- Keine Schaetzungen oder Zeitangaben
- Deutsche Sprache
- Umlaute vermeiden (ae, oe, ue)
- **Inhalt bewahren:**
  - Keine neuen Features hinzudichten
  - Keine bestehenden Entscheidungen umwerfen
  - Nur fehlende Struktur, Klarheit und Praezision ergaenzen
- Keine leeren Sektionen erzeugen

## Aktueller Issue-Body

[ISSUE_BODY]

## Aufgabe

1. Bewerte den aktuellen Zustand (Score 0-50)
2. Ordne den Score ein:
   - 45-50 = Gold Standard
   - 35-44 = Gut
   - 25-34 = Verbesserungsbeduerftig
   - <25 = Kritisch
3. Liste fehlende Sektionen auf
4. Generiere den verbesserten Issue-Body im Gold Standard Format

Gib mir den kompletten verbesserten Issue-Body, den ich direkt in GitHub einfuegen kann.

## Empfohlene Labels (optional)
- typ: bug | feature | wartung | security | docs | performance
- prio: critical | high | medium | low
- bereich: frontend | backend | datenbank | infra | ux
- domain: theweekend | thedancefloor | thebackstage | shared
- model: opus | sonnet
```

---

## Kurzversion (für schnelle Reviews)

```
Verbessere dieses Issue im Gold Standard Format:

Pflicht-Sektionen:
- Zusammenfassung (2-3 Saetze + Leitsatz)
- Motivation (4-6 Bullet-Points)
- Akzeptanzkriterien (Checkbox-Liste, objektiv pruefbar)
- Abhaengigkeiten (Baut auf / Ergaenzt)

Regeln: Keine Schaetzungen, keine Umlaute, Inhalt bewahren (keine neuen Features).

Issue:
[ISSUE_BODY]
```

---

## Batch-Review Prompt

```
Ich habe X GitHub Issues die ich gegen den Gold Standard prüfen moechte.

Für jedes Issue:
1. Score berechnen (0-50)
2. Kategorie zuweisen:
   - 45-50 = Gold Standard
   - 35-44 = Gut
   - 25-34 = Verbesserungsbeduerftig
   - <25 = Kritisch
3. Top-3 Verbesserungen nennen

Issues:
[ISSUE_LIST mit Nummer und Titel]

Erstelle eine Übersichtstabelle und empfehle die Reihenfolge der Verbesserung.
```
