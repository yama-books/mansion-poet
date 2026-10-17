# POEM-SUBJECT-01｜施設・自然地物の採用／表現許可ポリシー

- 設計日：2026-10-17（JST）
- APP-ID：APP-003 / POÈME / ESTATE
- 状態：**採用候補の判定仕様。既存公開生成器へのコード反映・自動テストは未実施。**
- 目的：普通の広告で高く評価される景観も、側溝・暗渠・ポストのような「小さすぎる街の設備」も積極的に詠む。一方、信仰者・障害のある人・医療や福祉の利用者などの尊厳を広告パロディの対象にしない。
- 接続先：[GENERATION_ENGINE](GENERATION_ENGINE.md) / [LIFE-00](LIFE00_DATA_CONTRACT.md) / [LIFE-01](LIFE01_IMPLEMENTATION_20261017.md)。
- 最重要原則：**施設が何であるか（観測事実）／ポエムの主題に適するか（採用判定）／どの主張・比喩を許すか（表現許可）を別々に扱う。**

## 1. 採用方針（以前の一律除外の修正）

**宗教施設の一律除外は不採用**。神社・寺院・歴史的建築や観光対象となる教会・モスク・その他の礼拝施設は、歴史・建築・街並み・文化という非揶揄的文脈ならポエム候補として採用する。同じ建築・文化・観光の証拠には、宗教の種類に関係なく同じ基準を適用する。宗教的教義・信仰者の人格・儀礼を茶化したり、その土地にいる人の信仰や宗派を推定したりしない。

**学校・行政機関も原則採用**。学校は「学び・教育機能」へ、区役所・市役所・一般行政窓口は「公共性・都市運営」へ。ただし学校の偏差値・名門性・学区の指定・生徒の個人情報・子どもの安全性・入学可能性を推定しない。行政の相談窓口等が個人の困難・疾病・障害・生活状況に特化する場合は下記の保護的な不採用規則を優先する。

**ポスト（郵便差出箱）も独立採用**。郵便局、宅配ロッカー、家庭の郵便受けと混同しない。一般自然景観（山・川・海・公園・樹木・展望地点等）も、ありふれた住宅広告の加点対象だからといって排除しない。

**保護的除外**：障害者支援施設、グループホーム、避難所・保護施設、依存症・医療・福祉相談窓口等、利用者に固有の事情や困難が結び付きやすい施設はポエム生成の対象から外す。評価していない・劣っているという意味ではない。地図データそのものの削除とも異なる。ポエム選定・本文・THE EVIDENCEの創作根拠へ名前が流入しないようにする。生活情報での客観的表示の是非は独立に検討し、現段階では生成には使わない。

## 2. 判定対象と出力

既存 `normalizePOIs` の正規化レコードのほか、将来の自然地物・設備レコードに対し、次のポエム専用派生情報を付ける。元データの出典・分類・座標は書き換えない。

~~~ts
type SubjectDecision = {
  subjectId: string | null;                 // taxonomy例: civic.post_box
  eligibility: 'allow' | 'context_only' | 'suppress' | 'needs_review';
  safeAngles: string[];                     // 例: architecture, landscape, learning, correspondence
  forbiddenClaims: string[];                // 例: historic_without_source, admission_guarantee
  evidenceStrength: 'verified_tag' | 'corroborated' | 'unverified';
  reasons: string[];                        // machine-readable reason codes
  evidenceIds: string[];                    // 出典とPOI IDに接続
};
~~~

- `allow`：裏付けのある施設種・地物を主題にし、許された角度に沿った文章候補を生成。
- `context_only`：発見した地物については中立的に扱えるが、広告パロディの主題や特徴の誇張には使わない（例：単なる礼拝施設のタグのみで歴史的名所と断定不可）。必要なら「建築として存在する」という根拠に留める。
- `suppress`：ポエムおよび創作根拠に施設名・位置・固有の利用者属性を出さない（福祉・医療・保護・明らかな支援特化施設など）。
- `needs_review`：カテゴリ衝突、名称依存、アクセス不明、名所性の出典不一致など。デフォルトでポエム主題に採用しない。人手レビュー・証拠の追加でのみ昇格する。

`allow` と `suppress` の二値にせず、創作の可否・安全な言い方・出典の強さを分離することがポイント。

## 3. 優先順位：必ずこの順序で判定する

1. **同定・地理整合性**：提供元の明示的なタグと座標・距離・出典を検証。低信頼分類、provider/source theme conflict、自治体矛盾はそのまま主題へ流さず `needs_review`。
2. **保護的除外**：`amenity=social_facility`、`social_facility=*`、`social_facility:for=*`、福祉・医療・保護施設として信頼できる明示分類、特別支援教育の明示属性・確認済み施設種、個人の困難に特化する行政相談機能 → 原則 `suppress`。ユーザーが選択した他の施設まで巻き添えにしない。一般の学校・一般行政窓口と区別する。
3. **カテゴリ別採用規則**：自然景観、都市設備、学校、郵便ポスト、行政窓口、宗教的建築・史跡等のホワイトリストへ。宗教の種類を評価軸にしない。
4. **許される着眼点**：実データで確認できた「何があるか」と、自由な詩的形容を分ける。歴史・文化財指定・眺望・自由な立入・営業時間・徒歩時間・入学資格は独立した証拠がなければ断定禁止。
5. **テーマ選定**：通常の景観と、広告では主役になりにくい都市設備の両方を候補にする。珍しさだけでスコアを最大にしない。各種別の出現頻度と直近5生成の重複を抑制。
6. **文章審査**：本文・見出し・THE EVIDENCE・コピー結果に抑制対象名が紛れ込んでいないことを検証。創作表現の誇張は許すが、信仰者・障害のある人・学生・利用者等の属性をオチにしない。

**強制規則**：ブランド名・施設名に好ましい語があっても、明示タグの保護的除外とカテゴリ矛盾を逆転させない。施設名・説明文から推測する分類のみでは `allow` に昇格しない。

## 4. 詳細な採用ゲート（OSM等）

| 素材 | 取得・同定の根拠候補 | 主題にしてよい着眼点 | 保留・禁止事項 |
| --- | --- | --- | --- |
| 公園・庭園 | `leisure=park`, `leisure=garden` | 緑、季節、空間の余白 | 公園の開放・安全性は保証しない |
| 川・滝・峰・展望台 | `waterway=river`, `waterway=stream`, `waterway=waterfall`, `natural=peak`, `tourism=viewpoint` | 水辺、地形、景観。viewpointがあるときのみ「眺望地点」 | 選択地点の住戸から見えるとは言わない |
| 神社・寺院 | `amenity=place_of_worship` と`building=shrine/temple`、名称、`historic=*`, `tourism=attraction`, `heritage=*`等 | 建築、境内の存在、歴史資料がある場合の歴史 | 教義・御利益・由緒・自由な立入・名所性を推定しない |
| 教会・礼拝建築全般 | `amenity=place_of_worship`, `building=church/chapel/cathedral/mosque/synagogue`等。歴史・観光の裏付けも参照 | 建築、造形、街並み。歴史・観光の属性に裏付けがあればその角度も使う | 信仰対象・宗派を諷刺しない。観光地とは限らない |
| 小中学校・高校 | `amenity=school`, `education=school`等、学校種と確認済み名称 | 学び、知、公共の教育機能 | 名門、教育水準、学区、児童生徒の属性・安全性の断定禁止 |
| 大学・専門学校 | `amenity=university`, `amenity=college`など | 研究・知の営み | 学力・入学・施設自由利用の保証禁止 |
| 区役所・市役所 | `amenity=townhall`、建物名・役所用途 | 行政機能、都市の運営、公共性 | 実際の窓口や取扱業務は別途確認 |
| 行政窓口 | `office=government` と `government=*`、明示された一般業務 | 手続き、届出、公共サービスの接点 | 福祉・医療・被害者支援等の特化窓口なら保護的除外 |
| 郵便ポスト | `amenity=post_box` | 手紙、投函、伝達、都市の通信 | 赤色・回収時間・取扱郵便は属性なしで断定しない |
| 郵便局 | `amenity=post_office` | 届ける、窓口、往来 | 個別サービス・営業時間の保証禁止 |
| 宅配ロッカー | `amenity=parcel_locker`等 | 受取り、受け渡し、物流 | 利用可能性・荷物受取り可否は不明 |
| 側溝・暗渠 | `waterway=ditch/drain`、`tunnel=culvert`＋水路等 | 流れ、都市の見えない機能、排水の美学 | 古河川・地下河川の歴史を推定しない |
| 支援施設・医療・保護機関 | `amenity=social_facility`、明示的な医療・福祉等のタグ | **ポエム主題には採用しない** | その利用者の事情を示唆・推定・戯画化しない |

**名所性の段階差**：
- `place_of_worship`だけなら「宗教施設がある」以上の観光・歴史属性は未確認。建築タグもなければ主題化を保留。
- 名称と建築様式・`building=*`の種別が明確なら「建築・景観」という一般的な角度で検討。
- `tourism=attraction`、`historic=*`、`heritage=*`等があれば文化・名所性の候補になる。ただしOSMは共同編集データなので、**国指定文化財／何世紀の創建／観光名所として有名**などの具体的な主張は独立の公式出典なしで書かない。
- 同じ基準を神社・寺院・教会・モスク・その他の礼拝建築に適用。特定宗教の優遇・低評価をランキングへ入れない。
- `access=private/no`などがある場合「訪れる・参拝できる・境内を歩ける」を出さない。施設データの登録と見学可能性は別。

### ポストとポスト周辺の階層

~~~text
postal
 ├── post_box            郵便差出箱（通称ポスト）
 ├── post_office         郵便局の窓口
 ├── parcel_locker       宅配ロッカー
 ├── post_depot          郵便の仕分け・配送拠点（一般利用施設とは言わない）
 └── letter_box          個人の郵便受け（主題から除外：プライバシー）
~~~

郵便ポストに `post_box:type`、`post_box:design`、`collection_times`、`colour` があれば細分化候補。ただし実情報の鮮度が怪しい時間・色は断定しない。各細分類の独立ポエム10着眼点は、確認済みの属性がそろうまで親カテゴリを使う。

## 5. 施設の種類と文章の表現強度を独立させる

同じ郵便ポストでも、5段階のポエム濃度は「対象施設の扱いを下品にする」設定ではない。強くするのはコピーの比喩・構文・修辞の密度。

| 素材 | 誇張してよいもの | 誇張してはいけないもの |
| --- | --- | --- |
| 学校 | 「知の営み」「明日へ受け継ぐ」 | 「名門」「子の将来を約束する」「校区内」 |
| 役所 | 「都市の意思」「暮らしを整える仕組み」 | 「行政サービスが最高」「すべての手続きが可能」 |
| ポスト | 「便りが未来へ旅立つ」「街の静かな通信網」 | 「毎日必ず回収」「赤い」※根拠なし |
| 神社・寺院 | 「祈りの場のある街」「建築の輪郭」「風景」 | 「御利益保証」「信者への皮肉」「名所断定」 |
| 教会等 | 「建築の佇まい」「意匠」「街並み」 | 「奇跡の地」「特定宗教への揶揄」「誰でも内部見学可」 |
| 川・山・公園 | 「緑と地形」「季節」「景観」 | 「住戸から一望」「絶対静か」「必ず安全」 |
| 側溝・暗渠 | 「見えない流れ」「都市の仕組み」 | 「古代から続く水脈」※出典なし |

たとえば「役所」の風景を詠むことと、「生活困窮者相談窓口」を笑いの対象にすることは異なる。前者は認め、後者は採用しない。宗教も「建築文化への敬意」と「信仰への揶揄」を分ける。

## 6. 組合せ・選択ロジック

- **一般に価値があるものも、変わったものも対象**。自然景観を意図的に弱く評価しない。
- `eligibility=allow` の候補から、①事実検証の強さ、②地点固有性、③文体適合、④特徴の多様性、⑤近さ、⑥連続再生成での重複を別に評価する。面白さだけで決めない。
- 自動テーマは「主題1＋補助1〜2」。例：`郵便ポスト × 図書館 × 川`、`側溝 × 公園`、`神社の建築 × 役所`。
- 文体が変わっても元の証拠は変えない。ジャンル別ポエム10着眼点（説明・比喩・文化・高級広告・ユーモア等）は後続の `POEM-TAXONOMY` 辞書へ。英語等のブランド名は構造化 `brand` 属性か確認済みブランド辞書がある場合のみ階層昇格。
- 保護的除外と不確実性判定は**採点より前**に行い、生成後に危険そうな単語だけを置換する方式にしない。

## 7. 擬似コード（実装は別PR）

~~~js
function decideSubject(poi) {
  if (!hasValidLocationAndProvenance(poi)) return review('unreliable_source');
  if (hasTypeConflict(poi)) return review('conflicting_type');
  if (isProtectedCareSupportMedicalOrSpecialEducation(poi))
    return suppress('protected_user_context');
  if (isRestrictedGovernmentAssistanceOffice(poi))
    return suppress('sensitive_public_service');
  const subject = resolveByStructuredTags(poi); // source taxonomy, never name-only
  if (!subject) return review('unverified_category');
  if (subject.family === 'religious_architecture')
    return decideArchitectureAndHeritageAnglesWithoutInferringFaithOrAccess(poi);
  return allowOnlySupportedAngles(subject, poi);
}
function composeFromSubjects(items) {
  const decisions = items.map(decideSubject);
  const usable = decisions.filter(d => d.eligibility === 'allow');
  return composeWithEvidenceAndClaimGate(usable); // all claims check again here
}
~~~

保護的判定が偽陰性の場合も考え、`buildThemePlan`・`compose`・`render evidence`の三か所で、出典・名称・許容着眼点を監査する。将来の外部LLMを使う場合もこの判定を省略しない。第三者データにはモデルへの指示文が混入し得るため、名前・説明を命令として解釈しない。

## 8. 受入・回帰テスト表（**設計のみ・未実行**）

| Case | 入力例 | 期待 |
| --- | --- | --- |
| PS-01 | `leisure=park`の公園 | `allow`、緑を主題にできる |
| PS-02 | `tourism=viewpoint` | 展望地点を主題にできる。住戸眺望は不可 |
| PS-03 | `waterway=ditch` | 側溝の構文を許す |
| PS-04 | `tunnel=culvert`＋水路 | 暗渠構文。河川の歴史は推定不可 |
| PS-05 | 名前＋建築タグの神社・寺院 | 建築・風景の角度で採用可能 |
| PS-06 | `building=church`＋`historic=church` | 歴史建築の角度で採用可能 |
| PS-07 | `building=church`のみ | 名所・創建年代の断定をしない |
| PS-08 | `amenity=place_of_worship`のみ | 教義や建築・名所属性を推定せず保留 |
| PS-09 | `tourism=attraction`の礼拝建築（宗教種別違い） | 同じ証拠・同じ基準で採用 |
| PS-10 | `access=private`の宗教建築 | 「参拝可・見学可」を出さない |
| PS-11 | `amenity=school`の小学校 | 学びをテーマに採用、名門・学区断定なし |
| PS-12 | 特別支援教育を明示する施設 | `suppress`、生徒の属性に言及しない |
| PS-13 | `amenity=townhall`の市役所 | 公共性・都市機能の構文を採用 |
| PS-14 | `office=government`の一般行政窓口 | 公共サービスの接点として採用 |
| PS-15 | 福祉支援等を明示する行政窓口 | `suppress`、一般行政タグで上書き不可 |
| PS-16 | `amenity=post_box` | `postal.post_box`を採用、郵便局と区別 |
| PS-17 | `amenity=post_office` | `postal.post_office`を採用、投函箱とは区別 |
| PS-18 | `amenity=letter_box` | 私設受け箱を主題にしない |
| PS-19 | `amenity=social_facility` | `suppress`、ポエム・根拠タグへ漏らさない |
| PS-20 | `social_facility:for=disabled` | 支援対象属性を表示・創作へ使わない |
| PS-21 | 違う宗教の同等な歴史的建築 | 名所性の判定基準・許容着眼点が同じ |
| PS-22 | 店名「神社前カフェ」、業態cafe | 神社とは分類しない |
| PS-23 | 店名「福祉の森」が通常公園の正式名 | 名前だけで福祉施設とは断定しないが、表示表現は別途審査 |
| PS-24 | 学校・公園・ポストの混在 | 高信頼候補から複数テーマを生成 |
| PS-25 | 同地点に支援施設・公園・郵便ポスト | 支援施設だけ除外。公園とポストは維持 |
| PS-26 | 誤ったOSM歴史タグ／未確認年代 | 「文化財指定」「千年」等の具体事実を断定しない |
| PS-27 | `amenity=post_box`＋色タグなし | 「赤いポスト」と断定しない |
| PS-28 | 生成濃度100＋宗教・学校対象 | 人・信仰・児童生徒に対する嘲笑を増幅しない |

テストはモックだけでは完成扱いにしない。実POI取得、名称衝突、誤カテゴリ、ブラウザ表示、iPhoneのコピー結果、出典漏れを別途確認する。

## 9. 段階導入案

1. **PS-00（本書）**：採用条件・例外・禁止主張を確定。文書のみ。公開JSは変更しない。
2. **PS-01**：用途・地物 taxonomy と保護的判定の副作用なし関数。先行26+の回帰テストを実装。
3. **POEM-01**：自然・側溝・暗渠・ポスト・学校・役所・宗教建築・食と都市設備など代表12細分類のポエム10着眼点（120案）を人手評価。
4. **POEM-02**：ブランド認定・施設の多段分類・前回生成との差分管理・過剰断定防止。
5. **POEM-03**：正式に採用したカテゴリを公開したら、Pages CI→実ブラウザ→スマートフォン実機の順に確認。

OSMタグやOpenPOIのカテゴリは**APIがその業態を主張する証拠**であり、建物・施設の現況や営業状況を独立検証した事実ではない。

## 10. タグ参照資料

- https://wiki.openstreetmap.org/wiki/Tag:amenity=place_of_worship
- https://wiki.openstreetmap.org/wiki/Key:heritage
- https://wiki.openstreetmap.org/wiki/Tag:tourism=viewpoint
- https://wiki.openstreetmap.org/wiki/Tag:amenity=school
- https://wiki.openstreetmap.org/wiki/Tag:office=government
- https://wiki.openstreetmap.org/wiki/Tag:amenity=townhall
- https://wiki.openstreetmap.org/wiki/Tag:amenity=post_box
- https://wiki.openstreetmap.org/wiki/Tag:amenity=post_office
- https://wiki.openstreetmap.org/wiki/Tag:amenity=social_facility

タグ体系には地域差・歴史的経緯・登録の不足がある。最終的な許可判定にはソースデータ検証と人手レビューが必要。
