---
name: repair-flow
description: "不具合・修正要求を fix-log-repair-flow から fix-to-layout-backlog、layout-to-implementation、design-drift-audit まで順に進める上位オーケストレーションスキル。Use when: 不具合修正を一連の流れで進めたい、Repair Grill→fix-log→layout→backlog→実装→監査をまとめて管理したい、UI影響あり修正を追加機能と同じプロセスに乗せたい。"
---

# repair-flow

不具合・修正要求を、fix-log、修正方針、layout、backlog、実装、監査まで一貫して進める。個別スキルの責務は奪わず、順序、分岐、停止条件、成果物の受け渡しを管理する。

## 基本方針

- 修正要求の入口は `docs/fix-log.md` とする。
- 修正方針は `Repair Grill` で決める。
- UI に見える修正は、原則 `layout.pen` 更新、承認、backlog 化を通す。
- UI 影響なしの修正は、fix-log に記録したうえで直接実装してよい。
- 途中再開時は、既存成果物を読んで現在地から続ける。

## ワークフロー

5 フェーズで進める。

### Phase 0: Resume Check

最初に現在地を確認する。

確認対象:

- 対象の症状または修正要求
- `docs/fix-log.md` の対象項目の有無
- 状態: 調査中 / 方針決定 / Layout承認待ち / Backlog化済み / 修正中 / 修正済み / 保留
- UI影響: あり / なし / 未判定
- `docs/screen/layout.pen` への反映有無
- layout のユーザー承認有無
- `backlog.md` の修正タスク有無
- 実装済みかどうか
- `design-drift-audit` 済みかどうか

判断:

- fix-log がなければ Phase 1 へ進む。
- fix-log はあるが方針未決定なら Phase 1 へ進む。
- UI影響ありで layout/backlog がなければ Phase 2A へ進む。
- UI影響なしで未実装なら Phase 3B へ進む。
- backlog はあるが未実装なら Phase 3A へ進む。
- 実装済みで未監査なら Phase 4 へ進む。
- 監査済みなら Phase 5 へ進む。

### Phase 1: Triage And Repair Grill

`fix-log-repair-flow` を使う。

目的:

- 症状、再現条件、影響範囲を確認する。
- UI 影響の有無を分類する。
- Repair Grill で本来の状態、修正案、今回直す範囲を決める。
- `docs/fix-log.md` に修正方針を記録する。

成果物:

- `docs/fix-log.md` の対象項目
- `状態: 方針決定`
- `UI影響: あり / なし`
- 本来の状態、決定、理由、後回し範囲

停止条件:

- 修正方針決定後、「この方針で進めるか？」を確認する。
- ADR に昇格すべき設計判断が出たら `feature-flow` または `grill-to-adr` へ戻す。

次:

- UI 影響ありなら Phase 2A へ進む。
- UI 影響なしなら Phase 3B へ進む。

### Phase 2A: UI Layout And Backlog

`fix-to-layout-backlog` を使う。

目的:

- fix-log の修正方針から、正しい画面状態を `layout.pen` に反映する。
- layout をユーザーに確認してもらう。
- 承認済み layout を `Design Contract` 付きで `backlog.md` に落とす。

成果物:

- 更新済み `docs/screen/layout.pen`
- `backlog.md` の修正タスク
- `docs/fix-log.md` の `対応Layout`、`対応Backlog`

停止条件:

- layout 更新後、承認前に必ず止まる。
- 承認前に `backlog.md` を更新しない。
- backlog 作成後、実装に進んでよいか確認する。

次:

- 実装承認後、Phase 3A へ進む。

### Phase 3A: Layout-Backed Implementation

`layout-to-implementation` を使う。

目的:

- 承認済み layout と backlog の `Design Contract` を正として修正実装する。
- 修正方針にない UI を追加しない。
- 関連テスト、ビルド、手動確認を行う。

停止条件:

- 実装中に layout と違う仕様判断が必要になったら止まる。
- 設計判断の変更なら `grill-to-adr` へ戻る。
- layout が古いなら `fix-to-layout-backlog` へ戻る。

次:

- 実装後、Phase 4 へ進む。

### Phase 3B: Direct Repair

`fix-log-repair-flow` を使って直接修正する。

目的:

- UI 影響なしの不具合を最小変更で直す。
- 必要なテスト、ビルド、設定確認を行う。
- fix-log に対応と確認を記録する。

対象例:

- CI/CD 失敗
- 公開設定ミス
- 保存ロジックのバグ
- 型エラー
- 依存関係や設定の問題

次:

- UI 監査が不要なら Phase 5 へ進む。
- UI への副作用が疑われるなら Phase 4 へ進む。

### Phase 4: Audit

`design-drift-audit` を使う。

目的:

- UI 影響あり修正が `layout.pen` と一致しているか確認する。
- 修正によって既存画面が layout からズレていないか確認する。
- 乖離があれば、修正、layout 更新、ADR 更新、backlog 化のどれに戻すか決める。

停止条件:

- 乖離がある場合、修正するか、layout/fix-log/ADR を更新するかをユーザーに確認する。
- 乖離なし、または既知の未対応として明記できたら Phase 5 へ進む。

### Phase 5: Close Fix Log

`fix-log-repair-flow` の Record を使う。

目的:

- `docs/fix-log.md` を確定状態にする。
- 原因、修正方針、対応、確認、再発防止、関連を記録する。

停止条件:

- 実行していない検証を実行済みと書かない。
- 未対応の問題を修正済みにしない。

## ルーティング

- 修正方針決定: `fix-log-repair-flow`
- UI影響ありの layout/backlog 化: `fix-to-layout-backlog`
- 承認済み修正タスクの実装: `layout-to-implementation`
- UI 乖離確認: `design-drift-audit`
- 設計判断が必要: `grill-to-adr` または `feature-flow`

## 完了条件

- fix-log、layout、backlog、実装、監査の現在地が明確である。
- UI 影響あり修正は layout 承認と backlog 化を通っている、または例外理由が明記されている。
- 必要な検証結果が記録されている。
- `docs/fix-log.md` が修正済み、Backlog化済み、保留のいずれかの正しい状態になっている。
