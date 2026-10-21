// PRINT03-CORE: compare two run-browser-qa.mjs reports case by case.
// Usage: node compare-qa-reports.cjs BASE.json NEW.json [--replace RERUN.json]
// --replace substitutes NEW's rows with same-named rows from a single-fixture
// rerun (run-browser-qa.mjs --only ...). Exit 0 only when every case of BASE is
// present in NEW, passes, and matches on the compared fields.
const {resolve}=require('node:path');
const argv=process.argv.slice(2);
const ri=argv.indexOf('--replace');
const rerun=ri>=0?require(resolve(argv.splice(ri,2)[1])):null;
const [base,now]=argv.map(p=>require(resolve(p)));
if(rerun){const by=new Map(rerun.rows.map(r=>[r.case,r]));now.rows=now.rows.map(r=>by.get(r.case)||r)}
const sig=r=>JSON.stringify({ok:r.ok,
 dom:r.dom&&{pageCount:r.dom.pageCount,mode:r.dom.mode,level:r.dom.level,backLevel:r.dom.backLevel,minFontPt:r.dom.minFontPt,minCreativePt:r.dom.minCreativePt,
  tiles:r.dom.mapTiles&&{used:r.dom.mapTiles.used,tiles:r.dom.mapTiles.tiles,failed:r.dom.mapTiles.failed}},
 pdf:r.pdf&&{pageCount:r.pdf.pageCount,a4:r.pdf.a4,missing:r.pdf.missing.length,outside:r.pdf.outside.length},diagram:r.positionMap});
const A=new Map(base.rows.map(r=>[r.case,r])),B=new Map(now.rows.map(r=>[r.case,r]));
let same=0,bad=0;
for(const [k,o] of A){
 const r=B.get(k);
 if(!r){console.log('MISSING',k);bad++;continue}
 if(sig(o)===sig(r)&&r.ok)same++;else{bad++;console.log('DIFF',k,'\n  base',sig(o),'\n  new ',sig(r))}
}
for(const k of B.keys())if(!A.has(k))console.log('NEW',k);
const passed=now.rows.filter(r=>r.ok).length;
console.log(`base ${base.generatedAt} ${base.passed}/${base.total}; new ${now.generatedAt} ${passed}/${now.rows.length}${rerun?` (rerun ${rerun.generatedAt} replaced ${rerun.rows.length} rows)`:''}; identical ${same}/${A.size}`);
process.exitCode=bad?1:0;
