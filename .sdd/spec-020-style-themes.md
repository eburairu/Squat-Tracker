# Spec-020: Style Theme System (スタイル・テーマシステム)

## 1. 目的
ユーザーが自分の好みや気分に合わせてアプリケーションの視覚的・聴覚的な雰囲気をカスタマイズできるようにし、トレーニングのマンネリ化を防ぎ、没入感を高める。

## 2. 機能要件

### 2.1 ビジュアルテーマ (Visual Style)
- 以下のプリセットテーマを提供する。
  - **Default**: 既存のシンプルデザイン (Light/Dark対応)
  - **Forest**: 自然を感じさせる緑・茶色基調 (Light: 朝の森, Dark: 夜の森)
  - **Volcano**: 情熱的な赤・オレンジ・黒基調 (Light: 溶岩, Dark: 噴火口)
  - **Ocean**: 爽やかな青・水色・白基調 (Light: 浅瀬, Dark: 深海)
  - **Cyber**: 近未来的なネオンカラー・黒基調 (Light: デジタルホワイト, Dark: サイバーパンク)
- テーマの切り替えは即時に反映される。
- 設定は `localStorage` キー `squat-tracker-theme-style` に保存される。
- 既存の `light/dark` モード切り替えと独立して動作し、組み合わせが可能である。

### 2.2 サウンドスキン (Sound Skin)
- カウント音や効果音の基本波形を変更できる機能を提供する。
- 以下の波形タイプを選択可能とする。
  - **Triangle (Default)**: 柔らかく聞き取りやすい音 (既存)
  - **Sine**: 丸みのある純粋な音
  - **Square**: ファミコン風の8bitサウンド
  - **Sawtooth**: 鋭く力強い音
- 設定変更時にプレビュー音を再生する。
- 設定は `localStorage` キー `squat-tracker-sound-type` に保存される。
- `utils.js` 内の `playTone`, `beep`, `playCelebration` 関数がこの設定を参照して波形を変更する。

### 2.3 UI仕様
- **設定モーダル (#settings-modal)** 内に「テーマ設定」セクションを追加する。
- **スタイル選択**: ラジオボタンまたはセレクトボックスで実装。各テーマのプレビューアイコンを表示するとなお良い。
- **サウンド選択**: セレクトボックスで波形タイプを選択。選択時に「♪」ボタンでプレビュー可能にする。
- ヘッダーにある既存の `Theme Toggle` (Light/Dark切り替え) は維持し、選択中のスタイルの明暗を切り替える役割とする。

## 3. データ構造

### localStorage
- `squat-tracker-theme-style`: string (default: 'default')
- `squat-tracker-sound-type`: string (default: 'triangle')
- `squat-tracker-theme`: string ('light' | 'dark') - *既存*

### CSS変数 (例)
```css
[data-style="forest"] {
  --bg-main: #e8f5e9; /* Light Green */
  --accent-color: #2e7d32; /* Forest Green */
  /* ... other vars */
}
[data-style="forest"][data-theme="dark"] {
  --bg-main: #1b5e20; /* Dark Green */
  --accent-color: #a5d6a7; /* Light Green Accent */
}
```

## 4. エッジケース
- **スタイル未設定時**: `default` テーマを適用する。
- **サウンド未対応ブラウザ**: Web Audio API が使えない場合は変化なし（既存のエラーハンドリングに従う）。
- **ダークモードとの競合**: `data-theme="dark"` のスタイル定義よりも詳細度を高めるか、カスケード順序を考慮して `data-style` 定義を後に記述する。

## 5. テスト方針
- Playwright を使用して以下のシナリオをテストする。
  1. 設定モーダルを開き、スタイルを変更すると `body` の `data-style` 属性が変化すること。
  2. ページをリロードしても設定が保持されていること。
  3. サウンド設定を変更し、保存されること（音の出力確認は難しいので設定値のみ）。
