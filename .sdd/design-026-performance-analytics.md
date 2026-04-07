# Design: パフォーマンス・アナリティクス（自動評価＆フィードバック）

## 1. モジュール構成
新規に `js/modules/performance-analyzer.js` を作成する。このモジュールは評価ロジックをカプセル化する。

### 依存関係
- 特になし（単独で動作可能なユーティリティ的モジュールとする）
- アプリケーション側（`app.js`）からこのモジュールのメソッドを呼び出し、結果を受け取ってUIに反映する。

## 2. データ構造

### 1) 入力データ (SessionData)
セッション中に記録された各フェーズの実測時間を配列で受け取る想定。ただし既存の `WorkoutTimer` がフェーズごとの正確な実測時間を記録していない可能性があるため、現実的には設定値ベースの達成度（完了レップ数・セット数）と、「テンポが早かったか遅かったかの擬似的な揺らぎ」または「WorkoutTimer側でフックして取得する実測時間」を用いる。
今回は、既存コードへの影響を最小限にするため、もし実測時間が取れなければ、完了割合とクイズの正答率（もしあれば）、またはコンボ数などを用いて総合スコアを評価する簡易なアナライザーとする方針も検討する。
※ 仕様上は「テンポの正確性」としたが、より汎用的に「セッションの実績データ」を受け取る。

```javascript
/**
 * @typedef {Object} SessionStats
 * @property {number} targetReps - 目標レップ数/セット
 * @property {number} targetSets - 目標セット数
 * @property {number} completedReps - 完了した合計レップ数
 * @property {number} targetTotalReps - 目標合計レップ数 (= targetReps * targetSets)
 * @property {number} averagePace - 1レップあたりの平均実測秒数 (省略可能)
 * @property {number} targetPace - 1レップあたりの目標秒数 (ダウン+ホールド+アップ)
 */
```

### 2) 出力データ (EvaluationResult)
```javascript
/**
 * @typedef {Object} EvaluationResult
 * @property {number} score - 総合スコア (0-100)
 * @property {string} rank - ランク ('S', 'A', 'B', 'C')
 * @property {string} feedback - ユーザーへのアドバイス/コメント
 */
```

## 3. 処理フロー

1. **データ収集 (WorkoutTimer / app.js側)**:
   - セッション終了時に、目標レップ・セット数、完了レップ数、セッションの経過時間（必要なら計算）を取得する。
   - `PerformanceAnalyzer.evaluate(stats)` を呼び出す。

2. **スコア算出 (PerformanceAnalyzer.evaluate)**:
   - **達成度スコア**: `(completedReps / targetTotalReps) * 100` (Max: 100)
   - **ペーススコア** (実測時間が取れる場合):
     目標ペースと実際のペースの誤差を減点方式で計算。
   - 上記を重み付けして最終スコアを算出。実測時間が取れない場合は達成度メインにするが、少し遊び心を入れて、完了率が100%ならペースも良かったとみなしてSまたはAとする。

3. **ランク・フィードバック生成**:
   - スコアに基づいてランクを判定。
   - ランクと達成状況に応じて、ランダムまたは条件分岐でフィードバックメッセージを生成（例: 「素晴らしいペースです！」「少しペースが早かったかもしれません。次回はゆっくりと。」）。

4. **UI反映 (app.js側)**:
   - 完了モーダル (`#session-complete-modal`)内に新しいコンテナ `<div id="performance-result-container"></div>` を追加。
   - 取得した `EvaluationResult` をHTMLに整形して表示。

## 4. API定義

```javascript
export const PerformanceAnalyzer = {
  /**
   * セッションデータを評価し、結果を返す
   * @param {Object} stats
   * @returns {Object} { score, rank, feedback }
   */
  evaluate(stats) { ... }
};
```

## 5. UI変更点
`index.html` の `#session-complete-modal` 内部（例えばEXP獲得表示の下）に、以下のような要素を追加。

```html
<div class="performance-summary" style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
  <h4>パフォーマンス評価</h4>
  <div class="performance-rank" style="font-size: 2em; font-weight: bold; color: var(--gold);">S</div>
  <div class="performance-score">スコア: 98点</div>
  <p class="performance-feedback" style="font-size: 0.9em; opacity: 0.8;">素晴らしいペースです！完璧なフォームでした。</p>
</div>
```

## 6. テスト方針
- 達成度が100%の場合、50%の場合、0%の場合でスコアとランクが正しく計算されるかユニットテスト的に検証（Playwright経由で直接関数を叩くか、モックを利用する）。
- UIにランクが表示されることをPlaywrightのE2Eテストで確認する。
