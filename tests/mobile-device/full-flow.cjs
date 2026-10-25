/* APP-003 UI01 full interaction E2E (Chromium, deterministic mocked services).
 * Browser tests are not a substitute for iPhone Safari device acceptance.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');

const BASE=process.env.APP003_TEST_URL||'http://127.0.0.1:8765/index.html';
const OUT=path.resolve(process.env.APP003_SCREENSHOTS||'artifacts/mobile-device');
const CHROME=process.env.CHROME_PATH||'/usr/bin/google-chrome';
const TEST_POIS=[
  {id:'test_library',name:'試験用図書館',category:'library',lat:35.70742,lng:139.66594},
  {id:'test_park',name:'試験用公園',category:'park',lat:35.70744,lng:139.66595},
  {id:'test_museum',name:'試験用博物館',category:'museum',lat:35.70746,lng:139.66596},
  {id:'test_university',name:'試験用大学',category:'university',lat:35.70748,lng:139.66598}
];
function okJson(route,body,status=200){
 return route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(body)});
}
async function verifyFlow(browser,scenario){
 const context=await browser.newContext({
  viewport:scenario.viewport,isMobile:scenario.mobile,hasTouch:scenario.mobile,
  deviceScaleFactor:1,locale:'ja-JP',reducedMotion:'reduce',
  permissions:['clipboard-read','clipboard-write']
 });
 const page=await context.newPage();
 const jsErrors=[],unexpectedCalls=[];
 let providerMode='normal',lookupCount=0;
 page.on('pageerror',e=>jsErrors.push(e.message));
 await page.addInitScript(()=>{
  window.__app003PrintCalls=[];
  window.print=()=>{window.__app003PrintCalls.push(document.body.dataset.printLayout)};
 });
 await page.route('**/*',async route=>{
  const u=route.request().url();
  if(u.startsWith('http://127.0.0.1:8765/')||u.startsWith('http://localhost:8765/'))return route.continue();
  if(u.startsWith('https://msearch.gsi.go.jp/address-search/AddressSearch')){
   lookupCount++;
   return okJson(route,[{
    geometry:{coordinates:[139.6659,35.7074]},
    properties:{title:'東京都中野区中野（試験用）'}
   }]);
  }
  if(u.startsWith('https://api.openpoiapi.com/v1/search')){
   return providerMode==='down'?okJson(route,{error:'offline fixture'},503):okJson(route,{results:TEST_POIS});
  }
  if(u.startsWith('https://overpass.kumi.systems/api/interpreter')){
   return providerMode==='down'?okJson(route,{error:'offline fixture'},503):okJson(route,{elements:[]});
  }
  if(!u.startsWith('data:'))unexpectedCalls.push(new URL(u).host);
  return route.abort();
 });
 try{
  const r=await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(r?.status(),200);
  await page.locator('#placeInput').fill('東京都中野');
  await page.locator('#searchBtn').click();
  await page.locator('#searchResults .result-item').first().waitFor({state:'visible'});
  assert.equal(lookupCount,1,'Place search must use a single fixture request');
  await page.locator('#searchResults .result-item').first().click();
  assert.equal(await page.locator('#selectedPlace').innerText(),'東京都中野区中野（試験用）');
  assert.equal(await page.locator('#copyBtn').isDisabled(),true);
  await page.locator('#generateBtn').click();
  await page.waitForFunction(()=>!document.querySelector('#generateBtn').disabled,{timeout:20000});
  assert.equal(await page.locator('#copyBtn').isEnabled(),true,'Poem copy enabled after generation');
  assert.equal(await page.locator('#copyBundleBtn').isEnabled(),true,'Bundle copy enabled with verified POI');
  assert.equal(await page.locator('#printBtn').isEnabled(),true,'Print enabled after generation');
  assert.ok(await page.locator('#locationCards .location-card').count()>0,'No location cards for valid POIs');
  assert.doesNotMatch(await page.locator('#locationCards').innerText(),
   /所在地詳細：公開データ未収録|所在地（公開データ|地域情報のみ/,
   'An advertisement should omit missing-address source diagnostics');
  const current=await page.locator('#poemBody').innerText();
  assert.ok(current.length>10,'Generated poem is empty');

  await page.locator('#copyBtn').click();
  let copied=await page.evaluate(()=>navigator.clipboard.readText());
  assert.ok(copied.includes('※架空の物件を題材にした創作広告です。'));
  assert.ok(!copied.includes('【LOCATION 01'),'Poem-only copy included card information');
  assert.doesNotMatch(copied,/周辺の公開データに記された|公開データ|公開情報|データ上では/,'Advertisement contains meta-data phrasing');

  await page.locator('#copyBundleBtn').click();
  copied=await page.evaluate(()=>navigator.clipboard.readText());
  assert.ok(copied.includes('【LOCATION 01'),'Bundled copy is missing location header');
  assert.ok(copied.includes('直線 約'),'Bundled copy is missing straight-line distance');
  assert.ok(!copied.includes('所在地詳細：公開データ未収録'),'No missing-address message in the copied advertisement');
  assert.ok(!copied.includes('徒歩約'),'Never invent walking time from straight-line distance');

  await page.locator('#printLayout').selectOption('onepage');
  await page.locator('#printBtn').click();
  assert.deepEqual(await page.evaluate(()=>window.__app003PrintCalls),['onepage']);
  // Print preview must be a single A4 page, not a nearly blank second sheet.
  // Chromium prints the same @page and @media print CSS used by the Web UI.
  fs.mkdirSync(OUT,{recursive:true});
  const pdf=await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:true,
    path:path.join(OUT,scenario.name+'-onepage-ad.pdf')});
  const pageCount=(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
  assert.ok(pageCount>0,'Unable to read PDF page count');
  assert.equal(pageCount,1,'A4 onepage layout generated extra sheets: '+scenario.name);
  await page.locator('#poem').screenshot({path:path.join(OUT,scenario.name+'-complete-poem.png')});
  await page.locator('#discover').screenshot({path:path.join(OUT,scenario.name+'-complete-workspace.png')});
  // PRINT03: actual app-generated POEM/LOCATION must render with independent ART.
  await page.locator('#printLayout').selectOption('print03');
  await page.locator('#printBtn').click();
  await page.waitForFunction(()=>window.__APP003_PRINT_REPORT?.ok===true,{timeout:20000});
  assert.equal(await page.locator('#pl-live-printbtn').isEnabled(),true,'New A4 print not ready');
  assert.equal(await page.locator('#pl-live-panel .pl-page').count()>0,true,'Print preview missing A4 paper');
  const liveText=await page.locator('#pl-live-panel').innerText();
  assert.ok(liveText.includes('試験用図書館'),'Live POI missing from A4 preview');
  assert.ok(liveText.includes(current.split('\\n')[0])||liveText.includes('架空の創作広告'),'Poem not represented');
  await page.locator('#pl-live-media').selectOption('art');
  await page.waitForFunction(()=>window.__APP003_PRINT_REPORT?.media==='independent_art',{timeout:20000});
  assert.equal(await page.locator('#pl-live-panel .pl-img01-preview-photo').evaluate(im=>im.naturalWidth),1672,'Expected independent 1672px original');
  await page.locator('#pl-live-printbtn').click();
  assert.equal(await page.evaluate(()=>document.body.classList.contains('pl-live-print')),true);
  const livePdf=await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:true,
    path:path.join(OUT,scenario.name+'-print03-live-art.pdf')});
  const livePages=(livePdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
  assert.ok(livePages>=1&&livePages<=3,'Unexpected live A4 page count '+livePages);
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await page.locator('#pl-live-close').click();
  console.log('PRINT03 LIVE FLOW OK',scenario.name,'pages',livePages);
  // Restore the legacy onepage selector for the pre-existing PRINT-02 stress test.
  await page.locator('#printLayout').selectOption('onepage');
  await page.locator('#printBtn').click();
  // Stress the single-sheet composition using lengths comparable with real
  // long school, library and cultural names, while retaining all three cards.
  await page.evaluate(()=>{
    const names=['明治鍼灸柔整予備校','神保町文化学術交流センター','都心文化情報総合ライブラリー'];
    document.querySelectorAll('#locationCards .location-card').forEach((card,i)=>{
      const h=card.querySelector('.location-card-name');
      const p=card.querySelector('.location-card-copy');
      if(h)h.textContent=names[i]||'学術文化交流施設';
      if(p)p.textContent='街角の多様な表情をつなぐ、身近な文化の一景。日々の風景に、新しい視線と余韻を重ねるロケーション。';
    });
  });
  const longPdf=await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:true,
    path:path.join(OUT,scenario.name+'-onepage-long-names.pdf')});
  const longPages=(longPdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
  assert.equal(longPages,1,'Long-name A4 advertisement overflowed to another sheet: '+scenario.name);
  console.log('E2E COMPLETE FLOW OK',scenario.name);

  // Simulate service outage only after selection. Previous POI copy must be cleared.
  providerMode='down';
  await page.locator('[data-preset="kyoto"]').click();
  assert.equal(await page.locator('#copyBtn').isDisabled(),true,'Stale poem copy enabled on selection change');
  assert.equal(await page.evaluate(()=>window.PrintLive.hasSnapshot()),false,'Stale print snapshot survived location change');
  assert.equal(await page.locator('#pl-live-panel').isHidden(),true,'Old A4 preview visible on location change');
  assert.equal(await page.locator('#copyBundleBtn').isDisabled(),true,'Stale bundle enabled on selection change');
  await page.locator('#generateBtn').click();
  await page.waitForFunction(()=>!document.querySelector('#generateBtn').disabled,{timeout:20000});
  assert.equal(await page.locator('#copyBtn').isEnabled(),true,'Outage must allow a place-only poem');
  assert.equal(await page.locator('#copyBundleBtn').isDisabled(),true,'Outage must not enable stale locations');
  assert.equal(await page.locator('#locationCards .location-card').count(),0,'Stale cards leaked after outage');
  assert.match(await page.locator('#generatedStatus').innerText(),/施設データを取得できませんでした/);
  await page.locator('#copyBtn').click();
  copied=await page.evaluate(()=>navigator.clipboard.readText());
  assert.ok(!copied.includes('試験用図書館'),'Previous place leaked into copied text');
  assert.equal(await page.locator('#selectedPlace').innerText(),'京都府京都市中京区');
  await page.locator('#poem').screenshot({path:path.join(OUT,scenario.name+'-outage-poem.png')});
  assert.deepEqual(jsErrors,[],'Unexpected JS exceptions: '+jsErrors.join('; '));
  console.log('E2E OUTAGE / NO STALE COPIES OK',scenario.name);
 }finally{
  await context.close();
 }
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:CHROME,args:['--disable-dev-shm-usage','--no-sandbox']});
 try{
  await verifyFlow(browser,{name:'mobile-390',mobile:true,viewport:{width:390,height:844}});
  await verifyFlow(browser,{name:'desktop-1440',mobile:false,viewport:{width:1440,height:900}});
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
