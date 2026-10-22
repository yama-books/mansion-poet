/* APP-003 UI01-MOBILE smoke: mobile viewport behavior in real Chromium.
 * A browser viewport is not an iPhone Safari device.
 * Test never sends actual address/POI requests and saves no private data.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const BASE=process.env.APP003_TEST_URL||'http://127.0.0.1:8765/index.html';
const BROWSER=process.env.CHROME_PATH||'/usr/bin/google-chrome';
const OUT=process.env.APP003_SCREENSHOTS||'artifacts/mobile-device';
const SIZES=[
 {name:'iphone-320',width:320,height:740},
 {name:'iphone-375',width:375,height:812},
 {name:'iphone-390',width:390,height:844},
 {name:'iphone-430',width:430,height:932},
 {name:'desktop',width:1440,height:900}
];
async function assertUsable(page,label,isMobile){
 const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
 assert.ok(width.scroll<=width.client+1,'Horizontal overflow '+label+': '+JSON.stringify(width));
 if(isMobile){
  const quick=page.locator('.header-quick-link');
  await quick.waitFor({state:'visible'});
  const rect=await quick.boundingBox();
  assert.ok(rect && rect.height>=44 && rect.width>=44,'Studio shortcut touch area '+label);
  const essential=['#searchBtn','#placeInput','#generateBtn','.examples .chip','#regenerateBtn','#copyBtn','#copyBundleBtn','#printBtn'];
  for(const selector of essential){
   const target=page.locator(selector).first();
   const bbox=await target.boundingBox();
   assert.ok(bbox && bbox.height>=44,'Too-small touch area '+label+': '+selector+' height '+bbox?.height);
  }
  const size=await page.locator('#placeInput').evaluate(el=>Number.parseFloat(getComputedStyle(el).fontSize));
  assert.ok(size>=16,'iPhone keyboard zoom regression '+label+': '+size);
  assert.equal(await page.locator('#placeInput').getAttribute('enterkeyhint'),'search','iPhone search keyboard action '+label);
  assert.equal(await page.locator('#searchStatus').getAttribute('role'),'status','Search feedback must be announced '+label);
  await quick.click();
  assert.equal(new URL(page.url()).hash,'#discover','Shortcut should navigate to studio');
  const position=await page.locator('#discover').evaluate(el=>el.getBoundingClientRect().top);
  assert.ok(position<300,'Studio destination is not visible after quick link '+label+': '+position);
  await page.locator('#placeInput').focus();
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'placeInput');
 }
 const preset=page.locator('[data-preset="nakano"]');
 await preset.click();
 assert.equal((await page.locator('#selectedPlace').innerText()).trim(),'東京都中野区中野');
 assert.equal(await page.locator('#copyBtn').isDisabled(),true,'No stale copy should be enabled after location change');
 assert.equal(await page.locator('#copyBundleBtn').isDisabled(),true,'No stale bundle should be enabled after location change');
 assert.equal(await page.locator('#printBtn').isDisabled(),true,'No stale print should be enabled after location change');
 const next=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
 assert.ok(next.scroll<=next.client+1,'Overflow after location change '+label);
 const dir=path.resolve(OUT);fs.mkdirSync(dir,{recursive:true});
 await page.locator('#discover').screenshot({path:path.join(dir,label+'-workspace.png')});
 await page.locator('#poem').screenshot({path:path.join(dir,label+'-poem.png')});
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:BROWSER,args:['--disable-dev-shm-usage','--no-sandbox']});
 try{
  for(const size of SIZES){
   const context=await browser.newContext({viewport:{width:size.width,height:size.height},isMobile:size.width<=430,hasTouch:size.width<=430,deviceScaleFactor:1,locale:'ja-JP',reducedMotion:'reduce'});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   // Deterministic offline state: no third-party requests, real user location or POI queries.
   await page.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith('http://127.0.0.1:8765/')||url.startsWith('http://localhost:8765/'))return route.continue();
    return route.abort();
   });
   const response=await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
   assert.equal(response?.status(),200);
   await assertUsable(page,size.name,size.width<=430);
   assert.deepEqual(errors,[],'Unexpected JS errors '+size.name);
   console.log('DEVICE VIEWPORT OK',size.name,size.width,size.height);
   await context.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
