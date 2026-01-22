# sdd-requirements

## Description
実装したい機能の要件と受け入れ基準を定義し、要件定義書（requirements.md）を作成する。
Trigger examples: "要件定義", "要件書作成", "仕様策定", "define requirements", "create spec"

## ステップ1：前提確認とターゲット設定
1. `.sdd/description.md` (機能説明) を読み込む。
2. 機能名（spec名）を決定する（kebab-case推奨）。
3. `.sdd/specs/[spec名]/` ディレクトリを作成する。
4. `.sdd/target-spec.txt` に `[spec名]` を書き込む（これが現在の作業対象となる）。

## ステップ2：情報の統合
1. `.sdd/steering/` 配下の3ファイルを読み込み、プロジェクトの文脈を把握する。
2. `.sdd/description.md` の内容を分析する。

## ステップ3：要件定義書の作成
`.sdd/specs/[spec名]/requirements.md` を作成する：

```markdown
# 要件定義書: [機能名]

## 概要
[目的と背景]

## ユーザーストーリー
- [ ] <ユーザー> として <何> をしたい。なぜなら <理由> だから。

## 機能要件
### 1. [機能項目]
- 詳細: ...
- 受入基準:
  - [ ] <条件A>
  - [ ] <条件B>

## 非機能要件
- [パフォーマンス/セキュリティ/制約など]
```

## 完了報告
「要件定義書を作成しました (`.sdd/specs/[spec名]/requirements.md`)。
内容を確認し、問題なければ `/sdd-design` (設計) または `/sdd-highway` (高速実装) へ進んでください。」
