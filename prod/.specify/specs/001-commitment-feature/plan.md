# 設計・実装計画: 次回の誓い

## 1. アーキテクチャ
新しいモジュール `js/modules/commitment-manager.js` を作成し、責務を集約する。
`app.js` はこのマネージャーを初期化し、イベント（ワークアウト完了、開始）をフックして呼び出す。

## 2. コンポーネント構成

### `CommitmentManager` (Singleton)
- **State:**
  - `commitment`: 現在の誓約データ
- **Methods:**
  - `init()`: 初期化、データ読み込み。
  - `setCommitment(date)`: 誓約を作成・保存。
  - `checkStatus()`: 現在時刻と誓約を比較し、状態（成功/失敗/継続中）を判定。
  - `resolveCommitment()`: ワークアウト開始時に呼び出し。成功/失敗の処理（ボーナス/ペナルティ適用）を実行し、誓約をクリアする。
  - `render()`: UI表示の更新。

### UIコンポーネント
- **インジケーター:** `.hero-panel` 内に追加。
- **設定UI:** 既存の `div#equipment-modal` 等を参考に、汎用的なモーダル構造を利用するか、新規に `div#commitment-modal` を作成する。
  - 今回は `div#commitment-modal` を新規作成する。

## 3. 実装ステップ

1.  **HTML/CSS:**
    - `index.html`: `commitment-modal` の追加。ヒーローエリアへの表示用コンテナ追加。
    - `styles.css`: モーダルとインジケーターのスタイル定義。

2.  **CommitmentManager:**
    - モジュールファイルの作成。
    - データ永続化ロジックの実装。
    - 判定ロジックの実装。

3.  **統合 (Integration):**
    - `app.js` でのインポートと初期化。
    - `finishWorkout` 関数内でのモーダル呼び出し処理追加。
    - `startWorkout` 関数内での `resolveCommitment` 呼び出しとボーナス適用。
    - アプリ起動時の失敗判定（放置による期限切れ）とボス回復処理。

4.  **テスト:**
    - PlaywrightによるE2Eテスト。時間を操作して成功/失敗パターンを検証。

## 4. 既存システムへの影響
- `BossBattle`: HP回復メソッド (`heal`) を利用。
- `TensionManager`: テンション加算メソッド (`add`) を利用。
- `app.js`: `sessionAttackBonus` 変数へのアクセス（または `ClassManager` 等を通じたボーナス付与）。
  - ※ `app.js` の `sessionAttackBonus` は `export` されていないため、アクセサを用意するか、`RpgSystem` や `ClassManager` 経由で補正を掛ける必要がある。現状の `app.js` を見ると `sessionAttackBonus` はローカル変数。
  - **修正案:** `app.js` に `applyCommitmentBonus()` のような関数を作り、`CommitmentManager` からはそれを呼ぶ形にするか、`CommitmentManager` が戻り値としてボーナス情報を返し、`app.js` がそれを適用する。後者が疎結合で望ましい。

## 5. リスク
- タイムゾーンの問題: 基本的にローカル時間で処理するため、旅行などでタイムゾーンが変わると判定がずれる可能性があるが、許容範囲とする。
