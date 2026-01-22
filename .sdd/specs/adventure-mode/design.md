# Design: Adventure Mode

## 1. アーキテクチャ構成
本機能はシングルトンモジュール `AdventureSystem` を中心に構成し、データ定義、UI描画、既存システム（BossBattle）との連携を行う。

### 1.1 モジュール構成
- **`js/modules/adventure-system.js`**: 状態管理とロジックの中核。
- **`js/data/world-map.js`**: マップデータ（エリア定義）の静的データ。
- **`js/app.js`**: 初期化とモジュール結合。
- **`js/modules/boss-battle.js`**: 敵討伐時のトリガー発火。

## 2. データ構造

### 2.1 マップデータ (`js/data/world-map.js`)
```javascript
export const WORLD_MAP = [
  {
    id: 'grassland',
    name: 'はじまりの草原',
    theme: {
      background: 'linear-gradient(to bottom, #87CEEB 0%, #E0F7FA 100%)', // 空と草原イメージ
      color: '#4CAF50'
    },
    totalNodes: 10,
    enemies: ['スライム', 'ゴブリン'] // 将来拡張用
  },
  {
    id: 'forest',
    name: '迷いの森',
    theme: {
      background: 'linear-gradient(to bottom, #2E7D32 0%, #1B5E20 100%)',
      color: '#2E7D32'
    },
    totalNodes: 10
  },
  // ... 他エリア
];
```

### 2.2 状態データ (LocalStorage)
Key: `squat-tracker-adventure`
```javascript
{
  currentAreaIndex: 0, // WORLD_MAPのインデックス
  currentNodeIndex: 0  // 0 〜 totalNodes-1
}
```

## 3. UI/UX 設計

### 3.1 背景統合
- `body` または専用の背景コンテナに対し、現在のエリアの `theme.background` を適用する。
- 既存のダークモードとの兼ね合いを考慮し、背景画像の上に半透明の黒レイヤーを重ねるか、CSS変数で調整可能にする。

### 3.2 進行状況表示 (Mini Map)
- 画面上部（`#phase-display` の上あたり）に `#adventure-status` を配置。
- **内容**:
  - エリア名テキスト
  - プログレスバーまたはドット表示（例: `S - - - ● - - - - G`）
    - S: Start, G: Goal
    - ●: 現在地（アバター）

## 4. インターフェース仕様

### `AdventureSystem`
- `init()`: 初期化、ロード、UI構築。
- `getCurrentArea()`: 現在のエリアオブジェクトを返す。
- `getProgress()`: 現在の進捗率を返す。
- `advance()`: 1マス進む。エリアクリア時は次のエリアへ。
- `render()`: UIを更新する。

## 5. 既存コードへの変更
- **`index.html`**: 新規UIコンテナを追加。
- **`styles.css`**: エリア表示用のスタイル追加。
- **`js/modules/boss-battle.js`**: `damage()` メソッド内で敵HPが0になった際、`AdventureSystem.advance()` を呼び出す。
  - **注意**: 既存の「敵の復活（`regenerateHp`）」ロジックと衝突しないよう調整が必要。
    - 現状: 倒す -> 即復活(HP満タン)
    - 変更後: 倒す -> `advance()` (エリア移動/敵変更) -> HP満タンで次戦闘

## 6. テスト方針
- **Unit Test**: `AdventureSystem` の状態遷移（エリアまたぎ、ループなど）をテスト。
- **UI Test**: 進行に応じてエリア名や背景が変わることを検証。
