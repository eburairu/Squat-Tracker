# 実装タスクリスト（Update: レアリティ拡張）

## セクション1: データ構造の再構築
- [x] 1.1 動的武器生成ロジックの実装
  - 詳細: `BASE_WEAPONS`, `RARITY_SETTINGS` を定義し、`generateWeapons` 関数で `WEAPONS` を構築する。
  - 詳細: 既存のID（`wood_sword`等）からのマイグレーション処理を `InventoryManager` に追加。

## セクション2: ドロップロジックの改修
- [x] 2.1 2段階抽選ロジックの実装
  - 詳細: `BossBattle.rollDrop` を修正し、レアリティ抽選 -> 武器種抽選の流れにする。
  - 詳細: レアリティごとのToast通知演出（★5なら派手に）。

## セクション3: テストと検証
- [x] 3.1 拡張された仕様のテスト
  - 詳細: `tests/equipment.spec.js` を更新し、レアリティ違いの武器管理、ドロップ抽選の動作を確認する。
