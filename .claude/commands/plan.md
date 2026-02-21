# Standalone Implementierungsplan

Strukturierter Plan OHNE Implementierung. Plan-First Prinzip.

## Usage

/plan #123 # Plan für Issue
/plan "Thema" # Plan für freies Thema

## Workflow

### 1. Context laden

- Issue lesen (Titel, Body, Labels, AC)
- Relevante Docs + Code erkunden (Grep, Read)
- Bestehende Patterns identifizieren

### 2. Plan schreiben

**Format:**
| Sektion | Inhalt |
|---------|--------|
| **Ziel** | Was soll erreicht werden? |
| **Scope** | Drin / Nicht drin (Feature-Creep verhindern) |
| **Dateien** | Tabelle: Datei, Änderung, Neu/Modify |
| **Reihenfolge** | Nummerierte Schritte mit Abhängigkeiten |
| **Risiken** | Tabelle: Risiko, Impact, Mitigation |
| **Testplan** | Wie verifizieren? |

Bei >5 Dateien oder neuem Pattern: **Multi-Sprint** mit Sprint-Breakdown.

### 3. Praesentieren

- Plan dem User zeigen
- Auf Freigabe warten
- KEINE Implementierung starten

## Regeln

- KEIN Code schreiben - nur planen
- Scope klar definieren (was ist NICHT drin)
- Eine konkrete Empfehlung, keine Optionen-Listen
- Bei DB-Änderungen: Migration-Plan
- Bei API-Änderungen: Contract/Types definieren

## Verwandte Commands

| Command      | Unterschied                                   |
| ------------ | --------------------------------------------- |
| `/feature`   | Plant + implementiert (End-to-End)            |
| `/work #123` | Plant + implementiert mit Arbeitsplan-Kontext |
| `/plan #123` | NUR Plan, keine Implementierung               |
