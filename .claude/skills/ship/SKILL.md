# Ship Skill

End-to-End: Code finalisieren, committen, pushen, Issue schliessen.

## Workflow

1. `npx tsc --noEmit` in backend/ und frontend/ (parallel)
2. ESLint-Fehler in geänderten Dateien fixen
3. `npm run build` ausführen
4. Bei Fehler: fixen und wiederholen (max 2x, dann --no-verify + User informieren)
5. EINEN Commit erstellen mit beschreibender Message
6. Push zum aktuellen Branch
7. Wenn Issue-Nummer angegeben: Issue mit `gh issue close` schliessen

## Input

- Optionale Issue-Nummer: `$ARGUMENTS` (z.B. `/ship #581`)

## Regeln

- IMMER nur EIN Commit
- Commit-Message auf Deutsch
- Bei --no-verify: explizit im Output erwaehnen was übersprungen wurde
