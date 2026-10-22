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
