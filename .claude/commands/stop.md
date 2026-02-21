# Server stoppen

Beendet ALLE laufenden Development Server und Node-Prozesse.

## Verhalten

Alle folgenden Schritte ausfuehren:

```bash
# 1. Bekannte Dev-Ports killen (Backend, Frontend, Drizzle Studio, etc.)
npx kill-port 3001 5173 4983

# 2. Alle Node-Prozesse beenden (Windows)
taskkill //F //IM node.exe 2>/dev/null

# 3. Alle laufenden Background-Tasks in dieser Session stoppen
```

Nach Ausfuehrung bestaetigen welche Prozesse beendet wurden.
