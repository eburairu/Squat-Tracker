# 技術設計書: 戦績カード生成 (Battle Record Card)

## アーキテクチャ概要
新規モジュール `js/modules/share-card.js` を作成し、シングルトンとして実装する。
このモジュールは、`AchievementSystem` や `RpgSystem` などの既存モジュールからデータを収集し、HTML5 Canvas API を使用して画像を生成する責務を持つ。
UI（ボタン、モーダル）の管理もこのモジュールが担当するが、ボタンの挿入場所は `AchievementSystem` の DOM 要素内とする。

## 主要コンポーネント

### `ShareCard` (`js/modules/share-card.js`)
- **責務**:
  - 戦績データの収集
  - Canvas への描画
  - プレビューモーダルの管理（表示・非表示）
  - 画像ダウンロード処理
  - UI初期化（ボタン配置）
- **公開メソッド**:
  - `init()`: イベントリスナの設定、ボタンの生成。
  - `generate()`: 画像生成プロセスのトリガー。
- **依存関係**:
  - `RpgSystem`: レベル、攻撃力取得
  - `BossBattle`: 討伐数取得
  - `InventoryManager`: 装備情報取得
  - `AchievementSystem`: バッジ取得状況
  - `utils.js`: `computeStats` (累計回数計算)

## データモデル
### `BattleRecordData` (内部利用オブジェクト)
```javascript
{
  level: number,
  title: string, // 称号
  attackPower: number,
  totalReps: number,
  bossKills: number,
  weapon: {
    name: string,
    rarity: string,
    emoji: string
  },
  badges: {
    unlocked: number,
    total: number
  },
  date: string
}
```

## UI仕様
### 生成ボタン
- **ID**: `create-share-card-btn`
- **配置**: `#tab-achievements` 内、バッジグリッドの上部。
- **スタイル**: `primary` クラスのボタン。

### プレビューモーダル
- **ID**: `share-card-modal`
- **構成**:
  - タイトル「戦績カード」
  - 画像プレビューエリア (`img` タグ)
  - アクションボタン: 「画像を保存」「閉じる」

## 処理フロー
1. `app.js` で `ShareCard.init()` を呼び出す。
2. `ShareCard` が `#tab-achievements` 内に「戦績カードを作成」ボタンを注入する。
3. ユーザーがボタンをクリック。
4. `ShareCard.generate()` が実行される。
   - 各モジュールからデータを収集。
   - オフスクリーン Canvas を作成。
   - 背景、テキスト、アイコンを描画。
   - `canvas.toDataURL('image/png')` で画像データ化。
5. モーダルを表示し、生成された画像を `img.src` にセット。
6. ユーザーが「保存」をクリックすると、`<a>` タグを動的生成してダウンロードを実行。

## エラーハンドリング
- **データ取得エラー**: 一部のデータが欠損していても、デフォルト値（"--" や 0）を表示して処理を継続する。
- **画像生成エラー**: `try-catch` で捕捉し、アラートまたはトーストでユーザーに通知。

## 変更計画
- **新規ファイル**: `js/modules/share-card.js`
- **変更ファイル**:
  - `js/app.js`: `ShareCard` のインポートと初期化。
  - `index.html`: モーダル用HTMLの追加（またはJSで動的生成）。今回は保守性を考慮し、`index.html` にモーダルのスケルトンを追加する方針とする。
  - `styles.css`: モーダルやボタンのスタイル調整。
