# GEO-00｜微細POIデータ取得の初期Spike（2026-10-17 JST）

APP-ID: APP-003 / POÈME / ESTATE  
状態：**小規模実データ取得を1回試行、サーバー側502で未取得。タグ／利用条件の調査のみ確定。GEO-01未実装。**  
直前基点main：`8db7857cdeb6438be188a2a9cec0c59b8c1f0ff0`（SAFE-01 PR #17統合後）

## 1. 対象タグ・意味と識別の確実性

| 対象 | OSMタグ | 解釈してよい事実 | 解釈してはいけない事実 |
|---|---|---|---|
| 郵便ポスト | `amenity=post_box`（基本node） | 差出用の投函箱という登録 | 郵便局、私設受け箱、赤色、回収時刻、利用状況 |
| 側溝 | `waterway=ditch` | 通常は小規模の人工的な排水溝という登録 | 常時流水、通行可能、古河川、誰でも近づける |
| 排水路 | `waterway=drain` | 人工的な排水系水路という登録 | 史的な地下河川、必ず地表にある |
| 暗渠・覆渠 | `tunnel=culvert` と `waterway=*` の組合せ | 覆われた水路区間というタグ | 昔の川、長大な地下河川、成因、歩行可能性 |
| 私設郵便受け（除外） | `amenity=letter_box` | 個人宛受取りの箱 | 公衆の投函ポストと混同 |

OSM Wiki: [post_box](https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dpost_box)、[letter_box](https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dletter_box)、[ditch](https://wiki.openstreetmap.org/wiki/Tag:waterway%3Dditch)、[drain](https://wiki.openstreetmap.org/wiki/Tag:waterway%3Ddrain)、[culvert](https://wiki.openstreetmap.org/wiki/Tag:tunnel%3Dculvert)。

## 2. 1回だけの小範囲・読み取り取得

- 基点：アプリに既登録の中野プリセット（緯度35.7074、経度139.6659）。**施設の所在地ではない**。
- 半径：350m。
- 検索：post_box node、ditch/drain way、culvert＋waterway wayをまとめて一度だけ取得。
- `timeout:12` 秒、`maxsize:33554432` bytes、応答最大30要素、`out center`（線地物の代表中心点は**正確な最寄り距離ではない**）。
- リクエスト：2026-10-17 JST、`https://overpass-api.de/api/interpreter` に1回（HTTP GET）。
- **結果：HTTP 502 Bad Gateway / Gateway Timeout。サーバーが満杯で全クエリ実行枠と待機キューが埋まっている旨を返した。**
- 要素数、無名地物率、種類別件数、線の中心誤差は**未取得／未測定**。ゼロ件ではない。
- このセッションでは自動再試行・別インスタンスへの連続問い合わせをせず、負荷を加えないため1回で停止。

送信したOverpass QL（再試行用の手順例。無制限の本番常時検索には転用しない）：

```overpass
[out:json][timeout:12][maxsize:33554432];
(
 node(around:350,35.7074,139.6659)["amenity"="post_box"];
 way(around:350,35.7074,139.6659)["waterway"~"^(ditch|drain)$"];
 way(around:350,35.7074,139.6659)["tunnel"="culvert"]["waterway"];
);
out center 30;
```

## 3. 公開API運用判断

[Overpass API公開インスタンス案内](https://wiki.openstreetmap.org/wiki/Overpass_API)、[公式commonsドキュメント](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html)から、公開エンドポイントは実験的・人手操作の少数問い合わせ向けと扱う。FOSSGISの文書には日あたり10,000件／1GBの一般目安があるが、**継続稼働するWebアプリの利用可能な無料枠を保証する値ではない**。Webサイトならユーザー全員の合算負荷で計算する必要があり、恒常運用向けにはさらに小規模な利用を推奨している。商用・継続トラフィックで無料公開APIを無条件に使用しない。障害時は地名のみ生成、取得していない・失敗・取得ゼロを区別する。

## 4. 次の作業と受入条件

1. Overpassが復旧し、負荷・利用条件を満たすと判断できた場合に限り、手動で1地点1リクエストずつ再検証する。**無限再試行なし**。
2. 返却された実データだけをfixture化し、要素`type/id`・タグ・名前の有無・`way`の形状取得可否・取得日時・レスポンス件数を記録。住所・施設名・距離・徒歩時間を推測補完しない。
3. `node`は座標、`way`は線の最近接点で直線距離を計算できるかを別途検証する。`out center`の中心点を最短距離として使わない。
4. 現行アプリのOverpass追加タグや検索半径の拡大は、取得実態の比較と負荷設計ができた後のGEO-01/02で実施する。PS-01〜28判定ゲートを迂回しない。
5. 既存の630フックと117PR組、LOCATION表示、POEM-01文字列は**本調査で変更しない**。

本Spikeは**タグの妥当性とAPI逼迫の実測**まで。実施設発見・公開UIの微細POI表示の成功を意味しない。
