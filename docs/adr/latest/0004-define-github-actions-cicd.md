# 0004 - GitHub Actions による CI/CD 方針を定義する

## Status

Proposed

## Context

このアプリは `Vite + React + TypeScript` のローカルファースト SPA で、MVP の初期公開先は GitHub Pages とする。ADR 0003 で、`main` ブランチに入った変更を GitHub Actions でテスト・ビルドし、成功した成果物だけを GitHub Pages に公開する方針を決めた。

公開前に、型チェック込みのビルド、テスト、依存関係の脆弱性、秘密情報や `.env` など公開してはいけない内容の混入を確認したい。将来的には AWS 移行も視野に入れるが、MVP では GitHub Pages 向けに軽量で分かりやすい CI/CD を優先する。

現時点の `package.json` には `npm test` と `npm run build` があり、`npm run build` は `tsc -b && vite build` によって型チェック込みのビルドを行う。まだ `.github/workflows` は存在しない。

## Options Considered

### 1. GitHub Actions で quality と deploy を 1 workflow にまとめる

- **メリット**: PR 時の検証と `main` push 時のデプロイを同じファイルで管理できる。MVP として見通しがよい。
- **デメリット**: 将来 AWS やプレビュー環境が増えると workflow が大きくなる。

### 2. CI と CD を別 workflow に分ける

- **メリット**: 役割分離が明確。将来の拡張に強い。
- **デメリット**: MVP ではファイルが増え、全体の流れが少し追いにくい。

### 3. 手動デプロイ

- **メリット**: 意図しない自動公開を避けやすい。
- **デメリット**: 公開手順が属人化し、テスト・ビルド済み成果物だけを公開する保証が弱い。

## Decision

MVP では `.github/workflows/pages.yml` の 1 ファイルに `quality` job と `deploy` job を定義する。

PR では `quality` のみ実行する。`quality` では以下を行う。

- Node.js 22 LTS を使う。
- `npm ci` を実行する。
- 公開禁止ファイル/秘密情報チェックを実行する。
- `npm audit --audit-level=high` を実行する。
- `npm test` を実行する。
- `npm run build` を実行する。

`main` ブランチへの push では、`quality` 成功後に `deploy` を実行し、GitHub Pages へ公開する。デプロイには公式 Pages Actions の `actions/configure-pages`、`actions/upload-pages-artifact`、`actions/deploy-pages` を使う。`gh-pages` ブランチへ成果物をコミットする方式は採用しない。

`npm audit` は `high` 以上で失敗とし、`moderate` 以下は MVP では許容する。

公開禁止ファイル/秘密情報チェックは、MVP では軽量な自作チェックで始める。`.env`、`.env.*`、秘密鍵ファイル、AWS キー、GitHub トークン、`SECRET`、`PASSWORD`、`TOKEN=` などを検出したら失敗にする。ただし `.env.example` や説明用ドキュメントは許容する。必要になれば将来 `gitleaks` など専用ツールへ移行する。

ブランチ保護や失敗通知の詳細運用は MVP では決めない。GitHub Actions の失敗表示を確認する運用に留める。

## Consequences

PR 時にテスト、型チェック込みビルド、依存関係の重大脆弱性、秘密情報混入を確認できる。`main` に入った変更だけが GitHub Pages へ自動公開されるため、公開作業の手間とミスを減らせる。

一方で、軽量な自作秘密情報チェックは専用ツールほど網羅的ではない。誤検知や検知漏れが出た場合はルール調整または専用ツール導入が必要になる。

`moderate` 以下の脆弱性は即時ブロックしないため、定期的な見直しは必要になる。
