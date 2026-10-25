/* APP003 PRINT03-IMG-01: preview-only photo adapter.
 * Existing PRINT03 editorial remains the source of text, cards, credits, map,
 * pagination and SVG. This module never approves or publishes REF crops.
 */
(function(root){'use strict';
const RC=root.PrintRenderCore;
if(!RC)throw new Error('IMG01: load render-core and templates first');
const original=RC.templateInfo('editorial');
if(!original)throw new Error('IMG01: editorial unavailable');
const REF_URL='./ART-REF0003-library-refcrop.png';
const ART_URL='../../../assets/art-candidates/asset-art-01/ART-REF0003-PHOTO-01.png';
const ATTRIBUTION='参考画像から切り出した架空の情景イメージ（実在施設・物件の証拠ではありません）。本番ART未承認。';
const ART_ATTRIBUTION='AI生成の架空の図書空間（PR #43の独立ART候補・試作専用）。実在施設・物件の外観ではなく、本番使用未承認。';
let serial=0;
function annotate(block,caption){
 if(block.id!=='hero')return block;
 const v=block.node;
 return {...block,node:{...v,attrs:{...v.attrs,class:v.attrs.class+' pl-img01-photo'},
  children:[...v.children.slice(0,-1),RC.h('figcaption',{class:'pl-caption pl-img01-caption'},
   caption)]}};
}
function template(photo,media){
 const credit=media==='art'?ART_ATTRIBUTION:ATTRIBUTION;
 const caption=media==='art'?'独立ART（AI生成の架空情景・試作専用）／実在施設・物件ではありません':'参考写真（REF切り出し・試作専用）／実在物件・施設ではありません';
 RC.register({...original,creditOptions:photo?{illustration:false}:original.creditOptions,
  build(pd,credits,ctx){
   const extra=photo?[...credits,credit]:credits;
   const side=photo&&ctx.sideCredits?[...ctx.sideCredits,credit]:ctx.sideCredits;
   const output=original.build(pd,extra,{...ctx,sideCredits:side});
   return photo?{...output,blocks:output.blocks.map(block=>annotate(block,caption)),
    sides:output.sides?{...output.sides,front:output.sides.front.map(block=>annotate(block,caption))}:null}:output;
  }});
}
const checkImage=(url,view)=>new Promise(resolve=>{
 const im=new view.Image();
 im.onload=()=>resolve(im.naturalWidth>0&&im.naturalHeight>0?{width:im.naturalWidth,height:im.naturalHeight}:false);
 im.onerror=()=>resolve(false);
 im.src=url;
});
async function mount(container,data,opts={}){
 const ticket=++serial;
 const media=opts.media||'svg',token=opts.expectedToken??data.generationToken;
 const height=opts.mmHeight??84,focus=opts.focus??50;
 if(token!==data.generationToken)throw new Error('H-07: stale token');
 if(!['svg','photo','art','missing'].includes(media)||![72,84].includes(height)||
  !Number.isFinite(focus)||focus<0||focus>100)throw new Error('IMG01: invalid preview option');
 const view=opts.view||root;
 const source=media==='art'?{url:ART_URL,sourceKind:'generated_single_scene_art_preview_only',alt:'AI生成による架空の図書空間。実在する物件・施設ではありません'}:
  {url:REF_URL,sourceKind:'ref_crop_reference_only',alt:'参考画像からの架空の図書空間。実在する物件・施設ではありません'};
 const dimensions=media!=='svg'&&await checkImage(media==='missing'?'./__missing__.png':source.url,view);
 if(ticket!==serial)throw new Error('H-07: superseded preview');
 const photo=(media==='photo'||media==='art')&&Boolean(dimensions);
 template(photo,media);
 container.style.setProperty('--img01-height',height+'mm');
 container.style.setProperty('--img01-focus',focus+'%');
 const result=root.PrintPaginate.mount(container,'editorial',data,{expectedToken:token,sheet:opts.sheet||'auto'});
 const figure=container.querySelector('.pl-img01-photo');
 if(figure&&figure.ownerDocument){
  const image=figure.ownerDocument.createElement('img');
  image.className='pl-img01-preview-photo';
  image.alt=source.alt;
  image.src=source.url;
  image.onerror=()=>{
   image.remove();figure.classList.remove('pl-img01-photo');
   const caption=figure.querySelector('figcaption');
   if(caption)caption.textContent='画像取得失敗：架空建築の抽象線画に切替';
  };
  figure.insertBefore(image,figure.firstChild);
 }
 const box=figure?.getBoundingClientRect();
 // Background cover fills the available figure area minus the caption (8mm).
 const width=box?.width,photoHeight=box?box.height-8/25.4*96:null;
 const cover=photo&&width&&photoHeight?Math.max(width/dimensions.width,photoHeight/dimensions.height):null;
 return {...result,mediaRequested:media,mediaUsed:photo?(media==='art'?'independent_art':'reference_photo'):'existing_svg',
  fallback:media!=='svg'&&!photo,
  photoMetrics:{nativePixels:photo?[dimensions.width,dimensions.height]:null,sourceKind:photo?source.sourceKind:null,
   placementWidthMm:width?+(width*25.4/96).toFixed(1):null,
   photoHeightMm:photoHeight?+(photoHeight*25.4/96).toFixed(1):null,
   effectivePpiCover:cover?+(96/cover).toFixed(1):null,publishedAllowed:false}};
}
const api=Object.freeze({mount,REF_URL,ART_URL,ATTRIBUTION,ART_ATTRIBUTION,abort(){serial++}});
if(typeof module==='object'&&module.exports)module.exports=api;
root.PrintImage01Preview=api;
})(typeof globalThis==='object'?globalThis:this);
