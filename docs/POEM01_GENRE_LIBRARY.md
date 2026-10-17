# POEM-01｜ジャンル別文章辞書 v0.1 実装記録

日付：2026-10-17 JST  
対象：APP-003 / POÈME / ESTATE  
作業ブランチ：`work/poem-genre-library-20261017`  
関連仕様：[GENERATION_ENGINE](GENERATION_ENGINE.md)／[POEM_SUBJECT_POLICY](POEM_SUBJECT_POLICY.md)

## 実装したこと

- `src/poem-catalog.js` を追加。63ジャンルに**手書きの日本語フック10案ずつ、630フック**を登録。各フックは見出しおよび本文の別々の位置へ使う。従来のHeritage／Metropolis／Sanctuary、ポエム濃度、再生成番号と組合せる。
- 同一施設で繰り返し生成すると最大10通りの異なる見出し（11回目は辞書だけなら循環）。スタイル別結句と低／高濃度の本文の長さを区別。
- 一般自然・景観、公園、樹木・川・滝・山頂、側溝・排水路・暗渠・マンホール・カーブミラー等の都市設備、学校・大学・図書館・市役所・郵便ポスト、神社・寺院・教会の建築文化、飲食店とブランドの独立項目を含む。
- `index.html` はカタログの静的JSを読み込み、既存の正規化施設に**出典のある明示カテゴリ／OSMタグ／検証可能なbrand属性**が対応する場合だけ、専用文章で従来のテーマ文章を上書きする。未対応・低信頼なら従来の保守的フォールバック。
- 特別支援学校、医療・社会福祉・保護施設等は生成とTHE EVIDENCEの候補選定より前に除外。学校・一般行政・宗教的建築は種別に応じて採用し、人物・信仰・利用者はユーモアの題材にしない。
- ブランド名が単に店舗名に含まれるだけではブランド専用構文を使わない。プロバイダの`brand`＋整合する飲食の業態が必要。ブランドの商標・公式宣伝文句を作品に転記しない。
- GitHub Pagesワークフローの配信物に `src/poem-catalog.js` を含め、PR CIも新規ファイルの変更で動くようにする。
- 既存の生成画面・地名検索・生活施設THE REALITYを維持。

## 機能上の区別

**辞書の登録 = 実データから発見できることではない。** 現行のOpenPOI／Overpass検索はSTB-07とLIFE-01に由来し、微細な地物・店舗ジャンルを網羅するものではない。例えば側溝・暗渠の辞書は完成していても、該当するOSMの検索範囲・タグクエリを後続PRで増やすまでは公開画面から発火しない場合がある。住宅広告向けの生成を過剰なAPI呼出しで遅延させない。

- `src/poem-catalog.js` に関するテストはNodeでジャンル選択・10案の多様性・ブランド確認・保護的除外・文体別生成を行う。
- `tests/location-races.test.mjs` に、モックされたUIの生成→再生成、ピザ専用構文、保護的施設の証拠漏洩防止の統合テストを追加。
- 終了時はPR CI、Pages公開、HTTP反映、実ブラウザ・実機を**独立した検証段階**として報告する。

## 残件

1. 63ジャンル×10フックの日本語品質を複数回の人手レビューで磨く（初版はドラフト品質）。
2. OSMの微細設備・道路地物、OpenPOI料理種別の検索網羅性をデータ取得側で検証し、利用制限と帰属を守って段階拡充。
3. ブランド判定辞書と実データの`brand`属性を実地に照合。名称だけから二郎系／天下一品などへ誤昇格させない。
4. 複数施設を自然な1作品に融合する構文、見出し／本文の文法審査、禁則検査、濃度ごとの文体磨き。
5. iPhone Safari／Android Chromeでの実機操作確認。

関連： [LIFE-01実装記録](LIFE01_IMPLEMENTATION_20261017.md)

## 2026-10-17 公開ゲート記録

- [x] [PR #11](https://github.com/yama-books/mansion-poet/pull/11) をmainにマージ：[`472a9db`](https://github.com/yama-books/mansion-poet/commit/472a9db86dec0a3da65200d6780182fb06a4a75f)。
- [x] [PR CI #39009003709](https://github.com/yama-books/mansion-poet/actions/runs/39009003709)：51件成功、失敗0。
- [x] [Pages #39009079478](https://github.com/yama-books/mansion-poet/actions/runs/39009079478) SUCCESS。公開HTMLと `src/poem-catalog.js` それぞれHTTP 200で配信・実装コード反映を確認。
- [x] 公開ブラウザ（中野）でジャンル専用の見出し「学びが街に刻む明日の線。」、根拠施設「アイデスク中野自習室」を使った本文を確認。REGENERATEで「教室という未来の入口。」に変化。取得元は一部失敗したが、得られた施設情報を利用した生成が継続した。
- [x] 上記ブラウザ確認で、広義の `education` が「学校」として細分類されるケースを発見。続く[PR #12](https://github.com/yama-books/mansion-poet/pull/12) で学校・池・カレーの細分類誤昇格を修正し、[`da22323`](https://github.com/yama-books/mansion-poet/commit/da2232307ef035f643a1dbf7935a2c55f15cbe80) をmainへマージ。
- [x] [PR #12 CI #39009236878](https://github.com/yama-books/mansion-poet/actions/runs/39009236878)：53件成功、失敗0。
- [ ] PR #12のPages最終成功は別途追記・確認。
- [ ] PR #12修正版の生成を公開ブラウザで再確認。
- [ ] 63ジャンルすべての自然な日本語・内容表現を人手で複数回レビュー。
- [ ] iPhone Safari、Android Chromeの実機受入。

**配信後の動作検証は実際に取得できた施設種のみ**。630文章フックの個別の公開ブラウザ表示を全て確認したわけではない。
