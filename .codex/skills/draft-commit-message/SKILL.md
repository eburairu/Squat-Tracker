# draft-commit-message

## Description
ステージングされた変更内容から Conventional Commits に準拠したコミットメッセージ案を生成する。
Trigger examples: "コミットメッセージ作って", "generate commit msg", "commit message draft"

## 手順
1. `git diff --staged` の結果を確認する（出力がない場合は実行し、何もなければユーザーにその旨を伝えて終了する）。
2. 変更の性質から type（feat/fix/docs/chore/refactor/test/build/ci/perf/style）を選ぶ。
3. scope（任意、1〜2語）を決める。
4. 本文で背景・理由・影響範囲を簡潔に記述する。
5. 破壊的変更の有無を確認し、必要なら `!` と BREAKING CHANGE を付与する。

## 出力フォーマット
```text
draft:
  title: <type>(<scope>): <summary>
  body: |-
      <detail line 1>
      <detail line 2>
      <detail line 3>
```

### コマンド例
```bash
git commit -m "<title>" -m "<body>"
```
