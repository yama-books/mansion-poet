# APP-003｜ローカルClaude Code / Codex 分担指示 v1.0

策定：2026-10-19 JST／worktree具体手順追補：2026-10-20 JST
状態：**実装委任の作業契約（各タスク未着手）**。本ファイル自体の保存と、画像処理／印刷機能の実装完了を混同しない。
正本：https://github.com/yama-books/mansion-poet
統合設計：[MAPFX-01 / IMG-00 / PRINT-03](APP003_VISUAL_IMPLEMENTATION_PLAN_20261019.md)
素材制作の別セッション指示：[ASSET-01](handoff/APP003_ASSET_GENERATION_HANDOFF_20261019.md)
企業広告品質の推定基準：[AD QUALITY GATES](AD_QUALITY_GATES_V1_20261019.md)

## 0. 分担の決定

大きく独立に進められるのは次の2領域。

| 担当 | Work-ID | 主担当 | 本タスクで触ってよいもの | 競合させないもの |
|---|---|---|---|---|
| 画像加工・台帳・サムネイルパイプライン | IMG-PIPE-01 | **Codex（ローカル）** | scripts/image-pipeline/, tests/image-pipeline/, docs/IMG_PIPELINE_*.md、テスト用最小fixture | index.html、src/poem-catalog.js、src/location-highlights.js、MAPFX、PRINT |
| 広告印刷エンジン／複数版型の組版試験 | PRINT03-CORE | **Claude Code or Codex（ローカル、別worktree）** | src/print-layout/, tests/print-layout/, docs/PRINT03_*.md、独立のプレビューハーネス | index.html本体、MAPFX、画像パイプライン、POEM辞書 |
| 画像素材そのもの10枚の生成 | ASSET-01 | 別ChatGPT画像セッション | 制作物パッケージ、採否、メタデータ候補 | Repo本体のコード編集 |
| 地図の光柱PoC | MAPFX-01 | ChatGPT GitHub作業セッション | 地図DOM/CSSとテスト | 上記2担当のフォルダ |

**2つのローカル実装を同一作業ディレクトリ・同一ブランチで同時に行わない。** Git worktree または別cloneの別ブランチで編集し、各々PRによる統合を待つ。READMEや同一仕様ファイルの同時編集は避ける。最新mainを常に再取得し、既存のPR・HEADを確認する。初回はローカル環境と容量を確認し、必要な依存だけ入れる。

現在のmainが作業開始時点と同一とは限らない。**日時や過去の固定SHAをcheckout対象の正本にしない。GitHubの最新mainを照合**する。

## 0.1 PowerShell で worktree を分ける具体手順（Windows、実行前に確認）

**worktree は同じGitリポジトリの履歴を共有しつつ、別々の作業フォルダ・作業ブランチを使う機能。** 2つのエージェントが同じフォルダを編集しないことが最も重要。作業フォルダはリポジトリ本体の**外側**に置く（子ディレクトリに入れない）。以下は `D:\dev` に空きがある場合の**例**。実在するローカルcloneの位置はまだ確認していない。

想定配置：

~~~text
D:\dev\mansion-poet\                         ← 親となるclone（mainの参照・Git管理用）
D:\dev\worktrees\mansion-poet-img-pipe\      ← Codex専用／IMG-PIPE-01
D:\dev\worktrees\mansion-poet-print03\       ← Claude Code専用／PRINT03-CORE
~~~

### A. 初回の状態確認（既存cloneがある場合は必ず優先）

**PowerShellを1つ開き、この確認だけを先に行う。** すでに別の位置に正しいcloneがあるなら `$repo` をその実パスに修正し、二重cloneを作らない。既存のブランチ、未commit作業、既存worktreeを破棄しない。

~~~powershell
$repo = 'D:\dev\mansion-poet'
$wtRoot = 'D:\dev\worktrees'
$img = Join-Path $wtRoot 'mansion-poet-img-pipe'
$print = Join-Path $wtRoot 'mansion-poet-print03'

# $repo がまだ存在せず、他所にも同一cloneがない場合に限りcloneする
if (!(Test-Path $repo)) {
  git clone https://github.com/yama-books/mansion-poet.git $repo
}

# 正しいRepoか、未commit変更や既存worktree/branchがないかを表示
git -C $repo rev-parse --show-toplevel
git -C $repo remote -v
git -C $repo status --short
git -C $repo worktree list
git -C $repo branch --list 'work/app003-*'
~~~

確認ポイント：
- `remote -v` の origin が `yama-books/mansion-poet` を指すこと（SSH URLも可）。違う／Git Repoでない場合は**停止して報告**。
- `status --short` に変更があれば**触らず保持**。worktree追加自体は通常、親cloneの作業ツリーの変更を消さないが、ユーザーの未保存内容を勝手にcheckout/stash/resetしない。
- `worktree list` に同じ担当用パスやブランチがあれば**その既存worktreeを優先再利用**する。中断からの再開で新たなworktreeを乱立させない。
- 同じbranch名が別worktreeに割り当て済みのときは、新規worktreeを強行しない。

### B. 2つのworktreeを作る（上記を確認し、未作成の場合のみ）

**新規作成は1つのPowerShellセッション／1人の担当で実施。** CodexとClaude Codeに同時に `git worktree add` を命じない。現行の `origin/main` から新規分岐し、親cloneのmainは切り替えない。

~~~powershell
# Aでremoteと既存worktreeを確認できた後に実行
git -C $repo fetch origin main
New-Item -ItemType Directory -Force -Path $wtRoot | Out-Null

# すでに同じパス・branchがある場合は実行せず、既存を確認して再利用
git -C $repo worktree add -b work/app003-img-pipe-01-20261020 $img origin/main
git -C $repo worktree add -b work/app003-print03-core-20261020 $print origin/main
~~~

`worktree add` が「already exists」「already checked out」等を返した場合は、**ディレクトリ削除、`--force`、branch名の重複強行をしない**。`git worktree list`、`git branch --list`、各 `git status --short` を調べて既存作業の所在を明らかにし、再利用か修復の方針を報告する。ネットワーク認証やorigin/mainが取得できない場合も停止して報告する。

### C. 分離できたことを確認してから各エージェントを起動

~~~powershell
git -C $repo worktree list
git -C $img branch --show-current
git -C $print branch --show-current
git -C $img status --short
git -C $print status --short
git -C $img rev-parse HEAD
git -C $print rev-parse HEAD
~~~

期待結果：2つのブランチ名が別々で、初回両HEADは同じ最新origin/mainを指す。**Codexは`$img`だけ**、**Claude Codeは`$print`だけ**を作業ディレクトリにする。具体的にはPowerShellウィンドウも別にする。

~~~powershell
# PowerShell窓A：Codex専用
Set-Location 'D:\dev\worktrees\mansion-poet-img-pipe'
codex

# PowerShell窓B：Claude Code専用（別ウィンドウで実行）
Set-Location 'D:\dev\worktrees\mansion-poet-print03'
claude
~~~

`codex`や`claude`がコマンド認識されない場合、CLIが未インストール／PATH不一致かもしれない。**無断のインストールや動作済み報告はしない**。実際のローカル環境の起動方法を確認する。エージェントが現在どのworktreeにいるかは毎回 `pwd` と `git branch --show-current` でチェック。

### D. 作業中とPR提出

- 担当外ファイル、特に`index.html`、`src/poem-catalog.js`、`src/location-highlights.js`、他担当ディレクトリは編集しない。両エージェントともmainへの直接commit・mergeは禁止。
- 各worktreeで `git status --short`、`git diff --stat` とテストを確認してから、自分の担当branchだけにcommit。push/PRはユーザーの権限と承認範囲に従う。
- 同じリポジトリのGit refsは共有されるが、作業フォルダ／未追跡ファイル／依存パッケージは分かれる。生成した大量画像や一時PDFを**他worktreeへ直接書き込まない**。
- mainが更新された場合、独断で進行中の両worktreeをreset/rebaseしない。HEAD差分・未committed内容・PRの競合を確認し、必要時に調整する。
- 各担当の報告には`git worktree list`、自worktreeの`git status`、ブランチ名、commit SHA、CI結果を添える。

### E. 作業終了後の片づけ（PRレビュー・保存を終えるまではしない）

1. 必要な成果をcommit/push済か、レビュー済か、該当PRが閉じたかを確認。`git status --short` で**未保存の変更・未追跡成果がない**ことを確認。
2. 自分のエージェントを終了してから、**親cloneのPowerShell**で `git -C $repo worktree remove $img` などを行う。まだ継続作業があるならremoveしない。`--force`やエクスプローラからのフォルダ強制削除をしない。
3. local branchを消す必要はない。`git branch -d` がsquash merge等で拒否されたら、無理に `-D` で削除せず確認する。
4. `git worktree list` で残った有効worktreeを確認。実際のフォルダ・branchが不明なまま`git worktree prune`を実行しない。

### 失敗時に最初に見るもの

`git -C $repo worktree list`、`git -C $repo branch -avv`、`git -C $img status --short`（パスが存在する場合）、`git -C $print status --short`（同）、`git -C $repo remote -v`。この出力を報告すれば、既存変更を壊さずに次の手順を決められる。


## 1. Codexに送る指示書：IMG-PIPE-01

以下のテキストをCodexのローカルチャットへそのまま貼る。

~~~text
あなたはAPP-003「POÈME / ESTATE」画像処理・管理基盤 IMG-PIPE-01 の実装担当です。

正本Repo：https://github.com/yama-books/mansion-poet

開始条件：
1. GitHubのmain最新HEAD、open PR、既存の類似script・manifestを確認し、重複実装を避ける。最初に本書「0.1 PowerShellでworktreeを分ける具体手順」のA〜Cを参照し、既存worktreeがあれば再利用する。worktree新規作成は**先に作業を始める1担当だけ**が行う。
2. docs/APP003_VISUAL_IMPLEMENTATION_PLAN_20261019.md、docs/handoff/APP003_ASSET_GENERATION_HANDOFF_20261019.md、docs/AD_QUALITY_GATES_V1_20261019.md、docs/LOCAL_EXECUTION_ASSIGNMENTS_20261019.md を読む。AGENTS.mdが実在する場合は読む。
3. 画像の保管先候補・空き容量・Node/Pythonと画像処理ライブラリ・Git設定を調べる。Cドライブにブラウザや大量画像を無用に置かず、ユーザーが指定するDドライブ等の作業領域を使う。依存ソフトを勝手に大量導入しない。
4. mainを直接編集せず、専用branch work/app003-img-pipe-01-20261020 と専用作業ディレクトリ D:\dev\worktrees\mansion-poet-img-pipe（既存なら実パス）で進める。Claude Code用worktreeは作成後、その所有者へ渡すだけで編集しない。

目的：将来の原画30枚・派生100パターンに耐える「素材を受け取って整理する道具」を先に作る。画像そのもの100枚の生成やWeb本番への採用は今回の作業ではない。

実装範囲：
- 画像の入力フォルダから明示された素材だけを読み込み、assetId・寸法・縦横比・ファイルサイズ・SHA256・マニフェストフィールドの不足を検出する。入力原画を勝手に削除・上書きしない。
- docsのmanifest契約と一致するJSONバリデータを実装。rightsStatusやreviewStatusが未承認のものをpublished manifestに含めない。権利未確認なら画像は候補であり公開不可と判定する。
- 画面用WebP（指定長辺／品質）と印刷用renditionを派生させる。印刷向け出力は実効画素密度を計算し、単純アップスケールを「元画像が高解像度」と報告しない。
- スマホ向けportrait cropと16:9 crop、focalPointに基づく安全なトリミング候補を作成。トリミングで物件や建物の主題が切れないか確認できるサムネイル一覧（コンタクトシート）を作る。
- 記録の再生成が決定的であること、同じ原画や派生元の重複IDを検出できること、0件や破損画像で失敗しても既存ファイルを壊さないこと。
- 最初は人工的な小さなテスト画像／許諾済の手元画像で最小テストを作り、実際の生成画像が納品されなくてもCLIとtestsが実行できるようにする。
- CLIはまず dry-run をデフォルトにし、明示フラグで出力、書込前に対象を一覧化する。公開URLやGitHubへのpush・100画像一括追加は行わない。

成果：scripts/image-pipeline、tests/image-pipeline、README系ドキュメント、インターフェース見本、10点の将来素材を受け取れる状態。テスト出力には合格数、エラー例、出力候補の容量一覧を記す。

禁止：index.htmlや既存POEM630/LOCATION117文字列、地図・印刷CSSを編集しない。OpenPOI/OSMの外部APIを叩かない。TinyFishや有料外部サービスを利用しない。実物に見せかけた架空物件写真を実在地理情報の証拠として提供しない。

作業完了時：branch/HEAD、変更したファイル一覧、CLI実行手順、テストの実測結果、サンプル出力のパス、未実装事項、次の1操作をCHECKPOINTにまとめる。GitHubへのpush/PR作成は接続状態と権限を確認し、ユーザーに許可された範囲で行う。mainへの直接merge・Pages変更・公開画像追加は行わない。
~~~

### IMG-PIPE-01の受入条件

- 対象画像0枚でもコマンドが落ちない。
- 入力100パターン相当のfixtureでID重複、文字列欠損、権利未承認、壊れたファイルを検出する。
- 出力WebPやトリミングは寸法・SHA256・ファイル容量を記録、原本に副作用なし。
- 生成画の権利が未確認なら公開対象から機械的に除外。
- 10点受領前でもテスト環境が成立する。処理時間・メモリはユーザーの実機で測定。
- 動作結果／CI成功／Web公開を明確に区別する。

## 2. Claude Code（または別Codex）に送る指示書：PRINT03-CORE

~~~text
あなたはAPP-003「POÈME / ESTATE」のPRINT03-CORE印刷組版エンジン担当です。

正本Repo：https://github.com/yama-books/mansion-poet

作業開始：
1. main最新HEAD、open PRと既存のPRINT-02実装・テストを確認。docs/APP003_VISUAL_IMPLEMENTATION_PLAN_20261019.md、docs/AD_QUALITY_GATES_V1_20261019.md、docs/LOCAL_EXECUTION_ASSIGNMENTS_20261019.mdを読む。AGENTS.mdがあれば読む。
2. 別担当がIMG-PIPE-01、MAPFX-01を並行する想定。本書「0.1 PowerShellでworktreeを分ける具体手順」のA〜Cに従い、先行担当が作ったworktreeを点検して再利用する。専用branch work/app003-print03-core-20261020 と作業ディレクトリ D:\dev\worktrees\mansion-poet-print03（既存なら実パス）だけを使い、Codex用worktreeを編集しない。
3. 既存の index.html の @media print 版型を削除せず、まず独立のsrc/print-layout/・tests/print-layout/・ローカルプレビューHTMLを作成する。POEM辞書・LOCATION本文や地図は編集しない。

目的：「従来画面のCSSを縮めるだけ」をやめ、同一のPOEM・主役施設・LOCATION 0〜3件・住所・注記を、別の広告版型へ安全にレンダリングする印刷エンジンをつくる。

実装：
- ブラウザWebでも利用可能なPresentationDataと、render(templateId,data)のインターフェースを設計。出力テキストはtextContentまたは安全なエスケープで扱い、HTML注入を防ぐ。描画レイヤーにネットワーク通信や価格の自動推定を持ち込まない。
- 版型は (a) type_poem を最初に完成、(b) editorial・(c) location を同じデータで比較できる軽いスケルトンまで作る。ヒーロー写真は未納品なのでまずオリジナルSVGまたは権利のあるプレースホルダを使う。架空CG・出典・実在店舗情報は混同しない。
- A4縦の白黒／カラーを想定し、余白、文字サイズ、脚注、カードの改ページを管理。長文を切り捨てず、1ページに入るときだけ1ページにする。溢れる場合は明示的に複数ページへ移し、本文・創作注記・施設出典を欠落させない。
- Poem/Location 0,1,3件、100文字以上の住所、長い漢字名・英字、フォント読込失敗、画像なしのfixtureを用意。PDF/Screenshotの実物を並べて目視できるローカルQA方法を整える。
- headlessブラウザ利用は既存Chromium/Playwright等の環境と容量を確認し、無用な依存取得・有料API利用をしない。使えなければ代替のローカルPDF比較と未確認項目を明記。Print production PDF/XやCMYK対応を作ったと偽らない。
- 現行のCOPY-LOCK-01を活用できるgeneration tokenをインターフェースで受け、別地点の古い印刷データを再利用させない。

成果：独立レンダラのコード、データスキーマ、type_poemの印刷デモ、3版型の比較プレビューと代表fixture、テストログ、ページ数／文字欠落の確認表、統合PRの最小差分提案。

禁止：今回の作業で index.html の現行COPY/PRINT/地図や他担当の画像manifestは直接編集しない。本番公開・既存CSSの削除・重い外部API呼出しを行わない。画像素材が来る前にダミーの実画像を本番に載せない。

作業の終わり：実装済／テスト成功／ローカル印刷プレビュー成功／GitHubに保存済を別々に記録。branch/HEAD、ファイル差分、テスト数、実PDFのページ数、残るSafari実機受入、次の1操作をCHECKPOINTで報告。mainへのmergeはしない。
~~~

### PRINT03-COREの受入条件

- POEMと第1LOCATIONの主役が同一、0件でも何も捏造しない。
- Consumer A4 PDF、長文でのsafe fallback、注記・出典・本文欠落0（ブラウザ別の受入は別管理）。
- 3版型を同じfixtureで比較可能。少なくともtype_poemは見本PDFと再現方法がある。
- Webフォームや既存indexを壊さない純粋な差分。ローカルで試せても本番動作とは言わない。

## 3. 生成画像そのものは別ChatGPTセッション

既存[ASSET-01 HANDOFF](handoff/APP003_ASSET_GENERATION_HANDOFF_20261019.md)にそのまま渡す。画像生成をCode Agentへ無理に依頼しない。Codex/Claude Codeには、画像の**分類・リサイズ・crop・品質チェック・manifest検証・合成プレビュー**を任せる。モデル画像が初回10枚そろってから、CodexのIMG-PIPE-01と接続してマニフェスト候補を作る。

## 4. 同時実行時の運用と統合順序

1. 今セッションのdocsと画像制作指示は正本。worktree新規作成時は本書0.1に従い最新の origin/main から分岐する。既に着手済みのworktreeは現HEADと作業状態を優先して再利用し、開始時点のSHAが古いからといって勝手にresetしない。
2. IMG-PIPE-01とPRINT03-COREはファイル所有権を分離する。作業dirとブランチは別々。前者はスクリプト、後者は独立rendererを扱う。
3. MAPFX-01は小規模地図変更としてChatGPT GitHub側で実装可。index.htmlを編集するのはこの担当だけとし、同時に別のエージェントが触らない。
4. IMG-PIPEの型とIMG-00のmanifestの食い違いは、公開を始める前に仕様確認PRで解消する。
5. PRINT03-COREは独立でCIへ載せ、タイプ型を実機確認してからindex.htmlへ接続する。直接mainを編集しない。
6. ASSET素材を公開Repoへ投入する際は権利・出典を確認し、ユーザーの明示承認と段階的サイズ制限を求める。

## 5. 現状の判定基準

この文章を保存してもローカル作業を実行したことにはならない。ローカルのClaude Code/Codexはユーザーが実際に起動し指示する必要がある。GitHubのPR作成・mainマージ、配信確認、iPhone実機確認はそれぞれ独立した成果として記録。

次の小操作：まずCodexへIMG-PIPE-01を渡して環境診断と最小fixtureを確認。同時に別worktreeが使えるならClaude CodeへPRINT03-COREを渡す。どちらかが単一作業フォルダしか使えない場合、IMG-PIPE-01を先に完了させてからPRINT03-COREへ移る。
