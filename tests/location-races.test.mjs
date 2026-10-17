import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Inline application script should exist');

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {resolve=res; reject=rej;});
  return {promise,resolve,reject};
}
function response(body) {
  return {ok:true, status:200, json:async()=>body};
}
class Element {
  constructor(dataset={}) {
    this.dataset=dataset;this.listeners={};this.children=[];this._innerHTML='';
    this.textContent='';this.value='';this.disabled=false;
    this.classList={toggle(){},add(){},remove(){}};
  }
  addEventListener(type,fn) {(this.listeners[type]??=[]).push(fn);}
  fire(type='click',event={}) {return Promise.all((this.listeners[type]??[]).map(fn=>fn(event)));}
  set innerHTML(value){this._innerHTML=value;if(value==='')this.children=[];}
  get innerHTML(){return this._innerHTML;}
  appendChild(child){this.children.push(child);return child;}
  get childElementCount(){return this.children.length;}
  scrollIntoView(){}
}
function makeUI(fetcher,{withMap=false}={}){
  const items=new Map();
  const el=(key)=>{
    if(!items.has(key))items.set(key,new Element());
    return items.get(key);
  };
  const presets=['jimbocho','nakano','kyoto','kanazawa','yokohama'].map(key=>new Element({preset:key}));
  const modes=['heritage','urban','nature'].map(key=>new Element({style:key}));
  const mapHandlers={};
  const map={
    setView(){return this;},getZoom(){return 14;},
    removeLayer(){},on(name,fn){mapHandlers[name]=fn;}
  };
  const leaflet=withMap?{
    map(){return map;},
    tileLayer(){return {addTo(){}};},
    control:{zoom(){return {addTo(){}};}},
    marker(){return {addTo(){return {}}};},
    divIcon(){return {};}
  }:undefined;
  const document={
    querySelector:el,
    querySelectorAll(selector) {
      if(selector==='[data-preset]')return presets;
      if(selector==='[data-style]')return modes;
      return [];
    },
    createElement(){return new Element();},
    body:{appendChild(){}}
  };
  const window={listeners:{},addEventListener(type,fn){this.listeners[type]=fn;}};
  el('#placeInput').value='東京都千代田区神保町';
  const sandbox={
    document,window,fetch:fetcher,AbortController,AbortSignal,
    navigator:{clipboard:{writeText:async()=>{}}},URL,
    console:{info(){}},setTimeout,clearTimeout,L:leaflet
  };
  // The production functions live inside an IIFE; expose them only in the VM test copy.
  const instrumented=script.replace(/\}\)\(\);\s*$/,
    'globalThis.__poiTest={normalizeOpenPOI,normalizeOSMPOI,deduplicatePOIs,choosePOIs,classifyOpenPOI,fetchWithCancellation,poiErrorCode};\n})();');
  assert.notEqual(instrumented,script,'Expected the application IIFE footer');
  runInNewContext(instrumented,sandbox,{timeout:2000});
  if(withMap)window.listeners.load();
  return {el,presets,modes,mapHandlers,normalizers:sandbox.__poiTest};
}
function geo(name,lat=35.69,lon=139.75) {
  return response([{geometry:{coordinates:[lon,lat]},properties:{title:name}}]);
}
const poiRows=[
  {name:'架空図書館',category:'library',lat:35.7074,lng:139.6659},
  {name:'架空公園',category:'park',lat:35.7074,lng:139.6659},
  {name:'架空博物館',category:'museum',lat:35.7074,lng:139.6659},
  {name:'架空駅',category:'station',lat:35.7074,lng:139.6659},
  {name:'架空書店',category:'retail_other',lat:35.7074,lng:139.6659},
  {name:'架空神社',category:'historic',lat:35.7074,lng:139.6659}
];
const rowsFor=(lat,lon)=>poiRows.map(x=>({...x,lat,lng:lon}));

test('outdated geocoder response cannot override a newer preset',async()=>{
  const slow=deferred();
  const ui=makeUI((url)=>{
    if(String(url).includes('address-search'))return slow.promise;
    throw Error('Unexpected URL');
  });
  ui.el('#placeInput').value='古い検索';
  const waiting=ui.el('#searchBtn').fire();
  await ui.presets[1].fire();
  slow.resolve(geo('古い検索結果'));
  await waiting;
  assert.equal(ui.el('#selectedPlace').textContent,'東京都中野区中野');
  assert.equal(ui.el('#searchResults').childElementCount,0);
  assert.equal(ui.el('#searchBtn').disabled,false);
});

test('changing input invalidates an already running address search',async()=>{
  const slow=deferred();
  const ui=makeUI(url=>String(url).includes('address-search')?slow.promise:Promise.reject(Error('unplanned request')));
  ui.el('#placeInput').value='古い文字列';
  const waiting=ui.el('#searchBtn').fire();
  ui.el('#placeInput').value='新しい文字列';
  await ui.el('#placeInput').fire('input');
  slow.resolve(geo('古い文字列'));
  await waiting;
  assert.equal(ui.el('#searchResults').childElementCount,0);
  assert.equal(ui.el('#searchBtn').disabled,false);
});

test('outdated reverse geocoder cannot reset a later map selection',async()=>{
  const old=deferred();
  const ui=makeUI((url)=>{
    const address=new URL(url);
    return address.searchParams.get('lat')==='35.1'?
      old.promise:Promise.resolve(response({results:{lv01Nm:'新しい地点'}}));
  },{withMap:true});
  const first=ui.mapHandlers.click({latlng:{lat:35.1,lng:139.1}});
  const second=ui.mapHandlers.click({latlng:{lat:35.8,lng:139.8}});
  await second;
  old.resolve(response({results:{lv01Nm:'古い地点'}}));
  await first;
  assert.equal(ui.el('#selectedPlace').textContent,'新しい地点 付近（地図指定）');
  assert.equal(ui.el('#selectedCoords').innerHTML.includes('35.8000'),true);
});

test('older POI request cannot rewrite a poem for a newer location',async()=>{
  const slow=deferred();
  const ui=makeUI(url=>{
    const u=String(url);
    if(u.includes('openpoiapi.com')){
      const center=new URL(u).searchParams.get('center');
      if(center.includes('139.665900'))return slow.promise; // Nakano
      const [lon,lat]=center.split(',').map(Number);
      return Promise.resolve(response({results:rowsFor(lat,lon)}));
    }
    if(u.includes('overpass'))return Promise.resolve(response({elements:[]}));
    throw Error('Unexpected URL '+u);
  });
  await ui.presets[1].fire();
  const older=ui.el('#generateBtn').fire();
  await ui.presets[2].fire();
  const newer=ui.el('#generateBtn').fire();
  await newer;
  const latestProperty=ui.el('#poemProperty').textContent;
  assert.equal(latestProperty,'THE KYOTO RESIDENCE');
  assert.match(ui.el('#generatedStatus').textContent,/周辺施設\s+\d+件を参照/, 'New selection should use retrieved POIs, not silently fall back to place only');
  slow.resolve(response({results:poiRows}));
  await older;
  assert.equal(ui.el('#poemProperty').textContent,'THE KYOTO RESIDENCE');
  assert.equal(ui.el('#selectedPlace').textContent,'京都府京都市中京区');
  assert.equal(ui.el('#generateBtn').disabled,false);
});


test('changing style refreshes ranking and caches only same-style raw POIs',async()=>{
 let apiRequests=0;
 const ui=makeUI(url=>{
  const address=String(url);
  if(address.includes('openpoiapi.com')){
   apiRequests++;
   return Promise.resolve(response({results:rowsFor(35.7074,139.6659)}));
  }
  if(address.includes('overpass'))return Promise.resolve(response({elements:[]}));
  throw Error('Unexpected URL '+address);
 });
 await ui.presets[1].fire();
 await ui.el('#generateBtn').fire();
 const heritage=ui.el('#poemBody').textContent;
 assert.ok(heritage.includes('歳月が描いてきた街の輪郭'),heritage);
 const afterHeritage=apiRequests;
 assert.ok(afterHeritage>=2);
 await ui.modes[2].fire();
 await ui.el('#regenerateBtn').fire();
 const nature=ui.el('#poemBody').textContent;
 assert.ok(nature.includes('都市のただ中に息づく、緑の余白'),nature);
 assert.notEqual(nature,heritage);
 assert.ok(apiRequests>afterHeritage,'New style should collect any style-specific supplementary evidence');
 const afterNature=apiRequests;
 await ui.el('#regenerateBtn').fire();
 assert.equal(apiRequests,afterNature,'Regenerating with same place and style should reuse normalized POIs');
});


test('changing location aborts both pending OpenPOI searches and allows another generation',async()=>{
 const inFlight=[];
 const ui=makeUI((url,options={})=>{
  const value=String(url);
  if(value.includes('openpoiapi.com')){
   const center=new URL(value).searchParams.get('center');
   if(center.includes('139.665900')){
    const operation=deferred();
    const signal=options.signal;
    inFlight.push(signal);
    signal.addEventListener('abort',()=>operation.reject(new Error('request was aborted')),{once:true});
    return operation.promise;
   }
   const [lon,lat]=center.split(',').map(Number);
   return Promise.resolve(response({results:rowsFor(lat,lon)}));
  }
  if(value.includes('overpass'))return Promise.resolve(response({elements:[]}));
  throw Error('Unexpected URL: '+value);
 });
 await ui.presets[1].fire();
 const oldGeneration=ui.el('#generateBtn').fire();
 assert.equal(inFlight.length,2,'Both OpenPOI calls should start');
 assert.ok(inFlight.every(signal=>!signal.aborted));
 await ui.presets[2].fire();
 assert.ok(inFlight.every(signal=>signal.aborted),'Old OpenPOI requests must be cancelled');
 await oldGeneration;
 await ui.el('#generateBtn').fire();
 assert.equal(ui.el('#poemProperty').textContent,'THE KYOTO RESIDENCE');
 assert.match(ui.el('#generatedStatus').textContent,/周辺施設\s+\d+件を参照/);
});

test('switching style aborts a pending Overpass fallback without misleading place-only output',async()=>{
 let overpassSignal;
 const ui=makeUI((url,options={})=>{
  const value=String(url);
  if(value.includes('openpoiapi.com'))return Promise.resolve(response({results:[]}));
  if(value.includes('overpass')){
   const operation=deferred();
   overpassSignal=options.signal;
   overpassSignal.addEventListener('abort',()=>operation.reject(new Error('overpass cancelled')),{once:true});
   return operation.promise;
  }
  throw Error('Unexpected URL: '+value);
 });
 await ui.presets[1].fire();
 const generation=ui.el('#generateBtn').fire();
 // Let OpenPOI promises settle so the missing-POI path starts Overpass.
 for(let n=0;n<8&&!overpassSignal;n++)await new Promise(resolve=>setImmediate(resolve));
 assert.ok(overpassSignal,'Overpass fallback should start when OpenPOI returns no facilities');
 await ui.modes[2].fire();
 assert.equal(overpassSignal.aborted,true);
 await generation;
 assert.equal(ui.el('#generateBtn').disabled,false);
 assert.equal(ui.el('#generatedStatus').textContent,'周辺の公開データを確認中…');
});

test('ordinary OpenPOI failure still falls back to OSM and yields a poem',async()=>{
 const ui=makeUI(url=>{
  const value=String(url);
  if(value.includes('openpoiapi.com'))return Promise.reject(new Error('OpenPOI unavailable'));
  if(value.includes('overpass')){
   return Promise.resolve(response({elements:[{type:'node',id:1,lat:35.7074,lon:139.6659,tags:{name:'テスト公園',leisure:'park'}}]}));
  }
  throw Error('Unexpected URL: '+value);
 });
 await ui.presets[1].fire();
 await ui.el('#generateBtn').fire();
 assert.match(ui.el('#generatedStatus').textContent,/一部の施設情報を取得できませんでした/);
 assert.match(ui.el('#poemBody').textContent,/テスト公園/,
  'OSM fallback must be part of the actual poem');
});


test('location changes can abort OpenPOI response bodies after HTTP headers arrive',async()=>{
 const bodies=[];
 const ui=makeUI((url,{signal}={})=>{
  if(String(url).includes('openpoiapi.com')){
   return Promise.resolve({
    ok:true,
    json(){
     const d=deferred();
     bodies.push({signal,request:d});
     signal.addEventListener('abort',()=>d.reject(new Error('cancelled while loading JSON')),{once:true});
     return d.promise;
    }
   });
  }
  if(String(url).includes('overpass'))return Promise.resolve(response({elements:[]}));
  throw Error('Unexpected URL '+url);
 });
 await ui.presets[1].fire();
 const oldGeneration=ui.el('#generateBtn').fire();
 for(let i=0;i<8&&bodies.length!==2;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(bodies.length,2,'Both OpenPOI responses should have started JSON parsing');
 await ui.presets[2].fire();
 assert.ok(bodies.every(x=>x.signal.aborted),'JSON response reads should be abortable');
 await oldGeneration;
 assert.equal(ui.el('#selectedPlace').textContent,'京都府京都市中京区');
 assert.equal(ui.el('#generateBtn').disabled,false);
});

test('STB-04 OpenPOI and OSM share a coordinate- and provenance-aware POI schema',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={lat:35.7074,lon:139.6659};
 const open=normalizers.normalizeOpenPOI([{id:'abc',name:'架空図書館',category:'library',
   lat:'35.7076',lng:'139.6659',licenses:[{id:'sample-license'}],
   attributions:['example attribution'],address:'東京都中野区'}],origin)[0];
 const osm=normalizers.normalizeOSMPOI([{type:'way',id:12,center:{lat:35.7075,lon:139.6659},
   tags:{name:'Example Park', 'name:ja':'架空公園',leisure:'park'}}],origin)[0];
 assert.equal(open.name,'架空図書館');
 assert.equal(open.source,'OpenPOI');
 assert.equal(open.sourceId,'abc');
 assert.equal(open.category,'文教・書物');
 assert.equal(open.lat,35.7076);
 assert.equal(open.lon,139.6659);
 assert.equal(open.distance,open.distanceMeters);
 assert.ok(open.distanceMeters>0&&open.distanceMeters<850);
 assert.equal(open.licenses[0].id,'sample-license');
 assert.equal(open.attributions[0],'example attribution');
 assert.equal(open.address,'東京都中野区');
 assert.ok(!Number.isNaN(Date.parse(open.retrievedAt)));
 assert.equal(osm.name,'架空公園');
 assert.equal(osm.source,'OSM');
 assert.equal(osm.sourceId,'way/12');
 assert.equal(osm.lat,35.7075);
 assert.equal(osm.lon,139.6659);
 assert.equal(osm.tags.leisure,'park');
 assert.equal(osm.category,'緑地・公園');
 assert.equal(osm.distance,osm.distanceMeters);
 assert.ok(osm.distanceMeters>0&&osm.distanceMeters<850);
 assert.ok(osm.attributions.some(x=>x.includes('OpenStreetMap')));
 assert.ok(osm.licenses.length>0);
 assert.ok(!Number.isNaN(Date.parse(osm.retrievedAt)));
});

test('STB-04 OSM drops unnamed, unlocated, invalid and out-of-range features',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={lat:35.7074,lon:139.6659};
 const valid={type:'node',id:7,lat:35.7074,lon:139.6659,
   tags:{name:'近くの公園',leisure:'park'}};
 const results=normalizers.normalizeOSMPOI([
   valid,
   {type:'way',id:8,center:{lat:35.8,lon:139.8},tags:{name:'遠方公園',leisure:'park'}},
   {type:'way',id:9,tags:{name:'座標なし公園',leisure:'park'}},
   {type:'node',id:10,lat:95,lon:139.6659,tags:{name:'異常公園',leisure:'park'}},
   {type:'node',id:11,lat:35.7074,lon:139.6659,tags:{leisure:'park'}},
   {type:'node',id:12,lat:35.7074,lon:139.6659,tags:{name:'未対象施設',shop:'furniture'}}
 ],origin);
 assert.equal(results.length,1);
 assert.equal(results[0].sourceId,'node/7');
 assert.equal(results[0].distanceMeters,0);
});

test('STB-04 OpenPOI preserves source data while enforcing location and type validation',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={lat:35.7074,lon:139.6659};
 const records=normalizers.normalizeOpenPOI([
   {name:'お酒の美術館',category:'restaurant',lat:35.7074,lng:139.6659},
   {name:'遠方の公園',category:'park',lat:35.8,lng:139.8},
   {name:'不正な座標',category:'park',lat:'invalid',lng:139.6659},
   {name:'座標なし',category:'park',lat:null,lng:null},
   {name:'未知の一般店',category:'retail_other',lat:35.7074,lng:139.6659}
 ],origin);
 assert.equal(records.length,1);
 assert.equal(records[0].theme,'dining');
 assert.equal(records[0].name,'お酒の美術館');
 assert.equal(records[0].source,'OpenPOI');
});

test('STB-05 deduplicates matching names within 40m and keeps both source attributions',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={label:'東京都中野区中野',lat:35.7074,lon:139.6659};
 const osm=normalizers.normalizeOSMPOI([
   {type:'node',id:12,lat:35.70740,lon:139.66590,tags:{name:'地域図書館',amenity:'library'}}
 ],origin)[0];
 const open=normalizers.normalizeOpenPOI([
   {id:'a1',name:'地域図書館',category:'library',lat:35.70743,lng:139.66592,
    prefecture:'東京都',city:'中野区',licenses:['CC-BY-4.0'],attributions:['provider-example']}
 ],origin)[0];
 const list=normalizers.deduplicatePOIs([osm,open]);
 assert.equal(list.length,1);
 assert.equal(list[0].source,'OpenPOI');
 assert.equal(list[0].evidenceSources.length,2);
 assert.ok(list[0].evidenceSources.some(e=>e.source==='OSM'&&e.sourceId==='node/12'));
 assert.ok(list[0].evidenceSources.some(e=>e.source==='OpenPOI'&&e.licenses.includes('CC-BY-4.0')));
 assert.equal(list[0].validationFlags.length,0);
 assert.equal(normalizers.choosePOIs(list)[0].evidenceSources.length,2,
   'POI re-ranking should not discard secondary-source attribution');
});

test('STB-05 preserves same-named locations hundreds of metres apart',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={label:'東京都中野区中野',lat:35.7074,lon:139.6659};
 const a=normalizers.normalizeOpenPOI([
  {name:'中央公園',category:'park',lat:35.7074,lng:139.6659},
  {name:'中央公園',category:'park',lat:35.7102,lng:139.6659}
 ],origin);
 assert.equal(a.length,2);
 assert.equal(normalizers.deduplicatePOIs(a).length,2);
 assert.equal(normalizers.choosePOIs(a).filter(p=>p.name==='中央公園').length,2);
 const other=normalizers.normalizeOpenPOI([
  {name:'別名公園',category:'park',lat:35.7074,lng:139.66595}
 ],origin);
 assert.equal(normalizers.deduplicatePOIs([a[0],...other]).length,2);
});

test('STB-05 municipality and prefecture discrepancies are review flags not deletions',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={label:'東京都中野区中野',lat:35.7074,lon:139.6659};
 const a=normalizers.normalizeOpenPOI([
   {name:'近所図書館',category:'library',lat:35.7074,lng:139.6659,
    prefecture:'東京都',city:'中野区'},
   {name:'県の違う図書館',category:'library',lat:35.70745,lng:139.6659,
    prefecture:'神奈川県',city:'中野区'},
   {name:'別自治体図書館',category:'library',lat:35.70748,lng:139.6659,
    prefecture:'東京都',city:'杉並区'}
 ],origin);
 assert.equal(a.length,3);
 assert.equal(a[0].validationFlags.length,0);
 assert.equal(a[1].validationFlags.includes('prefecture_mismatch'),true);
 assert.equal(a[2].validationFlags.includes('municipality_mismatch'),true);
 assert.equal(a[2].recordCity,'杉並区');
 assert.equal(a[2].address,null);
});

test('STB-05 ambiguous location labels do not imply municipality mismatch',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={label:'中野付近（地図指定）',lat:35.7074,lon:139.6659};
 const a=normalizers.normalizeOpenPOI([
  {name:'公園',category:'park',lat:35.7074,lng:139.6659,
    city:'渋谷区',prefecture:'東京都'}
 ],origin);
 assert.equal(a.length,1);
 assert.equal(a[0].validationFlags.length,0);
 assert.equal(normalizers.deduplicatePOIs([]).length,0);
});

test('STB-06 bar_izakaya beats the word 美術館 in the brand name',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={lat:35.7074,lon:139.6659};
 const rows=normalizers.normalizeOpenPOI([
  {id:'bar1',name:'お酒の美術館中野店',category:'bar_izakaya',
   business_type:'bar_izakaya',lat:35.7074,lng:139.6659},
  {id:'bar2',name:'バー美術館',category:'tourism',
   business_type:'bar_izakaya',lat:35.7075,lng:139.6659},
  {id:'bar3',name:'お酒の美術館',category:'restaurant',
   business_type:'restaurant',lat:35.7076,lng:139.6659}
 ],origin);
 assert.equal(rows.length,3);
 for(const row of rows){
  assert.equal(row.theme,'dining');
  assert.equal(row.category,'食と街の営み');
  assert.equal(row.classificationConfidence,'high');
  assert.equal(row.classificationEvidence,'business_type');
  assert.equal(row.classificationFlags.includes('name_type_conflict'),true);
 }
});

test('STB-06 explicit culture and bookstore types remain confidently classified',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={lat:35.7074,lon:139.6659};
 const rows=normalizers.normalizeOpenPOI([
  {name:'市立美術館',category:'museum',lat:35.7074,lng:139.6659},
  {name:'神保町古書店',business_type:'bookstore',category:'retail_other',lat:35.70745,lng:139.6659},
  {name:'公園前カフェ',business_type:'cafe',category:'restaurant',lat:35.7075,lng:139.6659}
 ],origin);
 assert.equal(rows.length,3);
 assert.equal(rows[0].theme,'culture');
 assert.equal(rows[0].classificationConfidence,'high');
 assert.equal(rows[0].classificationEvidence,'category');
 assert.equal(rows[1].theme,'knowledge');
 assert.equal(rows[1].classificationEvidence,'business_type');
 assert.equal(rows[2].theme,'dining');
 assert.equal(rows[2].classificationFlags.includes('name_type_conflict'),true);
});

test('STB-06 unknown provider category plus a museum name stays low confidence',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={lat:35.7074,lon:139.6659};
 const records=normalizers.normalizeOpenPOI([
  {name:'お酒の美術館',lat:35.7074,lng:139.6659},
  {name:'美術館商店',category:'retail_other',lat:35.70745,lng:139.6659},
  {name:'市立美術館',lat:35.7075,lng:139.6659},
  {name:'歴史博物館',category:'museum',lat:35.70755,lng:139.6659}
 ],origin);
 assert.equal(records.length,4);
 assert.equal(records[0].classificationConfidence,'low');
 assert.equal(records[1].classificationConfidence,'low');
 assert.equal(records[2].classificationConfidence,'medium');
 assert.equal(records[3].classificationConfidence,'high');
 assert.equal(normalizers.choosePOIs(records).length,2);
 assert.ok(normalizers.choosePOIs(records).every(x=>x.classificationConfidence!=='low'));
});

test('STB-06 OSM unknown tags are rejected instead of getting a theme from their names',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={lat:35.7074,lon:139.6659};
 const out=normalizers.normalizeOSMPOI([
  {type:'node',id:1,lat:35.7074,lon:139.6659,tags:{name:'駅前美術館商店',shop:'furniture'}},
  {type:'node',id:2,lat:35.7074,lon:139.6659,tags:{name:'本物の図書館',amenity:'library'}}
 ],origin);
 assert.equal(out.length,1);
 assert.equal(out[0].sourceId,'node/2');
 assert.equal(out[0].classificationConfidence,'high');
 assert.equal(out[0].classificationEvidence,'osm_tags');
});

test('STB-06 conflicting provider themes are quarantined but provenance is retained',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={lat:35.7074,lon:139.6659};
 const a=normalizers.normalizeOpenPOI([
  {id:'a',name:'同じ名称',category:'bar_izakaya',lat:35.7074,lng:139.6659}
 ],origin)[0];
 const b=normalizers.normalizeOSMPOI([
  {type:'node',id:2,lat:35.70742,lon:139.6659,tags:{name:'同じ名称',tourism:'museum'}}
 ],origin)[0];
 const combined=normalizers.deduplicatePOIs([a,b]);
 assert.equal(combined.length,1);
 assert.equal(combined[0].classificationConfidence,'low');
 assert.equal(combined[0].classificationFlags.includes('source_theme_conflict'),true);
 assert.equal(combined[0].evidenceSources.length,2);
 assert.equal(normalizers.choosePOIs(combined).length,0);
});

test('STB-06 unknown typed brands do not become facts from attractive naming',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={lat:35.7074,lon:139.6659};
 const records=normalizers.normalizeOpenPOI([
  {name:'建築美術館',category:'miscellaneous_business',lat:35.7074,lng:139.6659},
  {name:'学校前のスーパーマーケット',category:'supermarket',lat:35.7075,lng:139.6659},
  {name:'お酒の美術館',category:'bar_izakaya',lat:35.7076,lng:139.6659}
 ],origin);
 assert.equal(records.length,3);
 assert.equal(records[0].classificationConfidence,'low');
 assert.equal(records[1].theme,'commerce');
 assert.equal(records[1].classificationConfidence,'high');
 assert.equal(records[2].theme,'dining');
 assert.equal(records[2].classificationEvidence,'category');
});

test('STB-06 contradictory explicit business_type and category are not promoted to city facts',()=>{
 const {normalizers}=makeUI(()=>Promise.reject(Error('unused')));
 const origin={lat:35.7074,lon:139.6659};
 const records=normalizers.normalizeOpenPOI([
  {name:'交差した業態',business_type:'bar_izakaya',category:'museum',
   lat:35.7074,lng:139.6659},
  {name:'信頼できる実博物館',business_type:'museum',category:'museum',
   lat:35.7075,lng:139.6659}
 ],origin);
 assert.equal(records.length,2);
 assert.equal(records[0].classificationEvidence,'business_type');
 assert.equal(records[0].classificationConfidence,'low');
 assert.ok(records[0].classificationFlags.includes('provider_type_conflict'));
 assert.equal(records[1].classificationConfidence,'high');
 assert.equal(normalizers.choosePOIs(records).length,1);
 assert.equal(normalizers.choosePOIs(records)[0].theme,'culture');
});

test('STB-07 HTTP 429 from both providers degrades to place-only and can retry',async()=>{
 let requests=0;
 const ui=makeUI(url=>{
  requests++;
  const code=String(url).includes('openpoiapi.com')?429:503;
  return Promise.resolve({ok:false,status:code,json:async()=>({})});
 });
 await ui.presets[1].fire();
 await ui.el('#generateBtn').fire();
 assert.match(ui.el('#generatedStatus').textContent,/アクセス制限中/);
 assert.match(ui.el('#generatedStatus').textContent,/地名のみで創作/);
 assert.match(ui.el('#evidenceText').textContent,/周辺施設データが得られなかった/);
 const before=requests;
 await ui.el('#regenerateBtn').fire();
 assert.ok(requests>before,'Transient failed POI lookup must be retried, not reused as an empty cache');
 assert.equal(ui.el('#generateBtn').disabled,false);
});

test('STB-07 partial OpenPOI success keeps validated POIs and reveals missing sources',async()=>{
 const ui=makeUI(url=>{
  const u=String(url);
  if(u.includes('openpoiapi.com')){
   const q=new URL(u).searchParams.get('q');
   return Promise.resolve(q?{ok:false,status:429,json:async()=>({})}:
    response({results:[{name:'近隣の図書館',category:'library',lat:35.7074,lng:139.6659}]}));
  }
  if(u.includes('overpass'))return Promise.resolve(response({elements:[]}));
  throw Error('unexpected URL');
 });
 await ui.presets[1].fire();
 await ui.el('#generateBtn').fire();
 assert.match(ui.el('#generatedStatus').textContent,/一部の施設情報はアクセス制限中/);
 assert.match(ui.el('#poemBody').textContent,/近隣の図書館/);
});

test('STB-07 OpenPOI failure and successful OSM fallback does not claim full coverage',async()=>{
 const ui=makeUI(url=>{
  if(String(url).includes('openpoiapi.com'))return Promise.reject(new TypeError('Failed to fetch'));
  return Promise.resolve(response({elements:[{type:'node',id:300,lat:35.7074,lon:139.6659,
    tags:{name:'補完の公園',leisure:'park'}}]}));
 });
 await ui.presets[1].fire();
 await ui.el('#generateBtn').fire();
 assert.match(ui.el('#poemBody').textContent,/補完の公園/);
 assert.match(ui.el('#generatedStatus').textContent,/一部の施設情報を取得できませんでした/);
});

test('STB-07 successful empty responses are not described as API failures',async()=>{
 let queries=0;
 const ui=makeUI(url=>{
  queries++;
  return Promise.resolve(String(url).includes('openpoiapi.com')?
   response({results:[]}):response({elements:[]}));
 });
 await ui.presets[1].fire();
 await ui.el('#generateBtn').fire();
 assert.match(ui.el('#generatedStatus').textContent,/利用できる周辺施設データが見つかりませんでした/);
 assert.doesNotMatch(ui.el('#generatedStatus').textContent,/アクセス制限中|取得できませんでした/);
 const first=queries;
 await ui.el('#regenerateBtn').fire();
 assert.equal(queries,first,'Successful empty data can be reused during same-style regeneration');
});

test('STB-07 malformed response plus unavailable fallback produces recoverable local poem',async()=>{
 const ui=makeUI(url=>Promise.resolve(String(url).includes('openpoiapi.com')?
  response({results:'not-an-array'}):{ok:false,status:500,json:async()=>({})}));
 await ui.presets[1].fire();
 await ui.el('#generateBtn').fire();
 assert.match(ui.el('#generatedStatus').textContent,/取得できませんでした/);
 assert.equal(ui.el('#poemProperty').textContent,'THE NAKANO RESIDENCE');
 assert.equal(ui.el('#generateBtn').disabled,false);
});

test('STB-07 fetch timeout differs from user cancellation',async()=>{
 const ui=makeUI((url,{signal}={})=>new Promise((resolve,reject)=>{
  const abort=()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'}));
  if(signal?.aborted)abort();
  else signal?.addEventListener('abort',abort,{once:true});
 }));
 const operation=ui.normalizers.fetchWithCancellation('https://example.invalid',{},new AbortController().signal,5);
 await assert.rejects(operation,error=>error.code==='timeout');
 const cancelled=new AbortController();
 cancelled.abort();
 await assert.rejects(ui.normalizers.fetchWithCancellation('https://example.invalid',{},cancelled.signal,100),
  error=>ui.normalizers.poiErrorCode(error)==='aborted');
});
