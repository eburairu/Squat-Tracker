# 実装タスク: 称号・二つ名システム

## Phase 1: データ層実装
- [ ] `js/data/titles.json` の作成
    - [ ] 初期データとして複数のPrefix/Suffixを定義
- [ ] `js/data/achievements.json` の更新
    - [ ] 各実績に対して `rewards` フィールドを追加し、適切なPrefix/Suffixを割り当て

## Phase 2: ロジック層実装 (Core)
- [ ] `js/modules/title-manager.js` の作成
    - [ ] `TitleManager` オブジェクトの定義
    - [ ] `data`, `state` プロパティの初期化
    - [ ] `init(data)` メソッド実装（データのロード）
    - [ ] `load()` / `save()` メソッド実装（localStorage操作）
    - [ ] `unlock(prefixId, suffixId)` メソッド実装（重複チェック含む）
    - [ ] `equip(prefixId, suffixId)` メソッド実装
    - [ ] `getFullTitle()` ヘルパーメソッド実装（現在の称号文字列生成）

## Phase 3: Integration
- [ ] `js/app.js` の更新
    - [ ] `js/data/titles.json` の非同期ロード (`loadJson`)
    - [ ] `TitleManager.init()` の呼び出し
- [ ] `js/modules/achievement-system.js` の更新
    - [ ] `check()` メソッド内で実績解除時に `rewards` をチェック
    - [ ] `TitleManager.unlock()` の呼び出し
    - [ ] 解除時のトースト通知に獲得した称号を含める

## Phase 4: UI層実装
- [ ] `index.html` の更新
    - [ ] ヘッダーの `.eyebrow` 要素に `id="user-title-display"` を付与
    - [ ] 称号設定用モーダルのHTMLを追加（`#title-modal`）
    - [ ] 実績タブ内（`#tab-achievements`）に「称号設定」ボタンを追加（`#open-title-settings`）
- [ ] `js/modules/title-manager.js` のUIロジック追加
    - [ ] `updateDisplay()` 実装（ヘッダーのDOM更新）
    - [ ] `openSettingsModal()` 実装（モーダル表示、リスト生成）
    - [ ] モーダル内のイベントハンドリング（選択、保存、閉じる）

## Phase 5: 検証・テスト
- [ ] E2Eテスト (`tests/title-system.spec.js`) の作成
    - [ ] アプリロード時にデフォルト称号が表示されるか
    - [ ] 実績解除で新しい称号がアンロックされるか
    - [ ] 設定モーダルで称号を変更し、ヘッダーに反映されるか
    - [ ] リロードしても称号が維持されるか
