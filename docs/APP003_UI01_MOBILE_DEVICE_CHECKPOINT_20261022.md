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
