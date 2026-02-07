# タスクリスト: 音声コマンド操作

## 実装フェーズ

- [x] **モジュール実装** (`js/modules/voice-control.js`)
    - [x] `VoiceControl` オブジェクトのスケルトン作成
    - [x] `init` メソッド: ブラウザAPI (`SpeechRecognition`) のサポート確認とインスタンス化
    - [x] `startListening` / `stopListening` メソッド: 認識の開始と停止、再起動ループの管理
    - [x] `handleResult` メソッド: 音声テキストの取得、正規化、コマンド判定
    - [x] コールバック実行ロジックの実装
    - [x] エラーハンドリング (`onerror`, `onend`)

- [x] **UI実装**
    - [x] `index.html`: ヘッダーまたは設定パネルへの音声操作トグルボタンの追加
    - [x] `styles.css`: マイクアイコン、ON/OFF状態、リスニング中アニメーション (`pulse`) のスタイル定義

- [x] **統合と連携** (`js/app.js`)
    - [x] `VoiceControl` モジュールのインポート
    - [x] `initApp` 内での初期化処理 (コールバック登録: `startWorkout`, `pauseWorkout`, `resetWorkout`)
    - [x] トグルボタンのイベントリスナー設定
    - [x] `localStorage` を利用した設定の永続化 (`VOICE_CONTROL_ENABLED`)

## 検証フェーズ

- [x] **自動テスト**
    - [x] `tests/voice-command.spec.js` の作成
    - [x] `SpeechRecognition` のモック作成
    - [x] コマンド認識による状態遷移（IDLE -> COUNTDOWN -> PAUSE）のテスト
    - [x] `npm test` の実行（全テスト通過確認）

- [x] **手動テスト**
    - [x] 実機（PC Chrome / Android Chrome）での動作確認
    - [x] 音声認識精度とレスポンスの確認
    - [x] 誤認識の頻度チェック

## ドキュメントフェーズ

- [x] **ドキュメント更新**
    - [x] `README.md`: 機能紹介と対応ブラウザの追記
