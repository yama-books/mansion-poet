// PRINT03-CORE local QA helper (used by run-browser-qa-pwsh.mjs, not by CI).
// Opens URL in an already running headless Edge/Chrome that listens on the
// DevTools PORT, waits until preview.html has replaced the initial "null" in
// its #pl-report with the layout report, and
// prints the page's outerHTML to stdout (the same text --dump-dom would give).
// Usage: node cdp-dom.mjs URL [PORT=9333] [TIMEOUT_MS=60000]
// Exit 0 with HTML; exit 3 when the report did not appear in time.
const [,,url,port='9333',timeoutMs='60000']=process.argv;
const base=`http://127.0.0.1:${port}`;
const target=await (await fetch(`${base}/json/new?${encodeURIComponent('about:blank')}`,{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});
let id=0;const pending=new Map();
ws.onmessage=ev=>{const m=JSON.parse(ev.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}};
const send=(method,params={})=>new Promise(res=>{const i=++id;pending.set(i,res);ws.send(JSON.stringify({id:i,method,params}))});
await send('Page.enable');
await send('Page.navigate',{url});
const until=Date.now()+(+timeoutMs);
let html='';
while(Date.now()<until){
 await new Promise(r=>setTimeout(r,250));
 // preview.html starts with "null" in #pl-report and replaces it once every template is laid out
 const r=await send('Runtime.evaluate',{expression:"(()=>{const s=document.getElementById('pl-report');const t=s?s.textContent.trim():'';return t&&t!=='null'?document.documentElement.outerHTML:''})()",returnByValue:true});
 html=r.result?.result?.value||'';
 if(html)break;
}
await new Promise(r=>{ws.onclose=r;ws.close()});
await fetch(`${base}/json/close/${target.id}`).catch(()=>{});
process.stdout.write(html);
process.exitCode=html?0:3;
