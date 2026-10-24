# APP-003｜ASSET-ART-01 初回3画像の保全CHECKPOINT

- 作業ID：APP-003 / ASSET-ART-01
- 制作区分：**ART独立画像原画（写真調）**。REF完成広告、PRINT03 RENDER、本番採用とは分離
- Repository：`yama-books/mansion-poet`
- Branch：`assets/app003-asset-art-01-photo-trial-20261023`
- **原画3点の検証固定コミット**：[`134f5d986359a359e391997731978b0ad16200ca`](https://github.com/yama-books/mansion-poet/commit/134f5d986359a359e391997731978b0ad16200ca)
- 原本の保存検証：[GitHub Actions #40141561698](https://github.com/yama-books/mansion-poet/actions/runs/40141561698) completed / success。Actionsは各PNGの**ファイルサイズ、SHA-256、Git blob SHA-1、IHDR寸法**をローカル由来の候補manifestと照合
- GitHub固定コミットのtreeでも、3ファイルの存在、blob SHA、ファイルサイズ3/3一致。転送用base64一時ファイルは成果コミットから削除済み
- メタデータ：[manifest](../../research/asset-art-01-manifest.json)
- 公開区分：GitHub Publicリポジトリの**参考・レビュー用保全のみ**。印刷ART本採用／アプリの本番差替え／Pages公開の承認ではない

| ART-ID | テーマ | GitHub保存パス | 原画寸法 | バイト数 | SHA-256 |
|---|---|---|---|---:|---|
| ART-REF0003-PHOTO-01 | 文教／書店・図書館 | [原画](../../assets/art-candidates/asset-art-01/ART-REF0003-PHOTO-01.png) | 1672×941 | 2,767,065 | `8cdcf7cbd361d4387a95e5b06eb0e5112cb3c4846f326b2847af7cc178ff7b57` |
| ART-REF0004-PHOTO-01 | 公園／緑地・並木道 | [原画](../../assets/art-candidates/asset-art-01/ART-REF0004-PHOTO-01.png) | 1672×941 | 3,291,920 | `950c0af7b3bd22a258827b091a0e404ae44197d18271109d8464ec1a70b7b31f` |
| ART-REF0008-PHOTO-01 | ポスト／路地・都市小設備 | [原画](../../assets/art-candidates/asset-art-01/ART-REF0008-PHOTO-01.png) | 1672×941 | 3,020,565 | `df820aff2121482a28c1ff1673f6d3894a2554a30a9c145053a787967de0b97c` |

## 完了の範囲

- **済み**：指定3テーマそれぞれの「文字・価格・地図・ロゴ・情報カードのない単独情景」を写真調で生成。原画を改変せずに専用ブランチで保管し、元PNGとのハッシュ・寸法一致を確認
- **未実施**：原画をPR #39のimage slotへ差し替えた実ブラウザ/A4 QA、最終的な印刷ppi適性、権利を含む本番採用判断、mainマージ／Pages公開
- **次の1操作**：実装側が[PR #39](https://github.com/yama-books/mansion-poet/pull/39)に本3点のうち1点を**試作限定**で差し替え、PCとA4出力を比較。画像制作側の追加量産はレビューを受けるまで止める

**注記**：GitHub原画の保存は3/3達成。公開GitHubへの原画の保全と、アプリに表示することの許諾は独立して管理する。
