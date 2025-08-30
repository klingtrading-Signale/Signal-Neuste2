export const config = { runtime: "edge", regions: ["iad1"] };

export default async function handler(request) {
  const CORS = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "Content-Type",
    "access-control-allow-methods": "GET,OPTIONS"
  };
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    const r = await fetch("https://www.okx.com/api/v5/public/instruments?instType=SWAP", {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0" }
    });
    if (!r.ok) return new Response(await r.text(), { status: r.status, headers: CORS });
    const j = await r.json();
    const list = (j.data || [])
      .filter(s => s.settleCcy === "USDT")
      .map(s => ({ symbol: s.instId, base: s.instId.split("-")[0] }));
    return new Response(JSON.stringify(list), { headers: { "content-type":"application/json", ...CORS } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
}
