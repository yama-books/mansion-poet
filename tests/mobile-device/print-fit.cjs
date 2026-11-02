/* Native Chromium PDF pagination. Mobile viewport emulation is not iPhone hardware. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const base=path.resolve(__dirname,'../..');
const out=process.env.APP003_PRINT_EVIDENCE||path.join(base,'artifacts/print-fit');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(base,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(base+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(err?'missing':data)});
});
const pois=['library','park','museum'].map((category,i)=>({id:'test_'+category,name:'試験用'+category,
 category,lat:35.70742+i*.00002,lng:139.66594+i*.00001}));
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/index.html`;
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 fs.mkdirSync(out,{recursive:true});
 try{
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});
   await page.route('**/*',route=>{
    const u=route.request().url();
    if(u.startsWith(new URL(url).origin))return route.continue();
    if(u.startsWith('https://api.openpoiapi.com/v1/search'))return route.fulfill({json:{results:pois}});
    if(u.includes('/api/interpreter'))return route.fulfill({json:{elements:[]}});
    return route.abort();
   });
   await page.goto(url);
   await page.locator('[data-preset="nakano"]').click();
   await page.locator('#generateBtn').click();
   await page.waitForFunction(()=>!document.querySelector('#printBtn').disabled);
   await page.locator('#printBtn').click();
   await page.waitForFunction(()=>!document.querySelector('#pl-live-printbtn').disabled);
   const original=await page.locator('#pl-live-stage').innerText();
   await page.evaluate(()=>{window.print=()=>{}});
   await page.locator('#pl-live-printbtn').click();
   await page.emulateMedia({media:'print'});
   const report=await page.evaluate(()=>({
    fit:PrintPaginate.fitPages(document.querySelector('#pl-live-root')),
    pages:document.querySelectorAll('#pl-live-root .pl-page').length,
    text:document.querySelector('#pl-live-root').innerText
   }));
   assert.equal(report.fit.ok,true,JSON.stringify(report));
   assert.equal(report.pages,1,'ordinary fixture should fit one page');
   assert.equal(report.text.replace(/\s/g,''),original.replace(/\s/g,''),'all print text retained');
   const pdf=await page.pdf({preferCSSPageSize:true,printBackground:true});
   const count=[...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length;
   assert.equal(count,1,'native PDF must not append a blank page');
   fs.writeFileSync(path.join(out,`a4-${width}.pdf`),pdf);
   fs.writeFileSync(path.join(out,`a4-${width}.json`),JSON.stringify(report,null,2));
   console.log(JSON.stringify({width,pdfPages:count,fit:report.fit}));
   await page.close();
  }
 }finally{await browser.close();server.close()}
})().catch(err=>{console.error(err);server.close();process.exitCode=1});
