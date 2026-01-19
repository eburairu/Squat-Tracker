# 技術設計書: 装備ドロップ＆コレクション機能

## アーキテクチャ概要
既存の Singleton パターンを踏襲し、新たに `WeaponRegistry`（データ定義）と `InventoryManager`（状態管理）を導入する。
これらを `RpgSystem` および `BossBattle` と連携させ、戦闘ロジックと報酬システムを拡張する。
UIは既存の `index.html` にモーダルを追加し、Vanilla JS で制御する。

## 主要コンポーネント

### 1. WeaponRegistry (定数定義)
- **責務**: 全武器のマスターデータを管理する。
- **データ構造**:
  ```javascript
  const WEAPONS = {
    unarmed: { name: '素手', emoji: '✊', baseAtk: 0, rarity: 1, maxLevel: 1, atkPerLevel: 0, weight: 0 },
    wood_sword: { name: 'ひのきの棒', emoji: '🪵', baseAtk: 2, rarity: 1, maxLevel: 10, atkPerLevel: 1, weight: 50 },
    iron_sword: { name: '鉄の剣', emoji: '🗡️', baseAtk: 5, rarity: 2, maxLevel: 10, atkPerLevel: 2, weight: 30 },
    // ...他
  };
  ```

### 2. InventoryManager (Singleton)
- **責務**: ユーザーの所持武器、レベル、装備状態を管理し、永続化する。
- **データモデル (localStorage: squat-tracker-inventory)**:
  ```javascript
  {
    equippedId: 'unarmed',
    items: {
      'unarmed': { level: 1, acquiredAt: timestamp },
      'wood_sword': { level: 2, acquiredAt: timestamp }
    }
  }
  ```
- **メソッド**:
  - `init()`: ロードと初期化（初期データの保証）。
  - `addWeapon(weaponId)`: 武器追加またはレベルアップ。戻り値で結果（NEW/LEVEL_UP/MAX）を返す。
  - `equipWeapon(weaponId)`: 装備変更。
  - `getEquippedWeapon()`: 現在の武器オブジェクトと補正値を返す。
  - `getTotalAttackPower()`: 現在の攻撃力（基本AP + 武器AP）を計算するヘルパー。

### 3. BossBattle (拡張)
- **変更点**:
  - `handleDefeat()`: 討伐時に `InventoryManager` を介してドロップ処理を行う。
  - UI更新: ドロップ演出（Toast）の呼び出し。
  - UI追加: 装備モーダルを開くボタンのイベントハンドリング。

### 4. RpgSystem (拡張)
- **変更点**:
  - `calculateDamage()`: `InventoryManager.getEquippedWeapon().attack` を加算してダメージ算出する。

## 処理フロー

### ドロップフロー
1. `BossBattle.damage` で HP <= 0 になる。
2. `handleDefeat` が呼ばれる。
3. `InventoryManager.rollDrop()` (新規メソッド) を呼び出す。
   - 確率計算（今回は必ずドロップするか、一定確率か要調整。まずは 30% 程度で設定）。
   - 抽選された武器IDを `addWeapon(id)` する。
4. 結果に応じて通知を表示（「GET! ひのきの棒」「LEVEL UP! 鉄の剣」）。

### ダメージ計算フロー
1. スクワット検知 -> `performAttack`
2. `RpgSystem.calculateLevel` -> 基本AP算出。
3. `InventoryManager.getEquippedWeapon` -> 武器AP算出。
4. 合算して `BossBattle.damage` へ渡す。

## UI設計

### モーダル構成
- オーバーレイ (`.modal-overlay`)
- コンテンツ (`.modal-content`)
  - ヘッダー: 「装備一覧」
  - リスト (`.weapon-list`):
    - 各アイテム: アイコン、名前、Lv、攻撃力（+XX）、装備ボタン（または行クリック）。
    - 装備中のアイテムには `.equipped` クラス付与（「E」マーク表示）。
  - フッター: 「閉じる」ボタン

### 変更計画
- **index.html**: モーダルHTML、装備ボタン追加。
- **styles.css**: モーダル、リスト、ボタンのスタイル追加。
- **app.js**: `WeaponRegistry`, `InventoryManager` 実装、`BossBattle`, `RpgSystem` 修正。
