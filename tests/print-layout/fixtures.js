/* PRINT03-CORE fixtures. TEST DATA ONLY: facility names, addresses and
 * distances are invented for layout testing and are not real facility facts.
 * Place labels follow the QA set in AD_QUALITY_GATES §9 (神保町・中野・京都・
 * 住宅街・地方都市・POI0件・長名). */
(function(root){'use strict';
const loc=(rank,o)=>({rank,sourceId:'fixture/'+o.id,genreLabel:o.genre,name:o.name,address:o.address??null,
 addressPrecision:o.precision??(o.address?'full':null),distanceMeters:o.d,walkMinutes:o.walk??null,routeVerified:o.route??false,
 headline:o.headline,body:o.body,source:o.source||'OSM',retrievedAt:o.at||'2026-10-18',bearing:o.bearing??null});
// Test centres (rounded, generic) and invented facility positions placed at a
// bearing / distance that matches the printed straight-line distance.
const CENTRES={'神保町':[35.6959,139.7577],'中野':[35.7074,139.6659],'京都':[35.0130,135.7830],'地方都市（試験地）':[36.5613,136.6562]};
const place=(l,[lat,lon])=>{
 if(l.bearing==null){const {bearing,...rest}=l;return rest}
 const b=l.bearing*Math.PI/180,{bearing,...rest}=l;
 return {...rest,lat:+(lat+l.distanceMeters*Math.cos(b)/110574).toFixed(6),
  lon:+(lon+l.distanceMeters*Math.sin(b)/(111320*Math.cos(lat*Math.PI/180))).toFixed(6)};
};
const base=(id,o)=>{
 const c=o.noCoords?null:CENTRES[o.place];
 const locations=(o.locations||[]).map(l=>c?place(l,c):(({bearing,...rest})=>rest)(l));
 return {fixtureId:id,description:o.description,data:{
 generationToken:'gen-'+id+'-001',place:{label:o.place,en:o.en||null,...(c?{lat:c[0],lon:c[1]}:{})},
 property:{name:o.property,serial:o.serial||'001'},poem:{headline:o.headline,body:o.body},
 mainSubjectId:locations.length?locations[0].sourceId:null,
 locations,evidence:{mode:locations.length?'poi':(o.mode||'place_only')},
 colorMode:o.colorMode||'color'}}};

const jimboLocs=[
 loc(1,{id:'jb-1',bearing:35,genre:'書店',name:'すずらん古書館（試験データ）',address:'東京都千代田区神田神保町一丁目 試験番地',d:180,
  headline:'頁をめくる音が、街の通奏低音になる。',body:'背表紙の連なりが、そのまま街の書架になる。選ばれた一冊との出会いを、日々の散歩道に。'}),
 loc(2,{id:'jb-2',bearing:200,genre:'喫茶',name:'珈琲 栞（試験データ）',address:'神田神保町二丁目',precision:'area',d:260,source:'OpenPOI',
  headline:'一杯の珈琲に、読みかけの続きを。',body:'焙煎の香りとともに、頁の余白で一息つく。'}),
 loc(3,{id:'jb-3',bearing:290,genre:'公園',name:'錦華の小径広場（試験データ）',address:'猿楽町 試験通り',precision:'street',d:430,
  headline:'木陰は、都市の栞。',body:'石畳の先に、ベンチひとつ分の静けさ。'})];

const list=[
 base('F01_jimbocho_3',{description:'標準：神保町・LOCATION 3件',place:'神保町',en:'JIMBOCHO',property:'THE JIMBOCHO RESIDENCE',
  headline:'知の深奥に、\n邸の答えを。',
  body:'すずらん古書館（試験データ）など、近隣で確認された風景や施設。\n学びと知性の気配を宿す街。\n街の輪郭を、住まいの美学へ。\n選ばれた座標に、人生の新たな頁がひらかれる。',
  locations:jimboLocs}),
 base('F02_nakano_1',{description:'LOCATION 1件',place:'中野',en:'NAKANO',property:'THE NAKANO RESIDENCE',serial:'002',
  headline:'都市は、\nここから変わる。',
  body:'中野。都市は、この名を覚えている。\n日常の交差点から、次の物語が始まる。\nこの街から、これからの暮らしを。\nここに生まれる、存在しないランドマーク。',
  locations:[loc(1,{id:'nk-1',bearing:120,genre:'郵便差出箱',name:'差出箱 中野試験前（試験データ）',address:'中野区中野五丁目',precision:'area',d:95,
   headline:'投函口は、街がひらく最小の扉。',body:'赤い筐体が、手紙と都市をつなぐ。差出の一瞬に、暮らしの律動が宿る。'})]}),
 base('F03_kyoto_3_longnames',{description:'長い漢字名・長い英字・英数字混在',place:'京都',en:'KYOTO',property:'THE KYOTO RESIDENCE — HIGASHIYAMA·OKAZAKI·SHISHIGATANI PROMENADE EDITION',serial:'003',
  headline:'時の深層に、\n邸宅を刻む。',
  body:'京都という名が重ねてきた、かけがえのない時間。\n歳月が描いてきた街の輪郭。\n悠久の記憶を継承する、邸宅の最終到達点。\n選ばれた座標に、人生の新たな頁がひらかれる。',
  locations:[
   loc(1,{id:'ky-1',bearing:60,genre:'史跡',name:'東山岡崎疏水沿旧蹴上船溜跡附水路閣周辺歴史的景観保全地区試験標柱',address:'京都市左京区岡崎試験町',d:340,
    headline:'水路の記憶を、暮らしの誇りへ。',body:'石積みの水路が、時間の層をそっと見せる。'}),
   loc(2,{id:'ky-2',bearing:160,genre:'美術館',name:'Okazaki International Contemporary Kogei & Architecture Documentation Centre (Fixture)',address:'Okazaki 2-3-4 Fixture Bldg. B1F',d:510,source:'OpenPOI',
    headline:'工芸と建築の、静かな対話。',body:'English-and-日本語 mixed copy, 1234567890 numbers, and a verylongunbrokenlatinwordthatmustwrapsafelyinsidethecard.'}),
   loc(3,{id:'ky-3',bearing:300,genre:'寺院建築',name:'試験山 静観院',address:null,d:720,
    headline:'甍の稜線が、空を区切る。',body:'建築としての屋根の重なりを、遠景として眺める。'})]}),
 base('F04_residential_0',{description:'POI 0件（地名のみの創作）',place:'住宅街（試験地）',property:'THE RESIDENCE · 住宅街',serial:'004',
  headline:'余白を、\n住まう。',
  body:'住宅街の空気に、暮らしの輪郭を重ねる。\n何気ない風景のなかに、余白を見出す。\n心に残る、ひとつの場所。\n大切な時間のための、架空の私邸。'}),
 base('F05_address_100',{description:'住所100字以上・精度full/street/area混在',place:'地方都市（試験地）',property:'THE PROVINCIAL RESIDENCE',serial:'005',
  headline:'この街を、\n超えてゆく。',
  body:'地方都市。都市は、この名を覚えている。\n人々の営みが交差する都市の座標。\nこの街から、これからの暮らしを。',
  locations:[
   loc(1,{id:'ad-1',bearing:230,genre:'駅',name:'試験中央駅（試験データ）',
    address:'試験県試験市中央区本町一丁目二番三号から同市同区本町四丁目五番六号にかけての試験用連絡通路および駅前広場地下一階試験コンコース東改札口付近（公開データ上の記載をそのまま表示する検証用の長い住所です）',
    d:610,headline:'結節点に、未来の邸を。',body:'改札の流れが、街の脈拍を刻む。'}),
   loc(2,{id:'ad-2',bearing:20,genre:'図書館',name:'試験市立中央図書館（試験データ）',address:'本町通り',precision:'street',d:820,
    headline:'叡智という、新しい住所。',body:'閲覧室の灯りが、夜の街に知の窓をひらく。'})]}),
 base('F06_long_poem',{description:'長文POEM＋長文カード3件（複数ページへの安全な移行）',place:'神保町',en:'JIMBOCHO',property:'THE JIMBOCHO RESIDENCE',serial:'006',
  headline:'知の深奥に、\n邸の答えを。\nそして、\n頁の先へ。',
  body:Array.from({length:22},(_,i)=>`第${i+1}行　背表紙の連なりが街の書架となり、頁をめくる音が石畳に溶けてゆく。選ばれた座標に、人生の新たな頁がひらかれる。`).join('\n'),
  locations:jimboLocs.map(l=>({...l,body:l.body+'　'+'古書の匂い、紙の手ざわり、灯りの色。'.repeat(6)}))}),
 base('F10_dense_cards',{description:'通常POEM＋長い紹介文のカード3件（表裏構成の確認）',place:'神保町',en:'JIMBOCHO',property:'THE JIMBOCHO RESIDENCE',serial:'010',
  headline:'知の深奥に、\n邸の答えを。',
  body:'すずらん古書館（試験データ）など、近隣で確認された風景や施設。\n学びと知性の気配を宿す街。\n街の輪郭を、住まいの美学へ。\n選ばれた座標に、人生の新たな頁がひらかれる。',
  locations:jimboLocs.map(l=>({...l,body:l.body+'　'+'古書の匂い、紙の手ざわり、灯りの色。'.repeat(9)}))}),
 base('F07_xss',{description:'HTML注入文字列（テキストとして表示されること）',place:'試験地<script>',property:'THE <b>BOLD</b> RESIDENCE',serial:'007',
  headline:'<img src=x onerror=alert(1)>\n& "quotes" \'single\'',
  body:'<script>alert("x")</script>\n</p><p class="pl-note">偽の注記</p>',
  locations:[loc(1,{id:'x-1',genre:'<i>genre</i>',name:'<svg onload=alert(1)>試験',address:'"><a href="javascript:alert(1)">',d:10,
   headline:'<h1>x</h1>',body:'&amp; &lt; literal'})]}),
 base('F08_walk_verified',{description:'経路確認済みの徒歩表示（routeVerified=true の場合のみ）',place:'中野',en:'NAKANO',property:'THE NAKANO RESIDENCE',serial:'008',
  headline:'緑の余白に、\n永遠を住まう。',
  body:'都市のただ中に息づく、緑の余白。\n心に残る、ひとつの場所。',
  locations:[loc(1,{id:'wk-1',bearing:330,genre:'公園',name:'試験の森公園（試験データ）',address:'中野区試験町',d:400,walk:6,route:true,
   headline:'緑陰の先に、邸の哲学を。',body:'木々の間をぬける風が、季節の頁をめくる。'}),
   loc(2,{id:'wk-2',bearing:110,genre:'広場',name:'試験広場（試験データ）',address:'中野区試験町',precision:'area',d:650,
   headline:'ひらけた空を、日常に。',body:'経路未確認のため徒歩時間は表示しません。'})]}),
 base('F09_jimbocho_mono',{description:'白黒印刷（F01と同一データ・mono）',place:'神保町',en:'JIMBOCHO',property:'THE JIMBOCHO RESIDENCE',serial:'009',
  headline:'知の深奥に、\n邸の答えを。',
  body:'すずらん古書館（試験データ）など、近隣で確認された風景や施設。\n学びと知性の気配を宿す街。\n街の輪郭を、住まいの美学へ。\n選ばれた座標に、人生の新たな頁がひらかれる。',
  locations:jimboLocs,colorMode:'mono'})
];
const api=Object.freeze({list,byId:id=>list.find(f=>f.fixtureId===id)});
if(typeof module==='object'&&module.exports)module.exports=api;
root.PrintFixtures=api;
})(typeof globalThis==='object'?globalThis:this);
