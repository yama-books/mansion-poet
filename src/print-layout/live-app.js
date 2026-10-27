/* PRINT03 live bridge: one immutable print snapshot; no map/API fetch. */
(function(root){'use strict';
const doc=root.document,PD=root.PrintPresentationData;
let snapshot=null,ticket=0;
const el=id=>doc.getElementById(id);
const panel=doc.createElement('section');panel.id='pl-live-panel';panel.className='pl-live-panel';panel.hidden=true;
const artPreviewHost=['localhost','127.0.0.1','raw.githack.com'].includes(root.location?.hostname||'');
panel.innerHTML='<div class="pl-live-tools"><strong>PRINT03 / A4広告</strong><label>画像 <select id="pl-live-media"><option value="svg">架空建築の線画（標準）</option>'+(artPreviewHost?'<option value="art">高解像度ART（試作・未承認）</option>':'')+'</select></label>'+(artPreviewHost?'<label>上下の焦点 <input id="pl-live-focus" type="range" min="0" max="100" step="10" value="50"></label>':'')+'<button id="pl-live-printbtn" type="button" disabled>この紙面を印刷 / PDF</button><button id="pl-live-close" type="button">閉じる</button></div><p id="pl-live-status" class="pl-live-status" role="status"></p><p class="pl-live-warning">これは架空の創作広告です。'+(artPreviewHost?'独立ARTは架空の情景で、本番利用の承認は受けていません。':'線画は実在の物件・施設の外観を示すものではありません。')+'</p><div class="pl-live-scroll"><div id="pl-live-stage" class="pl-stage"></div></div>';
const rootPrint=doc.createElement('div');rootPrint.id='pl-live-root';
doc.body.append(panel,rootPrint);
function clear(){
 snapshot=null;++ticket;root.PrintImage01Preview?.abort();
 panel.hidden=true;el('pl-live-stage').textContent='';
 el('pl-live-printbtn').disabled=true;doc.body.classList.remove('pl-live-print');rootPrint.textContent='';
 root.__APP003_PRINT_REPORT=null;
}
function capture(raw){
 clear();
 try{
  const cards=(raw.plan?.locationCards||[]).slice(0,3).map((c,i)=>{
   const p=(raw.pois||[]).find(x=>x.source===c.source&&
    ((c.sourceId&&x.sourceId===c.sourceId)||(x.name===c.name&&Math.round(x.distanceMeters)===c.distanceMeters)));
   const route=c.walkMinutes!=null&&p?.routeEvidence==='verified_foot'&&p?.entryPointVerified===true;
   return {...c,rank:i+1,sourceId:String(c.sourceId||'card:'+i+':'+c.source+':'+c.name),
    addressPrecision:!c.address?null:c.addressPrecision==='area'?'area':c.addressPrecision==='street'?'street':'full',
    walkMinutes:route?c.walkMinutes:null,routeVerified:route,
    lat:Number.isFinite(p?.lat)?p.lat:null,lon:Number.isFinite(p?.lon)?p.lon:null,
    retrievedAt:p?.retrievedAt||null};
  });
  const nearby=cards.length?root.PrintNeighborhood.curate(raw.pois||[],{
   subjectPolicy:root.SubjectPolicy,seed:raw.token,max:7,
   exclude:cards.map(x=>x.sourceId),excludeNames:cards.map(x=>x.name)}):[];
  snapshot=PD.fromAppSnapshot({generationToken:raw.token,place:raw.place,
   propertyName:raw.propertyName,headline:raw.headline,body:raw.body,
   mainEvidenceId:cards[0]?.sourceId||null,locationCards:cards,
   neighborhood:nearby,verified:cards.length>0});
 }catch(err){snapshot=null;console.warn('PRINT03 snapshot unavailable',err)}
 return Boolean(snapshot);
}
async function preview(){
 const current=snapshot;if(!current){el('generatedStatus').textContent='印刷用の情報を作れませんでした。再生成してください。';return}
 const mine=++ticket;
 root.PrintImage01Preview.abort();
 root.__APP003_PRINT_REPORT=null;
 root.__APP003_PRINT_DIAGNOSTICS=null;
 panel.hidden=false;
 const stage=el('pl-live-stage');stage.textContent='';
 el('pl-live-printbtn').disabled=true;el('pl-live-status').textContent='A4の紙面を準備中…';
 panel.scrollIntoView({block:'start',behavior:'instant'});
 try{
  await (doc.fonts?.ready||Promise.resolve());
  if(mine!==ticket||snapshot!==current)return;
  const r=await root.PrintImage01Preview.mount(stage,current,{expectedToken:current.generationToken,
   media:el('pl-live-media').value,assetScope:'app',mmHeight:84,
   focus:Number(el('pl-live-focus')?.value??50),sheet:'auto'});
  if(mine!==ticket||snapshot!==current)return;
  root.__APP003_PRINT_DIAGNOSTICS={token:current.generationToken,preflight:r.report,media:r.mediaUsed,
   viewport:root.innerWidth,ua:root.navigator?.userAgent||'',at:new Date().toISOString()};
  if(!r.report.ok)throw Error('A4 preflight failed '+JSON.stringify(r.report.failures));
  root.__APP003_PRINT_REPORT={token:current.generationToken,ok:true,pages:r.report.pageCount,
   mode:r.report.mode,media:r.mediaUsed};
  el('pl-live-status').textContent=r.report.pageCount===1?'A4片面1ページに収まりました。':
   'A4 '+r.report.pageCount+'ページ（情報を省略しない表裏構成）になります。';
  el('pl-live-printbtn').disabled=false;
 }catch(e){if(mine!==ticket)return;
  const report=root.__APP003_PRINT_DIAGNOSTICS?.token===current.generationToken?
   root.__APP003_PRINT_DIAGNOSTICS?.preflight:null;
  const failures=(report?.failures||[]).slice(0,3).map(f=>f.gate+'/'+f.kind).join('、');
  const message=failures||String(e?.message||e).slice(0,130);
  root.__APP003_PRINT_DIAGNOSTICS={...(root.__APP003_PRINT_DIAGNOSTICS||{}),
   token:current.generationToken,error:String(e?.stack||e),failures:report?.failures||[],
   viewport:root.innerWidth,ua:root.navigator?.userAgent||'',at:new Date().toISOString()};
  el('pl-live-status').textContent='A4組版を確認できませんでした（'+message+'）。焦点とは独立した問題です。';
  // Retain the diagnostic paper in place, but do not enable printing until preflight passes.
  el('pl-live-printbtn').disabled=true;
  console.warn('PRINT03 preview error',e,root.__APP003_PRINT_DIAGNOSTICS);
 }
}
el('pl-live-media').addEventListener('change',preview);
el('pl-live-focus')?.addEventListener('change',preview);
el('pl-live-close').addEventListener('click',()=>{panel.hidden=true;root.PrintImage01Preview.abort();++ticket});
el('pl-live-printbtn').addEventListener('click',()=>{
 if(!snapshot||el('pl-live-printbtn').disabled||root.__APP003_PRINT_REPORT?.token!==snapshot.generationToken)return;
 rootPrint.textContent='';
 const clone=el('pl-live-stage').cloneNode(true);clone.removeAttribute('id');rootPrint.appendChild(clone);
 delete doc.body.dataset.printLayout;doc.body.classList.add('pl-live-print');root.print();
});
root.addEventListener('afterprint',()=>{doc.body.classList.remove('pl-live-print');rootPrint.textContent=''});
doc.addEventListener('click',e=>{
 if(e.target.closest('#printBtn')?.id!=='printBtn'||el('printLayout')?.value!=='print03')return;
 e.preventDefault();e.stopImmediatePropagation();if(!el('printBtn').disabled)preview();
},true);
['density','smallPoiOptIn'].forEach(id=>el(id)?.addEventListener('input',clear,true));
doc.addEventListener('click',e=>{if(e.target.closest('[data-style]'))clear()},true);
root.PrintLive=Object.freeze({capture,clear,preview,hasSnapshot:()=>Boolean(snapshot)});
})(typeof globalThis==='object'?globalThis:this);
