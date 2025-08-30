
// ajs- Binance auto dropdown + auto-fill (USDⓈ-M Perpetuals)
(function(){
  const $ = (id)=>document.getElementById(id);
  const PROXY = (window.AJS_BINANCE_PROXY || "").replace(/\/$/,"");
  const KNOWN_BASES = ["BTC","ETH","SOL","XRP","BNB","DOGE","ADA","TRX","TON","LINK","AVAX","MATIC","DOT","LTC","BCH","SHIB","NEAR","APT","SUI","SEI","ARB","OP","PEPE","BONK","WIF"];

  async function getJSON(url){
    const r = await fetch(url, { headers: { "accept":"application/json" } });
    if(!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }

  async function loadSymbols(){
    const url = PROXY + "/symbols";
    return getJSON(url);
  }

  function ensureCryptoOptions(select, symbols){
    if(!select) return;
    const existing = new Set(Array.from(select.options).map(o=>o.value));
    const prefer = [], rest = [];
    symbols.forEach(s=>{
      const val = s.base || ""; const text = s.symbol ? (s.symbol + " (Perp)") : val;
      if(!val || existing.has(val)) return;
      (KNOWN_BASES.includes(val) ? prefer : rest).push({val, text});
    });
    const add = (o)=>{ const opt=document.createElement("option"); opt.value=o.val; opt.textContent=o.text; select.appendChild(opt); };
    prefer.forEach(add); rest.sort((a,b)=>a.val.localeCompare(b.val)).forEach(add);
  }

  function patchIsCrypto(){
    try{
      const orig = window.isCrypto;
      window.isCrypto = function(m){ if(orig && orig(m)) return true; return /^[A-Z]{2,6}$/.test(m); };
    }catch(e){}
  }

  async function fetchDaily(base){
    return getJSON(PROXY + "/daily?symbol=" + encodeURIComponent(base) + "&vp=0");
  }

  function fillCryptoFields(d){
    if(!d) return;
    const c = (x,n)=> (x!=null ? Number(x).toFixed(n) : "");
    if (document.getElementById("cPrice"))   document.getElementById("cPrice").value   = c(d.price,2);
    if (document.getElementById("cFunding")) document.getElementById("cFunding").value = c(d.funding,6);
    if (document.getElementById("cOI"))      document.getElementById("cOI").value      = c(d.oi_pct,2);
    if (document.getElementById("cOpen"))    document.getElementById("cOpen").value    = c(d.today_open,2);
    if (document.getElementById("cHigh"))    document.getElementById("cHigh").value    = c(d.prev_high,2);
    if (document.getElementById("cLow"))     document.getElementById("cLow").value     = c(d.prev_low,2);
    if (document.getElementById("cATR"))     document.getElementById("cATR").value     = c(d.atr14,4);
  }

  async function autoFillIfCrypto(){
    const m = document.getElementById("market")?.value || "";
    if(!m) return;
    if(!window.isCrypto || !window.isCrypto(m)) return;
    try{ const d = await fetchDaily(m); fillCryptoFields(d); }catch(e){ console.warn("Auto-fill failed:", e); }
  }

  document.addEventListener("DOMContentLoaded", async ()=>{
    patchIsCrypto();
    try{ const symbols = await loadSymbols(); ensureCryptoOptions(document.getElementById("market"), symbols); }catch(e){}
    document.getElementById("market")?.addEventListener("change", autoFillIfCrypto);
    autoFillIfCrypto();
  });
})();
