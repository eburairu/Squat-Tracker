# draft-commit-message

## Description
ステージングされた変更内容から Conventional Commits に準拠したコミットメッセージ案を生成する。
Trigger examples: "コミット案作成", "コミットメッセージ作って", "コミットログ生成", "draft commit", "commit message"

## 手順
1. `git diff --staged` を実行して変更内容を取得する。
   - 出力が空の場合: ユーザーに「ステージングされた変更がありません。`git add` してから再実行してください」と伝えて終了する。
2. 変更の性質から type（feat/fix/docs/chore/refactor/test/build/ci/perf/style）を選ぶ。
3. scope（任意、1〜2語）を決める（例: `ui`, `auth`, `api`）。
4. 本文で「なぜ変更したか」「何が変わったか」を箇条書きで記述する。
   - デフォルトで日本語を使用する。
5. 破壊的変更がある場合は `BREAKING CHANGE: ...` をフッターに追加する。

## 出力フォーマット
```text
draft:
  title: <type>(<scope>): <summary>
  body: |-
      - <変更点1: 何をどうしたか>
      - <変更点2: 理由や背景>
```

### コマンド例
```bash
git commit -m "<title>" -m "<body>"
```
