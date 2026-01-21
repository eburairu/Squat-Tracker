# Highway 実装サマリ

## 設計方針
- **1x4レイアウトの常時適用**: CSSグリッドのカラム数を `repeat(4, 1fr)` に固定し、JSでの表示制御（display:none）を削除。
- **正誤フィードバックの改善**: 回答時に正解のボタンも緑色にするロジックを追加し、UPフェーズでも状態を維持するように変更。
- **待機中のUI**: 無効化されたボタンに「--」を表示し、レイアウト崩れを防ぐ。

## 実装内容
- **styles.css**: `.quiz-options-container` の `grid-template-columns` を `repeat(4, 1fr)` に変更。
- **js/app.js**:
  - `updateQuizAndTimerDisplay` を修正し、フェーズごとの表示状態（テキスト、disabled、クラス）を整理。
  - `handleQuizAnswer` に、不正解選択時に正解ボタンを緑色にするロジックを追加。
  - 初期化時に `updateQuizAndTimerDisplay(Phase.IDLE)` を呼び出すように修正。

## テスト結果
- `tests/verify_quiz_ui.spec.js` を作成し、Playwrightで検証。
  - レイアウト確認: Pass
  - 正解時のフィードバック: Pass
  - 不正解時のフィードバックと状態維持: Pass
