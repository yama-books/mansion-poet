# APP-003 REF-LIB-03｜実機プレビュー・受入手順

更新：2026-10-22 JST  
状態：**専用ブランチ上の実装・CI受入候補。本番Pagesには未公開。**  
元資料：Draft PR #35（REF 2原画 + 17crop、19PNG）  
実装：\`tools/reference-gallery/index.html\`、\`gallery.js\`、\`gallery.css\`、\`src/reference-gallery/gallery-model.js\`  
ビルド：\`scripts/reference-gallery/build_preview.py\`

## 1. 初期機能

- 19画像をmanifestから読み、\`uploaded_verified\`・安全な参照パスの画像のみ表示。画像生成・再切り出しを行わない。
- 原画別・上段／下段別・版型・画風・施設との相性・紙面条件の絞り込みと日本語検索。
- 画像は\`object-fit: contain\`、\`loading=lazy\`。拡大表示の原寸比率を維持し、前後移動・閉じる・キーボード操作を提供。
- 参照資料であることを明記。\`publishedAllowed=false\`を変更せず、物件の実在写真として表示しない。
- 375〜430pxのiPhone幅だけでなく320pxも想定、指で押せる46px操作領域、safe-area、ブラウザ標準ダイアログ、CSS reduced-motion。
- 本体のindex.html、PRINT03エンジン、POI辞書、Pagesワークフローには手を加えない。

## 2. PRプレビューをPCで開く

CIの\`Verify reference gallery preview\`ワークフローが成功すると、次の2つのartifactをPRのActions実行画面から入手できる。

1. \`app003-reference-gallery-preview\`：HTML/CSS/JS/manifestと参照PNG19点を含む最小サイト一式（約9MB）。
2. \`app003-reference-gallery-qa-screenshots\`：PC 1440px、390px、320pxの一覧・拡大表示スクリーンショット（各2点）。

プレビューartifactはZIP展開後、**HTMLファイルをダブルクリックするのではなくHTTPサーバーで表示**する。JavaScriptの\`fetch\`がローカルfile:// URLで動かないブラウザがあるため。

Windows PowerShellで展開先のフォルダを\`$site\`へ指定した例：

~~~powershell
$site = "D:\Downloads\app003-reference-gallery-preview"
python -m http.server 8765 --bind 127.0.0.1 --directory $site
~~~

PCブラウザで：\`http://127.0.0.1:8765/tools/reference-gallery/index.html\`。終わったらPowerShellで Ctrl+C。

本番Pagesでは提供しない。上のURLはPCのローカルサーバーを起動している間だけ有効。

## 3. iPhone Safariの実機で開く

iPhoneとWindows PCが同じ**信頼できるLAN**にある場合：

1. PCでプレビューartifactを解凍する。元のGitHubリポジトリ全体を配信しない。
2. PCのLAN IPv4を\`ipconfig\`で確認する。
3. 信頼できるネットワークからのみ使う一時HTTPサーバーを起動する：

~~~powershell
$site = "D:\Downloads\app003-reference-gallery-preview"
python -m http.server 8765 --bind 0.0.0.0 --directory $site
~~~

4. iPhone Safariから\`http://<PCのLAN IPv4>:8765/tools/reference-gallery/index.html\`へアクセスする（山括弧の部分はPCの実際のIPへ置換）。
5. 通信できなければWindows Firewallの該当ネットワーク、PC・iPhoneのLAN分離、VPN設定を確認する。勝手にFirewallを全開放しない。
6. テスト後はCtrl+Cでサーバー停止。外部ネットワークへポートフォワードしない。公開サーバーにプレビューを置かない。

PC/iPhone双方でTailscaleの接続権限を持つ場合は、Tailscale IPにだけbindしてiPhoneからそのIPを開く方法もある。PCが複数NICを持つ場合、ユーザーが信頼できる接続経路を選ぶ。

## 4. 実機で確認する6つの操作

1. 390pxの縦画面で19枚が表示され、2列のカードが画面右端から切れない。
2. 画像をタップすると拡大ダイアログが開き、全体像が欠けず、閉じるで元カードに戻る。
3. 検索欄へ「文教」・「水辺」・「施設0件」を入力し、結果が変化する。
4. 「高級誌面」→「建築写真風」等を選び、意図した上段画像だけに絞れる。
5. ダイアログの次／前ボタンが操作でき、横スクロールしない。
6. 画面横向き、iPhone Safariの文字サイズ拡大、ネットワーク低速時、必要なら320px相当幅でも表示崩れがない。

画面/検証ケースと端末名、iOS/Safari版、スクリーンショット、問題があれば該当REF-IDを記録する。**CIのChrome iPhoneサイズエミュレーションは本物のSafari/iPhone実機検証ではない**。

## 5. CIとプレビューartifact

\`.github/workflows/reference-gallery-preview.yml\`が独立して以下を実施：

- Node純粋関数の検索テスト（実際のmanifestで19件を検証）
- Pythonによるmanifest各画像のSHA-256・PNG寸法確認と、最小サイトパッケージ作成
- ChromeのPC1440px・モバイル390px/320pxエミュレーションによる一覧19件、絞り込み、拡大表示、前後移動、横はみ出し、画像読込テスト
- 成功・失敗に関係なくプレビューZIPとスクリーンショットをActions artifactとして短期保存

このワークフローは\`main\`やPagesのデプロイをしない。PR #35のbranchをベースにした専用PRで検証する。

## 6. 次の節目

- GitHub CI成功確認後、PR artifactをPCから起動して実操作を確認。
- iPhone Safariでスクリーンショットを取り、長いタグ、横画面、ダイアログ、検索の指での押しやすさを確認。
- 表示レイアウトの受入に問題がなければ、タグ検索の品質改善へ進む。
- 画像を新規追加する別セッションは原画やmanifestに追加し、REF-LIB-03のHTML/CSS/JSと同じファイルを同時編集しない。
- PR #35とこのPRのmainへのマージ、Pages公開／公開用artifactに参考画像を含める判断は別に行う。
