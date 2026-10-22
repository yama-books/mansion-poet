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
