/* SAFE-01: side-effect-free eligibility and claim gates for creative advertising.
 * This module must not alter observed POI facts or be used to remove LIFE records.
 * Names alone never grant a protected, historic, religious or brand classification.
 */
(function(root){'use strict';
const norm=value=>String(value==null?'':value).normalize('NFKC').trim().toLowerCase().replace(/[\s-]+/g,'_');
const PROTECTED=new Set([
 'social_facility','social_welfare','social_services','welfare','welfare_support',
 'disability_support','victim_support','special_needs_school','special_support_school',
 'hospital','clinic','doctors','hospice','nursing_home','care_home','refugee_site',
 'shelter','assisted_living','group_home','rehabilitation','addiction_counselling',
 'mental_health','healthcare','healthcare_services'
]);
const PROTECTED_NAME=/特別支援学校|障害者支援施設|生活困窮者自立相談|被害者支援センター|難病相談支援/;
const RELIGIOUS_BUILDINGS=new Set(['shrine','temple','church','chapel','cathedral','mosque','synagogue','religious']);
const RELIGIOUS_TYPES=new Set(['shrine','temple','church','mosque','synagogue','chapel','cathedral']);
const FLAGGED=new Set(['source_theme_conflict','provider_type_conflict','unverified_name_classification']);
const FORBIDDEN_BASE=['residence_view_guarantee','public_access_guarantee','operating_hours_without_source','walk_minutes_without_route'];
const FORBIDDEN_BY_KIND={
 landscape:['residence_view_guarantee','absolute_safety'],
 education:['elite_school_claim','school_district_guarantee','admission_guarantee','student_attributes'],
 civic:['specific_service_guarantee'],
 postal:['collection_schedule_without_source','post_box_colour_without_source'],
 water:['ancient_river_history_without_source','public_access_guarantee'],
 religious:['doctrine_or_worshipper_satire','heritage_designation_without_independent_source','founding_date_without_independent_source','visitation_guarantee']
};
function result(p,eligibility,subjectId,safeAngles,reasons,extraForbidden=[]){
 const evidenceIds=Array.isArray(p?.evidenceSources)?
  p.evidenceSources.map(e=>e.sourceId).filter(Boolean):
  (p?.sourceId?[p.sourceId]:[]);
 const explicit=Boolean((p?.source==='OSM'&&p?.tags&&Object.keys(p.tags).some(k=>k!=='name'&&k!=='name:ja'))||
  (p?.providerBusinessType||p?.providerCategory));
 return {subjectId:subjectId||null,eligibility,safeAngles:[...new Set(safeAngles)],
  forbiddenClaims:[...new Set([...FORBIDDEN_BASE,...extraForbidden])],
  evidenceStrength:explicit?'verified_tag':'unverified',
  reasons,evidenceIds};
}
function decideSubject(p){
 if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||
    Math.abs(p.lat)>90||Math.abs(p.lon)>180||
    !['OpenPOI','OSM'].includes(p.source))
  return result(p,'needs_review',null,[],['invalid_geolocation_or_provenance']);
 const t=p.tags&&typeof p.tags==='object'?p.tags:{};
 const type=norm(p.providerBusinessType),category=norm(p.providerCategory);
 const amenity=norm(t.amenity),office=norm(t.office),government=norm(t.government);
 const keys=[type,category,amenity,office,government,norm(t.healthcare),
  norm(t.social_facility),norm(t['social_facility:for']),norm(t.education),
  norm(t['school:type'])];
 // Protection is stronger than a conflicting attractive theme or a name.
 if(keys.some(v=>PROTECTED.has(v))||t.social_facility||t['social_facility:for']||
   t.healthcare||norm(t['special_education'])==='yes'||
   norm(t['special_education'])==='true'||
   norm(t['school:type'])==='special'||
   PROTECTED_NAME.test(String(p.name||'')))
  return result(p,'suppress',null,[],['protected_care_support_or_education']);
 if(['welfare','health','healthcare','social_services','social_welfare',
     'victim_support','disability','counselling'].includes(government) ||
    ['social_welfare','welfare','counselling','social_services'].includes(office))
  return result(p,'suppress',null,[],['specialized_sensitive_public_service']);
 if(p.classificationConfidence==='low'||
    (p.classificationFlags||[]).some(f=>FLAGGED.has(f))||
    (p.validationFlags||[]).length)
  return result(p,'needs_review',null,[],['classification_or_location_conflict']);
 if(p.classificationConfidence&&p.classificationConfidence!=='high')
  return result(p,'needs_review',null,[],['name_only_or_unverified_classification']);
 const pick=(id,angle,kind='')=>result(p,'allow',id,[angle],
  ['structured_facility_type'],FORBIDDEN_BY_KIND[kind]||[]);
 const building=norm(t.building),tourism=norm(t.tourism);
 const religion=amenity==='place_of_worship'||RELIGIOUS_BUILDINGS.has(building)||
   (p.source==='OpenPOI'&&(RELIGIOUS_TYPES.has(type)||RELIGIOUS_TYPES.has(category)));
 if(religion){
  const hasArchitecture=RELIGIOUS_BUILDINGS.has(building)||
    (p.source==='OpenPOI'&&(RELIGIOUS_TYPES.has(type)||RELIGIOUS_TYPES.has(category)));
  if(!hasArchitecture)
   return result(p,'context_only','culture.religious_site',['neutral_presence'],
    ['worship_tag_without_building_evidence'],FORBIDDEN_BY_KIND.religious);
  const angles=['architecture','streetscape'];
  if(tourism==='attraction'||t.historic||t.heritage)angles.push('heritage_context');
  return result(p,'allow','culture.religious_architecture',angles,
   ['architecture_evidence'],FORBIDDEN_BY_KIND.religious);
 }
 // The private letter box is never the public post box, even if nearby.
 if(amenity==='letter_box'||type==='letter_box'||category==='letter_box')
  return result(p,'suppress','postal.private_letter_box',[],
   ['private_correspondence']);
 if(amenity==='post_box'||type==='post_box'||category==='post_box')
  return pick('postal.post_box','correspondence','postal');
 if(amenity==='post_office'||type==='post_office'||category==='post_office')
  return pick('postal.post_office','postal_services','postal');
 if(amenity==='parcel_locker'||type==='parcel_locker'||category==='parcel_locker')
  return pick('postal.parcel_locker','parcel_logistics','postal');
 if(amenity==='school'||norm(t.education)==='school'||type==='school'||category==='school')
  return pick('education.school','learning','education');
 if(['university','college'].includes(amenity)||['university','college'].includes(type)||
    ['university','college'].includes(category))
  return pick('education.higher_education','learning','education');
 if(amenity==='townhall'||type==='townhall'||category==='townhall')
  return pick('civic.townhall','public_administration','civic');
 if(office==='government'||type==='government_office'||category==='government_office')
  return pick('civic.government_office','public_administration','civic');
 if(norm(t.leisure)==='park'||type==='park'||category==='park')
  return pick('landscape.park','greenery','landscape');
 if(norm(t.leisure)==='garden'||type==='garden'||category==='garden')
  return pick('landscape.garden','greenery','landscape');
 if(tourism==='viewpoint')
  return pick('landscape.viewpoint','viewpoint','landscape');
 if(norm(t.tunnel)==='culvert'&&['ditch','drain','river','stream','canal'].includes(norm(t.waterway)))
  return pick('infrastructure.culvert','concealed_waterway','water');
 if(norm(t.tunnel)==='culvert'&&!t.waterway)
  return result(p,'needs_review',null,[],['culvert_without_waterway']);
 if(norm(t.waterway)==='ditch'||type==='ditch'||category==='ditch')
  return pick('infrastructure.ditch','drainage','water');
 if(norm(t.waterway)==='drain'||type==='drain'||category==='drain')
  return pick('infrastructure.drain','drainage','water');
 if(['river','stream','waterfall'].includes(norm(t.waterway)))
  return pick('landscape.watercourse','water_landscape','landscape');
 if(norm(t.natural)==='peak'||norm(t.natural)==='wood'||norm(t.natural)==='tree'||
   norm(t.natural)==='coastline')
  return pick('landscape.nature','natural_landscape','landscape');
 // Other *explicitly typed* existing facilities retain their generic safe
 // classification; unsupported OSM tags and name-only guesses do not.
 const existingType=Boolean(type||category)||(p.source==='OSM'&&
   Boolean(t.railway||t.tourism||t.historic||t.leisure||t.natural||t.waterway||
    t.amenity||t.shop||t.man_made||t.highway));
 if(p.classificationConfidence==='high'&&existingType)
  return result(p,'allow','general.'+(p.theme||'facility'),['observed_facility'],
   ['existing_structured_classification']);
 return result(p,'needs_review',null,[],['unsupported_or_unverified_type']);
}
const api=Object.freeze({decideSubject});
if(typeof module==='object'&&module.exports)module.exports=api;
root.SubjectPolicy=api;
})(typeof globalThis==='object'?globalThis:this);
