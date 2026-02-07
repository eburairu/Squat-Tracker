# 技術設計書: クラス・マスタリー

## 1. データ構造

### localStorage
`squat-tracker-class-mastery`:
```json
{
  "novice": 120,
  "warrior": 500,
  "mage": 0
}
```

### ClassManager 内部状態
```javascript
this.masteryData = {
  // classId: exp
};
```

## 2. 定数定義
レベル計算ロジックのための定数。
```javascript
const MASTERY_THRESHOLDS = [
  0,    // Lv1
  100,  // Lv2
  300,  // Lv3
  600,  // Lv4
  1000, // Lv5
  1500, // Lv6
  2100, // Lv7
  2800, // Lv8
  3600, // Lv9
  4500  // Lv10 (MAX)
];
```

## 3. ClassManager API拡張

*   `loadMasteryData()`: 初期化時にロード。
*   `addExperience(classId, amount)`:
    *   現在のEXPを取得。
    *   加算。
    *   旧レベルと新レベルを比較。
    *   レベルアップしていれば `{ leveledUp: true, newLevel: 5 }` などを返す。
    *   保存。
*   `getLevel(exp)`: EXPからレベルを算出するヘルパー。
*   `getExpProgress(exp)`: 次のレベルまでの進捗率（0.0 - 1.0）と残りEXPを計算。
*   `getModifiers(classId = currentClassId)`:
    *   既存の `getModifiers` をラップまたは変更。
    *   基本Modifiersを取得後、`getLevel(classId)` でレベルを取得し、ボーナスを加算して返す。

## 4. UI実装方針
*   `renderList()` メソッド内で HTML 生成ロジックを変更。
*   既存の `class-card` 内に `mastery-info` コンテナを追加。
*   CSS Grid または Flexbox でレイアウト調整。

## 5. テスト計画
*   `localStorage` が空の状態からの開始。
*   EXP加算と永続化の確認。
*   レベルアップ計算の正確性（境界値テスト）。
*   Modifierへの反映確認。
