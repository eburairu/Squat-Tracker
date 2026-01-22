# sdd-tasks

## Description
設計書に基づき実装タスクを分解し、タスクリスト（tasks.md）を作成する。
Trigger examples: "タスク分解", "タスクリスト作成", "実装計画", "break down tasks", "create tasks"

## ステップ1：コンテキスト読み込み
1. `.sdd/target-spec.txt` から対象specを確認する。
2. `.sdd/specs/[spec名]/design.md` (および `requirements.md`) を読み込む。

## ステップ2：タスクリスト作成
`.sdd/specs/[spec名]/tasks.md` を作成する。
**方針**: 各タスクは「テスト→実装→確認」の1サイクルで完結する粒度にする。

```markdown
# 実装タスクリスト

## フェーズ1: 準備・定義
- [ ] 1.1 [タスク名]
  - 詳細: ...

## フェーズ2: 実装・ロジック
- [ ] 2.1 [タスク名]
  - 詳細: ...

## フェーズ3: UI・統合
- [ ] 3.1 [タスク名]
```

## 完了報告
「タスクリストを作成しました。
`/sdd-implement` を実行して、上から順に実装を開始してください。」
