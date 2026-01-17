# 仕様駆動開発：実装

## 前提確認とspec特定
1. `.sdd/target-spec.txt` を読み込み、開発対象のspec名を取得
2. `.sdd/specs/[spec名]/` ディレクトリが存在するか確認
3. 存在しない場合：
   「spec '[spec名]' が見つかりません。

   利用可能なspec：
   [.sdd/specs/ 内のディレクトリ一覧（archivesを除く）]

   正しいspec名を `.sdd/target-spec.txt` に記載するか、
   新しい機能の場合は `.sdd/description.md` を更新して
   `/sdd-requirements` を実行してください」

## ステアリング情報の読み込み
以下を必ず読み込む：
1. `.sdd/steering/product.md`
2. `.sdd/steering/tech.md`
3. `.sdd/steering/structure.md`

## ステップ1：spec文書の読み込み
対象specディレクトリから以下を読み込み：
- requirements.md - 要件定義
- design.md - 設計書
- tasks.md - タスクリスト

## ステップ2：実装実行

tasks.md に列挙されたタスクを順番に実装します。各タスクについて以下を徹底してください：
1. テストを先に書く（RED）
2. 必要最小の実装でテストを通す（GREEN）
3. リファクタリングして可読性と保守性を高める（REFACTOR）

結果はコミットやメモで明確に残し、tasks.md のチェックボックスを完了済みに更新します。タスクのスキップや任意抽出は行わず、全タスクを完遂することを前提に進めます。

## ステップ3：実装後の処理
すべてのタスクが完了したら、以下を実施します：
- テスト・Lint がすべて成功しているか確認
- 必要なドキュメントやコメントを更新
- `/sdd-archive` を実行して仕様をクローズ
- 新たな仕様がある場合は `.sdd/description.md` を更新して `/sdd-requirements` から再スタート

未解決のタスクが残った場合は、その理由と次のアクションを tasks.md に記載し、必ず後続の実装で解消できるよう記録します。
