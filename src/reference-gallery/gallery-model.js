/* APP-003 REF-LIB-03: safe, dependency-free search model for reference-only assets.
 * No DOM/network access. Supports Node tests and browser use.
 */
(function(root){
'use strict';
const ID=/^REF-\d{4}-(?:overview|[A-Z][0-9]?_[a-z0-9_]+)$/;
const PATH=/^assets\/reference-images\/REF-\d{4}-(?:overview|[A-Z][0-9]?_[a-z0-9_]+)\.png$/;
const DOC=/^docs\/APP003_REFERENCE_IMAGE_ENTRIES\/REF-\d{4}\.md$/;
const ROLES=Object.freeze({
 overview:'コンセプト全体',A_type_poem:'上段・文字主役',B_editorial:'上段・高級誌面',
 C_location:'上段・ロケーション',D_lower_overview:'下段・ケース一覧',
 E1_front:'下段・表面',E2_back:'下段・裏面',E3_zero:'下段・施設0件',
 E4_kyoto:'下段・長い施設名',E5_dense:'下段・情報量多め'
});
const TAG_LABELS=Object.freeze({
 'template:type_poem':'文字主役','template:editorial':'高級誌面','template:location':'ロケーション','template:mixed':'複数版型',
 'art:ink_line':'墨線','art:watercolor':'水彩','art:photographic':'建築写真風','art:map_based':'地図を含む参考','art:mixed':'複合画風',
 'fit:bookstore':'書店','fit:knowledge':'文教','fit:culture':'文化','fit:history':'歴史','fit:river':'河川','fit:water':'水辺',
 'fit:park':'公園','fit:residential':'住宅街','fit:urban':'都市','fit:city_night':'夜景','fit:quiet_residential':'静かな住宅街',
 'fit:school':'学校','fit:small_facility':'都市小設備',
 'case:0_locations':'施設0件','case:3_locations':'施設3件','case:long_name':'長い施設名',
 'case:high_density':'施設多数','case:duplex':'表裏','case:map_present':'地図あり',
 'density:low':'情報少','density:high':'情報多','sheet:single':'1ページ','sheet:duplex':'表裏',
 'composition:ink_right':'右側の線画','composition:ink_lower_left':'左下の線画',
 'composition:dusk_overlay':'夕景と白文字','composition:facade_split':'外観の左右分割',
 'composition:river_sketch':'水辺と地図','composition:photo_strip':'写真3点と地図',
 'use:concept':'全体見本','use:print_front':'表面','use:print_back':'裏面',
 'mood:quiet':'静寂','mood:refined':'端正','mood:editorial':'雑誌的'
});
const ROLE_CATEGORY=role=>role==='overview'?'overview':/^[ABC]_/.test(role)?'top':'lower';
const str=v=>typeof v==='string'?v:'';
const lower=v=>str(v).normalize('NFKC').toLocaleLowerCase('ja');
const labelTag=tag=>TAG_LABELS[tag]||String(tag).replace(':',' / ');

function buildLibrary(manifest){
 if(!manifest||manifest.schemaVersion!=='app003.reference-library.v1'||
    !Array.isArray(manifest.references)||!Array.isArray(manifest.files)){
  throw new Error('REF-GALLERY: manifest format unsupported');
 }
 const docSha=/^[a-f0-9]{40}$/.test(str(manifest.storage?.verifiedCommitSha)) ? manifest.storage.verifiedCommitSha : null;
 const refs=new Map();
 for(const r of manifest.references){
  if(!/^REF-\d{4}$/.test(str(r.refId))||refs.has(r.refId)||!DOC.test(str(r.detailMdPath)))continue;
  refs.set(r.refId,r);
 }
 const seen=new Set(),items=[];let skipped=0;
 for(const f of manifest.files){
  const id=str(f.id),path=str(f.plannedRepoPath);
  const parent=id.slice(0,8),ref=refs.get(parent),role=str(f.role);
  const valid=ID.test(id)&&id===parent+'-'+role&&PATH.test(path)&&
   path==='assets/reference-images/'+id+'.png'&&ref&&
   f.binaryStatus==='uploaded_verified'&&f.repoImageExists===true&&
   Number.isInteger(f.width)&&Number.isInteger(f.height)&&f.width>0&&f.height>0&&
   Number.isInteger(f.bytes)&&f.bytes>0&&
   /^[a-f0-9]{64}$/.test(str(f.sha256))&&Array.isArray(f.tags)&&
   f.tags.every(t=>typeof t==='string'&&/^[a-z_]+:[a-z0-9_]+$/.test(t))&&
   Object.hasOwn(ROLES,role)&&!seen.has(id);
  if(!valid){skipped++;continue;}
  seen.add(id);
  const tags=[...new Set(f.tags)];
  const title=parent+' · '+ROLES[role];
  const searchable=[title,str(ref.title),id,role,...tags,...tags.map(labelTag)].map(lower).join(' ');
  items.push(Object.freeze({id,refId:parent,role,category:ROLE_CATEGORY(role),
   title,refTitle:str(ref.title),tags,src:'../../'+path,
   width:f.width,height:f.height,bytes:f.bytes,sourceSha:f.sha256,
   detailUrl:docSha?'https://github.com/yama-books/mansion-poet/blob/'+
    docSha+'/'+ref.detailMdPath:null,
   searchText:searchable}));
 }
 return Object.freeze({items,skipped,referenceCount:refs.size});
}
function filterLibrary(items,options={}){
 const q=lower(options.query).trim();
 const words=q.split(/\s+/).filter(Boolean);
 return items.filter(item=>{
  if(options.refId&&item.refId!==options.refId)return false;
  if(options.category&&item.category!==options.category)return false;
  if(options.tag&&(!item.tags.includes(options.tag)))return false;
  return words.every(word=>item.searchText.includes(word));
 });
}
function optionsFor(items,namespace){
 if(!/^(template|art|fit|case)$/.test(namespace))return [];
 const set=new Set();
 for(const item of items)for(const t of item.tags)if(t.startsWith(namespace+':'))set.add(t);
 return [...set].sort((a,b)=>labelTag(a).localeCompare(labelTag(b),'ja'))
  .map(value=>({value,label:labelTag(value)}));
}
const api=Object.freeze({buildLibrary,filterLibrary,optionsFor,labelTag,TAG_LABELS,ROLES});
if(typeof module==='object'&&module.exports)module.exports=api;
root.App003ReferenceGalleryModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
