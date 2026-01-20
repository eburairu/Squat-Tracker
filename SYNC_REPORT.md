## ドキュメント同期レポート - 2026-01-20

### 検出された変更
- **ES Modules リファクタリング**: `js/app.js` が機能ごとに分割され、`js/modules/` 配下に配置されました。
- **アーキテクチャ変更**: シングルトンモジュールが個別のファイルに分離され、`js/app.js` はエントリーポイントとして機能するようになりました。
- **SensorManager**: ドキュメントには独立したモジュールとして記載されていましたが、実装は `js/app.js` 内に維持されています。

### 更新したドキュメント
- **README.md**: 「使い方」セクションを更新し、ES Modules 採用に伴いWebサーバー経由でのアクセスが必須であることを明確化しました。
- **.sdd/design.md**:
  - `Core Modules` リストから実在しない `SensorManager` を削除し、`js/app.js` の役割を追加しました。
  - リストから漏れていた `Quiz` モジュールを追加しました。
  - その他のモジュール（`DataManager`, `PresetManager`, `Heatmap`等）が正しく記載されていることを確認しました。
- **.sdd/steering/structure.md**:
  - ルート構成に `js/app.js` と `js/modules/` を正確に反映させました。
  - `app.js` の役割記述を更新しました。
- **.sdd/steering/tech.md**:
  - デザインパターンの記述を「app.js内に集約」から「ES Modulesによる分割」に変更しました。

### 注意が必要な項目
- **SensorManager の扱い**: 将来的に `js/modules/sensor-manager.js` として分離する可能性がありますが、現時点では `js/app.js` 内の実装が正です。

### 推奨事項
- 特になし
