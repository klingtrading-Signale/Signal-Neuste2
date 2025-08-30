
# Binance Precise Volume Profile – Integration

Dieses Paket ergänzt dein Webtool um:
- **Auto-Dropdown** der **USDⓈ-M Perpetuals** (via `/symbols`).
- **Auto-Fill** (Funding, Preis, OI%, Vortag H/L, heutige Eröffnung, ATR14) (via `/daily`).
- **100% präzises Volume Profile (POC/VAH/VAL)** des Vortags (UTC) aus **aggTrades** – in Zeitfenstern, clientseitig zusammengeführt (via `/vp-chunk`).

## 1) Cloudflare Worker – Code

> Ersetze deinen Worker durch den folgenden Code (oder ergänze die neuen Routen).

```js
export default {
  async fetch(req) {
    const u = new URL(req.url);
    const path = u.pathname.replace(/\/+$/, "");

    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "Content-Type",
      "access-control-allow-methods": "GET,OPTIONS"
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    try {
      if (path === "/symbols") {
        const r = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo");
        if (!r.ok) return new Response(await r.text(), { status: r.status, headers: cors });
        const j = await r.json();
        const out = (j.symbols || [])
          .filter(s => s.contractType === "PERPETUAL" && s.quoteAsset === "USDT")
          .map(s => ({ symbol: s.symbol, base: s.baseAsset, tickSize: getTick(s.filters,"PRICE_FILTER") }));
        return new Response(JSON.stringify(out), { headers: { "content-type": "application/json", ...cors } });
      }

      if (path === "/daily") {
        const sym = (u.searchParams.get("symbol") || "BTC").toUpperCase();
        const symbol = sym + "USDT";

        // premiumIndex
        const r1 = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`);
        if (!r1.ok) return new Response(await r1.text(), { status: r1.status, headers: cors });
        const j1 = await r1.json();
        const price = Number(j1.markPrice ?? 0);
        const funding = Number(j1.lastFundingRate ?? 0);

        // OI USD
        let r2 = await fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=5m&limit=1`);
        if (!r2.ok) r2 = await fetch(`https://www.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=5m&limit=1`);
        if (!r2.ok) return new Response(await r2.text(), { status: r2.status, headers: cors });
        const arr = await r2.json();
        const latest = Array.isArray(arr) ? arr[arr.length - 1] : {};
        const oiUsd = Number(latest?.sumOpenInterestValue ?? 0);
        const supply = Number(latest?.CMCCirculatingSupply ?? 0);
        const mcap = (supply > 0 && price > 0) ? price * supply : null;
        const oiPct = (mcap ? (oiUsd / mcap) * 100 : null);

        // Daily klines for prev/today levels + ATR14
        const r3 = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1d&limit=15`);
        if (!r3.ok) return new Response(await r3.text(), { status: r3.status, headers: cors });
        const k = await r3.json();
        const n = k.length;
        const today = k[n-1]; const yday = k[n-2];
        const todayOpen = Number(today?.[1] ?? 0);
        const prevHigh  = Number(yday?.[2] ?? 0);
        const prevLow   = Number(yday?.[3] ?? 0);

        let atr = null;
        if (n >= 15) {
          const highs = k.map(c => Number(c[2]));
          const lows  = k.map(c => Number(c[3]));
          const closes= k.map(c => Number(c[4]));
          const TR = [];
          for (let i=1; i<n; i++) {
            const h = highs[i], l = lows[i], pc = closes[i-1];
            const tr = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
            TR.push(tr);
          }
          let atrFirst = 0;
          for (let i=0; i<14; i++) atrFirst += TR[i];
          atrFirst /= 14;
          let atrVal = atrFirst;
          for (let i=14; i<TR.length; i++) atrVal = (atrVal * 13 + TR[i]) / 14;
          atr = atrVal;
        }

        return new Response(JSON.stringify({
          symbol: sym,
          price, funding, oi_usd: oiUsd, oi_pct: oiPct,
          prev_high: prevHigh, prev_low: prevLow,
          today_open: todayOpen, atr14: atr
        }), { headers: { "content-type": "application/json", ...cors } });
      }

      if (path === "/vp-chunk") {
        const symbol = u.searchParams.get("symbol") || "BTCUSDT";
        const start = Number(u.searchParams.get("start"));
        const end   = Number(u.searchParams.get("end"));
        const vol   = (u.searchParams.get("vol") || "quote"); // "quote"|"base"
        if (!start || !end || end <= start) {
          return new Response(JSON.stringify({ error: "invalid window" }), { status: 400, headers: cors });
        }

        // Tick size
        const ex = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo");
        const exj = await ex.json();
        const s = (exj.symbols||[]).find(x=>x.symbol===symbol);
        const tick = Number(getTick(s?.filters, "PRICE_FILTER")) || 0.1;

        let fromId = undefined;
        const bins = new Map();
        let reqCount = 0;
        while (true) {
          reqCount++; if (reqCount > 40) break; // safety
          const url = new URL("https://fapi.binance.com/fapi/v1/aggTrades");
          url.searchParams.set("symbol", symbol);
          url.searchParams.set("startTime", String(start));
          url.searchParams.set("endTime",   String(end));
          url.searchParams.set("limit", "1000");
          if (fromId) url.searchParams.set("fromId", String(fromId));
          const r = await fetch(url, { headers: { accept: "application/json" } });
          if (!r.ok) break;
          const arr = await r.json();
          if (!Array.isArray(arr) || arr.length === 0) break;
          for (const t of arr) {
            const price = Number(t.p), qty = Number(t.q), qvol = Number(t.Q);
            const bin   = Math.round(price / tick) * tick;
            const volVal = (vol === "base") ? qty : qvol;
            bins.set(bin, (bins.get(bin) || 0) + volVal);
          }
          const last = arr[arr.length-1];
          fromId = Number(last.a) + 1;
          if (Number(last.T) >= end) break;
        }

        const out = Array.from(bins.entries()).map(([p,v])=>[Number(p), Number(v)]).sort((a,b)=>a[0]-b[0]);
        return new Response(JSON.stringify({ bins: out, tick }), { headers: { "content-type": "application/json", ...cors } });
      }

      return new Response("Not found", { status: 404, headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
    }
  }
}

function getTick(filters, type){
  if(!filters) return null;
  const f = filters.find(x=>x.filterType===type);
  return f ? f.tickSize : null;
}
```

## 2) App anpassen
- In `index.html` **einmalig** setzen:
  ```html
  <script>window.AJS_BINANCE_PROXY="https://YOUR-WORKER.workers.dev";</script>
  ```
- Am Ende der Seite einbinden:
  ```html
  <script src="./binance-auto.js"></script>
  <script src="./binance-vp.js"></script>
  ```

## 3) Nutzung
- Markt auswählen (z. B. **BTC**) → App lädt automatisch USDⓈ-M Perps ins Dropdown, füllt Funding/Preis/OI%/Levels/ATR und berechnet **präzise** POC/VAH/VAL des Vortags (UTC).

## 4) Performance / Tipps
- Die VP‑Berechnung holt den Vortag in **5‑Min‑Chunks** (288 Requests an den Worker, je 1–40 Subrequests). Das ist robust und Worker‑limit‑freundlich.
- Bei außergewöhnlich hohem Volumen die Fenstergröße auf **2 Minuten** reduzieren (in `binance-vp.js` `stepMs` ändern) für mehr Sicherheit.
- Volumenbasis: Standard ist **Quote (USDT)**. Für **Kontrakte** ändere `vol=base` im Frontend‑Call.

