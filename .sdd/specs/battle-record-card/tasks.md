# 実装タスクリスト: 戦績カード生成

## フェーズ 1: UI基盤の実装
- [x] 1.1 `index.html` にモーダルのHTML構造を追加
  - 詳細: `#share-card-modal` とその中身（プレビュー画像、閉じるボタン、保存ボタン）を追加。
- [x] 1.2 `styles.css` にモーダルと生成ボタンのスタイルを追加
  - 詳細: モーダルのレイアウト、非表示/表示の制御クラス、キャンバスプレビューのスタイル。

## フェーズ 2: モジュール実装 (データ収集・Canvas)
- [x] 2.1 `js/modules/share-card.js` の作成とスカフォールディング
  - 詳細: シングルトンオブジェクトの定義、`init` メソッド。
- [x] 2.2 データ収集ロジックの実装 (`collectData`)
  - 詳細: `RpgSystem`, `BossBattle`, `InventoryManager`, `AchievementSystem` からデータを取得し、`BattleRecordData` オブジェクトを返す。
- [x] 2.3 Canvas描画ロジックの実装 (`drawCanvas`)
  - 詳細: 背景、テキスト、アイコンの描画。`toDataURL` での画像化。
- [x] 2.4 モーダル制御ロジックの実装 (`showModal`, `downloadImage`)
  - 詳細: 画像のセット、ダウンロードトリガー。

## フェーズ 3: 統合
- [x] 3.1 `AchievementSystem` へのボタン注入
  - 詳細: `ShareCard.init()` 内で `#tab-achievements` にボタンを追加し、クリックイベントを設定。
- [x] 3.2 `app.js` での初期化
  - 詳細: `ShareCard` のインポートと `init()` 呼び出し。

## フェーズ 4: テスト
- [x] 4.1 ユニットテスト/E2Eテストの追加
  - 詳細: Playwright を使用し、ボタンが表示されるか、モーダルが開くか、画像生成（エラーが出ないか）をテスト。
