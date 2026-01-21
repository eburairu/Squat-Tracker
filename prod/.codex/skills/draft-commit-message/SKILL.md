# draft-commit-message

## Description
ステージングされた変更内容から Conventional Commits に準拠したコミットメッセージ案を生成する。
Trigger examples: "コミットメッセージ作って", "コミット作成", "commit changes", "commit message draft", "コミット案", "generate commit message"

## 手順
1. `git diff --staged` を実行して変更内容を取得する。
   - 出力がない場合はユーザーに「ステージングされた変更がありません」と伝えて終了する。
2. 変更の性質から type（feat/fix/docs/chore/refactor/test/build/ci/perf/style）を選ぶ。
3. scope（任意、1〜2語）を決める。
4. 本文で背景・理由・影響範囲を簡潔に記述する。
   - 言語はデフォルトで日本語を使用する（ユーザーから英語指定があった場合のみ英語）。
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
