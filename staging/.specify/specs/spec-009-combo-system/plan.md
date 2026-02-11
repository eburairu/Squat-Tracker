# 実装計画書 (Combo System)

## 1. UI実装
- [ ] `index.html` に `<div id="combo-container">...</div>` を追加。
- [ ] `styles.css` にコンボ表示用のスタイル定義とアニメーション（Pulse, FadeIn）を追加。

## 2. ロジック実装
- [ ] `js/modules/combo-system.js` を新規作成。
  - シングルトンパターン。
  - `increment()`: コンボ加算、UI更新、SE再生。
  - `reset()`: リセット、UI更新（「MISS...」表示など）。
  - `getMultiplier()`: テンションボーナス計算。
- [ ] `js/app.js` に `ComboSystem` をインポートし、`init()` を呼び出す。

## 3. 統合
- [ ] `js/app.js` のクイズ正解ロジックに `ComboSystem.increment()` を追加。
- [ ] `js/app.js` のクイズ不正解ロジックに `ComboSystem.reset()` を追加。
- [ ] `js/app.js` のスクワット完了（クイズなし）ロジックに `ComboSystem.increment()` を追加。
- [ ] `js/app.js` の攻撃処理に `ComboSystem` のテンションボーナスを反映。

## 4. テスト・検証
- [ ] `tests/combo-system.spec.js` の作成と実行。
- [ ] 手動検証（UIアニメーション、ボーナス付与）。

## 5. ドキュメント更新
- [ ] `tasks.md` の更新。
- [ ] `README.md` への記載（必要であれば）。
