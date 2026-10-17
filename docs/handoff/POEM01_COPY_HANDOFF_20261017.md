# HANDOFF_READY｜APP-003 POEM-01 文言制作専用セッション

確認日：2026-10-17 JST
正本Repo：https://github.com/yama-books/mansion-poet
**重要：旧版では未公開WIPと記述されていたが、PR #11はその後マージ・公開済み。この文書は最新事実で置き換えた。**

## 保存・実装済の証拠

- main HEAD（今回の機能公開の基点）：`472a9db86dec0a3da65200d6780182fb06a4a75f`。
- [PR #11](https://github.com/yama-books/mansion-poet/pull/11) は **mainへマージ済**。
- [PR CI #39009039453](https://github.com/yama-books/mansion-poet/actions/runs/39009039453)：**51 passed / 0 failed、SUCCESS**。
- [GitHub Pages #39009079478](https://github.com/yama-books/mansion-poet/actions/runs/39009079478)：**51 passed / 0 failed、SUCCESS、配信ジョブ完了**。
- `src/poem-catalog.js`：63ジャンル×10着眼点＝**630件の初稿**。構文チェック、全ジャンル10件、重複IDなし、簡易郵便ポスト分類、社会福祉施設の1件除外を確認。文章の全件人手校閲は未実施。
- `index.html`：63ジャンル辞書の呼出しを統合済み。`tests/poem-catalog.test.mjs`12件、`tests/location-races.test.mjs`増補と併せ全51件成功。静的JS配信構成も反映。
- 本件での新規iPhone/Android実機タップ検証と、全国実データに対する取得範囲・全安全ケースの評価は**未確認**。CI成功と実機確認を混同しない。
- ポリシー：[POEM_SUBJECT_POLICY.md](../POEM_SUBJECT_POLICY.md)（自然・学校・一般行政・ポスト・宗教的建築の文化・景観採用、支援・福祉などの保護的主題除外）。既存の28テストは設計案であり、すべてのケースに対する実装保証ではない。

## 現在の担当範囲と停止条件

**このセッションでの文言の大量追加は一時停止**。別セッションに**表現の制作・推敲のみ**委譲する。既存630件は「独立した630本の完成ポエム」ではなく短い見出し/本文フック。実装をやり直したり、ゼロから630件を再作成しない。

**文言担当の別セッションが編集してよい対象**：
- `src/poem-catalog.js` 内の `genres[*].variants` の**文章文字列のみ**。必要なら文言レビュー用 `docs/poem-copy/POEM_CATALOG_REVIEW.md` を新設。
- ジャンルID・selectors・`resolve()`・`suppressed()`・`compose()` のロジックや `index.html`、`tests/**`、公開ワークフローは変更しない。
- まず63×10の重複・言い換え・失礼な比喩・事実逸脱を審査し、特に**側溝／暗渠／マンホール／郵便ポスト／自然景観／学校／役所／神社・寺院・教会建築／ラーメン二郎／天下一品**の10案の完成度を優先。
- ブランドや種類を実データ以上に推定しない。宗教・文化建築は敬意ある建築・景観の文脈を使い、信仰や利用者をからかわない。福祉・医療・支援を題材にしない。
- `src/poem-catalog.js`の文章を編集するときはコード構造・引用符・10案という件数を壊さず、検証用fixtureと新旧対比を残す。

**別セッションの作業方法**：
1. GitHubのmain最新HEAD、PR #11、CI #39009039453、Pages #39009079478、`src/poem-catalog.js`を読み戻す。
2. **main最新HEADから** `work/poem-copy-editor-20261017` などの別ブランチを切る。既存の `work/poem-genre-library-20261017` は履歴として保持するだけで、並行作業で編集しない。
3. 文章文字列だけを修正し、言い換え10案の意味の独立性・ユーモア・品位・不確かな事実の断定の有無を審査する。
4. 完了後、**mainに対するPRをDraftで作成**して差分を報告。実装/公開を担当する別のセッションがレビューとマージ・公開受入を担当する。未承認の自動マージを避ける。

## 別セッションへの依頼文（コピー用）

「APP-003 POÈME / ESTATEの**文言制作だけ**担当してください。正本 `yama-books/mansion-poet` のmain HEAD・PR #11・CIを照合し、`docs/handoff/POEM01_COPY_HANDOFF_20261017.md` と `src/poem-catalog.js` を読んでください。63ジャンル×10案、計630個の着眼点を活かし、重複や不自然な表現を徹底的に推敲してください。先に品質監査を行い、自然・都市インフラ・飲食ブランド・郵便ポスト・学校・役所・宗教的建築を優先。コードの判定関数、UI、API、CI/Pagesは変更せず、文章差分とレビュー記録のみを新ブランチのDraft PRで返してください。主題の倫理・事実の制約はPOEM_SUBJECT_POLICY.mdに従ってください。」

## 未完了と次の一操作

- 未完了：**全630文言の人手品質評価**、追加ジャンルの厳密分類データ、OSM/OpenPOIの取得網羅性、PS-00の28ケース網羅検査、iPhone/Android実機受入。
- 次の1操作：**新しい文言制作セッションで本書の依頼文を実行**する。元セッションでは文章追加を止め、UI・取得・安全性の改善は別の計画で行う。

状態：**HANDOFF_READY / POEM-01のコードはmain公開済 / 文言品質改善を別セッションに切り出し**。
