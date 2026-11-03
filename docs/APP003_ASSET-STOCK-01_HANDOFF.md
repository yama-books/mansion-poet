# APP-003 / ASSET-STOCK-01 納品・ローカルセッション引継ぎ

作成: 2026-11-03 JST  
正本候補: yama-books/mansion-poet  
作業ID: APP-003/ASSET-STOCK-01  
状態: ラスタ原画10枚制作・整理完了。**GitHubへ原画ファイルは未コミット／本番未採用**。

## 納品物

- `APP003_ASSET-STOCK-01_INDEX_PREVIEW.zip`: 管理README、全件catalog.csv、manifest.json、詳細台帳MD、10枚の軽量サムネイル、全10枚のコンタクトシートPNG
- `APP003_ASSET-STOCK-01_PART01_0001-0003.zip`: 原画0001〜0003、各プレビュー
- `APP003_ASSET-STOCK-01_PART02_0004-0006.zip`: 原画0004〜0006、各プレビュー
- `APP003_ASSET-STOCK-01_PART03_0007-0008.zip`: 原画0007〜0008、各プレビュー
- `APP003_ASSET-STOCK-01_PART04_0009-0010.zip`: 原画0009〜0010、各プレビュー

**全ZIPを同じ作業ディレクトリへ展開**すれば、`assets/stock/ASSET-STOCK-01/originals/` の配下へ10枚が集まり、`docs/APP003_ASSET_STOCK_01_INDEX.md` から相対リンクで辿れる。

## 画像を呼び出す方法

ID `APP003-STOCK-0001`〜`APP003-STOCK-0010` は固定。`docs/APP003_ASSET_STOCK_01_INDEX.md` に、名前、目視特徴、タグ、用途、トリミング、SHA256を記録。検索は `manifest.json` の `assets[].tags` をAND条件で照合。名前が紛らわしい場合は必ずIDを優先。

主要内容：
- 0001 都市の曲面バルコニー住宅（建築外観）
- 0002 木漏れ日のリビング（室内）
- 0003 湖に続く草の小径（自然・湖）
- 0004 庭園へ続く邸宅エントランス（建築）
- 0005 湖畔のガラス邸宅（建築・湖）
- 0006 陽光のキッチンダイニング（室内）
- 0007 朝の寝室と開いた窓（室内）
- 0008 書棚と一脚の読書室（室内）
- 0009 海へ続く崖の小径（自然・海）
- 0010 光の差す渓流（自然・水辺）

## 次の担当者への依頼

1. 最初にGitHub `yama-books/mansion-poet` の `main` 最新HEADと `docs/APP003_ASSET_WORKBOARD.md` を再照合。既存原画との重複を確認。
2. ライブラリから取得した5つのZIPを同じフォルダへ展開し、manifestに記録された10枚のSHA256を検算する。**ローカル画像再生成不要**。
3. `assets/stock/ASSET-STOCK-01/` と `docs/APP003_ASSET_STOCK_01_INDEX.md` をリポジトリの専用ブランチへ追加。既存の印刷・本体実装は編集しない。未使用の空ブランチ `assets/app003-stock-01-originals-20261103` があれば現状を確認して再利用。
4. GitHubへpush後、各PNG・manifest・一覧プレビューをcommit SHA固定のraw/treeで読戻し、全件数とハッシュを照合。Draft PRへまとめ、**main統合・Pages公開・広告採用は行わない**。
5. SHA/件数/PR URLを管理CHECKPOINTで報告し、監理担当へ引継ぎ。素材の印刷品質や使用権・広告組版審査は独立工程。

## 品質と制約

10枚は写真風のAI生成架空表現。1点ずつ独立したPNGで、すべて1055×1491px。アスペクト比はA4縦に近いが、A4全面に印刷すると約127.5ppiであり、300ppiの印刷原画ではない。写真の実在性・物件所在地・眺望等を証明する資料ではない。SVG画像はない。広告文字や誌面レイアウトは含まない。

**完了と未完了**：画像制作・ローカル格納・検索台帳・プレビューは完了。GitHub本番リポジトリへの原画push／PR／読戻しは未完了。GitHub Pagesや広告生成機能での採用は禁じる。
