---
name: fix-to-layout-backlog
description: "UI に影響する不具合・修正要求を docs/fix-log.md の修正方針から docs/screen/layout.pen に反映し、ユーザー承認後に backlog.md へ実装タスク化するスキル。Use when: fix-log-repair-flow で UI影響あり と判断した、正しい画面状態を layout.pen に定義したい、不具合修正を追加機能と同じ layout 承認・backlog 化プロセスに乗せたい。"
---

# fix-to-layout-backlog

`docs/fix-log.md` の修正方針を、承認可能な画面レイアウトと実装可能な backlog に昇華する。

## 前提

- `fix-log-repair-flow` により、対象の不具合・修正要求が `docs/fix-log.md` に記録されている。
- 対象は UI に見える変更、画面導線、情報優先度、空状態、入力・表示の変更を含む。
- UI 影響がない修正はこのスキルを使わず、`fix-log-repair-flow` で直接修正する。

## ワークフロー

5 フェーズで進める。

### Phase 1: Read Fix Decision

1. 対象の `docs/fix-log.md` 項目を読む。
2. 以下を抽出する。
   - 症状
   - 原因または暫定原因
   - 本来の状態
   - 決定した修正方針
   - 影響する画面・状態・導線
   - 今回直す範囲と後回しにする範囲
3. 既存 ADR と矛盾しないか確認する。

**ルール**:

- fix-log にない仕様を勝手に増やさない。
- 既存 ADR の決定変更が必要なら、このスキルを止めて `grill-to-adr` を提案する。
- 本来の状態が曖昧な場合は、ユーザーに短く確認する。

### Phase 2: Update Pencil Layout

1. `docs/screen/layout.pen` の既存構成を Pencil ツールで確認する。
2. 不具合の「正しい画面状態」を layout に反映する。
3. 既存の命名、密度、色、余白、情報優先度に合わせる。
4. 必要なら画面状態名を明示する。
   - `state:empty`
   - `state:error`
   - `state:editing`
   - `state:after-save`
5. 更新後に `snapshot_layout` を実行し、必要ならスクリーンショットで確認する。

**Pencil 更新のチェック**:

- 修正後の正しい状態が画面上で分かる。
- 既存要素と重なっていない。
- モバイル幅でも読める。
- 修正範囲を超えた機能追加に見えない。

### Phase 3: Approval Gate

layout 更新後、必ずユーザーに承認を求める。

提示する内容:

- 対象の fix-log 項目
- 更新した画面・状態
- 正しい状態として定義した内容
- 後回しにした範囲
- レイアウト検査・スクリーンショット確認の結果

承認前に `backlog.md` を更新しない。

### Phase 4: Create Backlog

1. `backlog.md` を読む。
2. 既存のマイルストーンと PWT 番号を確認する。
3. 承認済み layout と fix-log の修正方針をもとにタスクを追加する。
4. タスクには `Design Contract` を含める。

推奨形式:

```markdown
- [ ] PWT-XXXX: {修正タイトル}
  - ユーザーストーリー: ...
  - Design Contract:
    - Fix-log: docs/fix-log.md#{対象項目}
    - Layout: docs/screen/layout.pen#{画面または状態}
    - 本来の状態: ...
  - 実装メモ: ...
  - 受け入れ条件:
    - layout.pen の正しい状態と主要構造が一致している。
    - 修正方針にない UI を追加していない。
    - 関連テストまたは手動確認が通っている。
```

### Phase 5: Update Fix Log

`docs/fix-log.md` の対象項目を更新する。

- `状態: Backlog化済み` にする。
- `対応Layout` に layout 参照を書く。
- `対応Backlog` に追加タスクを書く。
- 実装はまだ未対応であることを残す。

## 完了条件

- `layout.pen` に修正後の正しい画面状態が反映されている。
- ユーザーが layout を承認している。
- `backlog.md` に実装可能な修正タスクが追加されている。
- `docs/fix-log.md` が layout/backlog へリンクしている。

## 併用するスキル

- 不具合入口と修正方針決定には `fix-log-repair-flow` を使う。
- 実装に進むターンでは `layout-to-implementation` を使う。
- 実装後の乖離確認には `design-drift-audit` を使う。
