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
const cases=[['F01_jimbocho_3','svg'],['F01_jimbocho_3','photo'],
 ['F01_jimbocho_3','missing'],['F04_residential_0','photo'],
 ['F03_kyoto_3_longnames','photo']];
const reports=[];
for(const [fixture,media] of cases){
 const url=base+'?fixture='+fixture+'&media='+media+'&sheet=auto&height=84&focus=50';
 const name=fixture+'__'+media;
 const run=opts=>execFileSync(browser,[...flags,...opts,url],{
   encoding:'utf8',timeout:65000,maxBuffer:12*1024*1024});
 try{
  const html=run(['--dump-dom']);
  const marker=html.match(/<html[^>]*data-img01="([^"]+)"/)?.[1]||'absent';
  const mode=html.match(/<html[^>]*data-img01-mode="([^"]+)"/)?.[1]||'absent';
  const wanted=media==='photo'?'reference_photo':'existing_svg';
  const ok=marker==='pass'&&mode===wanted;
  if(ok){
   run(['--window-size=1250,1900','--screenshot='+folder+'/'+name+'.png']);
   if(fixture==='F01_jimbocho_3')
    run(['--no-pdf-header-footer','--print-to-pdf='+folder+'/'+name+'.pdf']);
   if(statSync(folder+'/'+name+'.png').size<1000)throw new Error('empty screenshot');
   if(fixture==='F01_jimbocho_3'&&statSync(folder+'/'+name+'.pdf').size<1000)
     throw new Error('empty A4 PDF');
  }
  const row={fixture,media,ok,marker,mode,screenshot:ok?name+'.png':null,
   pdf:ok&&fixture==='F01_jimbocho_3'?name+'.pdf':null};
  reports.push(row);console.log(JSON.stringify(row));
 }catch(e){const row={fixture,media,ok:false,error:String(e).slice(0,400)};
   reports.push(row);console.error(JSON.stringify(row))}
}
writeFileSync(folder+'/browser-results.json',JSON.stringify({browser,reports},null,2));
if(reports.some(x=>!x.ok))process.exitCode=1;
