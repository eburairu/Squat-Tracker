# デイリー運勢システム (Daily Fortune System) 実装計画

## 1. クラス設計 (FortuneManager)

### 1.1 責務
- デイリー運勢の抽選ロジックの管理
- 抽選結果の状態保存と読み込み (`localStorage`)
- アプリケーション全体への効果値（倍率など）の提供
- UI（ステータスパネル、モーダル）の更新制御

### 1.2 メソッド
- `init()`:
    - 初期化処理。
    - `localStorage` からデータを読み込む。
    - 日付変更を検知し、必要ならリセットする。
    - UI要素（ボタン、モーダル）のイベントリスナーを設定する。
    - 初期表示を行う。
- `draw()`:
    - おみくじを引く。
    - 乱数に基づいて結果を決定する。
    - 結果を保存し、UIを更新する。
    - 効果適用を開始する。
- `getMultiplier(type)`:
    - 指定されたタイプ（'attack', 'exp', 'tension'）の倍率または加算値を返す。
    - 未実施または効果なしの場合はデフォルト値（1.0 または 0）を返す。
- `updateUI()`:
    - 現在の状態に基づいて、ステータスパネルとモーダルの表示を更新する。

### 1.3 プロパティ
- `state`:
    - `lastDrawDate`: 最後に引いた日付 (YYYY-MM-DDString)
    - `result`: 結果オブジェクト (FortureResult)

## 2. データ構造

### 2.1 運勢定義 (FortuneDefinition)
```javascript
const FORTUNES = [
  { id: 'excellent', name: '大吉', weight: 10, effect: { attack: 1.5, exp: 1.5, tension: 0 } },
  { id: 'great',     name: '中吉', weight: 25, effect: { attack: 1.2, exp: 1.2, tension: 0 } },
  { id: 'good',      name: '小吉', weight: 30, effect: { attack: 1.1, exp: 1.0, tension: 0 } },
  { id: 'lucky',     name: '吉',   weight: 25, effect: { attack: 1.0, exp: 1.0, tension: 20 } },
  { id: 'normal',    name: '末吉', weight: 10, effect: { attack: 1.0, exp: 1.0, tension: 0 } }
];
```

### 2.2 保存データ (LocalStorage)
key: `squat-tracker-fortune`
```json
{
  "date": "2023-10-27",
  "fortuneId": "excellent"
}
```

## 3. UI設計

### 3.1 ステータスパネル (Header)
- 既存の `stat-grid` に新しいカードを追加。
- ID: `fortune-status-card`
- クリックイベントでモーダルを開く。

### 3.2 モーダル (FortuneModal)
- ID: `fortune-modal`
- 構成:
    - ヘッダー: 「本日の運勢」
    - コンテンツ:
        - 未実施時: 「おみくじを引く」ボタン
        - 実施時: 結果表示（アイコン、名前、効果説明）
    - フッター: 閉じるボタン

## 4. 依存関係
- `js/app.js`:
    - `FortuneManager` をインポートし、`init()` を呼び出す。
    - 攻撃処理 (`performAttack`) で `FortuneManager.getMultiplier('attack')` を使用。
    - 完了処理 (`finishWorkout`) で `FortuneManager.getMultiplier('exp')` を使用。
    - 開始処理 (`startWorkout`) で `FortuneManager.getMultiplier('tension')` を使用。

## 5. ファイル構成
- `js/modules/fortune-manager.js`: 新規作成
- `js/app.js`: 修正
- `index.html`: 修正
- `styles.css`: 修正

## 6. テスト計画
- ユニットテスト（ロジック）:
    - 抽選確率の検証（大量試行による分布確認）
    - 日付変更時のリセット動作確認
- E2Eテスト (Playwright):
    - UIフロー（ボタンクリック -> モーダル -> 抽選 -> 結果表示）
    - `localStorage` への保存確認
    - アプリ再読み込み時の状態維持確認
