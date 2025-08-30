# OKX v4 – Upload & fertig (keine HTML-Änderung nötig)

## Was hochladen?
- `api/okx/symbols.js`
- `api/okx/daily.js`
- `api/okx/vp-chunk.js`  (VP derzeit deaktiviert)
- `binance-auto.js`     (füllt Felder, erkennt BTC/ETH/SOL usw. auch mit "BTCUSDT", "BTC-USDT", "... (Perp)" usw.)
- `binance-vp.js`       (no-op)
- `ajs-okx-selftest.html` (Testseite)

## Wohin?
**Immer in den `main`-Branch** deines Repos.
- In Next.js/Vercel: Die beiden JS-Dateien am besten in `/public` legen, die API-Dateien genau unter `/api/okx/*`.
- In einer statischen Seite: Lege die JS-Dateien neben deine `index.html`.

## Keine HTML-Änderungen erforderlich
- Die JS-Dateien benutzen automatisch `https://DEINE-DOMAIN/api/okx` (via `location.origin`).
- Voraussetzung: Deine Seite lädt die Dateien `binance-auto.js` und `binance-vp.js`. Wenn du sie bisher schon eingebunden hattest, musst du nichts weiter tun (nur überschreiben).

## Test
1) Öffne: `https://DEINE-DOMAIN/api/okx/daily?symbol=BTC` → JSON? Gut.
2) Öffne: `https://DEINE-DOMAIN/ajs-okx-selftest.html` → BTC wählen → Felder füllen sich.
3) In deiner App: Im Market-Dropdown BTC/ETH/SOL wählen → Felder füllen sich automatisch.
