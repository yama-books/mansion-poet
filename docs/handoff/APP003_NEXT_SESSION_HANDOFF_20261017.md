# HANDOFF_READY｜APP-003 POÈME / ESTATE 次期開発

作成：2026-10-17 JST  
目的：今回の**現状監査・次期ロードマップ確定**を保存し、次のChatGPT/Codex/Claude Codeセッションが重複なく着手できる状態にする。  
作業状態：**PLAN-00＝計画文書のみ。GEO/SAFE/ADDRESS/WALK等の実装はまだ始めていない。**  
APP-ID：APP-003  
work_id：本次期計画に対応する登録済みの一意なwork_idは**未確認**。必要なら次の実装セッションが既存作業台帳の最新情報を確認して登録。  
正本リポジトリ：[yama-books/mansion-poet](https://github.com/yama-books/mansion-poet)  
公開URL：https://yama-books.github.io/mansion-poet/  
基点main：**57ed8e76968935583180dcda0648178aacf62f44**（2026-10-17の本計画の読み取り開始時点。文書保存・マージ後のmain HEADではない）  
今回の計画専用ブランチ：**plan/app003-next-phase-20261017**（新セッションはマージ済みを確認後、最新mainから別ブランチ作成）  
計画正本：[NEXT_PHASE_MASTERPLAN_20261017.md](../NEXT_PHASE_MASTERPLAN_20261017.md)  
共通台帳：[APP_PORTFOLIO.md](https://github.com/moyashimisosoup/session-deck/blob/main/docs/APP_PORTFOLIO.md)

## 1. 既存の実装・公開済み事実

1. OpenPOI＋条件付きOverpass補完、地名・住所検索、地図上の地点選択、3文体、濃度、再生成、コピー、印刷、THE REALITYを備えた静的ブラウザアプリがGitHub Pagesで公開済み。
2. **POEM-01**：[PR #11](https://github.com/yama-books/mansion-poet/pull/11)、修正[PR #12](https://github.com/yama-books/mansion-poet/pull/12)。63ジャンル×10案の**630短文フック**を登録。これは630本の完成長文詩ではない。全件人手校閲は未実施。
3. **LOCATION-01**：[PR #13](https://github.com/yama-books/mansion-poet/pull/13)、誤分類修正[PR #14](https://github.com/yama-books/mansion-poet/pull/14)、再生成変奏[PR #15](https://github.com/yama-books/mansion-poet/pull/15)。29細分類×3件=87＋一般10テーマ×3件=30、**計117組**の広告文。ポエム直下に実施設名、取得できた施設住所、直線距離、広告PR見出し・本文を最大3カード表示。徒歩分数は元データ不足により非表示。
4. **テスト**：[PR #15 CI](https://github.com/yama-books/mansion-poet/actions/runs/39014087499) **69 passed / 0 failed**。**Pages**：[run #39014131376](https://github.com/yama-books/mansion-poet/actions/runs/39014131376) SUCCESS。最終コード配信基点 [a879580b](https://github.com/yama-books/mansion-poet/commit/a879580b8d951a675c56930237dbf697b4753302)。
5. **公開ブラウザ**：中野で3枚広告カードが実際に表示され、再生成時に3枚すべてが異なる見出しになり、京都選択で旧カードが消えることを確認。銀座コージーコーナーをスーパーと誤断定しない修正、徒歩分数を作らない挙動も公開ブラウザで確認済み。[実施記録](../LOCATION01_AD_HIGHLIGHTS.md)。
6. 2026-10-17の計画調査開始時、**open PRは0件**。本PLAN-00ブランチ／PRを作成しているため、次のセッションでは再照合必須。

**区別**：CI成功 ≠ 実ブラウザ確認 ≠ iPhone/Android実機確認 ≠ 施設を全国で網羅的に取得できたこと。所在地未収録・徒歩ルート未取得の制約は継続。

## 2. ユーザーが採用した完成イメージ（変更しない）

- 表現は**高級レジデンス広告として完成させる**。「このポエムの着想源は暗渠でした」というメタ解説を本文に出さない。
- ポエム → **LOCATION HIGHLIGHTS（具体的な施設・地物名、確認済み住所、実距離、条件がそろった場合のみ徒歩分数、専用の施設PR）** → THE EVIDENCE → THE REALITY。
- 一般に魅力となる自然・文化・駅・学校・役所・神社・寺院・歴史的教会を**積極的に採用**。暗渠・側溝・郵便ポスト・自販機等の地味すぎる都市設備も主役にする。扱うジャンルは細かく、ラーメン二郎と天下一品のようなブランドも証拠がある場合に分ける。
- 信仰や支援施設の利用者を笑いの対象にしない。宗教施設は一律排除せず、建築文化・景観・観光史実など証拠がある文脈で、敬意を持って扱う。
- 文体と比喩は大胆に。施設の実在・名前・位置・ブランド・学区・アクセス・歴史・営業状況・出典は**創作しない**。
- 新しい重いバックエンドや有料APIを前提にしない。必要性と無料枠・ライセンスを先に検討する。

## 3. 問題の核心：今後の最優先課題

**データ収集とその正規化・安全判定が、すでに豊富な文章辞書に追いついていない。**

現行のindex.htmlでは
- Overpassの抽出タグが主に公園・学校・駅・文化等に限られ、暗渠・側溝・ポスト等は未検索。
- OSM無名要素は正規化時に除外される。郵便ポスト・側溝等には名前なしが多い。
- OSMのway/relationのcenter（代表点）を距離に用いるため、長い川・線状の地物で最寄り地点とずれる。
- 結果12件などの先頭切り捨てやOpenPOI件数によるOSMスキップがあり、施設発見が文体・ソース順序に左右される。
- 「学校＝自習室」「スーパー＝洋菓子店」は前回修正済みだが、分類辞書の未検査ジャンルで類似の偽陽性が残る恐れがある。
- POEM_SUBJECT_POLICYの28件は**仕様上のテスト案**であり、完全に実装済みとは言えない。
- 長い施設住所と線地物への適切な所在地ラベル、徒歩分数（到達点・歩行経路）の提供は未解決。

## 4. 次セッションの**次の1操作**

1. **まず読み取り**で正本Repoの最新main HEAD、open PR、最新PR CI／Pagesを取得し、本計画正本と照合する。
2. **SAFE-01の既存実装とテスト69件の現在状態を確認**し、[POEM_SUBJECT_POLICY](../POEM_SUBJECT_POLICY.md)にあるPS-01〜28で未実装の範囲を洗い出す。重要な実装差分を発見したら重複作業しない。
3. 新コードPRは最新mainから新しいbranch（推奨：work/app003-safe01-20261017、ただし現時点で未作成）で小さく実施。Safe-01を完遂するまでは、OSMタグを大量追加しない。ユーザーがGEO-00から着手する方針に変えた場合は、read-onlyの小規模API監査とfixtureから開始。
4. 1PRごとにfixture→CI→必要な公開ブラウザ受入を独立確認。事前に最新PRの担当・編集ファイルを照合。

**この新セッションで最初に外部APIへ数千リクエストを送らないこと。** GEO-00の調査対象と上限を先に固定する。

## 5. 作業領域・競合回避

| 作業領域 | 触るファイル | 他セッションとの扱い |
|---|---|---|
| PLAN-00（このセッション） | docs/NEXT_PHASE_MASTERPLAN_20261017.md と本handoff、docs/ROADMAP.md / README.mdのリンク、中央台帳 | **文書だけ更新**。JS・UI・テスト・CIは変更しない |
| SAFE-01／GEO実装（次のセッション） | index.html、正規化・分野別検索・選定モジュール新設、tests、ワークフロー必要時 | 独立branch。直前のmainに対して実装 |
| POEM-01 文言専用 | **src/poem-catalog.js 内のgenres[*].variants文字列だけ**、任意docs/poem-copy | [既存の文言専用HANDOFF](POEM01_COPY_HANDOFF_20261017.md)が担当境界。ロジックの変更はしない。コード側が同じファイルを編集する前にPR確認 |
| LOCATION-02 文言制作 | src/location-highlights.js 内の広告文セクションとdocs/poem-copy等 | SAFE/GEOのテスト・選定ロジック編集と競合させない |
| 公開・配信受入 | .github/workflows/**、index.htmlのscriptタグ等 | mainマージ後の担当セッションのみ。CI成功をもって実機完成としない |

既存のPOEM-01専用HANDOFFに書かれた「HEAD=472a9db」は当時の基点であり、現行HEADではない。参照する際は**最新HEADを必ず再取得**。

## 6. 未完了を機能別に明記

- **未実装**：小さな都市設備の追加Overpass検索、無名地物ID/一般名表示、OSM wayの正確な近接距離、主題・LOCATION先頭の構造化Plan、施設独自住所の詳細補完、実徒歩経路、生活施設のジャンル別オンデマンド追加検索。
- **部分実装**：センシティブな施設の保護的除外、明示業態とブランドの判別、再生成、掲載元/距離の根拠表示。網羅的な検査は未了。
- **実装済・限定受入**：一般施設PRカード、117組初稿、63ジャンル630フック、公開ブラウザでの中野の正常系。
- **未確認**：暗渠・側溝・ポストの現地ライブ検出・所在地精度、遠方ジャンル拡張がAPI負荷に耐えるか、端末実機、印刷にLOCATIONを含めた版、630+117文言の全件人手審査。
- **まだ決めない**：具体的なルーティングAPI、セルフホスト、課金サービス、検索半径の正式上限、完全版v1の期日。先行調査と受入基準を経て選択。

## 7. 参照と証拠

- [次期マスタープラン](../NEXT_PHASE_MASTERPLAN_20261017.md)（実装順・段階PR・検証ゲートの正本）
- [施設ポエム採用ポリシー](../POEM_SUBJECT_POLICY.md)
- [LOCATION-01実装記録](../LOCATION01_AD_HIGHLIGHTS.md)
- [POEM-01実装記録](../POEM01_GENRE_LIBRARY.md)
- [文言専用HANDOFF](POEM01_COPY_HANDOFF_20261017.md)
- [品質テスト計画](../QUALITY_TEST_PLAN.md)
- [地理・API取得仕様](../DATA_SOURCES.md)
- [住環境仕様](../LIVING_ENVIRONMENT_SPEC.md)
- [GitHub PR一覧](https://github.com/yama-books/mansion-poet/pulls)
- [Actions](https://github.com/yama-books/mansion-poet/actions)
- [Pages公開アプリ](https://yama-books.github.io/mansion-poet/)
- [中央台帳](https://github.com/moyashimisosoup/session-deck/blob/main/docs/APP_PORTFOLIO.md)

## 8. 完了条件と引継ぎの宣言

このHANDOFF_READYは、**調査・設計・優先順位・一意の次操作をGitHubで保存し、読み戻せたときのみ**完成扱いにする。新しいコード・API検索・UI変更の実装は今回の成果ではない。次のセッションは本書とmain最新HEADを比較し、目の前の差分だけを前進させる。

**引継ぎ推奨セッション名**：〖POÈME地理データ・安全基盤〗1017・01・SAFE-01着手
