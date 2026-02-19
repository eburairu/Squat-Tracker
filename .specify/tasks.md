# Squat Analytics 実装タスク

## 1. コアロジック実装
- [ ] `js/modules/analytics-manager.js` の作成
    - [ ] `analyzeWeekly(history)`: 曜日別集計ロジック
    - [ ] `analyzeHourly(history)`: 時間帯別集計ロジック
    - [ ] `analyzeMonthly(history)`: 月別集計ロジック
- [ ] `js/modules/insight-generator.js` の作成
    - [ ] `generateInsight(analysisData)`: 分析結果からメッセージを選択・生成するロジック

## 2. チャート描画エンジン実装
- [ ] `js/modules/chart-renderer.js` の作成
    - [ ] `createSVGElement(tag, attrs)`: SVG要素生成ヘルパー
    - [ ] `renderBarChart(container, data, options)`: 棒グラフ描画
    - [ ] `renderLineChart(container, data, options)`: 折れ線グラフ描画

## 3. UI 実装
- [ ] `index.html` の更新
    - [ ] `#analytics-modal` のマークアップ追加
    - [ ] メイン画面（または実績画面）への「分析レポート」ボタン追加
- [ ] `styles.css` の更新
    - [ ] モーダルスタイル
    - [ ] チャートコンテナ、SVGスタイル
    - [ ] インサイト表示エリアのスタイル

## 4. アプリケーション統合
- [ ] `js/app.js` の更新
    - [ ] モジュールのインポート
    - [ ] 初期化処理 (`AnalyticsManager`, `ChartRenderer` のセットアップ)
    - [ ] ボタンクリックイベントのバインド

## 5. テスト・検証
- [ ] `tests/analytics-logic.spec.js` の作成 (ロジックの単体テスト的検証)
- [ ] `tests/analytics-ui.spec.js` の作成 (E2Eテスト: 表示確認)
- [ ] 全テスト実行 (`npm test`)
