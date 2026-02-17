# Spec 013: 称号シナジー (Title Synergy)

## 概要
ユーザーが特定の「形容詞 (Prefix)」と「名詞 (Suffix)」の組み合わせで称号を設定した際に、特別なステータスボーナス（シナジー効果）が発動する機能を追加する。

## 目的
- 称号収集のモチベーション向上（単なる飾りからの脱却）
- ユーザーによる組み合わせ探索の楽しみ（ビルド構築）を提供
- RPG要素の強化

## データ構造

### `js/data/title-synergies.json`

```json
[
  {
    "id": "syn_legendary_hero",
    "name": "伝説の英雄",
    "condition": {
      "prefix": "p_legendary",
      "suffix": "s_hero"
    },
    "effect": {
      "type": "attack_multiplier",
      "value": 0.2,
      "description": "攻撃力 +20%"
    }
  },
  {
    "id": "syn_muscle_warrior",
    "name": "筋肉戦士",
    "condition": {
      "prefix": "p_muscle",
      "suffix": "s_warrior"
    },
    "effect": {
      "type": "exp_multiplier",
      "value": 0.1,
      "description": "経験値 +10%"
    }
  }
]
```

## ロジック仕様

### 1. TitleManager
- `init(titlesData, synergiesData)`: シナジーデータを受け取り内部状態に保持する。
- `getActiveSynergy()`: 現在設定されている `currentPrefix` と `currentSuffix` に一致するシナジーオブジェクトを返す（なければ `null`）。
- `getSynergyModifiers()`: 発動中のシナジー効果を、`ClassManager` が解釈可能な形式（例: `{ attackMultiplier: 0.2 }`）で返す。

### 2. ClassManager
- `getModifiers()`:
  - 既存のクラス補正、スキルツリー補正に加え、`TitleManager.getSynergyModifiers()` の値を加算する。
  - 補正値は加算方式とする（例: クラス1.0 + シナジー0.2 = 1.2倍）。

### 3. App Entry Point (`app.js`)
- `title-synergies.json` をロードし、`TitleManager` 初期化時に渡す。

## UI仕様

### 称号設定モーダル (`#title-modal`)
- プレビューエリアの下に「発動シナジー」表示エリアを追加する。
- シナジーが発動している場合：
  - シナジー名と効果説明を表示する。
  - 特別なエフェクト（文字色変更やアイコンなど）を付与する。
- シナジーが発動していない場合：
  - 何も表示しない、または「シナジーなし」と表示（今回は非表示とする）。

## テストシナリオ
1. **データロード**: アプリ起動時にシナジーデータが正しくロードされること。
2. **発動判定**: 指定の称号を装備した際、`TitleManager.getActiveSynergy()` が正しいデータを返すこと。
3. **ステータス反映**: シナジー発動時、`ClassManager.getModifiers()` の戻り値（攻撃力倍率など）が上昇していること。
4. **UI表示**: 称号変更時、モーダル内にシナジー名が表示されること。
