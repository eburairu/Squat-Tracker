# sdd-steering

## Description
プロジェクトの全体像を把握し、SDDプロセスのための基本ドキュメント（Product, Tech, Structure）を生成・更新する。
Trigger examples: "プロジェクト分析", "ステアリング作成", "プロジェクト初期化", "init sdd", "analyze project", "プロジェクト把握"

## ステップ1：既存ステアリングの確認
以下のファイルが存在するか確認する (`list_files`):
- `.sdd/steering/product.md`
- `.sdd/steering/tech.md`
- `.sdd/steering/structure.md`

※ 既に存在する場合、ユーザーに「既存のステアリング文書を更新しますか？」と確認する。

## ステップ2：プロジェクト情報の収集
以下の情報を収集する (`read_file`, `list_files`):
1. **設定・メタデータ**: `package.json`, `README.md`, `AGENTS.md` 等。
2. **コードベース**: ディレクトリ構造 (`list_files` ルート), 主要なエントリーポイント。
3. **既存ドキュメント**: `docs/` 配下など。

## ステップ3：ステアリング文書の作成・更新
分析結果に基づき、`.sdd/steering/` 配下の3ファイルを作成する。
**注意**: セキュリティ情報（APIキー等）は絶対に含めないこと。

### 1. Product Overview (`.sdd/steering/product.md`)
```markdown
# Product Overview
## プロダクト概要
[1-2行での説明]

## 主要機能
- [機能1]
- [機能2]

## ユーザーと価値
- 誰が、なぜこのプロダクトを使うのか
```

### 2. Technology Stack (`.sdd/steering/tech.md`)
```markdown
# Technology Stack
## アーキテクチャ
[アーキテクチャパターン、主要フレームワーク]

## 技術要素
- 言語/ランタイム: ...
- 主要ライブラリ: ...
- テスト/ツール: ...

## 開発環境
- 起動: ...
- テスト: ...
```

### 3. Project Structure (`.sdd/steering/structure.md`)
```markdown
# Project Structure
## ディレクトリ構成
[主要なツリー構造と役割]

## 設計方針・規約
[命名規則、ファイル配置ルールなど]
```

## 完了報告
「ステアリング文書の整備が完了しました。
続いて `.sdd/description.md` に開発したい機能の概要を記述し、
`/sdd-requirements` で要件定義へ進んでください。」
