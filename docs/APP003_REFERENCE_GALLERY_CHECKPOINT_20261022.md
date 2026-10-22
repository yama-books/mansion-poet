# APP-003 REF-LIB-03｜実機向け参考画像表示・CHECKPOINT

記録日：2026-10-22 JST  
APP-ID：APP-003 / Work-ID：REF-LIB-03  
基盤：yama-books/mansion-poet [PR #35](https://github.com/yama-books/mansion-poet/pull/35)（19PNG・manifest）  
表示：[PR #36](https://github.com/yama-books/mansion-poet/pull/36)（この作業のDraft、base: docs/app003-reference-library-20261022）

## 目的と実装範囲

既存の高品質コンセプトシート2原画＋切出し17点を、PC・iPhoneのブラウザから使えるタグ付きの**参照専用画像ライブラリ**として表示。新規画像の制作は別セッション。実際のユーザーによるiPhone Safari確認とGitHub Pagesへの公開は別段階。

変更領域：
- tools/reference-gallery/index.html / gallery.css / gallery.js
- src/reference-gallery/gallery-model.js
- scripts/reference-gallery/build_preview.py
- tests/reference-gallery/gallery-model.test.mjs / test_build_preview.py / browser-smoke.cjs
- .github/workflows/reference-gallery-preview.yml
- docs/APP003_REFERENCE_GALLERY_DEVICE_QA_20261022.mdとREADME索引

**現行index.html、既存アプリの印刷エンジン、地理情報、IMG-PIPE、PR #35側のタグ・manifest・画像19点、本番Pages workflowを変更しない。**

## 表示仕様

- manifest schemaVersion=app003.reference-library.v1を読む。
- uploaded_verified / repoImageExists=true / REFパス制限 / SHA256構造 / 画像寸法が妥当なものだけを一覧化。
- 19点のオリジナル比率を保ち、低解像度cropでも**画像下端を切らない**（CSS object-fit:contain）。
- 元シート別、上段・下段別、版型、画風、施設相性、紙面ケースを個別フィルタ。日本語検索・複合条件・全解除。
- iPhone 390pxで2列、320pxでは1列。タップ領域46px目標。画面内拡大（dialog）、画像前後送り、閉じる後のフォーカス復帰、矢印キー。
- 参考画像内の不正確な価格・施設名・地図を物件情報とみなさない。カード上にREFERENCE ONLY、詳細で創作見本注意を常時表示。
- 参考画像を本番ARTに転用する処理は存在せず、publishedAllowed=falseを維持。
- 外部ランタイム依存なし、既存19PNGの遅延ロード、必要な画像だけ読み込む。
- 追加REFがmanifestへ増えても元シートフィルターは動的生成される。

## 検証結果

### GitHub Actions

[Verify reference gallery preview #39748356426](https://github.com/yama-books/mansion-poet/actions/runs/39748356426) で、以下を**成功**と確認：

- Node gallery-model 15/15
- Python preview packaging 4/4
- バイナリ19点のSHA256／PNG寸法照合→最小preview ZIP構築
- GitHub runnerの日本語フォント不足を発見し、Noto Sans CJK JPをインストールして再撮影
- 実Chromium（Chrome） PC 1440×900・モバイル相当390×844・320×740で、19画像読込、絞り込み、検索、ダイアログ・前後送り、横はみ出し0、ブラウザJS例外0
- 画面イメージを目視：日本語見出し・ラベル・タグの可読、下端切れのない写真表示、モバイルの2列/1列レイアウト

実装確認済み = ChromeブラウザQA + 同幅でのモバイルエミュレーション。**iPhone実機Safari、Android Chrome実機、タップの触感、通信速度、実ディスプレイ色は未確認。**

### Artifact

上記Actionsには7日間の成果物：
- app003-reference-gallery-preview：HTTPサーバーで表示できる最小静的サイト（19PNG＋HTML/CSS/JS/manifest）
- app003-reference-gallery-qa-screenshots：desktop、390px、320pxそれぞれ一覧・詳細のPNG

ユーザーが実機確認するときは[専用Runbook](APP003_REFERENCE_GALLERY_DEVICE_QA_20261022.md)を参照し、PCの信頼できるLAN/プライベートなTailscaleでだけHTTPサーバーを動かす。file://で直開きするとfetchが制限される場合があるのでHTTP経由推奨。

## 今回の安全境界

- 公開済みGitHub上の画像REFであって、**本番広告掲載を承認した画像ARTではない**。
- REF登録時のpublishedAllowed=false、POIの事実/創作区分は変更しない。
- ユーザーが認めていないmain merge、Pages配信、外部サービス公開を行わない。
- 他セッションは新規REFの生成・画像メタデータに集中。PR #36の表示JS/CSSと同時編集しない。
- REF-LIB-03はPR #35をbaseにしたstacked PR。PR #35をmainへ統合するときは、PR #36を正しいbaseへリターゲットし、差分・CIの再検証が必要。

## 次の1操作

ユーザーのiPhone Safariでプレビューartifactを表示し、390px相当での一覧・検索・全画像拡大・縦横画面・文字倍率を確認。必要なUI修正をPR #36へ積む。実機受入と公開可否の承認は別に取得する。


## 2026-10-22｜Web実機検証向けPages公開追補（PUBLISH-01）

ユーザーから「誰にも告知していないURLなので、WEB上で実機確認できるよう公開する」との明示指示を受け、既存のGitHub Pages配信先を維持したまま、参考画像専用のページを追加。

- [PR #35](https://github.com/yama-books/mansion-poet/pull/35) を mainへ merge、commit `c40795de52179ca152b77f53ba0ddea25c02b9cc`。
- [PR #36](https://github.com/yama-books/mansion-poet/pull/36) をPR #35統合後にmainへリターゲットして merge、commit `ea9491d8e1c089781b162b7c3e5b2b64142be827`。
- [Pages deployment #39750370522](https://github.com/yama-books/mansion-poet/actions/runs/39750370522) 成功。Actionsのenvironment URLは `https://yama-books.github.io/mansion-poet/`。
- ギャラリー用URL：**https://yama-books.github.io/mansion-poet/tools/reference-gallery/index.html**。本体のindex.htmlのURLは変更していない。
- deploy-pages.yml の最小配信パッケージに、`tools/reference-gallery/`、`src/reference-gallery/`、`research/visual-reference-manifest.json`、`assets/reference-images/`を追加。画像19点のSHA256/PNG寸法は配信ジョブ前にPython検査、既存Node130件を検査。
- Pages upload artifact `12413675472`を再取得し、tar内部に既存トップページ `index.html`、ギャラリーHTML/JS/CSS、検索モデル、manifest、実PNG19点が含まれることを検証。
- ギャラリーHTMLには `meta robots=noindex,nofollow,noarchive` を追加。**noindexは検索エンジンへ控えるよう伝えるだけで、認証や秘密URL化を保証しない**。GitHub Pagesと公開リポジトリ画像は第三者も取得可能。
- refsの`publishedAllowed=false`は維持。これは**広告・本番ARTへの転用不許可**を意味する一方、参考デザインの展示ページ自体は公開済みと区別する。
- 外部HTTPでのGET検査は、この実行環境の`github.io` DNS解決／閲覧不可のため**実測未確認**。Actionsが成功した事実と区別する。
- 実際のiPhone Safariで、URL到達、19画像の読込、タグ検索、拡大・前後移動、縦横回転、下端見切れ、文字サイズ拡大をユーザーが確認することが次の1操作。

公開範囲は参考画像ギャラリーと従来の本体サイトのみ。PRINT03との本番ART統合はまだ行っていない。


### 公開HTTP検証の後追い確認（2026-10-22）

2026-10-22の初回配信直後は、この実行環境から github.io の名前解決ができないため直接HTTP未確認と記録した。その後、GitHub Pagesワークフローに公開URLのHTTPチェックを追加し、[Actions #39750917571](https://github.com/yama-books/mansion-poet/actions/runs/39750917571) の**deploy＋live HTTPチェックがともに成功**。

- `https://yama-books.github.io/mansion-poet/`：トップのHTMLのGET成功。
- `https://yama-books.github.io/mansion-poet/tools/reference-gallery/index.html`：HTML GET成功、検索エンジンへnoindex/nofollow/noarchive指定確認。
- CSS・画面JS・検索モデルJS：公開URL GET成功。
- `research/visual-reference-manifest.json`：公開GETと参照画像19件を確認。
- `REF-0001-overview.png`：公開GETで画像を取得し、manifestと容量・SHA-256一致を確認。

**公開HTTP到達性は確認済み**へ更新する。ただし、この検証で全19枚を公開URLから再取得したわけではない。残り18画像はデプロイ前のmanifest・SHA一致、Pages配信アーティファクト内の実ファイル存在を検証済み。iPhone実機のタップ／表示操作については未確認のまま。
