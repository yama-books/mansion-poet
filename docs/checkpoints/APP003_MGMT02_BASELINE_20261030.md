# APP-003 / MGMT-02｜監理開始・残工程CHECKPOINT（2026-10-30 JST）

状態：**MANAGEMENT BASELINE RECORDED / iPhone Safari REAL-DEVICE QA PENDING / NO PRODUCTION CHANGE**
担当ID：`APP-003/MGMT-02`（Session Deckの正式work_id登録は未確認）
正本：[`yama-books/mansion-poet`](https://github.com/yama-books/mansion-poet)
確認基点：main `ee45852d785b724f51f1f12397efaa85bf1798f1`
本記録は管理専用ブランチ上のCHECKPOINTであり、mainへの統合・Pages配信・実機受入を意味しない。

## 1. 現行main・PR・CIの再照合

- 引継ぎ文書内の基点 `833b15af30921f0a302c47aa796427b9a5567cca` から最新main `ee45852d785b724f51f1f12397efaa85bf1798f1` までは **1コミット、追加1ファイルのみ**（`docs/handoff/APP003_MANAGEMENT_HANDOFF_20261028.md`）。アプリコードの差分はない。
- 既存の [PR #45](https://github.com/yama-books/mansion-poet/pull/45)・[PR #46](https://github.com/yama-books/mansion-poet/pull/46) は merged。SVG版A4／既存広告生成・施設紹介／ギャラリー19点は前工程の完了資産であり再実装しない。
- 取得したGitHub Actionsジョブ：[Mobile #40587881902](https://github.com/yama-books/mansion-poet/actions/runs/40587881902) completed/success、[Mobile #40588649362](https://github.com/yama-books/mansion-poet/actions/runs/40588649362) completed/success、[Pages #40588978832](https://github.com/yama-books/mansion-poet/actions/runs/40588978832) のPublish websiteジョブ completed/success。直近HEADは文書のみの更新であり、main HEADへのPR-triggered CI照会は空だった。Web配信の新しい独立HTTP検証、iOS実機の印刷試験を今回実施したことにはしない。
- open PR 13件：#30, #31, #32, #33, #34, #37, #38, #39, #40, #41, #42, #43, #44。mainへの一括再マージ禁止。
- 全体マスタープラン冒頭の2026-10-28最新ステータスが正。下部2026-10-22実装表、画像案内板の旧「ASSET-ART-01制作中」は履歴上の記述。独立ART原画3点は [Draft #43](https://github.com/yama-books/mansion-poet/pull/43) 保管済み、本番採用は未承認。

## 2. 旧PRの一次重複監査（実ファイルSHA確認）

| PR | 比較・確認内容 | 判断 |
| --- | --- | --- |
| #31 PRINT03-CORE | `src/print-layout/render-core.js` はmainと完全同一blob `622b3141`。一方、`presentation-data.js`、`templates.js`、`print-layout.css` は異なる | エンジンはmainで利用中。差分の意味を個別審査し、旧ツリー一括統合禁止 |
| #39 PRINT03-IMG-01 | `img01-preview.js` はmainと別blob（main `3732e315`、PR `5318dc7c`）。参考画像・ART仮評価のプレビューを含む | 試作記録として保持。未承認ARTをmainで公開しない |
| #40 UI01-MOBILE | `poem-catalog.js`（`7252eb40`）と`location-highlights.js`（`563dacbe`）はmainと同一blob。旧`index.html` はmainと異なる | 文章200種や施設処理の重複移植なし。UI差分は現行公開仕様との比較で審査 |
| #44 LIVE-PRINT03 | `index.html`（`b6584eb2`）、`templates.js`（`06dd015d`）、`live-app.css`（`d0343665`）はmainと同一。`live-app.js` はmainと別blob（main `18d82563`、旧 `94e9d239`） | 旧ブランチ全体の統合禁止。現行本体接続を再実装しない |
| #30/#33 | 画像取り込みパイプラインと認可メディアスロットの独立試作 | 本番採用前に必要箇所のみ審査 |
| #32/#34/#37/#38 | 文面改善、組版レシピ、REF記録、ART分離契約の各資料 | 計画/コード重複確認後に文書整理。画像の許諾区分を変えない |
| #41/#42 | 旧時点の進捗記録・引継ぎ資料 | main最新版の正本と齟齬がある場合は履歴として維持 |

差分ファイルがあることは「mainに機能未実装」の証明ではない。より新しい安全対策や公開境界を破壊しない。

## 3. 優先作業・責任境界・完了条件

| 優先 | 作業ID | 次工程とDONE条件 |
| --- | --- | --- |
| P0 | `APP-003/QA-IOS-01` | iPhone Safariで実際の公開アプリを操作し、1件の地点選択→文章/施設表示→案3・A4プレビュー→印刷/保存→日本語/ページ数を確認。地点切替後の前地点の出力失効を確認。人手結果と必要なら画面写真を受領し、PASS/FAILを明記 |
| P1 | `APP-003/PRINT03-LONG-01` | 長名F03のA4 2ページ問題を修正検討。通常例は1ページを保持し、長名に対しても欠落・切れ・過度な縮小・出典消失のない1ページ化を優先。達成不能な入力の退避条件を明示し、実測PDF回帰＋通常ケースで確認。CSSで2ページ目を隠すのは禁止 |
| P1 | `APP-003/PR-AUDIT-01` | open13件を重複/独立価値/要移植/履歴保管に分類、必要な差分だけ抽出。旧PRを自動close/mergeしない |
| P2 | `APP-003/ART-REVIEW-01` | #43の独立原画3点を広告枠へ隔離合成しクロップ、実効ppi、Web速度、SVG fallback、権利・安全を評価。本番採用は別の明示承認 |
| P3 | `APP-003/ROADMAP-01` | 地理POI、主役一致、文芸品質、住所・距離と徒歩経路、テーマ/UIの残作業を現行mainベースで代表ケース確認後、価値順に再配置 |

## 4. iPhone Safari受入の操作（ユーザー向け短縮版）

1. iPhoneのSafariで https://yama-books.github.io/mansion-poet/ を開く。適当な地点を選び、生成後のポエムと施設を確認。
2. 印刷選択で案3「新しいA4広告」を開く。プレビューが見え、ステータスが正常で、A4は通常1ページかを確認。
3. 「この紙面を印刷 / PDF」からiOSの印刷画面へ進み、プレビュー・ページ数・文字の欠落を確認。印刷プレビューを拡大して共有から「ファイルに保存」でPDF保存を試す。実際に紙へ印刷する必要はない。
4. 地点を変えて旧A4が残らないことを確認。結果を `生成可 / A4可 / ページ数 / PDF保存可 / 地点切替可` で報告。FAIL時のみスクリーンショット添付。

この操作を担当ユーザーが実施するまで、`iOS Safari PASS` とは記録しない。

## 5. 次の実装指示（計画のみ・未着手）

`APP-003/PRINT03-LONG-01` は、最新版main起点の独立ブランチで `src/print-layout/print-layout.css`、`src/print-layout/paginate.js`、`src/print-layout/templates.js` 等の組版ルールを最小変更。F03長名、通常名、施設0件で自動PDFと文面欠落を対照し、1ページ化可能な条件を明文化。APP-003本体接続と公開済み安全制御、19点ギャラリーに触れない。修正結果が固まるまでmain統合/Pages公開はしない。

## 6. 今回の操作境界と次の一手

- 管理用ブランチと本CHECKPOINT以外にアプリ本体の変更なし。未承認ARTの公開、旧PRのmerge/close、実機PASS宣言、全体完成率の算出を行わない。
- このCHECKPOINTのmainへの統合は保留。main上のマスタープラン・共通台帳には現時点で新たな完成事実が生じていないため、旧情報の書換えを急がない。
- 次の1操作：**ユーザーのiPhone Safari 1件受入結果を回収**し、FAILなら要因を優先度P0で切り分け、PASSならP1長名修正を先行する。
