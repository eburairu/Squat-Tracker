# 設計書: クラス・アクティブスキル

## 1. コンポーネント設計

### 1.1 SkillManager (`js/modules/skill-manager.js`)
シングルトンオブジェクトとして実装し、スキルの状態管理と効果計算を担う。

- **State**
  - `skillData`: 現在のセッションで使用可能なスキル情報（開始時にスナップショット）。
  - `isUsed`: そのセッションですでに使用したかどうかのフラグ。
  - `activeEffects`: 現在発動中の効果のリスト（セット単位の効果など）。

- **Methods**
  - `init()`: DOM要素のバインド。
  - `loadSkill(skillDef)`: ワークアウト開始時にクラスからスキル情報を読み込む。
  - `activate()`: スキルを発動する（UIから呼ばれる）。効果適用処理を呼び出す。
  - `reset()`: ワークアウト終了/リセット時に状態を初期化する。
  - `getAttackMultiplier()`: 現在の攻撃力倍率補正を返す（戦士スキル用）。
  - `shouldAutoWinQuiz()`: 次のクイズを自動正解すべきか判定する（魔法使いスキル用）。
  - `consumeQuizEffect()`: クイズ自動正解後にフラグを消費（オフ）にする。
  - `onSetFinished()`: セット終了時に呼ばれ、セット持続効果を終了させる。

### 1.2 データ構造 (`js/data/classes.json`)
既存のクラスオブジェクトに `skill` を追加。

```json
{
  "id": "warrior",
  ...,
  "skill": {
    "id": "power_surge",
    "name": "パワーサージ",
    "description": "このセット中、攻撃力1.5倍",
    "emoji": "💪",
    "type": "buff_attack_set",
    "value": 1.5
  }
}
```

### 1.3 UI設計
- **配置**: `.hero-panel` 内、`.stat-grid` の直下に配置。
- **コンポーネント**: `#skill-button-container` > `button#skill-trigger-button`
- **スタイル**:
  - 通常時: アクセントカラーのボーダー、クラスごとの絵文字。
  - 使用済み: グレーアウト (`disabled`, `opacity: 0.5`)。
  - 発動中: 点滅アニメーション (`.active-skill-effect`)。

## 2. 連携フロー

1. **初期化**: `app.js` の `initApp` で `SkillManager.init()` を呼ぶ。
2. **開始**: `startWorkout` で `ClassManager.getCurrentClass().skill` を取得し、`SkillManager.loadSkill()` に渡す。
3. **発動**: ユーザーがボタンを押すと `SkillManager.activate()` が走り、`isUsed` が `true` になる。トースト表示。
4. **攻撃時**: `performAttack` 内で `SkillManager.getAttackMultiplier()` を呼び、ダメージに乗算。
5. **クイズ時**: `updateQuizAndTimerDisplay` の `Phase.DOWN`（出題時）または `Phase.UP`（回答時）で `SkillManager.shouldAutoWinQuiz()` をチェック。
   - `true` なら、正解処理を強制実行し、`SkillManager.consumeQuizEffect()` を呼ぶ。
6. **セット終了**: `nextRepOrSet` でセットが変わる際、`SkillManager.onSetFinished()` を呼ぶ。

## 3. テスト方針
- Playwrightを使用。
- **シナリオ**:
  1. 戦士でスタート -> スキル発動 -> 攻撃ログを確認し、ダメージが1.5倍になっているか。
  2. 魔法使いでスタート -> スキル発動 -> クイズ画面で何もしなくても（またはどれを押しても）正解になるか。
  3. リセット後 -> スキルが再度使用可能になっているか。
