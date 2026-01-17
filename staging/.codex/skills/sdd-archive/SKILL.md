# 仕様駆動開発：アーカイブ

## ステップ1：対象specの確認
1. `.sdd/target-spec.txt` を読み込み、spec名を取得
2. `.sdd/specs/[spec名]/tasks.md` を読み込み
3. すべてのタスクが [x] になっているか確認

完了していない場合：
「未完了のタスクがあります。
すべてのタスクを完了してからアーカイブしてください。
または強制的にアーカイブする場合は、手動で
.sdd/specs/[spec名]/ を .sdd/specs/archives/ に移動してください」

## ステップ2：アーカイブ実行
すべて完了している場合：
1. `.sdd/specs/archives/` ディレクトリを作成（なければ）
2. 現在の日付を取得（YYYYMMDD形式）
3. `.sdd/specs/[spec名]/` を `.sdd/specs/archives/YYYYMMDD_[spec名]/` に移動
4. `.sdd/target-spec.txt` の内容をクリア（空にする）

## ステップ3：完了報告
「spec '[spec名]' をアーカイブしました。
保存先：.sdd/specs/archives/YYYYMMDD_[spec名]/

次の機能を開発する場合：
1. `.sdd/description.md` を更新
2. `/sdd-requirements` を実行」
