/* PRINT03-CORE: three A4 advertisement templates over the same PresentationData.
 * type_poem  : complete first prototype (text-led, no photo needed)
 * editorial  : skeleton (illustration-led, original line art until IMG-00 assets)
 * location   : skeleton (schematic position diagram + chief / supporting cards)
 * All artwork is original inline SVG; it carries no data strings.
 */
(function(root){'use strict';
const node=typeof module==='object'&&module.exports;
const PD=node?require('./presentation-data.js'):root.PrintPresentationData;
const RC=node?require('./render-core.js'):root.PrintRenderCore;
const {h}=RC;
const pad2=n=>String(n).padStart(2,'0');

function headlineLines(text,cls){
 return h('h1',{class:cls},text.split('\n').map(line=>h('span',{class:'pl-line'},line)));
}
function poemUnits(body){
 return body.split('\n').map(line=>line.trim()?h('p',{class:'pl-poem-line'},line):h('p',{class:'pl-poem-gap','aria-hidden':'true'}));
}
function locationCard(loc,variant){
 const over=h('div',{class:'pl-loc-over'},
  h('span',{class:'pl-loc-label'},'LOCATION '),h('span',{class:'pl-loc-rank'},pad2(loc.rank)),
  h('span',{class:'pl-loc-sep'},' / '),h('span',{class:'pl-loc-genre'},loc.genreLabel));
 if(variant==='brief'){
  // Front-side summary of a supporting card. The full card is printed on the back.
  return h('article',{class:'pl-loc pl-loc-brief','data-rank':loc.rank},over,
   h('h3',{class:'pl-loc-name'},loc.name),
   h('div',{class:'pl-loc-meta'},h('strong',{class:'pl-loc-dist'},PD.formatDistance(loc)),
    h('span',{class:'pl-loc-more'},'所在地・紹介文・出典は裏面')),
   h('h4',{class:'pl-loc-tag'},loc.headline));
 }
 return h('article',{class:'pl-loc pl-loc-'+variant,'data-rank':loc.rank},over,
  h('h3',{class:'pl-loc-name'},loc.name),
  h('div',{class:'pl-loc-meta'},
   h('span',{class:'pl-loc-addr'},PD.formatAddress(loc)),
   h('strong',{class:'pl-loc-dist'},PD.formatDistance(loc)),
   loc.walkMinutes!=null&&h('span',{class:'pl-loc-walk'},PD.formatWalk(loc))),
  h('h4',{class:'pl-loc-tag'},loc.headline),
  h('p',{class:'pl-loc-body'},loc.body),
  h('div',{class:'pl-loc-src'},PD.formatSource(loc)));
}
// credits[0] is always the creative-work note (H-01); it is never set as fine print.
function notesBlock(credits){
 return {id:'notes',required:true,splittable:true,
  shell:h('section',{class:'pl-notes','data-block':'notes'},h('div',{class:'pl-notes-head'},'NOTES / 注記')),
  units:credits.map((line,i)=>h('p',{class:i?'pl-note':'pl-note pl-creative'},line))};
}
/* Front / back sheet used when one A4 page cannot hold everything.
 * Front: the advertisement itself (chief card in full, supporting cards brief).
 * Back : LOCATION DATA with every supporting card in full, plus all notes.
 * Nothing is dropped: every required string is on one of the two sides. */
function withSides(blocks,data,credits,title){
 const front=blocks.filter(b=>b.id!=='locations'&&b.id!=='notes');
 const locs=data.locations;
 if(locs.length)front.push({id:'locations',required:true,splittable:true,
  shell:h('section',{class:'pl-locs','data-block':'locations'},
   h('div',{class:'pl-section-head'},h('span',{class:'pl-eyebrow'},'LOCATION'),h('span',{class:'pl-section-sub'},title))),
  units:locs.map((loc,i)=>locationCard(loc,i===0?'chief':'brief'))});
 front.push({id:'front-note',required:true,splittable:false,
  node:h('div',{class:'pl-front-note','data-block':'front-note'},
   h('p',{class:'pl-creative'},credits[0]),
   h('p',{class:'pl-creative'},locs.length>1?'裏面に周辺施設の所在地・紹介文・出典と注記を掲載しています。':'裏面に注記と出典を掲載しています。'))});
 const back=[{id:'back-head',required:true,splittable:false,
  node:h('header',{class:'pl-masthead pl-back-head','data-block':'back-head'},
   h('span',{class:'pl-brand'},'POÈME / ESTATE'),
   h('span',{class:'pl-mast-right'},'LOCATION DATA — '+data.property.name))}];
 // Back-side position diagram only when the coordinates agree with the printed distances.
 const geo=PD.positionGeometry(data);
 const backCredits=geo.ok&&!credits.includes(PD.POSITION_MAP_NOTE)?Object.freeze([...credits,PD.POSITION_MAP_NOTE]):credits;
 if(geo.ok)back.push(positionMapBlock(data,geo));
 if(locs.length>1)back.push({id:'locations-back',required:true,splittable:true,
  shell:h('section',{class:'pl-locs pl-locs-back','data-block':'locations-back'},
   h('div',{class:'pl-section-head'},h('span',{class:'pl-eyebrow'},'LOCATION DATA'),h('span',{class:'pl-section-sub'},'周辺施設の詳細（表面の補足）'))),
  units:locs.slice(1).map(loc=>locationCard(loc,'band'))});
 back.push(notesBlock(backCredits));
 return {front,back,credits:backCredits,required:PD.requiredStrings(data,backCredits),positionMap:geo.ok,positionMapReason:geo.ok?null:geo.reason};
}
function finalize(blocks,data,credits,title){
 const list=blocks.filter(Boolean);
 return {blocks:list,sides:withSides(list,data,credits,title)};
}
function locationsBlock(data,{title,variantOf}){
 if(!data.locations.length)return null;  // 0 cards: never print an empty slot
 return {id:'locations',required:true,splittable:true,
  shell:h('section',{class:'pl-locs','data-block':'locations'},
   h('div',{class:'pl-section-head'},h('span',{class:'pl-eyebrow'},'LOCATION'),h('span',{class:'pl-section-sub'},title))),
  units:data.locations.map((loc,i)=>locationCard(loc,variantOf(i)))};
}
function masthead(data,right){
 return {id:'masthead',required:true,splittable:false,
  node:h('header',{class:'pl-masthead','data-block':'masthead'},
   h('span',{class:'pl-brand'},'POÈME / ESTATE'),
   h('span',{class:'pl-mast-right'},'No. '+data.property.serial+' — '+right))};
}

/* --- original line art ------------------------------------------------- */
function artTypePoem(){
 const v=[];
 for(let i=0;i<9;i++)v.push(h('path',{d:`M${24+i*14} 40V232`,class:'pl-art-thin'}));
 return h('svg',{class:'pl-art pl-art-type',viewBox:'0 0 180 260','aria-hidden':'true',focusable:'false'},
  h('circle',{cx:'128',cy:'58',r:'30',class:'pl-art-sun'}),
  v,
  h('path',{d:'M14 232H166M14 236H166',class:'pl-art-rule'}),
  h('path',{d:'M38 232V132A52 52 0 0 1 142 132V232',class:'pl-art-line'}),
  h('path',{d:'M60 232V142A30 30 0 0 1 120 142V232',class:'pl-art-line'}));
}
function artEditorial(){
 const rows=[];
 for(let y=70;y<=250;y+=22)rows.push(h('path',{d:`M118 ${y}H482`,class:'pl-art-thin'}));
 const cols=[];
 for(let x=138;x<=462;x+=36)cols.push(h('path',{d:`M${x} 56V270`,class:'pl-art-thin'}));
 return h('svg',{class:'pl-art pl-art-editorial',viewBox:'0 0 600 300',preserveAspectRatio:'xMidYMid meet','aria-hidden':'true',focusable:'false'},
  h('path',{d:'M0 270H600',class:'pl-art-rule'}),
  h('path',{d:'M100 270V56L300 22 500 56V270',class:'pl-art-line'}),
  rows,cols,
  h('path',{d:'M270 270V214A30 30 0 0 1 330 214V270',class:'pl-art-line'}),
  h('circle',{cx:'540',cy:'60',r:'22',class:'pl-art-sun'}));
}
/* Position diagram drawn from coordinates: true north up, true scale, distance
 * rings and straight lines only. No roads, no routes, no map tiles. */
const NICE_RADII=[100,150,200,300,400,500,600,800,1000,1200,1500,2000];
function positionMapSvg(data,geo,{compact=false}={}){
 const C=120,P=compact?96:100;
 const R=NICE_RADII.find(r=>r>=geo.maxDistance*1.08)||Math.ceil(geo.maxDistance*1.1/500)*500;
 const k=P/R;
 const ring=r=>h('circle',{cx:C,cy:C,r:(r*k).toFixed(2),class:'pl-pm-ring'});
 const ringLabel=r=>{const a=-Math.PI/4,x=C+r*k*Math.cos(a)+2,y=C+r*k*Math.sin(a)-2;
  return h('text',{x:x.toFixed(1),y:y.toFixed(1),class:'pl-pm-ringlabel'},r+'m')};
 const pts=geo.points.map(p=>({...p,x:C+p.east*k,y:C-p.north*k}));
 const bar=R/2,barLen=bar*k;
 return h('svg',{class:'pl-art pl-posmap-svg',viewBox:'0 0 240 240','aria-hidden':'true',focusable:'false'},
  h('rect',{x:'0',y:'0',width:'240',height:'240',class:'pl-pm-ground'}),
  h('path',{d:`M${C} ${C-P-8}V${C+P+8}M${C-P-8} ${C}H${C+P+8}`,class:'pl-pm-axis'}),
  ring(R/4),ring(R/2),ring(R),
  ringLabel(R/2),ringLabel(R),
  pts.map(p=>h('path',{d:`M${C} ${C}L${p.x.toFixed(1)} ${p.y.toFixed(1)}`,class:p.rank===1?'pl-pm-ray pl-pm-ray-chief':'pl-pm-ray'})),
  h('circle',{cx:C,cy:C,r:'7',class:'pl-pm-site-halo'}),
  h('circle',{cx:C,cy:C,r:'3.2',class:'pl-pm-site'}),
  h('text',{x:C,y:C+15,'text-anchor':'middle',class:'pl-pm-sitelabel'},'選択地点'),
  pts.slice().reverse().map(p=>h('g',{class:'pl-pm-mark'},
   h('circle',{cx:p.x.toFixed(1),cy:p.y.toFixed(1),r:p.rank===1?'8.5':'6.8',class:p.rank===1?'pl-pm-chief':'pl-pm-sub'}),
   h('text',{x:p.x.toFixed(1),y:(p.y+2.9).toFixed(1),'text-anchor':'middle',class:p.rank===1?'pl-pm-num pl-pm-num-chief':'pl-pm-num'},pad2(p.rank)))),
  // north arrow
  h('g',{class:'pl-pm-north'},
   h('path',{d:'M222 10L227 24L222 21L217 24Z',class:'pl-pm-north-arrow'}),
   h('text',{x:'222',y:'34','text-anchor':'middle',class:'pl-pm-ringlabel'},'N')),
  // scale bar
  h('g',{class:'pl-pm-scale'},
   h('path',{d:`M10 228H${(10+barLen).toFixed(1)}M10 224V231M${(10+barLen).toFixed(1)} 224V231M${(10+barLen/2).toFixed(1)} 226V231`,class:'pl-pm-scalebar'}),
   h('text',{x:(10+barLen+4).toFixed(1),y:'231',class:'pl-pm-ringlabel'},bar+'m')));
}
function positionMapBlock(data,geo){
 return {id:'position-map',required:true,splittable:false,
  node:h('section',{class:'pl-posmap','data-block':'position-map'},
   h('div',{class:'pl-section-head'},h('span',{class:'pl-eyebrow'},'POSITION'),h('span',{class:'pl-section-sub'},'選択地点と周辺施設の位置関係')),
   h('div',{class:'pl-posmap-grid'},
    h('figure',{class:'pl-posmap-fig'},positionMapSvg(data,geo),
     h('figcaption',{class:'pl-caption'},'座標から作図・北が上・直線距離のみ（道路・経路は示しません）')),
    h('ol',{class:'pl-posmap-legend'},data.locations.map(loc=>
     h('li',{class:'pl-pm-item'+(loc.rank===1?' pl-pm-item-chief':'')},
      h('span',{class:'pl-pm-badge'},pad2(loc.rank)),
      h('span',{class:'pl-pm-text'},
       h('span',{class:'pl-pm-genre'},loc.genreLabel),
       h('span',{class:'pl-pm-name'},loc.name),
       h('span',{class:'pl-pm-dist'},PD.formatDistance(loc))))))))};
}
function artSchematic(data){
 const geo=PD.positionGeometry(data);
 if(geo.ok)return positionMapSvg(data,geo,{compact:true});
 const marks=data.locations.map((loc,i)=>{
  const a=(-90+i*125)*Math.PI/180;
  const r=22+64*Math.min(1,Math.sqrt(Math.max(0,loc.distanceMeters)/850));
  const x=(100+r*Math.cos(a)).toFixed(1),y=(100+r*Math.sin(a)).toFixed(1);
  return h('g',{class:'pl-map-mark'},
   h('circle',{cx:x,cy:y,r:i===0?'9':'7',class:i===0?'pl-map-chief':'pl-map-sub'}),
   h('text',{x,y:(+y+3.2).toFixed(1),'text-anchor':'middle',class:'pl-map-num'},pad2(loc.rank)));
 });
 return h('svg',{class:'pl-art pl-art-map',viewBox:'0 0 200 200','aria-hidden':'true',focusable:'false'},
  h('circle',{cx:'100',cy:'100',r:'86',class:'pl-art-thin'}),
  h('circle',{cx:'100',cy:'100',r:'54',class:'pl-art-thin'}),
  h('path',{d:'M100 8V192M8 100H192',class:'pl-art-thin'}),
  h('circle',{cx:'100',cy:'100',r:'4',class:'pl-map-center'}),
  marks);
}

/* --- (a) TYPE POEM: complete ------------------------------------------- */
RC.register({id:'type_poem',label:'TYPE POEM／文字主役型',status:'complete',
 creditOptions:{illustration:true},
 build(data,credits){
  const blocks=[
   masthead(data,'NON-EXISTENT ESTATE'),
   {id:'hero',required:true,splittable:false,
    node:h('section',{class:'pl-hero','data-block':'hero'},
     h('div',{class:'pl-hero-text'},
      h('div',{class:'pl-eyebrow'},'POÈME No. '+data.property.serial),
      headlineLines(data.poem.headline,'pl-headline'),
      h('div',{class:'pl-property'},data.property.name)),
     h('figure',{class:'pl-hero-art'},artTypePoem(),h('figcaption',{class:'pl-caption'},h('span',{class:'pl-line'},'ABSTRACT LINE'),h('span',{class:'pl-line'},'架空建築の線画'))))},
   {id:'poem',required:true,splittable:true,
    shell:h('section',{class:'pl-poem','data-block':'poem'}),units:poemUnits(data.poem.body)},
   locationsBlock(data,{title:'周辺の公開データより',variantOf:i=>i===0?'chief':'band'}),
   notesBlock(credits)
  ];
  return finalize(blocks,data,credits,'周辺の公開データより');
 }});

/* --- (b) EDITORIAL: skeleton ------------------------------------------- */
RC.register({id:'editorial',label:'EDITORIAL LUXE／高級誌面型',status:'skeleton',
 creditOptions:{illustration:true},
 build(data,credits){
  const blocks=[
   masthead(data,'EDITORIAL'),
   {id:'hero',required:true,splittable:false,
    node:h('figure',{class:'pl-ed-figure','data-block':'hero'},artEditorial(),
     h('figcaption',{class:'pl-caption'},'架空建築イメージ（抽象線画）— 実在の建物ではありません'))},
   {id:'title',required:true,splittable:false,
    node:h('section',{class:'pl-ed-title','data-block':'title'},
     headlineLines(data.poem.headline,'pl-headline pl-ed-headline'),
     h('div',{class:'pl-property'},data.property.name))},
   {id:'poem',required:true,splittable:true,
    shell:h('section',{class:'pl-poem pl-ed-poem','data-block':'poem'}),units:poemUnits(data.poem.body)},
   locationsBlock(data,{title:'THE NEIGHBOURHOOD',variantOf:i=>i===0?'chief':'col'}),
   notesBlock(credits)
  ];
  return finalize(blocks,data,credits,'THE NEIGHBOURHOOD');
 }});

/* --- (c) LOCATION EDITION: skeleton ------------------------------------ */
RC.register({id:'location',label:'LOCATION EDITION／ロケーション型',status:'skeleton',
 creditOptions:{illustration:false,schematicMap:true},
 build(data,credits){
  // Vertical setting only for short Japanese headlines; long Latin runs stay horizontal.
  const lines=data.poem.headline.split('\n');
  const vertical=lines.length<=3&&lines.every(l=>l.length<=14&&!/[\x21-\x7e]{6,}/.test(l));
  const side=h('div',{class:'pl-lo-side'+(vertical?' pl-vertical':'')},
   headlineLines(data.poem.headline,'pl-headline pl-lo-headline'));
  const top=data.locations.length?
   h('section',{class:'pl-lo-top','data-block':'diagram'},
    h('figure',{class:'pl-lo-map'},artSchematic(data),h('figcaption',{class:'pl-caption'},PD.positionGeometry(data).ok?'位置関係図（座標から作図・北が上・直線距離のみ）':'位置関係の模式図（縮尺・方位なし）')),side):
   h('section',{class:'pl-lo-top pl-lo-nomap','data-block':'diagram'},side);
  const blocks=[
   masthead(data,'LOCATION EDITION'),
   {id:'diagram',required:true,splittable:false,node:top},
   {id:'property',required:true,splittable:false,node:h('div',{class:'pl-property pl-lo-property','data-block':'property'},data.property.name)},
   {id:'poem',required:true,splittable:true,shell:h('section',{class:'pl-poem pl-lo-poem','data-block':'poem'}),units:poemUnits(data.poem.body)},
   locationsBlock(data,{title:'主役の施設と、街の補助線',variantOf:i=>i===0?'chief':'col'}),
   notesBlock(credits)
  ];
  return finalize(blocks,data,credits,'主役の施設と、街の補助線');
 }});

const api=Object.freeze({ids:['type_poem','editorial','location']});
if(node)module.exports=api;
root.PrintTemplates=api;
})(typeof globalThis==='object'?globalThis:this);
