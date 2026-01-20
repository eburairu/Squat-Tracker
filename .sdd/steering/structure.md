# Project Structure
## ルート構成
- `js/app.js`: アプリケーションのエントリーポイント（モジュール統合、UIイベント、センサーロジック）
- `js/modules/`: 機能ごとのモジュールファイル（BossBattle, AchievementSystem等）
- `index.html`: メインUI構造
- `styles.css`: スタイル定義
- `tests/`: PlaywrightによるE2Eテスト
- `.sdd/`: 仕様駆動開発用ドキュメント
- `.codex/`: エージェントスキル定義

## ファイル命名規則
- JS変数・関数: camelCase
- HTML ID/Class: kebab-case
- テストファイル: kebab-case (`tests/quiz-logic.spec.js` 等)

## 主要な設計原則
- **Singleton Modules**: `BossBattle`, `AchievementSystem` などの主要機能はシングルトンオブジェクトとして実装。
- **Global Access**: モジュールは `window` オブジェクトに公開し、テストやコンソールからのアクセスを可能にする。
- **No Build Step**: 複雑なビルドツールを避け、ブラウザで直接実行可能な構成を維持する。
- **Offline First**: すべてのデータは `localStorage` に保存され、オフラインでも動作可能。
