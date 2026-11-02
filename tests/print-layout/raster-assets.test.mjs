import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const RC=require('../../src/print-layout/render-core.js');
require('../../src/print-layout/templates.js');
const assets=require('../../src/print-layout/raster-assets.js');
const fixture=()=>({assetId:'test-01',alt:'試験画像',caption:'試験用の架空情景',credit:'試験画像の出典',
 rightsStatus:'approved',reviewStatus:'approved',focalPoint:{x:.4,y:.3},
 renditions:Object.fromEntries(['original','print','preview','thumb'].map((role,i)=>[role,
  {url:`./assets/print-approved/test-01/${role}.png`,width:3000-i*500,height:2000-i*300}]))});
test('IMG02 catalogue validates all four rasters and preserves last valid state on failure',()=>{
 const a=fixture();assets.replace({schemaVersion:1,assets:[a]});
 assert.equal(assets.get(a.assetId).renditions.print.width,2500);
 for(const mutate of [a=>delete a.renditions.thumb,a=>a.rightsStatus='candidate',a=>a.reviewStatus='pending',
  a=>a.renditions.print.url='https://example.com/photo.png',a=>a.renditions.print.url='./assets/print-approved/../private.png',
  a=>a.renditions.print.url='./assets/print-approved/photo.svg',a=>a.renditions.print.width=9999,a=>a.focalPoint.x=2]){
  const bad=fixture();mutate(bad);
  assert.throws(()=>assets.replace({schemaVersion:1,assets:[bad]}),/IMG02/);
  assert.equal(assets.list().length,1);
 }
 assert.throws(()=>assets.replace({schemaVersion:1,assets:[a,a]}),/duplicate/);
 a.renditions.print.width=1;
 assert.equal(assets.get(a.assetId).renditions.print.width,2500,'caller cannot mutate registered metadata');
});
test('IMG02 effective cover density uses the lower axis and does not upscale',()=>{
 assert.equal(assets.ppi(fixture(),254,254),170);
});
test('IMG02 renderer permits local approved raster URLs while rejecting executable/external URLs',()=>{
 assert.match(RC.toHTML(RC.h('img',{src:fixture().renditions.print.url,alt:'photo'})),/print\.png/);
 for(const url of ['javascript:alert(1)','https://example.com/x.png','./assets/print-approved/a.svg']){
  assert.throws(()=>RC.toHTML(RC.h('img',{src:url})),/not allowed/);
 }
});
test('IMG02 rejects missing asset and stale generation before image loading',async()=>{
 await assert.rejects(assets.mount({}, {generationToken:'new'},{assetId:'absent'}),/unknown/);
 await assert.rejects(assets.mount({}, {generationToken:'new'},{assetId:'test-01',expectedToken:'old'}),/H-07/);
});
test('IMG02 abandoned image loading cannot overwrite a new generation',async()=>{
 const pending=[];
 const view={setTimeout,clearTimeout,Image:class{set src(url){
  const r=assets.get('test-01').renditions[url.includes('print')?'print':'preview'];
  this.naturalWidth=r.width;this.naturalHeight=r.height;pending.push(()=>this.onload());
 }}};
 const result=assets.mount({}, {generationToken:'current'},{assetId:'test-01',view});
 assets.abort();pending.forEach(f=>f());
 await assert.rejects(result,/H-07: superseded/);
});
