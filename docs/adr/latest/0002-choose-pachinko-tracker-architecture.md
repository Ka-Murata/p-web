# 0002 - パチンコ収支管理アプリのシステム構成

## Status

Proposed

## Context

このアプリは、自分用のパチンコ収支管理アプリとして、スマホで素早く実戦ログを入力し、端末内に保存し、日別・月別・ホール別・機種別の傾向を確認できることを重視する。

ADR 0001 で、ログインなし・端末内保存・スマホ優先・台ごとの実戦ログ主軸と決めた。現時点のリポジトリにはアプリ本体コードはなく、Node.js & TypeScript の devcontainer があるため、フロントエンド技術スタックから選定する。

## Options Considered

### 1. ローカルファースト SPA 構成

- **メリット**: バックエンド/API が不要で、無料運用しやすい。端末内保存・ログインなしという MVP 方針と合う。スマホ向け入力 UI を軽く作れる。
- **デメリット**: 複数端末同期やバックアップは初期対応できない。IndexedDB のデータ移行やエクスポート設計を後から考える必要がある。

### 2. バックエンド/API ありの構成

- **メリット**: 複数端末同期、バックアップ、ユーザー管理、データ集約を最初から扱いやすい。
- **デメリット**: 認証・サーバー・DB・運用コストが増え、個人用 MVP としては重い。

### 3. Next.js などのフルスタック構成

- **メリット**: 将来的にサーバー機能や API を持たせやすい。
- **デメリット**: 今回の MVP では SSR やサーバー機能の価値が小さく、構成が過剰になりやすい。

## Decision

MVP は `Vite + React + TypeScript` によるローカルファースト SPA として構築する。バックエンド/API は持たず、データは端末内の IndexedDB に保存する。

IndexedDB へのアクセスには `Dexie.js` を採用する。UI から IndexedDB を直接触らず、DB/repository 層に閉じ込める。

画面遷移には `React Router` を使い、`/logs`・`/analytics`・`/machines` のように URL を分ける。スマホでは下部タブナビ、PC では画面幅に応じたナビにできる構成にする。

UI は `Tailwind CSS + shadcn/ui + lucide-react` を採用する。フォーム・ダイアログ・タブ・ボタンなどは shadcn/ui をベースにし、アイコンは lucide-react を使う。見た目はスマホで入力しやすい管理アプリ寄りに整える。

集計ロジックは自前の TypeScript 関数として実装し、グラフ描画には `Recharts` を使う。

機種 seed データは `src/data/machines.ts` に静的 TypeScript データとして置く。初回起動時に Dexie の `machines` テーブルへ同期し、実戦ログは `machineId` を参照する。

状態管理は `React` 標準機能と `TanStack Query` を中心にする。Dexie への CRUD と一覧取得は repository 層に寄せ、UI は TanStack Query の query/mutation で読む。`Zustand` は MVP では導入しない。

テストは `Vitest + React Testing Library` を採用する。最低限、収支計算・集計ロジック・repository の基本 CRUD・主要フォームの入力/保存フローをテストする。E2E は MVP では必須にしない。

ディレクトリ構成は機能単位に寄せる。`src/features/logs`、`src/features/analytics`、`src/features/machines` を中心にし、共通 UI は `src/components/ui`、DB や repository は `src/lib/db` または `src/repositories`、収支計算のような純粋ロジックは `src/domain` に置く。

## Consequences

無料運用しやすく、個人用 MVP を素早く作れる。バックエンドを持たないため、認証・サーバー運用・API 設計の負担を避けられる。React/TypeScript 周辺の一般的な構成にすることで、フォーム、ルーティング、集計、グラフ、テストを堅実に組み立てられる。

初期リリースでは複数端末同期やクラウドバックアップはできない。端末変更やブラウザデータ削除に備えるため、将来的に CSV エクスポート/インポートやクラウド同期を追加する必要がある。

Dexie/TanStack Query/repository 層を使うため、非常に小さいアプリに比べると構成要素は増える。ただし、データ拡張や集計機能の成長を見越してこの複雑さを受け入れる。
