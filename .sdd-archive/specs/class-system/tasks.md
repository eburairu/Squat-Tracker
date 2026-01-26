# Tasks: Class System

## Core Implementation
- [ ] `js/data/classes.json` 作成
    - `novice`, `warrior`, `mage`, `rogue` の定義
- [ ] `js/modules/class-manager.js` 実装
    - クラス定義のロード (`init`)
    - 現在のクラスの取得と保存 (`currentClass`, `changeClass`)
    - 補正値の計算/取得 (`getModifiers`)
- [ ] `js/modules/resource-loader.js` 修正
    - `classes.json` の fetch 処理追加
- [ ] `js/app.js` 修正
    - `ClassManager` のインポートと初期化

## UI Implementation
- [ ] `index.html` 修正
    - クラス選択モーダル (`#class-modal`) の追加
    - クラス表示アイコン/ボタンの追加（例: ヘッダー付近）
- [ ] `styles.css` 修正
    - モーダルのスタイル
    - クラスカードのスタイル（選択状態など）
- [ ] `js/modules/class-manager.js` UIロジック追加
    - モーダル開閉 (`openModal`, `closeModal`)
    - クラスリストのレンダリング
    - 選択イベントハンドリング

## Logic Integration
- [ ] `js/modules/boss-battle.js` 修正
    - `ClassManager.getModifiers().attackMultiplier` をダメージ計算に適用
    - クリティカル計算に `criticalRateBonus` を適用
- [ ] `js/modules/quiz.js` (または `app.js` のクイズ処理部分) 修正
    - クイズ正解時のダメージ計算に `quizMultiplier` を適用

## Verification & Testing
- [ ] `tests/class-system.spec.js` 作成
    - クラス変更が保存されるか
    - 補正値が正しく適用されているか（モックを使用）
- [ ] 手動検証
    - ブラウザでクラスを変更し、再読み込み後も維持されるか確認
    - 実際にスクワット/クイズを行い、ダメージ変動を確認
