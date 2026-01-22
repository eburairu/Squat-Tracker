# sdd-implement

## Description
タスクリスト (`tasks.md`) に従い、TDDサイクルを回して実装を進める標準モード。
Trigger examples: "実装開始", "タスク消化", "TDD実行", "implement feature", "start coding"

## ステップ1：タスク確認
1. `.sdd/target-spec.txt` から対象specを確認する。
2. `.sdd/specs/[spec名]/tasks.md` を読み込み、**最初の未完了タスク** (`- [ ]`) を特定する。
3. 関連する設計情報 (`design.md`) を読み込む。

## ステップ2：TDDサイクル実行
特定したタスクに対して以下を実行する（一度に1タスクずつ）：
1. **Red**: テストコードを作成・修正し、失敗を確認する。
2. **Green**: 最小限の実装を行い、テストをパスさせる。
3. **Refactor**: コードを整理する。
4. **Mark**: `tasks.md` の当該タスクを `[x]` に更新する。

## ステップ3：継続判断
- タスク完了後、まだ未完了タスクがあれば「次のタスクに進みますか？」と確認するか、自動的に継続する。
- 全タスク完了時は `/sdd-archive` を案内する。
