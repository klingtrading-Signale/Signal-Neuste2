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
    const r = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo", {
      headers: { "accept": "application/json", "user-agent": "Mozilla/5.0" }
    });
    if (!r.ok) return http(r.status, await r.text(), CORS);
    const j = await r.json();
    const out = (j.symbols || [])
      .filter(s => s.contractType === "PERPETUAL" && s.quoteAsset === "USDT")
      .map(s => ({ symbol: s.symbol, base: s.baseAsset }));
    return json(out, CORS);
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
