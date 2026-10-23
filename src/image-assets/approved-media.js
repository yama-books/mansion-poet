/* APP-003 IMG-00: select rights-approved static images for app and print slots.
 * No I/O or DOM: consumers use the returned src only in a safe DOM property.
 * The existing inline SVG is preserved if no eligible asset exists.
 */
(function(root){
'use strict';
const SLOTS=new Set(['hero','residence','print_hero']);
const THEMES=new Set(['urban','heritage','nature','architecture','knowledge','water','night','quiet']);
const ID=/^[a-z0-9][a-z0-9-]{0,79}$/;
const FALLBACK=Object.freeze({kind:'existing_svg',reason:'no_eligible_asset'});
function isApproved(a,slot){
 return a&&typeof a==='object'&&ID.test(a.id||'')&&a.kind==='generated_illustration'&&
  a.rightsStatus==='approved'&&a.reviewStatus==='accepted'&&a.permissionToRedistribute===true&&
  a.imageShowsRealPOI===false&&typeof a.reviewer==='string'&&a.reviewer.trim()&&
  typeof a.caption==='string'&&a.caption.trim()&&Array.isArray(a.slots)&&a.slots.includes(slot)&&
  Array.isArray(a.themes)&&a.themes.every(t=>typeof t==='string')&&a.focalPoint&&
  Number.isFinite(a.focalPoint.x)&&Number.isFinite(a.focalPoint.y)&&
  a.focalPoint.x>=0&&a.focalPoint.x<=1&&a.focalPoint.y>=0&&a.focalPoint.y<=1;
}
function rendition(a,slot,placementMm,minPpi){
 const type=slot==='print_hero'?'print':'screen',obj=a.renditions?.[type];
 if(!obj||!Number.isInteger(obj.width)||!Number.isInteger(obj.height)||obj.width<1||obj.height<1)return null;
 const expected=type==='print'?'print/'+a.id+'-print.png':'web/'+a.id+'-screen.webp';
 if(obj.path!==expected)return null; // denies remote URLs, traversal, data: and ambiguous paths
 const ppi=placementMm?Math.min(obj.width*25.4/placementMm.width,obj.height*25.4/placementMm.height):null;
 if(placementMm&&(!Number.isFinite(ppi)||ppi<minPpi))return null;
 return {src:'assets/images/'+expected,width:obj.width,height:obj.height,ppi};
}
function hash(seed){
 let h=2166136261;
 for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619);
 return h>>>0;
}
function choose(manifest,{slot='residence',theme=null,seed='',placementMm=null,minPpi=300}={}){
 if(!SLOTS.has(slot))throw new Error('IMG-00: unsupported slot');
 if(theme!=null&&!THEMES.has(theme))throw new Error('IMG-00: unsupported theme');
 if(placementMm&&(!Number.isFinite(placementMm.width)||!Number.isFinite(placementMm.height)||placementMm.width<=0||placementMm.height<=0))throw new Error('IMG-00: invalid placement');
 if(!Number.isFinite(minPpi)||minPpi<=0)throw new Error('IMG-00: invalid minPpi');
 if(!manifest||manifest.schemaVersion!=='1.0'||!Array.isArray(manifest.assets))return FALLBACK;
 const eligible=manifest.assets.filter(a=>isApproved(a,slot)&&(!theme||a.themes.includes(theme)))
  .map(a=>({a,r:rendition(a,slot,placementMm,minPpi)})).filter(x=>x.r);
 if(!eligible.length)return FALLBACK;
 eligible.sort((x,y)=>x.a.id.localeCompare(y.a.id));
 const item=eligible[hash(String(seed)+'|'+slot+'|'+(theme||''))%eligible.length];
 const a=item.a,r=item.r;
 return Object.freeze({kind:'approved_asset',assetId:a.id,src:r.src,
  caption:a.caption,alt:'架空の建築または情景を表した創作イメージ',
  width:r.width,height:r.height,ppi:r.ppi,
  objectPosition:Math.round(a.focalPoint.x*100)+'% '+Math.round(a.focalPoint.y*100)+'%'});
}
const api=Object.freeze({choose,isApproved,FALLBACK});
if(typeof module==='object'&&module.exports)module.exports=api;
root.App003ApprovedMedia=api;
})(typeof globalThis==='object'?globalThis:this);
