// ajs- Binance auto dropdown + auto-fill (USDⓈ-M Perpetuals)
// Minimal-invasiv: hängt Optionen an #market an und füllt Felder, ohne bestehende Logik zu verändern.
(function(){
  const $ = (id)=>document.getElementById(id);
  const PROXY = (window.AJS_BINANCE_PROXY || "https://binanceverbindung.martkling6.workers.dev").replace(/\/$/,"");
  const KNOWN_BASES = ["BTC","ETH","SOL","XRP","BNB","DOGE","ADA","TRX","TON","LINK","AVAX","MATIC","DOT","LTC","BCH","SHIB","NEAR","APT","SUI","SEI","ARB","OP","PEPE","BONK","WIF"];

  async function getJSON(url){
    const r = await fetch(url, { headers: { "accept": "application/json" } });
    if(!r.ok) throw new Error("HTTP "+r.status+" "+url);
    return r.json();
  }

  async function loadSymbols(){
    return getJSON(PROXY + "/symbols");
  }

  function ensureCryptoOptions(select, symbols){
    if(!select || !Array.isArray(symbols)) return;
    const existing = new Set(Array.from(select.options).map(o=>o.value));
    const prefer = [], rest = [];
    for(const s of symbols){
      const val = s?.base;
      const text = s?.symbol ? (s.symbol + " (Perp)") : val;
      if(!val || existing.has(val)) continue;
      (KNOWN_BASES.includes(val) ? prefer : rest).push({val, text});
    }
    const add = (o)=>{ const opt=document.createElement("option"); opt.value=o.val; opt.textContent=o.text; select.appendChild(opt); };
    prefer.forEach(add);
    rest.sort((a,b)=>a.val.localeCompare(b.val)).forEach(add);
  }

  // Sanftes Patchen: akzeptiere neue Crypto-Bases ohne alte Logik zu brechen
  function patchIsCrypto(){
    try{
      const orig = window.isCrypto;
      window.isCrypto = function(m){
        if (orig && orig(m)) return true;
        return typeof m==="string" && /^[A-Z]{2,6}$/.test(m); // BTC/ETH/...
      };
    }catch(e){ /* ignore */ }
  }

  async function fetchDaily(base){
    const url = PROXY + "/daily?symbol=" + encodeURIComponent((base||"BTC").toUpperCase());
    return getJSON(url);
  }

  function setVal(id, value, digits){
    const el = document.getElementById(id);
    if(!el || value==null || !isFinite(value)) return;
    el.value = Number(value).toFixed(digits);
  }

  function fillCryptoFields(d){
    if(!d) return;
    setVal("cPrice"  , d.price   , 2);
    setVal("cFunding", d.funding , 6); // dezimal (0.0015 = 0.15%)
    setVal("cOI"     , d.oi_pct  , 2); // Prozent
    setVal("cOpen"   , d.today_open, 2);
    setVal("cHigh"   , d.prev_high , 2);
    setVal("cLow"    , d.prev_low  , 2);
    setVal("cATR"    , d.atr14     , 4);
  }

  async function autoFillIfCrypto(){
    const m = $("#market")?.value || "";
    if(!m || !(window.isCrypto && window.isCrypto(m))) return;
    try{
      const d = await fetchDaily(m);
      fillCryptoFields(d);
    }catch(e){
      console.warn("[ajs] Auto-fill failed:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", async ()=>{
    patchIsCrypto();
    try{
      const symbols = await loadSymbols();
      ensureCryptoOptions($("#market"), symbols);
    }catch(e){ console.warn("[ajs] Symbol load failed:", e); }
    $("#market")?.addEventListener("change", autoFillIfCrypto);
    autoFillIfCrypto();
  });
})();
