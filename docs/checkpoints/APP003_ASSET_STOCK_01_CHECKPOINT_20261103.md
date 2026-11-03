# APP-003 / ASSET-STOCK-01 素材納品CHECKPOINT

- 素材制作日：2026-11-03 JST／受領検証・保存作業：2026-11-04 JST
- 正本Repo：`yama-books/mansion-poet`
- Branch：`assets/app003-stock-01-originals-20261103`
- 照合したmain：`ee45852d785b724f51f1f12397efaa85bf1798f1`
- 開始時Branch HEAD：`f45551e2d20aa0e6d1307a16d762d2c20d693dbe`
- 区分：`candidate_unapproved`。素材保管のみ。本番採用・main統合・Pages公開は未実施かつ本作業では禁止。

## 保存対象

- `assets/stock/ASSET-STOCK-01/originals/`：PNG原画10点。
- `assets/stock/ASSET-STOCK-01/previews/`：軽量サムネイル10点と全10点コンタクトシートPNG。
- `assets/stock/ASSET-STOCK-01/manifest.json`、`catalog.csv`、`README.md`：納品ZIPの台帳・検索タグ・管理案内。
- `docs/APP003_ASSET_STOCK_01_INDEX.md`：納品ZIPの画像目録・説明・タグ・相対リンク。
- `docs/APP003_ASSET-STOCK-01_HANDOFF.md`：受領時の引継ぎ原文。文中の「GitHub未保存」は制作時点の記録であり、保存後の状態は本CHECKPOINTを参照。
- [検証記録JSON](APP003_ASSET_STOCK_01_VERIFICATION_20261103.json)：6納品ファイルのサイズ・SHA-256、原画10点のSHA-256とGit blob SHA、納品全ファイルのハッシュ。

## 受領・照合結果

ChatGPTライブラリ `/APP003-ASSET-STOCK-01/` からHANDOFFと5 ZIPを取得し、全ZIPを同じ作業ディレクトリへ展開。ZIP CRC整合性は5/5 PASS。同名の重複ZIPエントリーはバイト一致を確認した。

manifestの原画10点すべてについてSHA-256、サイズ、PNGチャンクCRC、1055×1491px、Git blob SHAが一致。指定ブランチには原画10点がすでにあり、納品原画と全10点がバイト一致したため、原画は一切上書きせず保持した。プレビュー11点と詳細台帳を納品内容から補完した。画像再生成は実施していない。

最新mainの既存画像21点とSHA-256を比較し、完全一致の重複は0点。main既存ファイルと衝突する納品パスは0件。mainとの差分は素材・関連文書の追加のみで、印刷・アプリ本体・ワークフローは変更していない。目録・READMEの相対リンクも存在確認済み。

## 境界・次工程

原画はAI生成の架空表現であり、実在物件・所在地・眺望の証拠ではない。原画1055×1491pxはA4全面で約127.5ppiであり、300ppiの印刷原画とは扱わない。権利・広告採用・印刷品質の審査は独立工程。

GitHub読戻しとDraft PRの結果は検証完了後に追記する。main統合、GitHub Pages公開、広告への本番採用は行わない。
