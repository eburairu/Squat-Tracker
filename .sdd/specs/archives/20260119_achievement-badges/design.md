# 技術設計書

## アーキテクチャ概要
`app.js` 内に新規オブジェクト `AchievementSystem` を作成し、実績の管理・判定・保存を集約する。
既存の `historyEntries`, `BossBattle.state`, `localStorage` 等の状態を参照して判定を行う。
UI部分は既存の `.card.history` を拡張し、タブ切り替え機能を実装する。

## 主要コンポーネント

### `AchievementSystem` (Singleton)
- **責務**: バッジ定義の保持、獲得判定、データの永続化、通知。
- **データ**:
  - `badges`: バッジ定義の配列。
  - `unlocked`: 獲得済みバッジIDとタイムスタンプのマップ。
- **メソッド**:
  - `init()`: 初期化、データロード。
  - `check(triggerContext)`: バッジ獲得判定を実行。
  - `unlock(badgeId)`: バッジ獲得処理（保存、通知）。
  - `getBadge(id)`: バッジ情報取得。
  - `render()`: UI描画。

### `Badge` (Data Structure)
- **フィールド**:
  - `id`: 一意の識別子 (string).
  - `name`: バッジ名 (string).
  - `emoji`: アイコン (string).
  - `description`: 説明文 (string).
  - `condition`: 判定関数 `(context) => boolean`.

### UI Components (HTML/CSS)
- **Tab Navigation**: `.tab-nav` コンテナと `.tab-btn` 要素。
- **Tab Content**: `.tab-content` ラッパー。
- **Badge Grid**: `.badge-grid` (CSS Grid layout).
- **Badge Item**: `.badge` (クラス `locked` / `unlocked`).

## データモデル
### LocalStorage: `squat-tracker-achievements`
```json
{
  "badge_id_1": 1705634000000,
  "badge_id_2": 1705634500000
}
```

## 処理フロー
1. **初期化**: `DOMContentLoaded` で `AchievementSystem.init()` 実行。ストレージからロード。
2. **完了時**: `finishWorkout` 末尾で `AchievementSystem.check({ type: 'finish', ... })` を呼び出し。
3. **判定**: 未獲得バッジの `condition` 関数を順次実行。
   - コンテキストとして `historyEntries`, `BossBattle.state`, 現在のワークアウト設定などを渡す。
4. **獲得**: 条件真の場合、`unlocked` に追加し保存。
5. **通知**: 新規獲得バッジがあれば、ファンファーレ (`playCelebration`) とともにダイアログまたはトーストを表示。
6. **表示**: タブが「実績」の場合、リストを再描画。

## エラーハンドリング
- ストレージ読み書き失敗時はコンソールログのみ出力し、機能はメモリ内だけで動作させる（例外でアプリを止めない）。

## 変更計画
- **変更ファイル**:
  - `app.js`: `AchievementSystem` 実装、`finishWorkout` へのフック追加。
  - `index.html`: 履歴カードのHTML構造変更（タブ化）。
  - `styles.css`: タブ、バッジのスタイル追加。
