/* PRINT03-CORE: curate the back-side "neighbourhood" list from POIs the app has
 * already fetched and normalized (index.html normalizePOIs). Pure: no network,
 * no new facts. It only chooses and orders existing records.
 *
 * Tiers (never printed; user decisions 2026-10-21):
 *  - allure  : parks, water, history, culture, knowledge
 *  - ordinary: stations, shops, daily needs, cafes ... fill the list when the
 *              attractive places run out, so a plain residential area still
 *              gets a full list
 *  - medical : at most one ordinary hospital / clinic / dentist / pharmacy
 *  - plain   : small urban fixtures from a catalogue of ~30 genres. They are a
 *              random element: per generation 0, 1 or 2 of them may appear, of
 *              varying genres, at varying positions. The draw is seeded by the
 *              generation token, so re-printing the same result is stable.
 * Protected / sensitive places are excluded by SubjectPolicy (SAFE-01).
 */
(function(root){'use strict';
const MAX_RADIUS_M=850;
const ALLURE_SCORE={green:9,water:8,history:8,culture:8,knowledge:7};
const ORDINARY_SCORE={transport:6,commerce:5,daily:5,dining:4};
const MEDICAL_SCORE=6;
const norm=v=>String(v==null?'':v).trim().toLowerCase().replace(/[\s-]+/g,'_');

/* ~30 genres that common sense ranks low for a residence advert. Each entry:
 * id, Japanese label, explicit OSM selector (for the app's query) and a matcher.
 * Deliberately absent: cameras / surveillance, cemeteries, police, anything
 * about people or care. */
const tagIs=(k,v)=>t=>norm(t[k])===v;
const PLAIN_GENRES=Object.freeze([
 {id:'post_box',label:'郵便差出箱',osm:'["amenity"="post_box"]',match:tagIs('amenity','post_box')},
 {id:'manhole',label:'マンホール',osm:'["man_made"="manhole"]',match:tagIs('man_made','manhole')},
 {id:'traffic_mirror',label:'カーブミラー',osm:'["highway"="traffic_mirror"]',match:tagIs('highway','traffic_mirror')},
 {id:'ditch',label:'側溝',osm:'["waterway"="ditch"]',match:tagIs('waterway','ditch')},
 {id:'drain',label:'排水路',osm:'["waterway"="drain"]',match:t=>norm(t.waterway)==='drain'&&norm(t.tunnel)!=='culvert'},
 {id:'culvert',label:'暗渠',osm:'["tunnel"="culvert"]',match:tagIs('tunnel','culvert')},
 {id:'vending_machine',label:'自動販売機',osm:'["amenity"="vending_machine"]',match:tagIs('amenity','vending_machine')},
 {id:'parcel_locker',label:'宅配ロッカー',osm:'["amenity"="parcel_locker"]',match:tagIs('amenity','parcel_locker')},
 {id:'telephone',label:'公衆電話',osm:'["amenity"="telephone"]',match:tagIs('amenity','telephone')},
 {id:'fire_hydrant',label:'消火栓',osm:'["emergency"="fire_hydrant"]',match:tagIs('emergency','fire_hydrant')},
 {id:'fire_water',label:'防火水槽',osm:'["emergency"="water_tank"]',match:tagIs('emergency','water_tank')},
 {id:'bench',label:'ベンチ',osm:'["amenity"="bench"]',match:tagIs('amenity','bench')},
 {id:'bicycle_parking',label:'駐輪場',osm:'["amenity"="bicycle_parking"]',match:tagIs('amenity','bicycle_parking')},
 {id:'parking',label:'コインパーキング',osm:'["amenity"="parking"]["fee"="yes"]',match:t=>norm(t.amenity)==='parking'&&norm(t.fee)==='yes'},
 {id:'toilets',label:'公衆トイレ',osm:'["amenity"="toilets"]',match:tagIs('amenity','toilets')},
 {id:'waste_basket',label:'ごみ箱',osm:'["amenity"="waste_basket"]',match:tagIs('amenity','waste_basket')},
 {id:'recycling',label:'資源回収ボックス',osm:'["amenity"="recycling"]',match:tagIs('amenity','recycling')},
 {id:'power_pole',label:'電柱',osm:'["power"="pole"]',match:tagIs('power','pole')},
 {id:'power_tower',label:'送電鉄塔',osm:'["power"="tower"]',match:tagIs('power','tower')},
 {id:'substation',label:'変電設備',osm:'["power"="substation"]',match:tagIs('power','substation')},
 {id:'street_cabinet',label:'配電箱',osm:'["man_made"="street_cabinet"]',match:tagIs('man_made','street_cabinet')},
 {id:'traffic_signals',label:'信号機',osm:'["highway"="traffic_signals"]',match:tagIs('highway','traffic_signals')},
 {id:'street_lamp',label:'街灯',osm:'["highway"="street_lamp"]',match:tagIs('highway','street_lamp')},
 {id:'bollard',label:'車止め',osm:'["barrier"="bollard"]',match:tagIs('barrier','bollard')},
 {id:'survey_point',label:'測量標',osm:'["man_made"="survey_point"]',match:tagIs('man_made','survey_point')},
 {id:'water_tower',label:'給水塔',osm:'["man_made"="water_tower"]',match:tagIs('man_made','water_tower')},
 {id:'drinking_water',label:'水飲み場',osm:'["amenity"="drinking_water"]',match:tagIs('amenity','drinking_water')},
 {id:'notice_board',label:'掲示板',osm:'["amenity"="notice_board"]',match:tagIs('amenity','notice_board')},
 {id:'clock',label:'公共時計',osm:'["amenity"="clock"]',match:tagIs('amenity','clock')},
 {id:'charging_station',label:'EV充電器',osm:'["amenity"="charging_station"]',match:tagIs('amenity','charging_station')},
 {id:'atm',label:'ATM',osm:'["amenity"="atm"]',match:tagIs('amenity','atm')}
].map(Object.freeze));
const PLAIN_OPENPOI={vending_machine:'vending_machine',parcel_locker:'parcel_locker',post_box:'post_box',atm:'atm',
 manhole:'manhole',traffic_mirror:'traffic_mirror',street_cabinet:'street_cabinet',ditch:'ditch',drain:'drain',culvert:'culvert'};
function plainGenre(p){
 const t=p.tags||{};
 if(p.source==='OSM'){
  // culvert outranks drain/ditch on the same way
  if(norm(t.tunnel)==='culvert')return PLAIN_GENRES.find(g=>g.id==='culvert');
  return PLAIN_GENRES.find(g=>g.match(t))||null;
 }
 for(const c of [p.providerBusinessType,p.providerCategory,t.business_type,t.category].map(norm)){
  if(PLAIN_OPENPOI[c])return PLAIN_GENRES.find(g=>g.id===PLAIN_OPENPOI[c]);
 }
 return null;
}
/* Overpass query for the plain genres (for the app's fetch code; this module
 * never sends it). Each genre gets its own small output limit. */
function overpassPlainQuery(lat,lon,radius=400,perGenre=3){
 if(![lat,lon,radius,perGenre].every(Number.isFinite)||Math.abs(lat)>90||Math.abs(lon)>180)throw new Error('invalid query origin');
 const r=Math.max(50,Math.min(600,Math.round(radius))),n=Math.max(1,Math.min(5,Math.round(perGenre)));
 const around=`around:${r},${lat.toFixed(5)},${lon.toFixed(5)}`;
 const parts=PLAIN_GENRES.map(g=>`nwr(${around})${g.osm};out center ${n};`);
 return `[out:json][timeout:15][maxsize:16777216];${parts.join('')}`;
}

/* Medical facilities (user decision 2026-10-21): hospital / clinic / dentist /
 * pharmacy by name, kind and distance only. Care, welfare, mental-health,
 * addiction, hospice and similar services stay excluded. */
// drugstores are ordinary shops here; a dispensing pharmacy counts as medical
const MEDICAL_CODES=new Set(['hospital','clinic','doctors','dentist','pharmacy']);
// an explicit OSM healthcare=* must itself be one of these (psychotherapist,
// counselling, alternative, rehabilitation ... are not re-admitted)
const MEDICAL_HEALTHCARE=new Set(['hospital','clinic','doctor','doctors','dentist','pharmacy']);
const MEDICAL_EXCLUDE=/social_facility|welfare|nursing|care_home|hospice|mental|psych|addiction|rehabilitation|counsel|disab|assisted|group_home|shelter/;
const MEDICAL_EXCLUDE_NAME=/精神|心療|メンタル|カウンセリング|依存|ホスピス|介護|福祉|療育|発達|障害|特別支援|支援センター|困窮|被害者|難病|リハビリ|更生/;
function medicalKind(p){
 const t=p.tags||{};
 const codes=[t.amenity,t.healthcare,t.shop,p.providerBusinessType,p.providerCategory,t.business_type,t.category].map(norm).filter(Boolean);
 if(!codes.some(c=>MEDICAL_CODES.has(c)))return false;
 if(t.healthcare!=null&&!MEDICAL_HEALTHCARE.has(norm(t.healthcare)))return false;
 const all=[...codes,...Object.entries(t).map(([k,v])=>norm(k)+'='+norm(v))].join(' ');
 return !(MEDICAL_EXCLUDE.test(all)||MEDICAL_EXCLUDE_NAME.test(String(p.name||'')));
}

function eligible(p,policy){
 if(!p||typeof p!=='object')return false;
 if(!String(p.name||'').trim()||String(p.name).length>80)return false;
 if(p.source!=='OSM'&&p.source!=='OpenPOI')return false;
 if(!Number.isFinite(p.distanceMeters)||p.distanceMeters<0||p.distanceMeters>MAX_RADIUS_M)return false;
 if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon))return false;
 if(p.classificationConfidence!=='high')return false;
 if((p.validationFlags||[]).length)return false;
 if((p.classificationFlags||[]).some(f=>/conflict|unverified/.test(f)))return false;
 const d=policy.decideSubject(p);
 if(d.eligibility==='allow')return true;
 // re-admit narrowly, and only when that one reason is the whole decision
 const only=r=>Array.isArray(d.reasons)&&d.reasons.length===1&&d.reasons[0]===r;
 // ordinary medical facilities (suppressed only as POEM subjects)
 if(d.eligibility==='suppress'&&only('protected_care_support_or_education')&&medicalKind(p))return true;
 // and catalogue fixtures whose tag keys (power, emergency, barrier ...) the POEM
 // policy does not know; protected places were already suppressed before this
 if(d.eligibility==='needs_review'&&only('unsupported_or_unverified_type')&&plainGenre(p))return true;
 return false;
}
const keyOf=p=>p.sourceId?`${p.source}:${p.sourceId}`:`${p.source}:${p.name}@${(+p.lat).toFixed(5)},${(+p.lon).toFixed(5)}`;

/* Small deterministic PRNG (mulberry32) seeded from a string. */
function rng(seedText){
 let h=1779033703^String(seedText).length;
 for(const ch of String(seedText)){h=Math.imul(h^ch.charCodeAt(0),3432918353);h=h<<13|h>>>19}
 let a=h>>>0;
 return ()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
}
// How many plain fixtures a generation shows: often none, sometimes one, rarely two.
const PLAIN_COUNT_WEIGHTS=[[0,0.45],[1,0.40],[2,0.15]];
function drawCount(r,cap){
 const x=r();let acc=0;
 for(const [n,w] of PLAIN_COUNT_WEIGHTS){acc+=w;if(x<acc)return Math.min(n,cap)}
 return 0;
}

/* curate(pois,{subjectPolicy,seed,exclude,excludeNames,max,firstRank}) -> items[] */
function curate(pois,opts={}){
 const policy=opts.subjectPolicy;
 if(!policy||typeof policy.decideSubject!=='function')throw new Error('PRINT03 neighbourhood: subjectPolicy is required (fail closed)');
 const max=Math.max(0,Math.min(12,opts.max??7));
 const r=rng(opts.seed??'print03');
 const excludeIds=new Set((opts.exclude||[]).map(String));
 const excludeNames=new Set((opts.excludeNames||[]).map(s=>String(s).trim()));
 const seen=new Set();
 const ranked=[],plain=[],medical=[];
 for(const p of Array.isArray(pois)?pois:[]){
  if(!eligible(p,policy))continue;
  if(excludeIds.has(String(p.sourceId))||excludeNames.has(String(p.name).trim()))continue;
  const k=keyOf(p);if(seen.has(k))continue;seen.add(k);
  if(medicalKind(p))medical.push(p);
  else if(plainGenre(p))plain.push(p);
  else if(ALLURE_SCORE[p.theme]!=null||ORDINARY_SCORE[p.theme]!=null)ranked.push(p);
 }
 const base=p=>medicalKind(p)?MEDICAL_SCORE:(ALLURE_SCORE[p.theme]??ORDINARY_SCORE[p.theme]);
 const score=p=>base(p)+(p.nameIsFallback?0:1)-2*p.distanceMeters/MAX_RADIUS_M;
 const stable=(a,b)=>a.distanceMeters-b.distanceMeters||String(a.name).localeCompare(String(b.name),'ja')||keyOf(a).localeCompare(keyOf(b));
 ranked.sort((a,b)=>score(b)-score(a)||stable(a,b));
 medical.sort(stable);
 const med=medical[0]||null;

 // random plain fixtures: distinct genres, nearest example of each drawn genre
 const byGenre=new Map();
 for(const p of plain.sort(stable)){const g=plainGenre(p).id;if(!byGenre.has(g))byGenre.set(g,p)}
 const genres=[...byGenre.keys()].sort();
 for(let i=genres.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[genres[i],genres[j]]=[genres[j],genres[i]]}
 const plainCount=drawCount(r,Math.min(max>=6?2:max>=3?1:0,genres.length));
 const plains=genres.slice(0,plainCount).map(g=>byGenre.get(g));

 // fill: first pass allows 2 per attractive kind and 1 per ordinary kind (variety),
 // then, if places are still free, the per-kind limit is relaxed
 const room=Math.max(0,max-plains.length-(med?1:0));
 const chosen=[],count=new Map();
 const kindOf=p=>String(p.category||p.theme);
 for(const p of ranked){
  if(chosen.length>=room)break;
  const k=kindOf(p),cap=ALLURE_SCORE[p.theme]!=null?2:1;if((count.get(k)||0)>=cap)continue;
  count.set(k,(count.get(k)||0)+1);chosen.push(p);
 }
 for(const p of ranked){if(chosen.length>=room)break;if(!chosen.includes(p))chosen.push(p)}
 chosen.sort((a,b)=>score(b)-score(a)||stable(a,b));
 if(med){const at=chosen.findIndex(p=>score(p)<score(med));chosen.splice(at<0?chosen.length:at,0,med)}

 // plain fixtures land at random positions, never first
 const order=[...chosen];
 for(const p of plains){const at=1+Math.floor(r()*Math.max(1,order.length));order.splice(Math.min(at,order.length),0,p)}
 const first=opts.firstRank||1;
 return order.slice(0,max).map((p,i)=>{
  const g=plainGenre(p);
  return Object.freeze({
   rank:first+i,sourceId:p.sourceId||null,
   name:String(p.nameIsFallback&&g?`${g.label}（名称未登録）`:p.name).trim(),
   kindLabel:g?g.label:String(p.category||'周辺施設'),
   tier:medicalKind(p)?'medical':g?'plain':ALLURE_SCORE[p.theme]!=null?'allure':'ordinary',
   distanceMeters:Math.round(p.distanceMeters),lat:p.lat,lon:p.lon,
   source:p.source,retrievedAt:String(p.retrievedAt||'').slice(0,10)||null});
 });
}
const api=Object.freeze({curate,plainGenre,medicalKind,overpassPlainQuery,PLAIN_GENRES,PLAIN_COUNT_WEIGHTS,
 ALLURE_SCORE,ORDINARY_SCORE,MEDICAL_SCORE,MAX_RADIUS_M});
if(typeof module==='object'&&module.exports)module.exports=api;
root.PrintNeighborhood=api;
})(typeof globalThis==='object'?globalThis:this);
