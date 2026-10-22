# APP-003｜参考デザインタグ語彙 v1.0

策定：2026-10-22 JST  
対象：REF（参考紙面）とRECIPE（構図）。**ART（本番素材）の使用許諾タグと混同しない。**

## 1. タグの構造

タグは`namespace:value`の形式。英小文字・数字・アンダースコアを使用し、自由入力を直接manifestへ混ぜない。初期の中心は**template / composition / art / fit / case**の5系列。検索品質を上げる補助としてuse / mood / density / sheetを設ける。

| 名前空間 | 許可する値（初期版） | 意味 |
|---|---|---|
| template | type_poem, editorial, location, mixed | 主要な紙面設計 |
| composition | ink_right, ink_lower_left, dusk_overlay, facade_split, river_sketch, photo_strip, concept_overview, front_back, long_name_adapt | 写真・見出し・地図の配置 |
| art | ink_line, watercolor, photographic, abstract_architecture, map_based, mixed | 図版の画風。実地図とイラストを混同しない |
| fit | knowledge, bookstore, school, culture, history, shrine_temple, river, water, park, greenery, urban, city_night, residential, quiet_residential, daily_service, small_facility, generic | 主題の相性であり、POIの実在保証ではない |
| case | 0_locations, 1_location, 3_locations, long_name, high_density, duplex, single_page, map_present, map_unavailable, monochrome | 出力データと版型の条件 |
| use | concept, print_front, print_back, layout_reference, art_direction, reference_only | 役割 |
| mood | quiet, editorial, refined, cinematic, warm, urban, knowledge, nostalgic | 情緒 |
| density | low, medium, high | 数字・カード・注記を含む情報密度 |
| sheet | single, duplex, flexible | 1面／表裏／可変 |

`composition`の短い値は文書中の構図ID（例：`editorial.facade_split`）と異なる。双方を保持し、`composition:facade_split` と `compositionId:editorial.facade_split` が矛盾しないよう検証する。構図IDの最初の名前は必ず`template`と一致する。

## 2. 施設ジャンルの推奨マッピング（決定ではなくデザイン候補）

「主役分類が承認済みで、データの分類と位置が確認できたとき」のみ候補タグへ変換する。見本画像を見て実在POI分類を上書きしない。

| 実際のPOI主題 | 推奨fit | 候補構図 | 注意 |
|---|---|---|---|
| 書店・図書館・読書文化 | bookstore, knowledge, culture | type_poem.ink_right, editorial.facade_split | 架空書棚の画像を実在書店の写真と説明しない |
| 学校・文教地域 | school, knowledge | type_poem.ink_lower_left, location.photo_strip | 学区・通学圏・児童の安全性を推定しない |
| 公園・緑道・一般植栽 | park, greenery | location.river_sketch, editorial.dusk_overlay | 季節画像を現地写真と誤称しない |
| 川・水辺 | water, river | location.river_sketch, location.photo_strip | 実際の河川の流れ・護岸・眺望を描いた保証ではない |
| 一般の街並み・住宅街 | residential, quiet_residential | type_poem.ink_right, editorial.facade_split | 架空の建築を選択地の実建物として扱わない |
| 歴史的な文化・観光建築 | history, culture, shrine_temple | type_poem.ink_lower_left, location.river_sketch | 実在の寺院・文化財の似姿を広告物件外観に転用しない |
| 都市施設・公共交通（情報が存在する場合） | urban, daily_service | location.photo_strip, editorial.dusk_overlay | 所要時間は検証経路を使ったときのみ |
| ポスト・暗渠・側溝・都市小設備 | small_facility, urban | type_poem.ink_right, type_poem.ink_lower_left | 設備画像を実物の証拠にしない。詩は大げさでも事実は慎重に |
| POIなし／地名のみ | generic, quiet_residential | type_poem.ink_lower_left, type_poem.ink_right | case:0_locations を必須にし、位置図・施設一覧を作り出さない |

複数POIがある場合も**SELECT-01で決定済みの主役1件**を最初のタグにする。補助施設からタグを追加してもよいが、主役より重く扱わない。宗教的支援施設、病院や相談窓口など、既存SubjectPolicyの保護対象・保留判断はタグによって解除できない。

## 3. 使い方と候補除外

絞り込みの順序：

1. デザインだけを検索するときは`refStatus=approved_reference`（またはcandidate）を対象にする。ただしこの状態だけで「本番利用可」としない。
2. 施設の種類・主役の確認済みジャンル・`case`・利用面`sheet`を照合。
3. 0件／長い名称／高密度など、必要データを収められない版型は除外する。
4. 同じ構図が複数ある場合はart/mood/paletteで差別化。候補が少ないときはユーザー固定選択を優先。
5. 実際の出力ではREFを画像として配置せず、`compositionId`からPRINT03等のレイアウトを組版する。必要な単独画像ARTがなければ既存SVGへ退避する。

### 仮の一致スコア（未実装）

```text
必須条件：安全・使用権・必要データ・印刷可読性に適合
候補スコア = 主役fit一致×4 + 用途template一致×3
             + case/sheet一致×3 + art/mood一致×2
同点：構図ID昇順 → generationToken を用いた安定seedで選択
```

これは初回の実装試験の足場で、ブランドの実際の品質基準や運用実績ではない。主役を選び直す機構、取得できない画像を公開する機構、何らかの法律適合を自動判定する機構ではない。

## 4. 登録前のバリデーション

- tagは上記語彙に含まれること。新語を追加する場合は本書を更新し、必要に応じて旧タグと同義語を記録。
- tag配列は重複なし、意味の衝突なし。`case:0_locations`と`case:3_locations`は同じrender成果の条件として同時には選ばない。ただしコンセプト**一覧シート**が複数ケースを含む場合は両方を記録してよい。
- `template:mixed`は複数広告を並べた一覧にのみ使用。個別の切出しにはtype_poem/editorial/locationを付与。
- `art:map_based`は**実際の地理院タイルで作った公式地図である証明ではない**。生成されたコンセプトシートの地図はダミーであり、`mapEvidence:false`と記録。
- `fit:school`は画像が学校の外観を保証する意味ではない。ジャンルの広告デザインとの相性だけ。
- `refStatus`と`binaryStatus`の組合せを検査する。`binaryStatus=local_package_only`ならGitHub生画像リンク・本番画像候補の自動取り込みを禁止。

## 5. 見本2枚へ初期設定するタグ

**REF-0001 全体**：`template:mixed`、`composition:concept_overview`、`art:mixed`、`mood:refined`、`mood:nostalgic`、`use:concept`、`density:high`、`case:duplex`、`case:long_name`、`case:0_locations`、`fit:bookstore`、`fit:water`、`fit:urban`。

**REF-0002 全体**：`template:mixed`、`composition:concept_overview`、`art:mixed`、`mood:editorial`、`mood:refined`、`use:concept`、`density:medium`、`case:duplex`、`case:long_name`、`case:0_locations`、`fit:residential`、`fit:knowledge`、`fit:culture`。

**上段個別**：A＝type_poem、B＝editorial、C＝location。REF-0001のAはink_right、Bはdusk_overlay、Cはriver_sketch。REF-0002のAはink_lower_left、Bはfacade_split、Cはphoto_strip。

**下段個別**：原画のE1〜E5（REF-0001）／E1〜E4（REF-0002）にはcaseの優先タグを付ける。上下段の位置関係は各REFのMDとmanifestを正本とする。

## 6. 変更管理

タグv1に含まれない主題は `fit:generic` を利用して監査前の自動分類を避ける。ジャンル増補は既存SubjectPolicy/POEM630/LOCATION117とは独立PRにする。新しいREF 10枚以上の追加時にタグの偏り、同一構図への集中、画像類似・重複を監査する。
