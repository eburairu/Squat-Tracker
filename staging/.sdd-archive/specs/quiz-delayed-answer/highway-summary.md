# Highway 実装サマリ

## 設計方針
- 回答ボタンクリック時は `userSelectedOption` に保存し、`.selected` クラスを付与するのみとする（遅延判定）。
- フェーズが `UP` に遷移した時点で正誤判定を行い、`.correct` / `.incorrect` クラスを付与し、結果に応じたトーストやボーナス処理を実行する。
- 回答ボタンのレイアウトはCSSで `repeat(4, 1fr)` を維持し、非クイズフェーズでは `--` を表示するが枠組みは残すことで1x4を維持する。

## 実装内容
- `styles.css`: `.quiz-option.selected` のスタイル追加。
- `js/app.js`:
    - `userSelectedOption` 変数の追加。
    - `handleQuizAnswer` で即時判定を廃止し、選択状態の管理のみに変更。
    - `updateQuizAndTimerDisplay` の `Phase.UP` ブロックに正誤判定ロジックを移動。
    - `showToast` の呼び出しをオブジェクト形式に修正（バグ修正）。
    - 非クイズフェーズでボタンテキストを `--` にリセットしつつ枠を維持する挙動を確認。

## テスト結果
- 新規テスト `tests/quiz-delayed-answer.spec.js` を作成し、遅延判定と未回答時の挙動を検証（Pass）。
- 既存テスト `tests/quiz-interaction.spec.js` を遅延判定の仕様に合わせて修正（Pass）。
- 全体テスト `npm test` で回帰がないことを確認（Pass）。
