# エンカウンターシステム実装計画

## 1. アーキテクチャ
`EncounterManager` クラスをシングルトンとして実装し、イベントのライフサイクルを管理する。

### クラス図 (概念)
```mermaid
class EncounterManager {
  - encounters: Array
  - currentEncounter: Object
  + init(): void
  + checkEncounter(): boolean
  + triggerEncounter(encounterId): void
  + resolveEncounter(choiceIndex): void
  - loadEncounters(): Promise
  - renderModal(): void
  - closeModal(): void
}
```

## 2. データフロー
1. `WorkoutTimer.startRest()` 呼び出し。
2. `EncounterManager.checkEncounter()` 実行。
3. 乱数判定でHit -> `triggerEncounter()`。
4. `WorkoutTimer.pause()` (アプリ側の実装依存、コールバックまたはイベント発火)。
5. モーダル表示、ユーザー入力待機。
6. ユーザーが選択肢をクリック -> `resolveEncounter()`。
7. 成功/失敗判定、報酬付与 (`InventoryManager`, `TensionManager` 等)。
8. 結果表示、モーダル閉じる。
9. `WorkoutTimer.resume()`。

## 3. ファイル構成
- `js/data/encounters.json`: イベント定義データ。
- `js/modules/encounter-manager.js`: ロジック実装。
- `js/app.js`: 統合、初期化。
- `index.html`: モーダルDOM追加。
- `styles.css`: モーダルスタイル追加。

## 4. 依存関係
- `WorkoutTimer`: タイマー制御。
- `InventoryManager`: アイテム付与。
- `TensionManager`: テンション操作。
- `AdventureSystem`/`ClassManager`: EXP付与。
- `utils.js`: トースト表示 (`showToast`)。

## 5. テスト戦略
- **単体テスト**: `EncounterManager` の確率判定、報酬ロジックのテスト。
- **統合テスト**: `startRest` からの呼び出しフロー、タイマー一時停止の確認。
- **E2Eテスト**: Playwright を使用して、実際に休憩に入りイベントが発生し、選択肢を選んで報酬を得る流れを確認。
