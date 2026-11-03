# APP-003 / INTEGRATE-01 CHECKPOINT

2026-11-04 JST / 監理 APP-003/MGMT-02 / 公開候補の統合検証。Draft継続、正式公開ではない。

## 基点と統合対象

GitHub fetchで最新main `ee45852d785b724f51f1f12397efaa85bf1798f1` を確認。mainにAGENTS.mdは存在せず、依頼で提示されたAGENTS.mdを適用。専用worktree `integration-01`、branch `feature/app003-integration-01-20261104` を新設。既存worktreeは破棄・切替していない。

| PR | 照合したHEAD | 個別CI |
|---|---|---|
| #47 PRINT03-FIT-01 | f286e97f0b57040b96cd11cc5c5f5f7ee5c90e96 | quality/mobile SUCCESS |
| #48 BROWSER-RECOVER-01 | a6592323a8d69c509d819a7625786b4997edf150 | quality/mobile SUCCESS |
| #49 POEM-RAND-01 | 24d6faf1a6d79ff0360a59d38b93bd99721a04c1 | quality/mobile SUCCESS |
| #50 PRINT03-IMG-02 | 6ca3ea9d464c15ff08b06c7fb73ae6e720dce0ea | quality/mobile SUCCESS |
| #51 ASSET-STOCK-01（参照のみ） | 6f943bcf2536804ac448c336b9310bad81d5425d | 保管受領済。統合対象外 |

#47→#48→#49→#50の差分を順に取り込み。`live-app.js`の競合は実測fit→印刷→復帰イベント処理へ統合。`live-app.css`ではnamed A4 page・祖先の高さ解除・ラスタ枠を併存。mobile-device-qaにはfit/recovery/rasterの3テストを全て残した。indexのseed追加とraster依存追加は併存。Pagesの承認済み画像のみの梱包処理を維持し、非公開のCIプレビュー梱包にも同処理を追加。公開workflowの起動条件はmain pushのまま。

旧PR #30〜#44の一括統合、main統合、Pages公開、既存PRの閉鎖・削除は実施していない。

## 検証記録（保存時点）

- `node --test tests/*.test.mjs tests/print-layout/*.test.mjs`: 213/213 PASS、exit 0。
- `node --test tests/reference-gallery/*.test.mjs`: 15/15 PASS、exit 0。
- reference-library Python unittest: 6/6 PASS、reference-gallery unittest: 4/4 PASS、exit 0。
- Edge `print-fit.cjs`: 390/1280px、SVGのnative A4 PDF各1ページ、紙面全文保持、実測997.984px中936.656px、密度段階進行と過大内容の印刷拒否PASS。
- Edge `print-recovery.cjs`: 390/1280px、afterprint/pageshow/visibilitychange/focus/media-exit/print例外の6経路PASS、DOMとボタン同一性維持。再表示で文章固定、再生成で文章変化、別地点（京都）で生成可能。公開ホスト名ではSVGのみ・承認済み画像0件PASS。
- Edge `raster-print.cjs`: 合成試験画像のみ使用。390/1280px、画面650px→印刷2600pxの画像切替、焦点30%/70%、SVG写真化なし、native A4 PDF各1ページ・全文保持PASS。本番画像の採用・画質承認ではない。
- `node scripts/print-assets/package.cjs artifacts/package-check`: approvedAssets=0 / packagedRenditions=0、exit 0。
- 結合CI、追加PDF文字検査、Jev完了監査の最終結果は後続追記する。

Windows旧PDFランチャーの直接起動ではDOM/PDF生成に失敗。PowerShell版も起動待ちになるため、同じ既存fixtureとcheck_pdf.pyをPlaywright起動で再利用する。既存viewport/full-flowのローカル別プロセス配信にも接続問題があり、結合CI結果と区別して記録する。回復済みの起動失敗をアプリの不具合やSafari不合格と断定しない。

## 保全・未完了

200種の導入文と既存施設・コピー・広告生成を保持。参考ギャラリー19点とmanifestはmainから変更なし。標準SVGと旧印刷形式を保持。承認済みraster manifestは空のまま。#51の原画・サムネイルは取り込まない。[原画10点の用途・ppi整理](../APP003_INTEGRATE01_STOCK_USAGE_20261104.md)を次工程へ渡す。

iPhone実機Safariの印刷/PDF保存・キャンセル・復帰、実紙での細字可読性、正式公開判断、画像の使用権・本番採用は未検収。極端な長名は既存の非破壊的複数ページ退避を許容し、任意の文章が必ず1ページとは宣言しない。単純拡大を高精細化の成功と扱わない。

ロールバックは本PRを採用しない、または統合差分をrevertする。永続データ移行なし。次の操作は結合CIとPDF検査の結果を本CHECKPOINTへ追記し、GitHubから読戻すこと。
