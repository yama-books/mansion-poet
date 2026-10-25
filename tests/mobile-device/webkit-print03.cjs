/* Safari-engine regression for PRINT03. Controlled fake provider and no external requests.
 * The Linux Playwright WebKit engine is not iPhone Safari hardware.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {webkit,devices}=require('playwright');
const url=process.env.APP003_TEST_URL||'http://127.0.0.1:8765/index.html';
const out=process.env.APP003_WEBKIT_EVIDENCE||'artifacts/webkit-live';
fs.mkdirSync(out,{recursive:true});
const pois=[
 {id:'test_library',name:'試験用図書館',category:'library',lat:35.70742,lng:139.66594},
 {id:'test_park',name:'試験用公園',category:'park',lat:35.70744,lng:139.66595},
 {id:'test_museum',name:'試験用博物館',category:'museum',lat:35.70746,lng:139.66596}
];
function json(route,data){return route.fulfill({status:200,contentType:'application/json',
 headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)})}
(async()=>{
 const browser=await webkit.launch({headless:true});
 const context=await browser.newContext({...devices['iPhone 13'],locale:'ja-JP',reducedMotion:'reduce'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const u=route.request().url();
  if(/^http:\/\/127\.0\.0\.1:8765\//.test(u)||/^data:/.test(u))return route.continue();
  if(u.startsWith('https://api.openpoiapi.com/v1/search'))return json(route,{results:pois});
  if(u.startsWith('https://overpass.kumi.systems/api/interpreter'))return json(route,{elements:[]});
  return route.abort();
 });
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('[data-preset="nakano"]').click();
  await page.locator('#generateBtn').click();
  await page.waitForFunction(()=>!document.querySelector('#generateBtn').disabled,null,{timeout:25000});
  assert.equal(await page.locator('#printBtn').isEnabled(),true,'Print unavailable after generation');
  await page.locator('#printLayout').selectOption('print03');
  await page.locator('#printBtn').click();
  await page.waitForFunction(()=>document.querySelector('#pl-live-status')?.textContent.includes('ページ')||
    document.querySelector('#pl-live-status')?.textContent.includes('確認できません'),null,{timeout:20000});
  const svg=await page.evaluate(()=>({
   status:document.querySelector('#pl-live-status')?.textContent,
   diagnostics:window.__APP003_PRINT_DIAGNOSTICS,
   report:window.__APP003_PRINT_REPORT,
   pageCount:document.querySelectorAll('#pl-live-stage .pl-page').length
  }));
  console.log('WEBKIT_SVG',JSON.stringify(svg));
  await page.locator('#pl-live-media').selectOption('art');
  await page.waitForFunction(()=>document.querySelector('#pl-live-status')?.textContent.includes('ページ')||
    document.querySelector('#pl-live-status')?.textContent.includes('確認できません'),null,{timeout:20000});
  const art=await page.evaluate(()=>({
   status:document.querySelector('#pl-live-status')?.textContent,
   diagnostics:window.__APP003_PRINT_DIAGNOSTICS,
   report:window.__APP003_PRINT_REPORT,
   pageCount:document.querySelectorAll('#pl-live-stage .pl-page').length,
   pixels:document.querySelector('#pl-live-stage .pl-img01-preview-photo')?.naturalWidth||0
  }));
  console.log('WEBKIT_ART',JSON.stringify(art));
  const autoSize=await page.locator('#pl-live-stage .pl-page').first().evaluate(el=>
   getComputedStyle(el).getPropertyValue('-webkit-text-size-adjust').trim());
  console.log('WEBKIT_PRINT_TEXT_ADJUST',autoSize);
  assert.equal(autoSize,'100%','iOS Safari A4 should bypass viewport-based text autosizing');
  const evidence={svg,art,errors,ua:await page.evaluate(()=>navigator.userAgent)};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(evidence,null,2));
  await page.screenshot({path:path.join(out,'safari-engine.png'),fullPage:true,timeout:15000});
  assert.equal(svg.report?.ok,true,'WebKit SVG A4 preflight failed: '+JSON.stringify(svg.diagnostics));
  assert.equal(art.report?.ok,true,'WebKit independent ART A4 preflight failed: '+JSON.stringify(art.diagnostics));
  assert.equal(art.pixels,1672,'ART is not loaded from original pixel asset');
  assert.deepEqual(errors,[],'Unexpected WebKit page exceptions');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
