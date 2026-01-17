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

- pr-review-checklist: Pull Request のレビュー観点を標準化し、見落としを防ぐためのチェックリストを提供する。
- draft-commit-message: ステージングされた変更内容から Conventional Commits に準拠したコミットメッセージ案を生成する。
- security-quick-audit: 変更差分に対する簡易セキュリティ監査を行い、リスクを洗い出す。
- general-task-playbook: 汎用的なタスクを抜け漏れなく進めるための計画・実行テンプレートを提供する。
- sdd-steering: プロジェクトの全体像を把握し、SDDプロセスのための基本ドキュメント（Product, Tech, Structure）を生成・更新する。
- sdd-requirements: 実装したい機能の要件と受け入れ基準を定義し、要件定義書（requirements.md）を作成する。
- sdd-highway: 要件定義から設計・実装までを一気に実行する高速開発モード。
- sdd-design: 要件に基づき実装方針や技術設計を固め、設計書（design.md）を作成する。
- sdd-tasks: 設計書に基づき実装タスクを分解し、タスクリスト（tasks.md）を作成する。
- sdd-implement: タスクリストに従ってテスト駆動開発（TDD）で実装を行い、機能を完成させる。
- sdd-archive: 完了した仕様（spec）をアーカイブし、開発サイクルをクローズする。
