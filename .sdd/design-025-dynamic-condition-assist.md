# Design: Dynamic Condition Assist

## 1. コンポーネント構成

**モジュール化**
- `js/modules/condition-assist.js` を新規作成。
  - `ConditionAssist.init()`
  - `ConditionAssist.evaluate(sessionState, performanceData)`
  - `ConditionAssist.showModal(proposedAdjustment)`
  - `ConditionAssist.closeModal()`

**UIの追加 (`index.html`)**
- 既存の `index.html` 内に、アシスト提案用のモーダル（`#condition-assist-modal`）を追加する。
  - タイトル: 「コンディション・アシスト」
  - メッセージ: 「今日は少しお疲れのようですね。無理せず、目標を以下のように調整しますか？」
  - ボタン: 「変更して再開」「このまま続ける」

**依存関係**
- `ConditionAssist` は `app.js` から呼び出される。
- UIの更新やタイマーの一時停止/再開は `app.js` のコールバック（または公開関数）を介して行う。

## 2. データ構造

**評価指標とスコアリング**

| 指標（パフォーマンスデータ） | 閾値 / 条件 | スコア加算 |
| :--- | :--- | :--- |
| `cumulativePauseDuration` (累積ポーズ時間) | 10秒以上 | +2 |
| `ghostDiff` (ゴーストとの差分・遅延率) | -5.0% 以下 (5%以上遅れている) | +2 |
| `quizAccuracy` (クイズ正答率) | 50% 未満 (かつ出題数1以上) | +1 |

- **合計スコア (0〜5) が 3以上** の場合、アシストを発動する。
- （例：ポーズ時間が10秒以上 (+2)、かつクイズ正答率が50%未満 (+1) で発動）

**提案される調整 (`proposedAdjustment`)**
- `currentSet` が `totalSets - 1` より小さい場合（つまり残り2セット以上ある場合）、`totalSets` を現在の `currentSet + 1` (または `totalSets - 1`) に減らす。
- `totalSets` が1セットのみで減らせない場合、`repsPerSet` を半分（最小5）に減らす提案をする。
- （今回はシンプルに「残りのセット数を減らす」か「今回のセットの回数を減らす」のどちらか1つを提案する）

## 3. API / UI 仕様

**UIイベント (app.js側)**
- 第1セット完了時の `startRest()` の直前で `ConditionAssist.evaluate()` を呼び出し、結果が `true` なら `ConditionAssist.showModal()` を発火。
- このとき、`app.js` 側ではタイマーの `pauseWorkout()` を自動で呼ぶ（モーダル表示中進行しないようにするため）。
- モーダルでの選択後、コールバックで `app.js` の変数を更新し、`pauseWorkout()` を再度呼んで（レジューム）休憩フェーズを開始する。

## 4. 責務分離

- `ConditionAssist`: スコアの計算、モーダルの表示・非表示、提案内容の決定。
- `app.js`: セッション状態の提供、タイマーの制御、UI（ディスプレイ）の更新。

## 5. テスト方針

- `js/modules/condition-assist.js` のロジックが、入力データに対して正しく提案（またはスキップ）を返すかをPlaywright上で単体テスト（または手動テストによるE2Eで確認）。
- モーダルの表示時・非表示時にタイマーのポーズ状態が正しく維持・再開されるかを確認する。
