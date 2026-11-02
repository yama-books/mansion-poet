/* Synthetic PNG integration fixture; contains no real property or approved public photo. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const zlib=require('node:zlib');
const {chromium}=require('playwright-core');
const base=path.resolve(__dirname,'../..');
const out=process.env.APP003_PRINT_EVIDENCE||path.join(base,'artifacts/raster-print');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(base,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(base+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(err?'missing':data)});
});
const pois=['library','park','museum'].map((category,i)=>({id:'test_'+category,name:'試験用'+category,
 category,lat:35.70742+i*.00002,lng:139.66594+i*.00001}));
const sizes={original:[3000,2000],print:[2600,1800],preview:[650,450],thumb:[130,90]};
const asset={assetId:'synthetic-test',alt:'合成PNGテスト画像',caption:'架空の試験画像・物件写真ではありません',credit:'合成テスト画像（本番採用なし）',
 rightsStatus:'approved',reviewStatus:'approved',focalPoint:{x:.3,y:.7},renditions:Object.fromEntries(
  Object.entries(sizes).map(([role,[width,height]])=>[role,{url:`./assets/print-approved/test/${role}.png`,width,height}]))};
function png(width,height){
 const crc=buf=>{let c=0xffffffff;for(const b of buf){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^(c&1?0xedb88320:0)}return (c^0xffffffff)>>>0};
 const chunk=(type,data)=>{const t=Buffer.from(type),n=Buffer.alloc(4),c=Buffer.alloc(4);n.writeUInt32BE(data.length);c.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([n,t,data,c])};
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
 const row=Buffer.alloc(width*3+1,90);row[0]=0;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(Buffer.concat(Array(height).fill(row)))),chunk('IEND',Buffer.alloc(0))]);
}
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
    if(u.endsWith('/raster-manifest.js'))return route.fulfill({contentType:'text/javascript',body:`PrintRasterAssets.replace(${JSON.stringify({schemaVersion:1,assets:[asset]})})`});
    const role=Object.keys(sizes).find(role=>u.endsWith('/test/'+role+'.png'));
    if(role)return route.fulfill({contentType:'image/png',body:png(...sizes[role])});
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
   await page.locator('#pl-live-media').selectOption('asset:synthetic-test');
   await page.waitForFunction(()=>!document.querySelector('#pl-live-printbtn').disabled);
   const screen=await page.locator('.hero-frame img').evaluate(img=>({src:img.currentSrc,width:img.naturalWidth,
    fit:getComputedStyle(img).objectFit,position:getComputedStyle(img).objectPosition}));
   assert.match(screen.src,/preview\.png$/);assert.equal(screen.width,650);assert.equal(screen.fit,'cover');
   assert.equal(await page.locator('.hero-frame svg').count(),0,'photo hero must not contain SVG photo');
   const original=await page.locator('#pl-live-stage').innerText();
   await page.evaluate(()=>{window.print=()=>{}});
   await page.locator('#pl-live-printbtn').click();
   await page.emulateMedia({media:'print'});
   const report=await page.evaluate(()=>({
    pages:document.querySelectorAll('#pl-live-root .pl-page').length,
    text:document.querySelector('#pl-live-root').innerText
   }));
   assert.equal(report.pages,1,'ordinary fixture should fit one page');
   assert.equal(report.text.replace(/\s/g,''),original.replace(/\s/g,''),'all print text retained');
   await page.waitForFunction(()=>document.querySelector('#pl-live-root .hero-frame img')?.naturalWidth===2600);
   const printed=await page.locator('#pl-live-root .hero-frame img').evaluate(img=>({src:img.currentSrc,width:img.naturalWidth}));
   assert.match(printed.src,/print\.png$/);assert.equal(printed.width,2600);
   const pdf=await page.pdf({preferCSSPageSize:true,printBackground:true});
   const count=[...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length;
   assert.equal(count,1,'native PDF must not append a blank page');
   fs.writeFileSync(path.join(out,`a4-${width}.pdf`),pdf);
   fs.writeFileSync(path.join(out,`a4-${width}.json`),JSON.stringify(report,null,2));
   console.log(JSON.stringify({width,pdfPages:count,screen,printed}));
   await page.close();
  }
 }finally{await browser.close();server.close()}
})().catch(err=>{console.error(err);server.close();process.exitCode=1});
