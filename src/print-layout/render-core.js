/* PRINT03-CORE: template registry and a tiny node tree with two safe sinks.
 * Templates build plain objects; data strings only ever become text nodes.
 * toDOM uses createElement/textContent, toHTML escapes every text and attribute.
 */
(function(root){'use strict';
const PD=typeof module==='object'&&module.exports?require('./presentation-data.js'):root.PrintPresentationData;
const SVG_NS='http://www.w3.org/2000/svg';
const ATTR_OK=/^(?:[a-z][a-z0-9-]*|viewBox|preserveAspectRatio|stroke-[a-z]+|fill-[a-z]+)$/;
const ATTR_DENY=/^(?:on|href$|src$|xlink|style$|formaction$|srcdoc$)/i;

function h(tag,attrs,...children){
 const kids=[];
 const push=c=>{
  if(c==null||c===false)return;
  if(Array.isArray(c)){c.forEach(push);return}
  kids.push(typeof c==='object'?c:String(c));
 };
 push(children);
 return {tag,attrs:attrs||{},children:kids};
}
function checkAttr(name){
 if(!ATTR_OK.test(name)||ATTR_DENY.test(name))throw new Error('PRINT03: attribute not allowed: '+name);
}
const escText=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escAttr=s=>escText(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function toHTML(node){
 if(typeof node==='string')return escText(node);
 const attrs=Object.entries(node.attrs).filter(([,v])=>v!=null&&v!==false).map(([k,v])=>{checkAttr(k);return ` ${k}="${escAttr(v)}"`}).join('');
 return `<${node.tag}${attrs}>${node.children.map(toHTML).join('')}</${node.tag}>`;
}
function toDOM(node,doc,inSvg=false){
 if(typeof node==='string')return doc.createTextNode(node);
 const svg=inSvg||node.tag==='svg';
 const el=svg?doc.createElementNS(SVG_NS,node.tag):doc.createElement(node.tag);
 for(const [k,v] of Object.entries(node.attrs)){
  if(v==null||v===false)continue;
  checkAttr(k);el.setAttribute(k,String(v));
 }
 for(const c of node.children)el.appendChild(toDOM(c,doc,svg));
 return el;
}
/* Plain text of a tree, line-joined per element; used by node tests. */
function toText(node){
 if(typeof node==='string')return node;
 if(node.tag==='svg')return '';
 return node.children.map(toText).join(node.tag==='div'||node.tag==='p'?'\n':'');
}

const templates=new Map();
function register(def){
 if(!def||!/^[a-z_]+$/.test(def.id)||typeof def.build!=='function')throw new Error('PRINT03: bad template');
 templates.set(def.id,Object.freeze(def));
}
/* render(templateId,data,{expectedToken}) -> {templateId,data,credits,blocks,footer}
 * Each block: {id,required,splittable,shell:node,units:node[]|null,node}. A block
 * with units can be continued on the next page between whole units only.
 * sides: {front,back,credits,required} for the two-sided sheet (the back adds the
 * position diagram and its note). opts.sheet='duplex' always prints both sides. */
function render(templateId,data,opts={}){
 const def=templates.get(templateId);
 if(!def)throw new Error('PRINT03: unknown template '+templateId);
 const pd=data&&data.schemaVersion===PD.SCHEMA?data:PD.build(data);
 if(opts.expectedToken!==undefined&&opts.expectedToken!==pd.generationToken)
  throw new Error('H-07: stale generationToken; refusing to render an old location');
 const credits=PD.composeCredits(pd,def.creditOptions||{});
 const out=def.build(pd,credits,{h});
 return Object.freeze({templateId,label:def.label,status:def.status,data:pd,credits,
  blocks:out.blocks,sides:out.sides||null,// a requested back side is only printed when there is LOCATION data to put on it
  sheet:opts.sheet==='duplex'&&out.sides&&pd.locations.length?'duplex':'auto',footerText:out.footerText||'POÈME / ESTATE — 架空の物件を題材にした創作広告です。実在の物件・取引を案内しません。',
  required:PD.requiredStrings(pd,credits)});
}
function blockNode(block){
 if(!block.units)return block.node;
 return {...block.shell,children:[...block.shell.children,...block.units]};
}
function renderToHTML(templateId,data,opts){
 const r=render(templateId,data,opts);
 return r.blocks.map(b=>toHTML(blockNode(b))).join('');
}
const api=Object.freeze({h,toHTML,toDOM,toText,register,render,renderToHTML,blockNode,
 templateIds:()=>[...templates.keys()],templateInfo:id=>templates.get(id)});
if(typeof module==='object'&&module.exports)module.exports=api;
root.PrintRenderCore=api;
})(typeof globalThis==='object'?globalThis:this);
