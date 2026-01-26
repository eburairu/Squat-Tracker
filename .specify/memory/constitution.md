# Squat Tracker 憲法 (Constitution)

## 核となる原則 (Core Principles)

### I. 言語設定: 日本語厳守
ユーザーへの応答、思考プロセス、ドキュメント作成、コミットメッセージ、コードコメントなど、全ての出力において**日本語**を使用することを絶対ルールとします。入力が英語であっても出力は日本語で行います。

### II. Spec-Driven Development (SDD)
全ての機能開発・変更は必ず仕様書（Spec）の作成から始めます。いきなりコードを書くことは禁止します。
1. `specify` コマンドを用いて仕様を策定する（`.specify/specs/`）。
2. 仕様に基づいて計画 (Plan) を立てる。
3. タスク (Tasks) に分解する。
4. 実装 (Implement) する。

### III. テスト駆動開発 (TDD)
実装前にテストケースを定義し、テストが失敗することを確認してから実装を行います（Red-Green-Refactor）。
Playwright を用いた E2E テスト (`npm test`) を重視します。

### IV. コミット規約
Conventional Commits (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`) を遵守します。
BREAKING CHANGE がある場合はフッターに明記します。

### V. 既存仕様の尊重
既存の重要な仕様（例：計算問題UIの180度反転表示など）を維持し、意図しない変更を加えないように注意します。

## 開発ガイドライン

### 技術スタック
- フロントエンド: HTML, CSS, Vanilla JS (No Framework)
- テスト: Playwright
- パッケージ管理: pnpm

### ドキュメント管理
- CHANGELOG.md は `main` ブランチでのみ管理（自動生成）。
- すべての新しい仕様は `.specify/specs/` 配下で管理する。
- `.sdd/` フォルダは旧仕様管理であり、将来的には `.specify/` へ完全に移行する。

## プロセス
1. `/speckit.specify` で要件定義
2. `/speckit.clarify` で不明点解消
3. `/speckit.plan` で技術設計
4. `/speckit.tasks` でタスク分解
5. `/speckit.implement` で実装

**Version**: 1.0.0 | **Ratified**: 2024-05-23
