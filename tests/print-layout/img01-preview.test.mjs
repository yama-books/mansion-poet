import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const h=(tag,attrs,...children)=>({tag,attrs,children});
const hero=h('figure',{class:'pl-ed-figure'},h('svg',{}),h('figcaption',{},'original'));
const base={id:'editorial',label:'E',creditOptions:{illustration:true},
 build(data,credits,ctx){const blocks=[{id:'hero',node:hero},{id:'poem',node:h('p',{},data.poem.body)}];
 return {blocks,sides:{front:blocks,back:[{id:'notes',node:h('p',{},credits.join(','))}]}};}};
const RC={h,templateInfo:()=>base,register(def){RC.current=def}};
globalThis.PrintRenderCore=RC;
globalThis.PrintPaginate={mount(host,id,data,opts){
 assert.equal(opts.expectedToken,data.generationToken);
 const rendered=RC.current.build(data,['創作です'],{sideCredits:['出典']});
 return {rendered,report:{ok:true,pageCount:1,failures:[]},layout:{mode:'single'}};
}};
const api=require('../../src/print-layout/img01-preview.js');
const data={generationToken:'gen-one',poem:{body:'original body'}};
const host={style:{setProperty(){}},querySelector(){return null}};
const view=ok=>({Image:class{set src(value){this.naturalWidth=ok?(value.includes('PHOTO-01')?1672:484):0;this.naturalHeight=ok?(value.includes('PHOTO-01')?941:295):0;queueMicrotask(()=>ok?this.onload():this.onerror())}}});
test('photo remains only preview, independent POEM and preserved SVG',async()=>{
 const r=await api.mount(host,data,{media:'photo',view:view(true)});
 assert.equal(r.mediaUsed,'reference_photo');
 const hero=r.rendered.blocks[0].node;
 assert.match(hero.attrs.class,/pl-img01-photo/);
 assert.equal(hero.children[0].tag,'svg');
 assert.equal(r.rendered.blocks[1].node.children[0],'original body');
 assert.match(r.rendered.sides.back[0].node.children[0],/本番ART未承認/);
});
test('asset failure retains existing SVG without approved media',async()=>{
 const r=await api.mount(host,data,{media:'missing',view:view(false)});
 assert.equal(r.fallback,true);
 assert.equal(r.mediaUsed,'existing_svg');
 assert.doesNotMatch(r.rendered.blocks[0].node.attrs.class,/pl-img01-photo/);
 assert.deepEqual(RC.current.creditOptions,{illustration:true});
});
test('old generation token rejected before photo selection',async()=>{
 await assert.rejects(api.mount(host,data,{media:'photo',expectedToken:'old'}),/H-07/);
});
test('late photo cannot overwrite newer location',async()=>{
 let finish;const slow={Image:class{set src(x){finish=()=>{this.naturalWidth=484;this.onload()}}}};
 const old=api.mount(host,data,{media:'photo',view:slow});
 await api.mount(host,{generationToken:'new',poem:{body:'new copy'}},{media:'svg'});
 finish();
 await assert.rejects(old,/H-07/);
});
test('untrusted media and invalid size rejected',async()=>{
 for(const opts of [{media:'https://untrusted'}, {media:'photo',focus:-1},{mmHeight:999}])
 await assert.rejects(api.mount(host,data,{...opts,view:view(true)}),/IMG01/);
});
test('independent high-resolution ART keeps the original SVG, POEM and LOCATION separate',async()=>{
 const r=await api.mount(host,data,{media:'art',view:view(true)});
 assert.equal(r.mediaUsed,'independent_art');
 assert.deepEqual(r.photoMetrics.nativePixels,[1672,941]);
 assert.equal(r.photoMetrics.sourceKind,'generated_single_scene_art_preview_only');
 assert.equal(r.photoMetrics.publishedAllowed,false);
 assert.match(r.rendered.blocks[0].node.attrs.class,/pl-img01-photo/);
 assert.equal(r.rendered.blocks[0].node.children[0].tag,'svg');
 assert.match(r.rendered.blocks[0].node.children.at(-1).children[0],/独立ART/);
 assert.equal(r.rendered.blocks[1].node.children[0],'original body');
 assert.match(r.rendered.sides.back[0].node.children[0],/実在施設・物件の外観ではなく/);
});
test('missing independent ART preserves SVG fallback',async()=>{
 const r=await api.mount(host,data,{media:'art',view:view(false)});
 assert.equal(r.mediaUsed,'existing_svg');
 assert.equal(r.fallback,true);
 assert.equal(r.rendered.blocks[0].node.children[0].tag,'svg');
});
