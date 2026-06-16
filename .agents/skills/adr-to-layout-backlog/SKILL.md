---
name: adr-to-layout-backlog
description: "ADR の決定内容を docs/screen/layout.pen に反映し、ユーザー承認後に Design Contract 付きで backlog.md へ落とし込むスキル。Use when: ADR作成後に画面レイアウトへ反映したい、Pencil更新後に承認を取りたい、承認済みlayoutから実装backlogを作りたい、ADR→layout→backlogの流れを標準化したい。"
---

# adr-to-layout-backlog

ADR で合意した決定を `docs/screen/layout.pen` に反映し、ユーザー確認を経て、実装可能な backlog へ分解する。

## 使うタイミング

- ADR が作成済み、または更新済みで、その内容を画面レイアウトへ反映したいとき。
- Pencil の `layout.pen` 更新をユーザーに確認してもらい、承認後に `backlog.md` へタスク化したいとき。
- 実装前に ADR、画面案、backlog の順序をそろえたいとき。

## ワークフロー

4 フェーズで進める。

### Phase 1: Read Decision

1. 対象 ADR を読む。ユーザーが ADR を指定していない場合は、直近の `docs/adr/latest/` を確認して候補を示す。
2. ADR から以下を抽出する。
   - 決定内容
   - 対象ユーザー体験
   - 影響する画面
   - データ・状態・入力・表示の変更点
   - MVP に含める範囲と後回しにする範囲
   - 実装で守る制約
3. `docs/screen/layout.pen` の既存構成を Pencil ツールで確認する。

**ルール**:

- ADR にない仕様を勝手に増やさない。
- 不足情報があっても、既存画面や backlog から推測できる場合は小さく仮定して進める。
- 大きな仕様判断が必要な場合だけ、ユーザーに短く確認する。

### Phase 2: Update Pencil Layout

1. Pencil の `layout.pen` を更新する。
2. 既存の画面構成、命名、色、余白、密度に合わせる。
3. ADR の決定がユーザーに見える箇所を最低 1 つ以上更新する。
4. 入力が増える場合は、保存導線・モバイル表示・既存項目との優先順位を確認する。
5. 主要画面・状態・コンポーネントには backlog から参照できる安定した名前を付ける。
6. 更新後に Pencil のレイアウト検査を行い、必要ならスクリーンショットで確認する。

**Pencil 更新のチェック**:

- 主要要素がはみ出していない。
- 既存テキストや操作要素と重なっていない。
- モバイル幅で読める密度になっている。
- ADR の範囲外の機能に見えない。
- 後続タスクが参照できる画面・状態名が分かる。

### Phase 3: Approval Gate

Pencil 更新後、必ずユーザーに承認を求める。

提示する内容:

- 反映した画面
- 追加・変更した要素
- ADR から意図的に外したこと、または後回しにしたこと
- レイアウト検査やスクリーンショット確認の結果

承認前に `backlog.md` を更新しない。

ユーザーが修正を求めたら Phase 2 に戻る。ユーザーが「はい」「承認」「これでいい」「進めて」などと返したら Phase 4 に進む。

### Phase 4: Create Backlog

1. `backlog.md` を読む。
2. 既存のマイルストーンと PWT 番号を確認する。
3. 承認済み layout と ADR をもとに、実装タスクを追加する。
4. タスクは実装順に分ける。
5. 各タスクに `Design Contract` を含める。

推奨タスク分割:

- ドメイン型・保存形式
- repository / migration / seed などデータ層
- フォーム入力・編集
- 一覧・詳細・分析など表示面
- テスト
- 必要なら手動確認シナリオ

**backlog 記述ルール**:

- 既存の `backlog.md` の文体に合わせる。
- 各タスクに `ユーザーストーリー`、`Design Contract`、`実装メモ`、`受け入れ条件` を書く。
- `Design Contract` には ADR、layout 参照、本来の画面状態、作らない範囲を書く。
- 新規タスクのチェックボックスは未完了 `[ ]` にする。
- 既存の完了済みタスクを未完了へ戻さない。
- ADR で後回しにした範囲は、実装タスクに混ぜず候補やメモとして扱う。

推奨形式:

```markdown
- [ ] PWT-XXXX: {タイトル}
  - ユーザーストーリー: ...
  - Design Contract:
    - ADR: docs/adr/latest/NNNN-{slug}.md
    - Layout: docs/screen/layout.pen#{画面または状態}
    - 本来の状態: ...
    - Out of Scope: ...
  - 実装メモ: ...
  - 受け入れ条件:
    - layout.pen の主要構造と一致している。
    - ADR の範囲外の UI を追加していない。
    - 関連テストまたは手動確認が通っている。
```

## 完了条件

- `layout.pen` に ADR の決定が反映されている。
- Pencil のレイアウト検査で問題がない、または既知の問題として明記されている。
- ユーザーがレイアウトを承認している。
- `backlog.md` に実装可能な粒度のタスクが追加されている。
- 追加したタスクが ADR と承認済み layout に対応している。

## 併用するスキル

- ADR を作る前段では `grill-to-adr` を使う。
- React 実装に進むターンでは `layout-to-implementation` と `vercel-react-best-practices` を使う。
- 実装後の乖離確認では `design-drift-audit` を使う。
