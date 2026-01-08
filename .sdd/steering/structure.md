# Project Structure

## ルートディレクトリ構成

```
/
├── .github/             # GitHub設定
├── .sdd/                # SDD関連ファイル
├── tests/               # Playwrightテスト
├── app.js               # アプリの主要ロジック
├── index.html           # エントリHTML
├── styles.css           # スタイルシート
├── package.json         # npm設定
├── package-lock.json    # npmロック
├── playwright.config.js # Playwright設定
├── README.md            # プロジェクト概要
└── AGENTS.md            # エージェント指示
```

## コード構成パターン

HTMLでUIを定義し、CSSで見た目を整え、JavaScriptでタイマー/センサー/演出のロジックを集中管理。

## ファイル命名規則

- HTML：`index.html`
- JavaScript：`app.js`
- CSS：`styles.css`
- Markdown：`README.md` / `AGENTS.md` / `.sdd/steering/*.md`

## 主要な設計原則

- クライアントのみで動作する静的構成
- 単一ファイルにロジックを集約し、操作性と可読性を重視
