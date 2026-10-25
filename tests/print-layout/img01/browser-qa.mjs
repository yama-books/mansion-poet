// Browser evidence script. Requires a real local Chromium; no hosted preview.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const browser=['google-chrome','chromium','google-chrome-stable'].find(name=>{
 try{execFileSync('which',[name],{stdio:'ignore'});return true}catch{return false}
});
if(!browser)throw new Error('Real Chromium executable missing; visual QA cannot be claimed');
const folder=resolve('tests/print-layout/img01/qa-output');
mkdirSync(folder,{recursive:true});
const base=pathToFileURL(resolve('tests/print-layout/img01/preview.html')).href;
const flags=['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--allow-file-access-from-files','--disable-background-networking','--virtual-time-budget=12000'];
const cases=[['F01_jimbocho_3','svg','auto'],['F01_jimbocho_3','photo','auto'],
 ['F01_jimbocho_3','missing','auto'],['F01_jimbocho_3','photo','duplex'],
 ['F04_residential_0','photo','auto'],['F03_kyoto_3_longnames','photo','auto'],
 ['F01_jimbocho_3','art','auto'],['F01_jimbocho_3','art','duplex'],
 ['F04_residential_0','art','auto'],['F03_kyoto_3_longnames','art','auto']];
const reports=[];
for(const [fixture,media,sheet] of cases){
 const url=base+'?fixture='+fixture+'&media='+media+'&sheet='+sheet+'&height=84&focus=50';
 const name=fixture+'__'+media+(sheet==='duplex'?'__duplex':'');
 const run=opts=>execFileSync(browser,[...flags,...opts,url],{
   encoding:'utf8',timeout:65000,maxBuffer:12*1024*1024});
 try{
  const html=run(['--dump-dom']);
  const marker=html.match(/<html[^>]*data-img01="([^"]+)"/)?.[1]||'absent';
  const mode=html.match(/<html[^>]*data-img01-mode="([^"]+)"/)?.[1]||'absent';
  const wanted=media==='art'?'independent_art':media==='photo'?'reference_photo':'existing_svg';
  const ok=marker==='pass'&&mode===wanted;
  let pdfPages=null,pdfA4=null,pdfTextLength=null;
  const needsPdf=fixture==='F01_jimbocho_3'||fixture==='F03_kyoto_3_longnames'||media==='art';
  if(ok){
   run(['--window-size=1250,1900','--screenshot='+folder+'/'+name+'.png']);
   if(statSync(folder+'/'+name+'.png').size<1000)throw new Error('empty screenshot');
   if(needsPdf){
    const pdf=folder+'/'+name+'.pdf';
    run(['--no-pdf-header-footer','--print-to-pdf='+pdf]);
    if(statSync(pdf).size<1000)throw new Error('empty A4 PDF');
    const info=execFileSync('pdfinfo',[pdf],{encoding:'utf8'});
    pdfPages=Number(info.match(/^Pages:\s*(\d+)/m)?.[1]||0);
    const size=info.match(/^Page size:\s*([\d.]+) x ([\d.]+) pts/m);
    pdfA4=Boolean(size&&Math.abs(Number(size[1])-595.28)<2&&Math.abs(Number(size[2])-841.89)<2);
    if(!pdfA4)throw new Error('PDF is not A4 portrait');
    if(sheet==='auto'&&pdfPages!==1&&fixture!=='F03_kyoto_3_longnames')throw new Error('A4 single-page requirement failed: '+pdfPages+' pages');
    if(sheet==='auto'&&pdfPages!==1)console.warn('KNOWN OPEN: long-name fixture requires '+pdfPages+' A4 pages; do not classify as single-page acceptance');
    const pdfText=execFileSync('pdftotext',['-layout',pdf,'-'],{encoding:'utf8'});
    pdfTextLength=pdfText.trim().length;
    if(pdfTextLength<100||!/創作|架空/.test(pdfText))throw new Error('PDF text/fiction note missing');
    if(fixture==='F01_jimbocho_3'&&!pdfText.includes('知の深奥'))throw new Error('F01 headline missing in PDF');
   }
  }
  const ppi=Number(html.match(/data-img01-ppi="([^"]+)"/)?.[1]);
  const row={fixture,media,sheet,ok,marker,mode,
   effectivePpiCover:Number.isFinite(ppi)&&ppi>0?ppi:null,
   screenshot:ok?name+'.png':null,pdf:ok&&needsPdf?name+'.pdf':null,
   pdfPages,pdfA4,pdfTextLength,singlePageRequirementMet:pdfPages===null?null:pdfPages===1};
  reports.push(row);console.log(JSON.stringify(row));
 }catch(e){const row={fixture,media,sheet,ok:false,error:String(e).slice(0,400)};
   reports.push(row);console.error(JSON.stringify(row))}
}
writeFileSync(folder+'/browser-results.json',JSON.stringify({browser,reports},null,2));
if(reports.some(x=>!x.ok))process.exitCode=1;
