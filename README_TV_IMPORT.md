# TradingView‑Import (Copy‑Paste oder .txt Upload)

Dieses kleine Add‑on erlaubt dir, die Werte aus deinem TradingView‑Indikator direkt in die Web‑App zu **einfügen** (Copy‑Paste) oder als **.txt** zu **hochladen**. Es verändert dein Design nicht.

## Installation (3 Schritte)
1) Diese zwei Dateien in dein Repo (Branch `main`) hochladen:
   - `tv-import.js`
   - `tv-import.css`
2) In deiner `index.html` **im `<head>`** einfügen:
   ```html
   <link rel="stylesheet" href="./tv-import.css">
   ```
3) **Ganz unten** vor `</body>` einfügen:
   ```html
   <script src="./tv-import.js"></script>
   ```

Fertig. Links unten erscheint ein kleiner Button **„TV‑Import“**.

## Benutzung
1) In TradingView den Text aus deiner Label‑Box kopieren (der mit „Datum:, Markt:, Aktueller Kurs:“ usw.).
2) In der Web‑App: **„TV‑Import“ → Text einfügen → „Übernehmen“.**
3) Alternativ: **.txt Datei** mit dem Inhalt hochladen.

## Welche Felder werden befüllt?
- `market` (Dropdown; es wird versucht, den passenden Eintrag zu wählen, z. B. „BTC“)
- `date` (falls vorhanden)
- `cPrice` = „Aktueller Kurs“
- `cOpen`  = „Eröffnung“
- `cHigh`  = „Vortageshoch“
- `cLow`   = „Vortagestief“
- `cATR`   = „ATR (Daily, 14)“

> Die Feldsuche akzeptiert **ID**, **name** oder **data-ajs**‑Attribut. Beispiel: `<input data-ajs="cPrice">`

## Format des Textes
Kompatibel mit deinem Pine‑Script („Tägliche Marktdaten (V‑Final)“):
```
Datum: 2025-08-30
Markt: BTCUSDT
Aktueller Kurs: 61234.5
--- Vortag ---
Vortageshoch: 62300
Vortagestief: 60000
Settlement: 61000
--- Aktueller Tag ---
Eröffnung: 61200
Tageshoch: 62000
Tagestief: 60500
--- Volatilität ---
ATR (Daily, 14): 800.25
```
Dezimaltrennzeichen **Komma** oder **Punkt** werden automatisch erkannt.

## Optional
Falls deine Felder anders heißen, gib ihnen ein `data-ajs`‑Attribut, z. B.:
```html
<input data-ajs="cPrice">
```
Dann findet der Importer sie ohne weitere Änderungen.
