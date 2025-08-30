// ajs- Auto-fill v5 (OKX; interactive mapper fallback)
(function(){
  const DEFAULT_PROXY = (typeof location!=="undefined" ? (location.origin + "/api/okx") : "");
  const PROXY = (window.AJS_BINANCE_PROXY || DEFAULT_PROXY).replace(/\/$/,"");
  const LS_KEY = "ajs_field_mapping_v1";
  let mapping = null;

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

  function buildOverlay(){
    const css = `
      .ajs-box{position:fixed;right:12px;bottom:12px;z-index:999999;background:#111;color:#fff;
        font-family:system-ui,Arial,sans-serif;border-radius:12px;padding:10px 12px;box-shadow:0 6px 24px rgba(0,0,0,.3)}
      .ajs-box button{background:#03a9f4;color:#fff;border:none;border-radius:10px;padding:8px 12px;cursor:pointer}
      .ajs-box .muted{opacity:.7;font-size:12px;margin-top:6px}
      .ajs-hl{outline:3px solid #03a9f4 !important; outline-offset:2px !important;}
    `;
    const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);
    const box = document.createElement("div"); box.className="ajs-box";
    box.innerHTML = `<div><b>AJS Auto-Fill</b></div>
      <div style="margin:8px 0">Wenn die Felder leer bleiben, klicke „Felder zuordnen“ und tippe nacheinander auf:
      <ol style="margin:6px 0 0 18px;padding:0">
        <li>Markt-Auswahl (z. B. BTC)</li>
        <li>Preis</li><li>Funding</li><li>OI</li><li>Open</li><li>High</li><li>Low</li><li>ATR</li>
      </ol></div>
      <div style="display:flex;gap:8px">
        <button id="ajsMapBtn">Felder zuordnen</button>
        <button id="ajsHideBtn" style="background:#444">Schließen</button>
      </div>
      <div class="muted">Speichert dauerhaft im Browser (localStorage)</div>`;
    document.body.appendChild(box);
    document.getElementById("ajsHideBtn").onclick = ()=> box.remove();
    document.getElementById("ajsMapBtn").onclick = startMapping;
  }

  function pickOnce(label, cb){
    const tip = (el)=>{ if(!el) return; el.classList.add("ajs-hl"); setTimeout(()=>el.classList.remove("ajs-hl"), 2000); };
    alert("Bitte JETZT auf das Element für: " + label + " klicken.");
    const onClick = (ev)=>{
      ev.preventDefault(); ev.stopPropagation();
      document.removeEventListener("click", onClick, true);
      const el = ev.target;
      const path = cssPath(el);
      cb(path);
    };
    document.addEventListener("click", onClick, true);
    // Hint: try highlight current guess
    const guess = (label==="Market" ? (document.getElementById("market")||document.querySelector("[name='market']")) : null);
    tip(guess);
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

  function startMapping(){
    mapping = {};
    pickOnce("Market", (s)=>{ mapping.market = s; pickOnce("Preis (cPrice)", (s)=>{ mapping.cPrice=s; 
      pickOnce("Funding (cFunding)", (s)=>{ mapping.cFunding=s;
        pickOnce("OI (cOI)", (s)=>{ mapping.cOI=s;
          pickOnce("Open (cOpen)", (s)=>{ mapping.cOpen=s;
            pickOnce("High (cHigh)", (s)=>{ mapping.cHigh=s;
              pickOnce("Low (cLow)", (s)=>{ mapping.cLow=s;
                pickOnce("ATR (cATR)", (s)=>{ mapping.cATR=s; saveMap(); alert("Fertig! Daten werden ab jetzt automatisch gefüllt."); fillNow(); });
              });
            });
          });
        });
      });
    });});
  }

  function put(key, v, d){
    let el = null;
    if (mapping && mapping[key]) el = qs(mapping[key]);
    if (!el) el = document.getElementById(key) || document.querySelector(`[name='${key}']`) || document.querySelector(`[data-ajs='${key}']`);
    if (el && v!=null && isFinite(v)) el.value = Number(v).toFixed(d);
  }

  function parseBaseFromSelect(){
    const e = sel(); if(!e) return "";
    const opt = e.options && e.selectedIndex>=0 ? e.options[e.selectedIndex] : null;
    const raw = ((opt && (opt.textContent||opt.innerText)) || e.value || "").toUpperCase().trim();
    let m;
    if ((m = raw.match(/^([A-Z]{2,6})\s*(?:USDT|USD|PERP|SWAP)?$/))) return m[1];
    if ((m = raw.match(/^([A-Z]{2,6})[-/_.]?(?:USDT|USD)(?:-PERP|-SWAP)?$/))) return m[1];
    if ((m = raw.match(/^([A-Z]{2,6})\s*\(PERP\)$/))) return m[1];
    if ((m = raw.match(/^([A-Z]{2,6})(?:USDT|USD).*/))) return m[1];
    return "";
  }

  async function daily(base){
    const u = PROXY + "/daily?symbol=" + encodeURIComponent(base||"BTC");
    const r = await fetch(u, { headers: {accept:"application/json"} });
    if(!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }

  async function fillNow(){
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
    }catch(_){ /* ignore */ }
  }

  function init(){
    loadMap();
    // Add helper button (only if not mapped)
    if (!mapping){
      // small helper but non-intrusive
      buildOverlay();
    }
    setTimeout(fillNow, 500);
    const e = sel();
    if (e) e.addEventListener("change", fillNow);
    setInterval(fillNow, 2500); // robust against SPA rerenders
  }

  document.addEventListener("DOMContentLoaded", init);
})();
