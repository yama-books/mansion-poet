# APP-003｜IMG-00 承認済み画像スロット PoC（2026-10-22）

状態：**独立モジュールのPoC／アプリ本体・PRINT03への接続は未実施**。
正本：`yama-books/mansion-poet`。本稿はASSET-01の試作結果と、IMG-PIPE-01 / PRINT03-COREの接続境界を記録する。

## 1. 初回の試行と採否

2026-10-22、ChatGPT画像生成でASSET-01の先行3題材（昼外観・夕景外観・エントランス）に着手したが、**生成結果2件がともに単独画像ではなく広告見本のコラージュ**となり、画面内に創作の金額・面積・施設説明・社名に似た文字等が含まれた。ASSET-01基準の「文字・価格の描き込み禁止」「再利用可能な単独建築画像」に反するため **2件とも不採用**。正式なASSET候補0枚、権利承認・印刷採用0枚。生成物はGitHubへコミットせず、公開アプリでも使わない。

10枚の原画試験という計画は維持する。画像生成専用の別セッションで「広告のレイアウトではなく、文字を含まない架空の建築写真**単体**」を明示して、昼外観・夕景外観・エントランスから再試行する。3枚の単独画像が制作・品質レビューを通過してから残り7枚に着手する。既存10点マトリクス：[ASSET-01 handoff](handoff/APP003_ASSET_GENERATION_HANDOFF_20261019.md)。

## 2. 今回作ったコードと境界

`src/image-assets/approved-media.js` はブラウザ兼Node対応の副作用のない、**公開候補manifestからの画像選択器**。ネットワーク・DOM・GitHub操作を一切行わない。

- スロット：`hero`, `residence`, `print_hero`。 `map_effect` と実在POI紹介画像 `location_support` は今は対象外。
- `schemaVersion:1.0`、`rightsStatus:approved`、`reviewStatus:accepted`、`permissionToRedistribute:true`、`reviewer`、`imageShowsRealPOI:false`、`kind:generated_illustration`、該当スロット・テーマ・画角中心点を検査。
- データから参照できる画像ファイルは `assets/images/web/{assetId}-screen.webp` / `assets/images/print/{assetId}-print.png` **だけ**。リモートURL・絶対パス・トラバーサル・queryの付いたパスは不可。単独画像原本を勝手に公開しない。
- `print_hero` は配置サイズ（mm）で実効ppiを計算して、指定値（デフォルト300ppi）未満なら線画fallback。見た目だけの拡大を高解像度と扱わない。
- `seed`＋スロット＋テーマによる決定的選択。候補不足、画像未許諾、テーマ不一致は `{kind:'existing_svg'}` に戻す。
- 文字・出典・創作注記は画像に描き込まず、広告のDOMとして表示。取得に失敗した画像に対する `onerror` 時のSVG fallbackは **PRINT03との接続PRで検証する**。

### 呼び出し例（概念）

~~~js
const slot = App003ApprovedMedia.choose(publishedManifest, {
  slot: 'print_hero',
  theme: 'architecture',
  seed: generationToken,
  placementMm: {width: 145, height: 95},
  minPpi: 300
});
// slot.kind === 'approved_asset' のときだけ src / caption / objectPosition を使う。
// SVGへの切替は slot.kind === 'existing_svg' のとき。
~~~

`publishedManifest` が生成されるまで実画像は表示しない。PRINT03のレンダラが許す画像hrefは現状地理院タイルに限定されているため、`src`属性を無条件に開放する改変は本PRでは行わない。**PRINT03のPR #31は独立してレビュー中**、CodexのIMG-PIPE PR #30もDraftのため、機械的なmanifest互換性は実画像を使う前に別途検証する。

## 3. 検証

ローカル（Node 22）で次の11ケースを実行し、11件成功、0件失敗：

~~~text
node --test tests/image-assets/*.test.mjs
~~~

権利不承認／レビュー候補／再配布不可／実POIフラグ／未署名レビュー／外部URL・パストラバーサル／印刷ppi不足／不適合テーマ／不正オプション／決定的選択／SVGフォールバックを検証。GitHub CIは `.github/workflows/image-slot-verify.yml` で対象コードが変更されたときのみ動く。CI完了はPR実行後に別途確認すること。

## 4. 次の工程

1. **ASSET-01（別画像生成セッション）**：文字なし建築写真3枚→品質確認→残り7枚、各assetId・プロンプト・画角・原画サイズ・制作日・採否・権利状況を記録。公開GitHubへの画像pushは別承認。
2. **IMG-PIPE-01（Codex）**：PR #30の高解像度負荷とPython CI、公開用manifestの権利情報を確認する。
3. **PRINT03-IMG-01（独立PR）**：PRINT03と実画像を接続する小さなテスト版。画像あり・未ロード・印刷低ppiを試し、線画fallback、画面の注記、消えない文章、生成トークンの同一性を検査。最初はeditorialの主画像1枚だけ。
4. 画像版型と印刷受入、Safari/iPhone実機印刷、Pages公開はそれぞれ別ゲート。今回の承認は**方向性とPoCの進行**であり、公開や未許諾画像投入を意味しない。

他セッション・他エージェントは`src/image-assets/`と`tests/image-assets/`を当PR作業中は同時編集しないこと。
