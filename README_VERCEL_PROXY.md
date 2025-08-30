# Vercel Proxy für Binance (Edge Functions)

**Warum?** Dein Cloudflare-Worker trifft bei Binance-Futures in Europa oft auf **403 (CloudFront)**. Diese Edge-Funktionen laufen in der Region **US-East (iad1)** und umgehen das Problem.

## Dateien / Ordnerstruktur
```
/api/binance/symbols.js
/api/binance/daily.js
/api/binance/vp-chunk.js
```

## Einbau (ohne Programmierkenntnisse)
1. Öffne dein Repo auf **GitHub** → oben **Add file → Upload files**.
2. Zieh den **Ordner `api`** (aus dieser ZIP) ins Upload-Feld → **Commit changes**.
3. Vercel deployed automatisch. Deine neue Basis-URL ist:
   ```
   https://DEIN-PROJEKT-NAME.vercel.app/api/binance
   ```
   (oder deine eigene Domain mit `/api/binance` dahinter)

## Test
- `https://DEIN-PROJEKT.vercel.app/api/binance/symbols`
- `https://DEIN-PROJEKT.vercel.app/api/binance/daily?symbol=BTC`

## Frontend umstellen
In deiner `index.html` im `<head>`:
```html
<script>
  window.AJS_BINANCE_PROXY = "https://DEIN-PROJEKT.vercel.app/api/binance";
</script>
```
Dann Seite **neu laden** (Strg+F5).

## Hinweise
- CORS ist offen (`*`), damit dein Frontend überall zugreifen kann.
- Die VP-Funktion ruft `aggTrades` in ~40 Seiten; das kann je nach Volumen kurz dauern.
- Du brauchst **keine** Next.js-App – Vercel-Funktionen funktionieren auch in einem statischen Projekt.
