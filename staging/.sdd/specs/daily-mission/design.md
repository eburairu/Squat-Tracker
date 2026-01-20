# 技術設計書: デイリーミッション機能

## アーキテクチャ概要
既存の「Singleton-based Modular Architecture」に従い、`DailyMissionSystem` という新しいシングルトンオブジェクトを `app.js` に追加する。
UIコンポーネントは `index.html` に新しいカードを追加し、CSSでスタイリングを行う。

## 主要コンポーネント

### `DailyMissionSystem` (Singleton)
- **責務**:
    - デイリーミッションの生成（日次リセット）。
    - 状態の永続化 (`localStorage`)。
    - ユーザーアクションに基づく進捗の更新。
    - 報酬（武器）の抽選と付与。
    - UIのレンダリング。
- **データ構造**:
    ```javascript
    {
      lastUpdated: 'YYYY-MM-DD', // 最後に更新した日付
      missions: [
        {
          id: 'mission_1',
          type: 'reps', // 'login', 'sets', 'consistency', etc.
          description: '合計30回スクワットする',
          target: 30,
          current: 0,
          isCompleted: false,
          isClaimed: false
        },
        // ... 他2つ
      ]
    }
    ```
- **依存関係**:
    - `InventoryManager`: 武器の付与(`addWeapon`)に使用。
    - `showToast`: 報酬獲得時の通知。
    - `RARITY_SETTINGS`, `BASE_WEAPONS`: 武器抽選ロジックで使用（定数）。

## 処理フロー

### 1. 初期化 (`init`)
1. `localStorage` からデータをロード。
2. 今日の日付 (`YYYY-MM-DD`) と `lastUpdated` を比較。
3. 日付が異なる場合、またはデータがない場合、`generateMissions()` を呼び出して新しいミッションを作成・保存。
4. UIをレンダリング。
5. 「ログイン」ミッションがある場合、即座に進捗を更新。

### 2. ミッション生成 (`generateMissions`)
1. ミッション定義プールからランダムに3つの異なるタイプを選択。
2. 難易度（回数など）をランダム、またはユーザーレベル（将来拡張）に基づいて決定。
3. 状態オブジェクトを初期化して保存。

### 3. 進捗チェック (`check`)
1. トリガーイベント（`finishWorkout`, `login` 等）を受け取る。
2. 未達成かつ未受取のミッションについて条件を評価。
3. `current` 値を更新。`current >= target` なら `isCompleted = true` に設定。
4. 状態が変われば保存し、UIを再描画。
5. 達成時はToast通知を表示。

### 4. 報酬受取 (`claimReward`)
1. ユーザーが達成済みミッションをクリック。
2. `isClaimed` が false であることを確認。
3. 武器抽選ロジックを実行（レアリティ抽選 -> 武器種抽選 -> `InventoryManager.addWeapon`）。
    - 確率は100%。
4. `isClaimed = true` に設定して保存。
5. UI更新（「受取済み」表示）。

## UI設計
- **配置**: `index.html` の `.primary-grid` 内、`#boss-card` の直前（または上部）に配置。
- **スタイル**:
    - 既存のカードスタイルを踏襲。
    - 各ミッションを行（row）として表示。
    - プログレスバーまたは数値（`10/30`）を表示。
    - 状態に応じたスタイル（未達成、達成・未受取、受取済み）。

## エラーハンドリング
- **ストレージエラー**: `localStorage` が使用できない場合はメモリ内でのみ動作（永続化なし）。
- **データ破損**: ロード時にJSONパースエラー等の異常があれば、データをリセットして新規生成。

## 変更計画
- **変更ファイル**:
    - `app.js`: `DailyMissionSystem` の追加、`BossBattle`, `AchievementSystem` 等のイベントフックへの呼び出し追加。
    - `index.html`: 新規カード用HTML追加。
    - `styles.css`: ミッションリスト等のスタイル追加。
- **新規ファイル**: なし（既存ファイルへ追記）
