# 仕様駆動開発：要件定義

## ステップ1：前提確認
以下のファイルが存在することを確認：
- `.sdd/description.md` - 実装したい機能の説明
- `.sdd/steering/product.md`、`.sdd/steering/tech.md`、`.sdd/steering/structure.md` - ステアリング文書

存在しない場合は適切なエラーメッセージを表示。

## ステップ2：spec作成または特定
1. `.sdd/description.md` を読み込み、機能内容を理解
2. `.sdd/target-spec.txt` が存在するか確認：
   - 存在しない場合：
     - description.mdから適切なspec名を生成（例：memo-function）
     - `.sdd/specs/[spec名]/` ディレクトリを作成
     - `.sdd/target-spec.txt` にspec名を記録
   - 存在する場合：
     - 記載されているspec名のディレクトリが存在するか確認
     - 存在しなければエラーメッセージ表示

## ステップ3：ステアリング情報の読み込み
1. `.sdd/steering/product.md` - プロダクト概要
2. `.sdd/steering/tech.md` - 技術スタック
3. `.sdd/steering/structure.md` - プロジェクト構造

## ステップ4：要件定義書の作成
`.sdd/specs/[spec名]/requirements.md` を以下の構成で作成：

```markdown
# 要件定義書

## 機能概要
[description.mdの内容を基に機能の目的を記載]

## ユーザーストーリー
- ユーザーとして、[何を]したい。なぜなら[理由]だから。

## 機能要件
### 要件1：[主要機能名]
- 詳細説明
- 受入基準：
  - [ ] 条件1が満たされること
  - [ ] 条件2が満たされること

### 要件2：[次の機能]
- 詳細説明
- 受入基準：
  - [ ] 条件1が満たされること

## 非機能要件
- パフォーマンス：[必要に応じて]
- セキュリティ：[必要に応じて]
```

## 完了確認
「要件定義完了。内容を確認したら `/sdd-design` へ進むか、設計から実装まで一気に進めたい場合は `/sdd-highway` を実行してください。」
