# APP-003 PRINT03-IMG-01｜実画像組版PoC CHECKPOINT

- Work ID：`APP-003/PRINT03-IMG-01`
- Base：PR #31 `work/app003-print03-core-20261020`（開始時HEAD `037ee9a45738544e54ce6584439e22e9d4b3c826`）
- Branch：`feature/app003-print03-img01-poc-20261022`
- 依存確認：PR #30 IMG-PIPE、PR #33 IMG-00、PR #34構図、PR #37参考画像、PR #38 REF/ART制作区分。開始時のmainで`AGENTS.md`は見つからず、マスター計画と画像案内板は確認した。
- 代表：PR #37の `ART-REF0003-library-refcrop.png`（484×295 px / 301,504 bytes、SHA-256 `8662274f6157e542c3004f4a23286a26e7f291d01f531cea6ef7206ff4744b5e`）。低解像度の参照切り出しであり、**ART正式採用ではない**。
- 実装：PR #31のeditorialテンプレートとA4ページネーションは変更せず、`src/print-layout/img01-preview.js`を比較ページだけで登録する。詩・施設カード・出典・地図は既存PresentationDataから独立DOMとして組版し、SVGオリジナルを保持。画像はHTML img要素、縦横比はobject-fit:cover。画像読み込み失敗はSVG。
- 比較：`tests/print-layout/img01/preview.html`でSVG/PHOTO/MISSINGとF01（3件）、F04（0件）、F03（長名）を選べる。写真枠72/84mmと焦点を可変。
- 品質境界：`src/image-assets/approved-media.js`、既存PRINT03の属性ホワイトリスト、main、Pages、PR #30/#31/#33/#37/#38のheadは編集しない。本番承認済みのmanifestに参考画像を追加しない。

## 証拠と未検証

- Node新規5件：ローカル構成で5/5 PASS。GitHubに保存した版のNode回帰は新PRのCIで確定させる。
- 実ブラウザ・A4 PDF：`tests/print-layout/img01/browser-qa.mjs`がChromeで5ケースを実行し、3状態のスクリーンショット＋A4 PDFをGitHub Actions artifactに保存する設計。**CI成功前に検証済みとしない**。
- 実効ppi：写真のnative 484×295pxをブラウザの実配置幅・高さからcoverクロップで評価してプレビュー報告欄へ出す。ppi基準は今回設定しない。
- iPhone Safari・main統合・Pages公開：未実施。今回承認はPoC専用。

## 次の1操作
Draft PRのCIとartifactを確認し、画像あり/なし/失敗時のスクリーンショットとA4の注記・可読性をレビュー。重要な検証結果が確定した時点だけマスター計画・画像作業台帳へ反映する。

## 実ブラウザ・A4での確認（2026-10-22 JST）

- Chromium（GitHub Actions Linux + `fonts-noto-cjk`）による比較：**SVG / 写真 / 写真不達SVG、施設0件、京都の長名**の5条件を実行し、ブラウザ組版レポートは5/5 `ok=true`。保存成果は[Actions #39796965216](https://github.com/yama-books/mansion-poet/actions/runs/39796965216) の `print03-img01-review` artifact（ZIP）。
- SVG・写真・写真不達の3つのPDFは **A4縦 209.9×297.0mm、各1ページ**。PDF文字層に見出し「知の深奥」、LOCATION名、創作注記が残り、PyMuPDFによるページ外スパンは0（3PDF）。
- 画面の日本語字体を確認。初回Chrome環境で日本語□が生じたため、CIでNoto CJKを導入し再撮影した。
- 写真掲載枠の実測：幅 **182mm**、表示高さ **76mm**、native 484×295px、`object-fit:cover`時の実効 **約67.5ppi**。今回の試作では合格閾値とせず、本番A4印刷素材には**明らかに解像度不足**として記録。
- この5条件のブラウザ結果は保存済みだが、GitHub Actions #39796965216は後続照合で**completed/success**。ブラウザ5ケースのartifactを固定して確認。ブラウザartifactとCI最終conclusionは別の証拠として扱う。
- 追加検査：F01の写真あり・duplex（裏面位置関係図）を[後続CI](https://github.com/yama-books/mansion-poet/actions/runs/39797772688)へ追加。結果はartifactを取得してから判定し、先行5件のPASSに含めない。
- 現行の独立元データ・IMG-00権限判定に変更なし。端末実機Safari・Pages公開・mainマージは未実施。

**意匠面の次の提案**：この試作の横182mm表示でA4品質を得るには、横2000px級以上の独立写真を候補として比べる価値がある。ただし採用寸法・ppiの正式規格は、実際の高解像度ARTを同じ組版で試してから決める。

## 独立高解像度ARTの組版追加（2026-10-25 JST・CI結果確定前）

- 担当：APP-003/PRINT03-IMG-01。既存Draft PR #39の作業ブランチを継続し、PR #31の独立印刷エンジンを流用。PR #40には触れない。
- 比較元：484×295px参考切り出し（PR #37）。追加：1672×941px独立ART `ART-REF0003-PHOTO-01`（PR #43、原画保全コミット `134f5d9`、Git blob `2ee714f8e57193c2e4af3406c7f92a9a33d8bde0`）。同一Git blobをPR #39のtreeで再利用しており、新たに画像を生成・拡大していない。
- ART所在：`assets/art-candidates/asset-art-01/ART-REF0003-PHOTO-01.png`。状態は `rightsStatus=review_required`、`productionApproval=pending`、`publishedAllowed=false` のまま。架空のAI生成情景であり、実在物件・施設の写真ではない。
- 差分は試作専用 `img01-preview.js`、`preview.html`、Nodeテスト、既存Chromium QAとworkflowに限定。REF完成広告の貼付け、生成文字列・施設名・座標・地図・コピー・安全規則・本体 `index.html` の変更なし。従来SVG、旧参考写真、画像不達の比較を維持。
- 代表条件：施設3件・0件・京都長名。Chromeで旧版・独立ART・SVG、A4縦PDFのスクリーンショットと文字層を検査し、成果は既存 `print03-img01-review` artifactに保存する計画。
- 理論値：既存182mm幅枠の場合、独立ARTの cover 実効ppi ≈ 1672÷(182/25.4)＝**233.3ppi**。旧参考写真は ≈ 67.5ppi。実測値はCIの `browser-results.json` で追記する。300ppiの商業印刷を保証する値ではない。
- 現段階の未確認：今回のHEADのNode/Chromium結果、A4実ページ数、PDF文字層、見た目の目視判定、Safari実機。
- 非対象：本番承認フラグ、mainマージ、Pagesデプロイ、他2テーマの投入、新規ART生成。
- 次の1操作：CI完了後に比較PNG・A4 PDF・ページ数・ppiを確認してこのCHECKPOINTに根拠を追記する。

## 最終Chromium QA結果（2026-10-25 JST）

**本セクションのコード検証対象SHA：`f8cde183d7c6da333d43a1300eb30265a4ded431`。**

- [GitHub Actions #40160782946](https://github.com/yama-books/mansion-poet/actions/runs/40160782946)：`completed/success`。Node **202/202 PASS**、Chromiumの代表比較 **10/10で組版判定OK**。画像不達時のSVG復帰、生成トークン判定を維持。
- [比較PNG・A4 PDF・JSON（artifact）](https://github.com/yama-books/mansion-poet/actions/runs/40160782946/artifacts/12586017848)：`print03-img01-review`、約23MB。標準F01の旧写真と新ARTは `F01_jimbocho_3__photo.png` / `F01_jimbocho_3__art.png`、PDFも同名拡張子で比較可。SVGと写真不達のスクリーンショット/PDFを併録。
- **実測ppi**：F01幅182mmで参考484px **67.5ppi**、独立ART1672px **233.3ppi**。補間拡大なし、実ファイルのnaturalWidth/naturalHeightとDOM枠実測からcover比率を算出。**300ppiの商業印刷合格を主張しない**。
- **A4縦単面（1ページ）合格**：F01旧写真・独立ART・SVG・写真不達の4ケース、およびF04施設0件ARTが各1ページ（`pdfinfo`でA4サイズ確認）。`pdftotext`による日本語本文の抽出、創作注記、F01見出しを検査し失敗0。DOMの既存組版プリフライト10/10合格。
- **意図的なduplex指定**：F01旧写真・ARTともA4縦2ページ（表面／裏面）で正常。
- **未解決：F03京都・非常に長い施設名**：旧写真・ARTどちらも`sheet=auto`がA4縦**2ページ**。同条件PDFの文字層は取得でき、長名も組版プリフライトで欠落なし。ただし**「すべての広告をA4単面1ページ」は未達**。ブラウザCI成功はこの例の単面合格を意味しない。`browser-results.json`の`singlePageRequirementMet=false`とCIの`KNOWN OPEN`で明示。
- 1回目の失敗で、試作CSSの`height:84mm!important`がPRINT03の縮小レベルを抑制していたことを発見。2回目の検証でこの`!important`を外し既存の72/60mm段階縮小を復旧したが、F03の文章量はなお2ページ。本文の削除・フォント下限違反による強制一枚化は行わなかった。
- **残る目視／実機検収**：実際の写真トリミング、施設名と地図の視覚的読解性、紙の実物、iPhone Safari。CIによるPDF文字抽出だけで人の目視受入と同一視しない。
- **非対象を維持**：原画制作、他2ARTテーマの大量投入、権利・本番承認フラグ、mainへの統合、PR #40との無計画なマージ、Pages公開。PR #39はDraftを維持。
- **次の1操作**：上記artifact内の`F01_jimbocho_3__art.png/.pdf`と`__photo`を同じ表示倍率で比較し、F03のA4単面要否とトリミングを利用者レビューで判断する。その後にPR #31/#39/#40の結合計画を再点検する。

## 2026-10-25｜A4成果物の目視確認・焦点操作修正

- [確定CI #40160782946](https://github.com/yama-books/mansion-poet/actions/runs/40160782946) のartifactから実PNG/PDFをダウンロードし、F01（旧参考写真と独立ART）、F04施設0件、F03京都長名のA4面とF03の裏面をレンダリングして目視した。
- **F01比較**：新ARTは窓辺・書架・階段の細部が旧484px切り出しより鮮明。画像と動的文字の分離が保たれ、POEM/LOCATION/NOTES/SOURCESが1面に存在。原画テーマと図書施設は調和する。一方、風景は架空であり実在地点の証拠にはしない。元絵の縦方向の上下が印刷版では大きく切られるため、焦点調整が重要。
- **F03京都2ページの性質**：1ページ目に写真＋広告主本文＋LOCATION概略、2ページ目に位置関係図＋長い施設名を含む詳細カード＋NOTES/SOURCESが描かれている。単なる印刷時の白紙流出や重複ページではない。ただし最終要件「常にA4片面1ページ」は未達。長文ケースで情報削除なしに片面とする方針は次の統合判断が必要。
- PDF実ファイルをPyMuPDFで監査し、F01、F04とF03表裏についてページの外に出るテキストスパンは**0件**。F03の極端な英数字連続語も折り返されている。表示上の細字の紙での可読性は実機印刷で未確認。
- **発見した焦点UIの不整合**：既存CSSは `object-position:var(--img01-focus,50%) center` と横軸だけを可変にしていた。しかしF01の182mm幅の写真枠では幅優先coverになり、クロップは主に縦方向。スライダー操作が効かないように見えるため、試作CSSのみ `object-position:center var(--img01-focus,50%)` に修正。独立ART10%/90%焦点スクリーンショットを既存Chromium QAの追加2条件で採取し、確認する。
- 旧写真・新ARTの印刷品質差の根拠は実画素/実測配置の67.5ppi対233.3ppiであり、低解像度素材の補間拡大は未実施。
- アプリ本体、生成トークン、安全分類、正式な承認/公開設定、main、Pages、PR #31/#40/#43は変更しない。
- 次の1操作：焦点補正後のCI artifactから10%/90%のクロップを対比してから、PR #31→#39→#40の段階的統合前提とA4長名処理方針を文書化する。
