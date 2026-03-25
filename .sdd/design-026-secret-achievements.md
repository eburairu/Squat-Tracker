# シークレット実績機能 設計書

## 1. コンポーネント構成

本機能は既存の `AchievementSystem` モジュール（`js/modules/achievement-system.js`）を拡張して実現する。

- **データ層**: `js/data/achievements.json`
- **ロジック/UI層**: `js/modules/achievement-system.js`

## 2. データ構造

`js/data/achievements.json` の実績オブジェクトに `secret` フィールド（boolean）を追加する。
既存のデータにはこのフィールドは存在しないが、`undefined` は `false` と同等に扱う。

```json
{
  "id": "secret-night-owl",
  "name": "丑三つ時の挑戦",
  "emoji": "👻",
  "description": "午前2時〜3時に完了",
  "condition": {
    "type": "TIME_RANGE_OVERNIGHT",
    "startHour": 2,
    "endHour": 3
  },
  "secret": true
}
```

## 3. UI/API 仕様

### `AchievementSystem.render()` メソッドの改修

実績グリッドを描画するループ内で、対象のバッジをどのように表示するかを決定するロジックを修正する。

**変更前**:
```javascript
const emoji = createElement('div', { className: 'badge-emoji', textContent: badge.emoji });
const name = createElement('div', { className: 'badge-name', textContent: badge.name });
// alert(...) 内で badge.emoji, badge.name, badge.description を直接参照
```

**変更後**:
各実績を描画する際に以下の判定を行う。
1. 変数 `isUnlocked` が `false` かつ `badge.secret` が `true` の場合、一時変数（例: `displayEmoji`, `displayName`, `displayDesc`）にマスキング用の値（`❓`, `???`, `条件は秘密です`）を代入する。
2. それ以外の場合は、`badge.emoji`, `badge.name`, `badge.description` をそのまま使用する。
3. `createElement` および `alert` の構築には、決定した一時変数を使用する。

これにより、データソース（`this.badges`）自体の内容は変更されず、描画時のみ表示が切り替わる。

## 4. テスト方針

- **単体/E2Eテスト**: `tests/secret-achievements.spec.js` を新規作成する。
  - テスト用のシークレット実績データ（未達成状態）をモックとして注入する。
  - **検証1**: シークレット実績が実績グリッド上でアイコン「❓」、名前「???」として表示されていることを確認する。
  - **検証2**: 該当のシークレット実績をクリックした際のアラート内容が「条件は秘密です」となっていることを確認する。（またはダイアログモックでの検証）
  - **検証3**: 条件を満たして実績がアンロックされた後（`AchievementSystem.unlock` を発火など）、本来の名前とアイコンが正しく表示されることを確認する。
