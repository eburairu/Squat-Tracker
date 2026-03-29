# 設計書: Active Recovery Mode (アクティブリカバリーモード)

## 1. コンポーネント構成
`js/modules/active-recovery.js` を新規作成し、`ActiveRecovery` クラス（モジュール）を実装する。

### 1.1 `ActiveRecovery` モジュールの責務
1. UIへのトグルスイッチ表示（`init()` によるDOM追加・イベントリスナー設定）。
2. リカバリーモードON/OFFの状態保持。
3. ON時の既存設定（`setCountInput`, `repCountInput` 等）の退避（Save）と、固定設定の適用、UIの `disabled` 制御。
4. OFF時の既存設定の復元（Restore）とUIの `disabled` 解除。
5. 外部システム（SmartPlanner, Presetなど）からのモード強制解除（`turnOff()`）。
6. リカバリーモード中であることを示すフラグの提供（`isActive()`）。

## 2. データ構造・状態管理
```javascript
class ActiveRecovery {
  static isActive = false;
  static savedSettings = null; // リカバリーモードをONにする直前の設定を保存するオブジェクト

  // 固定のリカバリー設定
  static readonly SETTINGS = {
    setCount: 1,
    repCount: 10,
    downDuration: 3,
    holdDuration: 2,
    upDuration: 3,
    restDuration: 30, // 1セットなので実質使用されないが安全のため
    countdownDuration: 5
  };
}
```

## 3. API / UI仕様
### UIの追加
`index.html` の `<div class="control-card">` 内、「ワークアウト設定」見出しの直下に「リカバリーモード」のスイッチを追加する。

```html
<div class="voice-controls" id="recovery-mode-control-group">
  <span class="label">リカバリーモード</span>
  <label class="switch">
    <input id="recovery-mode-toggle" type="checkbox" />
    <span class="slider"></span>
    <span id="recovery-mode-status" class="switch-label">OFF</span>
  </label>
</div>
<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem; margin-bottom: 1rem;">
  疲れた日用の超低負荷ストレッチメニュー（1セット10回、3-2-3テンポ）に固定します。
</p>
```

### 連携先モジュールの修正
`js/app.js` に対して以下の修正を行う。
1. **初期化**: `initApp()` の中で `ActiveRecovery.init()` を呼び出す。
2. **競合回避**: Smart Plannerの `onApply`, PresetManagerの `change` イベント, SchedulerManager の `applyScheduleSettings`, PlaylistManager のロード時など、外部から設定が変更されるタイミングで `ActiveRecovery.turnOff()` を呼び出す。
3. **履歴とクラスEXPの制御**:
   - `recordWorkout` の作成する History Entry に `isRecovery: ActiveRecovery.isActive()` を含める（将来の分析用）。
   - `finishWorkout` において、`ActiveRecovery.isActive()` が `true` の場合、`ClassManager.addExperience` の獲得EXPを大幅に減らす（例: `0` または微量）。今回はペナルティではなく「休養」なので、EXPを `0` にし、「リカバリーモードのため経験値は獲得できませんでした」などのToastを出す。

## 4. テスト方針 (`tests/active-recovery.spec.js`)
Playwrightを使用して以下のE2Eテストを実施する。
1. **UIトグルの動作確認**:
   - 初期状態はOFFであること。
   - ONにすると、設定フィールド（`#set-count` 等）が `disabled` になり、値が固定値（1セット10回、3-2-3）になること。
   - OFFにすると、元の値が復元され、`disabled` が解除されること。
2. **競合の解消**:
   - リカバリーモードをONにした状態で、Preset（マイ・メニュー）を変更すると、リカバリーモードが強制的にOFFになり、Presetの値が適用されること。
3. **セッション終了後の挙動**:
   - リカバリーモードでワークアウトを完了した際、通常通りStreakが維持される（`recordWorkout`が呼ばれる）こと。
   - 獲得経験値が `0` であること（ClassのEXPが増加していないこと）を確認する。
