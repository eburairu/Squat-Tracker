# 技術設計書: 装備ドロップ＆コレクション機能（Update: レアリティ拡張）

## データモデル変更

### 1. 武器データ構造の刷新
静的な `WEAPONS` 定義を廃止し、`BASE_WEAPONS` と `RARITY_SETTINGS` から動的に生成する。

```javascript
// レアリティ設定
const RARITY_SETTINGS = {
  1: { weight: 500, multiplier: 1.0, name: 'Common' },
  2: { weight: 300, multiplier: 1.5, name: 'Uncommon' },
  3: { weight: 150, multiplier: 2.0, name: 'Rare' },
  4: { weight: 45, multiplier: 3.5, name: 'Epic' },
  5: { weight: 5, multiplier: 6.0, name: 'Legendary' }
};

// 基本武器定義
const BASE_WEAPONS = [
  { id: 'wood_sword', name: 'ひのきの棒', emoji: '🪵', baseAtk: 2, weight: 50 },
  // ...
];

// 生成されるWEAPONSのキー形式
// "{baseId}_r{rarity}" -> 例: "wood_sword_r1", "wood_sword_r5"
```

### 2. 生成ロジック (`generateWeapons`)
- 全 `BASE_WEAPONS` × 全 `RARITY_SETTINGS` の組み合わせを生成し、`WEAPONS` オブジェクトにフラットに格納する。
- **攻撃力計算**: `Math.floor(baseWeapon.baseAtk * rarity.multiplier)`
- **名前**: 必要に応じて接尾辞をつけるが、今回は表示時に★で区別するためデータ上の `name` は基本名のままでも可。ただし、ユニーク性を出すなら「名工のひのきの棒」などの接頭辞ロジックを入れても良い（今回はシンプルに基本名ママで、IDとRarityプロパティで区別）。

## 処理フロー変更

### ドロップ抽選ロジック (`rollDrop`)
1. **ドロップ判定**: 30% の確率でドロップ処理開始。
2. **レアリティ抽選**: `RARITY_SETTINGS` の `weight` に基づいて ★1〜★5 を決定。
3. **武器種抽選**: `BASE_WEAPONS` の `weight` に基づいて武器種を決定。
4. **ID構築**: `{baseId}_r{rarity}` を作成。
5. **付与**: `InventoryManager.addWeapon(id)` を呼び出す。

## UI設計
- 特段のHTML変更は不要。
- `app.js` の `render` メソッドにおいて、アイテム名表示時にレアリティに応じた装飾（色など）を追加すると良い。

## 互換性
- 既存の `wood_sword` などのIDは `wood_sword_r1` にマイグレーションするか、あるいは古いIDも `WEAPONS` にエイリアスとして残す必要がある。
- **方針**: 既存データ（開発中のためユーザーデータは少ないと仮定するが念のため）との整合性を保つため、古いIDがロードされた場合、自動的に `_r1` 版に置換するマイグレーションロジックを `InventoryManager.load` に入れるのが安全。
