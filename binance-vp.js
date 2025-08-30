// ajs- VP (OKX default proxy) v3 – aktuell deaktiviert (API liefert 501), Frontend überspringt es
(function(){
  const AJS = window.AJS || (window.AJS = {});
  const DEFAULT_PROXY = (typeof location!=="undefined" ? (location.origin + "/api/okx") : "");
  const PROXY = (window.AJS_BINANCE_PROXY || DEFAULT_PROXY).replace(/\/$/,"");

  async function tryVP(){
    try{
      const now = new Date();
      const base = (document.getElementById("market")?.value || "").toUpperCase() || "BTC";
      const symbol = base + "-USDT-SWAP";
      const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()-1, 0,0,0,0);
      const end   = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()-1, 24,0,0,0);
      const r = await fetch(`${PROXY}/vp-chunk?symbol=${encodeURIComponent(symbol)}&start=${start}&end=${end}&vol=quote`);
      if (!r.ok) return; // 501 -> ignorieren
      const j = await r.json();
      // Hier könnte man in Zukunft das VP auswerten.
    }catch(e){ /* ignorieren */ }
  }
  document.addEventListener("DOMContentLoaded", ()=> setTimeout(tryVP, 1000));
})();
