# AJS Binance Connector v2 (mit Self-Test)

## Dateien
- `binance-auto.js` – robustes Auto-Dropdown + Tagesdaten
- `binance-vp.js` – präzises VP (POC/VAH/VAL)
- `ajs-selftest.html` – **Testseite**, die nur diese beiden Dateien nutzt
- `README.md` – diese Anleitung

## Einbau
1) Lege `binance-auto.js` & `binance-vp.js` ins Projekt (bei Vercel/Next in `/public`).  
2) In deiner Seite im `<head>`:
   ```html
   <script>window.AJS_BINANCE_PROXY="https://binanceverbindung.martkling6.workers.dev";</script>
   ```
3) Ende der Seite:
   ```html
   <script src="./binance-auto.js"></script>
   <script src="./binance-vp.js"></script>
   ```
   (Bei `/public`: `/binance-auto.js` usw.)

## Self-Test nutzen
- Lade `ajs-selftest.html` ebenfalls ins Projekt (bei Vercel/Next in `/public` → Aufruf über `/ajs-selftest.html`).  
- Öffne die Seite, wähle **BTC** → Felder füllen sich.  
- Wenn der Self-Test klappt, ist dein Worker ok. Falls es in deiner echten Seite nicht klappt, sind es meist **Pfad/ID**-Themen.

## Debug-Hinweise
- Konsole zeigt Logs mit Präfix `[ajs:auto]` und `[ajs:vp]`.
- Prüfe `window.AJS_BINANCE_PROXY` in der Konsole.
- Network-Tab: `binance-auto.js` & `binance-vp.js` müssen 200 laden.
