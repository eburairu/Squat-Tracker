---
description: "コンボシステムの実装タスクリスト"
---

# タスク: コンボシステム

**入力**: `/specs/spec-009-combo-system/plan.md`
**前提条件**: plan.md, spec.md

## Phase 1: コンボ管理モジュール実装 (MVP)

- [ ] T001 `js/modules/combo-system.js` を作成し、`ComboSystem` クラスを定義する
    - [ ] `currentCombo`, `maxCombo` の状態管理
    - [ ] `increment()`, `reset()` メソッド
    - [ ] `getMultiplier()` メソッド
    - [ ] `init()` メソッド (DOM要素取得・生成)
- [ ] T002 コンボ数表示用のDOM要素を `index.html` に追加する
    - [ ] `<div id="combo-display">` を配置 (初期非表示)
- [ ] T003 `styles.css` にコンボ表示用のスタイルを追加する
    - [ ] コンボ数を目立たせるスタイル
    - [ ] アニメーション定義 (加算時のポップなど)

## Phase 2: ロジック統合

- [ ] T004 `js/app.js` で `ComboSystem.init()` を呼び出す
- [ ] T005 `js/app.js` の `nextRepOrSet` (Rep完了時) に `ComboSystem.increment()` を追加する
- [ ] T006 `js/app.js` の `pauseWorkout`, `resetWorkout` に `ComboSystem.reset()` を追加する
- [ ] T007 `js/app.js` の `updateQuizAndTimerDisplay` (クイズ判定時) にロジックを追加する
    - [ ] 正解時: コンボ継続（またはボーナス加算）
    - [ ] 不正解時: `ComboSystem.reset()`
- [ ] T008 `js/app.js` の `performAttack` にダメージボーナス計算を追加する
    - [ ] `ComboSystem.getMultiplier()` を利用

## Phase 3: テスト & 検証

- [ ] T009 `tests/combo-system.spec.js` を作成し、E2Eテストを実装する
    - [ ] コンボ加算テスト
    - [ ] 一時停止リセットテスト
    - [ ] クイズ不正解リセットテスト
    - [ ] ボーナス適用確認テスト
- [ ] T010 Playwright テストを実行し、パスすることを確認する

## Phase 4: 仕上げ

- [ ] T011 ドキュメント更新 (必要に応じて)
