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

[Verify reference gallery preview #39747742526](https://github.com/yama-books/mansion-poet/actions/runs/39747742526) で、以下を**成功**と確認：

- Node gallery-model 14/14
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
