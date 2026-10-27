// PRINT03-CORE local QA launcher for Windows hosts where a browser started
// directly by node exits without output (seen 2026-10-21 with Edge 155 inside
// the Claude desktop app's shell). It runs ../run-browser-qa.mjs unchanged,
// with two substitutions in execFileSync for the browser binary only:
//  - --print-to-pdf runs are started through PowerShell Start-Process -Wait;
//  - --dump-dom runs read the DOM over the DevTools protocol (cdp-dom.mjs) from
//    one headless browser started once with --remote-debugging-port, because
//    --dump-dom writes nothing to a redirected stdout there.
// PDFs and the PDF checks (check_pdf.py) are exactly those of run-browser-qa.mjs.
// Needs: pwsh (PowerShell 7), Node >= 22 (global fetch / WebSocket), PyMuPDF.
// Usage: node tests/print-layout/qa-tools/run-browser-qa-pwsh.mjs [run-browser-qa.mjs args]
import cp from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {rmSync,mkdtempSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL,fileURLToPath} from 'node:url';
const orig=cp.execFileSync;
const here=dirname(fileURLToPath(import.meta.url));
const BROWSER=/msedge\.exe$|chrome\.exe$/i;
const PORT=process.env.PRINT03_CDP_PORT||'9333';
const q=s=>"'"+String(s).replace(/'/g,"''")+"'";
const quoteArgs=args=>args.map(a=>'"'+String(a).replace(/"/g,'\\"')+'"').join(' ');
const startProcess=(file,args,wait)=>
 orig('pwsh',['-NoProfile','-NonInteractive','-Command',
  `$p=Start-Process -FilePath ${q(file)} -ArgumentList ${q(quoteArgs(args))} -PassThru -WindowStyle Hidden${wait?' -Wait':''}; ${wait?'exit $p.ExitCode':'$p.Id'}`],
  {encoding:'utf8',timeout:150000});
let devtoolsProfile=null;
function ensureDevtoolsBrowser(file,args){
 if(devtoolsProfile)return;
 devtoolsProfile=mkdtempSync(join(tmpdir(),'print03-cdp-profile-'));
 // same flags as the --dump-dom call, minus the ones that only make sense per page
 const keep=args.filter(a=>a.startsWith('--')&&!/^--(dump-dom|virtual-time-budget|user-data-dir)/.test(a));
 startProcess(file,[...keep,`--user-data-dir=${devtoolsProfile}`,`--remote-debugging-port=${PORT}`,'about:blank'],false);
 for(let i=0;i<60;i++){
  try{orig('node',['-e',`fetch('http://127.0.0.1:${PORT}/json/version').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))`],{stdio:'ignore'});return}
  catch{orig('node',['-e','setTimeout(()=>{},500)'])}
 }
 throw new Error('PRINT03 QA: DevTools browser did not start on port '+PORT);
}
process.on('exit',()=>{
 if(!devtoolsProfile)return;
 // stop only the browser started above (matched by its own temporary profile)
 const needle=devtoolsProfile.replace(/'/g,"''");
 try{orig('pwsh',['-NoProfile','-NonInteractive','-Command',
  `Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*${needle}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`],{stdio:'ignore'})}catch{}
 try{rmSync(devtoolsProfile,{recursive:true,force:true})}catch{}
});
cp.execFileSync=function(file,args,opts={}){
 if(!BROWSER.test(String(file)))return orig.call(this,file,args,opts);
 if(args.includes('--dump-dom')){
  ensureDevtoolsBrowser(file,args);
  const url=args[args.length-1];
  let html='';
  try{html=orig('node',[join(here,'cdp-dom.mjs'),url,PORT,'60000'],{encoding:'utf8',maxBuffer:64<<20,timeout:90000})}
  catch(e){html=String(e.stdout||'');if(process.env.PRINT03_QA_DEBUG)console.error('cdp-dom failed:',e.status,String(e.stderr||e.message).slice(0,600))}  // empty -> run-browser-qa.mjs records "no report in DOM"
  if(process.env.PRINT03_QA_DEBUG&&!/<script id="pl-report" type="application\/json">[\s\S]*?<\/script>/.test(html))
   console.error('cdp-dom: no report in',html.length,'chars; head:',html.slice(0,200),'tail:',html.slice(-300));
  return opts.encoding?html:Buffer.from(html);
 }
 startProcess(file,args,true);
 return opts.encoding?'':Buffer.alloc(0);
};
syncBuiltinESMExports();
await import(pathToFileURL(join(here,'..','run-browser-qa.mjs')).href);
