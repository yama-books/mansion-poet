# APP-003｜次期監理セッション引継ぎ（2026-10-28 JST）

状態：**HANDOFF_READY / NEXT MANAGEMENT SESSION**  
推奨セッション名：`〖POÈME監理〗1028・APP003-MGMT-02・公開後検収と残工程整理`  
新セッション担当：`APP-003/MGMT-02`（この新監理IDは引継ぎ上の識別子。Session Deckへのwork_id登録済みとは見なさない）  
正本Repo：[`yama-books/mansion-poet`](https://github.com/yama-books/mansion-poet)  
現行公開URL：https://yama-books.github.io/mansion-poet/  

## 1. 引継ぎ時に確認した固定基点（2026-10-28）

- main HEAD：`833b15af30921f0a302c47aa796427b9a5567cca`。新セッションでは必ず再取得する。
- Web用SVG版PRINT03の正式統合：[PR #45](https://github.com/yama-books/mansion-poet/pull/45) と [PR #46](https://github.com/yama-books/mansion-poet/pull/46) は**merged**。アプリ公開基点の統合コミットは`8ef9ca4d32054e8afffbc289b91905cb9b8eb166`。
- [Pages CI #40588978832](https://github.com/yama-books/mansion-poet/actions/runs/40588978832) はcompleted/success、公開root/PRINT03アセット/参考ギャラリー19点・manifest/代表PNGのHTTP検証を完了。現在の実機表示をこの証拠だけで保証しない。
- [Mobile CI #40587881902](https://github.com/yama-books/mansion-poet/actions/runs/40587881902) 135/135およびChromium各幅、Linux版WebKit模擬検証成功。[PR #46 CI #40588649362](https://github.com/yama-books/mansion-poet/actions/runs/40588649362) も成功。ただしiOS実機Safariの印刷/PDF受入は**未実施**。
- 前セッションの[正式完了CHECKPOINT](../checkpoints/APP003_PRINT03_LIVE_SESSION_CLOSE_20261028.md) は`PRINT03-LIVE-01 = SESSION COMPLETE / 5 of 5`。**5/5はこの工程だけ**。APP-003全体100%ではない。
- [全体計画](../APP003_MASTER_PLAN_PROGRESS.md) 冒頭の「最新ステータス｜2026-10-28」を、下部に残る旧日付の未実装記述より優先する。
- [全アプリ横断台帳](https://github.com/moyashimisosoup/session-deck/blob/main/docs/APP_PORTFOLIO.md) のAPP-003行は、PRINT03完遂と実機/ART未完了を反映済み。次セッションでは読むが、状態変化がなければ書き直さない。

## 2. 達成済みの資産と保全境界

1. **公開済Web**：選択地点→POEM/LOCATION生成→SVG版A4広告表示・印刷機能、生成地点変更時の旧印刷内容失効。旧印刷形式と参考ギャラリー19画像を保全。未承認ARTを本番選択肢に出さない。
2. **広告文章**：200種類の手書き導入と文体・濃度別の三行広告文は、`src/poem-catalog.js`についてmainと旧PR #40でblob SHA`7252eb408f9860c2a77646d92a73878921cd948c`が**一致**している。つまりPR #40がopenでも、文章をmainへもう一度移植する必要はない。
3. **独立ART原画**：[Draft PR #43](https://github.com/yama-books/mansion-poet/pull/43)、branch`assets/app003-asset-art-01-photo-trial-20261023`、HEAD`222c1fffb33767207fd56789b72ec90839286184`。1672×941 PNG 3点（`ART-REF0003-PHOTO-01` 文教／`ART-REF0004-PHOTO-01` 緑地／`ART-REF0008-PHOTO-01` ポスト）。[manifest](https://github.com/yama-books/mansion-poet/blob/assets/app003-asset-art-01-photo-trial-20261023/research/asset-art-01-manifest.json)、[保全CI #40141561698](https://github.com/yama-books/mansion-poet/actions/runs/40141561698) success。**公開リポジトリでの参考保管のみ、本番での使用権・採用は未承認**。
4. **画像組版試作**：[PR #39](https://github.com/yama-books/mansion-poet/pull/39) は独立の画像比較PoC。旧参考cropより高解像度の原画を試す際にも、最新mainとの差分を精査してから実装する。元のPRツリー全体をmainへ再マージしない。

## 3. 2026-10-28の残存PR（すべて既存mainとの差分を監査してから判断）

監査時open：#30, #31, #32, #33, #34, #37, #38, #39, #40, #41, #42, #43, #44。  
一部は**現在mainに既に実装された内容を含む古いPR**。openは未実装の証明ではなく、Draft解除やmergeも新監理の初手で自動実行しない。  
特に#31／#39／#40／#44はSVG版PRINT03本番統合#45/#46より前の派生ブランチなので、古いHEADからの一括マージを禁止する。実体差分・チェックポイント・関連CIを見て、残す／差分移植／close候補を分類する。

## 4. 次の監理優先順位（新実装の勝手な着手はしない）

### P0：iPhone Safari実機で公開SVG版を1件受入

URL https://yama-books.github.io/mansion-poet/ を**実際のiPhone Safari**で操作する。地点選択→生成→施設・本文の一致→A4紙面プレビュー→共有・PDF保存または印刷へ進む。ページ数（通常入力1ページか）、日本語文字、地図・注記・施設名欠落、操作ボタン、地点変更後の古い出力消失を目視記録する。実機操作はユーザーへ簡潔な手順を渡し、結果とスクリーンショットを受け取る。Chrome 390px/Playwright WebKitは実機の代替ではない。

### P1：印刷1ページ化と長名の受入条件

現行の極端な長名ケースF03は、欠落防止のため**2ページ退避**する場合がある。ユーザーの「一枚広告は1ページ」要求と残存仕様が衝突している。代表の通常名と極端長名を分け、内容欠落・切れ・縮小しすぎを避けた1ページ化の可能性を検証。要件変更・意匠妥協・2ページ退避をどう扱うかは受入根拠とともに判断し、末尾のページをCSSで単に隠さない。

### P1：既存open PRとmainの差分棚卸し

#30〜#44のopen PRを変更ファイル、依存、現行mainとの重複、CI、実機未了の軸で分類し、1画面の優先順位を示す。#45/#46の成果を二重実装しない。文章200本のmain/旧#40同一blobは確認済み。

### P2：画像の本番採用ゲート

PR #43の3原画は作成・保存・ハッシュ検証済みなので無条件の追加生成はしない。まず実際の広告枠で掲載寸法・クロップ・実効ppi・表示速度・SVG fallback・安全を評価。原画1672pxの横寸法はPRINT03試作の182mm画像枠で概算約233ppi（1672/182×25.4）。ただしcoverの縦方向クロップ/使用枠によって実効値は変わる。**本番使用許可は独立承認**し、approved-media等のフラグを監理判断だけで変更しない。

### P3：アプリ体験の残工程

POI地域網羅性、長名の使い勝手、コピーの文芸品質、住所・直線距離・徒歩経路の正確性、REF/ART/RECIPEの適合、画像の段階的追加を、完成への効果順に整理。既存`SAFE`/`GEO`/`SELECT`/`LIFE`コードを再実装しない。低信頼データ・実在人物/学校/宗教施設の事実保証を広告の詩的表現で偽装しない。

## 5. 次期監理セッションの作業境界

- 管理担当はGitHubを**直接読書き可能**。作業時は権限とGitHub側の最新HEADを先に確認し、保存後は必ず読戻し。リポジトリのPublic領域へ私的情報や鍵を入れない。
- 監理と実装を分離する。初手は**検収計画・PR差分棚卸し**。必要なら作業ID付きで独立実装担当へ依頼する。画像新規生成、mainマージ、Pages公開、旧PRの削除は自動実行しない。
- 正本は現行main。過去のDraft PRや2026-10-22の文書表に残る「未実装」は歴史的記述。現行コード・CI・公開・実機を別ゲートとして扱う。
- 成果物の「コード完成／GitHub保存／CI成功／Pages公開／実機PASS」を別々に報告。根拠のないアプリ全体完成率は算出しない。
- 意味のある状態変化のみ、全体マスタープランや全アプリ台帳へ差分反映。次の大きな工程前や複数の重要進捗でCHECKPOINT/HANDOFF_READY。
- 想定ステータス行：`◦ APP-003/MGMT-02｜状態｜確認JST（出所）｜根拠｜次の1操作`。

## 6. 新セッションの最初の1操作と完了条件

**最初の1操作：iPhone Safariの公開SVG版A4を実際に1件検収するため、ユーザーへ最小の操作チェックを提示し、結果を回収する。** 同時にPR #31/#39/#40/#44の既存mainに対する重複差分を読み取り、次の実装指示を出す。ユーザーの実機結果が届いていない間に「Safari PASS」と書かない。

監理の最初の区切りは「実機受入結果の保存（または未実施と明記）／次の対応順位／旧PR重複防止の判断」をCHECKPOINTとして残すことであり、アプリ全体の100%宣言ではない。

## 証拠リンク

- [正式完了CHECKPOINT](../checkpoints/APP003_PRINT03_LIVE_SESSION_CLOSE_20261028.md)
- [全体計画](../APP003_MASTER_PLAN_PROGRESS.md)
- [画像案内板](../APP003_ASSET_WORKBOARD.md)
- [全アプリ共通台帳](https://github.com/moyashimisosoup/session-deck/blob/main/docs/APP_PORTFOLIO.md)
- [公開アプリ](https://yama-books.github.io/mansion-poet/)
