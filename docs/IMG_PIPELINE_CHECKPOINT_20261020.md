# CHECKPOINT — APP-003 / IMG-PIPE-01

2026-10-20 JST。初回ローカル実装完了時の記録。実際のASSET-01納品画像は未受領。
その後、ユーザーからGitHub反映の指示を受領。専用ブランチへのcommit/pushとレビュー用PRを対象とし、
mainへの統合・公開画像追加は引き続き対象外。最新の保存commitとPRはGitHubの当該ブランチを参照。

## 作業場所・正本確認

- 正本：https://github.com/yama-books/mansion-poet
- 作業開始時の最新main：39ce37fea81f55dc4944138d38b526c6da50833c（PR #29、2026-10-20 07:36:09 JST）。ls-remoteでも一致。
- gh pr list --state open：`[]`。最新15 PRを照合、既存画像パイプラインなし。
- 元のD:\dev\mansion-poetは空でGit repositoryではなかったため、専用別cloneをその配下に作成。
  親はGit repositoryではなく、既存repo内へのnested worktree作成には該当しない。
- 専用作業場所：D:\dev\mansion-poet\img-pipe-01
- 専用branch：work/app003-img-pipe-01-20261020
- git worktree list：`D:/dev/mansion-poet/img-pipe-01 39ce37f [work/app003-img-pipe-01-20261020]`
- 初回報告時のHEADは上記main SHA、変更は未commitで保持していた。
  GitHub反映では認証中アカウントyama-booksのGitHub noreply名義をコマンド単位で使用し、グローバル設定は変更しない。
- git status：新規docs/IMG_PIPELINE_*.md、scripts/image-pipeline/、tests/image-pipeline/のみ。
  既存index.html・src・印刷・辞書は差分なし。
- Dドライブ空き：開始時736.85GB。既存Python 3.12.14、Pillow 12.3.0、WebP有効。依存追加なし。

## 成果と再現

scripts/image-pipeline/のpipeline.py、measure.py、requirements.txt、intake.example.json、.gitignore。
tests/image-pipeline/のfixtures.py、test_pipeline.py、.gitignore。
使い方・受領インターフェース・制限はIMG_PIPELINE_README.md。
画像を明示指定して一括リサイズ、WebP化、4:5/16:9 crop、印刷PNG、権利フィルタ、台帳、一覧を生成。

サンプル（すべてGit対象外・ローカルのみ）：

- scripts/image-pipeline/.local/sample10/intake.json と人工原画10点
- scripts/image-pipeline/.local/output10/contact-sheet.html
- scripts/image-pipeline/.local/output10/thumbnails/contact-001.png
- scripts/image-pipeline/.local/output10/report.json
- scripts/image-pipeline/.local/output100/（原画100点→WebP300点・印刷PNG100点、一覧5ページ）
- scripts/image-pipeline/.local/dry-run10.json、measure10.log、measure100.log、tests.log

## 実測結果

Windows 11 (10.0.22631)、Python 3.12.14/Pillow 12.3.0。すべて320×240px人工画像。
既定引数（screen1600/crop1200/print3508、品質82、掲載180×120mm・目標300ppi）。
出力を実際に書き出した測定。fixture生成時間は含まない。

| 入力 | 原画容量合計 | 壁時計時間 | process peak working set | 出力ファイル数 | 出力容量 |
|---|---:|---:|---:|---:|---:|
| 10点 | 27,194 bytes | 0.597010秒 | 50.68 MiB | 44 | 201,346 bytes |
| 100点 | 280,383 bytes | 5.270595秒 | 114.44 MiB | 408 | 2,012,063 bytes |

出力ファイル数・容量はreport.json自身を除く。メモリはPython/Pillowを含むプロセス生涯ピーク。
小画像なので縮小不要の場合は拡大しない。大きな原画30点・派生100点の性能保証ではない。

10点の出力内訳：WebP screen 10点19,014 bytes、crop 20点17,210 bytes、印刷PNG 10点27,194 bytes、
コンタクトPNG 97,933 bytes、candidate manifest 35,697 bytes、HTML 4,253 bytes、published manifest 45 bytes。
印刷は元と同じ320×240、実効45.16ppi、300ppi未達を正しく警告。
10点は20警告、100点は200警告（低ppiと権利未承認）、公開資格合格は双方0点。

初回画像テスト24件成功（9.626秒）、入力日時・既存renditionsの形の検証追加後25件成功（8.111秒）。
コマンド：`python -m unittest discover -s tests/image-pipeline -p test_pipeline.py -v`、exit 0。
既存回帰：`node --test tests/*.test.mjs`、130件成功・0失敗、exit 0（2.500秒）。

検出例：duplicate_id、missing_string、focal_range、duplicate_original_sha256、duplicate_derivation、
parent_cycle、破損画像のinput_image、供給SHA256不一致、入力外パス、既存出力のbatch_error。
0件、dry-run無書込み、原本SHA256保持、出力実体寸法/hash/容量、EXIF除去、失敗時の一時出力清掃もテスト。
100点fixtureでID重複・文字列不足・未承認除外・末尾ファイル破損を検証。

完了監査はユーザーの明示許可を受けて実施。
jev-audit-pack.ps1で実テストを再実行したpackはexit 0、資格情報パターン0、
send_allowed=true、差分1031追加行で省略なし。送信はテスト出力と必要な実装・テストの差分のみ。
Jevのprovider=typesafeを確認。jev_verifyは4項目verified、contradicted/unsupported/needs_reviewは0。
内容はテスト成功、dry-run/既存保護、権利フィルタ、画像派生と実測記録。画像・秘密情報は未送信。
300行を超えるためjev_gateは使用していない。

コンタクトPNGを実際に表示し、原画・screen・print・portrait・landscapeの5列を確認。
人工建物の横cropでは下端が切れる例も確認できる。focalPointだけでは主題全体の保持を保証できず、
cropはcandidateのまま、公開manifestに入れない。実画像の主題切れは人の確認が必要。

## 未実施と次の操作

実画像の生成・納品、法的な権利承認、実素材のcrop採用、高画素原画での性能測定、
色管理・CMYK/PDF-X、SVG入力、IMG-00本体接続、CIジョブ追加・CI実行、Web公開は未実施。
commit/push/PRは初回報告時には未実施で、その後のGitHub反映指示に基づき実行する。
main統合、公開画像追加、印刷機能への変更は行っていない。

次の1操作：output10/contact-sheet.htmlで候補一覧を確認し、ASSET-01の10点を受領したら、
READMEの受領契約に合わせたintake.jsonを別のDドライブ入力フォルダへ置きdry-runする。
