import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const {buildLibrary,filterLibrary,optionsFor,labelTag}=require('../../src/reference-gallery/gallery-model.js');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'research/visual-reference-manifest.json'),'utf8'));
const library=buildLibrary(manifest);
test('all verified JPG-free reference PNGs load without bypassing unpublished ART gate',()=>{
 assert.equal(library.referenceCount,2);
 assert.equal(library.items.length,19);
 assert.equal(library.skipped,0);
 assert.equal(new Set(library.items.map(a=>a.id)).size,19);
 assert.ok(manifest.references.every(x=>x.publishedAllowed===false));
});
test('2 overview, six top compositions, and eleven lower/case crops',()=>{
 assert.equal(filterLibrary(library.items,{category:'overview'}).length,2);
 assert.equal(filterLibrary(library.items,{category:'top'}).length,6);
 assert.equal(filterLibrary(library.items,{category:'lower'}).length,11);
});
test('all local image paths are rooted in the known reference folder',()=>{
 for(const i of library.items) {
  assert.match(i.src,/^\.\.\/\.\.\/assets\/reference-images\/REF-[\w-]+\.png$/);
  assert.match(i.sourceSha,/^[a-f0-9]{64}$/);
  assert.ok(i.bytes>0 && i.width>0 && i.height>0);
 }
});
test('reference composition and art filters are exact',()=>{
 assert.equal(filterLibrary(library.items,{tag:'composition:facade_split'}).length,1);
 assert.equal(filterLibrary(library.items,{tag:'composition:ink_right'}).length,1);
 assert.equal(filterLibrary(library.items,{tag:'art:map_based'}).length,3);
});
test('searched Japanese synonyms match controlled labels',()=>{
 let r=filterLibrary(library.items,{query:'文教'});
 assert.ok(r.some(x=>x.id==='REF-0001-A_type_poem'));
 r=filterLibrary(library.items,{query:'水辺'});
 assert.ok(r.some(x=>x.id==='REF-0001-C_location'));
 r=filterLibrary(library.items,{query:'施設0件'});
 assert.equal(r.length,2);
});
test('query requires every term',()=>{
 const r=filterLibrary(library.items,{query:'文教 墨線'});
 assert.ok(r.some(x=>x.id==='REF-0001-A_type_poem'));
 assert.ok(r.every(x=>x.searchText.includes('文教')&&x.searchText.includes('墨線')));
});
test('ref and section filters compose',()=>{
 assert.equal(filterLibrary(library.items,{refId:'REF-0002',category:'top'}).length,3);
 assert.equal(filterLibrary(library.items,{refId:'REF-0001',category:'lower'}).length,6);
});
test('unknown option namespace returns empty and Japanese facet names are readable',()=>{
 assert.deepEqual(optionsFor(library.items,'script'),[]);
 assert.ok(optionsFor(library.items,'fit').some(x=>x.value==='fit:bookstore'&&x.label==='書店'));
 assert.equal(labelTag('case:0_locations'),'施設0件');
});
test('bad URL with traversal or remote source never becomes an image',()=>{
 for(const bad of ['https://example.com/evil.png','assets/../secrets.png','data:image/png;base64,x']){
  const clone=structuredClone(manifest);
  clone.files[0].plannedRepoPath=bad;
  const b=buildLibrary(clone);
  assert.equal(b.items.length,18);
  assert.equal(b.skipped,1);
 }
});
test('unverified, unavailable and duplicate media are excluded',()=>{
 const clone=structuredClone(manifest);
 clone.files[0].binaryStatus='local_package_only';
 clone.files[1].repoImageExists=false;
 clone.files.push(structuredClone(clone.files[2]));
 const b=buildLibrary(clone);
 assert.equal(b.items.length,17);
 assert.equal(b.skipped,3);
});
test('untrusted detail markdown paths do not become outbound links',()=>{
 const clone=structuredClone(manifest);
 clone.references[0].detailMdPath='https://host/evil';
 const b=buildLibrary(clone);
 assert.equal(b.items.length,9);
 assert.equal(b.skipped,10);
});
test('reference role display handles the longest and dense cases',()=>{
 const ids=library.items.map(x=>x.title);
 assert.ok(ids.some(x=>x.includes('長い施設名')));
 assert.ok(ids.some(x=>x.includes('情報量多め')));
});
test('schema version mismatch is a hard failure',()=>{
 assert.throws(()=>buildLibrary({...manifest,schemaVersion:'0.1'}),/unsupported/);
});
test('static HTML uses external same-origin assets and disclaimer',()=>{
 const html=fs.readFileSync(path.join(ROOT,'tools/reference-gallery/index.html'),'utf8');
 assert.match(html,/参考デザイン専用/);
 assert.match(html,/gallery\.css/);
 assert.match(html,/\.\.\/\.\.\/src\/reference-gallery\/gallery-model\.js/);
 assert.match(html,/name="viewport"/);
 assert.ok(!/<script[^>]*src=["']https?:\/\//i.test(html));
});

test('reference documentation links use manifest immutable verified commit, not an old hardcoded SHA',()=>{
 const one=library.items[0];
 assert.match(one.detailUrl,new RegExp('/blob/'+manifest.storage.verifiedCommitSha+'/'));
 const clone=structuredClone(manifest);
 clone.storage.verifiedCommitSha='invalid';
 const item=buildLibrary(clone).items[0];
 assert.equal(item.detailUrl,null);
});
