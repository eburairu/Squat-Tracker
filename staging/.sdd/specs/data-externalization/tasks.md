# タスクリスト: データ外部化

## 1. データファイル作成
- [x] `js/data/achievements.json` を作成し、既存の実績データを移行する。
- [x] `js/data/base-weapons.json` を作成し、`BASE_WEAPONS` データを移行する。

## 2. ユーティリティ実装
- [x] `js/modules/resource-loader.js` を作成し、`loadJson` 関数を実装する。

## 3. 実績システムのリファクタリング
- [x] `js/modules/achievement-system.js` を修正:
    - [x] `init` メソッドで `achievementsData` を受け取るように変更。
    - [x] `defineBadges` メソッドを修正し、データからバッジ定義を生成するように変更。
    - [x] `evaluateCondition` メソッドを実装し、JSON ベースの条件判定ロジックを追加。
    - [x] 既存のハードコードされたバッジ定義を削除。

## 4. 武器システムのリファクタリング
- [x] `js/data/weapons.js` を修正:
    - [x] `BASE_WEAPONS` のインポートを削除。
    - [x] `generateWeapons` 関数が `baseWeapons` 引数を受け取るように変更。
    - [x] `WEAPONS` の即時エクスポートを廃止（または空で初期化し、setterを用意）。
- [x] `js/constants.js` から `BASE_WEAPONS` を削除。
- [x] `js/modules/inventory-manager.js` を修正:
    - [x] `WEAPONS` の直接インポートに依存せず、`init` メソッド等で武器データを受け取れるように変更（または `weapons.js` の状態更新を待つ）。

## 5. アプリケーション初期化 (`app.js`) の修正
- [x] `DOMContentLoaded` イベントリスナー内を非同期関数化 (`initApp`)。
- [x] `loadJson` を使用して `achievements.json` と `base-weapons.json` をロード。
- [x] ロードしたデータを使って `AchievementSystem` と武器生成ロジックを初期化。
- [x] 生成された武器データを `InventoryManager` に渡して初期化。
- [x] ロード完了までローディング表示（必要であれば）あるいは初期化待機。

## 6. 検証
- [x] アプリを起動し、コンソールエラーがないことを確認。
- [x] 実績タブを開き、全ての実績が表示されていることを確認。
- [x] いくつかの実績条件（クリック、回数など）を満たし、解除されることを確認。
- [x] 武器が正しくロードされているか確認。
