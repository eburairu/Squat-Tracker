# Agent Instructions

## 基本方針

- 回答は日本語で行うこと。
- 今後のタスク指示はすべて仕様駆動開発（SDD）フローに従うこと（`.sdd/README.md` を参照）。

## Playwrightテスト手順（必須）

1. `npm test` を実行する（`pretest`で`npm ci`と`npx playwright install --with-deps`が自動実行される）。
2. 特定テストのみ実行する場合は `npm run test:screenshot` を使う（`pretest:screenshot`で依存関係とブラウザが整う）。

## プロジェクトコマンド

- Install: pnpm i
- Test: pnpm test
- Lint: pnpm lint

## 共有スキルカタログ

共有スキルは `.codex/skills/` にある。該当するスキルを使うときは次の手順に従うこと。

1. 対応する `SKILL.md` を開く。
2. 記載された手順を厳守する。
3. 指定された出力形式で回答する。

利用可能なスキル:

- pr-review-checklist: PRレビュー観点の標準化
- draft-commit-message: Conventional Commitsの草案生成
- security-quick-audit: 変更差分に対する簡易セキュリティ監査
- general-task-playbook: 汎用タスクの進め方テンプレート
- sdd-steering: プロジェクト背景とゴールの整理
- sdd-requirements: 要件と受け入れ基準の定義
- sdd-highway: 設計から実装までの高速化
- sdd-design: 実装方針と技術設計
- sdd-tasks: タスク分解と手順決定
- sdd-implement: 実装とテスト
- sdd-archive: 振り返りと成果共有
