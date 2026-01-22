# sdd-archive

## Description
完了した仕様（spec）をアーカイブし、開発サイクルをクローズする。
Trigger examples: "開発完了", "タスク完了", "仕様クローズ", "archive spec", "finish feature"

## ステップ1：完了確認
1. `.sdd/target-spec.txt` から対象spec名を取得する。
2. タスク状況を確認する：
   - 通常モード: `tasks.md` の全項目が `[x]` であること。
   - Highwayモード: `highway-summary.md` が存在すること。

## ステップ2：アーカイブ処理
1. アーカイブ先ディレクトリ: `.sdd/specs/archives/<YYYYMMDD>_<spec名>/`
2. 対象ディレクトリ `.sdd/specs/[spec名]/` を上記へ移動（リネーム）する。
3. `.sdd/target-spec.txt` の内容を消去する。

## 完了報告
「機能開発を完了し、仕様をアーカイブしました。
次の開発を行う場合は、`.sdd/description.md` を更新して `/sdd-requirements` を実行してください。」
