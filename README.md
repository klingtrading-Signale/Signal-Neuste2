# AJS Binance Connector (USDⓈ-M Perpetuals)

**Ziel:** Auto-Dropdown + Auto-Fill (Funding/Preis/OI%/H-L/Open/ATR) + *präzises* Volume-Profile (POC/VAH/VAL) für Krypto, ohne dein Design/Logik zu verändern.

## Dateien (einfach ins Projekt kopieren)
- `binance-auto.js` — lädt Symbole & füllt Tagesdaten bei Marktwechsel
- `binance-vp.js` — berechnet POC/VAH/VAL aus aggTrades des Vortags (UTC)
- `patch_snippets/head_inject.html` — Snippet für den `<head>`
- `patch_snippets/body_inject.html` — Snippet für das Ende des `<body>`
- `CHECKLIST.md` — Kurze Prüfliste

## 1) Worker-URL eintragen
Öffne deine **`index.html`**, füge im `<head>` ein (URL ggf. anpassen):
```html
<script>
  window.AJS_BINANCE_PROXY = "https://binanceverbindung.martkling6.workers.dev";
</script>
```

## 2) Skripte laden
Am Ende der Seite (vor `</body>`) einfügen:
```html
<script src="./binance-auto.js"></script>
<script src="./binance-vp.js"></script>
```
> **Vercel/Next.js:** Lege beide Dateien in `/public` und binde sie als `/binance-auto.js` & `/binance-vp.js` ein.

## 3) Nutzung
- Im Dropdown `#market` z. B. **BTC** auswählen → es füllt automatisch:
  - **cPrice** (Mark-Price), **cFunding** (dezimal), **cOI** (%),
  - **cOpen** (heutige UTC-Eröffnung), **cHigh/Low** (Vortag), **cATR** (ATR14, Daily).
- Nach kurzer Zeit erscheinen **cPOC / cVAH / cVAL** (präzises VP, 70% Value-Area).

## 4) Hinweise
- VP zieht den Vortag in 5‑Min‑Chunks; je nach Volumen dauert es kurz, bis die drei Werte gesetzt sind.
- Volumenbasis ist **USDT** (Quote). Für Kontrakte stelle in `binance-vp.js` `vol=base`.
- Die Tageswerte (ATR, Open, H/L) basieren auf **Binance 1d Klines (UTC)**.
- Deine vorhandene Logik/Styles werden **nicht** überschrieben; es werden nur Optionen angehängt und Felder befüllt.

## 5) Troubleshooting
- **Nichts passiert:** Proxy-URL korrekt im `<head>`? (Konsole: `window.AJS_BINANCE_PROXY`).  
- **Scripts 404:** Pfade anpassen (`./…` bei statisch, `/…` bei Vercel/Next in `/public`).  
- **Dropdown-ID:** Muss `id="market"` heißen.  
- **Worker 403 zu Binance:** Du nutzt bereits einen Worker mit UA-Headern. Alternativ Vercel-Functions verwenden.

Viel Erfolg! ✨
