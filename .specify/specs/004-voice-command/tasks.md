# タスクリスト: 音声コマンド操作

## 実装フェーズ

- [ ] **モジュール実装** (`js/modules/voice-control.js`)
    - [ ] `VoiceControl` オブジェクトのスケルトン作成
    - [ ] `init` メソッド: ブラウザAPI (`SpeechRecognition`) のサポート確認とインスタンス化
    - [ ] `startListening` / `stopListening` メソッド: 認識の開始と停止、再起動ループの管理
    - [ ] `handleResult` メソッド: 音声テキストの取得、正規化、コマンド判定
    - [ ] コールバック実行ロジックの実装
    - [ ] エラーハンドリング (`onerror`, `onend`)

- [ ] **UI実装**
    - [ ] `index.html`: ヘッダーまたは設定パネルへの音声操作トグルボタンの追加
    - [ ] `styles.css`: マイクアイコン、ON/OFF状態、リスニング中アニメーション (`pulse`) のスタイル定義

- [ ] **統合と連携** (`js/app.js`)
    - [ ] `VoiceControl` モジュールのインポート
    - [ ] `initApp` 内での初期化処理 (コールバック登録: `startWorkout`, `pauseWorkout`, `resetWorkout`)
    - [ ] トグルボタンのイベントリスナー設定
    - [ ] `localStorage` を利用した設定の永続化 (`VOICE_CONTROL_ENABLED`)

## 検証フェーズ

- [ ] **自動テスト**
    - [ ] `tests/voice-command.spec.js` の作成
    - [ ] `SpeechRecognition` のモック作成
    - [ ] コマンド認識による状態遷移（IDLE -> COUNTDOWN -> PAUSE）のテスト
    - [ ] `npm test` の実行（全テスト通過確認）

- [ ] **手動テスト**
    - [ ] 実機（PC Chrome / Android Chrome）での動作確認
    - [ ] 音声認識精度とレスポンスの確認
    - [ ] 誤認識の頻度チェック

## ドキュメントフェーズ

- [ ] **ドキュメント更新**
    - [ ] `README.md`: 機能紹介と対応ブラウザの追記
