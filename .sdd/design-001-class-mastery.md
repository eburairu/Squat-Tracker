# 設計書: クラス・マスタリー・ツリー (Class Mastery Tree)

## 1. モジュール構成

### 1.1 ClassManager (拡張)
既存の `ClassManager` モジュールを拡張し、以下の責務を追加する。

- **SP計算**: 現在のEXPから算出されるレベルに基づき、総獲得SPを計算する。
- **消費SP計算**: 解放済みノードのコスト合計を計算する。
- **残りSP計算**: 総獲得SP - 消費SP。
- **ノード解放**: ノードIDを受け取り、条件チェック後に `unlockedNodes` 配列に追加して保存する。
- **ステータス補正計算 (`getModifiers`)**:
  - 従来のレベル補正に加え、解放済みノードの効果を加算して返す。
- **データマイグレーション**: `loadMasteryData` 時に旧形式（数値）を検知した場合、新形式（オブジェクト）に変換する。

## 2. データモデル

### 2.1 classes.json (拡張)
各クラス定義に `skillTree` プロパティを追加する。

```json
{
  "id": "warrior",
  // ...既存プロパティ
  "skillTree": [
    {
      "id": "w_atk_1",
      "name": "剛腕 I",
      "description": "攻撃力が5%上昇",
      "tier": 1,
      "cost": 1,
      "position": { "row": 1, "col": 2 }, // UI配置用グリッド座標 (row: 1-4, col: 1-3)
      "prerequisites": [],
      "effect": {
        "type": "stat_boost",
        "target": "attackMultiplier",
        "value": 0.05
      }
    },
    {
      "id": "w_crt_1",
      "name": "急所狙い I",
      "description": "クリティカル率が2%上昇",
      "tier": 2,
      "cost": 1,
      "position": { "row": 2, "col": 1 },
      "prerequisites": ["w_atk_1"],
      "effect": {
        "type": "stat_boost",
        "target": "criticalRateBonus",
        "value": 0.02
      }
    }
    // ... 他ノード
  ]
}
```

### 2.2 localStorage データ構造
キー: `squat-tracker-class-mastery`

```json
{
  "warrior": {
    "exp": 1200,
    "unlockedNodes": ["w_atk_1"]
  },
  "mage": {
    "exp": 500,
    "unlockedNodes": []
  }
}
```

## 3. ロジック詳細

### 3.1 SP計算式
- `Level = getLevel(exp)`
- `TotalSP = Math.max(0, Level - 1)`
- `UsedSP = unlockedNodes.reduce((sum, nodeId) => sum + getNode(nodeId).cost, 0)`
- `AvailableSP = TotalSP - UsedSP`

### 3.2 ノード解放フロー (`unlockNode(classId, nodeId)`)
1. クラスIDとノードIDの妥当性チェック。
2. 既に解放済みなら終了。
3. `AvailableSP` がノードのコスト以上かチェック。
4. `prerequisites`（前提ノード）が全て `unlockedNodes` に含まれているかチェック。
5. 全てクリアなら `unlockedNodes` に追加し、`saveMasteryData()` を呼ぶ。
6. UI更新イベントを発火、またはコールバックを実行。

### 3.3 ステータス補正 (`getModifiers(classId)`)
1. ベース補正値を取得（クラス定義より）。
2. レベルボーナスを加算（既存ロジック）。
3. `unlockedNodes` をループし、各ノードの `effect` を適用。
   - `attackMultiplier`: 加算
   - `quizMultiplier`: 加算
   - `criticalRateBonus`: 加算
4. 最終的な補正値を返す。

## 4. UI設計

### 4.1 モーダル構成
`#class-modal` の内部構造を変更し、タブ切り替えを導入する。

```html
<div class="modal-header">
  <h2>クラス詳細</h2>
  <div class="modal-tabs">
    <button class="tab-btn active" data-target="class-list">クラス選択</button>
    <button class="tab-btn" data-target="skill-tree">スキルツリー</button>
  </div>
</div>
<div class="modal-body">
  <div id="class-list-view" class="view active">...</div>
  <div id="skill-tree-view" class="view">
    <div class="sp-display">残りSP: <span id="sp-value">0</span></div>
    <div class="tree-container">
      <!-- Grid Layout for Nodes -->
    </div>
    <div id="node-detail-panel" class="node-detail-panel">
       <!-- Selected Node Details -->
    </div>
  </div>
</div>
```

### 4.2 ツリー表示
- CSS Grid を使用し、3列 x 4行 程度のグリッドを作成。
- `position: { row, col }` に基づきノードを配置。
- ノード間を繋ぐ線（コネクタ）は、CSSの `::before` / `::after` または SVG で簡易的に描画する（今回は簡易実装として、親ノードの色を変える等で表現）。

## 5. テスト方針
- **単体テスト**: `tests/class-mastery.spec.js`
  - データ移行ロジックの検証
  - SP計算の正確性
  - 前提条件チェックのロジック
  - ステータス補正の加算検証
- **E2Eテスト**: `tests/class-mastery-ui.spec.js`
  - モーダル操作
  - ノード解放によるステータス変化（UI表示含む）
  - リロード後の状態保持
