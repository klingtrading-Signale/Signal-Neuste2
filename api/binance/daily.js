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
    const symbol = base + "USDT";
    const ua = { headers: { accept: "application/json", "user-agent": "Mozilla/5.0" } };

    const r1 = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`, ua);
    if (!r1.ok) return new Response(await r1.text(), { status: r1.status, headers: CORS });
    const j1 = await r1.json();
    const price   = +j1.markPrice || 0;
    const funding = +j1.lastFundingRate || 0;

    let r2 = await fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=5m&limit=1`, ua);
    if (!r2.ok) r2 = await fetch(`https://www.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=5m&limit=1`, ua);
    if (!r2.ok) return new Response(await r2.text(), { status: r2.status, headers: CORS });
    const a2 = await r2.json();
    const last = Array.isArray(a2) ? a2[a2.length - 1] : null;
    const oiUsd  = +(last?.sumOpenInterestValue || 0);
    const supply = +(last?.CMCCirculatingSupply || 0);
    const mcap = (supply > 0 && price > 0) ? price * supply : null;
    const oiPct = mcap ? (oiUsd / mcap) * 100 : null;

    const r3 = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1d&limit=15`, ua);
    if (!r3.ok) return new Response(await r3.text(), { status: r3.status, headers: CORS });
    const k = await r3.json(); const n = k.length;
    const today = k[n-1], yday = k[n-2];
    const todayOpen = +(today?.[1] || 0);
    const prevHigh  = +(yday?.[2]  || 0);
    const prevLow   = +(yday?.[3]  || 0);

    // ATR(14) Wilder
    let atr = null;
    if (n >= 15) {
      const H=k.map(c=>+c[2]), L=k.map(c=>+c[3]), C=k.map(c=>+c[4]);
      const TR=[];
      for (let i=1;i<n;i++){
        const h=H[i], l=L[i], pc=C[i-1];
        TR.push(Math.max(h-l, Math.abs(h-pc), Math.abs(l-pc)));
      }
      let a = TR.slice(0,14).reduce((s,v)=>s+v,0)/14;
      for (let i=14;i<TR.length;i++) a=(a*13+TR[i])/14;
      atr=a;
    }

    const out = { symbol: base, price, funding, oi_usd: oiUsd, oi_pct: oiPct,
                  prev_high: prevHigh, prev_low: prevLow, today_open: todayOpen, atr14: atr };
    return new Response(JSON.stringify(out), { headers: { "content-type":"application/json", ...CORS } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
}
