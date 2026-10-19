# IMG-PIPE-01：ローカル画像受領・加工CLI

Python 3.12以上とPillow 12.3.0（WebP対応）が必要。外部API・画像生成サービスは使用しない。
既存のindex.html、地図、印刷エンジン、配信manifestとは独立している。

## 最初の実行（PowerShell、専用cloneのルート）

この実機では既存の同梱Pythonを使用できる。新規インストールは行っていない。
別環境で必要な場合だけ、専用仮想環境へscripts/image-pipeline/requirements.txtを導入する。

```powershell
$py = 'C:\Users\moyas\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
Set-Location 'D:\dev\mansion-poet\img-pipe-01'
& $py -m unittest discover -s tests/image-pipeline -p test_pipeline.py -v

# 存在しない新規フォルダを指定。既にsample10がある実機ではsample-next等へ変える
& $py tests/image-pipeline/fixtures.py scripts/image-pipeline/.local/sample-next --count 10
& $py scripts/image-pipeline/pipeline.py `
  --manifest scripts/image-pipeline/.local/sample-next/intake.json `
  --input scripts/image-pipeline/.local/sample-next `
  --output scripts/image-pipeline/.local/output-next

# 上の計画を確認して、同じコマンドに --write を付けて書き出す
& $py scripts/image-pipeline/pipeline.py `
  --manifest scripts/image-pipeline/.local/sample-next/intake.json `
  --input scripts/image-pipeline/.local/sample-next `
  --output scripts/image-pipeline/.local/output-next --write
```

デフォルトのdry-runも実際にデコード・変換し、容量・SHA256を計算する。書込みはしない。
--writeでは計画JSONを標準出力へflushした後、新規出力ディレクトリへ書く。
成功後に別のJSON receiptを出すため、--writeの標準出力全体は単一JSONではない。
確定した機械可読レポートは出力先のreport.json。exit 0は処理成功、exit 2は入力・出力エラー。
--helpの引数不備もexit 2。0件は正常終了し空manifestと一覧HTMLを生成できる。

## 入力インターフェース

`scripts/image-pipeline/intake.example.json`が1点分のインターフェース見本。
fixtures.pyで生成したsynthetic-000.pngと一致する。10点はassets配列へ10レコードを入れる。
manifestに列挙したoriginalPathだけを読む。入力フォルダを走査して画像を自動追加しない。

IMG-00（統合計画4.2）のschemaVersion="1.0"、id、group、themes、slots、orientation、
focalPoint、kind、caption、rightsStatus、sourcePromptId、reviewStatusを維持する。
納品契約（ASSET-01の第5節、品質規格の出所管理）の補足フィールドも必須検証する。
画像をまだ生成していない受領時はrenditionsを省略でき、CLIが実体から生成する。
既にrenditionsを渡す場合はscreen/printそれぞれのpath/width/heightの形を検証するが、
そのファイルは入力として読まず、今回の原画から再生成する。
正式配信先assets/images/manifest.jsonの新設・契約変更は本タスクでは行わない。

| 入力 | 規則 |
|---|---|
| id（assetId別名も可） | 小文字英数・ハイフン、1～80字、全件一意。両方あれば一致必須 |
| sceneId / variantId / parentAssetId | 前2つは空でない文字列。原画のparentAssetIdはnull、派生は同じバッチ内のid。循環・同じ親とvariantIdの重複を拒否 |
| originalPath | 入力ルート内の相対パス。ルート外へ解決するリンクや絶対パスを拒否 |
| original（任意） | width/height/bytes/sha256を提供した場合、実測値との一致が必要。width/heightはEXIF回転適用後 |
| group / themes / slots | group文字列、非空themes配列、非空slots配列。slotはIMG-00の5種 |
| orientation / focalPoint | portrait/landscape/squareと実画像を照合。x,yは有限数値の0～1、真偽値は不可 |
| owner / license / sourceURL / assetScope | 非空文字列。sourceURLは出所記録でありアクセスしない。ローカル原画にはurn形式も使用可 |
| createdAt / sourceRetrievedAt / generatedAt | ISO 8601日付または日時 |
| generationTool / sourcePromptId / promptRecipeId / promptText / provenance | 非空文字列。非生成素材もこの受領フォーマットでは制作方法・由来を記録する |
| rightsStatus / reviewStatus | unknown・review_required・approved ／ candidate・accepted・rejected |
| permissionToRedistribute / imageShowsRealPOI | 真偽値。生成画のimageShowsRealPOI=trueは拒否 |
| reviewer / reviewNotes / rejectionReasons / prohibitedTags / noticeType | reviewerは文字列、acceptedなら非空。notes非空、reasons/tagsは文字列配列（空可）、noticeTypeは非空文字列配列 |

kindはIMG-00の5種を認識するが、このCLIの実体入力は単一フレームPNG/JPEG/WebPのみ。
SVGのラスタライズや地図取得は対象外。元画像のEXIF回転を適用し、派生画像のEXIF/GPS/XMP/ICCを除去する。
ICC変換や印刷色校正は行わないため、出力は管理されていないRGB/RGBAとして扱う。

公開候補はrightsStatus=approved、reviewStatus=accepted、permissionToRedistribute=trueがすべて必要。
祖先の原画が未承認・却下なら派生も除外。未承認はエラーではなく警告で、候補加工は可能。
同一原画SHA256の重複は別IDでもエラーとする。原画を何度も列挙せず、1原画から標準4派生を作る。
権利承認の法的妥当性や画像内の建物・ロゴは自動認定せず、受領情報と人のレビューを前提とする。

## 出力とサイズ指定

| 出力 | 内容 |
|---|---|
| web/*-screen.webp | --screen-edge（既定1600）以内、--quality（既定82） |
| print/*-print.png | --print-edge（既定3508）以内、原画以上に拡大しないPNG |
| crops/*-portrait.webp | 4:5縦候補、--crop-edge（既定1200）以内 |
| crops/*-landscape.webp | 16:9横候補、同上 |
| thumbnails/contact-NNN.png | 最大20原画/ページ。各行に原画・screen・print・縦crop・横crop |
| contact-sheet.html | ローカル一覧。候補と警告を表示、ネットワーク読込なし |
| candidate-manifest.json | 原画実測、全派生の寸法・容量・SHA256・cropBox、受領記録 |
| published-manifest.json | 公開資格を満たす候補のみ。原画パス・promptTextを除去。未審査cropも除外 |
| report.json | 全ファイルの容量・SHA256、警告、原画と派生の台帳 |

publishedという名称はフィルタ結果であり、公開・アップロード・正式採用は実行しない。
Webへ配置する場合のURL prefix設定とIMG-00統合は別作業。相対pathはこの出力ルート基準。
公開資格がある素材でも印刷解像度が低い場合はmeetsTarget=falseとなるため、印刷側で別途判定する。

focalPointを中心に、画像内へ収まる最大の比率矩形を選び、はみ出しをクランプする。
cropは必ずcropReviewStatus=candidate / subjectSafety=requires_human_review。
焦点を保持しても建物全体を保持する保証はない。コンタクトシートで主題切れを必ず確認する。
小さな原画の整数丸めにより比率に1px程度の差が出ることがある。

印刷の掲載寸法は--print-width-mm / --print-height-mm（既定180×120mm）。
原画と出力それぞれについて `min(widthPx×25.4/widthMm, heightPx×25.4/heightMm)` を記録する。
縦横をこの寸法へ変形せず、指定枠に対する保守的な最小ppiとして使う。
--target-ppi（既定300）を下回る場合は警告。PNGのdpiタグや拡大で高解像度に見せない。

入力と出力は互いに包含しない別ディレクトリを使う。既存出力は空でも拒否。
全件検証・エンコード成功後、同一親の一時ディレクトリに出しrenameする。
破損・欠損が1件でもあればバッチ出力を行わず、他の既存ファイルと原画は維持する。
同じ入力・同じ引数・同じPillow/WebP環境では記録と画像バイト列が決定的。
処理時間は画像レポートへ混ぜない。バージョンを変えたエンコーダ間のバイト一致は保証しない。

## 実測方法

CLIと同じ引数をmeasure.pyへ渡す。--writeを付ければ実際の書込みまで測る。
WindowsではGetProcessMemoryInfoのPeakWorkingSetSizeを取得し、Python/Pillowを含むプロセス生涯ピークを記録する。
所要時間は読込み・変換・一覧作成・書込みまでの壁時計時間。画像生成やfixture作成は含まない。
他OSのメモリはnull。入力画素数・エンコーダ・OSが異なる実測を混同しない。

```powershell
& $py scripts/image-pipeline/measure.py `
  --manifest scripts/image-pipeline/.local/sample-next/intake.json `
  --input scripts/image-pipeline/.local/sample-next `
  --output scripts/image-pipeline/.local/measured-next --write
```

画像バイト列をバッチ中メモリに保持するため、大型原画100点のピークは別途実測が必要。
実素材のファイル容量・安全なcrop・権利承認・印刷品質は10点受領後に再検証する。
本タスクはローカル確認のみ。CIへの画像テスト追加やGitHub Pages公開は実行していない。
