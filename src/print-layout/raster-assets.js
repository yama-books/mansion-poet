/* PRINT03-IMG-02: approved raster assets. Layout and text remain HTML/CSS. */
(function(root){'use strict';
const RC=root.PrintRenderCore,original=RC?.templateInfo('editorial');
const URL_OK=/^\.\/assets\/print-approved\/[a-zA-Z0-9_/-]+\.(?:png|jpe?g|webp)$/i;
const ROLES=['original','print','preview','thumb'];
let assets=new Map(),serial=0;
function validate(asset){
 if(!asset||!/^[a-zA-Z0-9_-]{1,80}$/.test(asset.assetId||''))throw Error('IMG02: invalid assetId');
 if(asset.rightsStatus!=='approved'||asset.reviewStatus!=='approved')throw Error('IMG02: asset is not approved');
 for(const key of ['alt','caption','credit'])if(typeof asset[key]!=='string'||!asset[key].trim())throw Error('IMG02: missing '+key);
 const f=asset.focalPoint;
 if(!f||![f.x,f.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw Error('IMG02: invalid focalPoint');
 const renditions={};
 for(const role of ROLES){
  const r=asset.renditions?.[role];
  if(!r||!URL_OK.test(r.url)||![r.width,r.height].every(n=>Number.isInteger(n)&&n>0))throw Error('IMG02: invalid '+role+' rendition');
  renditions[role]=Object.freeze({url:r.url,width:r.width,height:r.height});
 }
 const p=renditions.print,o=renditions.original;
 if(p.width>o.width||p.height>o.height)throw Error('IMG02: upscaled print rendition');
 return Object.freeze({...asset,focalPoint:Object.freeze({...f}),renditions:Object.freeze(renditions)});
}
function replace(manifest){
 if(manifest?.schemaVersion!==1||!Array.isArray(manifest.assets))throw Error('IMG02: invalid manifest');
 const next=new Map();
 for(const raw of manifest.assets){const a=validate(raw);if(next.has(a.assetId))throw Error('IMG02: duplicate assetId');next.set(a.assetId,a)}
 assets=next; // atomic: invalid updates preserve the last valid catalogue
}
function list(){return [...assets.values()]}
function get(assetId){return assets.get(assetId)||null}
function preload(r,view,timeout=8000){
 return new Promise((resolve,reject)=>{
  const image=new view.Image();
  const timer=view.setTimeout(()=>reject(Error('IMG02: image timeout')),timeout);
  image.onload=()=>{view.clearTimeout(timer);
   if(image.naturalWidth!==r.width||image.naturalHeight!==r.height)return reject(Error('IMG02: actual dimensions differ from manifest'));
   resolve(image)};
  image.onerror=()=>{view.clearTimeout(timer);reject(Error('IMG02: image unavailable'))};
  image.src=r.url;
 });
}
function ppi(asset,widthMm,heightMm){
 const p=asset.renditions.print;
 return Math.min(p.width/(widthMm/25.4),p.height/(heightMm/25.4));
}
function hero(asset){
 return RC.h('figure',{class:'pl-ed-figure hero-frame pl-raster-hero','data-block':'hero','data-asset-id':asset.assetId},
  RC.h('picture',{},
   RC.h('source',{media:'print',srcset:asset.renditions.print.url}),
   RC.h('img',{src:asset.renditions.preview.url,alt:asset.alt,width:asset.renditions.preview.width,height:asset.renditions.preview.height,decoding:'sync'})),
  RC.h('figcaption',{class:'pl-caption pl-raster-caption'},asset.caption));
}
async function mount(container,data,opts={}){
 const mine=++serial,asset=get(opts.assetId),token=opts.expectedToken??data.generationToken;
 if(token!==data.generationToken)throw Error('H-07: stale raster token');
 if(!asset)throw Error('IMG02: unknown approved assetId');
 if(!original)throw Error('IMG02: editorial template unavailable');
 await Promise.all([preload(asset.renditions.print,opts.view||root),preload(asset.renditions.preview,opts.view||root)]);
 if(mine!==serial)throw Error('H-07: superseded raster mount');
 RC.register({...original,creditOptions:{illustration:false},build(pd,credits,ctx){
  const out=original.build(pd,[...credits,asset.credit],{...ctx,sideCredits:[...(ctx.sideCredits||credits),asset.credit]});
  const replaceHero=blocks=>blocks.map(b=>b.id==='hero'?{...b,node:hero(asset)}:b);
  return {...out,blocks:replaceHero(out.blocks),sides:out.sides?{...out.sides,front:replaceHero(out.sides.front)}:null};
 }});
 container.style.setProperty('--raster-focus-x',asset.focalPoint.x*100+'%');
 container.style.setProperty('--raster-focus-y',(opts.focus??asset.focalPoint.y*100)+'%');
 const result=root.PrintPaginate.mount(container,'editorial',data,{expectedToken:token,sheet:opts.sheet||'auto'});
 // Actual cover crop determines effective PPI; never infer it from file size.
 const frame=container.querySelector('.pl-raster-hero picture')?.getBoundingClientRect();
 const effectivePpi=frame?ppi(asset,frame.width*25.4/96,frame.height*25.4/96):0;
 if(effectivePpi<240)throw Error('IMG02: print cover below 240 PPI');
 if(!container.textContent.includes(asset.credit))throw Error('IMG02: missing raster credit');
 return {...result,assetId:asset.assetId,mediaUsed:'approved_raster',effectivePpi,photoMetrics:{publishedAllowed:true}};
}
const api=Object.freeze({replace,list,get,validate,ppi,mount,URL_OK,ROLES,abort(){serial++}});
if(typeof module==='object'&&module.exports)module.exports=api;
root.PrintRasterAssets=api;
})(typeof globalThis==='object'?globalThis:this);
