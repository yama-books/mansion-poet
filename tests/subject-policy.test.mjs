import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {decideSubject}=require('../src/subject-policy.js');
const fixture=(tags={},extra={})=>({
 name:'検証用地物',source:'OSM',sourceId:'node/100',
 lat:35.7074,lon:139.6659,classificationConfidence:'high',
 tags,...extra
});
const choose=items=>items.filter(p=>decideSubject(p).eligibility==='allow');
const assess=(tags,extra)=>decideSubject(fixture(tags,extra));
const cases=[
 ['PS-01 公園', {leisure:'park'}, 'allow','landscape.park'],
 ['PS-02 展望地点', {tourism:'viewpoint'}, 'allow','landscape.viewpoint'],
 ['PS-03 側溝', {waterway:'ditch'}, 'allow','infrastructure.ditch'],
 ['PS-04 暗渠付き水路', {waterway:'drain',tunnel:'culvert'}, 'allow','infrastructure.culvert'],
 ['PS-05 神社建築', {amenity:'place_of_worship',building:'shrine'},'allow','culture.religious_architecture'],
 ['PS-06 歴史タグつき教会建築',{building:'church',historic:'church'},'allow','culture.religious_architecture'],
 ['PS-07 建築タグのみの教会',{building:'church'},'allow','culture.religious_architecture'],
 ['PS-08 礼拝タグのみ',{amenity:'place_of_worship'},'context_only','culture.religious_site'],
 ['PS-09 建築タグと観光属性の礼拝施設',{building:'mosque',tourism:'attraction'},'allow','culture.religious_architecture'],
 ['PS-10 非公開の礼拝建築',{building:'temple',access:'private'},'allow','culture.religious_architecture'],
 ['PS-11 一般学校',{amenity:'school'},'allow','education.school'],
 ['PS-12 特別支援属性の学校',{amenity:'school','school:type':'special'},'suppress',null],
 ['PS-13 市役所',{amenity:'townhall'},'allow','civic.townhall'],
 ['PS-14 一般行政窓口',{office:'government',government:'administration'},'allow','civic.government_office'],
 ['PS-15 福祉行政窓口',{office:'government',government:'welfare'},'suppress',null],
 ['PS-16 郵便差出箱',{amenity:'post_box'},'allow','postal.post_box'],
 ['PS-17 郵便局',{amenity:'post_office'},'allow','postal.post_office'],
 ['PS-18 個人の郵便受け',{amenity:'letter_box'},'suppress','postal.private_letter_box'],
 ['PS-19 福祉施設',{amenity:'social_facility'},'suppress',null],
 ['PS-20 支援属性明示',{amenity:'school','social_facility:for':'disabled'},'suppress',null]
];
for(const [label,tags,expected,id] of cases)test(label,()=>{
 const d=assess(tags);
 assert.equal(d.eligibility,expected);
 assert.equal(d.subjectId,id);
 assert.ok(Array.isArray(d.safeAngles)&&Array.isArray(d.forbiddenClaims));
 assert.deepEqual(d.evidenceIds,['node/100']);
});
test('PS-02 施設の展望地点は住戸の眺望を保証しない',()=>{
 assert.ok(assess({tourism:'viewpoint'}).forbiddenClaims.includes('residence_view_guarantee'));
});
test('PS-04 暗渠から古河川の由来は推定しない',()=>{
 assert.ok(assess({waterway:'stream',tunnel:'culvert'}).forbiddenClaims.includes('ancient_river_history_without_source'));
 assert.equal(assess({tunnel:'culvert'}).eligibility,'needs_review');
});
test('PS-07/26 建築と歴史タグだけで国指定文化財や創建年代を断定しない',()=>{
 const a=assess({building:'church',historic:'church'});
 assert.ok(a.safeAngles.includes('heritage_context'));
 assert.ok(a.forbiddenClaims.includes('heritage_designation_without_independent_source'));
 assert.ok(a.forbiddenClaims.includes('founding_date_without_independent_source'));
 const b=assess({building:'church'});
 assert.ok(!b.safeAngles.includes('heritage_context'));
});
test('PS-10 非公開でも架空の公開アクセスを生成しない',()=>{
 assert.ok(assess({building:'temple',access:'private'}).forbiddenClaims.includes('visitation_guarantee'));
});
test('PS-11/28 学校の入学・学区・児童について事実を作らない',()=>{
 const d=assess({amenity:'school'});
 for(const x of ['elite_school_claim','school_district_guarantee','admission_guarantee','student_attributes'])
  assert.ok(d.forbiddenClaims.includes(x),x);
});
test('PS-21 宗教の違いではなく建築・文化の証拠で等しく判断する',()=>{
 const a=assess({building:'church',historic:'yes'});
 const b=assess({building:'mosque',historic:'yes'});
 const c=assess({building:'shrine',historic:'yes'});
 assert.deepEqual([a.eligibility,a.safeAngles,a.forbiddenClaims],
  [b.eligibility,b.safeAngles,b.forbiddenClaims]);
 assert.deepEqual([b.eligibility,b.safeAngles,b.forbiddenClaims],
  [c.eligibility,c.safeAngles,c.forbiddenClaims]);
});
test('PS-22 施設名に神社が入ったカフェは神社に昇格させない',()=>{
 const d=assess({amenity:'cafe'},{name:'神社前カフェ',theme:'dining'});
 assert.equal(d.eligibility,'allow');
 assert.notEqual(d.subjectId,'culture.religious_architecture');
});
test('PS-23 公園の正式名に福祉が含まれても一律に除外しない',()=>{
 const d=assess({leisure:'park'},{name:'福祉の森'});
 assert.equal(d.eligibility,'allow');
 assert.equal(d.subjectId,'landscape.park');
});
test('PS-24 混在データで学校・公園・ポストを独立に選べる',()=>{
 const input=[fixture({amenity:'school'}),fixture({leisure:'park'}),fixture({amenity:'post_box'})];
 assert.equal(choose(input).length,3);
});
test('PS-25 同地点の支援施設だけを除外して公園とポストを残す',()=>{
 const input=[fixture({amenity:'social_facility'}),fixture({leisure:'park'}),fixture({amenity:'post_box'})];
 assert.deepEqual(choose(input).map(x=>x.tags.amenity||x.tags.leisure),['park','post_box']);
});
test('PS-27 赤色タグがないポストは色や回収時刻を断言しない',()=>{
 const d=assess({amenity:'post_box'});
 assert.ok(d.forbiddenClaims.includes('post_box_colour_without_source'));
 assert.ok(d.forbiddenClaims.includes('collection_schedule_without_source'));
});
test('PS-28 広告の濃度100でも学校・宗教への禁則は変わらない',()=>{
 for(const tags of [{amenity:'school'},{building:'church'}]){
  const low=decideSubject(fixture(tags,{intensity:0}));
  const high=decideSubject(fixture(tags,{intensity:100}));
  assert.deepEqual(low.forbiddenClaims,high.forbiddenClaims);
 }
 assert.ok(assess({building:'church'}).forbiddenClaims.includes('doctrine_or_worshipper_satire'));
});
test('SAFE-01 構造化された危険タグが魅力的な名前や業態より優先される',()=>{
 const p=fixture({amenity:'park','social_facility:for':'disabled'},{
  name:'美しい公園',theme:'green',providerCategory:'park'});
 assert.equal(decideSubject(p).eligibility,'suppress');
});
test('SAFE-01 名称推定・住所矛盾・無効座標は主役への昇格禁止',()=>{
 const base=fixture({},{name:'市立美術館',classificationConfidence:'medium'});
 assert.equal(decideSubject(base).eligibility,'needs_review');
 assert.equal(decideSubject(fixture({amenity:'school'},{validationFlags:['municipality_mismatch']})).eligibility,'needs_review');
 assert.equal(decideSubject(fixture({amenity:'post_box'},{lat:NaN})).eligibility,'needs_review');
});
test('SAFE-01 出典・原タグは変更せず、LIFE向けデータを削除しない',()=>{
 const p=fixture({amenity:'social_facility'});
 const before=JSON.stringify(p);
 const d=decideSubject(p);
 assert.equal(d.eligibility,'suppress');
 assert.equal(JSON.stringify(p),before);
});
