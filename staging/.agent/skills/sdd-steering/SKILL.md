---
name: sdd-steering
description: プロジェクトの全体像を把握し、SDDプロセスのための基本ドキュメント（Product, Tech, Structure）を生成・更新する。
---

Trigger examples: "プロジェクト分析", "ステアリング作成", "プロジェクト初期化", "init sdd", "analyze project", "プロジェクト把握", "start sdd"

## ステップ0：ステアリング情報の確認と読み込み
以下のステアリングドキュメントを `read_file` で読み込んでください：
1. `.sdd/steering/product.md`
2. `.sdd/steering/tech.md`
3. `.sdd/steering/structure.md`

※これらが存在しない場合は「新規作成モード」として、ステップ1の分析結果を基に新規作成します。

## ステップ1：プロジェクト分析
以下の情報を収集してください（`read_file`, `list_files` 等を使用）：

### 設定ファイル読み込み
- `package.json`, `requirements.txt`, `Cargo.toml`, `go.mod` 等

### ドキュメント読み込み
- `README.md`, `AGENTS.md`, `CHANGELOG.md`
- `docs/` ディレクトリ内のドキュメント

### ソースコード構造分析
- プロジェクトのディレクトリ構造と主要なソースファイルの種類・配置を確認

## ステップ2：ステアリングドキュメント生成・更新
`.sdd/steering/` ディレクトリを作成し、以下3つのファイルを作成または更新します。
**注意**: セキュリティ情報（APIキー等）は絶対に含めないでください。

### 1. Product Overview (`.sdd/steering/product.md`)
```markdown
# Product Overview
## プロダクト概要
[プロダクトの説明]
## 主要機能
- [機能リスト]
## 対象ユースケース
[解決するシナリオ]
## 価値提案
[独自の利点]
```

### 2. Technology Stack (`.sdd/steering/tech.md`)
```markdown
# Technology Stack
## アーキテクチャ
[システム設計概要]
## 使用技術
- [言語/FW]: [バージョン/用途]
## 開発環境
- 起動: [コマンド]
- テスト: [コマンド]
## 環境変数
- [変数名]: [説明]
```

### 3. Project Structure (`.sdd/steering/structure.md`)
```markdown
# Project Structure
## ルート構成
[ツリー構造]
## ファイル命名規則
[命名パターン]
## 主要な設計原則
[アーキテクチャルール]
```

## ステップ3：完了確認
「ステアリング完了。プロジェクトの基本情報を `.sdd/` に保存しました。
次は `.sdd/description.md` に実現したい機能や開発の内容を書いてください。
その後、`/sdd-requirements` で仕様駆動開発プロセスを開始できます。」
