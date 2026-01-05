# Squat-Tracker

毎日のスクワットを記録するためのシンプルなWebアプリです。タイマーに合わせたリズムガイド、音による合図、休憩カウントダウン、終了時の演出を用意しています。スマホのセンサーを利用したカウントアップも選択できます。

## 主な機能

- しゃがむ2秒 → 1秒キープ → 1秒で立つのリズムガイド
- セット間の休憩と開始前/再開前の5秒カウントダウン
- 視覚的な進捗バーと音の合図
- センサーモード（Device Orientation）による深さ検知カウント
- 終了時のクラッカー風アニメーション

## 使い方

1. `index.html` をブラウザで開きます。
2. セット数・回数・各フェーズの秒数を設定します。
3. 「スタート」を押してガイドに合わせてスクワットします。
4. センサーモードを使う場合はスマホを太ももの前面に固定してオンにします。

## 開発用のローカル実行

```bash
python -m http.server 8000
```

ブラウザで `http://localhost:8000/index.html` を開いてください。

## GitHub Pages でのデプロイ

`main` への push は本番用、`develop` への push は検証用として GitHub Pages に自動デプロイします。公開先は `gh-pages` ブランチ配下のディレクトリを使い分けます。

- 本番: `https://<user>.github.io/Squat-Tracker/prod/`
- 検証: `https://<user>.github.io/Squat-Tracker/staging/`

`Settings` → `Pages` で `Source` を `Deploy from a branch` にし、`gh-pages` ブランチの `/ (root)` を選択してください（`/prod` と `/staging` はその配下でホストされます）。
