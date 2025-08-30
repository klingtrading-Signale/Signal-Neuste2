export const config = { runtime: "edge", regions: ["iad1"] };

export default async function handler(request) {
  const CORS = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "Content-Type",
    "access-control-allow-methods": "GET,OPTIONS"
  };
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
  return new Response(JSON.stringify({ error: "vp-chunk not implemented for OKX yet" }), { status: 501, headers: { "content-type":"application/json", ...CORS } });
}
