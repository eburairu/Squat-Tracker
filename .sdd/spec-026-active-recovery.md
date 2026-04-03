# Active Recovery (休息日) モード

## 1. 目的

毎日継続的なトレーニング（スクワット）を行う上で、「今日は体調が悪い」「筋肉痛がひどい」「モチベーションが上がらない」といった日が必ず存在する。既存の仕様では、このような日にトレーニングを休むと `StreakGuardian` の連続記録が途切れ、ユーザーの継続意欲が大きく削がれるリスクがある。

本機能「Active Recovery Mode (アクティブリカバリーモード / 休息日モード)」の目的は、通常のトレーニングよりも極端に軽い負荷（例: 1セット 5回のみ、ゆっくり）を行うことで、「完全に休んでしまう」ことを防ぎつつ、ストリーク（連続記録）を維持させる救済措置を提供することである。これにより、ユーザーの挫折を防ぎ、健康的な習慣づくりを長期的にサポートする。

## 2. 機能要件

- **モードの切り替え**: UI上にトグルスイッチを追加し、ユーザーが Active Recovery モードの ON/OFF を切り替えられるようにする。
- **設定の強制上書き**:
  - モードが ON になった際、現在の設定（セット数、回数、テンポ等）を内部的に保持した上で、UI上の設定を「1セット」「5回」「しゃがむ3秒・キープ1秒・立つ2秒」など、非常に軽い負荷に強制的に変更する。
  - モードが OFF になった際、保持していた元の設定に復元する。
- **設定保存のバイパス**:
  - Active Recovery モード中の軽い設定が、デフォルト設定として `localStorage` に上書き保存される（`saveWorkoutSettings` による保存）のを防ぐ。
- **報酬と進捗の無効化**:
  - モード ON 状態でワークアウトを完了した場合、以下の処理をスキップする:
    - 経験値 (EXP) の獲得 (`ClassManager.addExperience`)
    - ボスへのダメージ (タワーモード等は除く、基本は通常バトルのダメージ無効化だが、仕様としてはEXPとミッション進捗にフォーカスする。※既存の実装に依存するが、`performAttack` 自体でダメージを出させない等も考えられる。今回は `finishWorkout` での恩恵スキップをメインとする)
    - デイリーミッションの進捗 (`DailyMissionSystem.check`)
    - ビンゴの進捗 (`BingoManager.checkProgress`)
    - 実績の解除チェック (`AchievementSystem.check`)
    - バディEXPの獲得 (`BuddyManager.addExp`)
- **ストリークの維持**:
  - モード ON 状態でワークアウトを完了しても、`recordWorkout` と `StreakGuardian.update` は正常に実行され、連続記録は維持（または更新）される。

## 3. UIの変更点

- `index.html` の `control-card` 内、音声コントロール関連のトグル群（例: `commentary-toggle` の直下）に「休息日モード (Active Recovery)」のトグルスイッチを追加する。

```html
<div class="voice-controls active-recovery-controls">
  <span class="label">休息日モード</span>
  <label class="switch">
    <input id="active-recovery-toggle" type="checkbox" />
    <span class="slider"></span>
    <span id="active-recovery-status" class="switch-label">OFF</span>
  </label>
</div>
```

## 4. 入出力仕様

- **入力**: `#active-recovery-toggle` の `change` イベント。
- **状態管理**: `ActiveRecovery` モジュール内で `isActive` フラグと `savedSettings` (元の設定を保持するオブジェクト) を管理する。
- **出力**:
  - UI 上の設定入力フィールド (`#set-count`, `#rep-count` 等) の値の書き換え。
  - ワークアウト完了時の各種関数（`AchievementSystem.check` 等）の実行可否。

## 5. エッジケースと失敗時の挙動

- **モード切替時の未保存設定の喪失**: ユーザーが設定を変更し、保存する前に Active Recovery を ON にした場合、OFF にしたときに直前の未保存設定が復元されるように、`change` イベント発火時の現在の UI 値を保存・復元する。
- **ブラウザリロード**: Active Recovery モードの状態は揮発性（メモリ上のみ）で構わない。リロード時は OFF となり、ローカルストレージから通常のデフォルト設定が読み込まれる。
- **ダメージ計算について**: 今回は `finishWorkout` 完了時の報酬（EXP, ミッション）を無効化する。もし各レップごとの `performAttack` でボスにダメージを与えたくない場合は、`ActiveRecovery.isActive` で `performAttack` のダメージを 0 にするなどの措置も可能だが、要件としては「報酬が得られない」ことが主眼のため、`finishWorkout` での制御を必須とする。

## 6. テスト方針

- UI トグルが存在し、切り替えることで設定入力値（セット数、回数など）が期待通りに変化し、再度切り替えると元に戻ることを確認する。
- Active Recovery モードでワークアウトを完了した際、通常なら進捗するはずのミッションや EXP が増加しないことを確認する。
- ストリークが途切れず、履歴が追加されていることを確認する。
- Playwright を用いて `tests/active-recovery.spec.js` として実装する。
