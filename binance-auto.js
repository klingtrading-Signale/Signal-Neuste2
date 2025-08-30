// ajs- Auto-fill v4 (OKX default; robust base parsing)
(function(){
  const DEFAULT_PROXY = (typeof location!=="undefined" ? (location.origin + "/api/okx") : "");
  const PROXY = (window.AJS_BINANCE_PROXY || DEFAULT_PROXY).replace(/\/$/,"");

  function sel(){ return document.getElementById("market") || document.querySelector("[name='market']"); }
  function getText(el){
    if(!el) return "";
    const opt = el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null;
    return ((opt && (opt.textContent || opt.innerText)) || el.value || "").toUpperCase().trim();
  }
  function parseBase(raw){
    if(!raw) return "";
    // Patterns we accept:
    // BTC, BTCUSDT, BTC-USDT, BTC/USDT, BTC-USDT-SWAP, BTCUSDT.P
    let m;
    if ((m = raw.match(/^([A-Z]{2,6})\s*(?:USDT|USD|PERP|SWAP)?$/))) return m[1];
    if ((m = raw.match(/^([A-Z]{2,6})[-/_.]?(?:USDT|USD)(?:-PERP|-SWAP)?$/))) return m[1];
    if ((m = raw.match(/^([A-Z]{2,6})\s*\(PERP\)$/))) return m[1];
    // Text like "BTCUSDT (Perp)"
    if ((m = raw.match(/^([A-Z]{2,6})(?:USDT|USD).*/))) return m[1];
    return "";
  }
  function pickField(id){
    return document.getElementById(id)
        || document.querySelector(`[name="${id}"]`)
        || document.querySelector(`[data-ajs="${id}"]`)
        || null;
  }
  function put(id, v, d){ const el=pickField(id); if(el && v!=null && isFinite(v)) el.value = Number(v).toFixed(d); }

  async function daily(base){
    const u = PROXY + "/daily?symbol=" + encodeURIComponent(base||"BTC");
    const r = await fetch(u, { headers: {accept:"application/json"} });
    if(!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }
  async function fillNow(){
    const e = sel(); if(!e) return;
    const base = parseBase(getText(e));
    if(!base) return;
    try{
      const d = await daily(base);
      put("cPrice", d.price, 2);
      put("cFunding", d.funding, 6);
      put("cOI", d.oi_pct, 2);
      put("cOpen", d.today_open, 2);
      put("cHigh", d.prev_high, 2);
      put("cLow", d.prev_low, 2);
      put("cATR", d.atr14, 4);
    }catch(_){ /* ignore */ }
  }
  document.addEventListener("DOMContentLoaded", ()=>{
    setTimeout(fillNow, 300);
    const e = sel();
    if (e) e.addEventListener("change", fillNow);
    // fallback: poll in case framework replaces the element
    setInterval(fillNow, 2000);
  });
})();
