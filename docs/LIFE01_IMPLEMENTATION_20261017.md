# LIFE-01 実装・検証記録（2026-10-17）

正本：`yama-books/mansion-poet`  
作業ブランチ：`work/life-01-reality-ui-20261017`  
対象：APP-003 / POÈME / ESTATE  
仕様：[LIFE-00データ契約](LIFE00_DATA_CONTRACT.md)  
PR：[LIFE-01 #9](https://github.com/yama-books/mansion-poet/pull/9)

## 目的・変更

現行の THE DREAM を維持しつつ、生成した地点の THE REALITY を折りたたみで表示する。
`index.html` 内の既存 `normalizePOIs` / `deduplicatePOIs` / `fetchPOIs` / STB-07の取得状態をそのまま活用し、文体依存の `choosePOIs` はREALITYで使わない。

- 5カテゴリ（買い物・日用品・交通・休息・文化）、最大3件ずつ、正規化済みの施設名・直線距離・出典リンク・取得日を表示。
- OpenPOI `supermarket/grocery/convenience_store/pharmacy/drugstore` など、明示型だけ採用。OSMは既存Overpassが取得する公園・図書館・美術館・駅などのタグだけ対応。
- 名称だけの推測、低信頼・住所自治体の矛盾・業態衝突は生活カテゴリから除外。
- OpenPOIの業態・種別を既存正規化POIに保持。明示されたコンビニ・薬局の提供元分類をポエム側の「商業」テーマに追加。
- 既存の通信を再利用。追加の外部取得をしないため、データの未収録・未検索カテゴリがある点を明示。OSMの未試行と失敗を区別するフラグを付与。
- 地点変更で古いREALITYカードを消去。API全失敗時も地名のみのポエムは生成できる。
- 既存スタイルを踏襲し、スマホ幅では1列、`<details>` で開閉可能、`aria-live`で状態を案内。 `prefers-reduced-motion` 対応。
- 公開データは店の営業状況・施設現存・網羅性・歩行時間を保証しない。個別のライセンス・表示と補助取得の整備は後続タスク。

## 自動テスト

既存29件＋LIFE-01追加7件（合計**36件**）。以下を確認：

1. スーパー／コンビニ／駅の明示型を分類
2. お酒の美術館・業態矛盾・名称由来の低信頼分類を生活事実としない
3. OSM公園／図書館／美術館のタグ分類
4. 近接名寄せ・出典統合・住所矛盾の除外
5. 中野プリセット生成→5カテゴリの描画→別地点選択でカード破棄
6. 一部取得と全失敗時の表示
7. 1カテゴリ3件上限と距離順

[GitHub Actions #38997692932](https://github.com/yama-books/mansion-poet/actions/runs/38997692932)で **36 passed / 0 failed / SUCCESS** を確認。これはNodeでDOMを模したモックテストであり、iPhoneの画面や公開ページの実クリック試験ではない。

## 公開ゲート

- [x] ブランチへコードとテストを保存
- [x] PR CI 36件成功
- [x] [PR #9](https://github.com/yama-books/mansion-poet/pull/9) をmainへSquashマージ：[354d302](https://github.com/yama-books/mansion-poet/commit/354d302273216527aa7d6b61678cf00711136e14)
- [x] [Pages run #38997804769](https://github.com/yama-books/mansion-poet/actions/runs/38997804769) SUCCESS（Node36件成功）。公開URLのHTTP 200、LIFE-01要素・ロジック反映をライブ取得で確認
- [x] 公開ブラウザで中野プリセット→生成→THE REALITY展開を確認。5分類見出しを確認。カードの実施設表示と地点切替の連続操作は未確認
- [ ] iPhone Safari／Android Chrome実機タップ・縦スクロール・文字切れ

## 残件と次の改善

現行POI取得はポエム用の検索条件。スーパー・コンビニ・薬局・書店等の収録・分類・網羅性は不足する。LIFE-02以降で生活用途向け追加ソース／OSM shop/amenityタグ検索を検討する際もAPIレート・プライバシー・出典を確認し、ページ表示の初期負荷を増やさない。

**到達点：コード実装・36モックテスト・mainマージ・Pages配信・中野の公開ブラウザ実操作（生成／開閉／5見出し）を確認。iPhone/Android実機と施設カード実表示の受入は未確認。**

## 2026-10-17 公開ブラウザ受入の具体的観測

- 公開URL： https://yama-books.github.io/mansion-poet/ （キャッシュ回避パラメータ付きでHTTP 200）
- 中野プリセット選択→生成完了、地名とポエムが「中野」へ更新。THE REALITYの開閉操作が実際に成功し5カテゴリの見出しを確認。
- 生成ステータスは「一部の施設情報を取得できませんでした。取得できた施設を使って生成しました。」、REALITYは「東京都中野区中野 / 半径850m / 一部の取得元が利用できません。」。OpenPOIの素材を使えたが補完取得元は一部失敗。
- **中野の今回の表示は5カテゴリとも該当施設カード0件**。既存ポエム用取得条件ではスーパー等が十分に揃わず、REALITYがまだ実用に足る施設網羅性を持たない。推測で埋めず、LIFE-02の追加検索・独立分類検討へ引継ぐ。
- 390px相当のモバイルスクリーンショット取得とHTML描画は確認できたが、**iPhone実機での文字切れ・タップ操作は未確認**。クリックでの地点変更→古いカード消去、実施設カードの出典リンク操作も引き続き受入残件。
