---
name: design-drift-audit
description: "docs/screen/layout.pen と実装済み UI の乖離を検査し、修正・layout更新・ADR更新・backlog化のどれに戻すべきか判定するスキル。Use when: 実装後に layout.pen と画面が一致しているか確認したい、layout が正として守られているか監査したい、UI の Design Contract 違反や ADR 違反を見つけたい。"
---

# design-drift-audit

`layout.pen` を画面仕様の正として、実装 UI との乖離を検査する。

## 使うタイミング

- `layout-to-implementation` の完了前後。
- リリース前の UI 監査。
- layout と実装がズレている疑いがあるとき。
- backlog タスクの `Design Contract` を満たしているか確認したいとき。

## ワークフロー

5 フェーズで進める。

### Phase 1: Scope

1. 対象画面、状態、backlog タスク、ADR または fix-log を特定する。
2. `docs/screen/layout.pen` の対象ノードを Pencil ツールで確認する。
3. 対象実装ファイル、テスト、既存スクリーンショットがあれば確認する。

対象が曖昧な場合は、最小の画面単位に絞る。

### Phase 2: Capture Implementation

1. 必要ならアプリを起動する。
2. 対象画面を確認する。
3. 可能ならスクリーンショットを取得する。
4. 画面状態が必要なら、データ投入や操作で再現する。

確認できない状態がある場合は、監査結果に未確認として残す。

### Phase 3: Compare

以下を比較する。

- 主要要素の有無
- 情報の順序と優先度
- 操作導線
- 空状態、エラー状態、編集中、保存後などの状態
- モバイルでの表示密度と順序
- 文言、ラベル、単位
- layout にない主要 UI の追加

分類:

- `実装漏れ`: layout にあるが実装にない。
- `実装過剰`: 実装にあるが layout にない。
- `情報設計ズレ`: 順序、優先度、導線が違う。
- `状態不足`: 必要な画面状態が実装されていない。
- `文言差分`: 意味が変わるラベル差分。
- `layout陳腐化`: 実装は妥当だが layout が古い可能性が高い。
- `ADR違反`: 既存の意思決定と矛盾する。

### Phase 4: Decide Route

乖離ごとに戻し先を決める。

- 実装が間違い: `layout-to-implementation` で修正する。
- UI影響ありの不具合: `fix-log-repair-flow` で記録し、必要なら `fix-to-layout-backlog` へ進む。
- layout が古い: `adr-to-layout-backlog` または `fix-to-layout-backlog` で layout を更新し、承認を取る。
- 設計判断が変わる: `grill-to-adr` で ADR を作成または更新する。
- 軽微な誤字・明らかなスタイル崩れ: 直接修正してもよいが、検証結果に残す。

### Phase 5: Report

監査結果を簡潔に提示する。

推奨形式:

```markdown
## Design Drift Audit

- 対象: ...
- 参照Layout: docs/screen/layout.pen#...
- 関連: ADR / fix-log / backlog

### Findings

- 重大度: High / Medium / Low
- 分類: 実装漏れ / 実装過剰 / 情報設計ズレ / 状態不足 / 文言差分 / layout陳腐化 / ADR違反
- 内容: ...
- 推奨ルート: ...

### 確認

- 実行したコマンド:
- 確認した画面:
- 未確認:
```

## 完了条件

- layout と実装の一致・不一致が説明されている。
- 乖離がある場合、戻し先が明確である。
- 検証できなかった画面状態が明記されている。

## 併用するスキル

- 実装修正には `layout-to-implementation` を使う。
- UI 影響ありの不具合化には `fix-log-repair-flow` と `fix-to-layout-backlog` を使う。
- 設計判断の変更には `grill-to-adr` を使う。
