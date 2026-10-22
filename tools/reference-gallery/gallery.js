/* APP-003 REF-LIB-03: visual-only reference browsing. Never promotes REF to approved ART. */
(function(){
'use strict';
const Model=window.App003ReferenceGalleryModel;
const $=id=>document.getElementById(id);
const state={items:[],visible:[],index:-1,lastTrigger:null};
const namespaces=['template','art','fit','case'];
const grid=$('gallery'),dialog=$('viewer');
const clear=node=>node.replaceChildren();
function el(tag,className,text){
 const node=document.createElement(tag);
 if(className)node.className=className;
 if(text!=null)node.textContent=text;
 return node;
}
function plain(message){
 $('error').hidden=false;
 $('error').textContent=message;
 grid.setAttribute('aria-busy','false');
 $('result-count').textContent='読み込みに失敗しました';
}
function humanBytes(n){return n>=1048576?(n/1048576).toFixed(1)+' MB':Math.round(n/1024)+' KB';}
function labels(item){
 const keys=['template:','composition:','art:','fit:','case:','density:','sheet:'];
 return item.tags.filter(t=>keys.some(x=>t.startsWith(x))).slice(0,5);
}
function thumb(item){
 const image=el('img','thumbnail');
 image.src=item.src;
 image.alt=item.title+'の参考画像';
 image.width=item.width;image.height=item.height;
 image.loading='lazy';image.decoding='async';
 image.addEventListener('error',()=>{
  image.hidden=true;
  if(!image.parentNode.querySelector('.image-failed')){
   image.parentNode.append(el('p','image-failed','画像を表示できません。'));
  }
 },{once:true});
 return image;
}
function renderCard(item){
 const button=el('button','reference-card');
 button.type='button';button.setAttribute('aria-label',item.title+'を拡大する');
 const wrap=el('div','card-image');
 wrap.append(thumb(item));
 wrap.append(el('span','stamp','REFERENCE ONLY'));
 const body=el('div','card-body');
 body.append(el('h3','card-title',item.title));
 body.append(el('p','card-meta',item.width+' × '+item.height+'px · '+humanBytes(item.bytes)));
 const chips=el('div','chips');
 for(const tag of labels(item))chips.append(el('span','chip',Model.labelTag(tag)));
 body.append(chips);button.append(wrap,body);
 button.addEventListener('click',()=>openViewer(item,button));
 return button;
}
function filters(){
 const result=Model.filterLibrary(state.items,{
  query:$('search').value,refId:$('ref').value,category:$('category').value
 });
 const selected=namespaces.map(ns=>$(ns).value).filter(Boolean);
 return result.filter(item=>selected.every(x=>item.tags.includes(x)));
}
function render(){
 state.visible=filters();
 clear(grid);
 const fragment=document.createDocumentFragment();
 for(const item of state.visible)fragment.append(renderCard(item));
 grid.append(fragment);
 $('empty').hidden=state.visible.length!==0;
 $('result-count').textContent=state.visible.length+' / '+state.items.length+' 件の参考画像';
 grid.setAttribute('aria-busy','false');
}
function reset(){
 $('search').value='';$('ref').value='';$('category').value='';
 namespaces.forEach(ns=>$(ns).value='');
 render();$('search').focus();
}
function fillFacets(items){
 for(const ns of namespaces){
  const select=$(ns),options=Model.optionsFor(items,ns);
  for(const opt of options){
   const o=document.createElement('option');o.value=opt.value;o.textContent=opt.label;
   select.append(o);
  }
 }
}
function viewerItem(item){
 state.index=state.visible.findIndex(i=>i.id===item.id);
 $('viewer-title').textContent=item.title;
 $('viewer-dimensions').textContent=item.width+' × '+item.height+'px · '+humanBytes(item.bytes)+' · '+item.refId;
 const media=$('viewer-media');clear(media);
 const img=el('img','viewer-image');
 img.src=item.src;img.alt=item.title+'（拡大表示）';
 img.width=item.width;img.height=item.height;
 img.decoding='async';
 img.addEventListener('error',()=>{
  img.hidden=true;
  media.append(el('p','image-failed','画像を表示できません。ネットワークとファイルの配置を確認してください。'));
 },{once:true});
 media.append(img);
 const chips=$('viewer-tags');clear(chips);
 for(const t of item.tags)chips.append(el('span','chip',Model.labelTag(t)));
 $('viewer-doc').href=item.detailUrl;
 $('viewer-previous').disabled=state.index<=0;
 $('viewer-next').disabled=state.index>=state.visible.length-1;
 const scroll=dialog.querySelector('.viewer-scroll');
 scroll.scrollTop=0;
}
function openViewer(item,trigger){
 state.lastTrigger=trigger;
 viewerItem(item);
 if(typeof dialog.showModal==='function')dialog.showModal();
 else {dialog.setAttribute('open','');dialog.classList.add('dialog-fallback');}
 $('close-viewer').focus();
}
function closeViewer(){
 if(typeof dialog.close==='function')dialog.close();
 else {dialog.removeAttribute('open');dialog.classList.remove('dialog-fallback');}
}
function stepViewer(step){
 const idx=state.index+step;
 if(idx>=0&&idx<state.visible.length)viewerItem(state.visible[idx]);
}
function initEvents(){
 $('filters').addEventListener('input',event=>{if(event.target.id==='search')render();});
 $('filters').addEventListener('change',event=>{
  if(event.target.matches('select'))render();
 });
 $('reset').addEventListener('click',reset);
 $('empty-reset').addEventListener('click',reset);
 $('close-viewer').addEventListener('click',closeViewer);
 $('viewer-previous').addEventListener('click',()=>stepViewer(-1));
 $('viewer-next').addEventListener('click',()=>stepViewer(1));
 dialog.addEventListener('close',()=>{
  if(state.lastTrigger&&document.contains(state.lastTrigger))state.lastTrigger.focus();
 });
 dialog.addEventListener('click',event=>{
  if(event.target===dialog)closeViewer();
 });
 document.addEventListener('keydown',event=>{
  if(!dialog.open)return;
  if(event.key==='Escape'&&dialog.classList.contains('dialog-fallback'))closeViewer();
  if(event.key==='ArrowLeft'){event.preventDefault();stepViewer(-1);}
  if(event.key==='ArrowRight'){event.preventDefault();stepViewer(1);}
 });
}
async function load(){
 if(!Model){plain('表示モジュールが見つかりません。');return;}
 initEvents();
 try{
  const res=await fetch('../../research/visual-reference-manifest.json',{cache:'no-store'});
  if(!res.ok)throw new Error('HTTP '+res.status);
  const data=await res.json();
  const library=Model.buildLibrary(data);
  state.items=library.items;
  if(!state.items.length)throw new Error('登録済み画像がありません');
  fillFacets(state.items);
  render();
  if(library.skipped){
   $('error').hidden=false;
   $('error').textContent='検証に通らない参考画像 '+library.skipped+' 件を除外しました。';
  }
 }catch(err){
  plain('参考画像の一覧を読み込めませんでした。HTTPサーバー経由で開いているか確認してください。');
 }
}
load();
})();
