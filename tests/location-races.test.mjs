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
  runInNewContext(script,{
    document,window,fetch:fetcher,AbortController,AbortSignal,
    navigator:{clipboard:{writeText:async()=>{}}},URL,
    console:{info(){}},setTimeout,clearTimeout,L:leaflet
  },{timeout:2000});
  if(withMap)window.listeners.load();
  return {el,presets,modes,mapHandlers};
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
  slow.resolve(response({results:poiRows}));
  await older;
  assert.equal(ui.el('#poemProperty').textContent,'THE KYOTO RESIDENCE');
  assert.equal(ui.el('#selectedPlace').textContent,'京都府京都市中京区');
  assert.equal(ui.el('#generateBtn').disabled,false);
});
