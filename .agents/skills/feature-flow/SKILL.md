---
name: feature-flow
description: "新機能・設計判断を grill-to-adr から adr-to-layout-backlog、layout-to-implementation、design-drift-audit まで順に進める上位オーケストレーションスキル。Use when: 新機能を一連の流れで進めたい、ADR→layout→backlog→実装→監査をまとめて管理したい、途中再開しながら承認ゲートを守りたい。"
---

# feature-flow

新機能・設計判断を、ADR、layout、backlog、実装、監査まで一貫して進める。個別スキルの責務は奪わず、順序、停止条件、成果物の受け渡しを管理する。

## 基本方針

- 実作業は個別スキルに委ねる。
- このスキルは現在地、次に使うスキル、承認ゲートを管理する。
- ユーザー承認が必要な地点では必ず止まる。
- `layout.pen` を UI 実装の正とする。
- 途中再開時は、既存成果物を読んで現在地から続ける。

## ワークフロー

4 フェーズで進める。

### Phase 0: Resume Check

最初に現在地を確認する。

確認対象:

- 対象テーマまたは機能名
- 関連 ADR の有無
- `docs/screen/layout.pen` への反映有無
- layout のユーザー承認有無
- `backlog.md` のタスク有無
- 実装済みかどうか
- `design-drift-audit` 済みかどうか

判断:

- ADR がなければ Phase 1 へ進む。
- ADR はあるが layout/backlog がなければ Phase 2 へ進む。
- backlog はあるが未実装なら Phase 3 へ進む。
- 実装済みで未監査なら Phase 4 へ進む。
- 監査済みなら残課題だけ確認する。

### Phase 1: Decision

`grill-to-adr` を使う。

目的:

- 何を作るかを決める。
- 選択肢、制約、影響範囲、MVP、後回し範囲を明確にする。
- 合意済みの判断を ADR として記録する。

成果物:

- `docs/adr/latest/NNNN-{slug}.md`

停止条件:

- ADR 作成前に「この内容で ADR 化してよいか？」を確認する。
- 既存 ADR 更新が必要なら、更新か上書きかを確認する。

次:

- ADR 作成後、Phase 2 へ進む。

### Phase 2: Layout And Backlog

`adr-to-layout-backlog` を使う。

目的:

- ADR の決定を `docs/screen/layout.pen` に反映する。
- layout をユーザーに確認してもらう。
- 承認済み layout を `Design Contract` 付きで `backlog.md` に落とす。

成果物:

- 更新済み `docs/screen/layout.pen`
- `backlog.md` の実装タスク

停止条件:

- layout 更新後、承認前に必ず止まる。
- 承認前に `backlog.md` を更新しない。
- backlog 作成後、実装に進んでよいか確認する。

次:

- 実装承認後、Phase 3 へ進む。

### Phase 3: Implementation

`layout-to-implementation` を使う。

目的:

- 承認済み layout と backlog の `Design Contract` を正として実装する。
- layout にない主要 UI を勝手に追加しない。
- 必要なテスト、ビルド、手動確認を行う。

成果物:

- 実装変更
- テストまたは確認結果
- 必要なら更新済み backlog / fix-log

停止条件:

- 実装中に layout と違う仕様判断が必要になったら止まる。
- 設計判断の変更なら `grill-to-adr` へ戻る。
- layout が古いなら `adr-to-layout-backlog` へ戻る。

次:

- 実装後、Phase 4 へ進む。

### Phase 4: Audit

`design-drift-audit` を使う。

目的:

- `layout.pen` と実装 UI の乖離を確認する。
- 乖離があれば、実装修正、layout 更新、ADR 更新、backlog 化のどれに戻すか決める。

成果物:

- Design Drift Audit 結果
- 必要なら追加修正または上流への差し戻し

停止条件:

- 乖離がある場合、修正するか、layout/ADR を更新するかをユーザーに確認する。
- 乖離なし、または既知の未対応として明記できたら完了する。

## ルーティング

- 新しい設計判断が必要: `grill-to-adr`
- ADR を layout/backlog に反映: `adr-to-layout-backlog`
- 承認済み layout/backlog を実装: `layout-to-implementation`
- 実装後の乖離確認: `design-drift-audit`
- 不具合や修正要求として扱うべき内容に変わった: `repair-flow`

## 完了条件

- ADR、layout、backlog、実装、監査の現在地が明確である。
- 必要な承認ゲートで止まっている、または承認済みで次へ進んでいる。
- 実装済みの場合、`layout.pen` との乖離がない、または戻し先が明確である。
