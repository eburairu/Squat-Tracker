# Tidy Refactoring Journal

## 2026-03-01 - [DOM作成とタブUIの共通化、LocalStorageキーの一元管理]
学び: [コード構造/設計に関する洞察]
- Vanilla JSのプロジェクトでは、`document.createElement`やクラスの付与（`classList.add/remove`）が大量に発生し、Fat Component（この場合はFat Module）の温床になっていることが判明した。
- また、LocalStorageのキーが各ファイルに直書き（または個別の定数として定義）されており、データのマイグレーションや保守が困難になりつつあった。
- モーダル画面内でのタブ切り替え処理が複数の機能（クラス選択、インベントリなど）でコピペされており、DRY原則に反していた。

アクション: [次回どのように適用するか/将来の課題]
- `js/utils.js`に汎用的な`createElement`と`setupTabs`ヘルパーを実装し、複数のモジュールをリファクタリングした。今後も新しいUIを追加する際はこのヘルパーを活用することで、宣言的で可読性の高いコードを維持できる。
- `js/constants.js`に`STORAGE_KEYS`を集約した。今後は新しいデータを保存する際は必ずこの定数ファイルに追加するように運用を統一するべき。
