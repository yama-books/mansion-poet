# APP-003｜UI01-MOBILE 実機Web操作性 CHECKPOINT（2026-10-22）

- Work-ID: APP-003/UI01-MOBILE-01
- Repo: yama-books/mansion-poet
- Branch: feature/app003-ui01-safari-mobile-20261022
- 対象：公開WebアプリのiPhoneでの基本操作・タップ領域・表示安定性
- 状態：**専用Draft PR #40上の小規模UI改善、GitHub Actionsの既存130件とChrome5画面幅が成功。公開Pagesへの反映・iPhone実機受入は未実施。**
- 全体正本：[APP003_MASTER_PLAN_PROGRESS.md](APP003_MASTER_PLAN_PROGRESS.md)
- 関連：[UI01コピー範囲](UI01_COPY_SCOPE_20261017.md)、[品質検証計画](QUALITY_TEST_PLAN.md)

## 目的と最小変更

- 既存トップの世界観を維持し、iPhoneのヘッダーから1タップで制作画面（#discover）へ移動できる「つくる」リンクを追加。長いヒーロー画像をスクロールしなくても検索可能。
- 320/375/390/430pxで検索、プリセット、コピー／再生成／印刷ボタンのタップ領域を**44px以上**確保。iOS入力欄の文字を16px以上として意図しない自動ズームを抑える。
- safe-area-insetに対応し、画面端の欠けを避ける。長い物件名の折返しで横スクロールを防ぐ。
- reduced-motionの既存設計、印刷CSS、地点取得、内容生成、地図、REFライブラリは変更しない。
- 新しいWebアプリやサーバーを作らず、既存index.htmlへ小変更にとどめる。

## 自動ブラウザQA

.github/workflows/mobile-device-qa.yml から既存Node回帰に加え、Chrome（モバイル画面幅をエミュレーション）で検証。

| 幅 | 観点 |
|---|---|
| 320 | 狭い端末、UI折返し |
| 375 | 小型iPhone相当 |
| 390 | 一般的なiPhone幅 |
| 430 | 大型iPhone幅 |
| 1440 | PCの従来デザイン |

- HTTPでHTML/CSSを読込、横方向にはみ出さない。
- スマホ版「つくる」で#discoverに移動し、フォームが見える。
- 検索inputのfont-sizeが16px以上。
- ヘッダーリンク、検索、入力、プリセット、生成、コピー2種、再生成、印刷の枠が44px以上。
- 中野プリセットで地点が変わり、旧ポエムのコピー／印刷が無効になる。
- 日本語フォントを揃えて#discover/#poemのスクリーンショットを保存。
- 自動テストは第三者APIへのアクセスを遮断。GPSや住所を送信しない。

**Chromiumの幅エミュレーションはSafari実機確認ではない。** Safariのタップ・キーボード・共有／印刷メニューは人手の実機検収を必要とする。

## CI実行結果（2026-10-23 JST確認）

- [PR #40](https://github.com/yama-books/mansion-poet/pull/40)の追加改善：検索欄に iPhone Safari の検索キーボードを誘導する `enterkeyhint=search`、自動大文字化を抑える `autocapitalize=off`、検索状態の `role=status` と `aria-live=polite` を追加。場所検索／生成JSロジックは変更していない。
- 追加テストがこれらの属性をChromeの実ブラウザから検証する。
- [Mobile viewport QA Actions #39863730582](https://github.com/yama-books/mansion-poet/actions/runs/39863730582)：**completed/success**、Node回帰 **130/130**、Chrome **320/375/390/430/1440pxすべて成功**。比較画像artifact #12461914027（[GitHub Actionsから取得](https://github.com/yama-books/mansion-poet/actions/runs/39863730582/artifacts/12461914027)）。
- [従来回帰 Actions #39863730596](https://github.com/yama-books/mansion-poet/actions/runs/39863730596)：**completed/success**。
- **iPhone Safari実機のタップ操作／コピー／印刷、Pages公開は引き続き未確認・未実施**。Chrome画面幅テストやCI完了を端末実機での受入と報告しない。
- GitHub PR本体はDraftのままとし、プレビューも既存の本番Pagesへは公開していない。公開判断は別段階とする。

## Previewファイルの隔離保全（2026-10-23追記）

Draft PR #40のActionsに `app003-ui01-preview-site` artifact出力を追加した。候補版の `index.html` と現行の `src/subject-policy.js`・`src/poem-catalog.js`・`src/location-highlights.js` をセットにして保存する。**これはダウンロード可能なHTML/JSファイル群であり、そのままiPhoneでアクセス可能なHTTPS URLではない。** 本番GitHub Pagesの`index.html`やデプロイworkflowは書き換えない。

- 作業コミット：`194e746`
- [検証ワークフロー（PR #40）](https://github.com/yama-books/mansion-poet/blob/feature/app003-ui01-safari-mobile-20261022/.github/workflows/mobile-device-qa.yml)
- [上記コミットのActions](https://github.com/yama-books/mansion-poet/actions?query=branch%3Afeature%2Fapp003-ui01-safari-mobile-20261022)
- HTTPSの実機用公開はユーザー受入手段を決めてから別工程で行う。URL・公開完了を推定しない。

## iPhone実機受入チェック

1. 初期画面で右上「つくる」を1回タップ、場所選択へ移動。
2. 神保町→中野→京都プリセット、選択地名・旧コピー無効を確認。
3. 地名入力でキーボードが不要に画面を拡大せず、検索ボタンが押せる。
4. 実検索→作品生成→施設紹介→コピー2種→再生成→印刷を試す。通信エラー時の代替表示を確認。
5. 縦横回転・文字サイズ拡大・Safari下部バー有無でボタンが隠れず、横スクロールがない。
6. 参考ギャラリーの既存公開画面は別経路として保持。

## 作業の隔離

- 差分はindex.htmlのヘッダー1リンク＋モバイルCSS、ブラウザQA、この文書。
- PR #39の印刷組版・画像合成、PR #31・#30・#33、画像制作PR #37/#38を変更しない。
- GitHubのmain、Pages公開ワークフローは変更しない。
- AGENTS.mdは開始時のmainで404だったため、最新全体計画・QA計画・PR差分を参照。

## 次の1操作

自動CIは合格。GitHub ActionsのChromeスクリーンショットをレビューし、公開可能なiPhone Safari実機確認用のプレビュー方法を選定する。ユーザー検収前にmainマージやPages公開を行わない。PRINT03画像合成のPR #39と編集範囲を分ける。


## 引継ぎ再開後の検証（2026-10-24 JST / HEAD `8c60d2a`）

- 引継ぎ正本：[`APP003_UI01_MOBILE_HANDOFF_READY_20261024.md`](https://github.com/yama-books/mansion-poet/blob/docs/app003-ui01-handoff-20261024/docs/checkpoints/APP003_UI01_MOBILE_HANDOFF_READY_20261024.md)（独立した引継ぎ用Draftブランチ上）。
- 停止時の[Mobile QA #39947614380](https://github.com/yama-books/mansion-poet/actions/runs/39947614380)をログから再調査。既存Node **130/130成功**後、フォント準備工程が約12分間進まずキャンセル。Chrome smoke / 新規`full-flow.cjs`へ未到達。フォント準備内のどのコマンドで停止したかは確証なし。
- UI01の作業ブランチに限りCIファイルを修正（commit [`8c60d2a`](https://github.com/yama-books/mansion-poet/commit/8c60d2a3ac1cd57a8b3b7cb6b4d66823688689f4)）。フォント導入はベストエフォート・80秒制限、工程上限2分とし、`fc-cache -f`による強制再構築を撤去。主検証のブラウザQAを阻害しない。
- [Mobile QA #40038418735](https://github.com/yama-books/mansion-poet/actions/runs/40038418735) **completed/success**。既存Node **130/130**、Chromeの **320 / 375 / 390 / 430 / 1440px：5/5 PASS**、決定的モックによる検索→施設→生成→コピー2種→印刷→通信障害時の旧地点コピー混入防止が **mobile-390 / desktop-1440の両方で PASS**。本処理のログ `E2E COMPLETE FLOW OK` と `E2E OUTAGE / NO STALE COPIES OK` を各2件確認。
- [従来Verify #40038418740](https://github.com/yama-books/mansion-poet/actions/runs/40038418740) **completed/success**。
- `app003-ui01-preview-site` artifact [#12538605572](https://github.com/yama-books/mansion-poet/actions/runs/40038418735/artifacts/12538605572)（HTMLと依存JS 5ファイル）。`app003-ui01-mobile-viewports` artifact [#12538530881](https://github.com/yama-books/mansion-poet/actions/runs/40038418735/artifacts/12538530881)（PNG 16枚）を取得確認。
- 代表キャプチャ `iphone-320-workspace.png`、`iphone-320-poem.png`、`iphone-430-workspace.png`、`mobile-390-complete-poem.png` を画像として目視確認。明白な横はみ出しやボタンの欠落は認めず。320/430pxの「POETRY INDEX / ポエム濃度」と項番03が窮屈に近接しているため、実機での可読性確認候補とする。自動検査合格はこの視覚的課題を否定しない。
- **未完了**：iPhone Safari実機操作（検索、文字入力、クリップボード、共有/印刷、画面回転）、HTTPSの候補版プレビュー実URL提供と到達確認。GitHub Pages既存本番とmain、他担当PRを変更していない。

**次の1操作**：本番を上書きしないHTTPS候補版のホストとアクセス確認を決定。iPhone Safariで本人が操作・検収できるURLを確認してから実機受入へ進む。

## UI01-MOBILE-01 再開後CHECKPOINT（2026-10-24 JST）

**対象はDraft PR #40のみ**。main / 既存GitHub Pages / PR #31・#39・#41 / 写真制作には書き込まない。

- 引継ぎ後にCI #39947614380のキャンセルを再調査。既存Node 130/130後の日本語フォント準備でタイムアウトし、ブラウザE2Eは未実行だった。
- [CI修正 `8c60d2a`](https://github.com/yama-books/mansion-poet/commit/8c60d2a3ac1cd57a8b3b7cb6b4d66823688689f4)により、Node / Chrome幅5種 / モックE2E（検索→POI表示→コピー2種→印刷→通信障害と地点変更の旧コピー防止）が完走。[Actions #40038418735](https://github.com/yama-books/mansion-poet/actions/runs/40038418735) completed/success。
- 320pxと430pxの画面画像で`POETRY INDEX / ポエム濃度`と項番03が密着していたため、`index.html`の見出しと番号を別spanに分離して間隔を調整。フォントと文字色はもとの`field-label`を維持。Chromeで両表示領域が5px以上離れていることを`tests/mobile-device/browser-smoke.cjs`に追加。**アプリ側の最終UI変更commitは`7e83c2d`**。
- [Actions #40039631695](https://github.com/yama-books/mansion-poet/actions/runs/40039631695)は機能検証成功だが、フォントのapt取得が80秒で失敗。スクリーンショットの日本語が豆腐字になったことを目視で発見。**この画像を視覚検収合格の根拠にしない。**
- 続くCI修正[`e00832f`](https://github.com/yama-books/mansion-poet/commit/e00832f7efdc94370e4f12ad928d68bbfd46b1b1)で、日本語グリフの有無を検査し、不在時にはOFLライセンスのNoto Sans JPをGoogle Fontsの公開ソースから**CIランナーのみ**に時間制限付きで配置。フォント取得に失敗すればスクリーンショットQAを成功扱いしない。
- [最終モバイルQA #40039986067](https://github.com/yama-books/mansion-poet/actions/runs/40039986067)：**completed/success**、Node **130/130**、Chrome幅 **320/375/390/430/1440px 5/5成功**、モックE2E完走（mobile-390 / desktop-1440の検索・生成・コピー・印刷・通信障害時の旧コピー防止）。ログで`Noto Sans JP`の配置を確認。スクリーンショット16点をartifact [#12539290288](https://github.com/yama-books/mansion-poet/actions/runs/40039986067/artifacts/12539290288) に保存。320px画面を読戻して目視し、日本語グリフが表示され、項番03と見出し/値85の衝突がないことを確認。
- [従来Verify #40039986143](https://github.com/yama-books/mansion-poet/actions/runs/40039986143)も completed/success。
- 端末確認用の**独立HTTPS候補リンク（固定ソース）**：https://raw.githack.com/yama-books/mansion-poet/7e83c2dee385d8939f309ca68be99fb535454bbe/index.html 。原本はPublicリポジトリの固定commitにある。GitHub Actionsから当該ファイルと依存JS 3件のHTTP取得成功を確認（#40039631695）、最終workflowのHEAD `e00832f` のファイル取得も成功（#40039986067）。外部RawGitHackによるプレビューであって、GitHub Pages本番公開ではない。
- RawGitHackのブラウザ確認画面が表示される場合がある。外部サービスを経由する一時プレビューのため、入力は公開サンプル地名のみとし、住所や秘密情報を入力しない。
- **未確認**：iPhone Safariのタッチ/キーボード/クリップボード/共有/印刷、実機でのレイアウト・縦横回転・フォント拡大、最終的な本番反映可否。ChromeエミュレーションやGitHub Actions上のHTTP成功は、iPhone Safari実機受入を代替しない。

**次の1操作**：iPhone Safariで固定プレビューを開き、「つくる」→中野→生成→コピー2種→京都へ地点変更→印刷の導線を実操作する。不具合があればPR #40へ最小修正し、問題なければ独立した公開/統合判断を行う。

## AD-COPY / PRINT02-SAFARI-FIT 実装修正 CHECKPOINT（2026-10-24 JST）

**根拠：iPhone Safariの印刷画面で1広告が2ページになり、本文に「周辺の公開データに記された『明治鍼灸柔整予備校』。」が混入した実機指摘。**

### 対応（PR #40 内）

1. `src/poem-catalog.js` の出典説明型 `sourceIntro` を廃止。施設名を保持しつつ、生成番号に応じた10種の広告向け導入文へ置換。文体・濃度による出力差は維持。周辺データから確認できない物件の実在・入学・居住者特性等を新たに断定しない。
2. `src/location-highlights.js` とPOEM語彙内に残っていた「地図に記された〜」という資料説明型の3表現も広告向け表現へ変更。本文とLOCATIONの全バリエーションで出典説明型フレーズを禁止する回帰テストを追加。
3. `index.html` の案2「1枚広告」をA4向けに組み直し。余白・行間・カード配置を印刷CSS内で縮小。**カードを削除したり、はみ出し箇所を隠したりしない。** 全3件の施設・直線距離・必要な出典・創作注記を保持する。
4. LOCATIONの住所不明時に「所在地詳細：公開データ未収録」を広告欄へ焼き込まず、住所行を省略する。検証できた地域・住所のみ簡潔なラベルで表示。施設住所を選択地点の住所で補う処理は引き続き禁止。出典はカードの小さな表記と注意書きに保持。
5. `tests/mobile-device/full-flow.cjs` に実PDFのA4ページ数判定を追加。通常例と長い施設名3件のストレス例をそれぞれ390px相当と1440pxで生成し、**各PDFが1ページ**であることを検査。コピー・地点変更・通信障害時の旧情報混入防止も継続。
6. `tests/location-races.test.mjs` は住所欠落を省略する新表示と整合させ、所在地の創作禁止・地域精度維持・POEM単独と全部コピーの区別を継続検証。

### 確認・証拠

- [Actions #40045357599](https://github.com/yama-books/mansion-poet/actions/runs/40045357599) **completed/success**。既存+追加Node回帰 **133/133 PASS**、Chrome幅 **320 / 375 / 390 / 430 / 1440px** 全成功。モックE2E mobile-390 / desktop-1440 完走。
- [Verify #40045357679](https://github.com/yama-books/mansion-poet/actions/runs/40045357679) **completed/success**。
- [検証artifact #12541061365](https://github.com/yama-books/mansion-poet/actions/runs/40045357599/artifacts/12541061365) にはスクリーンショットとPDFを保全。実際のPDFを `pdfinfo` で読戻し、**mobile-390/desktop-1440 × 通常/長名の4ケースがすべて1ページ**。紙面を画像化して3件のLOCATIONカードと注意書き、文字描画を目視確認。PDFテキスト層に却下された「周辺の公開データに記された」はなし。未確認住所の診断文もない。
- アプリ変更最終検証コミット：[`902e613`](https://github.com/yama-books/mansion-poet/commit/902e61316977e080fda7b4e50bc39a9beb400b81)。
- GitHub ActionsからHTTPSでHTMLと依存JSを取得成功。**更新版候補URL**：https://raw.githack.com/yama-books/mansion-poet/902e61316977e080fda7b4e50bc39a9beb400b81/index.html
- PR #40はDraft・未マージ。本番Pagesとmain、印刷独立エンジンPR #31・写真PR #39等は変更していない。

### 制限・残る実機受入

**Chromeの印刷PDF成功を、iPhone Safariでの印刷2ページ問題の実機解消と同一視しない。** Apple印刷オプションで100%、A4、案2「1枚広告」を選び、新候補版で再検証する必要がある。今後同種の実機2ページ化が残れば、Safari特有の余白/改ページ・文字拡大等を端末実測により補正する。

**次の1操作**：iPhone Safariで上記固定候補URLを開き、神保町等のサンプル地点を生成し、「案2：1枚広告」→印刷プレビューが**1/1ページ**となり広告本文が資料説明調でないことを確認。

## POEM-OPENINGS-200｜2026-10-25 JST

- ユーザー要望：施設名を含む広告の導入表現を従来10種から約200種に増補する。情報ソースの説明調には戻さず、事実に裏づけられない権利・距離・歴史・サービスを宣言しない。
- `src/poem-catalog.js` に**固有の手書き文案200種**を格納。最初の10種は既存のまま。20群×10表現で視点・余白・都市の時間・物語・邸宅観・名の響きなどを展開。施設名を`{name}`にテキスト置換する。既存のジャンル別見出し（10種）、スタイル、濃度、適格性判定を変更しない。
- 導入文の選択のみ `serial` を200周期化し、11回目にも新しい導入が選ばれ、201回目に1番へ戻る。UIや通信は増やさない。
- `tests/poem-catalog.test.mjs`：施設3例・濃度3種の全文生成、広告導入200個の一意性、ジャンル見出し10種の維持、元POI名維持、禁止文言不使用、201番目の周期を検証。
- [Draft PR #40](https://github.com/yama-books/mansion-poet/pull/40) 作業ブランチのコミット [`e00932a`](https://github.com/yama-books/mansion-poet/commit/e00932af544f2f01226f0e269fadc94a3e5d8673)、[`76f7617`](https://github.com/yama-books/mansion-poet/commit/76f7617c760f862ad75af7a92f40afc04c36ead2)。
- [Verify #40110624630](https://github.com/yama-books/mansion-poet/actions/runs/40110624630)：completed/success、Node **134/134**。
- [Mobile QA #40110624616](https://github.com/yama-books/mansion-poet/actions/runs/40110624616)：completed/success、Node **134/134**、Chrome **320/375/390/430/1440px 5/5**、mobile/desktopのコピー・生成・印刷・旧地点混入防止E2E PASS。固定コミット候補のHTTPS取得も成功。
- **未確認**：iPhone Safariで200種類を目視評価した事実はない。紙面レイアウトに関するSafari実機受入は引き続き未了。main、Pages、本番公開、他PRを更新しない。

**次の1操作**：iPhone Safariで固定候補 https://raw.githack.com/yama-books/mansion-poet/76f7617c760f862ad75af7a92f40afc04c36ead2/index.html を開き、施設生成と再生成、印刷1ページを目視確認する。

## POEM-EDITORIAL-01｜文体品質の研磨（2026-10-25 JST）

- 全体計画の正本：[`docs/APP003_MASTER_PLAN_PROGRESS.md`](https://github.com/yama-books/mansion-poet/blob/main/docs/APP003_MASTER_PLAN_PROGRESS.md)、画像の正本：[`APP003_ASSET_WORKBOARD.md`](https://github.com/yama-books/mansion-poet/blob/main/docs/APP003_ASSET_WORKBOARD.md)。
- ユーザー要望：200種類の導入広告表現を、数ではなく意匠の質で改善。従来の200種は保持し、**うち68文を編集校正**。抽象語・創作手順の自己言及・不自然な言い回しを抑えて不動産広告の語感と余白を調整。根拠のない施設属性や住戸からの眺め等は追加していない。
- **既存63ジャンル×10見出し（630件）／導入200種／地点の採否・出典・距離・選定ロジックは維持**。`src/poem-catalog.js` だけで三段の濃度表現を調整。高濃度の機械的な固定第四行を廃止し、`heritage`／`urban`／`nature`の結びを明確に差別化。全濃度で3行の広告文を基本とし、長い紙面での内容冗長性を減らした。最初の10種の導入文は改変なし。
- 主なコードコミット：[`5b0ee43`](https://github.com/yama-books/mansion-poet/commit/5b0ee43119cd02197c3fd75ba0f620a5164355ba)（68文の編集）、[`c453f3b`](https://github.com/yama-books/mansion-poet/commit/c453f3b6ac3eebf59f16174c30c21bac043968e4)（3濃度×3文体）、[`ad65ea6`](https://github.com/yama-books/mansion-poet/commit/ad65ea6f425dce29ea9ba0d7905d317eea69c533)（200種×3文体×3濃度の検証追加）。
- GitHub Actions [Verify #40140998545](https://github.com/yama-books/mansion-poet/actions/runs/40140998545)：**completed/success、Node 135/135、fail 0**。
- [Mobile QA #40140998556](https://github.com/yama-books/mansion-poet/actions/runs/40140998556)：**completed/success、Node 135/135、Chrome 320/375/390/430/1440px 5幅成功、生成・コピー・印刷／地点切替E2E成功**。GitHub Actions上でコミット固定HTTPSプレビューのHTML/依存JSへのHTTPアクセス成功。
- 端末試用プレビュー：https://raw.githack.com/yama-books/mansion-poet/ad65ea6f425dce29ea9ba0d7905d317eea69c533/index.html （外部プレビュー、GitHub Pages本番ではない）。
- **未完了**：全文200本の利用者による文学的採否、iPhone Safariの実機印刷（1ページか）、印刷用ARTの独立原画・採用・画像合成と配信。CIで合格しても実機合格を宣言しない。
- **全体計画からの次の優先**：①画像セッションで既存ART成果を照合し独立ART最大3点の原本を専用PRに保全、②PRINT03-IMG-01（PR #39）で代表1点を合成してA4/Webの比較、③PR間の最新HEADを再比較して段階的統合、④iPhone Safari印刷・操作の受入。大量画像生成・公開・mainマージはそれぞれ別承認／ゲート。
- **競合防止**：このブランチは文章・UI01・限定印刷CSSのDraft PR #40。画像制作担当は `src/poem-catalog.js`、`index.html`、`tests/mobile-device/` を編集しない。PR #39／#38／#37のファイルは現状維持。

**次の1操作**：独立ARTの保存が確認でき次第、PR #39の実画像合成PoCに渡す。文章ブランチはmainへはまだ統合せず、Safari印刷再検収の結果を待つ。
