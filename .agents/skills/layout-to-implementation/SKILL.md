---
name: layout-to-implementation
description: "承認済みの docs/screen/layout.pen と backlog.md の Design Contract に沿って React/UI や関連ロジックを実装するスキル。Use when: ADRまたはfix-logから layout 承認済みのタスクを実装する、layout.pen を正として画面を作る、実装後に layout と一致しているか確認しながら進めたい。"
---

# layout-to-implementation

承認済みの `layout.pen` と `backlog.md` を実装契約として扱い、実装が勝手に画面仕様を変えないようにする。

## 前提

- 対象タスクが `backlog.md` に存在する。
- タスクに ADR または fix-log と、対応する `docs/screen/layout.pen` の参照がある。
- UI に見える変更は承認済み layout を正とする。

## ワークフロー

6 フェーズで進める。

### Phase 1: Read Contract

1. 対象 backlog タスクを読む。
2. `Design Contract` を確認する。
3. 関連する ADR または fix-log を読む。
4. Pencil ツールで `docs/screen/layout.pen` の対象画面・状態を確認する。
5. 既存実装の対象ファイルとテストを確認する。

**確認すること**:

- 何を作るか。
- 何を作らないか。
- layout 上の主要要素、順序、状態、導線。
- データ・保存・表示ロジックの変更範囲。

### Phase 2: Implementation Plan

実装前に短く方針をまとめる。

- 変更するファイル
- layout から実装へ対応させる要素
- テスト方針
- layout と異なる可能性がある点

大きな仕様判断が必要なら、実装せず ADR または fix-log に戻す。

### Phase 3: Implement

1. 既存の設計・コンポーネント・スタイルに合わせる。
2. layout にある主要な情報優先度と導線を保つ。
3. layout にない主要 UI を追加しない。
4. 必要な型、repository、保存、表示、テストを最小範囲で更新する。

React 実装では `vercel-react-best-practices` を併用する。

### Phase 4: Verify

変更に応じて検証する。

- React/UI: `npm test`、必要なら `npm run build`。
- 公開・設定: `npm run check:public-safety`、必要なら `npm audit --audit-level=high`。
- データ変更: repository/domain テスト、既存データ読み込み確認。
- UI 変更: 実装画面のスクリーンショットまたは手動確認。

検証できなかった項目は理由を記録する。

### Phase 5: Design Contract Check

実装後に layout と比較する。

チェック項目:

- layout にある主要要素が実装にある。
- 実装にある主要要素が layout の範囲を超えていない。
- 画面状態、導線、情報優先度が一致している。
- モバイル表示で順序や密度が崩れていない。
- 文言差分がある場合、意図が説明できる。

乖離が見つかった場合:

- 実装が誤りなら実装を直す。
- layout が古いなら `adr-to-layout-backlog` または `fix-to-layout-backlog` に戻す。
- 設計判断が変わるなら `grill-to-adr` に戻す。

### Phase 6: Close Task

1. backlog の受け入れ条件を満たしたことを確認する。
2. 必要なら対象タスクを完了にする。
3. fix-log 由来の修正なら `docs/fix-log.md` の状態・対応・確認を更新する。
4. 最終回答で、変更内容、検証結果、layout 乖離の有無を共有する。

## 完了条件

- 実装が承認済み `layout.pen` と backlog の `Design Contract` に一致している。
- 必要なテスト・ビルド・手動確認が実行されている、または未実行理由が明記されている。
- 乖離がある場合は、修正済みまたは上流ドキュメントへ戻されている。

## 併用するスキル

- 新機能・設計判断の上流には `grill-to-adr` を使う。
- ADR 由来の layout/backlog 化には `adr-to-layout-backlog` を使う。
- 不具合由来の layout/backlog 化には `fix-to-layout-backlog` を使う。
- 実装後の独立監査には `design-drift-audit` を使う。
