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

## 2026-10-26｜実機Safariでの組版失敗と修正候補

- **実機フィードバック（確定）**：ユーザーがiPhoneで確認用 `raw.githack.com` ページの「高解像度ART（試作・未承認）」を選択したところ、「組版に失敗しました。線画へ切り替えるか再生成してください。」と表示され、印刷ボタンが無効。焦点位置変更を繰り返しても失敗。iPhoneでの正常なA4印刷・PDF保存は**未確認／未達**。
- **問題の切り分け**：焦点スライダーは `object-position` の画角調整しか行わない。一方、例外は `PrintImage01Preview.mount` / PRINT03 preflightの `report.ok` を受けた部分で握りつぶされ、実機では詳細がわからなかった。ユーザー操作ではなく実装側の診断情報不足を是正する。
- **変更**：
  1. `src/print-layout/live-app.js` に失敗時のH-06/T/H-01種別表示、`window.__APP003_PRINT_DIAGNOSTICS`、失敗時の紙面保持・印刷禁止、前回結果の破棄を追加。古いエラーを流用しない。
  2. `src/print-layout/print-layout.css` のA4紙面だけに `-webkit-text-size-adjust:100%;text-size-adjust:100%` を追加。iOS Safariのviewport起因の文字自動拡大が文字あふれを起こす可能性に対する保守的な対処。**原因としての断定はしない**。
  3. `tests/mobile-device/webkit-print03.cjs` のiPhone UA/390px/WebKitエンジンprobeを追加。GitHub Actions側でSafariエンジンの検証を独立取得し、将来の差分を観測可能にした。
- **確認できた範囲**：iPhone emulation WebKit の [Actions #40236858269](https://github.com/yama-books/mansion-poet/actions/runs/40236858269) は修正候補CSS追加前のコードでSVG/独立ARTともA4 1ページ PASS。iOS Safari実機とLinux WebKitには実装差があり、この成功だけで実機復旧とは判定しない。
- **コード上の修正候補HEAD**：`7962a90a1ea4618e717661e50f4812f9aa0d64ec`。対応する [PRINT03 #40237215560](https://github.com/yama-books/mansion-poet/actions/runs/40237215560) はSUCCESS。対応する[モバイル/WebKit #40237215559](https://github.com/yama-books/mansion-poet/actions/runs/40237215559) はこの記録時点で実行中、完了・合格を未確認。後から確認して結果を追記する。
- 状態：**80%（G1-G4）を維持、G5はiPhone実機不合格につき未達**。main統合/Pages公開/画像本番採用は依然禁止・未実施。
- **次の1操作**：最新コミット固定の確認用URLをiPhoneで開き、同じ手順で再生成して新しい詳細エラーを記録する。成功時は実機の印刷UI・A4 PDFページ数まで確認する。
