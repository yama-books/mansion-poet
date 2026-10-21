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
 // neighbourhood items were already checked for coordinate consistency in build()
 const neighbors=(data.neighborhood||[]).map(n=>({rank:n.rank,east:(n.lon-c.lon)*Math.cos(c.lat*Math.PI/180)*111320,
  north:(n.lat-c.lat)*110574,distance:n.distanceMeters,neighbor:true}));
 return {ok:true,points,neighbors,maxDistance:Math.max(...points.map(p=>p.distance)),
  maxDistanceAll:Math.max(...points.map(p=>p.distance),...neighbors.map(p=>p.distance))};
}
/* Neighbourhood (back-side list, user decision 2026-10-21): curated, name /
 * kind / straight-line distance only, never ad copy. Items whose coordinates do
 * not agree with their distance, or that repeat a LOCATION card, are dropped. */
function normalizeNeighborhood(input,locations,place){
 const raw=Array.isArray(input.neighborhood)?input.neighborhood.slice(0,12):[];
 const used=new Set(locations.map(l=>l.sourceId).filter(Boolean));
 const out=[],dropped=[];
 raw.forEach((n,i)=>{
  const item={rank:locations.length+out.length+1,sourceId:clean(n?.sourceId)||null,name:clean(n?.name),
   kindLabel:clean(n?.kindLabel)||'周辺施設',distanceMeters:typeof n?.distanceMeters==='number'?Math.round(n.distanceMeters):NaN,
   lat:coord(n?.lat,90),lon:coord(n?.lon,180),source:clean(n?.source),retrievedAt:clean(n?.retrievedAt).slice(0,10)||null,
   // selection tier is kept for notes/QA only; it is never printed
   tier:['allure','ordinary','plain','medical'].includes(n?.tier)?n.tier:null};
  const why=!item.name?'name':!SOURCES[item.source]?'source':!Number.isFinite(item.distanceMeters)||item.distanceMeters<0?'distance':
   item.lat==null||item.lon==null||place.lat==null||place.lon==null?'coordinates':
   item.sourceId&&used.has(item.sourceId)?'duplicate':
   Math.abs(haversine(place,item)-item.distanceMeters)>Math.max(DIST_TOLERANCE_M,item.distanceMeters*DIST_TOLERANCE_RATIO)?'distance_mismatch':null;
  if(why){dropped.push({index:i,reason:why});return}
  if(item.sourceId)used.add(item.sourceId);
  out.push(Object.freeze(item));
 });
 return {items:Object.freeze(out),dropped};
}
const POSITION_MAP_NOTE='位置関係図は選択地点と施設の座標から描いた参考図です。距離の円と線は直線距離を示し、道路・経路・徒歩時間・施設の敷地範囲を示すものではありません。地図データは使用していません。';
const SCHEMATIC_MAP_NOTE='位置図は概念図です。縮尺・方位・道路距離・徒歩時間を示すものではありません。';
// Used instead of POSITION_MAP_NOTE when GSI map tiles are actually printed under the diagram.
const POSITION_MAP_TILE_NOTE='位置関係図は国土地理院の地図に、選択地点と施設の座標から直線距離の円と線を重ねた参考図です。道路・経路・徒歩時間・施設の敷地範囲を示すものではありません。';
const MAP_TILE_CREDIT='地図：国土地理院「地理院タイル（淡色地図）」を加工して作成';
function positionNotes(mapTiles){return mapTiles?[POSITION_MAP_TILE_NOTE,MAP_TILE_CREDIT]:[POSITION_MAP_NOTE]}
const MEDICAL_NOTE='医療機関は名称と直線距離のみを掲載しています。診療科目・受診可否・診療時間は掲載していません。利用前に各機関へ確認してください。';
// Attribution lines (data and map sources); templates print them together at the end.
const isSourceCredit=line=>/^(施設データ|地図)：/.test(line);

/* Compose the credit / creative-note lines from what is actually printed.
 * Each line is required print content (H-06 checks it is not dropped). */
function composeCredits(data,{schematicMap=false,positionMap=false,illustration=true,mapTiles=false,includeNeighborhood=false}={}){
 const lines=['物件と広告文章は創作です。実際の販売・募集情報ではありません。'];
 if(illustration)lines.push('図版は架空建築の抽象線画です。実在の建物・計画を表すものではありません。');
 if(data.locations.length){
  lines.push('周辺施設名・直線距離は取得時点の公開データに基づく参考情報です。距離は選択地点からの直線距離で、徒歩所要時間ではありません。所在地・営業状況・施設への立入可否は保証しません。');
  if(includeNeighborhood&&data.neighborhood.length)
   lines.push('「周辺の施設」は取得できた公開データから選んだ一部で、地域のすべての施設や評価・おすすめ順を示すものではありません。');
  if(includeNeighborhood&&data.neighborhood.some(n=>n.tier==='medical'))
   lines.push(MEDICAL_NOTE);
  const bySource=new Map();
  for(const loc of [...data.locations,...(includeNeighborhood?data.neighborhood:[])]){
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
  if(geo.ok)lines.push(...positionNotes(mapTiles));
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
 if(input.neighborhood!=null&&!Array.isArray(input.neighborhood))errors.push('neighborhood must be an array');
 if(!errors.length&&locs.length){
  const built=build(input,true);
  const geo=positionGeometry(built);
  if(!geo.ok&&geo.reason==='distance_mismatch')
   warnings.push('H-02: coordinates disagree with printed distances; the position diagram is omitted '+JSON.stringify(geo.mismatches));
  if(built.neighborhoodDropped.length)
   warnings.push('neighborhood items dropped (not printed): '+JSON.stringify(built.neighborhoodDropped));
 }
 return {ok:!errors.length,errors,warnings};
}

function build(input,skipValidation=false){
 if(!skipValidation){
  const v=validate(input);
  if(!v.ok){const e=new Error('Invalid PresentationData: '+v.errors.join(' / '));e.validation=v;throw e}
 }
 const place=Object.freeze({label:clean(input.place.label),en:clean(input.place.en)||null,
  lat:coord(input.place.lat,90),lon:coord(input.place.lon,180)});
 const locations=Object.freeze((input.locations||[]).map(normalizeLocation));
 // neighbourhood only accompanies LOCATION cards (it is printed on their back side)
 const nb=locations.length?normalizeNeighborhood(input,locations,place):{items:Object.freeze([]),dropped:[]};
 const data={
  schemaVersion:SCHEMA,
  generationToken:clean(input.generationToken),
  place,
  property:Object.freeze({name:clean(input.property.name),serial:clean(input.property.serial)||'001'}),
  poem:Object.freeze({headline:clean(input.poem.headline),body:clean(input.poem.body)}),
  mainSubjectId:clean(input.mainSubjectId)||null,
  locations,
  neighborhood:nb.items,
  neighborhoodDropped:Object.freeze(nb.dropped),
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
  // already curated with PrintNeighborhood.curate(pois,{subjectPolicy,exclude:card ids})
  neighborhood:s.neighborhood||[],
  evidence:{mode:s.verified?'poi':'place_only'}
 });
}
const formatNeighbor=n=>[pad2(n.rank),n.kindLabel,n.name,'直線 約'+n.distanceMeters+'m'];
function pad2(n){return String(n).padStart(2,'0')}

/* Every string a template must print. Used by the node tests and the browser
 * verifier to prove nothing (body, note, credit) was dropped. */
function requiredStrings(data,credits,{neighborhood=false}={}){
 const out=[data.property.name,data.poem.headline,...data.poem.body.split('\n')];
 for(const l of data.locations){
  out.push(l.name,l.genreLabel,formatAddress(l),formatDistance(l),l.headline,l.body,formatSource(l));
  if(l.walkMinutes!=null)out.push(formatWalk(l));
 }
 if(neighborhood)for(const n of data.neighborhood)out.push(formatNeighbor(n).slice(1).join(''));
 out.push(...credits);
 return out.map(s=>s.trim()).filter(Boolean);
}

const api=Object.freeze({SCHEMA,SOURCES,validate,build,fromAppSnapshot,composeCredits,requiredStrings,
 formatAddress,formatDistance,formatWalk,formatSource,formatNeighbor,positionGeometry,positionNotes,isSourceCredit,
 POSITION_MAP_NOTE,POSITION_MAP_TILE_NOTE,MAP_TILE_CREDIT,SCHEMATIC_MAP_NOTE,MEDICAL_NOTE});
if(typeof module==='object'&&module.exports)module.exports=api;
root.PrintPresentationData=api;
})(typeof globalThis==='object'?globalThis:this);
