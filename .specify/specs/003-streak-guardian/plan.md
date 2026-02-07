# 実装計画: ストリーク・ガーディアン

## アーキテクチャ

### 新規モジュール: `StreakGuardian` (`js/modules/streak-guardian.js`)
- **責務**:
  - 履歴データからデッドラインを計算する。
  - 現在時刻との差分からステータス（Safe/Warning/Danger/Lost/Completed）を判定する。
  - UIの更新を行う。
- **API**:
  - `init(historyEntries)`: 初期化。要素の取得。
  - `update(historyEntries)`: 状態の再計算と表示更新。
  - `getDeadline(lastDate)`: 内部ロジック。

### 既存モジュールの変更

1.  **`js/app.js`**
    - `StreakGuardian` のインポートと初期化。
    - `tick` 関数（または独立した `setInterval`）内での `StreakGuardian.update()` 呼び出し（1分間隔程度で十分）。
    - トレーニング完了時（`finishWorkout`）に `StreakGuardian.update()` を即時呼び出し、状態を「完了」に更新する。

2.  **`styles.css`**
    - ステータスバーのスタイル定義。
    - アニメーション（Danger時の点滅など）。

3.  **`index.html`**
    - 表示用コンテナ（`#streak-guardian-container`）の追加。

## データ構造

```javascript
// ステータス定義
const Status = {
  COMPLETED: 'completed', // 当日分完了
  SAFE: 'safe',           // まだ余裕あり
  WARNING: 'warning',     // 締め切り近い
  DANGER: 'danger',       // 危険
  LOST: 'lost'            // 期限切れ
};
```

## テスト戦略
- Playwrightを使用。
- `localStorage` に過去の日付のデータを注入し、表示が正しく「Warning」「Danger」になるか検証する。
- トレーニング完了後に表示が「完了」状態になるか検証する。
