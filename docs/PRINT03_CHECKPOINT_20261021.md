# PRINT03-CORE｜CHECKPOINT（2026-10-21、監査元への報告）

担当：Claude Code（ローカル）／指示：[LOCAL_EXECUTION_ASSIGNMENTS 第2節](LOCAL_EXECUTION_ASSIGNMENTS_20261019.md)／詳細仕様：[PRINT03_CORE_20261020.md](PRINT03_CORE_20261020.md)

## 1. 作業場所と成果の所在

| 項目 | 値 |
|---|---|
| 作業フォルダ | `D:\dev\worktrees\mansion-poet-print03`（独立clone。`D:\dev\mansion-poet` 自体はGitリポジトリではなかったため。画像担当の `D:\dev\mansion-poet\img-pipe-01` とは別） |
| ブランチ | `work/app003-print03-core-20261020`（`origin/main` 39ce37f から分岐、main未更新のため再分岐不要） |
| PR | [yama-books/mansion-poet#31](https://github.com/yama-books/mansion-poet/pull/31)（Draft・未マージ） |
| commit | c7040a8 → 9d79246 → 1f3d222 → aa5dfac → 02a156c → ff66ab6（6件、45ファイル、+2339/−1） |
| 変更していないもの | `index.html`、`src/poem-catalog.js`、`src/location-highlights.js`、`src/subject-policy.js`、画像パイプライン、main |
| 担当範囲外の変更 | `.github/workflows/quality.yml` に `tests/print-layout/*.test.mjs` を1行追加（計画書「独立でCIへ載せる」に基づく） |

## 2. 状態（別々に記録）

| 項目 | 状態 |
|---|---|
| 実装 | 済（§3） |
| Nodeテスト | 192件成功（新規62、既存130）、ローカル Node 24 |
| CI | PR #31 の `test` 成功（最新 ff66ab6） |
| ローカル実PDF | 53/53合格（Edge headless、Windows 11、地理院タイル取得のためネットワーク接続下）。合格条件：DOMプリフライト合格、PDFページ数＝DOMページ数、全ページA4、必須文字列（ポエム全行・カード全項目・注記・出典）のPDFテキスト層欠落0 |
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

1. **ポエム本文の言い回し修正**（承認済み・未着手）：`src/poem-catalog.js:60`「周辺の公開データに記された『◯◯』。」、`index.html:928`「◯◯など、近隣で確認された風景や施設。」、`index.html:930`「◯◯が近隣にあることも…」。置換案は [PRINT03_CORE §2.3](PRINT03_CORE_20261020.md)。印刷PRとは別ブランチ・別PRで行い、着手前に他担当が `index.html` を同時に編集していないかを確認する。
2. **取得条件の拡充**（`index.html`、提案のみ）：表裏印刷時のOSM補完の常時実行と店舗・郵便局・医療等の追加、都市設備31ジャンルの取得（`overpassPlainQuery()` 利用）と分類表の追加。
3. **index.html への接続**：PRINT STYLE への追加、`fromAppSnapshot()` への値の受け渡し（重複除去後の全POI・座標・生成トークン）、表裏を既定にするかどうかの決定。
4. 実機確認：Safari / iPhone の印刷、6.5pt細字の実紙での可読性。
5. editorial・location 版型の本格デザイン（画像素材 IMG-00 の受入後）。

## 6. 再現方法

```text
node --test tests/*.test.mjs tests/print-layout/*.test.mjs
node tests/print-layout/run-browser-qa.mjs     # Edge/Chrome と PyMuPDF が必要、出力は tests/print-layout/output/（gitignore）
tests/print-layout/preview.html                # ローカルプレビュー（fixture・版型・表裏・地図の切替）
```

## 7. 次の1操作

監査元がPR #31の差分と本書を確認し、Draft解除・マージ可否を判断する。並行して、§5-1のポエム文言修正を別PRとして発行する。
