# 実装計画書: 音声コマンド操作 (Voice Command Control)

## 1. モジュール構成

### 1.1 `js/modules/voice-control.js`
音声認識ロジックをカプセル化する新規モジュールを作成する。

```javascript
export const VoiceControl = {
  recognition: null,
  isSupported: false,
  isEnabled: false,
  isListening: false,
  callbacks: {}, // { start: fn, pause: fn, reset: fn }

  init(callbacks),       // ブラウザサポート確認、インスタンス生成、イベントリスナー登録
  setEnabled(bool),      // 機能のON/OFF切り替え
  startListening(),      // 音声認識開始
  stopListening(),       // 音声認識停止
  handleResult(event),   // 認識結果の解析とコールバック実行
  handleError(event)     // エラーハンドリング（再起動など）
};
```

### 1.2 `js/app.js` への統合
- アプリ初期化時 (`initApp`) に `VoiceControl.init()` を呼び出す。
- コールバックとして既存の `startWorkout`, `pauseWorkout`, `resetWorkout` を渡す。
- UIイベント（トグルボタン）と `VoiceControl.setEnabled()` を連携させる。

## 2. データフローと制御ロジック

1. **初期化**:
   - `window.SpeechRecognition` または `window.webkitSpeechRecognition` の存在確認。
   - 非対応なら機能無効化（UI非表示）。
   - `localStorage` から前回の ON/OFF 設定を読み込む。

2. **リスニング・ループ**:
   - ONの場合、`recognition.start()` を呼ぶ。
   - `continuous = false` (単発認識) で設定し、`onend` イベントで `isEnabled` が true なら再度 `start()` を呼ぶ「手動ループ」方式を採用する（ブラウザによっては `continuous = true` が不安定なため）。
   - ただし、iOS Safari 等の制約（ユーザー操作必須）を考慮し、初回はボタンタップで開始する必要がある。

3. **コマンド解析**:
   - `onresult` イベントで取得したテキストを正規化（トリム、小文字化など）。
   - 事前定義したキーワードリストと照合。
   - マッチした場合、対応するコールバックを実行し、Toast通知を表示。

4. **UIフィードバック**:
   - リスニング中はマイクアイコンに `.listening` クラスを付与し、CSSアニメーション（赤色点滅など）させる。
   - エラー時（マイク権限拒否など）はアイコンをグレーアウトまたは非表示にする。

## 3. UI設計

### 3.1 コントロール配置
- `header` または `.hero-panel` 内に「マイクボタン」または「トグルスイッチ」を配置。
- 常時表示し、現在のステータス（ON/OFF/Listening/Error）がひと目で分かるようにする。

### 3.2 スタイル (`css/styles.css`)
- マイクアイコンのスタイル定義。
- `@keyframes` を用いたリスニング中のパルスアニメーション。

## 4. エッジケース・制約対応

- **HTTPS制約**: ローカル開発時は `localhost` で動作確認する。
- **iOS Safari**: 音声認識の開始にユーザーインタラクションが必要な場合があるため、トグルONのタイミングで `start()` を呼ぶ。また、バックグラウンドでの動作は保証されない旨を留意する。
- **誤認識**: 類似音での誤作動を防ぐため、認識テキストをコンソールログに出力してチューニングを行う（開発時）。

## 5. テスト方針

- **Playwright**: `page.evaluate` を使用して `VoiceControl` オブジェクトにアクセスし、擬似的な `SpeechRecognitionEvent` を発火させてロジックを検証する。
- **手動テスト**: 実際にマイクを使って発話し、コマンド認識の精度とレスポンスを確認する。
