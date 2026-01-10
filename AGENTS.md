# Agent Instructions

- 回答は日本語で行うこと。
- Playwrightテストは次の手順で実行すること（再現性を保ち成功させるための必須手順）:
  1. `npm test` を実行する（`pretest`で`npm ci`と`npx playwright install --with-deps`が自動実行される）。
  2. もし特定テストのみ実行する場合は `npm run test:screenshot` を使う（`pretest:screenshot`で依存関係とブラウザが整う）。
