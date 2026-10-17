import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {create,walking,addressFor,copy,themes}=require('../src/location-highlights.js');
const catalog=require('../src/poem-catalog.js');

const poi=(tags={},extra={})=>({
 name:'架空の周辺施設',source:'OSM',sourceId:'node/01',
 lat:35.7,lon:139.7,distanceMeters:188,theme:'urban_detail',
 classificationConfidence:'high',classificationFlags:[],validationFlags:[],
 tags,...extra
});

test('LOCATION-01 dedicated ad prose exists for 29 genres with three headline/body pairs',()=>{
 assert.equal(Object.keys(copy).length,29);
 for(const [kind,variants] of Object.entries(copy)){
  assert.equal(variants.length,3,kind);
  assert.equal(new Set(variants.map(v=>v[0])).size,3,kind);
  assert.ok(variants.every(x=>x.length===2&&x.every(y=>typeof y==='string'&&y.length>9)),kind);
 }
 assert.equal(Object.keys(themes).length,10);
});

test('LOCATION-01 culvert ad uses genuine genre, not explanatory copy',()=>{
 const p=poi({tunnel:'culvert',waterway:'stream'},{name:'名称付き暗渠',sourceId:'way/4',distanceMeters:245});
 const r=create([p],{catalog,serial:1});
 assert.equal(r.length,1);
 assert.equal(r[0].genreId,'culvert');
 assert.equal(r[0].name,'名称付き暗渠');
 assert.equal(r[0].distanceMeters,245);
 assert.equal(r[0].distanceLabel,'直線距離');
 assert.equal(r[0].walkMinutes,null);
 assert.match(r[0].headline,/地表に現れない/);
 assert.doesNotMatch(r[0].body,/着想源|このポエム|再生成|選ばれた理由/);
});

test('LOCATION-01 PR prose differs on regeneration while reference stays the same',()=>{
 const p=poi({waterway:'ditch'},{name:'架空の側溝'});
 const a=create([p],{catalog,serial:1})[0],b=create([p],{catalog,serial:2})[0];
 assert.notEqual(a.headline,b.headline);
 assert.notEqual(a.body,b.body);
 assert.equal(a.name,b.name);
 assert.equal(a.distanceMeters,b.distanceMeters);
});

test('LOCATION-01 address comes only from the actual facility record, not selected place',()=>{
 const p=poi({waterway:'ditch'});
 assert.equal(addressFor(p),null);
 assert.equal(addressFor({...p,address:'東京都中野区中野一丁目'}),'東京都中野区中野一丁目');
 assert.equal(addressFor({...p,tags:{'addr:city':'中野区','addr:quarter':'中央'}}),'中野区 中央');
 assert.equal(addressFor({...p,recordPrefecture:'東京都',recordCity:'中野区'}),'東京都 中野区');
});

test('LOCATION-01 walking minutes cannot be inferred from straight-line distance',()=>{
 const p=poi({waterway:'ditch'},{distanceMeters:480});
 assert.equal(walking(p),null);
 assert.equal(walking({...p,walkingRouteMeters:480}),null);
 assert.equal(walking({...p,walkingRouteMeters:480,routeEvidence:'verified_foot'}),null);
 assert.equal(walking({...p,walkingRouteMeters:480,routeEvidence:'verified_foot',entryPointVerified:true}),6);
 assert.equal(walking({...p,walkingRouteMeters:481,routeEvidence:'verified_foot',entryPointVerified:true}),7);
 assert.equal(walking({...p,walkingRouteMeters:-1,routeEvidence:'verified_foot',entryPointVerified:true}),null);
});

test('LOCATION-01 at most three diverse location cards, with first emphasis',()=>{
 const all=[
  poi({waterway:'ditch'},{name:'溝',sourceId:'way/1',theme:'water'}),
  poi({amenity:'post_box'},{name:'ポスト',sourceId:'node/2'}),
  poi({amenity:'school'},{name:'学校',sourceId:'way/3',theme:'knowledge'}),
  poi({leisure:'park'},{name:'公園',sourceId:'way/4',theme:'green'})
 ];
 const results=create(all,{catalog,serial:1});
 assert.equal(results.length,3);
 assert.deepEqual(results.map(x=>x.rank),[1,2,3]);
 assert.deepEqual(results.map(x=>x.name),['溝','ポスト','学校']);
});

test('LOCATION-01 masked POIs, low trust and conflicted records never appear as ad highlights',()=>{
 const rows=[
  poi({amenity:'social_facility'},{name:'支援施設'}),
  poi({amenity:'school'},{name:'特別支援学校',theme:'knowledge'}),
  poi({waterway:'ditch'},{name:'地名衝突',validationFlags:['prefecture_mismatch']}),
  poi({waterway:'ditch'},{name:'低信頼',classificationConfidence:'medium'}),
  poi({waterway:'ditch'},{name:'分類不整合',classificationFlags:['provider_type_conflict']})
 ];
 assert.equal(create(rows,{catalog}).length,0);
});

test('LOCATION-01 genre does not claim school, pond or curry without explicit evidence',()=>{
 const input=[
  poi({}, {source:'OpenPOI',name:'学習室',providerBusinessType:'education',theme:'knowledge'}),
  poi({natural:'water'},{name:'水面',sourceId:'way/3',theme:'water'})
 ];
 const result=create(input,{catalog});
 assert.equal(result[0]?.genreId,'knowledge');
 assert.equal(result[1]?.genreId,'water');
});

test('LOCATION-01 duplicate entries and same genre are not repeated',()=>{
 const input=[
  poi({waterway:'ditch'},{name:'同じ水路',sourceId:'way/1'}),
  poi({waterway:'ditch'},{name:'同じ水路',sourceId:'way/1'}),
  poi({waterway:'ditch'},{name:'異なる側溝',sourceId:'way/2'})
 ];
 const result=create(input,{catalog});
 assert.equal(result.length,1);
});

test('LOCATION-01 partial/unavailable results produce no invented ad facilities',()=>{
 assert.deepEqual(create([],{catalog}),[]);
 assert.deepEqual(create([poi({waterway:'ditch'})],{catalog:null}),[]);
 assert.deepEqual(create([poi({waterway:'ditch'},{distanceMeters:900})],{catalog}),[]);
});
