export const config = { runtime: "edge", regions: ["iad1"] };

export default async function handler(request) {
  const CORS = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "Content-Type",
    "access-control-allow-methods": "GET,OPTIONS"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }
  try {
    const url = new URL(request.url);
    const base = (url.searchParams.get("symbol") || "BTC").toUpperCase();
    const symbol = base + "USDT";
    const ua = { headers: { accept: "application/json", "user-agent": "Mozilla/5.0" } };

    // Funding & Mark Price
    const r1 = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`, ua);
    if (!r1.ok) return http(r1.status, await r1.text(), CORS);
    const j1 = await r1.json();
    const price   = num(j1.markPrice);
    const funding = num(j1.lastFundingRate);

    // Open Interest USD (and supply for OI% where available)
    let r2 = await fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=5m&limit=1`, ua);
    if (!r2.ok) r2 = await fetch(`https://www.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=5m&limit=1`, ua);
    if (!r2.ok) return http(r2.status, await r2.text(), CORS);
    const a2 = await r2.json();
    const last = Array.isArray(a2) ? a2[a2.length - 1] : null;
    const oiUsd  = num(last && last.sumOpenInterestValue);
    const supply = num(last && last.CMCCirculatingSupply);
    const mcap = (supply > 0 && price > 0) ? price * supply : null;
    const oiPct = mcap ? (oiUsd / mcap) * 100 : null;

    // Daily Klines for prev H/L, today open, ATR(14)
    const r3 = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1d&limit=15`, ua);
    if (!r3.ok) return http(r3.status, await r3.text(), CORS);
    const k = await r3.json();
    const n = k.length;
    const today = k[n - 1], yday = k[n - 2];
    const todayOpen = num(today && today[1]);
    const prevHigh  = num(yday && yday[2]);
    const prevLow   = num(yday && yday[3]);

    // ATR(14) Wilder
    let atr = null;
    if (n >= 15) {
      const H = k.map(c => num(c[2]));
      const L = k.map(c => num(c[3]));
      const C = k.map(c => num(c[4]));
      const TR = [];
      for (let i = 1; i < n; i++) {
        const h = H[i], l = L[i], pc = C[i - 1];
        TR.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
      }
      let a = TR.slice(0, 14).reduce((s, v) => s + v, 0) / 14;
      for (let i = 14; i < TR.length; i++) a = (a * 13 + TR[i]) / 14;
      atr = a;
    }

    return json({
      symbol: base,
      price, funding,
      oi_usd: oiUsd, oi_pct: oiPct,
      prev_high: prevHigh, prev_low: prevLow,
      today_open: todayOpen, atr14: atr
    }, CORS);
  } catch (e) {
    return http(500, JSON.stringify({ error: String(e) }), CORS);
  }
}

function num(x) { const n = Number(x); return Number.isFinite(n) ? n : 0; }
function json(data, headers, code = 200) {
  return new Response(JSON.stringify(data), {
    status: code,
    headers: { "content-type": "application/json", ...headers }
  });
}
function http(code, body, headers) {
  return new Response(body, { status: code, headers });
}
