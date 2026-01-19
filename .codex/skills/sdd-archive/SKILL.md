# 仕様駆動開発：アーカイブ

## Description
完了した仕様（spec）をアーカイブし、開発サイクルをクローズする。
Trigger examples: "開発完了", "タスク完了", "クローズ", "archive spec", "close feature"

## ステップ1：対象specの確認
1. `.sdd/target-spec.txt` からspec名を取得する。
2. `.sdd/specs/[spec名]/tasks.md` を確認し、全タスクが完了 `[x]` しているか確認する。
   - 未完了タスクがある場合はユーザーに警告し、強制アーカイブするか確認を求める。
   - `highway-summary.md` がある場合（Highwayモード）は、タスク完了チェックはスキップ可能。

## ステップ2：アーカイブ実行
1. ディレクトリ `.sdd/specs/archives/` が存在することを確認する（なければ作成）。
2. 現在の日付（YYYYMMDD形式）を取得する。
3. `.sdd/specs/[spec名]/` を `.sdd/specs/archives/YYYYMMDD_[spec名]/` に移動する。
4. `.sdd/target-spec.txt` の内容をクリア（空にする）。

## ステップ3：完了報告
「spec '[spec名]' をアーカイブしました。
保存先：.sdd/specs/archives/YYYYMMDD_[spec名]/

次の機能を開発する場合：
1. `.sdd/description.md` を更新
2. `/sdd-requirements` を実行」
