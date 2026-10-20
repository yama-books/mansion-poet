/* PRINT03-CORE: measure-then-place A4 pagination and a print preflight.
 * Browser only. Text is never truncated: the engine tries fit levels 0..3 on one
 * page (spacing, 2-column cards, smaller notes but never below 8pt) and otherwise
 * moves whole blocks / whole units (poem lines, cards, note lines) to new pages.
 */
(function(root){'use strict';
const RC=root.PrintRenderCore;
const LEVELS=[0,1,2,3];
const MIN_FONT_PX=8*96/72-0.05;   // 8pt
const EPS=1.5;

function pageEl(doc,rendered,level,multi){
 const page=doc.createElement('section');
 page.className=`pl-page pl-tpl-${rendered.templateId} pl-fit-${level}`+(multi?' pl-multi':'')+(rendered.data.colorMode==='mono'?' pl-mono':'');
 const body=doc.createElement('div');body.className='pl-page-body';
 const flow=doc.createElement('div');flow.className='pl-flow';body.appendChild(flow);
 const foot=doc.createElement('footer');foot.className='pl-running';
 const note=doc.createElement('span');note.className='pl-running-note';note.textContent=rendered.footerText;
 // Measure with the widest plausible number so filling it in later cannot grow the footer.
 const num=doc.createElement('span');num.className='pl-running-num';num.textContent='88 / 88';
 foot.append(note,num);
 page.append(body,foot);
 return {page,body,flow,num};
}
const fits=p=>p.flow.getBoundingClientRect().height<=p.body.getBoundingClientRect().height+EPS;

function layoutSingle(container,rendered,level){
 const doc=container.ownerDocument;
 const p=pageEl(doc,rendered,level,false);
 container.appendChild(p.page);
 for(const b of rendered.blocks)p.flow.appendChild(RC.toDOM(RC.blockNode(b),doc));
 return {pages:[p],ok:fits(p)};
}
function layoutMulti(container,rendered,level){
 const doc=container.ownerDocument;
 const pages=[];const warnings=[];
 const newPage=()=>{const p=pageEl(doc,rendered,level,true);container.appendChild(p.page);pages.push(p);return p};
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
 for(const level of LEVELS){
  const r=layoutSingle(container,rendered,level);
  if(r.ok)return finish(r.pages,rendered,{level,mode:'single',warnings:[]});
  container.textContent='';
 }
 const r=layoutMulti(container,rendered,1);
 return finish(r.pages,rendered,{level:1,mode:'multi',warnings:r.warnings,
  reason:'A4 1ページの調整（余白・2列化・注記8pt）でも収まらないため、本文を削らず複数ページへ移しました。'});
}
function finish(pages,rendered,info){
 pages.forEach((p,i)=>{p.num.textContent=`${i+1} / ${pages.length}`});
 return {templateId:rendered.templateId,pageCount:pages.length,...info};
}

/* Preflight on the laid-out DOM: missing text, overflow, overlap, font floor,
 * running creative note on every page, notes on the last page. */
const squash=s=>String(s).replace(/\s+/g,'');
function verify(container,rendered,layout){
 const failures=[];
 const pages=[...container.querySelectorAll('.pl-page')];
 const all=squash(pages.map(p=>p.textContent).join(''));
 const missing=rendered.required.filter(s=>!all.includes(squash(s)));
 if(missing.length)failures.push({gate:'H-06',kind:'missing_text',items:missing});
 let minFont=Infinity;
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
   if(hasText)minFont=Math.min(minFont,parseFloat(getComputedStyle(el).fontSize));
  }
  const blocks=[...page.querySelectorAll('.pl-flow > *')].map(b=>b.getBoundingClientRect());
  for(let i=1;i<blocks.length;i++)if(blocks[i].top<blocks[i-1].bottom-EPS)failures.push({gate:'H-06',kind:'overlap',page:pi+1,index:i});
  if(!squash(page.querySelector('.pl-running')?.textContent||'').includes(squash(rendered.footerText)))
   failures.push({gate:'H-01',kind:'creative_note_missing_on_page',page:pi+1});
 });
 if(minFont<MIN_FONT_PX)failures.push({gate:'T',kind:'font_below_8pt',px:minFont});
 const last=pages[pages.length-1];
 if(!last||!last.querySelector('.pl-notes'))failures.push({gate:'H-06',kind:'credits_not_on_last_page'});
 return {ok:!failures.length,failures,pageCount:pages.length,level:layout.level,mode:layout.mode,
  reason:layout.reason||null,warnings:layout.warnings,minFontPt:+(minFont*72/96).toFixed(2),requiredChecked:rendered.required.length};
}

/* One call for the harness / future app: refuses stale tokens via render(). */
function mount(container,templateId,data,opts={}){
 const rendered=RC.render(templateId,data,opts);
 const layout=paginate(container,rendered);
 return {rendered,layout,report:verify(container,rendered,layout)};
}
root.PrintPaginate=Object.freeze({paginate,verify,mount});
})(typeof globalThis==='object'?globalThis:this);
