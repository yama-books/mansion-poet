/* Browser lifecycle regression; simulated cancellation events are not OS dialog acceptance. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const base=path.resolve(__dirname,'../..');
const out=process.env.APP003_PRINT_EVIDENCE||path.join(base,'artifacts/print-recovery');
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
   const first=await page.locator('#poemBody').innerText();
   await page.evaluate(()=>PrintLive.preview());
   await page.waitForFunction(()=>!document.querySelector('#pl-live-printbtn').disabled);
   assert.equal(await page.locator('#poemBody').innerText(),first,'preview preserves generation copy');
   assert.ok((await page.locator('#pl-live-stage').innerText()).replace(/\\n|\s/g,'').includes(first.replace(/\\n|\s/g,'')),
    'SVG paper preserves copy');
   await page.evaluate(()=>{
    window.__originalBody=document.body;window.__generate=document.querySelector('#generateBtn');
    window.print=()=>{};
   });
   for(const event of ['afterprint','pageshow','visibilitychange','focus','media-exit','throw']){
    await page.locator('#pl-live-printbtn').click();
    assert.equal(await page.evaluate(()=>document.body.classList.contains('pl-live-print')),true);
    if(event==='media-exit'){
     await page.emulateMedia({media:'print'});
     await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
     await page.waitForTimeout(300);
     assert.equal(await page.evaluate(()=>document.body.classList.contains('pl-live-print')),true,'focus during print must retain sheet');
     await page.emulateMedia({media:'screen'});
    }else if(event==='throw'){
     await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
     await page.evaluate(()=>{window.print=()=>{throw Error('test print unavailable')}});
     await page.locator('#pl-live-printbtn').click();
     await page.evaluate(()=>{window.print=()=>{}});
    }else await page.evaluate(type=>(type==='visibilitychange'?document:window).dispatchEvent(new Event(type)),event);
    await page.waitForFunction(()=>!document.body.classList.contains('pl-live-print'));
    assert.equal(await page.evaluate(()=>document.body===__originalBody&&document.querySelector('#generateBtn')===__generate),true,'normal DOM identity retained');
    assert.equal(await page.locator('#pl-live-root .pl-page').count(),0,'print clone cleaned up');
    await page.locator('#generateBtn').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('#generateBtn').isVisible(),true,'normal page recovered');
   }
   await page.locator('#regenerateBtn').click();
   await page.waitForFunction(()=>!document.querySelector('#printBtn').disabled);
   assert.equal(await page.evaluate(()=>PrintLive.hasSnapshot()),true,'generation listeners survive recovery');
   assert.notEqual(await page.locator('#poemBody').innerText(),first,'regeneration changes copy');
   await page.locator('[data-preset="kyoto"]').click();
   assert.equal(await page.evaluate(()=>PrintLive.hasSnapshot()),false,'place change invalidates old print');
   await page.locator('#generateBtn').click();
   await page.waitForFunction(()=>!document.querySelector('#printBtn').disabled);
   assert.equal(await page.evaluate(()=>PrintLive.hasSnapshot()),true,'different place can generate after recovery');
   assert.match(await page.locator('#selectedPlace').innerText(),/京都/);
   console.log(JSON.stringify({width,recovered:['afterprint','pageshow','visibilitychange','focus','media-exit','throw'],normalDOMRetained:true}));
   await page.close();
  }
  const publicPage=await browser.newPage();
  const publicBase='https://yama-books.github.io/mansion-poet/';
  await publicPage.route('**/*',route=>{
   const u=route.request().url();
   if(!u.startsWith(publicBase))return route.abort();
   const file=path.resolve(base,decodeURIComponent(u.slice(publicBase.length).split('?')[0]||'index.html'));
   if(!file.startsWith(base+path.sep))return route.abort();
   return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
  });
  await publicPage.goto(publicBase);
  assert.deepEqual(await publicPage.locator('#pl-live-media option').evaluateAll(xs=>xs.map(x=>x.value)),['svg'],
   'public hostname must expose no unapproved ART or raster candidates');
  assert.equal(await publicPage.evaluate(()=>PrintRasterAssets.list().length),0);
  console.log('PUBLIC MEDIA BOUNDARY OK: SVG only, approved raster catalogue empty');
  await publicPage.close();
 }finally{await browser.close();server.close()}
})().catch(err=>{console.error(err);server.close();process.exitCode=1});
