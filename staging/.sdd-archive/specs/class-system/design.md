# Design: Class System

## 1. データ構造 (`js/data/classes.json`)
クラス定義を配列で管理する。

```json
[
  {
    "id": "novice",
    "name": "冒険者",
    "description": "基本のクラス。補正なし。",
    "emoji": "🌱",
    "modifiers": {
      "attackMultiplier": 1.0,
      "quizMultiplier": 1.0,
      "criticalRateBonus": 0.0
    }
  },
  {
    "id": "warrior",
    "name": "戦士",
    "description": "力強い一撃でボスを圧倒する。",
    "emoji": "⚔️",
    "modifiers": {
      "attackMultiplier": 1.2,
      "quizMultiplier": 1.0,
      "criticalRateBonus": 0.0
    }
  },
  ...
]
```

## 2. モジュール設計 (`js/modules/class-manager.js`)
シングルトンオブジェクトとして実装し、状態管理を行う。

### プロパティ
- `classes`: クラス定義のリスト（Map or Array）
- `currentClassId`: 現在選択されているクラスID

### メソッド
- `init(classesData)`: データロードと初期状態復元。
- `getClasses()`: 全クラスリスト取得（UI用）。
- `getCurrentClass()`: 現在のクラスオブジェクト取得。
- `changeClass(classId)`: クラス変更と保存。
- `getModifiers()`: 現在のクラスの補正値を返す。
- `openModal()`: UI制御。

## 3. インテグレーション設計

### 3.1 初期化フロー (`js/app.js`)
1. `resource-loader` で `classes.json` をフェッチ。
2. `ClassManager.init(classesData)` を呼び出し。

### 3.2 バトル計算 (`js/app.js` -> `performAttack`)
```javascript
const classMods = ClassManager.getModifiers();
const totalAttackPower = (userBaseAp + weaponBonus + sessionAttackBonus) * classMods.attackMultiplier;
```
※ `RpgSystem.calculateDamage` は整数を受け取るため、倍率適用後に整数化が必要。あるいは `RpgSystem` 側で処理する。
現状 `RpgSystem.calculateDamage` は `(attackPower, isCritical)` を受け取る。
呼び出し元の `performAttack` で倍率を掛けてから渡すのが最も疎結合。

### 3.3 クイズ計算 (`js/app.js` -> `updateQuizAndTimerDisplay`)
```javascript
if (isCorrect) {
    if (quizMode === 'cooperative') {
        const classMods = ClassManager.getModifiers();
        const bonus = 1 * classMods.quizMultiplier; // 基本1点 * 倍率
        sessionAttackBonus += bonus;
    }
}
```

## 4. UI設計
### 4.1 エントリーポイント
ヘッダー部分（`.hero-panel` またはステータス表示部）に、現在のクラスアイコンを表示するバッジを追加。クリックでモーダルを開く。

### 4.2 モーダル (`#class-modal`)
- タイトル: "クラスチェンジ"
- グリッドレイアウトでクラスカードを表示。
- 各カード: アイコン、名前、説明、補正値（「攻撃力+20%」など）。
- 選択中クラスには `.active` クラスを付与。
- カードクリックで即時変更＆モーダル閉じる（または「決定」ボタン）。今回はシンプルにカードクリック＝決定とする（確認ダイアログなし）。

## 5. 永続化
- Key: `squat-tracker-class`
- Value: `classId` (string)
