// ajs- Auto-fill v5.1 (OKX; improved mapper: ESC/cancel/ignore-overlay/keyboard)
(function(){
  const DEFAULT_PROXY = (typeof location!=="undefined" ? (location.origin + "/api/okx") : "");
  const PROXY = (window.AJS_BINANCE_PROXY || DEFAULT_PROXY).replace(/\/$/,"");
  const LS_KEY = "ajs_field_mapping_v1";
  let mapping = null;
  let mapState = { active:false, step:0, steps:["market","cPrice","cFunding","cOI","cOpen","cHigh","cLow","cATR"] };
  let clickHandler = null, escHandler = null;

  function saveMap(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(mapping)); }catch(_){} }
  function loadMap(){ try{ mapping = JSON.parse(localStorage.getItem(LS_KEY)||"null"); }catch(_){ mapping=null; } }
  function qs(sel){ try{ return document.querySelector(sel); }catch(_){ return null; } }
  function sel(){ 
    const byId = document.getElementById("market");
    if (byId) return byId;
    const byName = document.querySelector("[name='market']");
    if (byName) return byName;
    if (mapping && mapping.market) return qs(mapping.market);
    return null;
  }

  // ---------- Overlay UI ----------
  function buildOverlay(){
    if (document.querySelector(".ajs-box")) return;
    const css = `
      .ajs-box{position:fixed;right:12px;bottom:12px;z-index:999999;background:#111;color:#fff;
        font-family:system-ui,Arial,sans-serif;border-radius:12px;padding:10px 12px;box-shadow:0 6px 24px rgba(0,0,0,.3);width:300px}
      .ajs-box button{background:#03a9f4;color:#fff;border:none;border-radius:10px;padding:8px 12px;cursor:pointer}
      .ajs-box .muted{opacity:.75;font-size:12px;margin-top:6px}
      .ajs-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
      .ajs-x{position:absolute;right:8px;top:6px;cursor:pointer;font-weight:700}
      .ajs-hl{outline:3px solid #03a9f4 !important; outline-offset:2px !important;}
      .ajs-bad{outline:3px solid #e91e63 !important; outline-offset:2px !important;}
    `;
    const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);
    const box = document.createElement("div"); box.className="ajs-box";
    box.innerHTML = `<div class="ajs-x" id="ajsClose">×</div>
      <div><b>AJS Auto-Fill</b></div>
      <div id="ajsStatus" class="muted">Bereit. Klicke „Felder zuordnen“, wenn nichts gefüllt wird.</div>
      <div class="ajs-row">
        <button id="ajsMapBtn">Felder zuordnen</button>
        <button id="ajsCancelBtn" style="background:#444">Abbrechen</button>
        <button id="ajsResetBtn" style="background:#666">Reset</button>
      </div>
      <div class="muted">ESC = Abbrechen. Klicks im schwarzen Feld werden ignoriert.</div>`;
    document.body.appendChild(box);
    document.getElementById("ajsClose").onclick = ()=> box.remove();
    document.getElementById("ajsCancelBtn").onclick = cancelMapping;
    document.getElementById("ajsResetBtn").onclick = ()=>{ localStorage.removeItem(LS_KEY); mapping=null; setStatus("Zuordnung gelöscht."); };
    document.getElementById("ajsMapBtn").onclick = startMapping;
  }
  function setStatus(t){ const el=document.getElementById("ajsStatus"); if (el) el.textContent = t; }

  // ---------- Mapping Flow ----------
  function startMapping(){
    mapping = {}; saveMap();
    mapState.active = true; mapState.step = 0;
    setStatus("Schritt 1/8: Bitte auf die Markt-Auswahl (z. B. BTC) klicken.");
    attachCapture();
  }
  function cancelMapping(){
    mapState.active = false; mapState.step = 0;
    detachCapture();
    setStatus("Mapping abgebrochen.");
  }
  function finishMapping(){
    mapState.active = false;
    detachCapture(); saveMap();
    setStatus("Fertig! Werte werden nun automatisch gefüllt.");
    setTimeout(fillNow, 100);
  }

  function attachCapture(){
    if (clickHandler) return;
    clickHandler = (ev)=>{
      // Ignore clicks on overlay itself to allow buttons to work
      if (ev.target && ev.target.closest && ev.target.closest(".ajs-box")) return;
      if (!mapState.active) return;
      const key = mapState.steps[mapState.step];
      // choose element for current key
      const el = ev.target;
      if (!el) return;
      const path = cssPath(el);
      if (!path) return;
      // verify: element resolves again
      const test = qs(path);
      if (!test){ flash(el, true); return; }
      mapping[key] = path; saveMap();
      mapState.step++;
      if (mapState.step >= mapState.steps.length){
        finishMapping();
      }else{
        const names = {market:"Markt", cPrice:"Preis", cFunding:"Funding", cOI:"OI", cOpen:"Open", cHigh:"High", cLow:"Low", cATR:"ATR"};
        setStatus(`Schritt ${mapState.step+1}/8: Bitte auf ${names[mapState.steps[mapState.step]]} klicken.`);
      }
      ev.preventDefault(); ev.stopPropagation();
    };
    document.addEventListener("click", clickHandler, true);
    if (!escHandler){
      escHandler = (e)=>{ if (e.key === "Escape") cancelMapping(); };
      document.addEventListener("keydown", escHandler, true);
    }
  }
  function detachCapture(){
    if (clickHandler){ document.removeEventListener("click", clickHandler, true); clickHandler = null; }
    if (escHandler){ document.removeEventListener("keydown", escHandler, true); escHandler = null; }
  }
  function cssPath(el){
    if (!(el instanceof Element)) return "";
    const path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE){
      let sel = el.nodeName.toLowerCase();
      if (el.id){ sel += "#" + el.id; path.unshift(sel); break; }
      else {
        let sib = el, nth = 1;
        while (sib = sib.previousElementSibling){ if (sib.nodeName.toLowerCase() === sel) nth++; }
        sel += `:nth-of-type(${nth})`;
      }
      path.unshift(sel);
      el = el.parentElement;
    }
    return path.join(" > ");
  }
  function flash(el, bad=false){
    const cls = bad ? "ajs-bad" : "ajs-hl";
    try{ el.classList.add(cls); setTimeout(()=>el.classList.remove(cls), 1300); }catch(_){}
  }

  // ---------- Fill Logic ----------
  function getMarketEl(){
    const e = sel(); if (e) return e;
    if (mapping && mapping.market){ const m=qs(mapping.market); if (m) return m; }
    return null;
  }
  function parseBaseFromSelect(){
    const e = getMarketEl(); if(!e) return "";
    let raw = "";
    if (e.tagName==="SELECT"){
      const opt = e.options && e.selectedIndex>=0 ? e.options[e.selectedIndex] : null;
      raw = ((opt && (opt.textContent||opt.innerText)) || e.value || "");
    } else {
      raw = (e.value || e.textContent || "");
    }
    raw = raw.toUpperCase().trim();
    let m;
    if ((m = raw.match(/^([A-Z]{2,6})\s*(?:USDT|USD|PERP|SWAP)?$/))) return m[1];
    if ((m = raw.match(/^([A-Z]{2,6})[-/_.]?(?:USDT|USD)(?:-PERP|-SWAP)?$/))) return m[1];
    if ((m = raw.match(/^([A-Z]{2,6})\s*\(PERP\)$/))) return m[1];
    if ((m = raw.match(/^([A-Z]{2,6})(?:USDT|USD).*/))) return m[1];
    return "";
  }
  function pickField(key){
    if (mapping && mapping[key]){ const el=qs(mapping[key]); if (el) return el; }
    return document.getElementById(key)
        || document.querySelector(`[name='${key}']`)
        || document.querySelector(`[data-ajs='${key}']`)
        || null;
  }
  function put(key, v, d){
    const el = pickField(key);
    if (el && v!=null && isFinite(v)) { el.value = Number(v).toFixed(d); flash(el); }
  }

  async function daily(base){
    const u = PROXY + "/daily?symbol=" + encodeURIComponent(base||"BTC");
    const r = await fetch(u, { headers: {accept:"application/json"} });
    if(!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }
  async function fillNow(){
    if (mapState.active) return; // while mapping, do not fetch
    const base = parseBaseFromSelect();
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
    }catch(_){}
  }

  function init(){
    loadMap();
    buildOverlay();
    setTimeout(fillNow, 500);
    const e = getMarketEl();
    if (e){
      e.addEventListener("change", fillNow);
      e.addEventListener("input", fillNow);
      e.addEventListener("keyup", (ev)=>{ if (ev.key==="ArrowUp"||ev.key==="ArrowDown") fillNow(); });
      e.addEventListener("click", fillNow);
    }
    setInterval(fillNow, 2500);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
