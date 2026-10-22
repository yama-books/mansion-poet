# APP-003｜参考画像ライブラリ運用・登録仕様 v1.0

策定：2026-10-22 JST  
Work ID：APP-003 / REF-LIB-01  
正本：`yama-books/mansion-poet`  
状態：**参考画像2原画・17個の切り出しを会話内ZIPとして作成、GitHubには設計文書・登録メタデータのみ保存。GitHub上の画像実体のアップロードは未完了。**

関連： [タグ語彙](APP003_REFERENCE_IMAGE_TAGS_V1.md) ／ [REF-0001](APP003_REFERENCE_IMAGE_ENTRIES/REF-0001.md) ／ [REF-0002](APP003_REFERENCE_IMAGE_ENTRIES/REF-0002.md) ／ [参考画像manifest](../research/visual-reference-manifest.json) ／ [6構図の作図レシピ（PR #34）](https://github.com/yama-books/mansion-poet/pull/34) ／ [画像スロットPoC（PR #33）](https://github.com/yama-books/mansion-poet/pull/33)

## 1. 設計上の決定

「高品質な広告案を大量に作成して画像ごとにタグを付け、選択地点と施設テーマに応じて引き出す」という構想を採用する。ただし**参考画像そのものの使用**と、**参考画像の作図法から新しく広告を組版すること**は別物。

- **REF（参考デザイン）**：完成広告コンセプトシートやスクリーンショット。構図・階層・配色・図版の位置を学ぶ。AI生成の文字・価格・徒歩時間・地図・施設名はすべてサンプル／非事実であり、そのまま本番広告に転用しない。
- **RECIPE（作図処方）**：REFから抽出したレイアウトルール。type_poem/editorial/location × 2構図の計6処方。実装は既存PRINT03でPresentationDataから安全に描画する。
- **ART（単独素材）**：文字も地図も含まない架空建築写真・水彩・街並み線画などの独立した画像。生成された素材はIMG-PIPEの変換／メタデータ・権利審査を通過した後に限り、IMG-00の`approved_media`を通じて使用する。
- **RENDER（生成広告）**：POEM＋検証済みのLOCATION＋RECIPE＋認可済みARTを合成した最終A4/画面。地名変更時の旧生成トークン利用は不可。

**重要：refStatus=approved_reference は公開利用許可を意味しない。** ARTの `rightsStatus=approved`／`reviewStatus=accepted`／再配布許可とは独立させる。REFの画像をIMG-00のpublished manifestへそのまま入れることは禁止。

## 2. 最初の資産とID規則

2026-10-22にChatGPT画像生成で作成された広告一覧画像2点を基点とする。

- `REF-0001`：墨線／淡彩／夕景の混成を中心にしたコンセプトシート。上段3版型、下段5例。
- `REF-0002`：写真・イラスト・編集レイアウトを整理したコンセプトシート。上段3版型、下段4例。

命名は `REF-0001-overview.png`、上段 `REF-0001-A_type_poem.png`／`B_editorial.png`／`C_location.png`、下段まとめ `D_lower_overview.png`、下段個別 `E1_front.png`等。REF-0002も同様。

**媒体数**：原画像2点、切り出し17点、合計19PNG。個別の切り出しは新規生成原画として数えない。切り出しは元画像のピクセルをそのまま切ったもので、補筆・内容訂正なし。SHA-256、画像寸法、切り出し元のピクセル座標は会話内配布ZIPの `image-inventory.json` を正本として記録。GitHubのメタデータJSONは **binaryStatus=local_package_only** の間は参照台帳であり、GitHub上に当該PNGが存在するとの表明ではない。

`assets/reference-images/`は将来GitHubへ承認済みのバイナリを入れるための予定パスである。未登録ファイルに対して公開raw URLを発行したり、未検証のパスをリンク表示しない。

## 3. ディレクトリ構成

```text
docs/
  APP003_REFERENCE_IMAGE_LIBRARY_SPEC.md     この管理仕様
  APP003_REFERENCE_IMAGE_TAGS_V1.md          統制タグ語彙とPOI対応
  APP003_REFERENCE_IMAGE_ENTRIES/
    REF-0001.md                              構図と下段5件の個別説明
    REF-0002.md                              構図と下段4件の個別説明
research/
  visual-reference-manifest.json             検索索引（未保存画像は使用不可）
assets/reference-images/                    将来の保存先。今回RepoにPNGは入れない
  REF-0001-overview.png
  REF-0001-A_type_poem.png
  ...
```

画像の配布物（会話内 ZIP）は`APP003_reference_images_20261022.zip`。ZIPをユーザーが保持してから、必要であればGitHub公開リポジトリへの画像アップロードを別途実施・読戻しする。ZIPは **GitHubに登録された状態ではない**。

## 4. 画像1点に必須のメタデータ

| 分類 | フィールド | 必須目的 |
|---|---|---|
| ID | refId, variantId, parentRefId | 原画と切出しを混同しない |
| ソース | sourceKind, generatedAt, generator, sourceDescription | 生成由来・著作権文脈と事実性 |
| 格納 | fileName, width, height, bytes, sha256, cropBox | 実ファイル同一性と画角 |
| 状態 | binaryStatus, refStatus, reviewStatus, publishedAllowed | 参照用途と本番表示用途の区別 |
| 用途 | template, composition, artMode, sheetRole, density | どの広告紙面に向くか |
| 適合 | fitTags, caseTags, moodTags | 施設ジャンル・事情との対応 |
| 編集 | headlinePlacement, artPlacement, dataDensity, mapPosition | 具体的な図面再現 |
| 限界 | fictitiousDataWarning, mapEvidence, notes | 虚構情報の誤転用防止 |
| 文書 | detailMdPath, recipeId | 詳細説明と構図再現レシピへの逆引き |

各REFは解説MDで上段／下段を細分化し、単なる絵柄の印象ではなく、グリッド、見出し、本文、画像、地図、施設カード、出典、例外条件を説明する。後日タグ名を変更するときはタグ辞書を先に更新し、旧IDと互換対応を残す。

## 5. タグによる自動選択（実装前の推奨）

`POI分類 -> fitタグ -> template候補 -> composition -> artMode -> output` の2段階選択を推奨。

1. POEM/LOCATIONに使う主役は既存SubjectPolicy／sourceId等で確定し、**参考画像選択の結果から施設を逆推定しない**。
2. 主役のジャンルと事実確認状態から`fit:bookstore`／`fit:park`等を導き、同じタグのREFを候補化する。該当なければ一般的な`fit:quiet_residential`などの非具体的構図へ退避。
3. 出力面や施設数から`case:0_locations`／`case:long_name`／`case:duplex`／`density:high`を付加し、必須情報を収容できない構図を除外。
4. 候補RECIPEを視覚的適合（詩主体／画像主体／地図主体）、余白、施設数に応じてランキングする。ユーザーによる版型固定選択を優先。
5. `sourceId + generationToken + compositionId`等をseedにして安定決定。生成トークンが同じならコピー／印刷後に違う構図へ勝手に変わらない。再生成時のみ別候補へ変更可能。
6. ART選定は別工程。対応する承認済み単独画像がなければ既存の線画SVGに戻す。**参照シートの切出しをARTとして使用しない**。
7. 結果のPRで、選定理由・適合タグ・除外理由を追跡できるログを残す。ログに個人情報、内部ローカルパス、秘密情報を出さない。

仮の重み：主役フィット4、構図の用途適合3、長名・密度・表裏適合3、画風2、ユーザー固定選択は最優先。これは**試作時の仮説**であり実装・測定済みのランキング規則ではない。学区・販売価格・交通分数・医療情報の真正性はこのスコアで判定しない。

## 6. 大量化するときの数量管理

「100例」は**100の独立した広告レイアウト**とも**100の原画**ともまだ定義しない。

- デザインREF：構図の参考元（例えば20〜40の異なる紙面）
- 構図RECIPE：数値化した版面ルール（初期6、後続拡張）
- 画像ART：独立した単シーン原画（最初10、採否を見て30程度）
- Variation：RECIPE × ART × 配色 × データ密度の許された組合せ

掛け算で生じた数を新規原画数と偽らず、`sourceRefId, recipeId, artAssetId, variantId`を個別記録する。素材を100枚まとめてブラウザへ配信せず、必要な画像だけ遅延ロードする。

## 7. 本番へ昇格させるゲート

**REFを保存 → RECIPEを実装 → ARTを試作 → IMG-PIPE/IMG-00検証 → PRINT03に合成 → QA → 版型の受入**、の順。

- **視覚品質**：文字階層、線画／写真の整合、適切な余白、見出しの日本語、カラー・白黒、iPhone小画面での図版切れを審査。
- **地理・事実品質**：POEMとLOCATION01の同一性、直線距離と地図座標の整合、徒歩時間の無断推定0、実在POIの架空の外観画像を証拠にしない。
- **権利品質**：画像生成由来、第三者ロゴ・人物、再配布権、Web・印刷別可否を記録。
- **出力品質**：A4で本文・出典・創作注記欠落0、印刷ppi不足時はSVG、最大数に収まらないなら安全に複数ページ。
- **公開品質**：公開前に画像の実バイナリをGitHubから読戻し確認、manifest`binaryStatus=uploaded_verified`に変更、先行実機とCIを行う。

コンセプトシートにはAIが描いた架空価格、徒歩○分、実在施設のように見える名前・地図が含まれている。**構図参照としては承認しても、画像を直接製品へ掲出することは承認しない。**

## 8. マイルストーンと受入

- REF-LIB-01：2枚・切出し17点のローカルパッケージ作成、タグ・説明MD・manifestをGitHubの別PRへ保存（この段階）。
- REF-LIB-02：画像バイナリを専用PRに追加し、実PNGサイズ・SHA・GitHub取得内容の読戻しを行い、manifestのステータスだけを変更（現時点**未着手**）。
- REF-LIB-03：検索・絞り込みのミニUI（画像群をカード表示、ジャンル・構図・紙面条件で検索、REFとARTを誤混同しない）。React等の依存を増やす前に静的Webで試作。
- REF-LIB-04：採用率・重複率・実際の紙面適合で候補を比較し、必要な新規シートを追加。
- PRINT03-IMG-01：PR #31の独立印刷モジュールへ、PR #33の許可済みARTスロットを合成する専用PR。**REFの既製紙面画像を貼る実装ではない**。

## 9. 今回の検証記録

- 2026-10-22に`/mnt/data`から2枚の元PNGが実在することを確認。双方1536×1024px。
- Pillowで上段各3切り出し、下段まとめ各1、下段個別5＋4切り出し（計17個）を作成。原本2と合わせ合計19PNG。
- `image-inventory.json` に各PNGの寸法、境界座標、ファイル容量、SHA256を記録。ZIP容量約9.1MB。
- GitHub ConnectorからローカルのPNGバイナリを直接アップロードできる手段は本実行環境で確認できなかったため、**参照画像はZIPとしてのみ提供**。GitHub側はテキスト仕様・JSON台帳を保存し、画像のアップロード済み表記を行わない。
- main、既存PR #30〜#34、index.html、Pagesの変更なし。
