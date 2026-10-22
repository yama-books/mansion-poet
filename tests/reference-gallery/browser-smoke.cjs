/* Browser-level mobile and desktop smoke test for REF-LIB-03.
 * Requires playwright-core (CI installs it temporarily) and preinstalled Chrome.
 * Does not alter the real GitHub Pages deployment.
 */
'use strict';
const {chromium}=require('playwright-core');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const URL=process.env.GALLERY_TEST_URL || 'http://127.0.0.1:8765/tools/reference-gallery/index.html';
const OUTPUT=process.env.GALLERY_SCREENSHOT_DIR || path.resolve('artifacts/reference-gallery');
const chrome=process.env.CHROME_PATH || '/usr/bin/google-chrome';
async function main(){
 fs.mkdirSync(OUTPUT,{recursive:true});
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--disable-dev-shm-usage']});
 try{
  for(const size of [{name:'desktop',width:1440,height:900},{name:'mobile390',width:390,height:844},{name:'mobile320',width:320,height:740}]){
   const context=await browser.newContext({viewport:{width:size.width,height:size.height},deviceScaleFactor:1,hasTouch:size.width<600,isMobile:size.width<600});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto(URL,{waitUntil:'networkidle'});
   assert.equal(response.status(),200,'HTML response '+size.name);
   await page.locator('.reference-card').first().waitFor();
   assert.equal(await page.locator('.reference-card').count(),19,'complete gallery '+size.name);
   assert.match(await page.locator('#result-count').innerText(),/19 \/ 19/);
   let image=page.locator('.thumbnail').first();
   await image.evaluate(async i=>{if(!i.complete)await new Promise((res,rej)=>{i.addEventListener('load',res,{once:true});i.addEventListener('error',rej,{once:true})})});
   assert.ok(await image.evaluate(i=>i.naturalWidth>0),'image loads '+size.name);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow '+size.name);
   await page.screenshot({path:path.join(OUTPUT,size.name+'-list.png'),fullPage:true});
   await page.locator('#template').selectOption('template:location');
   assert.equal(await page.locator('.reference-card').count(),2);
   await page.locator('#search').fill('水辺');
   assert.equal(await page.locator('.reference-card').count(),1);
   await page.locator('#reset').click();
   assert.equal(await page.locator('.reference-card').count(),19);
   await page.locator('.reference-card').nth(1).click();
   await page.locator('#viewer[open]').waitFor();
   assert.ok(await page.locator('#viewer-title').innerText());
   await page.screenshot({path:path.join(OUTPUT,size.name+'-detail.png')});
   await page.locator('#viewer-next').click();
   assert.match(await page.locator('#viewer-title').innerText(),/REF-0001/);
   await page.locator('#close-viewer').click();
   assert.equal(await page.locator('#viewer[open]').count(),0);
   assert.deepEqual(errors,[],'runtime errors '+size.name);
   await context.close();
   process.stdout.write('BROWSER OK '+size.name+': 19 images, tag filtering, touch detail, no overflow\n');
  }
 }finally{await browser.close();}
}
main().catch(e=>{process.stderr.write(e.stack+'\n');process.exitCode=1;});
