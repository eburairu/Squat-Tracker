# タスクリスト: アドベンチャーモード「ルート選択」機能

- [x] **UI実装: モーダル追加**
  - `index.html` に `#route-selection-modal` を追加する。
  - `styles.css` にモーダルとカードのスタイルを定義する。

- [x] **Logic実装: AdventureSystem拡張**
  - `js/modules/adventure-system.js` に `ROUTES` 定数を定義する。
  - `state` に `currentRouteId`, `routeModifiers` を追加し、`load`/`save` を対応させる。
  - `getRouteModifiers()` を実装する。
  - `showRouteSelection(callback)` を実装し、モーダル表示と選択処理を行う。
  - `selectRoute(routeId)` を実装し、状態更新とコールバック実行を行う。

- [x] **Logic実装: BossBattle連携**
  - `js/modules/boss-battle.js` の `spawnMonster` で `AdventureSystem.getRouteModifiers()` を取得し、HP計算に適用する。
  - `handleDefeat` で `AdventureSystem.advance()` の結果 (`areaCleared`) を確認し、trueなら `AdventureSystem.showRouteSelection` を呼び出すフローに変更する。

- [x] **検証**
  - Playwrightテスト `tests/spec-007-route-selection.spec.js` を作成する。
  - テストを実行し、分岐ダイアログの表示とパラメータ反映を確認する。
