# APP-003 / PRINT03-LIVE-01｜SESSION COMPLETE

- 判定日：2026-10-28 JST
- 判定：**SESSION COMPLETE / 5 of 5（100%）**
- 範囲：Webアプリ本体の地点選択→POEM/LOCATION生成→A4広告プレビュー→印刷出力機能の接続、既存データ/資料の保全、GitHub main統合、SVG版の正式GitHub Pages公開、公開後HTTP検証と引継ぎ
- **本判定はAPP-003全体の完成宣言でも、ART正式採用やiPhone Safari実機印刷の合格宣言でもない**。

## 正本・固定の成果

- Repo: https://github.com/yama-books/mansion-poet
- branch: `main`
- アプリコードの最終公開対象 merge commit: `8ef9ca4d32054e8afffbc289b91905cb9b8eb166`（PR #46）
- この記録作成前のmain HEAD: `38109e89fdf37cf757671c578922b1b15aab59d7`（ドキュメント追記）
- [Web本番公開URL](https://yama-books.github.io/mansion-poet/)
- [印刷機能の安全統合PR #45](https://github.com/yama-books/mansion-poet/pull/45)：merged、commit `e05d8e9b47fb9154e63bf443c6c4f6104712b22a`
- [公開SVG版の焦点UI整備PR #46](https://github.com/yama-books/mansion-poet/pull/46)：merged、commit `8ef9ca4d32054e8afffbc289b91905cb9b8eb166`
- 別途候補PR #31/#39/#40/#43/#44の存在と承認状態は変更せず、最新版統合実装の正本はmainとする。古いDraftを再マージしない。

## 完遂条件（このセッションに限る）

1. [x] 既存PRINT03契約・組版核とアプリ本体のPOEM/LOCATIONを接続し、地点・生成の変更に伴う古い印刷内容を無効化
2. [x] 旧印刷形式・参考ギャラリー19画像・従来の生成・地理/出典ルールを保全し、安全に差分統合
3. [x] 未承認ARTを本番の選択UIに出さず、一般公開はSVG線画A4版（試作環境のART比較は独立のまま保持）
4. [x] テスト合格とPDF品質の証跡を残してコードをmainへ統合
5. [x] GitHub Pages配信成功をActionsで確認し、公開URL・JS/CSS・画像ギャラリー・manifest・代表画像SHAのHTTP読戻しを確認

## 検証の根拠

- [APP-003 mobile-device CI #40587881902](https://github.com/yama-books/mansion-poet/actions/runs/40587881902)：completed/success。Node 135/135 PASS、Chromium 320/375/390/430/1440px PASS、実生成→A4 PDF→地点切替失効、WebKit iPhone模擬環境のSVG/ART A4 PASS。
- [Quality CI #40587881956](https://github.com/yama-books/mansion-poet/actions/runs/40587881956)：completed/success。
- [PR #46モバイルCI #40588649362](https://github.com/yama-books/mansion-poet/actions/runs/40588649362)：completed/success。SVG版で無効な焦点UIを隠す仕上げ後の回帰。
- [最新Pages #40588978832](https://github.com/yama-books/mansion-poet/actions/runs/40588978832)：completed/success。公開後HTTP検証でapp root、PRINT03 JS/CSS、gallery manifestの19画像、代表PNG SHA256を確認。
- iOS Safari実機印刷については **PASS未確認**。Linux版WebKitの模擬試験と混同しない。

## 対象外・次セッション候補

- iPhone Safari実機で、公開SVG版の生成→A4紙面表示→共有/印刷/PDF保存を実測する。2026-10-26に試作ART版で確認された組版失敗は、iPhone実機で「直った」とは判定しない。
- ART原画の使用許諾・本番採用/配布の承認は別工程。候補がGitHubに保存されたことは本番許可を意味しない。
- 極端に長い施設名（F03）は欠落を防ぐためA4 2ページへの退避があり、全入力の常時片面1ページ化は未達。要件を変えるなら別工程で検討する。
- APP-003他領域（地理データ網羅性・文章校閲・画像量産等）はこのセッションの100%の分母に含めない。
- PR #31/#39/#40/#44等がopenの場合、古いHEADからの重複main統合を避け、個々の残存差分を監査する。

## 引継ぎ

- 状態：**SESSION COMPLETE**（この会話では新たな実装や試作を開始しない）
- 正本：上記main・公開URL・CI・このCHECKPOINT
- 次の1操作（次セッションを始める場合のみ）：**iPhone Safariの公開SVG版A4印刷/保存を1件実機受入して結果を記録**。
