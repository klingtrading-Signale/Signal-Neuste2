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
    const symbol = url.searchParams.get("symbol") || "BTCUSDT";
    const start  = Number(url.searchParams.get("start"));
    const end    = Number(url.searchParams.get("end"));
    const vol    = (url.searchParams.get("vol") || "quote");
    if (!start || !end || end <= start) return http(400, JSON.stringify({ error: "invalid window" }), CORS);

    const ua = { headers: { accept: "application/json", "user-agent": "Mozilla/5.0" } };

    const ex = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo", ua);
    if (!ex.ok) return http(ex.status, await ex.text(), CORS);
    const exj = await ex.json();
    const info = (exj.symbols || []).find(s => s.symbol === symbol);
    const tick = Number(((info && info.filters) || []).find(f => f.filterType === "PRICE_FILTER")?.tickSize || 0.1);

    let fromId = undefined;
    const bins = new Map();
    let loops = 0;

    while (true) {
      loops++; if (loops > 40) break;
      const u = new URL("https://fapi.binance.com/fapi/v1/aggTrades");
      u.searchParams.set("symbol", symbol);
      u.searchParams.set("startTime", String(start));
      u.searchParams.set("endTime",   String(end));
      u.searchParams.set("limit", "1000");
      if (fromId) u.searchParams.set("fromId", String(fromId));

      const r = await fetch(u.toString(), ua);
      if (!r.ok) break;
      const arr = await r.json();
      if (!Array.isArray(arr) || arr.length === 0) break;
      for (const t of arr) {
        const price = Number(t.p), qty = Number(t.q), qvol = Number(t.Q);
        const bin = Math.round(price / tick) * tick;
        const v = (vol === "base") ? qty : qvol;
        bins.set(bin, (bins.get(bin) || 0) + v);
      }
      const last = arr[arr.length - 1];
      fromId = Number(last.a) + 1;
      if (Number(last.T) >= end) break;
    }

    const out = Array.from(bins.entries()).map(([p, v]) => [Number(p), Number(v)]).sort((a, b) => a[0] - b[0]);
    return json({ bins: out, tick }, CORS);
  } catch (e) {
    return http(500, JSON.stringify({ error: String(e) }), CORS);
  }
}

function json(data, headers, code = 200) {
  return new Response(JSON.stringify(data), {
    status: code,
    headers: { "content-type": "application/json", ...headers }
  });
}
function http(code, body, headers) {
  return new Response(body, { status: code, headers });
}
