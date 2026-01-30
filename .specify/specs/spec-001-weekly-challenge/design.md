# Design & Plan: Weekly Challenge System

## 1. アーキテクチャ概要

### 1.1 モジュール構成
- **WeeklyChallengeSystem**: コアロジック。状態管理、ミッション生成、進捗チェックを担当。
- **App (Entry)**: システム初期化、イベントリスナー（タブ切り替え）の設定。
- **UI Component**: `index.html` にタブUIを追加し、CSSでスタイル調整。

### 1.2 依存関係
- `WeeklyChallengeSystem` は `AchievementSystem`, `BossBattle` から呼び出される（Observer Pattern）。
- `WeeklyChallengeSystem` は `InventoryManager` を利用して武器報酬を付与する。
- `WeeklyChallengeSystem` は `utils.js` (日付処理, トースト) を利用する。

## 2. データ構造

### WeeklyChallengeSystem State
```javascript
{
  lastUpdatedWeek: string, // ISO週番号 (e.g., "2023-W42")
  missions: Array<{
    id: string,
    type: string,
    description: string,
    target: number,
    current: number,
    unit: string,
    completed: boolean,
    claimed: boolean,
    rewardType: string // "weapon_rare" | "weapon_epic"
  }>
}
```

## 3. 実装ステップ

### Step 1: コアロジック実装
- `js/modules/weekly-challenge.js` を作成。
- `init()`, `load()`, `save()`, `check()`, `claimReward()` メソッドを実装。
- 週次リセットロジック (`checkWeeklyReset`) を実装。

### Step 2: UI変更 (HTML/CSS)
- `index.html`: `#mission-card` 内にタブ切り替え用ボタン (`#mission-tab-daily`, `#mission-tab-weekly`) を追加。
- `styles.css`: タブのアクティブ状態、ウィークリーミッションリストのスタイルを追加。
- `js/app.js`: タブ切り替え時の表示切替処理を追加。

### Step 3: 統合 (Integration)
- `js/app.js`: `WeeklyChallengeSystem.init()` を呼び出し。
- `js/app.js`: `finishWorkout()` 内で `WeeklyChallengeSystem.check({ type: 'finish', ... })` を呼び出す。
- `BossBattle.js`: `handleDefeat()` 内で `WeeklyChallengeSystem.check({ type: 'boss_kill', ... })` を呼び出す。

### Step 4: テスト
- `tests/weekly-challenge.spec.js`: PlaywrightによるE2Eテスト。
  - 週またぎのシミュレーション（ローカルストレージ操作）。
  - ミッション達成と報酬受け取りフローの確認。

## 4. テスト計画

### シナリオ
1. **初期化**: 初回起動時にウィークリーミッションが生成されること。
2. **進捗更新**: トレーニング完了時に該当ミッションの進捗が進むこと。
3. **達成・報酬**: 目標達成時に「報酬受取」ボタンが表示され、クリックで武器が付与されること。
4. **週リセット**: `localStorage` の日付を過去週に変更してリロードすると、新しいミッションに更新されること。
