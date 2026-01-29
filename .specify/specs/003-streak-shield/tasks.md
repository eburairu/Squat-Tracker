# タスク分解: ストリークシールド

- [ ] `js/utils.js` の `computeStreak` を修正し、`type: 'shield'` を許容する
- [ ] `js/modules/inventory-manager.js` に `consumables` ステート管理（初期化、保存、ロード、マイグレーション）を追加
- [ ] `js/modules/inventory-manager.js` に `addConsumable`, `useConsumable`, `getConsumableCount` を実装
- [ ] `js/modules/inventory-manager.js` に `checkStreakProtection` メソッドを実装（履歴の穴埋めロジック）
- [ ] `js/app.js` の初期化フローで `checkStreakProtection` を呼び出し、変更があれば履歴を保存・再描画する処理を追加
- [ ] UI実装: ヘッダー（`.stat-grid` 付近）にシールドアイコンと所持数を表示する
- [ ] 初回起動時（または機能リリース後の初回）にシールドを1個付与するワンショットロジックを追加
- [ ] テスト: `tests/streak-shield.spec.js` を作成し検証
