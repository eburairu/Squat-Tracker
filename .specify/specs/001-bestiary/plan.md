# Implementation Plan: Monster Bestiary

## Architecture

### Module: `BestiaryManager` (`js/modules/bestiary-manager.js`)
シングルトンオブジェクトとして実装し、以下の責務を持つ。
1. **データ統合**: `MONSTERS` 定数と外部JSON（フレーバーテキスト）をマージする。
2. **状態計算**: `BossBattle` の状態（周回数、現在位置）から、各モンスターの「撃破数」と「遭遇フラグ」を計算する。
3. **UI管理**: モーダル（`#bestiary-modal`）の生成、表示、イベントハンドリング。

### Data Structure
新規ファイル `js/data/bestiary.json` を作成し、モンスターごとの詳細データを定義する。
キーは `id` (0-indexed) または `name` を使用するが、`MONSTERS` 配列の順序に依存するため、配列形式でインデックス同期させるのが最も簡易かつ確実である。

```json
[
  {
    "description": "最弱の魔物。まずはこいつでスクワットのフォームを確認しよう。",
    "title": "始まりの試練"
  },
  ...
]
```

### UI Components
- **Modal**: `index.html` に `#bestiary-modal` を追加。既存の `#title-modal` などを参考に、共通のモーダルスタイルを使用または拡張する。
- **Grid Item**: `.bestiary-item` クラス。
  - 状態クラス: `.locked` (未遭遇), `.unlocked` (遭遇済み)。

## Integration
- `js/app.js`: アプリ初期化時に `BestiaryManager.init()` を呼び出す。
- `BossBattle`: 依存しない。`BestiaryManager` が `BossBattle` のステート（localStorage）を読み取る方向で依存関係を作る（疎結合）。
  - ただし `BossBattle` はグローバルに公開されているため、`window.BossBattle.state` を参照する形が良い。

## Logic: Kill Count Calculation
```javascript
const getKillCount = (monsterIndex, currentLoop, currentMonsterIndex) => {
  let kills = currentLoop - 1;
  // 現在の周回ですでにこのモンスターを超えている（撃破している）場合
  if (currentMonsterIndex > monsterIndex) {
    kills += 1;
  }
  return kills;
};
```

## Logic: Discovery Logic
```javascript
const isDiscovered = (monsterIndex, currentLoop, currentMonsterIndex) => {
  // 2周目以降なら全て発見済み
  if (currentLoop > 1) return true;
  // 1周目は、現在地を含むそれ以前なら発見済み
  return monsterIndex <= currentMonsterIndex;
};
```
