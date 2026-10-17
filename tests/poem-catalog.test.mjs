import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const lib=require('../src/poem-catalog.js');

const poi=(fields={})=>({
 name:'架空のテスト施設',source:'OSM',sourceId:'node/1',theme:'water',
 classificationConfidence:'high',classificationFlags:[],validationFlags:[],tags:{},
 ...fields
});

test('POEM-01 catalog has 63 distinct genres and 630 individually authored cues',()=>{
 assert.equal(lib.genres.length,63);
 assert.equal(new Set(lib.genres.map(x=>x.id)).size,63);
 for(const g of lib.genres){
  assert.equal(g.variants.length,10,g.id);
  assert.equal(new Set(g.variants).size,10,g.id);
  assert.ok(g.variants.every(s=>typeof s==='string'&&s.length>=8&&s.length<65&&!/[<>]/.test(s)),g.id);
  assert.ok(g.selectors.length>0,g.id);
 }
 assert.equal(lib.genres.reduce((n,g)=>n+g.variants.length,0),630);
});

test('POEM-01 structure-specific tags take priority over broad poetic theme',()=>{
 const ditch=poi({tags:{waterway:'ditch'}});
 const drain=poi({tags:{waterway:'drain'}});
 const culvert=poi({tags:{waterway:'stream',tunnel:'culvert'}});
 assert.equal(lib.resolve(ditch)?.id,'ditch');
 assert.equal(lib.resolve(drain)?.id,'drain');
 assert.equal(lib.resolve(culvert)?.id,'culvert');
 assert.notEqual(lib.compose(ditch,{serial:1}).headline,lib.compose(drain,{serial:1}).headline);
 assert.equal(lib.resolve(poi({tags:{waterway:'river'}}))?.id,'river');
});

test('POEM-01 school townhall and postal equipment retain separate genres',()=>{
 const cases=[
  [{amenity:'school'},'school'],
  [{amenity:'townhall'},'townhall'],
  [{amenity:'post_box'},'post_box'],
  [{amenity:'post_office'},'post_office'],
  [{amenity:'parcel_locker'},'parcel_locker'],
  [{amenity:'library'},'library']
 ];
 for(const [tags,id] of cases){
  const a=poi({tags,theme:'knowledge'});
  assert.equal(lib.resolve(a)?.id,id,'Should resolve '+id);
 }
});

test('POEM-01 nature and religious architecture use neutral architecture/landscape genres',()=>{
 assert.equal(lib.resolve(poi({tags:{natural:'tree'},theme:'green'}))?.id,'tree');
 assert.equal(lib.resolve(poi({tags:{leisure:'park'},theme:'green'}))?.id,'park');
 assert.equal(lib.resolve(poi({tags:{building:'shrine'},theme:'history'}))?.id,'shrine');
 assert.equal(lib.resolve(poi({tags:{building:'temple'},theme:'history'}))?.id,'temple');
 assert.equal(lib.resolve(poi({tags:{building:'church'},theme:'history'}))?.id,'church');
 // A generic, unnamed place_of_worship alone does not prove historical/cultural status.
 assert.equal(lib.resolve(poi({tags:{amenity:'place_of_worship'},theme:'unknown'})),null);
});

test('POEM-01 trusted brand attribute is needed for brand-specific poetry',()=>{
 const known=poi({source:'OpenPOI',providerBrand:'天下一品',providerCategory:'restaurant',theme:'dining'});
 assert.equal(lib.resolve(known)?.id,'tenkaippin');
 const plainName=poi({name:'天下一品 中野店',source:'OpenPOI',providerCategory:'restaurant',theme:'dining'});
 assert.notEqual(lib.resolve(plainName)?.id,'tenkaippin');
 assert.equal(lib.resolve(poi({source:'OpenPOI',providerBrand:'ラーメン二郎',providerCategory:'restaurant',theme:'dining'}))?.id,'ramen_jiro');
 assert.equal(lib.resolve(poi({source:'OpenPOI',providerBrand:'一蘭',providerCategory:'restaurant',theme:'dining'}))?.id,'ichiran');
 assert.notEqual(lib.resolve(poi({source:'OpenPOI',providerBrand:'天下一品',providerCategory:'school',theme:'knowledge'}))?.id,'tenkaippin');
});

test('POEM-01 provider pizza type uses pizza syntax, not general dining',()=>{
 const p=poi({source:'OpenPOI',providerBusinessType:'pizza',providerCategory:'restaurant',theme:'dining'});
 assert.equal(lib.resolve(p)?.id,'pizza');
 assert.equal(lib.resolve(poi({source:'OpenPOI',providerBusinessType:'ramen',providerCategory:'restaurant',theme:'dining'}))?.id,'ramen');
 assert.equal(lib.resolve(poi({source:'OpenPOI',providerBusinessType:'public_bath',theme:'daily'}))?.id,'sento');
});

test('POEM-01 high confidence, coordinates and contradictory type controls',()=>{
 assert.equal(lib.resolve(poi({classificationConfidence:'medium',tags:{waterway:'ditch'}})),null);
 assert.equal(lib.resolve(poi({validationFlags:['prefecture_mismatch'],tags:{waterway:'ditch'}})),null);
 assert.equal(lib.resolve(poi({classificationFlags:['provider_type_conflict'],tags:{waterway:'ditch'}})),null);
 assert.equal(lib.resolve(poi({classificationFlags:['source_theme_conflict'],tags:{waterway:'ditch'}})),null);
});

test('POEM-01 sensitive support/medical POIs never appear as poem subjects',()=>{
 const cases=[
  {amenity:'social_facility'},
  {amenity:'hospital'},
  {social_facility:'group_home'},
  {'social_facility:for':'disabled'},
  {government:'social_welfare'}
 ];
 for(const tags of cases){
  const p=poi({tags,theme:'knowledge'});
  assert.equal(lib.suppressed(p),true);
  assert.equal(lib.resolve(p),null);
 }
 assert.equal(lib.suppressed(poi({tags:{amenity:'school'},name:'東京都立特別支援学校'})),true);
 assert.equal(lib.suppressed(poi({tags:{leisure:'park'},name:'福祉の森公園',theme:'green'})),false);
});

test('POEM-01 regeneration traverses 10 genuinely distinct headlines',()=>{
 const p=poi({tags:{waterway:'ditch'},name:'架空の側溝'});
 const results=Array.from({length:10},(_,i)=>lib.compose(p,{style:'heritage',intensity:85,serial:i+1}));
 assert.equal(new Set(results.map(x=>x.headline)).size,10);
 assert.ok(results.every(x=>x.body.includes('架空の側溝')));
 assert.deepEqual(results.map(x=>x.variant),[1,2,3,4,5,6,7,8,9,10]);
 assert.equal(lib.compose(p,{serial:11}).headline,results[0].headline);
});

test('POEM-01 style/intensity vary output without changing evidence or genre',()=>{
 const p=poi({tags:{amenity:'post_box'},name:'架空ポスト',sourceId:'node/555'});
 const a=lib.compose(p,{style:'heritage',intensity:95,serial:3});
 const b=lib.compose(p,{style:'urban',intensity:95,serial:3});
 const c=lib.compose(p,{style:'nature',intensity:20,serial:3});
 assert.equal(a.genreId,'post_box');
 assert.equal(a.genreId,b.genreId);
 assert.equal(a.evidenceId,'node/555');
 assert.notEqual(a.body,b.body);
 assert.notEqual(a.body,c.body);
 assert.ok(a.body.includes('\n'));
 assert.ok(!a.body.includes('\\n'));
 assert.ok(a.body.includes('架空ポスト'));
});

test('POEM-01 no facility evidence or low trust never implies a facility exists',()=>{
 assert.equal(lib.compose(null,{serial:1}),null);
 assert.equal(lib.compose(poi({classificationConfidence:'low',tags:{amenity:'school'}})),null);
 assert.equal(lib.compose(poi({source:'OSM',tags:{},theme:'unknown'})),null);
});

test('POEM-01 genre-specific variants avoid direct historical/religious guarantees',()=>{
 const targets=['shrine','temple','church','school','townhall','post_box','ditch'];
 const blocked=/御利益を保証|入学を保証|すべての手続きができる|必ず毎日回収|千年の歴史が実在/;
 for(const id of targets){
  const g=lib.genres.find(x=>x.id===id);
  assert.ok(g, id);
  assert.doesNotMatch(g.variants.join('、'),blocked);
 }
});
