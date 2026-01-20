# 仕様駆動開発：実装

## Description
タスクリストに従ってテスト駆動開発（TDD）で実装を行い、機能を完成させる。
Trigger examples: "実装開始", "コード書いて", "implement feature", "start coding"

## 前提確認とspec特定
1. `.sdd/target-spec.txt` からspec名を取得し、ディレクトリの存在を確認する。
2. ステアリング情報（product/tech/structure）を読み込む。
3. spec文書一式（requirements.md, design.md, tasks.md）を読み込む。

## ステップ1：実装実行ループ
`tasks.md` の未完了タスクを上から順に実行する：

1. **Test (RED)**: 対象タスクのテストコードを作成/修正し、失敗することを確認する。
2. **Implement (GREEN)**: テストを通すための最小限の実装を行う。
3. **Refactor**: コードを整理する。
4. **Update**: `tasks.md` の当該タスクを `[x]` に更新する。

※タスクはスキップせず、必ず順番に消化すること。

## ステップ2：完了後の処理
すべてのタスクが完了したら：
1. 全テスト (`npm test`) が通過することを確認する。
2. `/sdd-archive` を実行して仕様をクローズするよう案内する。
3. 未解決の課題がある場合は、その理由と対処を記録する。
