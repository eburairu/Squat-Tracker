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

3.  **開発プロセス (Spec-Driven Development):**
    *   今後のタスク指示はすべて **Spec Kit** を用いた仕様駆動開発フローに従ってください。
    *   詳細なルールは **`.specify/memory/constitution.md`** を参照してください。

## Spec Kit 利用手順

開発は以下のスラッシュコマンド（または相当するツール操作）を用いて進めてください。`specify-cli` が管理する `.specify` ディレクトリを使用します。

1.  **`/speckit.specify`** - 要件定義（Spec作成）
2.  **`/speckit.clarify`** - 仕様の不明点解消（任意だが推奨）
3.  **`/speckit.plan`** - 実装計画と技術設計
4.  **`/speckit.tasks`** - タスク分解
5.  **`/speckit.implement`** - 実装とテスト実行

## Playwrightテスト手順（必須）

1. `npm test` を実行する（`pretest`で`npm ci`と`npx playwright install --with-deps`が自動実行される）。
2. 特定テストのみ実行する場合は `npm run test:screenshot` を使う（`pretest:screenshot`で依存関係とブラウザが整う）。

## プロジェクトコマンド

- Install: pnpm i
- Test: npm test
- Spec Kit Check: `specify check`

## 共有スキルカタログ

共有スキルは `.agent/skills/` にあります。Spec Kit のコマンドと併用して、特定の作業（PRレビュー、セキュリティ監査など）を行う際に参照してください。

### スキルの利用手順

1. 対応する `SKILL.md` を開く（`.agent/skills/[skill-name]/SKILL.md`）。
2. 記載された手順を厳守する。

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
