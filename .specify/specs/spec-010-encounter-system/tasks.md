# 実装タスクリスト

- [x] データファイルの作成 (`js/data/encounters.json`)
- [x] `EncounterManager` モジュールの実装 (`js/modules/encounter-manager.js`)
    - [x] 初期化とデータ読み込み
    - [x] 確率判定ロジック
    - [x] イベント実行ロジック
    - [x] 報酬処理ロジック
- [x] UI実装
    - [x] `index.html` へのモーダル追加
    - [x] `styles.css` へのスタイル追加
    - [x] モーダル表示/非表示の制御
- [x] アプリケーション統合 (`js/app.js`)
    - [x] `EncounterManager` の初期化
    - [x] `startRest` 内での呼び出し
    - [x] タイマー一時停止/再開の連携
- [x] テスト実装 (`tests/encounter.spec.js`)
- [x] 動作確認
