# sdd-highway

## Description
要件定義書 (`requirements.md`) を基に、設計書やタスクリストの作成を省略し、直接実装と記録を行う高速開発モード。
**注意**: 小規模な改修やプロトタイピングに限定して使用すること。
Trigger examples: "高速実装", "一気に実装", "highway mode", "implement fast", "直実装"

## ステップ1：前提確認
1. `.sdd/target-spec.txt` から対象specを確認する。
2. `.sdd/specs/[spec名]/requirements.md` が存在することを確認する。
3. `.sdd/steering/` 配下の情報を読み込む。

## ステップ2：実装サイクル (Thinking & Coding)
設計書を作成しない代わりに、以下のプロセスで実装する。
1. **思考内設計**: 実装方針を決定する。
2. **TDD実行**: テストを作成し、実装を行う (`npm test` で検証)。
3. **リファクタリング**: コード品質を確保する。

## ステップ3：実装サマリの記録
`.sdd/specs/[spec名]/highway-summary.md` を作成・更新する：

```markdown
# Highway Implementation Summary

## 実装方針
<採用したアプローチ>

## 変更内容
- <ファイル/機能の変更点>

## テスト結果
- <実行したテストと結果>
```

## 完了報告
「Highwayモードでの実装が完了しました。
`highway-summary.md` を確認し、問題なければ `/sdd-archive` でクローズしてください。」
