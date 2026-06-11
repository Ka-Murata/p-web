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
- 症状: iPhone 16 で実戦ログフォームを開くと、開始時刻と終了時刻の入力欄が背景ブロックからはみ出してレイアウトが崩れる。前回の縦積み対応後も解消しなかった。
- 原因: 開始時刻/終了時刻の `type="time"` 入力を当初モバイル幅でも `grid-cols-2` の 2 カラムにしていたことに加え、共通 `Input` と `Field` に `min-width: 0` / `max-width: 100%` 相当の制約がなく、iOS Safari のネイティブ時刻入力の最小幅が親幅を超える可能性があった。
- 対応: 開始時刻/終了時刻のコンテナは `grid gap-3 sm:grid-cols-2` のまま維持し、共通 `Input` を `block min-w-0 w-full max-w-full` に変更した。`Field` のラッパーにも `min-w-0` を追加した。さらに `type="time"` 入力へ `appearance-none overflow-hidden text-left` を付け、WebKit 向けに `input[type="time"]` と `::-webkit-date-and-time-value` の幅制約を追加した。
- 確認: `npm test` 成功、`npm run build` 成功、`npm run check:public-safety` 成功。実機表示は未確認のため、iPhone 16 Safari で `/logs/new` と編集画面の開始時刻/終了時刻が背景ブロック内に収まることを確認する。
- 関連: `src/App.tsx`, `src/App.css`, `src/components/ui/input.tsx`

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
