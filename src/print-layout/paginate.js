/* PRINT03-CORE: measure-then-place A4 pagination and a print preflight.
 * Browser only. Text is never truncated. Order of attempts:
 *  1. one A4 page, fit levels 0..4 (spacing, 2-column cards, denser fine print);
 *  2. a front / back sheet (front = the ad, back = LOCATION DATA + notes), each
 *     side again tried at levels 0..4;
 *  3. last resort: whole blocks / whole units (poem lines, cards, note lines)
 *     continued over as many pages as needed.
 * Font floors: fine print (addresses, sources, notes) >= 6.5pt, chosen for an
 * ad-like density (user decision 2026-10-20); the creative-work note and the
 * running footer stay >= 8pt because they are the H-01 misrepresentation guard.
 */
(function(root){'use strict';
const RC=root.PrintRenderCore;
const LEVELS=[0,1,2,3,4];
const PT=96/72;
const FINE_MIN_PT=6.5,CREATIVE_MIN_PT=8;
const EPS=1.5;

function pageEl(doc,rendered,level,extra){
 const page=doc.createElement('section');
 page.className=`pl-page pl-tpl-${rendered.templateId} pl-fit-${level}`+(extra?' '+extra:'')+(rendered.data.colorMode==='mono'?' pl-mono':'');
 const body=doc.createElement('div');body.className='pl-page-body';
 const flow=doc.createElement('div');flow.className='pl-flow';body.appendChild(flow);
 const foot=doc.createElement('footer');foot.className='pl-running';
 const note=doc.createElement('span');note.className='pl-running-note pl-creative';note.textContent=rendered.footerText;
 // Measure with the widest plausible label so filling it in later cannot grow the footer.
 const num=doc.createElement('span');num.className='pl-running-num';num.textContent='裏面 88 / 88';
 foot.append(note,num);
 page.append(body,foot);
 return {page,body,flow,num};
}
const fits=p=>p.flow.getBoundingClientRect().height<=p.body.getBoundingClientRect().height+EPS;

function layoutSingle(container,rendered,blocks,level,extra){
 const doc=container.ownerDocument;
 const p=pageEl(doc,rendered,level,extra);
 container.appendChild(p.page);
 for(const b of blocks)p.flow.appendChild(RC.toDOM(RC.blockNode(b),doc));
 return {page:p,ok:fits(p)};
}
/* Try one side on a single page at increasing fit levels; keep the first fit. */
function fitSide(container,rendered,blocks,extra){
 for(const level of LEVELS){
  const r=layoutSingle(container,rendered,blocks,level,extra);
  if(r.ok)return {page:r.page,level};
  r.page.page.remove();
 }
 return null;
}
function layoutMulti(container,rendered,level){
 const doc=container.ownerDocument;
 const pages=[];const warnings=[];
 const newPage=()=>{const p=pageEl(doc,rendered,level,'pl-multi');container.appendChild(p.page);pages.push(p);return p};
 let cur=newPage();
 for(const b of rendered.blocks){
  if(!b.units){
   const el=RC.toDOM(b.node,doc);cur.flow.appendChild(el);
   if(!fits(cur)&&cur.flow.childElementCount>1){el.remove();cur=newPage();cur.flow.appendChild(el)}
   if(!fits(cur))warnings.push(`block ${b.id} is taller than one page body`);
   continue;
  }
  let shell=RC.toDOM(b.shell,doc);cur.flow.appendChild(shell);let placed=0;
  for(const u of b.units){
   const el=RC.toDOM(u,doc);shell.appendChild(el);
   if(fits(cur)){placed++;continue}
   el.remove();
   if(!placed&&cur.flow.childElementCount>1){shell.remove();cur=newPage();cur.flow.appendChild(shell)}
   else{cur=newPage();shell=RC.toDOM(b.shell,doc);shell.classList.add('pl-cont');cur.flow.appendChild(shell);placed=0}
   shell.appendChild(el);
   if(!fits(cur))warnings.push(`a unit of ${b.id} is taller than one page body`);
   placed++;
  }
  if(!placed&&shell.childElementCount===b.shell.children.length&&b.units.length)shell.remove();
  placed=0;
 }
 return {pages,ok:!warnings.length,warnings};
}

function paginate(container,rendered){
 container.textContent='';
 const one=rendered.sheet==='duplex'?null:fitSide(container,rendered,rendered.blocks,'');
 if(one)return finish([one.page],rendered,{level:one.level,mode:'single',warnings:[]});
 if(rendered.sides){
  const front=fitSide(container,rendered,rendered.sides.front,'pl-side-front');
  const back=front&&fitSide(container,rendered,rendered.sides.back,'pl-side-back');
  if(front&&back)return finish([front.page,back.page],rendered,{level:front.level,backLevel:back.level,mode:'duplex',warnings:[],
   sideLabels:['表面','裏面'],
   reason:rendered.sheet==='duplex'?'表裏指定のため、表面（広告）と裏面（位置関係図・周辺施設の詳細・注記）で構成しました。':
    'A4 1枚に収まらないため、表面（広告）と裏面（周辺施設の詳細・注記）の表裏構成にしました。本文は削っていません。'});
  container.textContent='';
 }
 const r=layoutMulti(container,rendered,2);
 return finish(r.pages,rendered,{level:2,mode:'multi',warnings:r.warnings,
  reason:'表裏2面でも収まらないため、本文を削らず複数ページへ続けました。'});
}
function finish(pages,rendered,info){
 pages.forEach((p,i)=>{p.num.textContent=(info.sideLabels?info.sideLabels[i]+' ':'')+`${i+1} / ${pages.length}`});
 return {templateId:rendered.templateId,pageCount:pages.length,...info};
}

/* Preflight on the laid-out DOM: missing text, overflow, overlap, font floors,
 * running creative note on every page, notes on the last page. */
const squash=s=>String(s).replace(/\s+/g,'');
function verify(container,rendered,layout){
 const failures=[];
 const pages=[...container.querySelectorAll('.pl-page')];
 const all=squash(pages.map(p=>p.textContent).join(''));
 const duplex=layout.mode==='duplex';
 const required=duplex?rendered.sides.required:rendered.required;
 const missing=required.filter(s=>!all.includes(squash(s)));
 if(missing.length)failures.push({gate:'H-06',kind:'missing_text',items:missing});
 let minFont=Infinity,minCreative=Infinity;
 pages.forEach((page,pi)=>{
  const body=page.querySelector('.pl-page-body').getBoundingClientRect();
  const pr=page.getBoundingClientRect();
  const flow=page.querySelector('.pl-flow').getBoundingClientRect();
  if(flow.bottom>body.bottom+EPS)failures.push({gate:'H-06',kind:'vertical_overflow',page:pi+1,by:+(flow.bottom-body.bottom).toFixed(1)});
  for(const el of page.querySelectorAll('*')){
   if(el.closest('svg'))continue;
   const r=el.getBoundingClientRect();
   if(!r.width&&!r.height)continue;
   const box=el.closest('.pl-page-body')?body:pr;
   if(r.left<box.left-EPS||r.right>box.right+EPS)failures.push({gate:'H-06',kind:'horizontal_overflow',page:pi+1,cls:el.className});
   if(el.scrollWidth>el.clientWidth+2&&getComputedStyle(el).overflowX!=='visible')failures.push({gate:'H-06',kind:'clipped_text',page:pi+1,cls:el.className});
   const hasText=[...el.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim());
   if(!hasText)continue;
   const px=parseFloat(getComputedStyle(el).fontSize);
   minFont=Math.min(minFont,px);
   if(el.closest('.pl-creative'))minCreative=Math.min(minCreative,px);
  }
  const blocks=[...page.querySelectorAll('.pl-flow > *')].map(b=>b.getBoundingClientRect());
  for(let i=1;i<blocks.length;i++)if(blocks[i].top<blocks[i-1].bottom-EPS)failures.push({gate:'H-06',kind:'overlap',page:pi+1,index:i});
  if(!squash(page.querySelector('.pl-running')?.textContent||'').includes(squash(rendered.footerText)))
   failures.push({gate:'H-01',kind:'creative_note_missing_on_page',page:pi+1});
 });
 if(minFont<FINE_MIN_PT*PT-0.05)failures.push({gate:'T',kind:'fine_print_below_floor',pt:+(minFont/PT).toFixed(2)});
 if(minCreative<CREATIVE_MIN_PT*PT-0.05)failures.push({gate:'H-01',kind:'creative_note_below_8pt',pt:+(minCreative/PT).toFixed(2)});
 const last=pages[pages.length-1];
 if(!last||!last.querySelector('.pl-notes'))failures.push({gate:'H-06',kind:'credits_not_on_last_page'});
 if(layout.mode==='duplex'&&!pages[0].querySelector('.pl-front-note'))failures.push({gate:'H-01',kind:'creative_note_missing_on_front'});
 return {ok:!failures.length,failures,pageCount:pages.length,level:layout.level,backLevel:layout.backLevel??null,mode:layout.mode,
  reason:layout.reason||null,warnings:layout.warnings,minFontPt:+(minFont/PT).toFixed(2),
  minCreativePt:Number.isFinite(minCreative)?+(minCreative/PT).toFixed(2):null,requiredChecked:required.length,
  requiredSet:duplex?'duplex':'single',positionMap:duplex?rendered.sides.positionMap:null,
  positionMapReason:duplex?rendered.sides.positionMapReason:null};
}

/* The latest mount per container. A location change starts a new mount
 * while an older one may still be waiting for tiles; the older one must never
 * lay out its (stale) sheet over the newer one (H-07). */
const latestMount=new WeakMap();
/* One call for the harness / future app: refuses stale tokens via render(). */
function mount(container,templateId,data,opts={}){
 const rendered=RC.render(templateId,data,opts);
 latestMount.set(container,rendered);
 const layout=paginate(container,rendered);
 return {rendered,layout,report:verify(container,rendered,layout)};
}
/* Map-enabled mount. Every GSI tile is preloaded first; only when all of them
 * load is the sheet laid out with the map. Any failure or timeout falls back to
 * the tile-free coordinate diagram, so the PDF never shows a partial map or a
 * map credit for a map that is not printed. */
function preload(urls,timeoutMs,doc){
 const view=doc.defaultView;
 return Promise.all(urls.map(url=>new Promise(resolve=>{
  const img=new view.Image();
  const t=view.setTimeout(()=>resolve(false),timeoutMs);
  img.onload=()=>{view.clearTimeout(t);resolve(img.naturalWidth>0)};
  img.onerror=()=>{view.clearTimeout(t);resolve(false)};
  img.src=url;
 })));
}
async function mountWithMap(container,templateId,data,opts={}){
 const want=RC.render(templateId,data,{...opts,mapTiles:'gsi-pale'});
 const ticket={};latestMount.set(container,ticket);
 const urls=RC.tileUrls(want);
 let used=false,failed=0;
 if(want.mapTiles&&urls.length&&!opts.simulateTileFailure){
  const ok=await preload(urls,opts.tileTimeoutMs||12000,container.ownerDocument);
  failed=ok.filter(x=>!x).length;
  used=failed===0;
 }else if(opts.simulateTileFailure)failed=urls.length;
 if(latestMount.get(container)!==ticket)
  throw new Error('H-07: superseded by a newer print mount; refusing to lay out an old location');
 const result=used?{rendered:want}:{rendered:RC.render(templateId,data,{...opts,mapTiles:false})};
 const layout=paginate(container,result.rendered);
 const report=verify(container,result.rendered,layout);
 report.mapTiles={requested:want.mapTiles,used,tiles:urls.length,failed};
 return {...result,layout,report};
}
root.PrintPaginate=Object.freeze({paginate,verify,mount,mountWithMap,FINE_MIN_PT,CREATIVE_MIN_PT});
})(typeof globalThis==='object'?globalThis:this);
