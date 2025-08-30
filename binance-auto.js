// ajs- Binance auto dropdown + auto-fill (robust) v2
(function(){ 
  const AJS = window.AJS || (window.AJS = {});
  AJS.log = (...a)=>console.log("[ajs:auto]", ...a);
  const PROXY = (window.AJS_BINANCE_PROXY || "https://binanceverbindung.martkling6.workers.dev").replace(/\/$/,"");
  const KNOWN_BASES = ["BTC","ETH","SOL","XRP","BNB","DOGE","ADA","TRX","TON","LINK","AVAX","MATIC","DOT","LTC","BCH","SHIB","NEAR","APT","SUI","SEI","ARB","OP","PEPE","BONK","WIF"];

  function $(sel){ return document.querySelector(sel); }
  function $id(id){ return document.getElementById(id); }

  function waitForEl(selector, timeout=8000){ 
    return new Promise((resolve, reject)=>{ 
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      const obs = new MutationObserver(()=>{ 
        const e = document.querySelector(selector);
        if (e) { obs.disconnect(); resolve(e); }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(()=>{ obs.disconnect(); reject(new Error("timeout waiting for "+selector)); }, timeout);
    });
  }

  async function getJSON(url){
    const r = await fetch(url, { headers: { "accept": "application/json" } });
    if(!r.ok) throw new Error("HTTP "+r.status+" "+url);
    return r.json();
  }

  async function loadSymbols(){
    const url = PROXY + "/symbols";
    AJS.log("fetch", url);
    return getJSON(url);
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
    AJS.log("added options:", prefer.length + rest.length);
  }

  function patchIsCrypto(){
    try{ 
      const orig = window.isCrypto;
      window.isCrypto = function(m){ if (orig && orig(m)) return true; return typeof m==="string" && /^[A-Z]{2,6}$/.test(m); }; 
    }catch(e){ /* ignore */ }
  }

  async function fetchDaily(base){
    const url = PROXY + "/daily?symbol=" + encodeURIComponent((base||"BTC").toUpperCase());
    AJS.log("fetch", url);
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
    setVal("cFunding", d.funding , 6);
    setVal("cOI"     , d.oi_pct  , 2);
    setVal("cOpen"   , d.today_open, 2);
    setVal("cHigh"   , d.prev_high , 2);
    setVal("cLow"    , d.prev_low  , 2);
    setVal("cATR"    , d.atr14     , 4);
  }

  async function autoFillIfCrypto(){
    const mSel = $id("market") || $('[name="market"], #market');
    const m = mSel && (mSel.value || mSel.getAttribute("value")) || "";
    if(!m) return AJS.log("skip: no market value");
    if(!(window.isCrypto && window.isCrypto(m))) return AJS.log("skip: not crypto", m);
    try{ const d = await fetchDaily(m); fillCryptoFields(d); AJS.log("filled daily for", m, d); }catch(e){ console.warn("[ajs] Auto-fill failed:", e); }
  }

  document.addEventListener("DOMContentLoaded", async ()=>{
    AJS.log("loaded; proxy=", PROXY);
    patchIsCrypto();
    try{ 
      const market = await waitForEl("#market, [name='market']");
      const symbols = await loadSymbols();
      ensureCryptoOptions(market, symbols);
      market.addEventListener("change", autoFillIfCrypto);
      autoFillIfCrypto();
    }catch(e){ console.warn("[ajs] init failed:", e); }
  });
})();
