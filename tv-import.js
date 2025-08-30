// ajs- TradingView Import (paste/upload) – minimal invasiv
(function(){
  const AJS = window.AJS || (window.AJS = {});
  const ns = "ajs-tv";
  const Q = (s, r=document) => r.querySelector(s);
  const QA = (s, r=document) => Array.from(r.querySelectorAll(s));

  function ensureUI(){
    if (Q("#"+ns)) return;
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = (window.AJS_TV_IMPORT_CSS || "./tv-import.css");
    document.head.appendChild(css);

    const box = document.createElement("div");
    box.id = ns;
    box.innerHTML = `
      <button id="${ns}-toggle" aria-expanded="false" title="TradingView-Daten einfügen">TV‑Import</button>
      <div id="${ns}-panel" hidden>
        <div class="${ns}-row">
          <label>Einfügen (Text aus deinem TradingView-Label)</label>
          <textarea id="${ns}-txt" placeholder="Hier den Text aus dem TradingView-Indikator einfügen…"></textarea>
        </div>
        <div class="${ns}-row">
          <div class="${ns}-hint">Oder lade eine <b>.txt</b>-Datei hoch:</div>
          <input type="file" id="${ns}-file" accept=".txt,text/plain">
        </div>
        <div class="${ns}-row ${ns}-actions">
          <button id="${ns}-paste">Aus Zwischenablage einfügen</button>
          <button id="${ns}-apply" class="primary">Übernehmen</button>
          <button id="${ns}-close" class="ghost">Schließen</button>
        </div>
        <div id="${ns}-msg" class="${ns}-msg" aria-live="polite"></div>
        <details class="${ns}-help"><summary>Was wird erkannt?</summary>
          <ul>
            <li><code>Datum:</code> 2025-08-30</li>
            <li><code>Markt:</code> z. B. BTCUSDT</li>
            <li><code>Aktueller Kurs:</code> Zahl</li>
            <li><code>Vortageshoch</code> / <code>Vortagestief</code> / <code>Settlement</code></li>
            <li><code>Eröffnung</code> / <code>Tageshoch</code> / <code>Tagestief</code></li>
            <li><code>ATR (Daily, 14)</code></li>
          </ul>
          <div class="${ns}-muted">Zahlen mit Komma oder Punkt werden unterstützt.</div>
        </details>
      </div>
    `;
    document.body.appendChild(box);

    Q("#"+ns+"-toggle").addEventListener("click", ()=>toggle(true));
    Q("#"+ns+"-close").addEventListener("click", ()=>toggle(false));
    Q("#"+ns+"-paste").addEventListener("click", onPaste);
    Q("#"+ns+"-apply").addEventListener("click", onApply);
    Q("#"+ns+"-file").addEventListener("change", onFile);
  }

  function toggle(open){
    const btn = Q("#"+ns+"-toggle");
    const panel = Q("#"+ns+"-panel");
    if (open===true){ panel.hidden=false; btn.setAttribute("aria-expanded","true"); }
    else if (open===false){ panel.hidden=true; btn.setAttribute("aria-expanded","false"); }
    else { panel.hidden=!panel.hidden; btn.setAttribute("aria-expanded", String(!panel.hidden)); }
  }

  function msg(text, type="info"){
    const el = Q("#"+ns+"-msg");
    if (!el) return;
    el.textContent = text;
    el.dataset.type = type;
  }

  function deNum(s){
    if (s==null) return null;
    s = (""+s).trim();
    if (!s) return null;
    // detect german decimals
    if (s.indexOf(",")>=0 && s.indexOf(".")>=0){
      // assume '.' as thousands, ',' as decimal
      s = s.replace(/\./g,"").replace(",", ".");
    }else if (s.indexOf(",")>=0){
      s = s.replace(",", ".");
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function parse(text){
    const get = (label)=>{
      const re = new RegExp(label + "\\s*:\\s*([^\\n\\r]+)", "i");
      const m = text.match(re);
      return m ? m[1].trim() : null;
    };
    const date = get("Datum");
    const marketRaw = get("Markt");
    const price = deNum(get("Aktueller\\s*Kurs"));
    const prevHigh = deNum(get("Vortageshoch"));
    const prevLow = deNum(get("Vortagestief"));
    const prevClose = deNum(get("Settlement"));
    const open = deNum(get("Eröffnung"));
    const dayHigh = deNum(get("Tageshoch"));
    const dayLow = deNum(get("Tagestief"));
    // ATR can be like "ATR (Daily, 14): 123.45"
    let atrText = null;
    const atrMatch = text.match(/ATR\s*\(.*?\)\s*:\s*([^\n\r]+)/i);
    if (atrMatch) atrText = atrMatch[1].trim();
    const atr = deNum(atrText);

    // derive base symbol from market string (e.g. BTCUSDT -> BTC, ES1! -> ES)
    let base = "";
    if (marketRaw){
      const m = marketRaw.toUpperCase();
      const m1 = m.match(/^([A-Z]{2,6})/); // take first letters
      base = m1 ? m1[1] : m;
      // strip USDT/USD suffix if present
      base = base.replace(/(USDT|USD)$/,"");
    }
    return { date, marketRaw, base, price, prevHigh, prevLow, prevClose, open, dayHigh, dayLow, atr };
  }

  function pick(sel){
    return document.getElementById(sel)
        || document.querySelector(`[name="${sel}"]`)
        || document.querySelector(`[data-ajs="${sel}"]`)
        || null;
  }
  function put(id, val, digits){
    const el = pick(id);
    if (!el || val==null || !isFinite(val)) return false;
    el.value = Number(val).toFixed(digits);
    return true;
  }
  function setMarket(base){
    if (!base) return false;
    const el = document.getElementById("market") || document.querySelector("[name='market']");
    if (!el) return false;
    // try exact match, then try option whose text contains base
    const optExact = Array.from(el.options||[]).find(o=>o.value.toUpperCase()===base || (o.textContent||"").toUpperCase()===base);
    if (optExact){ el.value = optExact.value; el.dispatchEvent(new Event("change", {bubbles:true})); return true; }
    const optContains = Array.from(el.options||[]).find(o=>((o.textContent||"")+o.value).toUpperCase().includes(base));
    if (optContains){ el.value = optContains.value; el.dispatchEvent(new Event("change", {bubbles:true})); return true; }
    return false;
  }
  function setDate(d){
    // tries #date or [name="date"]
    if (!d) return false;
    const el = document.getElementById("date") || document.querySelector("[name='date']");
    if (!el) return false;
    try{ el.value = d; return true; }catch(_){ return false; }
  }

  async function onPaste(){
    try{
      const t = await navigator.clipboard.readText();
      if (t){ Q("#"+ns+"-txt").value = t; msg("Text eingefügt. Jetzt auf „Übernehmen“ klicken.", "info"); }
      else { msg("Zwischenablage leer oder blockiert. Bitte Text manuell einfügen.", "warn"); }
    }catch(e){
      msg("Kein Zugriff auf Zwischenablage. Bitte Text manuell einfügen.", "warn");
    }
  }
  async function onFile(ev){
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    const text = await f.text();
    Q("#"+ns+"-txt").value = text;
    msg("Datei geladen. Jetzt auf „Übernehmen“ klicken.", "info");
  }

  function onApply(){
    const raw = Q("#"+ns+"-txt").value || "";
    if (!raw.trim()){ msg("Bitte zuerst Text einfügen oder Datei laden.", "warn"); return; }
    const d = parse(raw);
    let ok = false;
    // Map auf bestehende Felder – möglichst NUR ergänzen, nichts überschreiben
    ok = setDate(d.date) || ok;
    ok = setMarket(d.base) || ok;
    ok = put("cPrice", d.price, 2) || ok;
    ok = put("cOpen", d.open, 2) || ok;
    ok = put("cHigh", d.prevHigh, 2) || ok; // cHigh = Vortageshoch (wie zuvor vereinbart)
    ok = put("cLow", d.prevLow, 2) || ok;   // cLow  = Vortagestief
    ok = put("cATR", d.atr, 4) || ok;

    if (ok) {
      msg("Werte übernommen ✅", "ok");
      toggle(false);
    } else {
      msg("Keine passenden Eingabefelder gefunden. Prüfe Feld-IDs (z. B. cPrice, cOpen, cHigh, cLow, cATR, market, date).", "warn");
    }
  }

  document.addEventListener("DOMContentLoaded", ensureUI);
})();