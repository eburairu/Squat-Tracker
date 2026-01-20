# Technology Stack
## アーキテクチャ
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Design Pattern**: Singleton-based Modular Architecture (app.js内にモジュールを集約)
- **State Management**: 各モジュール内での状態管理 + `localStorage` による永続化

## 使用技術
- **Language**: JavaScript, HTML, CSS
- **Testing**: Playwright
- **Build**: なし (Static HTML)
- **Deployment**: GitHub Pages

## 開発環境
- **起動**: `python -m http.server 8000` (または任意の静的サーバー)
- **テスト**: `npm test`
- **依存管理**: `pnpm` (ただしテスト実行は `npm` スクリプト経由を推奨)

## 環境変数
- 特になし (クライアントサイドのみで動作)
