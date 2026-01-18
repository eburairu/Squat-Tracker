# 設計書

## アーキテクチャ
- `app.js` 内に `PresetManager` クラスを作成し、プリセットのCRUDロジックを集約する。
- UI操作は既存のイベントリスナー設定パターンに従う。

## データ構造
LocalStorage Key: `squat-tracker-presets`
Value (JSON):
```json
[
  {
    "name": "ノーマル",
    "settings": {
      "setCount": 3,
      "repCount": 10,
      "downDuration": 2,
      "holdDuration": 1,
      "upDuration": 1,
      "restDuration": 30,
      "countdownDuration": 5
    }
  },
  ...
]
```

## UI設計
`index.html` の `workout-card` (設定カード) 内に「マイ・メニュー」セクションを追加。

```html
<div class="control-group preset-group">
  <label class="preset-label">
    マイ・メニュー
    <div class="preset-actions">
      <select id="preset-select" aria-label="プリセット選択">
        <option value="">-- 選択してください --</option>
        <!-- options generated dynamically -->
      </select>
      <button id="save-preset-button" class="ghost small" title="現在の設定を保存">保存</button>
      <button id="delete-preset-button" class="ghost small delete-btn" title="選択中のプリセットを削除">削除</button>
    </div>
  </label>
</div>
```
※ 「読込」ボタンは省略し、セレクトボックス変更(`change` イベント)で即時反映することでUIをスッキリさせる。

## CSS
- `.preset-actions` : flexbox で並べる。
- `.small` : ボタンのpaddingを小さくする。
- `.delete-btn` : 警告色にする。

## 実装ステップ
1. **Tests**: `tests/presets.spec.js` を作成し、CRUD操作とUI反映のE2Eテストを記述。
2. **HTML/CSS**: `index.html`, `styles.css` を更新。
3. **JS**: `app.js` に `PresetManager` 実装、初期化処理、イベントリスナー追加。

## ロジック詳細
- `initializePresets()`:
  - LocalStorageから読み込み。なければデフォルト作成して保存。
  - セレクトボックスのオプション生成。
- `savePreset()`:
  - `prompt` で名前入力させる。
  - 入力がなければキャンセル。
  - 既存と同名なら上書き（確認なし、またはシンプルな確認）。
  - 保存後、セレクトボックス再生成し、そのプリセットを選択状態にする。
- `deletePreset()`:
  - 選択中の値が空なら何もしない。
  - `confirm` で確認。
  - 削除後、セレクトボックス再生成し、空選択に戻す。
- `onPresetChange()`:
  - 選択されたプリセットの設定を `input` 要素に反映。
  - `validateInput` と `updateStartButtonAvailability` を呼び出して整合性を保つ。
  - 反映時に `change` イベントを発火させるか、手動で `saveWorkoutSettings` を呼んで「現在の設定」として記憶させる。
