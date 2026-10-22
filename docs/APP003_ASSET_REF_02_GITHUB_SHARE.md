# APP-003｜ASSET-REF-02 新規参考広告6テーマ（REF-0003〜0008）

**状態：参考デザイン共有用の資料・評価をGitHubの専用Draft PRに格納。画像バイナリ7点は未アップロード。**

- 目的：書店／文教、公園／緑地、川／暗渠、歴史文化、都市夜景／交通、ポスト／都市小設備を独立した広告表現として比較する
- 正本：`yama-books/mansion-poet`
- 元データ：ChatGPT会話内の `APP003_ASSET_REF_02_six_sheets.zip` （**GitHub内にはZIPを配置しない**）
- 関連資料：[ライブラリ運用仕様](APP003_REFERENCE_IMAGE_LIBRARY_SPEC.md)／[タグ語彙](APP003_REFERENCE_IMAGE_TAGS_V1.md)／[旧6構図の作図レシピ](https://github.com/yama-books/mansion-poet/pull/34)
- [横断自己評価](APP003_ASSET_REF_02_ASSESSMENT.md)／[候補manifest](../research/asset-ref-02-manifest-candidate.json)／[PNG取り込み手順](APP003_ASSET_REF_02_UPLOAD_RUNBOOK.md)

| REF-ID候補 | 施設テーマ | 広告に使う視覚的主題 | 詳細資料 |
| --- | --- | --- | --- |
| REF-0003 | 書店・図書館・文教 | 書架・ペン画・活字の密度 | [REF-0003](APP003_REFERENCE_IMAGE_ENTRIES/REF-0003.md) |
| REF-0004 | 公園・緑地・並木道 | 樹冠・季節光・歩道 | [REF-0004](APP003_REFERENCE_IMAGE_ENTRIES/REF-0004.md) |
| REF-0005 | 川・暗渠・水辺 | 水脈・暗渠断面・淡彩 | [REF-0005](APP003_REFERENCE_IMAGE_ENTRIES/REF-0005.md) |
| REF-0006 | 神社寺院・歴史文化 | 木格子・石段・素材と時間 | [REF-0006](APP003_REFERENCE_IMAGE_ENTRIES/REF-0006.md) |
| REF-0007 | 都市夜景・交通・街路 | 移動の光跡・夜と余白 | [REF-0007](APP003_REFERENCE_IMAGE_ENTRIES/REF-0007.md) |
| REF-0008 | ポスト・路地・都市小設備 | 赤い一点・路地・細部 | [REF-0008](APP003_REFERENCE_IMAGE_ENTRIES/REF-0008.md) |

## バイナリ共有状況

- `assets/reference-images/REF-0003_concept_sheet.png`〜`REF-0008_concept_sheet.png`：**未登録**。存在確認前のURLは発行しない
- `assets/reference-images/ASSET-REF-02_six-sheet_overview.png`：**未登録**
- `research/asset-ref-02-manifest-candidate.json`：候補7枚中6枚の原ファイルSHA256を収録。ユーザーによるGitHub参考公開の許可は得ているが、画像のGitHubアップロードは別途検証
- 6枚の候補は新しい正式構図IDでも、出稿可能なA4版でもない。特にREF-0003/0004は3版型の独立完成が未達、REF-0005〜0008はプログラム編集モック

**参照限定**：架空の施設・地図・価格・徒歩時間等の描画は実在情報ではない。REFの共有と本番ARTの承認、PRINT03/IMG-00への実装は独立した判断。ここでは`publishedAllowed=false`を維持し、ART採用もPages公開も行わない。
