# APP-003 LIVE-PRINT03 | CHECKPOINT / HANDOFF_READY

- 確認日：2026-10-25 JST
- APP-ID/work_id: APP-003 / PRINT03-LIVE-01
- 正本：`yama-books/mansion-poet`
- Draft PR: [#44](https://github.com/yama-books/mansion-poet/pull/44)
- branch: `feature/app003-live-print03-20261025`
- 本節の検証対象コードHEAD: `058f7ca3a7b5cc7940b0dce3d7fc8f0ce1d0a856`
- PR base: `feature/app003-print03-img01-poc-20261022`（PR #39、さらに PR #31 PRINT03-core に依存）
- PR #40の現行index.html / POEM辞書 / LOCATIONカード / Node・Chromiumテストを移植済み。PR #40本体やmainを変更していない。

## 目標ゲートによる進捗（このCHECKPOINT時点：4/5=80%）

- [x] G1: PRINT03用データ契約・印刷核、文字・POI・注記/出典/位置図安全ゲート（PR #31）。
- [x] G2: PR #43原画を使う独立ART/SVG組版検証、画素数/解像度、A4 PDF・上下焦点UIレビュー（PR #39）。
- [x] G3: PR #40のUIへ段階接続し、地点ごとのimmutable snapshotからA4組版するDraft PRをGitHub保存（PR #44）。
- [x] G4: Node、Chromium実生成A4、端末幅QAに成功し、実PDF画像を読戻して目視（下記）。
- [ ] G5: iPhone Safari実機で地点切替・プリントUI・PDF印刷、ユーザー最終受入・ARTライセンス/使用承認、main統合/正式公開。これらの完了までは100%にしない。

## 実装・回帰確認

- `index.html`: 既存案1/案2は維持、案3「新しいA4広告」の入口を追加。旧COPY/LOCATION UI/辞書はPR #40の最新候補。
- `src/print-layout/live-app.js`: 選択地・施設・生成文章の値のみから `PD.fromAppSnapshot` を作成。token mismatch / 地点切替 / プレビュー競合で古い印刷を停止。外部地図・POI APIの再取得なし。画面プレビューと印刷用rootを分離。
- `src/print-layout/img01-preview.js`: 原画Git blobの試作表示、非承認の明記、SVGデフォルトと画像不達時のフォールバック。上下焦点を変更可。
- `src/print-layout/{presentation-data.js,templates.js}`: POIに住所が提供されない場合「所在地詳細：公開データ未収録」を広告へ挿入しない。住所を捏造しない。既存H-06の文字検証はそのまま維持。
- `tests/mobile-device/full-flow.cjs`: 本文・LOCATION実生成→ART読み込み→A4 PDF→別地点で古いスナップショットを破棄、ならびに従来案2のPDF1ページ回帰。

### CI・PDF根拠

1. [APP-003 mobile QA #40199201454](https://github.com/yama-books/mansion-poet/actions/runs/40199201454) **completed/success**、Node **135/135**、Chromium 320/375/390/430/1440px PASS、390/1440pxの新ART印刷・旧案2・地点切替の回帰 PASS。[実PDF・スクリーンショット](https://github.com/yama-books/mansion-poet/actions/runs/40199201454/artifacts/12600976931)。
2. [PRINT03 QA #40199201460](https://github.com/yama-books/mansion-poet/actions/runs/40199201460) **completed/success**、Node **207/207**、Chromium A4比較 **12/12**。[比較素材](https://github.com/yama-books/mansion-poet/actions/runs/40199201460/artifacts/12600896953)。
3. 実生成 `mobile-390-print03-live-art.pdf` と `desktop-1440-print03-live-art.pdf` は共に **A4縦1ページ、595×842pt**。PNGレンダリングの目視とテキスト抽出で、原画/本文/図書館・博物館・公園の3カード/創作注記/SOURCES/フッターが確認でき、未収録住所の診断文なし。実際のiPhone印刷機では未検証。
4. [確認専用HTTPS preview](https://raw.githack.com/yama-books/mansion-poet/058f7ca3a7b5cc7940b0dce3d7fc8f0ce1d0a856/index.html)。CIのHTTP取得確認は実施、iPhone Safari利用・外部API動作・永続配信の保証なし。GitHub Pages正式公開ではない。

## 残る判断事項・限界

- 長い施設名を含むF03の「自動1枚」印刷はPR #39を継承し2ページ（必要情報を落とさない表裏フォールバック）。`A4片面1ページ・全入力` は**未達**であり本番受入で判断要。
- 原画 PR #43 は候補/試作専用。本番の画像使用許諾、権利審査、追加素材選定は未実施。
- iPhone Safari **実機**プリント・PDF保存は未確認。Chromium mobile 390px と同一とみなさない。
- このPRはDraftのまま。main merge、既存PR merge、Pages設定変更、本番公開、資産承認は一切していない。

## 次の1操作

iPhone Safariで上の確認専用HTTPS previewを開き「神保町または中野→この街を、詩にする→PRINT STYLE 案3→PRINT/PDF→高解像度ART→この紙面を印刷/PDF」を試し、実機のプレビュー・1ページ判定・文字の見切れ・画面スクロールを記録する。ユーザー受入後、PR #31 → #39 → #44 に加えて #40 の差分競合を整理して、ART本番承認とは分けてmainへの統合可否を判断する。
