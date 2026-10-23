import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {choose}=require('../../src/image-assets/approved-media.js');
const base=id=>({id,kind:'generated_illustration',rightsStatus:'approved',reviewStatus:'accepted',
 permissionToRedistribute:true,imageShowsRealPOI:false,reviewer:'reviewed',caption:'架空建築イメージ',
 slots:['hero','residence','print_hero'],themes:['architecture','urban'],focalPoint:{x:.55,y:.4},
 renditions:{screen:{path:'web/'+id+'-screen.webp',width:1440,height:1200},
 print:{path:'print/'+id+'-print.png',width:3000,height:2400}}});
const wrap=(...assets)=>({schemaVersion:'1.0',assets});
const first=()=>base('app003-exterior-001');
test('approved print_hero selected from exact local path and sufficient ppi',()=>{
 const r=choose(wrap(first()),{slot:'print_hero',theme:'architecture',seed:'g1',
  placementMm:{width:180,height:120}});
 assert.equal(r.kind,'approved_asset');
 assert.equal(r.src,'assets/images/print/app003-exterior-001-print.png');
 assert.equal(r.objectPosition,'55% 40%');assert.ok(r.ppi>=300);
});
test('screen rendition requires no print placement',()=>{
 assert.equal(choose(wrap(first()),{slot:'hero'}).src,
  'assets/images/web/app003-exterior-001-screen.webp');
});
test('empty, missing and wrong-version manifest all fall back to SVG',()=>{
 for(const m of [null,{},wrap(),{schemaVersion:'2.0',assets:[first()]}])
  assert.equal(choose(m).kind,'existing_svg');
});
test('rights, review, redistrib, real POI and reviewer checks fail closed',()=>{
 for(const [k,v] of [['rightsStatus','review_required'],['reviewStatus','candidate'],
  ['permissionToRedistribute',false],['imageShowsRealPOI',true],['reviewer','']]){
  const a=first();a[k]=v;assert.equal(choose(wrap(a)).kind,'existing_svg',k);
 }
});
test('only generated illustration and explicitly listed slots allowed',()=>{
 let a=first();a.kind='licensed_photo';
 assert.equal(choose(wrap(a)).kind,'existing_svg');
 a=first();a.slots=['hero'];
 assert.equal(choose(wrap(a),{slot:'print_hero'}).kind,'existing_svg');
});
test('remote, traversal, absolute, forged and query-string paths are blocked',()=>{
 for(const bad of ['https://host/img.png','../../a.png','print/evil-print.png',
  '/print/app003-exterior-001-print.png','print/app003-exterior-001-print.png?token=x',
  'print%2fapp003-exterior-001-print.png']){
  const a=first();a.renditions.print.path=bad;
  assert.equal(choose(wrap(a),{slot:'print_hero'}).kind,'existing_svg',bad);
 }
 const a=first();a.id='../attack';
 assert.equal(choose(wrap(a)).kind,'existing_svg');
});
test('print image below requested ppi falls back without upscaling claim',()=>{
 const a=first();a.renditions.print.width=1000;
 assert.equal(choose(wrap(a),{slot:'print_hero',
  placementMm:{width:180,height:120}}).kind,'existing_svg');
});
test('theme mismatch uses SVG fallback instead of unrelated image',()=>{
 assert.equal(choose(wrap(first()),{theme:'water'}).kind,'existing_svg');
});
test('unknown slot/theme and invalid geometry rejected',()=>{
 for(const opts of [{slot:'map_effect'},{theme:'unknown'},
  {placementMm:{width:-1,height:100}},{minPpi:0}])
  assert.throws(()=>choose(wrap(first()),opts));
});
test('selection is deterministic independent of manifest order',()=>{
 const a=first(),b=base('app003-exterior-002');
 assert.deepEqual(choose(wrap(a,b),{seed:'same'}),choose(wrap(b,a),{seed:'same'}));
});
test('unreviewed assets never enter public print slot',()=>{
 const a=first();a.rightsStatus='unknown';
 assert.equal(choose(wrap(a),{slot:'print_hero'}).kind,'existing_svg');
});
