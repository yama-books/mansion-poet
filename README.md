# POÈME / ESTATE
### マンションポエムメーカー

> 地名を、壮大な邸宅思想へ。

日本全国の好きな場所を地名検索や地図から選び、その土地の特徴に着想を得た**架空の高級マンション広告風ポエム**を生成する、軽量なWebアプリです。

マンション広告のように無駄にスタイリッシュな画面と、驚くほど荘厳な言葉を楽しむ創作・パロディ作品です。実際の物件の広告・紹介ではありません。

## ブラウザで使う

**[マンションポエムメーカーを開く](https://yama-books.github.io/mansion-poet/)**

GitHub Pagesの公開先です。PC・iPhone・Androidのブラウザで開ける静的Webアプリです。

- 配信方式：GitHub Actionsで `main/index.html` をGitHub Pagesに公開
- 自動公開：`index.html` または `.github/workflows/deploy-pages.yml` を変更したとき
- 公開用ワークフロー：[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)

2026-10-17：初回Actionsデプロイが成功し、実際の公開URLからHTTP 200、画面テキスト・地図タイル・主要操作ボタンの表示を確認しました。さらに公開ブラウザ上で「中野」サンプル選択→生成（OpenPOIで施設8件）と、荻窪の地名検索→候補選択→生成（施設10件）を確認しました。iPhone/Androidなど個別端末の実機操作は引き続き検証対象です。

## 使い方

1. [`index.html`](index.html) をブラウザで開きます。Python、Node.js、ビルド操作、APIキーは不要です。
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
| [docs/LIVING_ENVIRONMENT_SPEC.md](docs/LIVING_ENVIRONMENT_SPEC.md) | **THE DREAM / THE REALITY**。近隣施設・交通・買い物の生活アクセス仕様 |

## v0.1.2 安定化の進捗（2026-10-17）

- [PR #1](https://github.com/yama-books/mansion-poet/pull/1)：地名検索・地図逆引き・施設取得中の地点変更で古い結果が割り込まないようにしました。
- [PR #2](https://github.com/yama-books/mansion-poet/pull/2)：施設取得へ正しい地点情報を渡す不具合を修正し、文体別キャッシュ・再生成時の施設選択を改善しました。
- GitHub Actionsで **外部APIを呼ばない回帰テスト9件**を実行。テスト失敗時にGitHub Pagesへ配信しないチェックを追加しました。
- **v0.1.2は進行中**。API要求自体の中断、施設分類の信頼度・データソース統一、iPhone等の実機試験は今後のタスクです。[ROADMAP.md](docs/ROADMAP.md)を参照。

## 次の開発計画

現状はブラウザで動く基礎が完成した段階です。**v0.1.2の競合対策とキャッシュ修正に着手済み**で、残るPOI信頼性改善を続けます。その後は**v0.2のUI洗練**、**v0.3〜0.4の土地特徴・文章生成の品質**、**v0.5の広告画像出力**へ進みます。 [マスタープラン](docs/DEVELOPMENT_PLAN.md) が実装・完了判定の正本です。設計書にある未着手の機能は現行版には含まれません。

## 新しい研究・将来機能の設計（未実装）

2026-10-17に、実在のマンション広告30物件・約90ページを調べる計画と、詩（THE DREAM）から実際の施設・距離（THE REALITY）を見比べる構想を追加しました。 **予備調査として8物件×3ページの公式サイトを読み、広告表現と生活施設表示を比較した報告を保存しました。** 実際のビジュアルを画面で直接確認したのは8物件中6件のPCトップ画面です。残るS07・S08の視覚確認、全8件のスマートフォン画面とモーションの実動作確認は未完了です。S03・S06は同一担当者による再採点を実施しましたが、盲検での再現性検証ではありません。[広告研究計画](docs/ADVERTISEMENT_RESEARCH_PLAN.md)／[生活アクセス仕様](docs/LIVING_ENVIRONMENT_SPEC.md)を参照してください。現在の公開版に生活アクセス画面はまだ実装されていません。

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
