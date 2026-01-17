# draft-commit-message

## 目的
変更内容に基づいて Conventional Commits の草案を生成する。

## 手順
1. 変更点を3〜6個の箇条書きで整理する。
2. 変更の性質から type（feat/fix/docs/chore/refactor/test/build/ci/perf/style）を選ぶ。
3. scope（任意、1〜2語）を決める。
4. 本文で背景・理由・影響範囲を簡潔に記述する。
5. 破壊的変更の有無を確認し、必要なら `!` と BREAKING CHANGE を付与する。

## 出力フォーマット
- draft:
  - title: `<type>(<scope>): <summary>`
  - body: |-
      <detail line 1>
      <detail line 2>
      <detail line 3>
