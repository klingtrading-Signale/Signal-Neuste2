# OKX v5 – Upload & fertig (interaktiver Fallback)

**Ziel:** Keine HTML-Änderung nötig. Falls dein Markt-Select oder die Felder anders heißen, kannst du sie einmalig im Browser zuordnen (Button „Felder zuordnen“). Die Zuordnung wird lokal gespeichert.

## Dateien
- `api/okx/symbols.js`, `api/okx/daily.js`, `api/okx/vp-chunk.js`
- `binance-auto.js` (mit Mapper)
- `binance-vp.js` (no-op)
- `ajs-okx-selftest.html`

## Vorgehen
1) Alles in den `main`-Branch hochladen (bei Next.js die .js & .html in `/public`).
2) Seite öffnen → unten rechts erscheint **„AJS Auto-Fill“**.
3) Klicke **„Felder zuordnen“** und tippe nacheinander an:
   1. Markt-Auswahl
   2. Preis
   3. Funding
   4. OI
   5. Open
   6. High
   7. Low
   8. ATR
4) Fertig. Auswahl BTC/ETH/SOL füllt die Felder automatisch.

## Testseite
- `https://DEINE-DOMAIN/ajs-okx-selftest.html` – wenn dort alles füllt, ist die API ok.
