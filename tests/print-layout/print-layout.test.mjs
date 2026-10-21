import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const PD=require('../../src/print-layout/presentation-data.js');
const RC=require('../../src/print-layout/render-core.js');
require('../../src/print-layout/templates.js');
const {list,byId}=require('./fixtures.js');

const TEMPLATES=['type_poem','editorial','location'];
const squash=s=>String(s).replace(/\s+/g,'');
const decode=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
const htmlText=html=>decode(html.replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]*>/g,''));
const clone=o=>JSON.parse(JSON.stringify(o));
const F01=()=>clone(byId('F01_jimbocho_3').data);

test('three templates are registered and type_poem is the complete one',()=>{
 assert.deepEqual(RC.templateIds(),TEMPLATES);
 assert.equal(RC.templateInfo('type_poem').status,'complete');
 assert.equal(RC.templateInfo('editorial').status,'skeleton');
 assert.equal(RC.templateInfo('location').status,'skeleton');
});

test('every fixture is valid PresentationData',()=>{
 for(const f of list){
  const v=PD.validate(f.data);
  assert.equal(v.ok,true,f.fixtureId+': '+v.errors.join(' / '));
 }
});

for(const f of list)for(const t of TEMPLATES){
 test(`${t} × ${f.fixtureId}: every required string is printed (no omission)`,()=>{
  const r=RC.render(t,f.data);
  const text=squash(htmlText(RC.renderToHTML(t,f.data)));
  const missing=r.required.filter(s=>!text.includes(squash(s)));
  assert.deepEqual(missing,[]);
  assert.ok(r.required.length>=4);
 });
}

test('0 LOCATION cards: no empty location slot, place-only note printed',()=>{
 const f=byId('F04_residential_0');
 for(const t of TEMPLATES){
  const r=RC.render(t,f.data);
  assert.equal(r.blocks.some(b=>b.id==='locations'),false,t);
  const html=RC.renderToHTML(t,f.data);
  assert.doesNotMatch(html,/pl-loc\b|LOCATION 01/);
  assert.match(htmlText(html),/地名だけを材料にした創作文/);
  assert.doesNotMatch(htmlText(html),/直線距離/);
 }
});

test('1 and 3 LOCATION cards render exactly that many cards, chief first',()=>{
 for(const [id,n] of [['F02_nakano_1',1],['F01_jimbocho_3',3],['F05_address_100',2]]){
  const f=byId(id);
  for(const t of TEMPLATES){
   const html=RC.renderToHTML(t,f.data);
   assert.equal((html.match(/<article /g)||[]).length,n,`${t} ${id}`);
   assert.match(html,/<article class="pl-loc pl-loc-chief" data-rank="1">/);
  }
 }
});

test('SELECT-01: LOCATION 01 must equal the POEM main subject',()=>{
 const d=F01();d.mainSubjectId='fixture/jb-2';
 const v=PD.validate(d);
 assert.equal(v.ok,false);
 assert.ok(v.errors.some(e=>e.startsWith('SELECT-01')));
 const d2=F01();d2.mainSubjectId=null;
 assert.equal(PD.validate(d2).ok,false);
 assert.throws(()=>RC.render('type_poem',d),/SELECT-01/);
});

test('H-07: a stale generation token is refused; missing token is invalid',()=>{
 const d=F01();
 assert.throws(()=>RC.render('type_poem',d,{expectedToken:'gen-other-location'}),/H-07/);
 assert.doesNotThrow(()=>RC.render('type_poem',d,{expectedToken:d.generationToken}));
 delete d.generationToken;
 assert.ok(PD.validate(d).errors.some(e=>e.startsWith('H-07')));
});

test('H-03: walk minutes only with a verified route; never derived from distance',()=>{
 const d=F01();d.locations[0].walkMinutes=3;
 assert.ok(PD.validate(d).errors.some(e=>e.startsWith('H-03')));
 const ok=byId('F08_walk_verified');
 const text=htmlText(RC.renderToHTML('type_poem',ok.data));
 assert.match(text,/徒歩約6分（経路確認済み）/);
 assert.equal((text.match(/徒歩約/g)||[]).length,1);
 for(const f of list)if(f.fixtureId!=='F08_walk_verified')
  assert.doesNotMatch(htmlText(RC.renderToHTML('type_poem',f.data)),/徒歩約\d/,f.fixtureId);
});

test('H-08: sales-like fields (price, floor plan, contact) are rejected',()=>{
 for(const k of ['price','floorPlan','phone','seller']){
  const d=F01();d[k]='x';
  assert.equal(PD.validate(d).ok,false,k);
 }
 const d=F01();d.property.price=8000;
 assert.equal(PD.validate(d).ok,false);
});

test('validation: >3 cards, bad source, negative distance, place_only with cards',()=>{
 const d=F01();d.locations.push({...d.locations[2],sourceId:'fixture/x'});
 assert.ok(PD.validate(d).errors.some(e=>/0\.\.3/.test(e)));
 const s=F01();s.locations[1].source='Google';assert.equal(PD.validate(s).ok,false);
 const n=F01();n.locations[1].distanceMeters=-1;assert.ok(PD.validate(n).errors.some(e=>e.startsWith('H-02')));
 const m=F01();m.evidence.mode='place_only';assert.equal(PD.validate(m).ok,false);
 const o=F01();o.outputMode='PDF/X-4';assert.ok(PD.validate(o).errors.some(e=>/PDF\/X/.test(e)));
});

test('HTML injection: data strings never become markup',()=>{
 const f=byId('F07_xss');
 for(const t of TEMPLATES){
  const html=RC.renderToHTML(t,f.data);
  assert.doesNotMatch(html,/<script|<img|<svg onload|<b>|<i>|<h1>x|javascript:alert\(1\)">|<p class="pl-note">偽/);
  assert.match(html,/&lt;script&gt;alert\("x"\)&lt;\/script&gt;/);
  assert.match(htmlText(html),/<svg onload=alert\(1\)>試験/);
  // every attribute in a real tag comes from the template, not from data
  for(const [tag] of html.matchAll(/<[a-z][^>]*>/g))
   for(const [,name] of tag.matchAll(/\s([a-zA-Z-:]+)="/g))assert.doesNotMatch(name,/^on|^href$|^src$|^style$/,tag);
 }
});

test('serializer refuses event-handler and URL attributes outright',()=>{
 const {h,toHTML}=RC;
 assert.throws(()=>toHTML(h('div',{onclick:'x'})),/not allowed/);
 assert.throws(()=>toHTML(h('a',{href:'javascript:x'})),/not allowed/);
 assert.throws(()=>toHTML(h('img',{src:'x'})),/not allowed/);
 assert.throws(()=>toHTML(h('div',{style:'x'})),/not allowed/);
});

test('credits are composed from what is printed',()=>{
 const withCards=RC.render('type_poem',byId('F03_kyoto_3_longnames').data).credits.join('\n');
 assert.match(withCards,/© OpenStreetMap contributors（取得 2026-10-18）/);
 assert.match(withCards,/OpenPOI API（取得 2026-10-18）/);
 assert.match(withCards,/徒歩所要時間ではありません/);
 assert.match(withCards,/物件と広告文章は創作です/);
 const loc=RC.render('location',byId('F01_jimbocho_3').data).credits.join('\n');
 assert.match(loc,/位置関係図は選択地点と施設の座標から描いた参考図です/);
 assert.doesNotMatch(loc,/架空建築の抽象線画/);
 const none=RC.render('location',byId('F04_residential_0').data).credits.join('\n');
 assert.doesNotMatch(none,/位置図|OpenStreetMap/);
});

test('rendering is deterministic and does not mutate input',()=>{
 for(const f of list){
  const before=JSON.stringify(f.data);
  for(const t of TEMPLATES)assert.equal(RC.renderToHTML(t,f.data),RC.renderToHTML(t,f.data));
  assert.equal(JSON.stringify(f.data),before);
 }
});

test('long poem stays whole: one unit per line so pagination never cuts a line',()=>{
 const f=byId('F06_long_poem');
 const poem=RC.render('type_poem',f.data).blocks.find(b=>b.id==='poem');
 assert.equal(poem.units.length,f.data.poem.body.split('\n').length);
 assert.equal(poem.splittable,true);
 const notes=RC.render('type_poem',f.data).blocks.at(-1);
 assert.equal(notes.id,'notes');
});

const sideText=blocks=>squash(htmlText(blocks.map(b=>RC.toHTML(RC.blockNode(b))).join('')));
for(const t of TEMPLATES)test(`${t}: front/back sheet keeps every required string across both sides`,()=>{
 for(const f of list){
  const r=RC.render(t,f.data);
  const front=sideText(r.sides.front),back=sideText(r.sides.back);
  const missing=r.required.filter(s=>!(front+back).includes(squash(s)));
  assert.deepEqual(missing,[],f.fixtureId);
  // creative-work note on the front itself, not only on the back (H-01)
  assert.ok(front.includes(squash(r.credits[0])),f.fixtureId);
  assert.equal(r.sides.back.at(-1).id,'notes',f.fixtureId);
  // the chief card is printed in full on the front
  if(f.data.locations.length)assert.ok(front.includes(squash(f.data.locations[0].body)),f.fixtureId);
 }
});

test('front/back: supporting cards are brief on the front and complete on the back',()=>{
 const f=byId('F01_jimbocho_3');
 const r=RC.render('type_poem',f.data);
 const front=sideText(r.sides.front),back=sideText(r.sides.back);
 for(const loc of f.data.locations.slice(1)){
  assert.ok(front.includes(squash(loc.name))&&front.includes(squash(loc.headline)));
  assert.ok(!front.includes(squash(loc.body)),'body moved to back');
  assert.ok(back.includes(squash(loc.body))&&back.includes(squash(PD.formatAddress(loc))));
 }
 assert.match(front,/所在地・紹介文・出典は裏面/);
 const one=RC.render('type_poem',byId('F02_nakano_1').data).sides.back.map(b=>b.id);
 assert.deepEqual(one,['back-head','position-map','notes']);
 const zero=RC.render('type_poem',byId('F04_residential_0').data);
 assert.equal(zero.sides.front.some(b=>b.id==='locations'),false);
});

test('creative-work note is marked so the 8pt floor can be enforced',()=>{
 const html=RC.renderToHTML('type_poem',byId('F01_jimbocho_3').data);
 assert.match(html,/<p class="pl-note pl-creative">物件と広告文章は創作です/);
});

test('position diagram: back side carries the coordinate map and its note',()=>{
 const r=RC.render('type_poem',byId('F01_jimbocho_3').data,{sheet:'duplex'});
 assert.equal(r.sheet,'duplex');
 assert.equal(r.sides.positionMap,true);
 const ids=r.sides.back.map(b=>b.id);
 assert.deepEqual(ids,['back-head','position-map','locations-back','notes']);
 assert.ok(r.sides.required.includes(PD.POSITION_MAP_NOTE));
 // the single-page set does not claim a diagram it does not print
 assert.ok(!r.required.includes(PD.POSITION_MAP_NOTE));
 const back=htmlText(r.sides.back.map(b=>RC.toHTML(RC.blockNode(b))).join(''));
 assert.match(back,/道路・経路・徒歩時間/);
 assert.doesNotMatch(back,/徒歩約\d/);
});

test('position diagram: north is up and scale follows the coordinates',()=>{
 const d=PD.build(byId('F01_jimbocho_3').data);
 const g=PD.positionGeometry(d);
 assert.equal(g.ok,true);
 // jb-1 was placed at bearing 35°: north-east of the selected point
 assert.ok(g.points[0].east>0&&g.points[0].north>0);
 // jb-2 at 200°: south (and slightly west)
 assert.ok(g.points[1].north<0&&g.points[1].east<0);
 for(const p of g.points)assert.ok(Math.abs(Math.hypot(p.east,p.north)-p.distance)<5);
});

test('position diagram is omitted (never guessed) when coordinates are missing or disagree',()=>{
 // no LOCATION data: a requested back side is not printed (it would be empty)
 assert.equal(RC.render('type_poem',byId('F04_residential_0').data,{sheet:'duplex'}).sheet,'auto');
 const xss=RC.render('type_poem',byId('F07_xss').data,{sheet:'duplex'});
 assert.equal(xss.sides.positionMap,false);
 assert.equal(xss.sides.positionMapReason,'no_place_coordinates');
 const bad=F01();bad.locations[1].distanceMeters=900;  // printed 900 m, coordinates say ~260 m
 const v=PD.validate(bad);
 assert.equal(v.ok,true);
 assert.ok(v.warnings.some(w=>w.startsWith('H-02')));
 const r=RC.render('type_poem',bad,{sheet:'duplex'});
 assert.equal(r.sides.positionMap,false);
 assert.equal(r.sides.positionMapReason,'distance_mismatch');
 assert.equal(r.sides.back.some(b=>b.id==='position-map'),false);
 assert.ok(!r.sides.required.includes(PD.POSITION_MAP_NOTE));
 // the location template falls back to the labelled schematic, not a false map
 assert.ok(RC.render('location',bad).credits.includes(PD.SCHEMATIC_MAP_NOTE));
 assert.ok(RC.render('location',F01()).credits.includes(PD.POSITION_MAP_NOTE));
});

test('map tiles: only integer GSI tile URLs, aligned on the selected point',()=>{
 const r=RC.render('type_poem',byId('F01_jimbocho_3').data,{sheet:'duplex',mapTiles:'gsi-pale'});
 assert.equal(r.mapTiles,true);
 const urls=RC.tileUrls(r);
 assert.ok(urls.length>=4&&urls.length<=49,String(urls.length));
 for(const u of urls)assert.match(u,RC.TILE_URL);
 // the tile containing the selected point is part of the layer
 const {lat,lon}=r.data.place;
 const z=+urls[0].split('/')[5];
 const tx=Math.floor((lon+180)/360*2**z);
 const ty=Math.floor((1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*2**z);
 assert.ok(urls.includes(`https://cyberjapandata.gsi.go.jp/xyz/pale/${z}/${tx}/${ty}.png`));
 assert.ok(z>=14&&z<=16,String(z));
 // credit and the tile variant of the note appear only on the side that prints the map
 assert.ok(r.sides.required.includes(PD.MAP_TILE_CREDIT));
 assert.ok(r.sides.required.includes(PD.POSITION_MAP_TILE_NOTE));
 assert.ok(!r.sides.required.includes(PD.POSITION_MAP_NOTE));
 assert.ok(!r.required.includes(PD.MAP_TILE_CREDIT));
 // without the option nothing points to the network
 assert.deepEqual(RC.tileUrls(RC.render('type_poem',byId('F01_jimbocho_3').data,{sheet:'duplex'})),[]);
 // no coordinates: no tiles even when asked
 assert.equal(RC.render('type_poem',byId('F07_xss').data,{sheet:'duplex',mapTiles:'gsi-pale'}).mapTiles,false);
});

test('serializer: href only for a GSI tile image, never for other hosts or tags',()=>{
 const {h,toHTML}=RC;
 const ok='https://cyberjapandata.gsi.go.jp/xyz/pale/16/58210/25803.png';
 assert.match(toHTML(h('image',{href:ok})),/href=/);
 for(const bad of ['https://example.com/xyz/pale/16/1/1.png','javascript:alert(1)',
  'https://cyberjapandata.gsi.go.jp/xyz/pale/16/1/1.png?x=<script>','https://cyberjapandata.gsi.go.jp/xyz/std/16/1/1.png'])
  assert.throws(()=>toHTML(h('image',{href:bad})),/not allowed/,bad);
 assert.throws(()=>toHTML(h('a',{href:ok})),/not allowed/);
});

test('sources: map and facility attributions are gathered at the end of the notes',()=>{
 const r=RC.render('type_poem',byId('F03_kyoto_3_longnames').data,{sheet:'duplex',mapTiles:'gsi-pale'});
 const notes=r.sides.back.at(-1);
 const last=notes.units.at(-1);
 assert.equal(last.attrs.class,'pl-sources');
 const html=RC.toHTML(last);
 for(const s of [PD.MAP_TILE_CREDIT,'施設データ：© OpenStreetMap contributors','施設データ：OpenPOI API'])assert.ok(htmlText(html).includes(s),s);
 // nothing attribution-like is left among the other notes
 for(const u of notes.units.slice(0,-1))assert.ok(!PD.isSourceCredit(htmlText(RC.toHTML(u))));
 // the figure caption points to the end instead of repeating the source
 assert.match(htmlText(RC.toHTML(RC.blockNode(r.sides.back.find(b=>b.id==='position-map')))),/地図の出典は末尾に記載/);
 // no sources section when nothing needs attribution
 const zero=RC.render('type_poem',byId('F04_residential_0').data).blocks.at(-1);
 assert.ok(!zero.units.some(u=>u.attrs.class==='pl-sources'));
});

const NB=require('../../src/print-layout/neighborhood.js');
const SP=require('../../src/subject-policy.js');
test('neighbourhood: attractive places with a few plain fixtures blended in',()=>{
 const nb=byId('F01_jimbocho_3').data.neighborhood;
 assert.equal(nb.length,7);
 const tiers=nb.map(n=>n.tier);
 assert.equal(tiers.filter(t=>t==='plain').length,2);
 // blended in, not appended: the first plain item is not at the end
 assert.ok(tiers.indexOf('plain')<nb.length-2,tiers.join());
 assert.deepEqual(nb.map(n=>n.rank),[4,5,6,7,8,9,10]);  // continues after LOCATION 01-03
 // at most 2 per kind; the three bookstores never all appear
 const kinds=new Map();for(const n of nb)kinds.set(n.kindLabel,(kinds.get(n.kindLabel)||0)+1);
 for(const [k,c] of kinds)assert.ok(c<=2,k);
});

test('neighbourhood: one ordinary medical facility, never care / mental-health / worship',()=>{
 const nb=byId('F01_jimbocho_3').data.neighborhood;
 const names=nb.map(n=>n.name);
 assert.equal(nb.filter(n=>n.tier==='medical').length,1);
 assert.ok(names.includes('試験総合病院'));
 for(const banned of ['試験心療内科クリニック','試験福祉センター','試験神社','名前だけ書店','すずらん古書館（試験データ）'])
  assert.ok(!names.includes(banned),banned);
 // medical never becomes the plain (joke) tier
 assert.ok(!nb.some(n=>n.tier==='plain'&&/病院|診療所/.test(n.kindLabel)));
 // note printed only when a medical facility is listed
 const r=RC.render('type_poem',byId('F01_jimbocho_3').data,{sheet:'duplex'});
 assert.ok(r.sides.required.includes(PD.MEDICAL_NOTE));
 assert.ok(!RC.render('type_poem',byId('F02_nakano_1').data,{sheet:'duplex'}).sides.required.includes(PD.MEDICAL_NOTE));
});

test('neighbourhood: plain items stay a minority when attractive places are scarce',()=>{
 const nb=byId('F02_nakano_1').data.neighborhood;
 assert.ok(nb.filter(n=>n.tier==='plain').length<=nb.filter(n=>n.tier!=='plain').length);
 assert.deepEqual(NB.curate([],{subjectPolicy:SP}),[]);
 assert.throws(()=>NB.curate([],{}),/subjectPolicy is required/);
});

test('neighbourhood: printed on the back only, as name / kind / distance, and not as ad copy',()=>{
 const f=byId('F01_jimbocho_3');
 const r=RC.render('type_poem',f.data,{sheet:'duplex'});
 const block=r.sides.back.find(b=>b.id==='position-map');
 const text=htmlText(RC.toHTML(RC.blockNode(block)));
 for(const n of f.data.neighborhood)assert.ok(squash(text).includes(squash(n.kindLabel+n.name+'直線 約'+n.distanceMeters+'m')),n.name);
 assert.doesNotMatch(text,/allure|plain|medical|おすすめ|徒歩/);
 // single-page sheet does not claim the list or its sources
 assert.ok(!r.required.some(s=>s.includes('北の丸試験公園')));
 assert.ok(r.sides.required.some(s=>s.includes('北の丸試験公園')));
 assert.ok(r.sides.required.some(s=>s.startsWith('「周辺の施設」は')));
 // items whose coordinates disagree with the distance are dropped, with a warning
 const d=F01();d.neighborhood=[{...d.neighborhood[0],distanceMeters:5}];
 assert.equal(PD.build(d).neighborhood.length,0);
 assert.ok(PD.validate(d).warnings.some(w=>/neighborhood items dropped/.test(w)));
});

test('fromAppSnapshot maps index.html values without re-deriving them',()=>{
 const d=PD.fromAppSnapshot({generationToken:'v12',place:{label:'神保町',en:'JIMBOCHO'},propertyName:'THE JIMBOCHO RESIDENCE',
  headline:'知の深奥に、\n邸の答えを。',body:'一行目\n二行目',mainEvidenceId:'node/1',verified:true,
  locationCards:[{rank:1,sourceId:'node/1',name:'A',genreLabel:'書店',address:'x',addressPrecision:'area',distanceMeters:120,
   walkMinutes:null,headline:'h',body:'b',source:'OSM',retrievedAt:'2026-10-18T00:00:00Z'}]});
 assert.equal(d.generationToken,'v12');
 assert.equal(d.locations[0].retrievedAt,'2026-10-18');
 assert.equal(PD.formatAddress(d.locations[0]),'所在地（地域情報のみ）：x');
 assert.throws(()=>PD.fromAppSnapshot({generationToken:'v1',place:{label:'x'},propertyName:'P',headline:'h',body:'b',
  mainEvidenceId:'node/2',verified:true,locationCards:[{sourceId:'node/1',name:'A',distanceMeters:1,headline:'h',body:'b',source:'OSM'}]}),/SELECT-01/);
});
