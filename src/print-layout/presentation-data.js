/* PRINT03-CORE: PresentationData contract for the independent print renderer.
 * Pure and side-effect free. It never fetches, never estimates prices and never
 * re-generates POEM / LOCATION text: it only normalizes and validates values the
 * app has already produced for one generation (COPY-LOCK-01 token).
 */
(function(root){'use strict';
const SCHEMA='print03.v1';
const SOURCES=Object.freeze({
 OSM:{label:'OpenStreetMap',credit:'© OpenStreetMap contributors'},
 OpenPOI:{label:'OpenPOI',credit:'OpenPOI API'}
});
const PRECISIONS=new Set(['full','street','area']);
// Fields that would turn a creative ad into an apparent sales offer (H-01/H-08).
const FORBIDDEN_FIELDS=['price','priceYen','floorPlan','layout','areaSqm','seller','contact','phone','qr','schoolDistrict','viewGuarantee'];
const str=v=>v==null?'':String(v);
const clean=v=>str(v).replace(/\r\n?/g,'\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim();

function formatAddress(loc){
 if(!loc.address)return '所在地詳細：公開データ未収録';
 if(loc.addressPrecision==='area')return '所在地（地域情報のみ）：'+loc.address;
 if(loc.addressPrecision==='street')return '所在地（公開データの街路情報）：'+loc.address;
 return '所在地（公開データ）：'+loc.address;
}
function formatDistance(loc){return '直線 約'+loc.distanceMeters+'m'}
function formatWalk(loc){return loc.walkMinutes==null?'':'徒歩約'+loc.walkMinutes+'分（経路確認済み）'}
function formatSource(loc){return '掲載情報：'+(SOURCES[loc.source]?.label||'不明')}

function normalizeLocation(raw,i){
 const loc={
  rank:Number.isInteger(raw?.rank)?raw.rank:i+1,
  sourceId:clean(raw?.sourceId)||null,
  name:clean(raw?.name),
  genreLabel:clean(raw?.genreLabel)||'周辺施設',
  address:clean(raw?.address)||null,
  addressPrecision:PRECISIONS.has(raw?.addressPrecision)?raw.addressPrecision:(raw?.address?'full':null),
  distanceMeters:typeof raw?.distanceMeters==='number'?Math.round(raw.distanceMeters):NaN,
  walkMinutes:raw?.walkMinutes==null?null:Number(raw.walkMinutes),
  routeVerified:raw?.routeVerified===true,
  headline:clean(raw?.headline),
  body:clean(raw?.body),
  source:clean(raw?.source),
  retrievedAt:clean(raw?.retrievedAt).slice(0,10)||null,
  lat:coord(raw?.lat,90),lon:coord(raw?.lon,180)
 };
 return Object.freeze(loc);
}
function coord(v,limit){return typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=limit?v:null}

/* Position diagram geometry from coordinates only (no map data, no routes).
 * Returns ok:false when any coordinate is missing or when the distance derived
 * from coordinates disagrees with the printed straight-line distance: a wrongly
 * placed facility would assert a false position (H-02), so the diagram is then
 * omitted instead of drawn. */
const DIST_TOLERANCE_M=25,DIST_TOLERANCE_RATIO=0.15;
function haversine(a,b){
 const R=6371008.8,rad=Math.PI/180;
 const dLat=(b.lat-a.lat)*rad,dLon=(b.lon-a.lon)*rad;
 const s=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;
 return 2*R*Math.asin(Math.sqrt(s));
}
function positionGeometry(data){
 const c=data.place;
 if(!data.locations.length)return {ok:false,reason:'no_locations',points:[]};
 if(c.lat==null||c.lon==null)return {ok:false,reason:'no_place_coordinates',points:[]};
 const points=[],mismatches=[];
 for(const loc of data.locations){
  if(loc.lat==null||loc.lon==null)return {ok:false,reason:'missing_location_coordinates',points:[]};
  const d=haversine(c,loc);
  if(Math.abs(d-loc.distanceMeters)>Math.max(DIST_TOLERANCE_M,loc.distanceMeters*DIST_TOLERANCE_RATIO))
   mismatches.push({rank:loc.rank,printed:loc.distanceMeters,fromCoordinates:Math.round(d)});
  // local east / north offsets in metres (equirectangular is exact enough under 2 km)
  const east=(loc.lon-c.lon)*Math.cos(c.lat*Math.PI/180)*111320;
  const north=(loc.lat-c.lat)*110574;
  points.push({rank:loc.rank,east,north,distance:loc.distanceMeters});
 }
 if(mismatches.length)return {ok:false,reason:'distance_mismatch',mismatches,points:[]};
 return {ok:true,points,maxDistance:Math.max(...points.map(p=>p.distance))};
}
const POSITION_MAP_NOTE='位置関係図は選択地点と施設の座標から描いた参考図です。距離の円と線は直線距離を示し、道路・経路・徒歩時間・施設の敷地範囲を示すものではありません。地図データは使用していません。';
const SCHEMATIC_MAP_NOTE='位置図は概念図です。縮尺・方位・道路距離・徒歩時間を示すものではありません。';

/* Compose the credit / creative-note lines from what is actually printed.
 * Each line is required print content (H-06 checks it is not dropped). */
function composeCredits(data,{schematicMap=false,positionMap=false,illustration=true}={}){
 const lines=['物件と広告文章は創作です。実際の販売・募集情報ではありません。'];
 if(illustration)lines.push('図版は架空建築の抽象線画です。実在の建物・計画を表すものではありません。');
 if(data.locations.length){
  lines.push('周辺施設名・直線距離は取得時点の公開データに基づく参考情報です。距離は選択地点からの直線距離で、徒歩所要時間ではありません。所在地・営業状況・施設への立入可否は保証しません。');
  const bySource=new Map();
  for(const loc of data.locations){
   const dates=bySource.get(loc.source)||new Set();
   if(loc.retrievedAt)dates.add(loc.retrievedAt);
   bySource.set(loc.source,dates);
  }
  for(const [source,dates] of bySource){
   const d=[...dates].sort();
   lines.push('施設データ：'+SOURCES[source].credit+(d.length?'（取得 '+d.join('・')+'）':'（取得日不明）'));
  }
 }else if(data.evidence.mode==='place_only'){
  lines.push('周辺施設データを用いず、指定した地名だけを材料にした創作文です。実在施設・地形・文化財の事実確認は行っていません。');
 }
 // A template asking for a map gets the position diagram when the coordinates
 // are consistent, otherwise the rank-based schematic.
 if((schematicMap||positionMap)&&data.locations.length){
  const geo=positionGeometry(data);
  if(geo.ok)lines.push(POSITION_MAP_NOTE);
  else if(schematicMap)lines.push(SCHEMATIC_MAP_NOTE);
 }
 return Object.freeze(lines);
}

function validate(input){
 const errors=[],warnings=[];
 if(!input||typeof input!=='object')return {ok:false,errors:['input must be an object'],warnings};
 for(const f of FORBIDDEN_FIELDS){
  if(f in input||(input.property&&f in input.property))errors.push(`H-08: unsupported sales-like field "${f}" is not printable in ${SCHEMA}`);
 }
 if(!clean(input.generationToken))errors.push('H-07: generationToken is required');
 if(!clean(input.poem?.headline))errors.push('poem.headline is required');
 if(!clean(input.poem?.body))errors.push('poem.body is required');
 if(!clean(input.property?.name))errors.push('property.name is required');
 if(!clean(input.place?.label))errors.push('place.label is required');
 const locs=Array.isArray(input.locations)?input.locations:[];
 if(input.locations!=null&&!Array.isArray(input.locations))errors.push('locations must be an array');
 if(locs.length>3)errors.push(`locations must be 0..3 (got ${locs.length})`);
 const mode=input.evidence?.mode;
 if(mode!=='poi'&&mode!=='place_only')errors.push('evidence.mode must be "poi" or "place_only"');
 if(mode==='place_only'&&locs.length)errors.push('evidence.mode place_only cannot carry LOCATION cards');
 if(mode==='poi'&&!locs.length)warnings.push('evidence.mode poi without LOCATION cards: only the POEM is printed');
 locs.slice(0,3).forEach((raw,i)=>{
  const at=`locations[${i}]`;
  if(!clean(raw?.name))errors.push(`${at}.name is required`);
  if(!clean(raw?.headline))errors.push(`${at}.headline is required`);
  if(!clean(raw?.body))errors.push(`${at}.body is required`);
  if(!SOURCES[clean(raw?.source)])errors.push(`${at}.source must be OSM or OpenPOI`);
  if(typeof raw?.distanceMeters!=='number'||!Number.isFinite(raw.distanceMeters)||raw.distanceMeters<0)
   errors.push(`H-02: ${at}.distanceMeters must be a measured non-negative number`);
  if(raw?.walkMinutes!=null&&raw?.routeVerified!==true)
   errors.push(`H-03: ${at}.walkMinutes requires routeVerified=true (straight-line distance is never converted)`);
  if(raw?.addressPrecision!=null&&!PRECISIONS.has(raw.addressPrecision))
   errors.push(`${at}.addressPrecision must be full, street or area`);
 });
 const main=clean(input.mainSubjectId)||null;
 if(locs.length){
  if(!main)errors.push('SELECT-01: mainSubjectId is required when LOCATION cards are printed');
  else if(clean(locs[0]?.sourceId)!==main)
   errors.push('SELECT-01: LOCATION 01 must be the same subject as the POEM (mainSubjectId)');
 }
 const ids=locs.map(l=>clean(l?.sourceId)).filter(Boolean);
 if(new Set(ids).size!==ids.length)errors.push('duplicate LOCATION sourceId');
 if(input.colorMode!=null&&input.colorMode!=='color'&&input.colorMode!=='mono')errors.push('colorMode must be color or mono');
 if(input.outputMode!=null&&input.outputMode!=='ConsumerPDF')
  errors.push('outputMode: only ConsumerPDF is implemented (PDF/X and CMYK are not)');
 if(!errors.length&&locs.length){
  const geo=positionGeometry(build(input,true));
  if(!geo.ok&&geo.reason==='distance_mismatch')
   warnings.push('H-02: coordinates disagree with printed distances; the position diagram is omitted '+JSON.stringify(geo.mismatches));
 }
 return {ok:!errors.length,errors,warnings};
}

function build(input,skipValidation=false){
 if(!skipValidation){
  const v=validate(input);
  if(!v.ok){const e=new Error('Invalid PresentationData: '+v.errors.join(' / '));e.validation=v;throw e}
 }
 const data={
  schemaVersion:SCHEMA,
  generationToken:clean(input.generationToken),
  place:Object.freeze({label:clean(input.place.label),en:clean(input.place.en)||null,
   lat:coord(input.place.lat,90),lon:coord(input.place.lon,180)}),
  property:Object.freeze({name:clean(input.property.name),serial:clean(input.property.serial)||'001'}),
  poem:Object.freeze({headline:clean(input.poem.headline),body:clean(input.poem.body)}),
  mainSubjectId:clean(input.mainSubjectId)||null,
  locations:Object.freeze((input.locations||[]).map(normalizeLocation)),
  evidence:Object.freeze({mode:input.evidence.mode}),
  colorMode:input.colorMode==='mono'?'mono':'color',
  outputMode:'ConsumerPDF',
  paper:'A4'
 };
 return Object.freeze(data);
}

/* Integration adapter (not wired yet): maps the values index.html already holds
 * for one completed generation. Kept here so the eventual index.html diff only
 * collects values and never re-derives them. */
function fromAppSnapshot(s){
 return build({
  generationToken:s.generationToken,
  place:{label:s.place?.label,en:s.place?.en,lat:s.place?.lat,lon:s.place?.lon},
  property:{name:s.propertyName,serial:s.serial},
  poem:{headline:s.headline,body:s.body},
  mainSubjectId:s.mainEvidenceId,
  locations:(s.locationCards||[]).map(c=>({rank:c.rank,sourceId:c.sourceId,name:c.name,genreLabel:c.genreLabel,
   address:c.address,addressPrecision:c.addressPrecision,distanceMeters:c.distanceMeters,
   walkMinutes:c.walkMinutes,routeVerified:c.walkMinutes!=null&&c.routeVerified===true,
   headline:c.headline,body:c.body,source:c.source,retrievedAt:c.retrievedAt,lat:c.lat,lon:c.lon})),
  evidence:{mode:s.verified?'poi':'place_only'}
 });
}

/* Every string a template must print. Used by the node tests and the browser
 * verifier to prove nothing (body, note, credit) was dropped. */
function requiredStrings(data,credits){
 const out=[data.property.name,data.poem.headline,...data.poem.body.split('\n')];
 for(const l of data.locations){
  out.push(l.name,l.genreLabel,formatAddress(l),formatDistance(l),l.headline,l.body,formatSource(l));
  if(l.walkMinutes!=null)out.push(formatWalk(l));
 }
 out.push(...credits);
 return out.map(s=>s.trim()).filter(Boolean);
}

const api=Object.freeze({SCHEMA,SOURCES,validate,build,fromAppSnapshot,composeCredits,requiredStrings,
 formatAddress,formatDistance,formatWalk,formatSource,positionGeometry,POSITION_MAP_NOTE,SCHEMATIC_MAP_NOTE});
if(typeof module==='object'&&module.exports)module.exports=api;
root.PrintPresentationData=api;
})(typeof globalThis==='object'?globalThis:this);
