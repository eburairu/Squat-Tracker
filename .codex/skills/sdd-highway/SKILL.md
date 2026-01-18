# Highway モード

## Description
要件定義から設計・実装までを一気に実行する高速開発モード（小〜中規模な機能修正向け）。
Trigger examples: "一気に実装", "高速モード", "highway mode", "implement fast"

## 準備
以下のファイルが揃っていることを前提とします：
1. `.sdd/steering/` のドキュメント（必須）
2. `.sdd/target-spec.txt` （ターゲット指定済）
3. `.sdd/specs/[spec名]/requirements.md` （要件定義済）

## 実行フロー
要件定義書とステアリング情報を基に、以下の手順を一気に実行してください。

1. **設計**: メモリ上で簡易設計を行う（`design.md` は作成しなくても良いが、複雑な場合は作成推奨）。
2. **実装**: テスト先行開発（TDD）で実装を行う。
   - 既存コードの変更、新規ファイルの作成。
3. **記録**: 実装内容のサマリを `.sdd/specs/[spec名]/highway-summary.md` に記録する。

## 完了報告
「Highway実装完了。詳細は highway-summary.md を参照してください。
問題がなければ `/sdd-archive` でクローズしてください。」
