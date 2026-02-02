# Tasks: Monster Bestiary

- [x] **Data Preparation**
  - [x] `js/data/bestiary.json` を作成し、全モンスター（10体）分のフレーバーテキストとタイトルを記述する。

- [x] **Module Implementation**
  - [x] `js/modules/bestiary-manager.js` を作成。
  - [x] `init()`: `bestiary.json` のロード処理。
  - [x] `getMonsterData(index)`: `MONSTERS`, `bestiary.json`, `BossBattle.state` を統合して単一のオブジェクトを返すロジックの実装。
  - [x] `render()`: モーダル内のHTML生成ロジック。
  - [x] `open()` / `close()`: モーダル制御。

- [x] **UI Implementation (HTML/CSS)**
  - [x] `index.html`: `#bestiary-modal` の骨組みを追加。
  - [x] `index.html`: メイン画面（例: ヘッダーまたは設定エリア）に図鑑を開くボタンを追加。
  - [x] `styles.css`: モーダル、グリッド、詳細ビューのスタイル定義。
    - `.bestiary-grid`: CSS Grid Layout。
    - `.bestiary-item`: カードスタイル。
    - `.bestiary-detail`: 詳細表示用レイアウト。

- [x] **Integration**
  - [x] `js/app.js`: `BestiaryManager` のインポートと初期化。
  - [x] `js/app.js`: ボタンイベントのバインド。

- [x] **Testing**
  - [x] `tests/bestiary.spec.js` を作成。
  - [x] 遭遇/未遭遇のロジックが正しいかテスト。
  - [x] UIが表示されるかテスト。
