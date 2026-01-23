# 設計書: データ外部化 (実績・武器)

## アーキテクチャ概要

`js/app.js` の初期化フローを変更し、最初に設定データ (`achievements.json`, `base-weapons.json`) をロードするフェーズを設ける。
ロードされたデータは、各サブシステム (`AchievementSystem`, `InventoryManager`) に注入（Inject）される。

## 1. データ構造設計

### 1.1 `js/data/achievements.json`
実績データを配列で定義する。条件 (`condition`) はオブジェクト形式で記述する。

```json
[
  {
    "id": "reps-100",
    "name": "スクワット初心者",
    "emoji": "🥉",
    "description": "累計100回",
    "condition": {
      "type": "TOTAL_REPS",
      "value": 100
    }
  },
  {
    "id": "consistency-3",
    "name": "三日坊主回避",
    "emoji": "🌱",
    "description": "3日連続達成",
    "condition": {
      "type": "STREAK",
      "value": 3
    }
  },
  {
    "id": "early-bird",
    "name": "早起きは三文の徳",
    "emoji": "☀️",
    "description": "午前4時〜8時に完了",
    "condition": {
      "type": "TIME_RANGE",
      "startHour": 4,
      "endHour": 8
    }
  }
]
```

#### 条件タイプ (`condition.type`) 定義
| Type | Parameters | Description |
| :--- | :--- | :--- |
| `TOTAL_REPS` | `value` (int) | 累計スクワット回数以上 |
| `STREAK` | `value` (int) | 連続ログイン日数以上 |
| `BOSS_KILLS` | `value` (int) | ボス討伐数以上 |
| `BOSS_COLLECTION` | `value` (int) | 討伐したボスの種類数以上 |
| `LEVEL` | `value` (int) | ユーザーレベル以上 |
| `SENSOR_MODE` | none | センサーモードが有効であること |
| `NO_PAUSE` | none | 一時停止なし (`hasPaused === false`) |
| `SETTING_VAL` | `key` (string), `operator` (<=, >=, ==), `value` (int) | 設定値の比較 |
| `SETTING_MATCH` | `key1`, `key2` | 2つの設定値が一致 (例: down == up) |
| `TIME_RANGE` | `startHour`, `endHour` | 現在時刻(時)が範囲内 (start <= h < end, or start <= h || h < end for overnight) |
| `WEEKEND` | none | 土曜日(6) または 日曜日(0) |
| `EVENT` | `name` (string) | 特定イベント通知時 (critical, theme_change 等) |

### 1.2 `js/data/base-weapons.json`
`BASE_WEAPONS` 定数の内容をそのまま JSON 化する。

```json
[
  { "id": "wood_sword", "name": "ひのきの棒", "emoji": "🪵", "baseAtk": 2, "weight": 50 },
  { "id": "club", "name": "こん棒", "emoji": "🦴", "baseAtk": 3, "weight": 40 },
  ...
]
```

## 2. モジュール変更

### 2.1 `js/modules/resource-loader.js` (新規)
汎用的な JSON ローダー。
```javascript
export async function loadJson(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (e) {
    console.error(`Failed to load ${url}`, e);
    return null; // or empty array []
  }
}
```

### 2.2 `js/modules/achievement-system.js`
*   `init(options)` メソッドを拡張し、`options.achievementsData` を受け取れるようにする。
*   内部の `defineBadges()` メソッドは、渡されたデータを使用するように変更。ハードコード部分は削除。
*   `check(triggerContext)` 内で条件判定を行う際、`badge.condition` オブジェクトを解析して判定する `evaluateCondition(condition, context)` メソッドを実装する。

**evaluateCondition ロジック例:**
```javascript
evaluateCondition(cond, ctx) {
  switch(cond.type) {
    case 'TOTAL_REPS':
      return computeStats(ctx.historyEntries).totalRepsAllTime >= cond.value;
    case 'SETTING_VAL':
       const val = parseInt(ctx.settings[cond.key]);
       if (cond.operator === '<=') return val <= cond.value;
       // ...
       return false;
    // ...
  }
}
```

### 2.3 `js/data/weapons.js`
*   `import { BASE_WEAPONS } ...` を削除。
*   `generateWeapons(baseWeaponsData)` のように引数を受け取る形に変更。
*   `WEAPONS` 定数の即時エクスポートをやめ、生成関数のみをエクスポートするか、アプリ側で生成して `InventoryManager` に渡す。

### 2.4 `js/app.js` (初期化フロー)
1.  `ResourceLoader.loadJson` で `achievements.json` と `base-weapons.json` を並行ロード。
2.  ロード完了後:
    *   `AchievementSystem.init({ achievementsData: ... })` を呼び出す。
    *   `generateWeapons(baseWeaponsData)` を呼び出して武器リスト生成。
    *   `InventoryManager.init(weaponsMap)` (要修正: InventoryManager が武器リストを受け取れるようにする) を呼び出す。
3.  ロード失敗時は、最低限のデフォルト値（空配列など）で起動し、エラーを Toast 表示する。

## 3. 影響範囲とリスク
*   **非同期初期化**: `app.js` のトップレベルで `await` は使えない可能性があるため（ターゲット環境による）、`initApp()` などの非同期関数でラップし、`DOMContentLoaded` で呼び出す。
*   **InventoryManager**: 現在 `js/data/weapons.js` から直接 `WEAPONS` をインポートしている箇所がある場合、依存関係の逆転（注入）が必要。
    *   確認: `InventoryManager` は `WEAPONS` を直接 import しているか？ -> している可能性が高い。
    *   対策: `InventoryManager.init()` で武器データを受け取るように変更する。

## 4. テスト方針
*   各条件タイプに対応する実績が正しく解除されるか、手動テストまたはユニットテストで確認。
*   JSON ファイルの構文エラー時にアプリが停止しないか確認。
