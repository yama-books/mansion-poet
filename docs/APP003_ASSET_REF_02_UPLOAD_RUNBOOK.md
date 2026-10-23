# APP-003｜ASSET-REF-02 PNG登録手順（参考デザイン専用）

対象：REF-0003〜0008の6画像＋比較一覧1画像、合計 **7 PNG**。既存REF-0001/0002の19点には触れない。既存PR #35はマージ済みで変更しない。

## 1. 入力

- 会話で生成した `APP003_ASSET_REF_02_six_sheets.zip` （ZIP SHA256: `eb89f50049d521e6b251a8ca42094cd011ee323184af9eb262e54fb43cd8109e`）
- リポジトリ `yama-books/mansion-poet` の新規ブランチ `docs/app003-asset-ref-02-share-20261022`
- `research/asset-ref-02-manifest-candidate.json`
- `scripts/reference-library/verify_asset_ref02_zip.py`

## 2. ローカルCodex／Pythonで7点を事前検査

```powershell
git fetch origin
git switch docs/app003-asset-ref-02-share-20261022
python scripts/reference-library/verify_asset_ref02_zip.py "C:\path\to\APP003_ASSET_REF_02_six_sheets.zip"
```

7/7 PASSでのみ展開する。失敗すれば停止し、PNGの変更・再圧縮・SHA値の書換えは禁止。

```powershell
python scripts/reference-library/verify_asset_ref02_zip.py "C:\path\to\APP003_ASSET_REF_02_six_sheets.zip" --extract
git status --short
git add assets/reference-images/REF-0003_concept_sheet.png assets/reference-images/REF-0004_concept_sheet.png assets/reference-images/REF-0005_concept_sheet.png assets/reference-images/REF-0006_concept_sheet.png assets/reference-images/REF-0007_concept_sheet.png assets/reference-images/REF-0008_concept_sheet.png assets/reference-images/ASSET-REF-02_six-sheet_overview.png
git diff --cached --name-status
git commit -m "assets(APP-003): add 7 ASSET-REF-02 reference-only PNGs"
git push origin docs/app003-asset-ref-02-share-20261022
```

**注意**：`git status`で別作業の差分を発見したら停止。強制push、PRマージ、main直push、Pages公開は不可。競合した場合は勝手に強制更新しない。

## 3. GitHub固定コミットからの読戻し

- push後のHEADを固定SHAとして記録。GitHubから7 PNGをそのSHAで個別取得し、サイズ・SHA256・幅高さを元ZIPと照合する。GitHub Contents APIの`sha`はGit blob SHA1でありSHA256とは異なるため、ハッシュ種別を混同しない
- 7/7一致後のみ台帳に `binaryStatus=uploaded_verified` 等の結果を別コミットで記録する（`publishedAllowed=false` と `rightsStatus=review_required` は維持）
- その後、画像相対リンクを `docs/APP003_ASSET_REF_02_GITHUB_SHARE.md` に追加し、PRはDraftのままレビューを依頼する
- CIとスマホでのGitHubプレビュー表示も確認し、未実施のA4印刷・iPhoneアプリ実機・本番ART承認とは区別する

## 4. 公開範囲

GitHubがPublicのため、ブランチやDraft PRでも参照画像は第三者に見える。これはユーザーの「GitHubにて共有」依頼に基づく**REF参考公開**に限る。架空広告の画像であり、実在POI・経路・販売条件の証拠ではない。ユーザー承認なしにARTへ昇格させず、既存アプリへ載せない。
