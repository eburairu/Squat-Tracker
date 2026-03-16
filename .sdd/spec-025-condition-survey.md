# コンディション・サーベイとスマート調整 (Condition Survey & Smart Adjustment)

## 1. 目的

現在の `SmartPlanner` モジュールは、「過去の運動履歴」の平均から `baseLoad` (基礎負荷) を算出し、「維持」「挑戦」「軽め」の3プランを提案している。しかし、これでは「昨日までの記録は良いが、今日は寝不足で疲れている」や「今日は非常に気分が良いのでもっとやりたい」といった、ユーザーの**日々の主観的なコンディション（体調・気分）**が反映されない。

本機能の目的は、`SmartPlanner` モーダル起動時にユーザーに簡単なアンケート（コンディション・サーベイ）を行い、その主観的スコアを元に提案されるプランの負荷（回数やセット数）を動的に補正することである。これにより、怪我の予防やモチベーションに応じた最適な負荷提案が可能となり、よりパーソナライズされた体験を提供する。

## 2. 機能要件

- **体調と気分の入力UIの追加**:
  - `SmartPlanner` のモーダル内に「体調 (Condition)」と「気分 (Mood)」をそれぞれ5段階で評価できるスライダー（またはそれに準ずるUI）を追加する。
  - スケールは 1 (とても悪い) から 5 (とても良い) とし、デフォルトは 3 (普通) とする。
- **動的負荷補正ロジックの実装**:
  - `analyzeAndGenerate` メソッド内で、入力された体調と気分の値を取得し、`baseLoad` に対して補正係数（乗数）を適用する。
  - 補正係数の算出ロジック:
    - 体調スコアと気分スコアの平均値を計算。
    - 平均値 3 (デフォルト) の場合は補正なし (1.0倍)。
    - 平均値が 3 より低い場合は負荷を下げる（最小 0.6倍程度）。
    - 平均値が 3 より高い場合は負荷を上げる（最大 1.4倍程度）。
- **リアルタイム再計算**:
  - ユーザーがスライダーを操作した際 (`input` イベント等)、即座にプランを再計算し、表示される提案メニュー (「挑戦」「維持」「軽め」) の内容を更新する。

## 3. UIの変更点

- `js/modules/smart-planner.js` の `createModal` メソッド内の HTML テンプレートを修正し、モーダル本文の上部にコンディション入力用のスライダーを追加する。
- ユーザーにわかりやすいように、1〜5の段階を絵文字等で表現する（例：1=😫, 3=😐, 5=🤩）。

```html
<div class="condition-survey">
  <div class="survey-group">
    <label for="smart-condition-slider">今日の体調は？ <span id="smart-condition-val">😐</span></label>
    <input type="range" id="smart-condition-slider" min="1" max="5" value="3" step="1">
  </div>
  <div class="survey-group">
    <label for="smart-mood-slider">今日の気分は？ <span id="smart-mood-val">😐</span></label>
    <input type="range" id="smart-mood-slider" min="1" max="5" value="3" step="1">
  </div>
</div>
```

## 4. `SmartPlanner.analyzeAndGenerate` の拡張仕様

既存の `analyzeAndGenerate` メソッドは以下のシグネチャを持つ:
`analyzeAndGenerate(historyEntries, bossState, userLevel, userBaseAp)`

**変更点**:
1. モーダル内の `#smart-condition-slider` と `#smart-mood-slider` から値を取得する（値が存在しない場合はデフォルトの 3 とする）。
2. 計算式:
   - `condition` (1〜5), `mood` (1〜5)
   - `averageScore = (condition + mood) / 2`
   - `multiplier = 1.0 + (averageScore - 3) * 0.2` (例: 平均1なら 1.0 - 0.4 = 0.6, 平均5なら 1.0 + 0.4 = 1.4)
3. 既存ロジックで算出された `baseLoad` に対してこの `multiplier` を掛けた値を、新たな補正済み `baseLoad` として使用する。
   - `baseLoad = Math.max(10, Math.floor(baseLoad * multiplier))`
4. 以降のロジック（「挑戦」「維持」「軽め」のプラン生成）は、この補正済み `baseLoad` を用いて行われる。

## 5. 入出力仕様と状態管理

- **入力**: スライダーの `input` イベント。
- **出力**: モーダル内のプラン提案カードの再描画。
- `SmartPlanner` は `show` 呼び出し時の `historyEntries`, `bossState`, `userLevel`, `userBaseAp` の状態をインスタンス変数 (またはクロージャー内) に一時保存し、スライダー操作時の再計算 (`updatePlans`) に利用できるようにする必要がある。

## 6. エッジケースと失敗時の挙動

- 初回起動時やスライダー要素が DOM に存在しない場合は、デフォルト値 (3) として計算しエラーを起こさないこと。
- 補正後の `baseLoad` が極端に小さくなる場合を防ぐため、常に `Math.max(10, ...)` で下限を 10 回とする（既存ロジックの踏襲）。
- 補正後の `baseLoad` が大きくなりすぎる場合でも、既存の `calculateSets` メソッドにより適切なセット数と回数に分割されるため問題ない。
- スライダー操作が非常に高速に行われた場合でも、計算処理は軽量であるためパフォーマンス上の大きな問題は想定されないが、必要であれば単純な同期処理として毎回再描画を行う。

## 7. テスト方針

- UI要素が存在することの確認（スライダーが2つ表示されること）。
- デフォルト値（3,3）でのプラン提案内容が既存の動作と一致することの確認。
- スライダーの値を最低（1,1）および最高（5,5）に変更した際に、それぞれ提案される回数（`baseLoad`に依存する）が減る・増えることの確認。
