# APP-003｜画像制作・共有ファイル案内板（正本）

**このファイルは画像制作・ファイル所在の共通入口です。APP-003全体の計画・進捗は[APP003_MASTER_PLAN_PROGRESS.md](APP003_MASTER_PLAN_PROGRESS.md)で管理します。**
固定URL：https://github.com/yama-books/mansion-poet/blob/main/docs/APP003_ASSET_WORKBOARD.md

- APP-ID：APP-003／POÈME / ESTATE
- 初回照合：2026-10-22 18:29 JST頃、GitHub mainと各PRを確認
- 正本Repo：https://github.com/yama-books/mansion-poet
- 全体台帳：https://github.com/moyashimisosoup/session-deck/blob/main/docs/APP_PORTFOLIO.md
- 目的：作業状態、実体ファイルの置き場所、承認済みの成果、未確認点、次の操作を見失わないよう記録する。**元の画像・詳細仕様のコピーをここで増やさない**。

> REF = 完成広告の参考画、RECIPE = 編集構図、ART = 文字のない独立素材、RENDER = データをHTML/CSS/SVGで合成した広告。REFの公開と本番用ARTの採用許可は別の手続き。

## 1. すぐ開ける共有資料

| 目的 | 保存先／固定・作業中リンク |
|---|---|
| **共通管理の入口** | [この案内板（main）](https://github.com/yama-books/mansion-poet/blob/main/docs/APP003_ASSET_WORKBOARD.md) |
| 登録済み参考画像（2原画＋17切り出し） | [main内の19PNG](https://github.com/yama-books/mansion-poet/tree/main/assets/reference-images) |
| 既存画像19件のハッシュ・用途タグ | [mainのREF manifest](https://github.com/yama-books/mansion-poet/blob/main/research/visual-reference-manifest.json) |
| **公開中の参考デザイン検索画面** | https://yama-books.github.io/mansion-poet/tools/reference-gallery/index.html |
| **REF-0003〜0008の説明・評価・候補manifest** | [Draft PR #37](https://github.com/yama-books/mansion-poet/pull/37)／[共有インデックス](https://github.com/yama-books/mansion-poet/blob/docs/app003-asset-ref-02-share-20261022/docs/APP003_ASSET_REF_02_GITHUB_SHARE.md) |
| REF-0003〜0008の原画像7点を確認・登録する手順 | [PR #37内の画像登録Runbook](https://github.com/yama-books/mansion-poet/blob/docs/app003-asset-ref-02-share-20261022/docs/APP003_ASSET_REF_02_UPLOAD_RUNBOOK.md) |
| **今後の画像生成・素材分離の規則** | [Draft PR #38](https://github.com/yama-books/mansion-poet/pull/38)／[制作契約MD](https://github.com/yama-books/mansion-poet/blob/docs/app003-art-separation-policy-20261022/docs/APP003_IMAGE_ASSET_SEPARATION_POLICY_20261022.md) |
| 3版型×2構図の再現レシピ | [PR #34](https://github.com/yama-books/mansion-poet/pull/34)／[設計MD](https://github.com/yama-books/mansion-poet/blob/docs/app003-visual-composition-recipes-20261022/docs/APP003_VISUAL_COMPOSITION_RECIPES_20261022.md) |
| IMGパイプライン／使用権とSVG fallback | [PR #30 IMG-PIPE](https://github.com/yama-books/mansion-poet/pull/30)／[PR #33 IMG-00](https://github.com/yama-books/mansion-poet/pull/33) |
| 広告A4印刷／POEM文面 | [PR #31 PRINT03](https://github.com/yama-books/mansion-poet/pull/31)／[PR #32](https://github.com/yama-books/mansion-poet/pull/32) |

この文書はmainの固定パスに置く。Draft PR内の資料はまだmainへ統合されていないため、それぞれのブランチへのリンクである。PRマージ後はリンクをmain上の正本ファイルに更新する。

## 2. 現在の作業状態（最終GitHub確認時点）

| Work-ID／領域 | 検証済み成果 | いまの状態・担当／次の一操作 |
|---|---|---|
| REF-LIB-01/02/03 | REF-0001/0002の19PNGをmainへ登録し、ギャラリーをWeb公開・HTTP GET確認済み | REF参照用。広告に直接採用するARTではない。iPhone Safariの人手操作は未記録 |
| ASSET-REF-02 | **PR #37**の11テキストファイルをGitHub読戻し確認。REF-0003〜0008の詳細MD6件、横断評価、候補manifest、共有インデックス、登録手順・検証スクリプト | PR #37 Draft、HEAD 6f2e9567c6。7PNGの原画像はPR #37のtree内では未確認。ユーザーの「GitHubへ素材保存」報告があるため、**別ブランチ／コミット／保存パス特定待ち**。同じ画像を重複アップロードしない |
| ASSET-CONTRACT-01 | REF/RECIPE/ART/RENDER分離と文字ゼロARTの制作契約を**PR #38**に保存・読戻し確認 | PR #38 Draft、HEAD 3ef245fe20。新規画像制作セッションへ指示済み。制作中の成果物は未確認 |
| ASSET-ART-01 | 文教・緑地・小設備等の代表的な文字なし独立ART3点の試作を画像制作セッションへ依頼済み | **作業中（ユーザー報告）**。新ARTの実ファイル、ART-ID、SHA256、保存PR、採用結果はまだ未照合。次は担当からCHECKPOINTを受領 |
| IMG-PIPE／IMG-00 | 画像変換PR #30と認可済みARTスロットPR #33 | どちらもDraft、main未統合。実画像を入れる前に契約・権利・ppiを照合 |
| PRINT03／POEM | PR #31（印刷エンジン）とPR #32（文面） | open、main未統合。ART実画像合成とSafari印刷は未検証 |
| VISUAL-RECIPE | 6構図と配置ガイドをPR #34に保存 | open、main未統合。実組版への接続は今後 |

進捗を推測したパーセンテージは記録しない。**branch／HEAD／PR／ファイル読戻し／CI／実機の結果**を別々に扱う。

## 3. REF-0003〜0008：画像と説明の住所録

| REF | テーマ | PR #37の個別説明MD | 元画像候補名 |
|---|---|---|---|
| 0003 | 書店・図書館・文教 | [REF-0003.md](https://github.com/yama-books/mansion-poet/blob/docs/app003-asset-ref-02-share-20261022/docs/APP003_REFERENCE_IMAGE_ENTRIES/REF-0003.md) | REF-0003_concept_sheet.png |
| 0004 | 公園・緑地・並木道 | [REF-0004.md](https://github.com/yama-books/mansion-poet/blob/docs/app003-asset-ref-02-share-20261022/docs/APP003_REFERENCE_IMAGE_ENTRIES/REF-0004.md) | REF-0004_concept_sheet.png |
| 0005 | 川・暗渠・水辺 | [REF-0005.md](https://github.com/yama-books/mansion-poet/blob/docs/app003-asset-ref-02-share-20261022/docs/APP003_REFERENCE_IMAGE_ENTRIES/REF-0005.md) | REF-0005_concept_sheet.png |
| 0006 | 神社寺院・歴史文化 | [REF-0006.md](https://github.com/yama-books/mansion-poet/blob/docs/app003-asset-ref-02-share-20261022/docs/APP003_REFERENCE_IMAGE_ENTRIES/REF-0006.md) | REF-0006_concept_sheet.png |
| 0007 | 都市夜景・交通・街路 | [REF-0007.md](https://github.com/yama-books/mansion-poet/blob/docs/app003-asset-ref-02-share-20261022/docs/APP003_REFERENCE_IMAGE_ENTRIES/REF-0007.md) | REF-0007_concept_sheet.png |
| 0008 | ポスト・路地・都市小設備 | [REF-0008.md](https://github.com/yama-books/mansion-poet/blob/docs/app003-asset-ref-02-share-20261022/docs/APP003_REFERENCE_IMAGE_ENTRIES/REF-0008.md) | REF-0008_concept_sheet.png |

あわせて[横断自己評価](https://github.com/yama-books/mansion-poet/blob/docs/app003-asset-ref-02-share-20261022/docs/APP003_ASSET_REF_02_ASSESSMENT.md)と[候補manifest](https://github.com/yama-books/mansion-poet/blob/docs/app003-asset-ref-02-share-20261022/research/asset-ref-02-manifest-candidate.json)を参照。元画像7点のZIPの記録名は APP003_ASSET_REF_02_six_sheets.zip。GitHubでの画像の**実保存先は固定SHA読戻しが済むまで未確定**。アプリ内で参照画像を実店舗写真や価格・徒歩分・地図の証拠として利用してはいけない。

## 4. セッション間の編集分担

- **新画像制作担当**：独立ARTの一意ID、画像原画、元プロンプトMD、生成方法、寸法とSHA256、素材審査、GitHub branch／PR／commitをセットで保存。既存REF原画やPR #37/#38のファイルを上書きしない。公開リポジトリに登録できる資料のみ掲載。
- **REF画像登録担当**：PR #37とユーザー報告の画像保存先を照合し、実ファイル7点の保存先・固定commit・SHA256を確定させてこの案内板を更新。同じPNGを再作成・重複登録しない。
- **印刷／統合担当**：PRINT03のsrc/print-layoutは所有担当以外が同時編集しない。REFの文字入り画像を本番ARTに昇格させず、独立ARTの使用権・画質・安全ゲートを通してから合成。
- **管理担当**：このmain文書が唯一の共通住所録。重要な節目（原画保存、PR、画像確認、印刷QA、マージ、公開、引継ぎ）でだけ更新。都度、最新mainを読み直してSHA競合を回避。
- **公開境界**：GitHubリポジトリとDraft PRもPublic。認証情報・非公開セッション内容を公開資料へ貼らない。REFの参考公開とART本番採用は別承認。

## 5. 担当から受け取るCHECKPOINT書式

次のフィールドを短く報告するだけで引き継げる。

    APP-ID / work_id / 担当領域：
    正本Repo：
    Branch / HEAD / Draft PR URL：
    新規・更新した相対ファイルパス：
    画像ID、実寸法、SHA256、原画のGitHub固定commit：
    成果の区分：REF候補／ART候補／許諾審査済／PRINT03合成済：
    GitHub読戻し・CI・画像品質検査の結果：
    未保存・未確認の項目：
    次の1操作：

**別セッションの作業開始時は、最初にこのファイルと対象PRの最新HEADを読む。** 進行中のチャット報告は、GitHub保存・読戻しの証明に置き換えない。

## 6. 更新履歴

- 2026-10-22 18:29 JST頃：GitHub mainおよびPR #30/#31/#32/#33/#34/#37/#38の状態を確認して初版設置。新ARTは別セッションで制作中、実体未照合。REF-0003〜0008のPNG7点のGitHub固定保存場所を特定待ち。

> 表のPR HEADや状態は最終確認時点のスナップショット。最新状態はGitHubで必ず再照合する。
