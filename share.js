
// ajs- share/copy module (minimal, no design changes)
(function(){
  const $ = (id)=>document.getElementById(id);

  function getCopyText(){
    const box = $("copyBox");
    if(!box) return "";
    // Preserve line breaks, trim
    return (box.textContent || "").replace(/\u00A0/g, " ").trim();
  }

  function enableIfReady(btn){
    const txt = getCopyText();
    if(txt && btn) btn.removeAttribute("disabled");
  }

  function attach(){
    const btn = $("ajsCopySignalBtn");
    if(!btn) return;

    // Click handler
    btn.addEventListener("click", async ()=>{
      const txt = getCopyText();
      if(!txt){
        alert("Noch kein Signal-Text vorhanden. Bitte zuerst ein Signal generieren.");
        return;
      }
      try{
        await (navigator.clipboard?.writeText(txt));
        const original = btn.textContent;
        btn.textContent = "Kopiert!";
        btn.disabled = true;
        setTimeout(()=>{ btn.textContent = original; btn.disabled = false; }, 900);
      }catch(e){
        // Fallback: prompt copy
        const ok = window.prompt("Text zum Kopieren (Strg+C, Enter):", txt);
      }
    });

    // Observe signal area for content changes and enable button when ready
    const area = $("signalArea");
    if(area && window.MutationObserver){
      const mo = new MutationObserver(()=>enableIfReady(btn));
      mo.observe(area, {childList:true, subtree:true, characterData:true});
    }
    // initial check + a short poll in case of late render
    enableIfReady(btn);
    let tries=0; const t=setInterval(()=>{ enableIfReady(btn); if(++tries>15) clearInterval(t); }, 300);
  }

  document.addEventListener("DOMContentLoaded", attach);
})();
