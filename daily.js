export const config = { runtime: "edge", regions: ["iad1"] };

export default async function handler(request) {
  const CORS = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "Content-Type",
    "access-control-allow-methods": "GET,OPTIONS"
  };
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const url = new URL(request.url);
    const base = (url.searchParams.get("symbol") || "BTC").toUpperCase();
    const instId = `${base}-USDT-SWAP`;

    const ua = { headers: { accept: "application/json", "user-agent": "Mozilla/5.0" } };

    // Price (last)
    const tkr = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${instId}`, ua);
    if (!tkr.ok) return new Response(await tkr.text(), { status: tkr.status, headers: CORS });
    const tj = await tkr.json();
    const t = (tj.data && tj.data[0]) || {};
    const price = +(t.last || 0);

    // Funding rate
    const fr = await fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`, ua);
    if (!fr.ok) return new Response(await fr.text(), { status: fr.status, headers: CORS });
    const fj = await fr.json();
    const f = (fj.data && fj.data[0]) || {};
    const funding = +(f.fundingRate || 0);

    // Open Interest (USDT)
    const oi = await fetch(`https://www.okx.com/api/v5/public/open-interest?instId=${instId}`, ua);
    if (!oi.ok) return new Response(await oi.text(), { status: oi.status, headers: CORS });
    const oij = await oi.json();
    const o = (oij.data && oij.data[0]) || {};
    const oi_usd = +(o.oiCcy || 0);
    const oi_pct = null;

    // Daily candles (1D)
    const kl = await fetch(`https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=1D&limit=16`, ua);
    if (!kl.ok) return new Response(await kl.text(), { status: kl.status, headers: CORS });
    const kj = await kl.json();
    const arr = (kj.data || []).map(r => ({
      ts: +r[0], open: +r[1], high: +r[2], low: +r[3], close: +r[4]
    })).sort((a,b)=>a.ts-b.ts);
    const n = arr.length;
    const todayOpen = n ? arr[n-1].open : 0;
    const prevHigh  = n>1 ? arr[n-2].high : 0;
    const prevLow   = n>1 ? arr[n-2].low  : 0;

    // ATR(14)
    let atr = null;
    if (n >= 15) {
      const TR = [];
      for (let i=1;i<n;i++){
        const h=arr[i].high, l=arr[i].low, pc=arr[i-1].close;
        TR.push(Math.max(h-l, Math.abs(h-pc), Math.abs(l-pc)));
      }
      let a = TR.slice(0,14).reduce((s,v)=>s+v,0)/14;
      for (let i=14;i<TR.length;i++) a=(a*13+TR[i])/14;
      atr=a;
    }

    const out = { symbol: base, price, funding, oi_usd, oi_pct, prev_high: prevHigh, prev_low: prevLow, today_open: todayOpen, atr14: atr };
    return new Response(JSON.stringify(out), { headers: { "content-type":"application/json", ...CORS } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
}
