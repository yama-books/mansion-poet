// PRINT03-CORE local browser QA (not part of CI: needs a local Chromium-family
// browser and PyMuPDF). For every fixture x template it
//  1. loads preview.html headless and reads the DOM preflight report,
//  2. prints a real A4 PDF with the browser's own print pipeline,
//  3. checks the PDF: page count == DOM page count, A4 size, every required
//     string (poem, cards, notes, credits) present in the text layer.
// Usage: node tests/print-layout/run-browser-qa.mjs [--out DIR] [--browser PATH] [--only F01_jimbocho_3]
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const here=dirname(fileURLToPath(import.meta.url));
const RC=require('../../src/print-layout/render-core.js');
require('../../src/print-layout/templates.js');
const {list}=require('./fixtures.js');

const arg=(k,d)=>{const i=process.argv.indexOf(k);return i>0?process.argv[i+1]:d};
const out=resolve(arg('--out',join(here,'output')));
const only=arg('--only',null);
const candidates=[arg('--browser',null),process.env.PRINT03_BROWSER,
 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe',
 'C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/chromium','/usr/bin/google-chrome'].filter(Boolean);
const browser=candidates.find(p=>existsSync(p));
if(!browser){console.error('No Chromium-family browser found; pass --browser PATH. Browser QA NOT run.');process.exit(2)}
mkdirSync(out,{recursive:true});
const profile=join(out,'.browser-profile');
const preview=pathToFileURL(join(here,'preview.html')).href;
const flags=['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-extensions',
 `--user-data-dir=${profile}`,'--allow-file-access-from-files','--virtual-time-budget=6000','--run-all-compositor-stages-before-draw'];

const cases=[];
for(const f of list)for(const t of RC.templateIds())cases.push({f,t,fonts:'local',sheet:'auto'});
// front/back sheet with the back-side position diagram, every fixture, type_poem + location
for(const f of list)for(const t of ['type_poem','location'])cases.push({f,t,fonts:'local',sheet:'duplex'});
cases.push({f:list[0],t:'type_poem',fonts:'broken',sheet:'auto'});
// map fallbacks: forced tile failure, and map switched off
cases.push({f:list[0],t:'type_poem',fonts:'local',sheet:'duplex',map:'fail'});
cases.push({f:list[0],t:'type_poem',fonts:'local',sheet:'duplex',map:'off'});
const python=process.env.PYTHON||'python';
const rows=[];
for(const {f,t,fonts,sheet,map='gsi'} of cases){
 if(only&&f.fixtureId!==only)continue;
 const name=`${t}__${f.fixtureId}${fonts==='broken'?'__fontfail':''}${sheet==='duplex'?'__duplex':''}${map!=='gsi'?'__map'+map:''}`;
 const url=`${preview}?fixture=${encodeURIComponent(f.fixtureId)}&template=${t}&fonts=${fonts}&sheet=${sheet}&map=${map}`;
 const row={case:name,template:t,fixture:f.fixtureId,fonts,sheet,map};
 try{
  const dom=execFileSync(browser,[...flags,'--dump-dom',url],{encoding:'utf8',maxBuffer:64<<20,timeout:150000});
  const m=dom.match(/<script id="pl-report" type="application\/json">([\s\S]*?)<\/script>/);
  const rep=m?JSON.parse(m[1]):null;
  const r=rep?.reports?.[0];
  row.dom=r?{mapTiles:r.mapTiles??null,ok:r.ok,pageCount:r.pageCount,mode:r.mode,level:r.level,backLevel:r.backLevel,minFontPt:r.minFontPt,minCreativePt:r.minCreativePt,failures:r.failures,error:r.error}:{ok:false,error:'no report in DOM'};
  const pdf=join(out,name+'.pdf');
  if(existsSync(pdf))rmSync(pdf);
  execFileSync(browser,[...flags,'--no-pdf-header-footer',`--print-to-pdf=${pdf}`,url],{stdio:'ignore',timeout:150000});
  const rr=RC.render(t,f.data,{sheet,mapTiles:row.dom.mapTiles?.used?'gsi-pale':false});
  const required=row.dom.mode==='duplex'?rr.sides.required:rr.required;
  row.positionMap=row.dom.mode==='duplex'?rr.sides.positionMap:null;
  const reqPath=join(out,name+'.required.json');writeFileSync(reqPath,JSON.stringify(required));
  const pdfr=JSON.parse(execFileSync(python,['-P',join(here,'check_pdf.py'),pdf,reqPath,join(out,name)],{encoding:'utf8'}));
  row.pdf={pageCount:pdfr.pageCount,a4:pdfr.pageSizesMm.every(([w,h])=>Math.abs(w-210)<1&&Math.abs(h-297)<1),
   missing:pdfr.missing,outside:pdfr.outside,fonts:pdfr.fonts,pngs:pdfr.pngs.map(p=>p.slice(out.length+1))};
  row.ok=row.dom.ok&&row.pdf.a4&&!pdfr.missing.length&&!pdfr.outside.length&&pdfr.pageCount===row.dom.pageCount;
 }catch(e){row.ok=false;row.error=String(e.message||e).slice(0,400)}
 rows.push(row);
 console.log(`${row.ok?'PASS':'FAIL'} ${name} dom=${row.dom?.pageCount??'-'}p(${row.dom?.mode??'-'} L${row.dom?.level??'-'}${row.dom?.backLevel!=null?'/'+row.dom.backLevel:''} min ${row.dom?.minFontPt??'-'}pt creative ${row.dom?.minCreativePt??'-'}pt) pdf=${row.pdf?.pageCount??'-'}p a4=${row.pdf?.a4??'-'} missing=${row.pdf?.missing?.length??'-'}${row.positionMap!=null?' diagram='+row.positionMap:''}${row.dom?.mapTiles?' tiles='+(row.dom.mapTiles.used?'gsi':'none')+'('+row.dom.mapTiles.tiles+'/'+row.dom.mapTiles.failed+'fail)':''}${row.error?' ERR '+row.error:''}${row.dom?.failures?.length?' '+JSON.stringify(row.dom.failures).slice(0,300):''}`);
}
if(!only){
 try{console.log('compare sheet: '+execFileSync(python,['-P',join(here,'make_compare_sheet.py'),out],{encoding:'utf8'}).trim())}
 catch(e){console.log('compare sheet NOT generated: '+String(e.message||e).slice(0,200))}
}
const summary={browser,generatedAt:new Date().toISOString(),total:rows.length,passed:rows.filter(r=>r.ok).length,rows};
writeFileSync(join(out,'qa-report.json'),JSON.stringify(summary,null,1));
console.log(`\n${summary.passed}/${summary.total} cases passed. Report: ${join(out,'qa-report.json')}`);
process.exit(summary.passed===summary.total?0:1);
