# sdd-design

## Description
要件に基づき実装方針や技術設計を固め、設計書（design.md）を作成する。
Trigger examples: "設計書作成", "技術設計", "アーキテクチャ設計", "design spec", "create design"

## ステップ1：コンテキスト読み込み
1. `.sdd/target-spec.txt` から対象specを確認する。
2. `.sdd/steering/` 配下の3ファイルを読み込む。
3. `.sdd/specs/[spec名]/requirements.md` を読み込む。

## ステップ2：設計書の作成
`.sdd/specs/[spec名]/design.md` を作成する：

```markdown
# 技術設計書

## 方針
[アーキテクチャ上の決定事項]

## モジュール設計
### [コンポーネント名]
- 責務: ...
- IF定義: ...

## データ設計
- [エンティティ/スキーマ定義]

## 処理フロー
1. [シーケンス/ロジックの流れ]

## 影響範囲
- [変更されるファイル/機能]
```

## 完了報告
「設計書を作成しました。内容を確認し、次は `/sdd-tasks` でタスク分解を行ってください。」
