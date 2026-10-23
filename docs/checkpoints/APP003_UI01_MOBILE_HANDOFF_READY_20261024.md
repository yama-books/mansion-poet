# APP-003 / UI01-MOBILE-01｜HANDOFF_READY（2026-10-24 JST）

**状態：一時停止・引継ぎ可能。以後このセッションはアプリ本体を編集しない。**

> 公開GitHubへ載せられる**技術情報だけ**の引継ぎ。個人情報・非公開の会話内容・認証情報は記録しない。本書はDraft PRに隔離し、main・公開Pages・アプリコードは変更しない。

## 1. 目的・正本・作業ID

- APP-ID：**APP-003**／POÈME / ESTATE
- Work-ID：**APP-003/UI01-MOBILE-01**（新しいwork_idは未発行。既存のこの識別子を継続）
- 目的：実際のWebアプリのiPhone Safari操作性改善。検索 → 地点確定 → 生成 → 施設・コピー → 印刷の基本導線を実機で確認できる状態にする。
- 正本Repo：[yama-books/mansion-poet](https://github.com/yama-books/mansion-poet)
- 停止時の**main HEAD：\`c053c6dcc4e8b3b7a9cde601f73f8e5b49c9d9e8\`**
- UI担当branch：\`feature/app003-ui01-safari-mobile-20261022\`
- **UI担当HEAD：\`a117a5d1eeef174edac51639aaae7e6c417c1479\`**
- UI担当[Draft PR #40](https://github.com/yama-books/mansion-poet/pull/40)（base=main）。停止時はopen/draft、**未マージ**。
- [全体開発・進捗マスター](../APP003_MASTER_PLAN_PROGRESS.md)／[画像アセット案内板](../APP003_ASSET_WORKBOARD.md)／[画像量産計画](../APP003_ART_BATCH_PRODUCTION_PLAN_20261023.md)。
- Repo mainに\`AGENTS.md\`は2026-10-24の照合で404。存在を推定しない。

## 2. 停止時点で実装・保存済み（PR #40）

- \`index.html\`：モバイルヘッダー「つくる」のショートカット、44px級タッチ領域、safe-area、検索input 16px、iOS用の\`enterkeyhint=search\`、検索状態の\`role=status\`と\`aria-live\`を追加。場所・POI・本文生成の基本ロジックは変更していない。
- \`tests/mobile-device/browser-smoke.cjs\`：320、375、390、430、1440pxの実Chrome（モバイル幅エミュレーション）で操作領域、横はみ出し、コピー無効化を検査。
- \`.github/workflows/mobile-device-qa.yml\`：Node回帰、ChromeモバイルQA、スクリーンショット、候補サイトのHTML/JS ZIP artifactを生成。**ZIPはSafariからアクセスできるHTTPSプレビューではない**。
- \`tests/mobile-device/full-flow.cjs\`：2026-10-23に追加された検索→POI生成→コピー→印刷→通信障害後の古いコピー混入確認の決定的モックE2E（コード保存済み）。
- [PR #40のCHECKPOINT](https://github.com/yama-books/mansion-poet/blob/feature/app003-ui01-safari-mobile-20261022/docs/APP003_UI01_MOBILE_DEVICE_CHECKPOINT_20261022.md)。

**重要：** PR #40の最新HEADは過去の報告\`5f52ab7\`から先へ進み、\`a117a5d\`に更新されている。復帰後は必ず**最新HEADと差分**を先に読む。旧HEADに戻したり、以前のコードを再実装しない。

## 3. 検証したこと／未検証

### 成功の根拠

- [GitHub Actions #39863730582](https://github.com/yama-books/mansion-poet/actions/runs/39863730582)：Node **130/130**、Chromeの320/375/390/430/1440px **5/5**、モバイルスクリーンショットartifactあり（古いHEADでの結果）。
- [GitHub Actions #39947586101](https://github.com/yama-books/mansion-poet/actions/runs/39947586101)：UI01モバイルブラウザQA成功（HEAD \`1d960366b4bb\`）。
- [GitHub Actions #39947614439](https://github.com/yama-books/mansion-poet/actions/runs/39947614439)：既存 Verify mansion-poet 成功（最新HEAD \`a117a5d\`）。
- [PRINT03-IMG-01 CI #39798739024](https://github.com/yama-books/mansion-poet/actions/runs/39798739024)：別担当PR #39の写真/印刷の独立QA成功。

### 成功と誤認しないこと

- [最新PR #40モバイルQA #39947614380](https://github.com/yama-books/mansion-poet/actions/runs/39947614380)：**completed/cancelled**、HEAD \`a117a5d\`。新しく加えた\`full-flow.cjs\`を含む最新版のブラウザE2Eは**PASS未確認**。キャンセル理由は未判定。
- **iPhone Safariでの実機操作は未実施**。Chromeのモバイル幅エミュレーションはSafari実機QAではない。
- 端末から開ける**候補版HTTPSプレビューURLは未整備**。現行のGitHub PagesにはPR #40の変更は反映されていない。
- **PR #40は未マージ・未公開**。アプリコード完成・CI成功・公開・実機受入は別ステータスとして保持。

## 4. 並行作業との境界

| 担当 | branch / Draft PR | 状態・留意事項 |
|---|---|---|
| UI01-MOBILE-01：本引継ぎ | \`feature/app003-ui01-safari-mobile-20261022\` / [#40](https://github.com/yama-books/mansion-poet/pull/40) | 最新 \`a117a5d\`。**ここから再開**。本番mainを直接書換えない |
| PRINT03-IMG-01：写真組版 | \`feature/app003-print03-img01-poc-20261022\` / [#39](https://github.com/yama-books/mansion-poet/pull/39) | HEAD \`7f968e6\`、base=PR #31の作業ブランチ。こちらでは\`src/print-layout\`やその画像試作を触らない |
| PRINT03-CORE | \`work/app003-print03-core-20261020\` / [#31](https://github.com/yama-books/mansion-poet/pull/31) | PR #39の前提。main未マージ |
| REF画像・デザイン契約 | [#37](https://github.com/yama-books/mansion-poet/pull/37) / [#38](https://github.com/yama-books/mansion-poet/pull/38) | 参考画像は原則本番ARTとは区別 |
| 全体進捗記録候補 | \`docs/app003-img01-progress-20261022\` / [#41](https://github.com/yama-books/mansion-poet/pull/41) | main正本マスター・画像案内板を変更するDraft PR。最新mainと競合を避ける |
| ART画像制作 | \`assets/app003-asset-art-01-photo-trial-20261023\` HEAD \`28208fe\` | 3点（文教/緑地/小設備）のメタデータ \`research/asset-art-01-manifest.json\` と画像原本復元用Actions workflowを確認。ただしブランチのtreeに原画PNG3点は**見当たらない**。原本保存・品質を達成したとはしない。別担当と照合する |

画像大量制作の移行条件は[量産フェーズ移行計画](../APP003_ART_BATCH_PRODUCTION_PLAN_20261023.md)を参照。**独立ART3点の原画保全＋代表1点のPR #39掲載・見た目受入**を確認する前に大量生成の完了を記録しない。

## 5. 再開手順と次の「1操作」

**最初の1操作：PR #40の最新HEAD \`a117a5d\`について、キャンセルされたモバイルQA #39947614380の経緯を調べ、同HEADの\`full-flow.cjs\`を含む実ブラウザ検証を実行・合否確定する。**

続いて、成功証拠とスクリーンショットをレビューし、iPhone Safariから**候補版を開けるHTTPSプレビュー導線**を決める。端末実機の検索・生成・コピー・印刷が未検証のまま、既存mainへのマージや公開Pagesの上書きを行わない。

**復帰時の順序**：
1. main最新HEAD、PR #40最新HEAD、GitHub Actions、PR #39/#41と画像制作ブランチの変更状況を再照合。
2. PR #40でキャンセルされたE2Eの合否を確認。必要なら最小の修正を**PR #40内のみ**へ。
3. 公開を伴わない検証可能な範囲を終え、HTTPS実機プレビューをどう実現するか決定（本番上書きは別承認）。
4. Safari実機受入が取れた節目で[全体マスター](../APP003_MASTER_PLAN_PROGRESS.md)と共通台帳\`moyashimisosoup/session-deck/docs/APP_PORTFOLIO.md\`を更新。他担当のDraft PR #41の記録を無条件にmainへ重複反映しない。

## 6. 停止時の保全境界

- **今回の引継ぎ操作で新しいWebアプリ機能の実装・CI実行・PR #40の更新・mainへのマージ・Pages公開はしない**。
- この文書は公開可の技術引継ぎ情報のみ。書込み後に固定GitHub URLから再読込みできた場合に限り「この文書をGitHubに保存・確認した」と記録する。非公開セッション本文のバックアップではない。
