# APP-003｜全体開発計画・進捗管理（正本）

**固定URL**：https://github.com/yama-books/mansion-poet/blob/main/docs/APP003_MASTER_PLAN_PROGRESS.md  
アプリ：POÈME / ESTATE（APP-003）  
正本Repo：https://github.com/yama-books/mansion-poet  
全アプリ横断台帳：https://github.com/moyashimisosoup/session-deck/blob/main/docs/APP_PORTFOLIO.md  
画像制作・共有ファイル案内板：[APP003_ASSET_WORKBOARD.md](APP003_ASSET_WORKBOARD.md)  
初版照合日：**2026-10-22 JST**  
状態：**開発全体の「予定・実装・検証・公開」を分けて管理する現況表。予定は完成の証明ではない。**

> このファイルが**APP-003全体の進捗の固定入口**。既存の開発マスタープランを破棄しない。以前の資料にある当時のHEAD・未実装・進捗率を現在の事実と誤解しない。更新時は最新のmain、PR、CI、公開URL、必要なiPhone実機確認を照合する。

## 1. 事業・体験としての完成像

選択した地点の地理・施設情報に基づき、創作であることを保ちながら、**高級マンション広告らしい洗練されたポエム・周辺施設紹介・印刷可能な紙面**を生成する。高級広告の文体と、暗渠・側溝・ポストなどのささやかな都市設備との対比を楽しむアプリ。

- 施設名・座標・分類・直線距離・出典・取得状態は確認できるデータのみ。**徒歩分数を直線距離から推定しない**。
- 架空物件と実在の土地・施設を混同させない。支援・医療・宗教等に関する既存SubjectPolicy・公開規則を尊重する。
- 地点切替や生成の競合で、前の地点のポエム・コピー・施設・画像が混入しない。
- 写真やイラストの美しさは追求するが、**REF完成見本、RECIPE構図、ART文字なし素材、RENDER合成広告**を分離する。
- 基本は静的Web・GitHub PagesでPC/iPhone双方。ソース保存、PR/CI成功、Web公開、実機受入を別ゲートとして管理する。

## 2. この計画の参照体系

| 文書 | 所有する内容 | 現在の扱い |
|---|---|---|
| [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) | 初期v0.1.2〜v1.0の完成像、安定性・文芸・地理の全体設計 | **基礎設計**。最終更新2026-10-17、最新実績はこの文書を参照 |
| [NEXT_PHASE_MASTERPLAN_20261017.md](NEXT_PHASE_MASTERPLAN_20261017.md) | SAFE→GEO→SELECT→ADDRESS→LOCATION→WALK→LIFE→UI→RELEASEの12工程 | **詳細バックログ**。順番や未実装表示は当時の基準 |
| [ROADMAP.md](ROADMAP.md) | 時系列・既存機能の経緯と仕様リンク | 歴史的ロードマップ。最新版の確認先は本書 |
| [APP003_VISUAL_IMPLEMENTATION_PLAN_20261019.md](APP003_VISUAL_IMPLEMENTATION_PLAN_20261019.md) | MAPFX/IMG-00/PRINT03/ASSETの横断設計 | 印刷・画像実装の従来計画 |
| [APP003_ASSET_WORKBOARD.md](APP003_ASSET_WORKBOARD.md) | 画像・Markdown・PR・担当の**共有場所・所在** | 詳細所在の正本。ここへすべての画像リストを複写しない |
| [APP003_REFERENCE_GALLERY_CHECKPOINT_20261022.md](APP003_REFERENCE_GALLERY_CHECKPOINT_20261022.md) | 参考ギャラリーの実装・Pages公開とHTTP確認 | デプロイ根拠 |
| [APP_PORTFOLIO.md（全アプリ台帳）](https://github.com/moyashimisosoup/session-deck/blob/main/docs/APP_PORTFOLIO.md) | APP-003と他アプリの横断状態 | 外側の台帳。本書の細部は必要なときだけ要約する |

**記録の役割分担**：本書に「APP-003の工程と検証ステータス」、ASSET_WORKBOARDに「画像制作・ファイルの住所録」、個別PRに「技術・受入の証拠」、APP_PORTFOLIOに「複数アプリ間の全体状況」を保存。細部を無闇にコピーして齟齬を作らない。

## 3. 公開・実装・未統合の基準状態（2026-10-22）

| 項目 | GitHubで確認できた状態 | 利用者が確認すべきこと |
|---|---|---|
| main | 初版執筆時のHEAD \`0d3f1753e4e25d415cc262e87c6493631477399a\`。最新状態は都度取得する | 現行アプリへの変更が発生したら最新HEADとActions結果を確認 |
| 公開アプリ | https://yama-books.github.io/mansion-poet/ | 現行トップ、地点選択・生成・コピー・地図・施設表示 |
| 参考デザインギャラリー | https://yama-books.github.io/mansion-poet/tools/reference-gallery/index.html | REF-0001/0002の19PNG。公開HTTP GETと代表PNG SHAはActions #39750917571で成功。**iPhone Safariの人手操作は未記録** |
| POEM-01 | 63分類×10フック＝630。既存の公開機能（出典：2026-10-17以前の計画記録） | 個々の文面の編集品質や全件校閲が完了したとは限らない |
| LOCATION-01 | 29分類87組＋一般10テーマ30組＝117組。施設カード最大3件（同上） | POI網羅性、主役の一致、距離と徒歩の区別 |
| PRINT03・文面 | [PR #31](https://github.com/yama-books/mansion-poet/pull/31) open、[PR #32](https://github.com/yama-books/mansion-poet/pull/32) open。**main未統合** | 既報の結合Node 197/197はローカル組合せ結果。合成広告・iPhone Safari印刷は別検証 |
| 画像取り込み | [PR #30](https://github.com/yama-books/mansion-poet/pull/30) Draft（IMG-PIPE）、[PR #33](https://github.com/yama-books/mansion-poet/pull/33) Draft（IMG-00）。**main未統合** | 許諾、原画、印刷ppi、機能統合のゲート |
| 画像REF | REF-0001/0002の19PNGとmanifestはmainに保存済。[PR #37](https://github.com/yama-books/mansion-poet/pull/37) DraftにはREF-0003〜0008の説明資料と**参照由来の写真切り出し3PNG**を追加済（HEAD 672fdd8）。**元シート7PNGは未確認** | 新規3点は484〜493×295pxの参考用小画像。固定Git treeで実体・容量を確認、SHA-256独立再計算は未実施。独立ARTと混同せず、元シート7点の保存先を引き続き確認 |
| 制作ルールと構図 | [PR #34](https://github.com/yama-books/mansion-poet/pull/34) open（6構図）、[PR #38](https://github.com/yama-books/mansion-poet/pull/38) Draft（REF/RECIPE/ART/RENDER分離） | 新しい文字なしARTは別セッションで制作中、保存PR・実画像・採否のGitHub読戻しは未確認 |

**注**：PR #31、#32、#34はopenでDraftではない。#30、#33、#37、#38はDraft（GitHub照合時点）。openであってもmainに取り込まれているわけではない。

## 4. 開発領域ごとのマイルストーン（最新現況）

状態語彙：**公開済み／実装PRあり／設計・調査済み／制作中（報告）／未確認・未実施**。PRの存在でコードが本番稼働したと判断しない。

| 領域・Work ID | 到達点と状態 | 未解決の論点・次の1操作 |
|---|---|---|
| **CORE：選択・地図・生成** | **公開済み**。静的Web、場所検索、地図、架空広告文、周辺カード。Pages実績あり | iPhone上の一連の操作、地点切替時の古いデータ混入・通信異常の最新実機検証 |
| **SAFE-01：主役の採否** | 既存SubjectPolicy仕様とPRINT03側で安全な採否の設計・テスト実績あり。ただし全安全規則の**main上の完了は未判定** | 最新コード・PS-01〜28の表とPR差分を監査し、未採用ケースだけ実装 |
| **GEO-00/01/02：細かな都市設備の検出** | 詳細設計バックログあり。**全3工程のmain上の実装完了は未確認** | 代表地点のPOI出現・欠測・精度を少数の実例で測定。無制限検索や欠測全除外を避ける |
| **SELECT-01：詩と主役施設の統一** | 仕様とPRINT03契約で主役sourceId整合を要求。**公開版への完全接続は未確認** | POEM/LOCATION01/地図と生成トークンの整合を組合せテスト |
| **POEM-01/LOCATION-01/02：広告文章** | 初期630フック・117PR組は公開実績あり。[PR #32](https://github.com/yama-books/mansion-poet/pull/32)に文言改善あり | 内容校閲、検証済み主役との文面一致、未統合PRのレビュー |
| **ADDRESS-01／WALK-00/01** | 計画・正確性のゲート定義あり。**徒歩ルート実装の確認なし** | 原POIの住所・入口・経路取得可否を先に検証。取得なしなら未表示で成立させる |
| **LIFE-01/02：生活情報** | LIFE-01の実装記録は存在するが、最新main/Pagesでの機能稼働をこの監査で個別検証していない。LIFE-02は設計バックログ | 既存コードと実機を照合。欠測理由（未検索/0件/失敗）を区別 |
| **UI-01／REF-LIB-03：表示** | 参考ライブラリは**Web公開済**。タグ検索・拡大機構、Chromeのモバイル幅QAと公開HTTP GETを確認 | iPhone Safariの実操作受入、長名・拡大・回転・視認性を記録 |
| **PRINT03：A4広告** | [PR #31](https://github.com/yama-books/mansion-poet/pull/31)で独立印刷エンジン実装PRあり。既報Node回帰197/197（PR31/32結合）、Edge PDF QA53件（ローカル報告） | mainへの統合・写真ARTとの合成・Safari実機印刷・A4可読性を別ゲートで検証 |
| **IMG-PIPE／IMG-00：画像処理** | [PR #30](https://github.com/yama-books/mansion-poet/pull/30)と[PR #33](https://github.com/yama-books/mansion-poet/pull/33)に独立PoC。**本体への接続・公開未実施** | 独立ART原画のメタデータ・許諾・ppi/トリミング・SVG fallbackを代表1点で統合 |
| **ASSET-REF-02／ART：画像制作** | REF-0001/0002の19PNGをWeb公開済。PR #37には説明資料に加えて参照画像からの写真切り出し3PNGがGitHub登録済。新しい独立ARTの制作も別セッションへ依頼済 | 写真切り出し3点は低解像度・権利未承認の参考用。**独立生成高解像度ART・元コンセプトシート7PNGは別途確認待ち** |
| **RECIPE／MAPFX-01：編集構図・地図演出** | 6構図はPR #34で設計記録あり。MAPFXは構想・実装計画あり | まずARTを組み込める構図1点の印刷試作。MAPFXは独立PoCとして後から判断 |
| **RELEASE-01：CI／配信／実機** | 現行PagesとREFギャラリーを配信、公開HTTPチェック成功。**PRINT03等のPR機能はまだ公開なし** | 各PRの統合前後回帰→Pages反映→実機操作の受入を別個に記録 |

未確認＝失敗ではない。**仕様・過去の実装報告と、今のmainで稼働していることを混同しない**。

## 5. ここからの作業順（依存と並列を考慮した暫定案）

### 直近：新画像制作を保全しつつ、代表1点で広告への合成を試す

1. **ASSET-ART-01（画像制作セッションが担当）**：既存の制作を中断せず、3点程度の文字なし単独ART（最初は\`print_hero\`用途）を生成。画像とプロンプトMDとSHA256・権利・参照REF-IDをセットで**専用PRへ保存し読戻し**。本番使用許可は別判断。
2. **ASSET-REF-02（登録担当）**：[PR #37](https://github.com/yama-books/mansion-poet/pull/37)に追加された3写真切り出しは実体・容量を確認済。**これは元シート7PNGとは別物**。元シート7点の保存先を引き続き確認し、未登録ならRunbookに従って登録、二重pushを避ける。
3. **PRINT03-IMG-01（アプリ実装担当）**：PR #31・#32・#30・#33・#34の最新HEADと変更領域を照合し、独立ART1点・レイアウト1構図・SVG fallbackだけでA4 Web/PDF試作。画像が文字/地図と分離されていることを確認。
4. **WEB-SAFARI-QA（実機受入）**：公開ギャラリーと現行アプリ、次の統合試作品をiPhone Safariで検証。画像欠け、検索・拡大、コピー、A4、回転を記録。

### 並列で進められる次のコース

- **主役と正確性**：SAFE-01／SELECT-01を既存コードと照合し不足分だけ実装。現地POIが不明なら創作のテーマを一般化し、虚偽の事実へ逃げない。
- **現実的な全国運用**：GEO-00の代表地点・欠測評価→限定的GEO-01/02→LIFE-02。取得できないデータがある地点でもアプリが成立するフォールバックを先に設計。
- **住所と経路**：ADDRESS-01・WALK-00を調査したうえで、成り立つ範囲だけWALK-01へ進む。
- **見た目と印刷**：少数のARTと構図を合成し、画質・重複・取得費を検証してから30点→100点規模への拡充を審査。

**大量生成、PR一括マージ、大幅なUI全面改造を初手で行わない**。小さく動かし、実機で確かめてから拡張する。
### UI01-MOBILE-01｜実機向けWebアプリの小改善（2026-10-22）

- **[Draft PR #40](https://github.com/yama-books/mansion-poet/pull/40)**（branch feature/app003-ui01-safari-mobile-20261022）：現行index.htmlのモバイルヘッダーに「つくる」ショートカットを追加し、320〜430pxのタップ領域・iPhone検索入力文字サイズ・safe-area・長い名称の折返しを改善。印刷ロジック/PR #39のPRINT03-IMG-01に触れない。
- Chromeによる320/375/390/430/1440pxの実ブラウザQA、スクリーンショット、既存Node回帰を実行する独立CIをPRに追加。
- **状態：Draft PRで保存・コード未統合／GitHub Actionsは確認時にqueuedで結果未確定。iPhone Safari実機未確認。Pages公開も変更なし。** 画面幅QAが成功してもSafari実機操作と区別する。
- [受入チェックポイント（PR #40）](https://github.com/yama-books/mansion-poet/blob/feature/app003-ui01-safari-mobile-20261022/docs/APP003_UI01_MOBILE_DEVICE_CHECKPOINT_20261022.md)。次の1操作：CIの結果を確認し、失敗時はこのPRだけ修正。成功後、iPhone Safariで操作を受入。


### 2026-10-22 運用決定：画像は再現性より再利用性を優先

画像制作の仕様は[PR #38の制作契約v1.1](https://github.com/yama-books/mansion-poet/pull/38)を優先する。ユーザーがオリジナル画像と申告しており、**画像を同じプロンプトで再生成できることは試作時の必須条件にしない**。原画をGitHubで保全し、REFは自由な完成デザイン研究、ART候補は文字・価格・地図を焼き込まない単独画像として扱う。全画像への厳密なppi・縦横比・詳細MDの義務付けはしない。

**現在の優先順位**：①別セッションで原画と簡単なテーマ・保存先を記録、②PRINT03で代表1〜3点を試験合成してPCとA4の見え方を検証、③成功例をもとに用途別規格を定める、④決まった用途から段階的に量産する。既存画像は削除・一括作り直ししない。以前のG0〜G8は実装・本番採用・量産時の参考ゲートとして保持。公開サイト・本番ART承認は別。

## 6. 品質・公開の共通ゲート

| ゲート | 合格の根拠 | 状態記録 |
|---|---|---|
| G1 正本保全 | GitHub commit、branch、PR、ファイル読戻し | Saved / Not saved |
| G2 データ・著作権 | 地理・施設の証拠、REFとARTの権限、秘密情報なし | Approved / Pending / Rejected |
| G3 コード回帰 | 独立と結合テストの件数・CI URL、対象SHA | Pass / Fail / Not run |
| G4 視覚・印刷 | モバイル幅/PCの実ブラウザ画面、A4 PDF、文字/地図可読、素材ppi | Pass / Issue / Not run |
| G5 公開 | Pagesの実デプロイ、実公開URLのHTTP到達、既存トップ保全 | Deployed / Not deployed |
| G6 実機 | iPhone Safari・必要ならAndroid、操作結果とスクリーンショット | Accepted / Pending / Rejected |

ドキュメント登録やCI成功だけでは、G4〜G6の達成とみなさない。

## 7. 同時セッションの競合防止

| 担当 | 主な所有領域 | 禁止・調整 |
|---|---|---|
| 画像制作 | 新ART原画／PROMPT／専用manifest／レビューMD | 他担当の\`index.html\`・PRINT03エンジンを書き換えない。新しい画像をGitHub公開する際は公開範囲を確認 |
| 画像登録・ライブラリ | REF資料、参照メタデータ、\`APP003_ASSET_WORKBOARD.md\` | 画像7点の重複登録防止。保管済みと本番採用許可を分離 |
| PRINT03/ART合成 | \`src/print-layout/\`／HTML印刷スタイル／必要な画像スロット | PR #30/#31/#32/#33の差分を先に照合。統合前に本体を書き換えない |
| GEO/文章/安全 | POI分類、主役選定、辞書、データ契約と回帰 | 画像制作と同じファイルに触らない。安全条件を広告表現で解除しない |
| 進捗監理 | **このファイル＋画像案内板＋全アプリ台帳** | 状態変化だけを記録。mainの最新SHA読戻しから更新し、未確認を完了にしない |

## 8. チェックポイント更新ルール（軽量）

**以下の節目だけ**本書の現況表と「次の1操作」を更新：
- 新しい画像・素材がGitHubへ保存され、ハッシュ読戻しが終わった
- 新しいPRの作成・レビュー／Draft解除・統合／閉鎖
- CIの重要な結果が変わった、印刷PDF/モバイルの受入が変わった
- Pages実公開と端末上の挙動の受入が変わった
- 設計の決定・方針転換・セッション引継ぎが発生した

**CHECKPOINT最小形**

    APP-ID / work_id:
    現在の工程:
    正本Repo / Branch / HEAD / PR:
    保存・読戻し済みのファイル:
    検証済（CI・ブラウザ・PDF・実機）:
    未確認・課題:
    公開/本番反映の有無:
    次の1操作:

更新はmainの最新版ファイルを取得して既存履歴を保持。長い完了ログは各PRのCHECKPOINTへ置き、このファイルには1〜2行の変化だけ記録する。別担当が同じmain文書を編集する場合は読み直して競合を防止する。

## 9. 進捗更新履歴（要約）

| JST | 状態変化 | 根拠 |
|---|---|---|
| 2026-10-17 | 旧全体計画と次期12工程の詳細を保存 | DEVELOPMENT_PLAN / NEXT_PHASE_MASTERPLAN |
| 2026-10-20〜22 | PRINT03、POEM、IMG-PIPE、IMG-00、構図レシピをPR単位で保存・検証。**それぞれ未統合** | PR #30/#31/#32/#33/#34 |
| 2026-10-22 | REF-0001/0002の19PNGをGitHubに登録、検索ギャラリーをmain/Pages公開 | PR #35/#36、Pages Actions #39750917571 |
| 2026-10-22 | REF-0003〜0008の説明11文書をPR #37へ、素材分離の制作契約をPR #38へ保存。独立ARTは別制作セッションで進行 | PR #37/#38、[画像案内板](APP003_ASSET_WORKBOARD.md) |
| 2026-10-22 | 本書を設置し、アプリ全体の計画・進捗の固定入口を一本化 | このファイルのGitHubコミット |
| 2026-10-22 19:13 JST頃 | PR #37に文字なしの**参考写真切り出し3PNG**を追加（GitHub tree上で実体・容量を確認）。**元6シート＋一覧7PNGのアップロード、および独立生成ARTとは別** | [PR #37](https://github.com/yama-books/mansion-poet/pull/37)、[画像共有案内板](APP003_ASSET_WORKBOARD.md)、コミット 44e154a／672fdd8 |
| 2026-10-22 夜 | **PRINT03-IMG-01**：参考写真1点をPR #31のEDITORIALに差し替える独立[Draft PR #39](https://github.com/yama-books/mansion-poet/pull/39)を作成。Chrome/Noto CJKでSVG・写真・不達、施設0件・長名の5ケースをartifact確認。単面A4 PDF 3種は209.9×297.0mm、必要文字残存、写真は実効約67.5ppiで印刷本採用不可。CI最終conclusion・duplex追加ケース・iPhoneは別確認 | [CHECKPOINT](https://github.com/yama-books/mansion-poet/blob/feature/app003-print03-img01-poc-20261022/docs/checkpoints/APP003_PRINT03_IMG01_CHECKPOINT.md)、[Actions](https://github.com/yama-books/mansion-poet/actions/runs/39796965216) |

## 10. 開始時の最短手順

1. **本書を開く**：現在の工程と次の操作、PR状態を確認。
2. [画像案内板](APP003_ASSET_WORKBOARD.md)を開く（画像作業がある場合）。
3. 変更するPR/branchの最新HEAD・差分・CI・未コミット成果を確認し、既存実装を再作成しない。
4. 専用ブランチ/PRで作業・検証。コード完成・main保存・Web公開・実機受入のどこまで終えたかを分けて記録。
5. 大きな節目のみ本書と画像案内板、APP_PORTFOLIOへ短いCHECKPOINTを追加。

**次の1操作（2026-10-22）**：新規制作セッションの独立ARTが保存されたブランチ・commit・原画像・プロンプト・権利判定を照合する。PR #37の3点写真切り出しはGitHubに保存済みだが本番利用不可、元コンセプトシート7点は別件として保存先を確認する。
