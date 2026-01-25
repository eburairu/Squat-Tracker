# sdd-design

## Description
要件に基づき実装方針や技術設計を固め、設計書（design.md）を作成する。
Trigger examples: "設計して", "設計書作成", "アーキテクチャ設計", "design system", "create design doc", "技術設計"

## 前提確認とspec特定
1. `.sdd/target-spec.txt` からspec名を取得し、`.sdd/specs/[spec名]/` の存在を確認する。
2. ステアリング情報（product.md, tech.md, structure.md）を読み込む。
3. 要件定義書（requirements.md）を読み込む。
   - 存在しない場合は `/sdd-requirements` を案内する。

## ステップ1：技術設計書の作成
`.sdd/specs/[spec名]/design.md` を以下の構成で作成する：

```markdown
# 技術設計書

## アーキテクチャ概要
[tech.mdの内容を踏まえた統合方針]

## 主要コンポーネント
### [コンポーネント名]
- 責務: [何を担当するか]
- 入出力: [Input/Output]
- 依存関係: [関連モジュール]

## データモデル
- [エンティティ名]: [フィールド定義]

## 処理フロー
1. [ステップ1]
2. [ステップ2]

## エラーハンドリング
- [エラーケース]: [対処法]

## 変更計画
- 変更ファイル: [パス]
- 新規ファイル: [パス]
```

## 完了確認
「設計書完了。内容を確認して、次は `/sdd-tasks` を実行して実装タスクを作成してください。」
