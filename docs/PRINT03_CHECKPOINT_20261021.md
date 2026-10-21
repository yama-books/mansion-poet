# PRINT03-CORE｜CHECKPOINT（2026-10-21、監査元への報告）

担当：Claude Code（ローカル）／指示：[LOCAL_EXECUTION_ASSIGNMENTS 第2節](LOCAL_EXECUTION_ASSIGNMENTS_20261019.md)／詳細仕様：[PRINT03_CORE_20261020.md](PRINT03_CORE_20261020.md)

## 1. 作業場所と成果の所在

| 項目 | 値 |
|---|---|
| 作業フォルダ | `D:\dev\worktrees\mansion-poet-print03`（独立clone。`D:\dev\mansion-poet` 自体はGitリポジトリではなかったため。画像担当の `D:\dev\mansion-poet\img-pipe-01` とは別） |
| ブランチ | `work/app003-print03-core-20261020`（`origin/main` 39ce37f から分岐、main未更新のため再分岐不要） |
| PR | [yama-books/mansion-poet#31](https://github.com/yama-books/mansion-poet/pull/31)（Draft・未マージ） |
| commit | c7040a8 → 9d79246 → 1f3d222 → aa5dfac → 02a156c → ff66ab6 → 868c254（本書）→ 1c1d255（監査修正、§8） |
| 変更していないもの | `index.html`、`src/poem-catalog.js`、`src/location-highlights.js`、`src/subject-policy.js`、画像パイプライン、main |
| 担当範囲外の変更 | `.github/workflows/quality.yml` に `tests/print-layout/*.test.mjs` を1行追加（計画書「独立でCIへ載せる」に基づく） |

## 2. 状態（別々に記録）

| 項目 | 状態 |
|---|---|
| 実装 | 済（§3） |
| Nodeテスト | 195件成功（新規65、既存130）、ローカル Node 24.19（2026-10-21 再監査後、1c1d255） |
| CI | PR #31 の `test` 成功：1c1d255（run 39561802831、195件 pass / 0 fail）。前回 868c254 も成功（192件） |
| ローカル実PDF | 1c1d255 のコードで **53/53合格**（1回の全体実行、単独再実行なし。2026-10-21 23:10–23:25、Edge 155.0.4283.62 headless、Windows 11、ネットワーク接続下、§8-3）。868c254 の 53/53 と全件一致。合格条件：DOMプリフライト合格、PDFページ数＝DOMページ数、全ページA4、必須文字列（ポエム全行・カード全項目・注記・出典）のPDFテキスト層欠落0 |
| index.html への接続 | 未実施 |
| Pages配信・Safari/iPhone実機印刷 | 未確認 |
| PDF/X・CMYK | 未対応（Consumer PDFのみ） |
| Jev完了監査 | 未送信。`jev-audit-pack.ps1` が send_allowed=false（作業フォルダが常設承認外、代入パターン4件の検出）。各回 skipped として記録 |

## 3. 実装内容（`src/print-layout/`）

- **データ契約** `print03.v1`：生成トークン不一致の拒否（H-07）、ポエムとLOCATION 01の主役一致（SELECT-01）、経路確認なしの徒歩分の拒否（H-03）、価格・間取り等の拒否（H-08）。出力はテキストノードのみ、属性は許可リスト。
- **3版型**：type_poem（文字主役型・完成）、editorial（高級誌面型・骨格）、location（ロケーション型・骨格）。
- **組版**：A4一枚を最優先。細字（住所・出典・注記）は7.5pt、最終段で6.5ptまで。創作注記と柱は8pt下限。収まらなければ表裏構成（表面＝広告、裏面＝位置関係図・補助カード全文・注記）、それでも収まらない場合のみ複数ページ。
- **位置関係図と地図**：座標から北が上・実縮尺で作図し、国土地理院タイル（淡色地図）を下に敷く。座標と表示距離が食い違う場合は図を描かない。タイルが1枚でも読めなければ地図なしの図に戻る。出力できるURLは地理院タイルのみ。
- **出典**：紙面末尾の「SOURCES / 出典」に集約。
- **周辺の施設**（`neighborhood.js`）：アプリ取得済みのPOIから最大7件（04〜）を選んで裏面の地図・凡例に掲載。魅力的な施設→足りなければ日常の施設で埋める。都市設備31ジャンルから生成ごとに0〜2件をランダムに混ぜる（種は生成トークン）。医療機関は名称・距離のみで1件まで。福祉・介護・精神保健・宗教施設等は除外。

## 4. ユーザー決定の記録

| 日付 | 決定 |
|---|---|
| 2026-10-20 | 読みやすさ基準より実際のチラシの詰め込み感を優先し、A4一枚を最優先。収まらない場合は表裏構成 |
| 2026-10-20 | 裏面に、施設との関係が分かる図面を置く |
| 2026-10-20 | 地図を入れる。ポエムを楽しむと同時に、住む場所の環境を調べる道具としても使えるようにする |
| 2026-10-21 | 印刷機能は個人向け。地理院タイルは出典を明示して利用。出典は末尾にまとめる |
| 2026-10-21 | 周辺施設はA案（裏面の地図に追加、表面のカードは3件のまま） |
| 2026-10-21 | 都市設備は必ずではなくたまに出るランダム要素。約30ジャンル。魅力的な施設が少ない地点は他の施設で埋める |
| 2026-10-21 | 病院は過大な表現なしなら掲載可 |
| 2026-10-21 | ポエム本文の「データ」的な言い回しを、ポエムの紹介文らしい表現に改める方針を承認（実施は別PR） |

## 5. 未実施・引継ぎ（優先順）

1. **ポエム本文の言い回し修正**（2026-10-21 実施、[yama-books/mansion-poet#32](https://github.com/yama-books/mansion-poet/pull/32) Draft、§8-4）：旧記述→`src/poem-catalog.js:60`「周辺の公開データに記された『◯◯』。」、`index.html:928`「◯◯など、近隣で確認された風景や施設。」、`index.html:930`「◯◯が近隣にあることも…」。置換案は [PRINT03_CORE §2.3](PRINT03_CORE_20261020.md)。印刷PRとは別ブランチ・別PRで行い、着手前に他担当が `index.html` を同時に編集していないかを確認する。
2. **取得条件の拡充**（`index.html`、提案のみ）：表裏印刷時のOSM補完の常時実行と店舗・郵便局・医療等の追加、都市設備31ジャンルの取得（`overpassPlainQuery()` 利用）と分類表の追加。
3. **index.html への接続**：PRINT STYLE への追加、`fromAppSnapshot()` への値の受け渡し（重複除去後の全POI・座標・生成トークン）、表裏を既定にするかどうかの決定。
4. 実機確認：Safari / iPhone の印刷、6.5pt細字の実紙での可読性。
5. editorial・location 版型の本格デザイン（画像素材 IMG-00 の受入後）。

## 6. 再現方法

```text
node --test tests/*.test.mjs tests/print-layout/*.test.mjs
node tests/print-layout/run-browser-qa.mjs     # Edge/Chrome と PyMuPDF が必要、出力は tests/print-layout/output/（gitignore）
node tests/print-layout/qa-tools/run-browser-qa-pwsh.mjs   # 上が全件 "no report in DOM" / PDF未生成になる Windows 環境用（§8-3）
tests/print-layout/preview.html                # ローカルプレビュー（fixture・版型・表裏・地図の切替）
```

## 7. 次の1操作

両PRはレビュー可能状態（Draft解除済み、2026-10-21）。両PRを結合した状態の Node 回帰テストは 197/197 成功（§8-8）。次は監査元がコードレビューとマージ可否を判断する。

## 8. 再監査（2026-10-21 第2セッション）

### 8-1. 開始時の照合

| 項目 | 値 |
|---|---|
| origin/main | 39ce37f（PR #31 分岐元から変化なし） |
| PR #31 | Draft・MERGEABLE、HEAD 868c254、CI成功 |
| PR #30（画像） | Draft、`work/app003-img-pipe-01-20261020` d0a7dc2。画像パイプラインのみで本PRと重なるファイルなし。今回も未接触 |
| 作業フォルダ | 既存clone再利用、未コミット変更・stash なし |

### 8-2. 監査結果（重点9項目）

| # | 項目 | 結果 |
|---|---|---|
| 1 | POEMとLOCATION 01の主役一致 | 問題なし（`mainSubjectId` と `locations[0].sourceId` の不一致を検証で拒否） |
| 2 | 地点変更時の旧データ | **修正**：`mountWithMap()` はタイル先読みの待ち時間があり、その間に新しい地点の描画が始まっても、古い呼出しが後から同じ容器に旧紙面を組んでしまう余地があった。容器ごとに最新の呼出しを記録し、古い呼出しは H-07 で中止する。トークン照合（`expectedToken`）は従来どおり |
| 3 | 直線距離・施設位置・地図座標の整合 | 問題なし（座標由来距離と表示距離が25m／15%超で食い違えば図を描かない。周辺施設も同条件で除外） |
| 4 | 地理院タイル欠損時 | 問題なし（1枚でも失敗で地図なしの図に戻り、地図出典・地図注記も出ない。mapfail のPNGで確認） |
| 5 | 本文・施設名・住所・出典・注記の欠落 | 問題なし（必須文字列の照合。単面・表裏で別集合） |
| 6 | 表裏切替と長文の複数ページ | 問題なし（1枚→表裏→ブロック単位の複数ページの順。行・カードの途中では切らない） |
| 7 | 保護対象・分類未確定施設の復帰 | **修正**：医療例外が `healthcare=psychotherapist` 等（心理療法・カウンセリング・代替医療など）も医療機関として復帰させていた。明示の `healthcare=*` は病院・診療所・歯科・薬局に限定し、名称除外語（メンタル・カウンセリング・特別支援・発達・困窮・被害者・難病）を追加。SubjectPolicy 例外は理由が1件だけの場合に限定（`includes` では将来理由が増えた際に他の理由を素通りさせるため）。分類未確定（low/medium・flag付き）は従来どおり除外 |
| 8 | ランダム選択の再現性 | 問題なし。同じ生成トークン＋POIの並び順違いで同一結果になるテストを追加。`fromAppSnapshot()` の注記に `seed: generationToken` を明記 |
| 9 | 6.5pt細字・創作注記8pt | 設計どおり（6.5ptは最終段 fit-4 の住所・出典・注記のみ。`.pl-creative` と柱は8pt固定、プリフライトで検査）。ただし地図SVG内の番号・距離ラベルはプリフライト対象外（下記） |

修正commit：**1c1d255**（`neighborhood.js`、`paginate.js`、`presentation-data.js` の注記1行、テスト3件追加）。描画結果は120通りすべて修正前と同一。

### 8-3. 実ブラウザPDFの再検証

**結果：1c1d255 のコードで 53/53 合格（1回の全体実行）、868c254 の結果と全件一致。**

| 項目 | 内容 |
|---|---|
| 実行環境 | Edge 155.0.4283.62 headless（ユーザー承認のうえ常駐の旧Edgeプロセスを終了し、更新を適用）、Windows 11、PowerShell 7、Node 24.19、Python 3.13 + PyMuPDF、地理院タイル取得のためネットワーク接続下 |
| 比較 | 全53ケースで、合否・DOM/PDFページ数・構成（単面／表裏／複数）・fit段階・最小文字サイズ・創作注記の文字サイズ・地図タイル（使用・枚数・失敗数）・必須文字列の欠落数・位置関係図の有無が前回と同一 |
| 重点ケース | 神保町3施設 表裏：2p L0/2、地図9枚。京都長名 表裏：2p L0/2。施設0件：1p L0（地図なし・空欄なし）。長文：3p 複数ページ L2、「前頁より続く」表示。白黒 表裏：2p L0/2、地図はグレーで判読可。地図取得失敗：2p、地図なしの図に戻り、地図出典なし（9枚中9枚失敗の模擬） |
| 文字サイズ | 最小7.0pt（editorial・location のL3）。6.5pt（L4）に達したケースはなし。創作注記は全件8pt |
| 証跡 | `tests/print-layout/qa-records/`：`qa-report-868c254.json`（前回）、`qa-report-1c1d255-run2.json`（今回の正式結果）、`qa-report-1c1d255-run1.json` と `qa-report-1c1d255-F09-rerun.json`（下記の不具合を含む1回目と、その単独再実行。経緯の記録） |

#### 再現手順（Edge 155 / この Windows 環境）

1. 事前確認
   - Edge が更新待ちでないこと：`C:\Program Files (x86)\Microsoft\Edge\Application\` に `new_msedge.exe` があれば更新待ち。この状態では headless 起動が何も出力せずに終了する。常駐の `msedge.exe` をすべて終了すると更新が適用される（ユーザーのブラウザ作業が閉じるため、必ず本人の了承を得る）。
   - `pwsh`（PowerShell 7）・Node 22以上・`python -c "import pymupdf"` が通ること。
2. まず標準の手順を試す：`node tests/print-layout/run-browser-qa.mjs`
   - 全件が `dom=-p ... ERR ... no such file ...pdf` になる場合は、この環境の制約に該当する。症状：Node から直接起動した Edge が何も出力せずに終了する（`spawnSync`・`cmd /c start` 経由でも同じ）。`--dump-dom` の標準出力も、リダイレクト先では空になる。PowerShell の `Start-Process` から起動した場合だけ PDF が出る。
3. その場合は代替ランチャーを使う（リポジトリ内、`run-browser-qa.mjs` 本体は無変更）：
   ```text
   node tests/print-layout/qa-tools/run-browser-qa-pwsh.mjs
   node tests/print-layout/qa-tools/run-browser-qa-pwsh.mjs --only F09_jimbocho_mono --out <一時フォルダ>   # 試験データ単位
   ```
   - `--print-to-pdf` の呼出しは `pwsh` の `Start-Process -Wait` 経由で起動する。PDF と検査（`check_pdf.py`）は標準手順と同一。
   - `--dump-dom` の呼出しは、`--remote-debugging-port=9333`（環境変数 `PRINT03_CDP_PORT` で変更可）で一度だけ起動した headless Edge から、`qa-tools/cdp-dom.mjs` が DevTools プロトコルで取得する。`preview.html` の `#pl-report` が初期値 `null` から実際のレポートに置き換わるまで最大60秒待ち、`outerHTML` を返す。
   - Edge は一時プロファイルで起動し、終了時にそのプロファイルの Edge だけを停止する。ユーザーの Edge には触れない。
   - 失敗の調査には `PRINT03_QA_DEBUG=1` を付けて実行する。DOM取得の失敗理由が標準エラーに出る。
   - 所要時間：53ケースで約15分。
4. 前回結果との比較：
   ```text
   node tests/print-layout/qa-tools/compare-qa-reports.cjs tests/print-layout/qa-records/qa-report-868c254.json tests/print-layout/output/qa-report.json
   ```
   - 全ケースが合格かつ一致なら終了コード0。単独再実行の結果で差し替える場合は `--replace <再実行のqa-report.json>` を付ける。

#### 1回目の実行で起きた不具合（記録）

- 最初の代替ランチャー（作業用フォルダ版）での全体実行は 52/53 だった。「白黒・表裏」の1件で DOM レポートが取れなかった（PDF は2p・A4・欠落0）。この試験データを単独で再実行すると 5/5 合格した。
- 原因：DOM 取得側の待機条件の誤り。`#pl-report` が空でなければ完了と判断していたが、初期値は `null` のため、描画完了前に読むことがあった。紙面や印刷エンジンの不具合ではない。
- 待機条件を「`null` 以外になるまで」に修正した版を `qa-tools/` に保存した。修正後、F04 の5ケースを4回繰り返して 20/20 合格し、全53ケースを1回の実行で合格した（run2）。

目視（今回生成のPNG）：
- 文字階層（見出し→物件名→ポエム→主役カード→補助カード→注記）と読順は良好。
- 地図取得失敗時は淡色地図と地図出典が消え、注記が「地図データは使用していません」に切り替わる。
- 白黒版の地図はグレースケールで、番号・円が判読できる。
- 所見（デザイン受入で判断、未修正）：
  - 裏面地図の周辺施設番号（04〜）と距離目盛りが、SVG内で約5pt相当と小さい（プリフライトの6.5pt下限はSVG外のみが対象）。
  - 1枚版は下部の余白がやや大きい。
  - 長文の3ページ目は下半分が空白。

実機 Safari / iPhone：未確認。PDF/X・CMYK：対象外。

### 8-4. ポエム文言修正（別PR）

- ブランチ `work/app003-poem-wording-20261021`（origin/main 39ce37f から）、[yama-books/mansion-poet#32](https://github.com/yama-books/mansion-poet/pull/32) Draft、commit 0a58838。
- `src/poem-catalog.js` の1行目を3種の広告文（生成番号で切替、施設名は「」で保持）、強度90以上の結び「事実」→「日常」。`index.html` は汎用ポエムの2行のみ。630件の詩句は不変。
- 着手時、`index.html` を変更中のオープンPRなし（#30・#31 とも非接触）。
- テスト：132件成功（既存130＋新規2）。主役一致・コピー機能の既存テストは無変更で成功。

### 8-5. 各HEAD（記録時点）

| 参照 | HEAD |
|---|---|
| origin/main | 39ce37f |
| PR #31 `work/app003-print03-core-20261020` | 本書更新commit（057467a の次。`src/` と既存テストは 1c1d255 から不変、追加は `tests/print-layout/qa-tools/`・`qa-records/` と文書のみ） |
| PR #32 `work/app003-poem-wording-20261021` | 0a58838 |
| PR #30 `work/app003-img-pipe-01-20261020` | d0a7dc2 |

### 8-6. 未完了・未確認

1. （済）1c1d255 のコードでの実ブラウザPDF再実行：53/53（§8-3）。
2. Safari / iPhone 実機印刷、6.5pt細字と地図内ラベルの実紙での可読性：未確認。
3. **未解決のデザイン受入事項**（いずれも未修正、デザイン受入で判断。§8-3 目視）：
   - 裏面地図内の周辺施設番号（04〜）と距離目盛りが約5pt相当（プリフライトの6.5pt下限はSVG外の文字のみが対象）。
   - 1枚版の下部余白（神保町で紙面下部の約1/5が空白）。
   - 長文（F06）3ページ目の下半分の余白。
4. （済）両PR（#31・#32）を結合した状態での Node 回帰テスト：197/197 成功（§8-8）。結合状態でのブラウザPDF検証は未実施（印刷エンジンは #32 の変更ファイルを読み込まないため、影響なしの見込み）。
5. Jev完了監査：`jev-audit-pack.ps1` が send_allowed=false（not_in_standing_approval）のため未送信、skipped として記録。
6. index.html への印刷エンジン接続、POI取得条件の拡充（§5-2・5-3、今回対象外）。

### 8-7. 両PRを結合した状態の回帰テスト計画（2026-10-21 実施、結果は §8-8）

事前の確認（読み取りのみ、2026-10-21 実施）：
- 変更ファイルの重なり：なし。PR #31 は `src/print-layout/`・`tests/print-layout/`・`docs/PRINT03_*`・`.github/workflows/quality.yml`。PR #32 は `index.html`・`src/poem-catalog.js`・`tests/poem-catalog.test.mjs`・`tests/location-races.test.mjs`。
- `git merge-tree --write-tree origin/work/app003-print03-core-20261020 origin/work/app003-poem-wording-20261021`：衝突なし（終了コード0）。

手順（mainへの統合前に実施。ブランチや作業ツリーを書き換えない方法）：
1. `git fetch origin`。両PRと origin/main の HEAD を記録する。`git status` と `git stash list` で、既存の作業フォルダに未保存変更がないことを確認する（ある場合は触らない）。
2. 結合ツリーを作る：`git merge-tree --write-tree <PR31 HEAD> <PR32 HEAD>`。出力1行目が結合ツリーのIDで、終了コード0なら衝突なし。両PRとも origin/main 39ce37f から分岐しているため、この1回で main＋両PRの状態になる。main が進んでいた場合は、先に各PRを最新mainへ追従させてから行う。
3. 結合ツリーを一時フォルダへ展開する（`git archive <tree> | tar -x -C <一時フォルダ>`）。ブランチ・worktree・push は作らない。
4. 一時フォルダで `node --test tests/*.test.mjs tests/print-layout/*.test.mjs` を実行する。期待値は197件成功（main 130、PR #31 +65、PR #32 +2）。件数と失敗を記録する。
5. `.github/workflows/quality.yml`（PR #31 が print-layout テストを追加）が結合後も両方のテストを拾うことを、同じコマンドで確認する。
6. 印刷エンジンは `poem-catalog.js`・`index.html` を読み込まないため、ブラウザPDF検証は結合で変わらない見込み。確認する場合は一時フォルダで `qa-tools/run-browser-qa-pwsh.mjs` を実行し、`compare-qa-reports.cjs` で `qa-report-1c1d255-run2.json` と比較する。
7. 結果を本書に記録し、一時フォルダを削除する。いずれかが失敗した場合は統合しない。原因のPRで修正する。

### 8-8. 結合回帰テストの結果（2026-10-21）

**結果：197/197 成功（失敗0）。期待値（main 130＋#31 65＋#32 2）と一致。**

| 項目 | 内容 |
|---|---|
| 対象 | origin/main 39ce37f、PR #31 HEAD 205170a（CI成功、195件）、PR #32 HEAD 0a58838（CI成功、132件）。両PRの分岐元はどちらも 39ce37f |
| 事前確認 | 作業フォルダ：未保存変更なし、stash なし |
| 結合 | `git merge-tree --write-tree 205170a 0a58838` → 終了コード0（衝突なし）、ツリー `252abca2fc228c35e677c0fbc3537274c102ae65`。PR #31 からの差分は PR #32 の4ファイルのみ（`index.html`、`src/poem-catalog.js`、`tests/location-races.test.mjs`、`tests/poem-catalog.test.mjs`、+35/−4。PR #32 単体の差分と同一） |
| 展開 | `git archive 252abca | tar -x` で一時フォルダへ（123ファイル）。ブランチ・worktree・push は作っていない |
| 実行 | 結合ツリーの `.github/workflows/quality.yml` と同じコマンド `node --test tests/*.test.mjs tests/print-layout/*.test.mjs`、Node 24.19.0、Windows 11 |
| 内訳 | location-highlights 13、location-races 69、poem-catalog 15、subject-policy 35、print-layout 65（いずれも失敗0） |
| 追加テストの実行確認 | #32：「generic poem keeps the chief facility name…」「POEM-01 the facility name opens the poem as ad copy…」。#31（再監査）：医療例外の限定、POI並び順に依存しない抽選、古い地図描画の中止。いずれも成功 |
| 後始末 | 一時フォルダは削除済み。結合ツリーはどの参照からも指されていない（`git gc` で消える一時オブジェクト） |

未実施：結合状態での実ブラウザPDF検証（§8-7 手順6）。印刷エンジンと試験データは `poem-catalog.js`・`index.html` を読み込まないため、PDF結果は変わらない見込みだが、実測はしていない。
