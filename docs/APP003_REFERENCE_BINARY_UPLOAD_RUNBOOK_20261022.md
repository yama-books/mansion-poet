# APP-003 REF-LIB-02｜参考画像19点の登録・GitHub読戻し手順

策定：2026-10-22 JST  
状態：**登録スクリプトと手順を保存。PNGのGitHub登録・遠隔照合は未実施。**  
正本：https://github.com/yama-books/mansion-poet  
対象Draft PR：https://github.com/yama-books/mansion-poet/pull/35

## 1. 対象と前提

会話で作成した APP003_reference_images_20261022.zip の原画2点＋切出し17点を、PR #35のブランチに保存し、GitHubの固定commit SHAから19点を再取得して、バイト数・寸法・SHA-256を確認する。既存画像の再生成や再クロップは不要。

ZIPはユーザーが一度だけWindowsへ保存し、ローカルCodexに渡す。画像の書出し自体には別セッションは不要。新規の独立したデザインを100点規模で制作する作業は、別ASSET-01制作セッションを推奨する。

これらは**参考資料REF**であり本番用ARTではない。参考画像に描かれた価格、徒歩時間、施設名、地図はAIの例示。GitHubは公開Repoなので、バイナリを登録すれば第三者も閲覧できる。ユーザーの承認した公開範囲に従う。

## 2. 既存clone/worktreeとZIPの確認

以下はWindows PowerShellの例。実機の既存フォルダが違えば変更する。未コミット変更は触らない。

~~~powershell
$repo = 'D:\dev\mansion-poet'
$wt = 'D:\dev\worktrees\mansion-poet-ref-library'
$zip = 'D:\Downloads\APP003_reference_images_20261022.zip'

git -C $repo remote -v
git -C $repo status --short
git -C $repo worktree list
git -C $repo fetch origin docs/app003-reference-library-20261022
Test-Path $zip
~~~

originが違う・ZIPが見つからない・同名worktreeやブランチが存在する場合は、作業を止めて現状を確認。既存worktreeは再利用。reset、clean、force push、ディレクトリ強制削除は行わない。

未作成の場合だけPR #35の最新ブランチを基に新しいworktreeを作る：

~~~powershell
git -C $repo worktree add -b work/app003-ref-lib-binaries-20261022 $wt origin/docs/app003-reference-library-20261022
Set-Location $wt
git branch --show-current
git status --short
~~~

## 3. まず検査、その後に19画像だけ展開

Python標準ライブラリのみ使用。検査は読み取り専用。

~~~powershell
python scripts/reference-library/register_reference_images.py --archive $zip
python -m unittest discover -s tests/reference-library -p 'test_*.py' -v
~~~

ZIP VERIFIED: 19 files とテスト合格を確認してから明示的に書き出す。

~~~powershell
python scripts/reference-library/register_reference_images.py --archive $zip --extract
python scripts/reference-library/register_reference_images.py --verify-local
git status --short
git add assets/reference-images/
git diff --cached --stat
git diff --cached --name-only
~~~

期待値は画像19件のみ。1点でもSHA・寸法・ZIP inventoryが合わなければ中止。既存ファイルが異なる内容なら上書き禁止。ZIP自体や認証情報はgit addしない。

## 4. 同じDraft PR #35へ非強制push

~~~powershell
git commit -m "assets(ref-lib): add 2 concept sheets and 17 verified crops"
git push origin HEAD:docs/app003-reference-library-20261022
$pngCommit = (git rev-parse HEAD).Trim()
$pngCommit
~~~

push後PR #35のFiles changedを確認。non-fast-forwardで拒否されたら他の作業者の更新を先に照合する。force pushしない。

## 5. 固定SHAからGitHubに保存された実画像を照合

~~~powershell
python scripts/reference-library/register_reference_images.py --remote-ref $pngCommit --mark-verified
git diff -- research/visual-reference-manifest.json
~~~

19点のraw GitHub PNGを指定SHAからすべて取得し、SHA256／サイズ／PNG寸法を照合。1件でも不一致ならmanifestは変更しない。すべて合格時に限り binaryStatus=uploaded_verified / repoImageExists=true / storage.verifiedCommitShaを記録。**publishedAllowed=falseは維持**し、参照画像を本番ARTと取り違えない。

~~~powershell
git add research/visual-reference-manifest.json
git commit -m "data(ref-lib): mark 19 remote PNGs verified"
git push origin HEAD:docs/app003-reference-library-20261022
~~~

外部通信制限でGitHub rawが取得できない場合は「読戻し未検証」とし、別の正規GitHub取得経路を使ってハッシュを確認する。取得できないものを成功と報告しない。

## 6. CHECKPOINTに記録

- ZIPの19点とローカル出力19点が寸法／SHAで一致したか
- PNGをpushしたcommit SHAとPR #35への反映
- 固定commit SHAで19/19 GitHubバイナリが読めたか
- manifestステータス更新commit、Python CI、既存Node CIの実測
- main・Pages・本体index.html未変更
- 参考画像は本番利用不可（主用途は構図見本）
- 次の1操作：REFタグ検索用の静的Webブラウザの小PR

PR Draft解除・main merge・Pages公開、独立ARTの本番合成は別判断。
