# POÈME / ESTATE
### マンションポエムメーカー

> 地名を、壮大な邸宅思想へ。

日本全国の好きな場所を地名検索や地図から選び、その土地の特徴に着想を得た**架空の高級マンション広告風ポエム**を生成する、軽量なWebアプリです。

マンション広告のように無駄にスタイリッシュな画面と、驚くほど荘厳な言葉を楽しむ創作・パロディ作品です。実際の物件の広告・紹介ではありません。

## ブラウザで使う

**[マンションポエムメーカーを開く](https://yama-books.github.io/mansion-poet/)**

GitHub Pagesの公開先です。PC・iPhone・Androidのブラウザで開ける静的Webアプリです。

- 配信方式：GitHub Actionsで `main/index.html` と `src/poem-catalog.js`、`src/location-highlights.js` をGitHub Pagesに公開
- 自動公開：`index.html`、`src/**`、`tests/**`、または `.github/workflows/deploy-pages.yml` を変更したとき
- 公開用ワークフロー：[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)

2026-10-17：初回Actionsデプロイが成功し、実際の公開URLからHTTP 200、画面テキスト・地図タイル・主要操作ボタンの表示を確認しました。さらに公開ブラウザ上で「中野」サンプル選択→生成（OpenPOIで施設8件）と、荻窪の地名検索→候補選択→生成（施設10件）を確認しました。iPhone/Androidなど個別端末の実機操作は引き続き検証対象です。

## POEM-01 ジャンル別ポエム辞書（実装段階）

[630種類の文章フック・63ジャンル](src/poem-catalog.js)を実装。側溝・暗渠・カーブミラー・郵便ポスト・学校・神社寺院などの建築・自然景観・飲食店・確認済みチェーン名を細分類し、各10案を再生成に使用します。[実装と制限の記録](docs/POEM01_GENRE_LIBRARY.md)。

**辞書に登録されていることと、現在の施設APIから取得できることは別**です。ソースの種類や店舗ブランドが明示的に確認できたときだけ専用文章を使用し、未確認なら従来の文章に戻ります。文章の人手校閲と、細かい施設の取得拡充は後続作業です。宗教的な建築は文化・景観の文脈で扱い、医療・支援等の保護対象は広告パロディの主題から除外します。

## 今後の開発と引継ぎ

施設細分類と地理データの照合、暗渠・側溝・郵便ポスト等の取得、文化・自然・一般公共施設の安全な広告化、PR文の校閲、住所・徒歩ルートの検証、スマホ受入の具体的な実装計画を [次期開発マスタープラン](docs/NEXT_PHASE_MASTERPLAN_20261017.md) にまとめています。次の開発セッションは [HANDOFF_READY](docs/handoff/APP003_NEXT_SESSION_HANDOFF_20261017.md) から作業してください。**計画の保存は、新機能の実装・公開を意味しません。**

## LOCATION HIGHLIGHTS：広告型の周辺施設紹介

ポエムの下に、取得した施設をそのまま高級マンション広告の周辺環境紹介として掲載。**施設名／所在地（提供元に登録されているときのみ）／直線距離／施設専用PR文**を最大3件表示します。29ジャンル87組＋一般テーマ30組、計117組の広告文を収録し、出典や生活情報は下のTHE EVIDENCE／THE REALITYへ分離しました。現在は**歩行経路が未取得**なので徒歩○分は記載しません。明示的な施設情報が取得できなければ仮想の施設紹介は出しません。詳細は[LOCATION-01仕様](docs/LOCATION01_AD_HIGHLIGHTS.md)。

## 使い方

1. [GitHub Pages](https://yama-books.github.io/mansion-poet/) から開きます。ビルド操作やAPIキーは不要です（ローカルでHTML単独表示する場合は隣の`src/poem-catalog.js`も必要です）。
2. サンプル地名を選ぶか、地名を検索して候補を選択します。地図クリックで地点を指定することもできます。
3. 「格式・邸宅」「都市・先進」「自然・静寂」から文体を選び、ポエム濃度を調節します。
4. 「この街を、詩にする」を押します。
5. コピー、再生成、ブラウザの印刷／PDF保存を行えます。

### 現行版 v0.1.1の機能（OpenPOI接続版）

- 地名・住所検索：国土地理院の公開地名検索
- 地図から地点を選択：Leaflet＋地理院タイル
- 周辺施設を任意取得：**OpenPOI API（キー不要）**を優先し、自然・史跡等の補完にはOpenStreetMap／Overpass API（通信成功時）を利用
- 土地の特徴から主題を抽出し、**ブラウザ内の辞書・テンプレート**でポエム生成
- 3種類の文体、ポエム濃度（0～100）、再生成
- 架空物件名・見出し・広告本文・簡易根拠表示
- コピー、印刷／PDF保存
- デスクトップ／モバイル対応のレスポンシブUI
- 地図・外部APIが使えなくても、サンプル地点からの生成を継続可能
- APIから返った座標と選択地点の距離を再計算し、850mを超えたレコードを除外。施設情報の出典も表示

**外部生成AIは使っていません。** 文章生成そのものはローカルで動きます。地図・地名検索・施設取得・外部フォントなどにはネット接続が必要です。

## 企画・開発ドキュメント

| ファイル | 内容 |
| --- | --- |
| [docs/CONCEPT.md](docs/CONCEPT.md) | プロダクト構想、体験設計、UIデザイン、生成方式、将来機能 |
| [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) | 現在の地理・施設データ取得先、制約、追加候補、出典管理方針 |
| [docs/ROADMAP.md](docs/ROADMAP.md) | v0.1の到達点、検証項目、v0.2以降の段階的開発計画 |
| [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) | **2026-10-17からの開発マスタープラン**。優先順位・実装順・完了条件・直近PR |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | 高級マンション広告風のUI・タイポグラフィ・モーション仕様 |
| [docs/GENERATION_ENGINE.md](docs/GENERATION_ENGINE.md) | 土地特徴からのポエム生成、文体・濃度、禁則・品質評価 |
| [docs/QUALITY_TEST_PLAN.md](docs/QUALITY_TEST_PLAN.md) | 地域別テスト、API異常・競合・スマホ・文章品質の受入条件 |
| [docs/ADVERTISEMENT_RESEARCH_PLAN.md](docs/ADVERTISEMENT_RESEARCH_PLAN.md) | **実在マンション広告30物件・約90ページの分析計画**と先行ジェネレーター比較 |
| [docs/PILOT_8_AD_ANALYSIS.md](docs/PILOT_8_AD_ANALYSIS.md) | **Pilot調査の一次成果**：実際の広告8物件・24ページの比較、8つの広告構文の仮説 |
| [docs/PILOT_VISUAL_MOTION_AUDIT.md](docs/PILOT_VISUAL_MOTION_AUDIT.md) | **PC広告画面の視覚比較**：直接観察した6物件と未検証項目の区別 |
| [docs/AD_CODING_GUIDE_V1.md](docs/AD_CODING_GUIDE_V1.md) | **広告研究の採点ルール**：P/L/R/Vの判定基準と2件の再採点 |
| [docs/AD_QUALITY_GATES_V1_20261019.md](docs/AD_QUALITY_GATES_V1_20261019.md) | **広告会社レベルの品質規格（推定）**：実在広告の公開根拠と社内審査仮説、ハードゲート・100点審査、図版・組版・PDFの受入基準 |
| [docs/APP003_VISUAL_IMPLEMENTATION_PLAN_20261019.md](docs/APP003_VISUAL_IMPLEMENTATION_PLAN_20261019.md) | **MAPFX-01／IMG-00／PRINT-03 統合実装計画**：地図光柱、画像スロット、実広告型A4印刷への小PR分割とテスト条件（設計のみ） |
| [docs/APP003_REFERENCE_IMAGE_LIBRARY_SPEC.md](docs/APP003_REFERENCE_IMAGE_LIBRARY_SPEC.md) | **参考画像バンクの管理仕様**：REF／RECIPE／ART／RENDER、選定・保存・安全な本番採用の境界。PNGは会話内ZIP、GitHubバイナリ未登録 |
| [docs/APP003_REFERENCE_IMAGE_TAGS_V1.md](docs/APP003_REFERENCE_IMAGE_TAGS_V1.md) | **施設・構図ごとの統制タグ**：template/composition/art/fit/case、ジャンル対応と候補検索 |
| [docs/APP003_REFERENCE_IMAGE_ENTRIES/REF-0001.md](docs/APP003_REFERENCE_IMAGE_ENTRIES/REF-0001.md) | **墨線・水彩・夕景**の上段3構図＋下段5ケース。構図・素材・文字組・禁則・crop情報 |
| [docs/APP003_REFERENCE_IMAGE_ENTRIES/REF-0002.md](docs/APP003_REFERENCE_IMAGE_ENTRIES/REF-0002.md) | **建築写真・編集誌面**の上段3構図＋下段4ケース。写真・地図・文字の分割設計 |
| [research/visual-reference-manifest.json](research/visual-reference-manifest.json) | **19画像の登録情報**：タグ・生成由来・寸法・SHA-256・切出し座標。画像のGitHub本体アップロードは未完了 |
| [docs/LOCAL_EXECUTION_ASSIGNMENTS_20261019.md](docs/LOCAL_EXECUTION_ASSIGNMENTS_20261019.md) | **Codex／Claude Codeローカル分担手順**：IMG-PIPE-01画像処理とPRINT03-CORE印刷エンジン、別worktree／禁止編集範囲／受入条件 |
| [docs/handoff/APP003_ASSET_GENERATION_HANDOFF_20261019.md](docs/handoff/APP003_ASSET_GENERATION_HANDOFF_20261019.md) | **別セッション用 ASSET-01 制作指示**：10点先行画像の内訳、生成プロンプト、権利・採否審査、約100バリエーションへの拡張方針 |
| [docs/MAIN_WAVE1_AD_ANALYSIS.md](docs/MAIN_WAVE1_AD_ANALYSIS.md) | **広告本調査 第1弾**：札幌・京都・福岡・那覇の5物件・15ページの分析 |
| [docs/MAIN_WAVE2_AD_ANALYSIS.md](docs/MAIN_WAVE2_AD_ANALYSIS.md) | **広告本調査 第2弾**：広島・金沢・高松3物件・9ページの分析 |
| [docs/MAIN_WAVE3_AD_ANALYSIS.md](docs/MAIN_WAVE3_AD_ANALYSIS.md) | **広告本調査 第3弾**：神戸・盛岡・岡山3物件・9ページの文章・生活情報分析 |
| [docs/MAIN_WAVE4_AD_ANALYSIS.md](docs/MAIN_WAVE4_AD_ANALYSIS.md) | **広告本調査 第4弾**：宇都宮・福井・鹿児島3物件・9ページの文章・生活情報分析 |
| [docs/MAIN_WAVE5_AD_ANALYSIS.md](docs/MAIN_WAVE5_AD_ANALYSIS.md) | **広告本調査 第5弾**：川口・北長野・熊本3物件・9ページ、ページごとの文体比較 |
| [docs/MAIN_WAVE6_AD_ANALYSIS.md](docs/MAIN_WAVE6_AD_ANALYSIS.md) | **広告本調査 第6弾**：弘前・徳島・新潟・多摩・宇部5物件・15ページ |
| [docs/CORPUS_30_SYNTHESIS.md](docs/CORPUS_30_SYNTHESIS.md) | **30物件・90ページの一次総括**：広告構文とDREAM／REALITYへの引継ぎ |
| [docs/STB04_HANDOFF_20261017.md](docs/STB04_HANDOFF_20261017.md) | **STB-04検証・再開記録**：POI共通形式、CI・公開反映の証拠 |
| [docs/STB05_HANDOFF_20261017.md](docs/STB05_HANDOFF_20261017.md) | **STB-05検証・再開記録**：近接重複、住所確認フラグ、残件 |
| [docs/STB06_HANDOFF_20261017.md](docs/STB06_HANDOFF_20261017.md) | **STB-06検証・再開記録**：業態優先、信頼度、出典の矛盾、残件 |
| [docs/STB07_HANDOFF_20261017.md](docs/STB07_HANDOFF_20261017.md) | **STB-07検証・再開記録**：API部分失敗、429、タイムアウト、再試行、受入残件 |
| [research/wave5_page_role_scores.csv](research/wave5_page_role_scores.csv) | TOP・CONCEPT/DESIGN・LOCATIONのページ別ポエム度（暫定） |
| [research/ad_corpus_main_wave1.csv](research/ad_corpus_main_wave1.csv) | 本調査の追加5物件の評価・出典データ |
| [docs/LIVING_ENVIRONMENT_SPEC.md](docs/LIVING_ENVIRONMENT_SPEC.md) | **THE DREAM / THE REALITY**。近隣施設・交通・買い物の生活アクセス仕様 |
| [docs/LIFE00_DATA_CONTRACT.md](docs/LIFE00_DATA_CONTRACT.md) | **LIFE-00データ契約**：5分類の仕様正本。LIFE-01で初版UIを実装、追加検索は未実装 |
| [docs/LIFE01_IMPLEMENTATION_20261017.md](docs/LIFE01_IMPLEMENTATION_20261017.md) | **LIFE-01**：ポエムの下の折りたたみ式THE REALITY、5カテゴリと直線距離。Node36件成功・実機未検証 |

## v0.1.2 安定化の進捗（2026-10-17）

- [PR #1](https://github.com/yama-books/mansion-poet/pull/1)：地名検索・地図逆引き・施設取得中の地点変更で古い結果が割り込まないようにしました。
- [PR #2](https://github.com/yama-books/mansion-poet/pull/2)：施設取得へ正しい地点情報を渡す不具合を修正し、文体別キャッシュ・再生成時の施設選択を改善しました。
- GitHub Actionsで **外部APIを呼ばない回帰テスト29件**を実行（元の9件とPOI共通化・重複排除・分類信頼度・通信障害対策の追加20件）。[PR #7のCIで29件成功](https://github.com/yama-books/mansion-poet/actions/runs/38991873254)を確認。
- [PR #4](https://github.com/yama-books/mansion-poet/pull/4)でOpenPOI/OSMデータの共通形式・距離検査、[PR #5](https://github.com/yama-books/mansion-poet/pull/5)で近接重複と自治体住所の確認フラグをmainへ反映。**[GitHub Pages公開成功](https://github.com/yama-books/mansion-poet/actions/runs/38988895125)**、公開HTMLの新処理とHTTP 200を確認済み。
- [PR #6](https://github.com/yama-books/mansion-poet/pull/6)で施設分類信頼度を追加し、明示業態（例：`bar_izakaya`）を名前より優先。相互に矛盾する分類の自動採用を保留。[Pages配信成功](https://github.com/yama-books/mansion-poet/actions/runs/38990694991)、公開HTMLの反映・HTTP 200を確認済み。
- [PR #7](https://github.com/yama-books/mansion-poet/pull/7)で429・タイムアウト・部分取得・全失敗を区別。利用できる施設データだけで創作を続け、アクセス制限時は案内文を表示。一時的な失敗は再生成で再取得する。[GitHub Pages配信成功](https://github.com/yama-books/mansion-poet/actions/runs/38991967295)、公開HTML HTTP 200・反映を確認。
- **v0.1.2のSTB-01〜07はコード・CI・Pages反映済み**ですが、バージョンの受入完了は未確定です。実ブラウザでの地点選択→生成・iPhone等の実機確認が未完了。[ROADMAP.md](docs/ROADMAP.md)を参照。

## 次の開発計画

現状はブラウザで動く基礎が完成した段階です。**v0.1.2の競合対策とキャッシュ修正に着手済み**で、残るPOI信頼性改善を続けます。その後は**v0.2のUI洗練**、**v0.3〜0.4の土地特徴・文章生成の品質**、**v0.5の広告画像出力**へ進みます。 [マスタープラン](docs/DEVELOPMENT_PLAN.md) が実装・完了判定の正本です。設計書にある未着手の機能は現行版には含まれません。

## 広告研究と住環境機能の段階実装

2026-10-17に、実在のマンション広告30物件・約90ページを調べる計画と、詩（THE DREAM）から実際の施設・距離（THE REALITY）を見比べる構想を追加しました。 **予備調査として8物件×3ページの公式サイトを読み、広告表現と生活施設表示を比較した報告を保存しました。** **弘前・徳島・新潟・多摩・宇部の5物件を追加し、当初の30物件・90ページの公式広告について一次文面調査を収録しました。** 実ビジュアルは6物件のPCトップのみ確認、モーション・スマホ版・独立採点と店舗現況照合は未完了です。 TOPは実用的でもCONCEPT/DESIGNには詩的表現が現れるため、ページ別ポエム度P_pageを新たな補助評価として記録。低ポエム度の物件全体サンプルは依然として不足し、川口の暫定P1も再採点が必要です。 広告情報の取得に短時間利用上限が生じた場合も、別の公開閲覧手段で確認できたページのみ調査済みとして記録しています。 実際のビジュアルを画面で直接確認したのはPilot 8物件中6件のPCトップ画面です。残るS07・S08の視覚確認、全8件のスマートフォン画面とモーションの実動作確認は未完了です。S03・S06は同一担当者による再採点を実施しましたが、盲検での再現性検証ではありません。[広告研究計画](docs/ADVERTISEMENT_RESEARCH_PLAN.md)／[生活アクセス仕様](docs/LIVING_ENVIRONMENT_SPEC.md)を参照してください。公開版にはLIFE-01として折りたたみ式「THE REALITY」の5分類を実装済みですが、施設の追加検索・網羅性改善とスマホ実機検証は未完了です。

### 関連する先行作品

- [マンションポエム ジェネレーター（Play Tools）](https://play-tools.com/mansion-poem) ｜ [作者の開発紹介](https://note.com/hal_bit/n/n8f372ac08635) （別作者による独立した作品・非提携）
- [マンションポエム徹底分析！（デイリーポータルZ／大山顕）](https://dailyportalz.jp/kiji/170728200270) （研究参考）

アプリ本体のフッターにも関連作品への控えめなリンクを追加する計画です。ソースに記載したことと、公開画面に掲載したことは区別して管理します。

## デザインコンセプト

**「架空の超高級レジデンス公式サイト」**

深緑・チャコール、アイボリー、シャンパンゴールド、建築的な余白、大胆な英字タイポグラフィと日本語明朝体。UIは至って真面目に、コピーは大胆に誇張する。

建物の描画は独自のSVGであり、実在物件の写真ではありません。

## 技術構成

```text
mansion-poet/
├── index.html              # UI、CSS、生成エンジンを含む静的Webアプリ
├── src/poem-catalog.js    # 63ジャンル×10変奏の文章辞書
├── src/location-highlights.js # 29細分類×3案＋一般10テーマ×3案の施設PR文章
├── tests/                 # 生成・分類・状態管理の回帰テスト
├── README.md               # このファイル
└── docs/
    ├── CONCEPT.md          # 構想・仕様
    ├── DATA_SOURCES.md     # 地理・施設データと利用上の注意
    └── ROADMAP.md          # 開発ロードマップ
```

地図の描画にはCDN版Leafletを使用します。施設検索の主な接続先は `https://api.openpoiapi.com/v1/search` です。APIキーは必要ありません。生成は地点選択に続く明示的なボタン操作で始まり、入力・座標が外部サービスへ送信されることがあります。現段階でサーバーやデータベースは必要ありません。GitHub Pagesなどの静的ホスティングに配置できる構成です。

## 注意事項・現段階の制約

- **物件名と文章は創作です。** 実在物件、景観、交通利便、資産価値を保証しません。
- 施設取得は指定地点から半径約850m。OpenPOIは無条件検索と特徴語検索を併用し、施設を文教・文化・歴史・自然・交通・商業・飲食に分類して採用します。住所と座標がずれた施設や閉業した店舗が残る場合があります。標高・土地利用の体系的な取り込みは未実装です。
- 地名検索欄に文字を入れただけでは地点は確定しません。**候補を選ぶ**か、地図・サンプル地点で指定してください。
- 外部APIの制約や停止により検索・地図・施設取得が失敗する場合があります。外部接続できない時には地名ベースでの生成に切り替えます。
- 地名・座標などは、ユーザーの操作によって外部の地理データサービスへ送信される場合があります。
- 公開APIやCDNの利用条件、提供側のアクセス制限、著作権・帰属表示は公開運用前に再確認してください。
- **GitHub Pagesでの公開、地名検索、OpenPOIとの通信およびポエム生成は実ブラウザで確認済み**です。Overpass障害時とiPhone/Android実機による操作性は未検証です。

地図：© 国土地理院（地理院タイル）／施設データ：[OpenPOI APIの出典・ライセンス](https://openpoiapi.com/attribution.html) ／ [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright)（取得できた場合）。

## リポジトリと公開

開発正本：**[yama-books/mansion-poet](https://github.com/yama-books/mansion-poet)**

GitHub Pages公開済み（初回公開はGitHub Actions成功）。公開URL： https://yama-books.github.io/mansion-poet/

---
*Making absolutely everything sound prestigious.*
