# 実装計画: ストリークシールド

## アーキテクチャ設計

### 1. InventoryManager 拡張
`js/modules/inventory-manager.js` を拡張し、消費アイテム（Consumables）を管理できるようにする。
- **State**: `items` (武器) とは別に `consumables: { shield: number }` を保持。
- **Methods**:
  - `addConsumable(id, amount)`
  - `useConsumable(id, amount)`
  - `getConsumableCount(id)`
  - `checkStreakProtection(historyEntries, saveHistoryCallback)`: ストリーク保護のコアロジック。

### 2. データ構造 (History)
`localStorage` の `squat-tracker-history` に保存される配列要素に新しいタイプを追加。
- 通常: `{ date: "2023-10-01T...", totalReps: 50, ... }`
- シールド: `{ date: "2023-10-02T...", type: "shield", totalReps: 0 }`

### 3. Utils 拡張
`js/utils.js` の `computeStreak` 関数を修正。
- `type: 'shield'` のエントリもストリーク継続としてカウントする。ただし `totalReps` には加算しない（これは `computeStats` 側の責務）。

### 4. アプリケーション統合
`js/app.js` の初期化フローで `InventoryManager.checkStreakProtection` を呼び出す。
- タイミング: 履歴データ読み込み後、UIレンダリング前。

## 依存関係
- `InventoryManager` は `history` データにアクセスする必要があるが、管理はしていない。`app.js` から渡す形にする。
- `AchievementSystem` は `history` の変更を検知する必要がある（ストリークバッジのため）。

## テスト計画
- **Unit Test**: `InventoryManager` の消費ロジック、`computeStreak` の計算ロジック。
- **E2E Test**:
  - 過去の日付の履歴とシールドを持たせた状態でアプリを開き、履歴が追加されシールドが減ることを確認。
  - ストリーク数が維持されていることを確認。
