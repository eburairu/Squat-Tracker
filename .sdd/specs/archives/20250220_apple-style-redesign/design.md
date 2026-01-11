# 設計

## 変更方針

- `styles.css`のカラートークンをApple配色へ差し替える。
- `body`背景は`#F5F5F7`中心のフラットデザインへ変更し、グラデーションや装飾ブロブは削除する。
- ボタン・入力・カードの角丸/余白/影をガイド値へ揃える。
- タイポグラフィをSF Pro系に統一し、見出し・本文のサイズを調整する。
- ダークテーマは`#1D1D1F`系の背景と高コントラストテキストで構成する。

## 影/角丸

- カード: `border-radius: 16px`, `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`。
- ホバー: `box-shadow: 0 4px 12px rgba(0,0,0,0.15)`。
- ボタン: 高さ44px以上、`border-radius: 12px`。

## 主要セレクタ

- `:root`, `body[data-theme="dark"]`
- `.card`, `.stat-card`, `.status-item`, `.quiz-area`
- `button`, `button.primary`, `button.ghost`
- `input[type="number"]`

