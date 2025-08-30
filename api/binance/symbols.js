export const config = { runtime: "edge", regions: ["iad1"] };

export default async function handler(request) {
  const CORS = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "Content-Type",
    "access-control-allow-methods": "GET,OPTIONS"
  };
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const r = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo", {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0" }
    });
    if (!r.ok) return new Response(await r.text(), { status: r.status, headers: CORS });
    const j = await r.json();
    const out = (j.symbols || [])
      .filter(s => s.contractType === "PERPETUAL" && s.quoteAsset === "USDT")
      .map(s => ({ symbol: s.symbol, base: s.baseAsset }));
    return new Response(JSON.stringify(out), { headers: { "content-type": "application/json", ...CORS } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
}
