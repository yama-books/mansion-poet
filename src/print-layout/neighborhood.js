/* PRINT03-CORE: curate the back-side "neighbourhood" list from POIs the app has
 * already fetched and normalized (index.html normalizePOIs). Pure: no network,
 * no new facts. It only chooses and orders existing records.
 *
 * The list mixes two tiers on purpose (user decision 2026-10-21):
 *  - allure: parks, water, history, culture, libraries, stations, shops ...
 *  - plain : small urban fixtures (post boxes, manholes, mirrors, ditches ...)
 *    a few of these are blended in so the list reads like an over-eager ad.
 * The tier is never printed. Protected / sensitive places are excluded from
 * both tiers by SubjectPolicy (SAFE-01); unverified classifications are skipped.
 */
(function(root){'use strict';
const MAX_RADIUS_M=850;
const THEME_SCORE={green:9,water:8,history:8,culture:8,knowledge:7,transport:6,commerce:5,daily:5,dining:4};
const MEDICAL_SCORE=6;
// Small fixtures that make the "plain" tier (explicit tags / provider codes only).
const PLAIN_OSM=[
 t=>t.amenity==='post_box',t=>t.man_made==='manhole',t=>t.highway==='traffic_mirror',
 t=>t.waterway==='ditch'||t.waterway==='drain',t=>t.tunnel==='culvert',
 t=>t.amenity==='vending_machine',t=>t.amenity==='parcel_locker',t=>t.man_made==='street_cabinet'
];
const PLAIN_CODES=new Set(['post_box','vending_machine','parcel_locker','manhole','traffic_mirror','street_cabinet','ditch','drain','culvert']);
const norm=v=>String(v==null?'':v).trim().toLowerCase().replace(/[\s-]+/g,'_');
/* Medical facilities (user decision 2026-10-21): useful for a living-area list,
 * so hospitals / clinics / dentists / pharmacies may be listed by name, kind and
 * distance only. SubjectPolicy keeps them out of the POEM and ad cards; here they
 * are re-admitted narrowly. Care, welfare, mental-health, addiction, hospice and
 * similar services stay excluded. Never used in the plain (joke) tier. */
const MEDICAL_CODES=new Set(['hospital','clinic','doctors','dentist','pharmacy','drugstore']);
const MEDICAL_EXCLUDE=/social_facility|welfare|nursing|care_home|hospice|mental|psychiatr|addiction|rehabilitation|counsel|disab|assisted|group_home|shelter/;
const MEDICAL_EXCLUDE_NAME=/精神|心療|依存|ホスピス|介護|福祉|療育|障害|支援センター|リハビリ|更生/;
function medicalKind(p){
 const t=p.tags||{};
 const codes=[t.amenity,t.healthcare,t.shop,p.providerBusinessType,p.providerCategory,t.business_type,t.category].map(norm).filter(Boolean);
 if(!codes.some(c=>MEDICAL_CODES.has(c)))return false;
 const all=[...codes,...Object.entries(t).map(([k,v])=>norm(k)+'='+norm(v))].join(' ');
 if(MEDICAL_EXCLUDE.test(all)||MEDICAL_EXCLUDE_NAME.test(String(p.name||'')))return false;
 return true;
}

function isPlain(p){
 const t=p.tags||{};
 if(p.source==='OSM')return PLAIN_OSM.some(f=>f(t));
 return [p.providerBusinessType,p.providerCategory,t.business_type,t.category].map(norm).some(c=>PLAIN_CODES.has(c));
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
 const decision=policy.decideSubject(p);
 if(decision.eligibility==='allow')return true;
 // narrowly re-admit ordinary medical facilities that the POEM policy suppresses
 return decision.eligibility==='suppress'&&(decision.reasons||[]).includes('protected_care_support_or_education')&&medicalKind(p);
}
const keyOf=p=>p.sourceId?`${p.source}:${p.sourceId}`:`${p.source}:${p.name}@${(+p.lat).toFixed(5)},${(+p.lon).toFixed(5)}`;

/* curate(pois,{subjectPolicy,exclude,max,plainSlots,firstRank}) -> items[]
 * exclude: sourceIds (and names) already printed as LOCATION cards. */
function curate(pois,opts={}){
 const policy=opts.subjectPolicy;
 if(!policy||typeof policy.decideSubject!=='function')throw new Error('PRINT03 neighbourhood: subjectPolicy is required (fail closed)');
 const max=Math.max(0,Math.min(12,opts.max??7));
 const plainCap=Math.max(0,opts.plainSlots??(max>=6?2:max>=3?1:0));
 const excludeIds=new Set((opts.exclude||[]).map(String));
 const excludeNames=new Set((opts.excludeNames||[]).map(s=>String(s).trim()));
 const seen=new Set();
 const allure=[],plain=[],medical=[];
 for(const p of Array.isArray(pois)?pois:[]){
  if(!eligible(p,policy))continue;
  if(excludeIds.has(String(p.sourceId))||excludeNames.has(String(p.name).trim()))continue;
  const k=keyOf(p);if(seen.has(k))continue;seen.add(k);
  if(medicalKind(p))medical.push(p);
  else if(isPlain(p))plain.push(p);
  else if(THEME_SCORE[p.theme]!=null)allure.push(p);
 }
 const baseScore=p=>medicalKind(p)?MEDICAL_SCORE:THEME_SCORE[p.theme];
 const score=p=>baseScore(p)+(p.nameIsFallback?0:1)-2*p.distanceMeters/MAX_RADIUS_M;
 const stable=(a,b)=>a.distanceMeters-b.distanceMeters||String(a.name).localeCompare(String(b.name),'ja')||keyOf(a).localeCompare(keyOf(b));
 allure.sort((a,b)=>score(b)-score(a)||stable(a,b));
 plain.sort(stable);
 const pick=(list,perKind,limit)=>{
  const out=[],count=new Map();
  for(const p of list){
   if(out.length>=limit)break;
   const kind=String(p.category||p.theme);
   if((count.get(kind)||0)>=perKind)continue;
   count.set(kind,(count.get(kind)||0)+1);out.push(p);
  }
  return out;
 };
 // one slot is reserved for the nearest ordinary medical facility, if any
 medical.sort(stable);
 const med=medical[0]||null;
 const firstPass=pick(allure,2,Math.max(0,max-plainCap-(med?1:0)));
 // plain items stay a minority: at most about half the attractive ones (min 1)
 const plains=pick(plain,1,Math.min(plainCap,Math.max(1,Math.ceil(firstPass.length/2))));
 const allures=pick(allure,2,Math.max(0,max-plains.length-(med?1:0)));
 if(med&&allures.length+plains.length<max){
  const at=allures.findIndex(p=>score(p)<score(med));
  allures.splice(at<0?allures.length:at,0,med);
 }
 // Blend the plain items in at the 3rd and 6th positions instead of appending them.
 const order=[...allures];
 [2,5,8].slice(0,plains.length).forEach((at,i)=>order.splice(Math.min(at,order.length),0,plains[i]));
 const first=opts.firstRank||1;
 return order.slice(0,max).map((p,i)=>Object.freeze({
  rank:first+i,sourceId:p.sourceId||null,name:String(p.name).trim(),kindLabel:String(p.category||'周辺施設'),
  tier:medicalKind(p)?'medical':isPlain(p)?'plain':'allure',distanceMeters:Math.round(p.distanceMeters),lat:p.lat,lon:p.lon,
  source:p.source,retrievedAt:String(p.retrievedAt||'').slice(0,10)||null
 }));
}
const api=Object.freeze({curate,isPlain,medicalKind,THEME_SCORE,MEDICAL_SCORE,MAX_RADIUS_M});
if(typeof module==='object'&&module.exports)module.exports=api;
root.PrintNeighborhood=api;
})(typeof globalThis==='object'?globalThis:this);
