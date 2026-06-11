# Fix Log - 不具合と修正履歴

このファイルは、運用中に再発しうる不具合、CI/CD 失敗、公開設定ミス、データ消失リスク、調査事項を記録する。小さな typo や軽微な見た目調整は記録しない。

## 記録フォーマット

```markdown
## YYYY-MM-DD - タイトル

- 種別: ...
- 症状: ...
- 原因: ...
- 対応: ...
- 確認: ...
- 関連: ...
```

## 2026-06-11 - iPhone 16 で開始時刻/終了時刻入力のレイアウトが崩れる

- 種別: 不具合 / モバイル表示
- 症状: iPhone 16 で実戦ログフォームを開くと、開始時刻と終了時刻の入力欄レイアウトが崩れる。
- 原因: 開始時刻/終了時刻の `type="time"` 入力をモバイル幅でも `grid-cols-2` の 2 カラムにしていた。iOS Safari の時刻入力はネイティブUIの最小幅が広く、狭いカラム内で崩れる可能性が高い。
- 対応: 開始時刻/終了時刻のコンテナを `grid gap-3 sm:grid-cols-2` に変更し、モバイル幅では縦積み、`sm` 以上では 2 カラムにした。
- 確認: `npm test` 成功、`npm run build` 成功。実機表示は未確認のため、iPhone 16 Safari で `/logs/new` と編集画面の開始時刻/終了時刻を確認する。
- 関連: `src/App.tsx`

## 2026-06-11 - master push で Pages CI/CD が起動しない

- 種別: CI/CD
- 症状: `master` ブランチに push しても `Pages CI/CD` workflow が起動しなかった。
- 原因: workflow の push trigger と deploy 条件が `main` ブランチ固定になっていた。実際の作業ブランチは `master` だった。
- 対応: `.github/workflows/pages.yml` の push trigger を `master` に変更し、deploy job の条件を `refs/heads/master` に変更した。ADR、バックログ、手動確認手順の表記も `master` に揃えた。
- 確認: `git branch --show-current` で `master` を確認し、`npm run check:public-safety` が成功した。
- 関連: `.github/workflows/pages.yml`, `docs/adr/latest/0003-publish-app-with-github-pages.md`, `docs/adr/latest/0004-define-github-actions-cicd.md`, `backlog.md`, `docs/test-plan.md`

## 2026-06-11 - Get Pages site failed で GitHub Pages deploy が失敗する

- 種別: 公開設定ミス / CI/CD
- 症状: GitHub Actions の Pages deploy で `Get Pages site failed` と `Not Found` が出て失敗した。
- 原因: GitHub リポジトリ側で Pages が未有効化、または `Settings > Pages > Build and deployment > Source` が `GitHub Actions` に設定されていなかった可能性が高い。
- 対応: 初回だけ GitHub のリポジトリ設定で Pages を有効化し、Source を `GitHub Actions` にする運用とした。`actions/configure-pages` の `enablement` は通常の `GITHUB_TOKEN` では権限不足になるため採用しない。
- 確認: GitHub UI で Pages の Source を `GitHub Actions` に設定後、`master` への push または Actions の rerun で deploy を再実行する。
- 関連: `.github/workflows/pages.yml`, `docs/test-plan.md`, `docs/adr/latest/0004-define-github-actions-cicd.md`
