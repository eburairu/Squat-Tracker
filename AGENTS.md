# Agent Instructions

- 回答は日本語で行うこと。
- Playwrightテストは次の手順で実行すること（再現性を保ち成功させるための必須手順）:
  1. `npm test` を実行する（`pretest`で`npm ci`と`npx playwright install --with-deps`が自動実行される）。
  2. もし特定テストのみ実行する場合は `npm run test:screenshot` を使う（`pretest:screenshot`で依存関係とブラウザが整う）。
- 今後のタスク指示はすべて仕様駆動開発（SDD）フローに従うこと（`.sdd/README.md` を参照）。

# Agent Operating Guide

## Project commands
- Install: pnpm i
- Test: pnpm test
- Lint: pnpm lint

## Shared skills catalog
Skills live in `.codex/skills/`. When asked for tasks matching a skill description:
1) Open the corresponding `SKILL.md`
2) Follow its steps strictly
3) Use the output format defined there

Available skills:
- pr-review-checklist: PRレビュー観点の標準化
- draft-commit-message: Conventional Commitsの草案生成
- security-quick-audit: 変更差分に対する簡易セキュリティ監査
- general-task-playbook: 汎用タスクの進め方テンプレート
