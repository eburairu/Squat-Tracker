# Tasks: Monster Bestiary

- [ ] **Data Preparation**
  - [ ] `js/data/bestiary.json` を作成し、全モンスター（10体）分のフレーバーテキストとタイトルを記述する。

- [ ] **Module Implementation**
  - [ ] `js/modules/bestiary-manager.js` を作成。
  - [ ] `init()`: `bestiary.json` のロード処理。
  - [ ] `getMonsterData(index)`: `MONSTERS`, `bestiary.json`, `BossBattle.state` を統合して単一のオブジェクトを返すロジックの実装。
  - [ ] `render()`: モーダル内のHTML生成ロジック。
  - [ ] `open()` / `close()`: モーダル制御。

- [ ] **UI Implementation (HTML/CSS)**
  - [ ] `index.html`: `#bestiary-modal` の骨組みを追加。
  - [ ] `index.html`: メイン画面（例: ヘッダーまたは設定エリア）に図鑑を開くボタンを追加。
  - [ ] `styles.css`: モーダル、グリッド、詳細ビューのスタイル定義。
    - `.bestiary-grid`: CSS Grid Layout。
    - `.bestiary-item`: カードスタイル。
    - `.bestiary-detail`: 詳細表示用レイアウト。

- [ ] **Integration**
  - [ ] `js/app.js`: `BestiaryManager` のインポートと初期化。
  - [ ] `js/app.js`: ボタンイベントのバインド。

- [ ] **Testing**
  - [ ] `tests/bestiary.spec.js` を作成。
  - [ ] 遭遇/未遭遇のロジックが正しいかテスト。
  - [ ] UIが表示されるかテスト。
