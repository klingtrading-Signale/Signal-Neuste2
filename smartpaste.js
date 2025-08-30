
// ajs- Smart Paste & Auto-Fill (no UI changes)
(function(){
  const $ = (id)=>document.getElementById(id);
  const setIf = (id, val)=>{ const el=$(id); if(el && val!=null && val!==""){ el.value = val; } };
  const numDE = (s)=>{
    if(s==null) return null;
    s = String(s).trim();
    if(!s) return null;
    // If comma present, treat dot as thousands
    if(s.includes(",")){
      s = s.replace(/\./g,"").replace(",", ".");
    }
    // else keep dots as decimals
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };
  function parse(text){
    const t = text.replace(/\r/g,"");
    const grab = (rx)=>{ const m = t.match(rx); return m ? m[1] : null; };

    const res = {};
    // Market
    res.market = (grab(/(?:^|\n)\s*Markt\s*[:\-]?\s*([A-Za-z0-9]+)\s*(?:\n|$)/i) || "").toUpperCase();

    // Previous day levels
    res.prevHigh = numDE(grab(/Vortageshoch\s*[:\-]?\s*([0-9\.,]+)/i));
    res.prevLow  = numDE(grab(/Vortagestief\s*[:\-]?\s*([0-9\.,]+)/i));
    res.prevVAH  = numDE(grab(/Vortages\s*VAH\s*[:\-]?\s*([0-9\.,]+)/i));
    res.prevPOC  = numDE(grab(/Vortages\s*POC\s*[:\-]?\s*([0-9\.,]+)/i));
    res.prevVAL  = numDE(grab(/Vortages\s*VAL\s*[:\-]?\s*([0-9\.,]+)/i));

    // Current profile (if provided)
    // Ensure we don't accidentally take "Vortages VAH" - patterns above already took "Vortages ..."
    res.vah = numDE(grab(/(^|\n)\s*VAH\s*[:\-]?\s*([0-9\.,]+)/i));
    res.poc = numDE(grab(/(^|\n)\s*POC\s*[:\-]?\s*([0-9\.,]+)/i));
    res.val = numDE(grab(/(^|\n)\s*VAL\s*[:\-]?\s*([0-9\.,]+)/i));

    // ATR / Max Pain
    res.atrDaily = numDE(grab(/ATR\s*Daily\s*[:\-]?\s*([0-9\.,]+)/i) || grab(/Daily\s*ATR\s*[:\-]?\s*([0-9\.,]+)/i));
    res.maxPain  = numDE(grab(/Max\s*Pain\s*[:\-]?\s*([0-9\.,]+)/i));

    // Crypto block
    res.cOpen  = numDE(grab(/Eröffnung\s*Tageskerze\s*[:\-]?\s*([0-9\.,]+)/i));
    res.cHigh  = numDE(grab(/Vortageshoch\s*[:\-]?\s*([0-9\.,]+)/i)); // reuse, may be same label
    res.cLow   = numDE(grab(/Vortagestief\s*[:\-]?\s*([0-9\.,]+)/i));
    res.cVAH   = numDE(grab(/VAH\s*[:\-]?\s*([0-9\.,]+)/i));
    res.cPOC   = numDE(grab(/POC\s*[:\-]?\s*([0-9\.,]+)/i));
    res.cVAL   = numDE(grab(/VAL\s*[:\-]?\s*([0-9\.,]+)/i));
    res.cATR   = numDE(grab(/ATR\s*Daily\s*[:\-]?\s*([0-9\.,]+)/i));
    res.cPrice = numDE(grab(/aktueller\s*Preis\s*[:\-]?\s*([0-9\.,]+)/i));

    // Call/Put OI (optional; place into callOI/putOI if present)
    const callOI = grab(/H[öo]chstes\s*Call\s*OI\s*[:\-]?\s*([0-9\.,]+)/i);
    const putOI  = grab(/H[öo]chstes\s*Put\s*OI\s*[:\-]?\s*([0-9\.,]+)/i);
    res.callOI = callOI ? (numDE(callOI) + "/") : null;
    res.putOI  = putOI  ? (numDE(putOI)  + "/") : null;

    return res;
  }

  function fill(parsed){
    if(!parsed) return false;
    // try to set market, if select exists
    const marketEl = $("market");
    if(marketEl && parsed.market){
      // If option exists, set it
      const opt = Array.from(marketEl.options).find(o=>o.value===parsed.market || o.textContent===parsed.market);
      if(opt){ marketEl.value = opt.value; }
    }
    // Futures fields
    setIf("prevHigh", parsed.prevHigh);
    setIf("prevLow", parsed.prevLow);
    setIf("prevVAH", parsed.prevVAH);
    setIf("prevPOC", parsed.prevPOC);
    setIf("prevVAL", parsed.prevVAL);
    setIf("VAH", parsed.vah); setIf("vah", parsed.vah);
    setIf("POC", parsed.poc); setIf("poc", parsed.poc);
    setIf("VAL", parsed.val); setIf("val", parsed.val);
    setIf("ATR", parsed.atrDaily); setIf("atrDaily", parsed.atrDaily);
    setIf("maxPain", parsed.maxPain);

    // Crypto fields
    setIf("cOpen", parsed.cOpen);
    setIf("cHigh", parsed.cHigh);
    setIf("cLow", parsed.cLow);
    setIf("cVAH", parsed.cVAH);
    setIf("cPOC", parsed.cPOC);
    setIf("cVAL", parsed.cVAL);
    setIf("cATR", parsed.cATR);
    setIf("cPrice", parsed.cPrice);

    // OI fields, if exist
    setIf("callOI", parsed.callOI);
    setIf("putOI", parsed.putOI);

    return true;
  }

  async function importFromClipboard(){
    try{
      const txt = await navigator.clipboard.readText();
      if(!txt) { alert("Zwischenablage ist leer."); return; }
      const parsed = parse(txt);
      if(!fill(parsed)){ alert("Keine passenden Felder gefunden."); return; }
      // tiny feedback without changing design: temporary title blink
      const btn = document.getElementById("generate");
      if(btn){
        const old = btn.textContent;
        btn.textContent = "Daten eingefügt ✓";
        setTimeout(()=>btn.textContent = old, 900);
      }
    }catch(e){
      alert("Kann die Zwischenablage nicht lesen. Erlaube Zugriff oder nutze Drag&Drop/Manuelles Einfügen.");
    }
  }

  function enableDragDrop(){
    window.addEventListener("dragover", (e)=>{ e.preventDefault(); });
    window.addEventListener("drop", (e)=>{
      e.preventDefault();
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if(!file) return;
      if(!/\.txt|\.csv|\.log|\.md|\.json$/i.test(file.name)) return;
      const reader = new FileReader();
      reader.onload = ()=>{
        const parsed = parse(String(reader.result||""));
        if(fill(parsed)){
          const btn = document.getElementById("generate");
          if(btn){
            const old = btn.textContent;
            btn.textContent = "Daten eingefügt ✓";
            setTimeout(()=>btn.textContent = old, 900);
          }
        }
      };
      reader.readAsText(file, "utf-8");
    });
  }

  function enableShortcut(){
    document.addEventListener("keydown", (e)=>{
      if(e.ctrlKey && e.shiftKey && (e.key==="V" || e.key==="v")){
        e.preventDefault();
        importFromClipboard();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    enableShortcut();
    enableDragDrop();
    // Expose manual hook for console / custom buttons if needed
    window.ajsSmartPaste = function(text){
      const parsed = parse(text||"");
      return fill(parsed);
    };
  });
})();
