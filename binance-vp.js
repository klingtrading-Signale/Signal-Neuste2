// ajs- Precise Volume Profile v2 (robust wait + logs)
(function(){
  const AJS = window.AJS || (window.AJS = {});
  AJS.logVP = (...a)=>console.log("[ajs:vp]", ...a);
  const PROXY = (window.AJS_BINANCE_PROXY || "https://binanceverbindung.martkling6.workers.dev").replace(/\/$/,"");
  function $(sel){ return document.querySelector(sel); }

  function computeValueArea(bins, coverage=0.7){
    if(!bins || !bins.length) return {poc:null, vah:null, val:null};
    const arr = bins.slice().sort((a,b)=>a[0]-b[0]);
    const total = arr.reduce((s,x)=>s+x[1],0);
    if(total<=0) return {poc:null, vah:null, val:null};
    let pocIdx=0, maxV=-1;
    for(let i=0;i<arr.length;i++) if(arr[i][1]>maxV){ maxV=arr[i][1]; pocIdx=i; }
    let left=pocIdx, right=pocIdx, cum=arr[pocIdx][1];
    const target = total*coverage;
    while(cum<target && (left>0 || right<arr.length-1)){
      const lv=(left>0)?arr[left-1][1]:-1, rv=(right<arr.length-1)?arr[right+1][1]:-1;
      if(rv>=lv && right<arr.length-1){ right++; cum+=arr[right][1]; }
      else if(left>0){ left--; cum+=arr[left][1]; }
      else break;
    }
    return { poc:arr[pocIdx][0], val:arr[left][0], vah:arr[right][0] };
  }

  async function getJSON(url){
    const r = await fetch(url, { headers: { "accept":"application/json" } });
    if(!r.ok) throw new Error("HTTP "+r.status+" "+url);
    return r.json();
  }

  async function loadPreviousDayHistogram(base, stepMs=5*60*1000, volType="quote"){
    const symbol = (base||"BTC").toUpperCase() + "USDT";
    const now = new Date();
    const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()-1, 0,0,0,0);
    const end   = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()-1, 24,0,0,0);
    const bins = new Map();
    for(let t=start; t<end; t+=stepMs){
      const url = `${PROXY}/vp-chunk?symbol=${symbol}&start=${t}&end=${Math.min(t+stepMs,end)}&vol=${volType}`;
      AJS.logVP("fetch", url);
      const data = await getJSON(url);
      const arr = data && data.bins || [];
      for(const [p,v] of arr) bins.set(Number(p), (bins.get(Number(p))||0) + Number(v||0));
    }
    return Array.from(bins.entries()).map(([p,v])=>[Number(p),Number(v)]).sort((a,b)=>a[0]-b[0]);
  }

  async function fillPreciseVP(){
    const mEl = document.getElementById("market") || document.querySelector("[name='market'], #market");
    const m = mEl && (mEl.value || mEl.getAttribute("value")) || "";
    if(!(window.isCrypto && window.isCrypto(m))) return;
    try{
      const hist = await loadPreviousDayHistogram(m, 5*60*1000, "quote");
      const {poc, vah, val} = computeValueArea(hist, 0.7);
      if (document.getElementById("cPOC") && poc!=null) document.getElementById("cPOC").value = Number(poc).toFixed(2);
      if (document.getElementById("cVAH") && vah!=null) document.getElementById("cVAH").value = Number(vah).toFixed(2);
      if (document.getElementById("cVAL") && val!=null) document.getElementById("cVAL").value = Number(val).toFixed(2);
      AJS.logVP("done bins:", hist.length, "values:", {poc,vah,val});
    }catch(e){ console.error("[ajs] Precise VP failed:", e); }
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    const market = document.getElementById("market") || document.querySelector("[name='market'], #market");
    if (market) market.addEventListener("change", ()=> setTimeout(fillPreciseVP, 300));
    setTimeout(fillPreciseVP, 900);
  });
})();
