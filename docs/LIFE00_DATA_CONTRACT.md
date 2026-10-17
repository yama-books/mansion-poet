# LIFE-00｜THE REALITY 最小データ契約 v0.1

作成：2026-10-17（JST）  
対象：APP-003 / POÈME / ESTATE  
正本リポジトリ：yama-books/mansion-poet  
状態：**仕様レビュー用。実装・公開・ブラウザ受入は未実施。**  
親仕様：[LIVING_ENVIRONMENT_SPEC](LIVING_ENVIRONMENT_SPEC.md) / [DEVELOPMENT_PLAN](DEVELOPMENT_PLAN.md)  
既存基盤：[STB-04](STB04_HANDOFF_20261017.md)・[STB-05](STB05_HANDOFF_20261017.md)・[STB-06](STB06_HANDOFF_20261017.md)・[STB-07](STB07_HANDOFF_20261017.md)

## 1. 決定事項と非目標

THE DREAM（架空広告）とTHE REALITY（地点近傍の生活施設）は**選択座標を共有**するが、文体・ポエム濃度・広告の形容を生活上の事実として使わない。REALITYは公開APIで得られた情報を紹介するもので、網羅・実在・営業・利用可能性・施設入口の位置を保証しない。

- 初版は**買い物 shopping／日用品 daily／交通 transport／休息 rest／文化 culture** の5分類。各カテゴリ近い順に最大3件を表示する。
- 初期半径は**850m**。正規化済みの施設座標と選択地点から求めた**直線距離**だけを使用し、徒歩分数へ換算しない。
- 既存の normalizePOIs、deduplicatePOIs、分類信頼度、validationFlags、evidenceSources、STB-07通信状態、selectionVersion を**再利用**。ポエム用8テーマを生活用5カテゴリと同一視しない。
- 施設検索の失敗を空結果や施設不在と混同せず、成功した取得元のPOIは使う。通信失敗時もDREAM生成を妨げない。
- 初版で行わない：新たな外部API導入、道路経路／徒歩時間、営業時間の確認、現在営業中の保証、学区・治安・資産価値判定、施設DBの独自収集、画像出力、API結果の恒久保存。
- 本書は**データ契約**のみ確定するためのPR。LIFE-01のUI/JS実装を同じPRに混ぜない。

## 2. 既存コードに対する接続点

2026-10-17 の main（STB-07後）では、index.html に normalizePOIs(rows, origin, source)、deduplicatePOIs(items)、fetchPOIs(origin, signal)、choosePOIs(items)、generate() がある。

- normalizePOIs の実在フィールド：name, category, theme, classificationConfidence, classificationEvidence, classificationFlags, source, sourceId, lat, lon, distance, distanceMeters, tags, retrievedAt, licenses, attributions, address, recordPrefecture, recordCity, validationFlags。
- deduplicatePOIs は同名・直線40m以内の候補を暫定統合し、evidenceSources と競合フラグを維持する。40mは実店舗の同一性を証明しない。
- fetchPOIs は低信頼分類を除外し、 {pois, health} を返す。health は kind=complete/partial/empty/unavailable、retryable、issues、openOK、osmOK を持つ。OpenPOIの2検索が一部成功した場合も partial があり得る。
- choosePOIs は**広告の主題向け**に最大12件へ縮小・文体別に並べ替える。REALITYへそのまま渡すと生活用POIが失われるため、**その結果を入力にしない**。
- 現行のOverpass補完は「OpenPOIが少ない／緑がない／自然文体」の場合だけ呼ばれる。**OSM未試行とOSM失敗を同一視しない**。将来必要ならREALITYを開いた時だけ補助取得し、元のDREAM生成を遅延させない。
- 既存のpoemWriteと画面表示は変更しない。LIFE-01で正規化POIから別の派生ビューを作る。

## 3. LIFE-00データ契約

### 3.1 入力

- 選択地点スナップショット：selectionVersion（単調増加番号）、label、lat、lon、radiusMeters=850。
- 既存の正規化・重複処理済みPOI配列。ポエム用のchoosePOIs後の配列ではない。
- fetchPOIsの取得状態。既存のhealthは利用するが、取得元ごとの attempted/succeeded/failed/skipped をLIFE-01実装時に**追加して区別する**。未試行を成功扱いしない。

### 3.2 出力（画面専用の派生モデル）

次は**型と例示値を説明する契約例**。架空の地点・施設であり現在実装されているJSONレスポンスではない。

~~~json
{
  "contractVersion": "life-00-v1",
  "selection": {
    "selectionVersion": 12,
    "label": "架空のサンプル地点",
    "lat": 35.0,
    "lon": 139.0,
    "radiusMeters": 850
  },
  "query": {
    "completedAt": "2026-10-17T02:00:00Z",
    "status": "partial",
    "issues": ["timeout"],
    "sources": {
      "OpenPOI": "succeeded",
      "OSM": "failed"
    }
  },
  "items": [
    {
      "id": "OpenPOI:example-1",
      "name": "架空の食料品店",
      "lifeCategory": "shopping",
      "categoryEvidence": "business_type:grocery",
      "categoryConfidence": "high",
      "lat": 35.0005,
      "lon": 139.0005,
      "straightDistanceMeters": 72,
      "recordRetrievedAt": "2026-10-17T02:00:00Z",
      "claimAsOf": null,
      "facilityStatus": "unknown",
      "projectStatus": null,
      "validationFlags": [],
      "classificationFlags": [],
      "sources": [
        {
          "source": "OpenPOI",
          "sourceId": "example-1",
          "licenses": [],
          "attributions": []
        }
      ]
    }
  ],
  "omitted": {
    "lowConfidence": null,
    "locationConflict": null,
    "unsupportedCategory": null,
    "outOfRadius": null
  }
}
~~~

**意味の区別**

| 項目 | 意味・扱い |
| --- | --- |
| selectionVersion | 古い検索結果を新しい地点へ差し込まないための版番号。lat/lon/半径も比較する |
| query.completedAt | **このアプリが取得処理を終えた時刻**。施設の更新日や営業確認日ではない |
| query.status | 既存STB-07のcomplete/partial/empty/unavailableに対応。emptyはAPI照会結果が空だったという意味で、地域に施設がない証明ではない |
| query.sources | attemptedに対する succeeded/failed、または skipped。部分成功時はOpenPOIの2要求のうち何件が成功したかも保持できるようにする |
| id | 取得元＋sourceIdから作る**画面内の識別子**。sourceId欠損時は正規化名・座標から暫定IDを作り、実世界の恒久IDとして扱わない |
| lifeCategory | 生活5カテゴリのうち**一つ**。汎用カテゴリ・名称だけの連想で推定しない |
| categoryEvidence | 分類の根拠となった業態コードまたはOSMタグ。表示時は必須ではないが追跡可能にする |
| categoryConfidence | STB-06の分類信頼度とは別に生活用途への分類確度を表す。highでも営業・実在の保証ではない |
| straightDistanceMeters | 選択座標からPOI座標への直線距離。既存distanceMetersを使用し、並べ替え前に丸めない |
| recordRetrievedAt / claimAsOf | API取得時刻と、**データに明示された事実の基準日**。後者は不明ならnull |
| facilityStatus | unknownを既定。planned/announcedを通常の生活施設一覧へ混ぜない。existingは十分な別証拠がある場合だけ |
| projectStatus | 施設本体と改修・計画事業の状態を混同しないための将来用、初版null |
| sources | deduplicatePOIsのevidenceSourcesを保持。licenses/attributionsを消さない |
| omitted | 除外理由の**表示可能な診断件数**。元データの実店舗件数ではない。**既存関数で除外済みの候補は遡って数えられないため初版ではnull（未計測）を許容し、0件と混同しない** |

選択座標と半径をキーとする。文体・濃度はREALITYの取得結果のキーに含めない。ただし既存DREAMのfetchPOIsは文体でOSM補完範囲が変わるため、LIFE-01で共有する際は「どのソースを実際に試したか」と検索条件を明示し、完全に同じ取得集合だと誤認しない。

## 4. 生活5カテゴリの保守的なマッピング

**優先：構造化された業態・タグ ＞ 名称**。名称に「駅」「美術館」「薬局」が含まれるだけでは、生活用カテゴリを確定しない。OpenPOIのbusiness_type/categoryが互いに矛盾する場合はSTB-06と同様に自動採用を保留。

| lifeCategory | 初版で採用してよい明示的な種類 | 採用しない例 |
| --- | --- | --- |
| shopping（買い物） | OpenPOI grocery 等の**検証済み食料品業態**、OSM shop=supermarket | retail_otherだけ、施設名だけに「スーパー」 |
| daily（日用品） | OpenPOI convenience_store、OSM shop=convenience、薬局はOSM amenity=pharmacy等の明示タグがある場合のみ | medical全般、名前だけの「薬局」 |
| transport（交通） | OpenPOI station、OSM railway=station | 計画中の停留所、単なる交通を連想させる名称 |
| rest（休息） | OSM leisure=park など**実際に検索・分類している明示タグ** | 「緑」を名前に含む飲食店、私有地の自由開放の推測 |
| culture（文化） | OSM amenity=library、tourism=museum/gallery、shop=books等の明示タグ（**取得処理が対応したものだけ**） | OpenPOI tourismのみ、施設名だけでの美術館認定 |

実装前に各プロバイダの**実データに存在するコードをfixtureで検証**してからホワイトリスト化する。現在のtagPOI/poiTypeRulesが持たない生活種別を、取得済みだと見なしてはいけない。特にOSMのshop系は現行Overpassクエリ対象ではない。最初は対応済みタグで小さく始め、LIFE-01以降の独立PRで必要なクエリを追加する。

カテゴリが不確か／分類衝突／住所の自治体不整合／不正座標／半径超過の候補は**表示保留か除外**。低信頼の候補を架空の補完データに置き換えない。1施設を複数カテゴリに自動で重複計上しない。複合建物とテナント関係は親子IDが確認できるまで不明とする。

## 5. 表示状態、文言、順序

カテゴリごとに**近い順で最大3件**。距離が同じ場合は正規化名とIDで安定ソートする。表示距離は「直線距離 約○m」と明記。件数は検索済みデータでの候補数であり地域の全施設数ではない。取得元が一部のみの場合は必ず注記する。

| 状態 | 初版の文言 |
| --- | --- |
| 有効な施設あり・取得完了 | 「取得した施設データの中から、近い順に表示しています。」 |
| 一部取得・候補あり | 「一部の施設データを取得できませんでした。表示中の施設は取得できた範囲の情報です。」 |
| 正常取得・該当カテゴリ0件 | 「取得したデータでは、この分類に該当する施設が見つかりませんでした。」 |
| 検索未試行／ソース対象外 | 「この分類の情報はまだ十分に検索していません。」 |
| 全取得失敗 | 「周辺施設データを取得できませんでした。作品は地名のみで生成できます。」 |
| 429等 | 「施設情報の取得先がアクセス制限中です。時間をおいてお試しください。」 |
| 施設の稼働状態 | 「登録情報は現在の営業・利用可能性を保証するものではありません。」 |

- 店舗カード：名称、生活カテゴリ、直線距離、取得元リンク・帰属、アプリ側の取得時刻を優先。営業中／徒歩分数／学区／物件価格を表示しない。
- 住所矛盾やカテゴリ競合がある候補は既定で表示しない。施設0件でも「周辺にはない」と言い切らない。
- DREAMの文体や濃度変更でREALITYの施設一覧を変えない。取得データそのものと主題用の並び順を分離する。
- エラー時の再試行は**明示操作**のみ。429時の自動連続リトライ禁止。部分取得・全失敗を永続キャッシュ確定しない。
- 位置を変えたら旧REALITY結果を即時無効化し、進行中通信は中断／結果破棄する。外部地名API等への送信がある旨は表示する。

## 6. LIFE-01実装で必要な最小差分

1. 既存fetchPOIsが返す「未縮小の正規化POI」とhealthを、地点スナップショット付きで利用できるようにする。choosePOIs結果は使わない。
2. 取得元の未試行と失敗を別に記録し、クエリの完了時刻も収集する。既存STB-07のerror code／retryable仕様を破らない。
3. buildLifeViewModel() のような**副作用のない派生関数**で5カテゴリへ分類し、検証フラグを適用、距離順に並べる。新しい正規化器を二重実装しない。
4. 最初は結果直後の折りたたみ一覧のみ。開く前の追加通信は行わず、必要な追加照会があるなら展開時だけ実行する。既存Leafletの地図インスタンスを複製しない。
5. LIFE-02の地図マーカー・フィルタ、LIFE-03の検索半径拡張、LIFE-05の経路案内は別PRへ分離する。

## 7. 受入・回帰テスト設計（**未実行**）

| ID | fixture / 操作 | 合格条件 |
| --- | --- | --- |
| LIFE-T01 | 同じPOI、文体だけ変更 | REALITYの件数・カテゴリ・距離・並びが不変 |
| LIFE-T02 | 「お酒の美術館」+ bar_izakaya | cultureに入らない |
| LIFE-T03 | medicalのみ／名前に薬局 | dailyと断定しない |
| LIFE-T04 | OpenPOIスーパー、OSM同名近傍 | 名寄せ後1施設、出典2系統を保持 |
| LIFE-T05 | 同じ名称、離れた2店舗 | 別施設として維持 |
| LIFE-T06 | prefecture_mismatch、provider_type_conflict | 保留、表示に使わない |
| LIFE-T07 | OpenPOI成功、OSM失敗 | 有効施設を表示、partial注記 |
| LIFE-T08 | 両取得元失敗／429 | REALITYは取得不能、DREAMは地名のみで継続 |
| LIFE-T09 | 正常0件／OSM未試行 | no matchとnot searchedを区別 |
| LIFE-T10 | 検索中に別の地点を選択 | 古いカード・出典・距離が表示されない |
| LIFE-T11 | 緯度経度逆転・半径超過 | 不正値は表示しない |
| LIFE-T12 | 取得時刻あり・基準日不明 | 「最終取得」と「現在営業中」を混同しない |
| LIFE-T13 | 計画中施設・複合施設内テナント | 既存施設数や稼働状態を誇張しない |
| LIFE-T14 | 320px／375px幅、キーボード | コピー・生成を妨げず、カードも横にはみ出さない |

LIFE-01以降、Node fixtureテスト→CI→Pages公開→実ブラウザ（中野・荻窪・取得失敗）→iPhone/Android実機の順で記録し、各レベルを混同しない。

## 8. 残る判断と次の一操作

- **保留：** OpenPOIの実データ業態コード一覧とOSM検索対象の差分、薬局／図書館／書店の追加取得範囲、カテゴリ別「未検索」の判定、複合建物の過剰統合、画面上の帰属表示形式。実データ・ライセンスを確認してLIFE-01時点で確定。
- **受入未完了：** v0.1.2公開最新版での地点選択→POI→ポエム生成、通信異常表示、iPhone/Android実機。以前のv0.1.1実ブラウザ確認で代替しない。
- **次の一操作：** この文書のレビュー後、LIFE-01を別ブランチで最小UI/fixtureから実装。公開への反映はテスト・実ブラウザ結果を見て判断する。

参照： [STB-07の29テストと公開記録](STB07_HANDOFF_20261017.md)／[品質計画](QUALITY_TEST_PLAN.md)／[中央台帳 APP-003](https://github.com/moyashimisosoup/session-deck/blob/main/docs/APP_PORTFOLIO.md)
