# 実装計画書: コンボシステム

**ブランチ**: `feat/combo-system` | **日付**: 2024-05-24 | **仕様書**: `.specify/specs/spec-009-combo-system/spec.md`
**入力**: `/specs/spec-009-combo-system/spec.md` の機能要件

## 概要

トレーニングのリズム維持とクイズ正解に対するインセンティブとして「コンボシステム」を導入する。
連続して正しく動作（Rep完了）および正解を続けることでコンボ数が加算され、攻撃力ボーナスやテンション上昇が得られる。
一時停止や不正解でリセットされる緊張感により、ユーザーの集中力を高める。

## 技術コンテキスト

**言語/バージョン**: JavaScript (ES6+), HTML5, CSS3
**主要依存関係**: なし (Vanilla JS)
**ストレージ**: N/A (セッションごとの一時的な状態)
**テスト**: Playwright (E2E)
**ターゲットプラットフォーム**: Modern Browsers
**プロジェクトタイプ**: Web Application
**パフォーマンス目標**: UI更新が遅延なく行われること (即時反映)
**制約**: 既存の `WorkoutTimer` や `RpgSystem` と競合しない設計
**規模/範囲**: 新規モジュール `ComboSystem` の追加と `app.js` への統合

## 憲法 (Constitution) チェック

- 言語設定: 日本語 (OK)
- Spec-Driven Development: 仕様書作成済み (OK)
- テスト駆動開発: E2Eテスト計画済み (OK)
- コミット規約: Conventional Commits 遵守 (OK)
- 既存仕様の尊重: 既存のUIレイアウトを壊さない (OK)

## プロジェクト構造

### ドキュメント

```text
specs/spec-009-combo-system/
├── plan.md              # 本ファイル
├── spec.md              # 機能仕様書
└── tasks.md             # タスクリスト
```

### ソースコード

```text
js/
├── app.js               # エントリーポイント (統合)
├── modules/
│   └── combo-system.js  # 新規: コンボ管理モジュール
```

tests/
├── combo-system.spec.js # 新規: E2Eテスト

## 実装の詳細

### 1. ComboSystem モジュール (`js/modules/combo-system.js`)
- **状態**: `currentCombo` (現在値), `maxCombo` (最大値)
- **メソッド**:
    - `increment()`: コンボ加算。ボーナス計算しUI更新。
    - `reset()`: コンボリセット。UI更新。
    - `getMultiplier()`: 現在の攻撃力倍率を取得 (例: 1 + combo * 0.01)。
    - `updateUI()`: DOM要素 (`#combo-display`) の更新。
    - `initialize()`: DOM要素の生成と初期化。

### 2. UI統合 (`index.html`, `styles.css`)
- **HTML**: `#combo-display` コンテナを追加（動的生成も可だが、今回は既存の `.phase-container` 付近に配置）。
- **CSS**: コンボ数を目立たせるスタイル、アニメーション（加算時にポップするなど）。

### 3. ロジック統合 (`js/app.js`)
- **初期化**: `ComboSystem.init()` を `initApp` で呼び出し。
- **加算トリガー**:
    - `nextRepOrSet` 内で `ComboSystem.increment()` を呼び出し（Rep完了時）。
    - クイズ正解時 (`updateQuizAndTimerDisplay` の `Phase.UP` ブロック内) に `ComboSystem.increment()`（または維持）。
        - *仕様調整*: Rep完了時とクイズ正解時が重複しないように注意。「Rep完了 = スクワット1回成功」としてカウントするのが自然。クイズは「正解なら継続、不正解ならリセット」の役割とする。
- **リセットトリガー**:
    - `pauseWorkout` で `ComboSystem.reset()`。
    - `resetWorkout` で `ComboSystem.reset()`。
    - クイズ不正解時に `ComboSystem.reset()`。
- **ボーナス適用**:
    - `performAttack` 内で `ComboSystem.getMultiplier()` を使用して攻撃力を補正。
    - 特定コンボ数到達時に `TensionManager.add()` を呼び出し。

## 複雑性の追跡

特になし。標準的なモジュール追加パターンに従う。
