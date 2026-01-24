# Agent Instructions

## 基本方針（厳守）

**【重要】言語設定: 日本語**

あなたは日本語のエキスパートエンジニアとして振る舞ってください。以下のルールを**絶対**に遵守してください。これらに例外はありません。

1.  **全ての出力を日本語にする:**
    *   ユーザーへのメッセージ、質問、回答
    *   思考プロセス (Thinking Process)
    *   プランの作成 (`set_plan`)
    *   作成・更新するドキュメント（要件定義書、設計書、タスクリストなど）
    *   Pull Request のタイトル、説明文
    *   コミットメッセージ
    *   コード内のコメント（新規追加分は日本語を推奨）

2.  **入力言語に依存しない:**
    *   ユーザーからの入力や参照ファイルが英語であっても、あなたの出力は**必ず日本語**で行ってください。

3.  **開発プロセス:**
    *   今後のタスク指示はすべて仕様駆動開発（SDD）フローに従うこと（`.sdd/README.md` を参照）。

## Playwrightテスト手順（必須）

1. `npm test` を実行する（`pretest`で`npm ci`と`npx playwright install --with-deps`が自動実行される）。
2. 特定テストのみ実行する場合は `npm run test:screenshot` を使う（`pretest:screenshot`で依存関係とブラウザが整う）。

## プロジェクトコマンド

- Install: pnpm i
- Test: npm test

## 共有スキルカタログ

共有スキルは `.agent/skills/` にある。Codex CLIおよびAntigravityの両方で使用可能。

### スキルの利用手順

1. 対応する `SKILL.md` を開く（`.agent/skills/[skill-name]/SKILL.md`）。
2. 記載された手順を厳守する。
3. 指定された出力形式で回答する。

### スキル形式

各スキルはYAMLフロントマターで始まる:

```yaml
---
name: [skill-name]
description: [説明]
---
```

利用可能なスキル:

- pr-review-checklist: Pull Request のレビュー観点を標準化し、見落としを防ぐためのチェックリストを提供する。
- draft-commit-message: ステージングされた変更内容から Conventional Commits に準拠したコミットメッセージ案を生成する。
- security-quick-audit: 変更差分に対する簡易セキュリティ監査を行い、リスクを洗い出す。
- general-task-playbook: 非開発タスク（調査・ドキュメント作成・運用作業など）を抜け漏れなく進めるための計画・実行テンプレートを提供する。
- sdd-steering: プロジェクトの全体像を把握し、SDDプロセスのための基本ドキュメント（Product, Tech, Structure）を生成・更新する。
- sdd-requirements: 実装したい機能の要件と受け入れ基準を定義し、要件定義書（requirements.md）を作成する。
- sdd-highway: 要件定義書（requirements.md）を基に、詳細設計書やタスクリストの作成を省略し、直接実装と記録を行う高速開発モード。
- sdd-design: 要件に基づき実装方針や技術設計を固め、設計書（design.md）を作成する。
- sdd-tasks: 設計書に基づき実装タスクを分解し、タスクリスト（tasks.md）を作成する。
- sdd-implement: 作成済みのタスクリスト（tasks.md）に従い、厳格なテスト駆動開発（TDD）サイクルを回して実装を進める標準モード。
- sdd-archive: 完了した仕様（spec）をアーカイブし、開発サイクルをクローズする。

## 仕様上の特記事項

- **計算問題UIの反転表示:**
  計算問題カード（`#quiz-card`）は、スクワット実施者とは別のユーザー（オペレーター）が対面（画面上部）から操作することを想定しているため、**常に上下反転（180度回転）** して表示させる仕様となっている。CSSで `transform: rotate(180deg)` を適用して実装すること。これはバグではなく意図的な仕様である。

## CHANGELOG管理 & バージョニング運用

本プロジェクトは `semantic-release` を導入し、mainブランチでの自動リリースを採用している。

### 1. 基本ルール

- **CHANGELOG.mdはmainブランチでのみ管理する**。developブランチ等では更新しない。
- **Conventional Commits**（後述）を遵守する。
- リリースはmainへのマージ時に自動実行される。

### 2. Conventional Commits

全てのコミットメッセージを以下の形式に統一すること。

```
<type>(<scope>): <subject>

<body>

<footer>
```

**主要なtype:**
- `feat`: 新機能 → MINOR バージョンアップ
- `fix`: バグ修正 → PATCH バージョンアップ
- `docs`: ドキュメントのみの変更
- `chore`: ビルドやツールの変更
- `refactor`: リファクタリング
- `test`: テスト追加・修正

**Breaking Change:**
- フッターに `BREAKING CHANGE:` を記載 → MAJOR バージョンアップ

### 3. Google Jules用プロンプト

#### 開発ブランチ用（毎日実行）

```markdown
## タスク: 開発ブランチのドキュメント同期

### 対象ファイル
- README.md
- .sdd/配下の仕様書
- **CHANGELOG.mdは更新しない**（mainでのみ管理）

### 重要な注意
- CHANGELOG.mdは触らないでください
- リリース情報はmainブランチで自動生成されます
- developではコードとドキュメントの整合性のみを確保

### 実行内容
1. 過去24時間のコミットを確認
2. README.mdを実装に合わせて更新
3. .sdd/配下の仕様書を更新
4. レポートを作成

### レポート形式
```markdown
## ドキュメント同期レポート - [日付]

### 検出された変更
- [コミットハッシュ] feat(auth): 認証機能追加

### 更新したドキュメント
- README.md: 認証セクションを追加
- .sdd/api-spec.md: 認証エンドポイントを追加

### Conventional Commits状況
- ✅ 全てのコミットがconventional形式に従っています
- ⚠️ 以下のコミットが形式に従っていません: [リスト]
```
```

#### Conventional Commits検証用（PR作成時）

```markdown
## タスク: リリース前のコミットメッセージ検証

### 確認内容
1. developのコミット履歴を確認
2. 全てがConventional Commits形式か検証
3. 予想されるバージョン番号を算出

### 出力形式
```markdown
## リリース前チェック

### コミット検証結果
- 総コミット数: 15
- Conventional形式: 14
- 非準拠: 1

### 非準拠コミット
- abc123: "fixed bug" → 推奨: "fix: resolve login timeout issue"

### 予想バージョン
- 現在: v1.1.0
- 次回: v1.2.0 (MINOR)
- 理由: 3件のfeat、5件のfix、Breaking Changeなし

### 予想CHANGELOG
[Unreleased]

### Features
- 認証機能の追加
- ダークモード対応
- プロフィール編集

### Bug Fixes
- ログインタイムアウトの修正
- APIエラーハンドリング
```
```
