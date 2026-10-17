# LOCATION-01｜広告として完成する周辺施設紹介

APP-ID: APP-003 / POÈME / ESTATE  
実装日：2026-10-17（JST）  
状態：**最小版実装・main公開・公開ブラウザ受入確認済み。実機タップ・細密設備検索は未完了。**  
正本：[yama-books/mansion-poet](https://github.com/yama-books/mansion-poet)  
関連：[POEM-01](POEM01_GENRE_LIBRARY.md) / [POEM_SUBJECT_POLICY](POEM_SUBJECT_POLICY.md) / [LIFE-01](LIFE01_IMPLEMENTATION_20261017.md)

## プロダクトの編集上の決定

ポエムの下には**着想源の解説ではなく、架空の高級物件広告における「LOCATION HIGHLIGHTS / 街の魅力」**を配置する。施設自体の存在をPRとして扱う。本文には「このポエムの素材」「選定理由」などメタ説明を出さない。既存のTHE EVIDENCEとTHE REALITYはその下に分離し、出典・現況制約・生活データを混ぜない。

### 表示イメージ（**架空の例**）

> 01 / ○○暗渠
> 所在地：東京都○○区○○町（取得した場合のみ）  
> 直線 約420m  
> **地表に現れない、もうひとつの都市。**  
> 街の下へと姿を移した水の経路。その存在は、目に映るものだけが都市の価値ではないことを静かに語ります。
> ※現行版では徒歩分数は表示しない。住所不明は所在地詳細未収録と明記。

## 最小版のデータ契約

`src/location-highlights.js` が副作用なしで `create(pois,{catalog,serial,maxItems})` を提供。

```js
{
  name: '実際に取得したPOI名',
  genreId: 'culvert',
  genreLabel: '暗渠',
  headline: '地表に現れない、もうひとつの都市。',
  body: '専用のPR説明文',
  address: null,                  // 取得した所在地だけ。地図選択地点の住所を流用しない
  distanceMeters: 420,           // 選択点からPOIの座標への直線距離
  distanceLabel: '直線距離',
  walkMinutes: null,             // 歩行経路が未確認なら絶対に数値化しない
  source: 'OSM', sourceId: 'way/1',
  rank: 1
}
```

- **対象は最大3件**。既存のPOEM-01用 `choosePOIs` のランキングを共有し、第1候補を最も大きく扱う。広告特集から一般の生活施設一覧は省かず、THE REALITYは別途残す。
- 高信頼 `classificationConfidence=high`、`validationFlags`なし、業態衝突・主題の保護的除外がない施設だけを採用する。ジャンルは構造化した `PoemCatalog.resolve(p)` を再利用する。明示ジャンルがなければ適切な一般文教・食等の広告文へフォールバック。
- 同一POI・同一ジャンルの広告カードを並べない。3件に満たない場合はあるものだけを表示する。ゼロ件なら創作施設を足さず未取得と表示。
- 名称・所在地・文章はDOM `textContent` を使ってエスケープ扱いにする。住所の `addr:*` や `recordPrefecture/recordCity` は元のデータがある場合だけ表示。町名を選択地点のラベルから類推しない。
- 距離は `distanceMeters` を四捨五入して「**直線 約○m**」と表示。経路未取得を徒歩分数へ換算しない。
- `walkMinutes` の将来拡張は `routeEvidence='verified_foot'`、`entryPointVerified===true`、`walkingRouteMeters` が検証できた場合のみ `ceil(m/80)`、下限1分とする。ただし2026-10-17時点の公開POI取得系には経路データがなく、**常に非表示**。
- PR本文にアクセス可能・現在営業中・学区内・建物からの眺望などを含めない。
- 画像や未確認の施設イラストは初版なし。カードは文章タイポグラフィと余白を中心とした端正な広告にする。
- 古い地点の結果を表示しない。新地点選択でカードは即座に空欄へ戻り、生成結果に合わせて更新する。
- スマートフォン幅では1列へ並べ替える。古いプリント生成機能・POEM-01の辞書は維持。

## 文章辞書

`src/location-highlights.js` に**29ジャンル × 3広告見出し／PR本文 = 87組**の初稿を登録。暗渠・側溝・排水路・郵便ポスト・郵便局・学校・役所・神社・寺院・教会建築・公園・庭園・河川・樹木・図書館・スーパー・ピザ・ラーメン・ラーメン二郎・天下一品・銭湯・ゲームセンター・駅・マンホール・カーブミラー・自販機・ベンチ・宅配ロッカーなど。その他のPOEM-01ジャンルには10の一般テーマそれぞれ3案、計30組の専用PR文を適用。**合計117組**。

POEM-01の既存630文言は**文言制作専用の別作業**へ移譲済みにつき触れない。PR用の新しい文章は別ファイルへ保存するため編集競合を防げる。

## 初版非目標

- OSMの暗渠、郵便ポスト、自販機、側溝等を新たに検索するAPIの大量追加
- 徒歩ルート、入口座標、経路の到達可能性、施設営業状況の取得
- 住所の逆ジオコーディング（POIの座標と選択地点の混同を避ける）
- 3カード以上の比較や画像生成
- PR用117組の人手による複数回品質校閲
- 他の施設種のブランド名を未検証で推定すること

## 段階的な次作業

1. **LOCATION-02**：重要ジャンルを10案ずつへ拡張し、見出し・説明文の単調さを校閲。通常の広告らしさと意外性の両立を評価。
2. **GEO-POI**：APIレートに配慮しつつ、側溝・暗渠・ポスト等の細かな地物が検索可能な範囲を検証して拡充。
3. **WALK-01**：歩行経路・入口/到達点の精度・参照元・所要時間を厳密に扱うAPI導入検討。直線距離からの分数捏造をしない。
4. 生活用THE REALITYの取得範囲・誤分類とiPhone/Android実機受入を独立して改善。

### 検証ゲート

- Nodeユニットテスト：117広告案、住所・距離・徒歩分数の禁則、配慮施設の非選定、再生成変化。
- モック画面テスト：PRカードのDOM、地点変更後の旧カード消去、取得不能時に架空カードを出さないこと。
- PR CI成功 → mainマージ → Pages成功 → 公開ページで表示・再生成・モバイル表示の確認。
- この文書の「実装」とユーザーの実機操作確認は別扱いとする。

## 2026-10-17 実装・公開・受入CHECKPOINT

- [x] [LOCATION-01 PR #13](https://github.com/yama-books/mansion-poet/pull/13) mainマージ：[`105ef6f`](https://github.com/yama-books/mansion-poet/commit/105ef6f28bc6ee0ce09eb89b7cb35614fa01fc13)。[PR CI 66件成功](https://github.com/yama-books/mansion-poet/actions/runs/39013478076)、[Pages SUCCESS](https://github.com/yama-books/mansion-poet/actions/runs/39013536945)、公開HTML/新JS HTTP 200を確認。
- [x] 公開ブラウザで中野プリセット→実施設カード3枚表示、所在地・直線距離・広告見出し・PR本文、REGENERATE、京都プリセットへ地点変更した際の古いカード即時消去を確認。
- [x] 実ブラウザで洋菓子店がスーパーと分類され、PRに編集者視点の「ご紹介します」が入る問題を検出。[分類・コピー修正PR #14](https://github.com/yama-books/mansion-poet/pull/14)をマージ（[`ea25c23`](https://github.com/yama-books/mansion-poet/commit/ea25c23d0ddce5b397ece4f7e8928451edc7cfea)）。[68テスト全成功](https://github.com/yama-books/mansion-poet/actions/runs/39013849570)、[Pages SUCCESS](https://github.com/yama-books/mansion-poet/actions/runs/39013894353)。公開ブラウザで銀座コージーコーナーが一般商業PRにフォールバックし、スーパー・食料品など誤断定しないことを確認。
- [x] 一般テーマの広告が再生成でも変わらない問題を発見。[PR #15](https://github.com/yama-books/mansion-poet/pull/15)で全10テーマを3案ずつに拡大、合計117組へ（[`a879580`](https://github.com/yama-books/mansion-poet/commit/a879580b8d951a675c56930237dbf697b4753302)）。[PR CI 69件全合格](https://github.com/yama-books/mansion-poet/actions/runs/39014087499)、[最終Pages SUCCESS](https://github.com/yama-books/mansion-poet/actions/runs/39014131376)。公開ブラウザで中野の3カードが再生成で**すべて別見出しに変化**し、洋菓子店をスーパーと誤認しないこと、徒歩分数を捏造しないことを確認。
- [ ] iPhone Safari / Android Chrome実機。320px/375pxでの実機タップ、長い施設名の文字切れ、印刷／コピーへの取り込み確認は未完了。
- [ ] 暗渠・側溝・ポスト等の微細施設をライブAPIから実際に取得して広告カード化する試験。現行API条件では未検索・未登録の可能性が高い。

**出典表示とPOIの網羅性は別課題。** 公開ブラウザで今回観測したのは中野の実取得施設に対する広告カードであり、117組すべてを実データで動作確認したわけではない。
