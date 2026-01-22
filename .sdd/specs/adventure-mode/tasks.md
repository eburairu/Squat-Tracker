# Tasks: Adventure Mode Implementation

## 1. データ定義とロジック実装
- [x] **マップデータ作成**
  - `js/data/world-map.js` を作成し、最低5つのエリア（草原、森、砂漠、雪原、魔王城）を定義する。
- [x] **AdventureSystem コア実装**
  - `js/modules/adventure-system.js` を作成。
  - `init`, `load`, `save`, `advance` メソッドを実装。
  - ユニットテスト (`tests/adventure-system.test.js` or similar unit level verification) を作成（またはコンソール動作確認）。

## 2. UI実装
- [x] **HTML構造追加**
  - `index.html` に `#adventure-container`, `#adventure-background`, `#adventure-status` などを追加。
- [x] **CSSスタイル定義**
  - `styles.css` にマップ表示バー、アバター、背景レイヤーのスタイルを追加。
- [x] **レンダリングロジック実装**
  - `AdventureSystem` に `render` メソッドを実装し、DOMを更新するようにする。
  - 背景グラデーションの適用ロジック実装。

## 3. システム連携
- [x] **BossBattle連携**
  - `js/modules/boss-battle.js` の `damage` メソッド内（討伐時）から `AdventureSystem.advance()` を呼び出すように変更。
  - 敵討伐時にトースト通知などで「エリア進行」をユーザーに伝える。
- [x] **App初期化連携**
  - `js/app.js` で `AdventureSystem.init()` を呼び出す。

## 4. テストと仕上げ
- [x] **E2Eテスト作成**
  - `tests/adventure.spec.js` を作成。
  - 敵を倒すとエリアが進むこと、UIが変化することを確認するテスト。
- [x] **微調整**
  - エリアクリア時の演出（Confettiなど）とのタイミング調整。
