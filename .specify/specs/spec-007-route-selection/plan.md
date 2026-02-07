# 設計書: アドベンチャーモード「ルート選択」機能

## 1. モジュール設計

### 1.1 AdventureSystem (`js/modules/adventure-system.js`)

#### 定数定義
```javascript
const ROUTES = {
  NORMAL: {
    id: 'normal',
    name: '王道',
    emoji: '🛡️',
    description: 'バランスの取れた標準的なルート',
    modifiers: { hp: 1.0, exp: 1.0, drop: 1.0 },
    styleClass: 'route-normal'
  },
  HARD: {
    id: 'hard',
    name: '修羅の道',
    emoji: '🔥',
    description: '敵は強いが見返りも大きい',
    modifiers: { hp: 1.5, exp: 1.5, drop: 1.2 },
    styleClass: 'route-hard'
  },
  EASY: {
    id: 'easy',
    name: '裏道',
    emoji: '🍀',
    description: '敵は弱いが実入りは少ない',
    modifiers: { hp: 0.8, exp: 0.8, drop: 1.0 },
    styleClass: 'route-easy'
  }
};
```

#### State拡張
```javascript
let state = {
  currentAreaIndex: 0,
  currentNodeIndex: 0,
  // 新規追加
  currentRouteId: 'normal',
  routeModifiers: { hp: 1.0, exp: 1.0, drop: 1.0 }
};
```

#### 新規メソッド
- `showRouteSelection()`: ルート選択モーダルを表示する。
- `selectRoute(routeId)`:
    - 指定されたIDのルート情報をstateに保存。
    - モーダルを閉じる。
    - `save()` を呼ぶ。
    - `notifyChange()` を呼ぶ。
- `getRouteModifiers()`: 現在の `state.routeModifiers` を返す。
- `checkRouteSelectionNeeded()`:
    - エリア開始時（`currentNodeIndex === 0`）かつ、まだルート選択が未完了（フラグ管理またはフロー制御で対応）の場合に `showRouteSelection()` を呼ぶ。
    - ※ 今回はシンプルに `advance()` でエリアが変わったタイミングで呼ぶ形式にする。

#### 既存メソッド改修
- `advance()`:
    - エリアクリア判定（`currentNodeIndex >= total`）時に `currentAreaIndex` をインクリメントした後、**直ちにモンスターをスポーンさせるのではなく**、ルート選択を挟むように制御フローを変更する必要がある。
    - しかし `BossBattle` との結合度を下げたい。
    - 戦略: `advance()` はあくまで進行状態を返す。呼び出し元（`BossBattle`）で「エリアが変わったならルート選択を出す」制御をするのは複雑。
    - 代案: `AdventureSystem` が主体でモーダルを出し、選択完了コールバックで `BossBattle` に通知する？ -> 相互参照になる。
    - 採用案: `BossBattle` は `spawnMonster` 前に `AdventureSystem.isRouteSelectionPending()` をチェックする？ いや、UIフローとして分断させたい。
    - **決定**: `BossBattle.handleDefeat` 内で `AdventureSystem.advance()` を呼んだ戻り値 `areaCleared` が `true` の場合、`AdventureSystem.showRouteSelection()` を呼び出し、選択完了後に `BossBattle` のスポーン処理を再開させるコールバックを渡す形にする。

### 1.2 BossBattle (`js/modules/boss-battle.js`)

#### 既存メソッド改修
- `spawnMonster()`:
    - `AdventureSystem.getRouteModifiers()` を取得。
    - `maxHp` 計算時に `modifiers.hp` を乗算する。
- `handleDefeat()`:
    - `AdventureSystem.advance()` の戻り値をチェック。
    - `areaCleared: true` の場合、即時リスポーン（`setTimeout`）をキャンセルし、`AdventureSystem.showRouteSelection(() => this.spawnMonster(true))` のようにコールバックを渡して委譲する。

## 2. UI設計

### 2.1 HTML (`index.html`)
```html
<div id="route-selection-modal" class="modal" aria-hidden="true" style="display: none;">
  <div class="modal-overlay" tabindex="-1"></div>
  <div class="modal-container route-selection-container">
    <div class="modal-header">
      <h2 class="modal-title">運命の分かれ道</h2>
    </div>
    <div class="modal-body">
      <p class="route-prompt">進む道を選択してください</p>
      <div class="route-cards">
        <!-- JSで動的生成 -->
      </div>
    </div>
  </div>
</div>
```

### 2.2 CSS (`styles.css`)
- `.route-selection-container`: 幅広のモーダル。
- `.route-cards`: Flexboxで横並び（スマホは縦並び）。
- `.route-card`: カード状のデザイン。ホバーで強調。
- `.route-card.route-hard`: 赤系。
- `.route-card.route-normal`: 青/緑系。
- `.route-card.route-easy`: 黄/パステル系。

## 3. データフロー

1. ユーザーがボスを撃破 -> `BossBattle.handleDefeat()`
2. `AdventureSystem.advance()` 実行 -> エリア進行
3. If エリアクリア:
    - `BossBattle` はリスポーンタイマーをセットせず、`AdventureSystem.showRouteSelection(onComplete)` を呼ぶ。
    - UI: ルート選択モーダル表示。
    - ユーザーが選択 -> `AdventureSystem.selectRoute(id)`
    - `state` 更新 -> LocalStorage 保存
    - `onComplete` コールバック実行 -> `BossBattle.spawnMonster()`
4. If エリア継続:
    - 通常通りリスポーンタイマーセット -> `spawnMonster()`

5. `spawnMonster()` 内部:
    - `AdventureSystem.getRouteModifiers()` を参照。
    - HP = BaseHP * Scaling * **Modifier.hp**
    - モンスター生成。
