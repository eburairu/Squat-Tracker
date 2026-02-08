# 計画: 装備マイセット（ロードアウト）機能

## 1. デザイン概要
本機能は、既存の `ClassManager`, `InventoryManager`, `TitleManager` の状態を統合管理する上位レイヤーとして実装する。
`LoadoutManager` モジュールを新設し、各マネージャーからの状態取得と状態設定を行う責務を持たせる。
UIは既存のモーダルシステムを踏襲し、ユーザーが直感的に操作できるようにする。

## 2. アーキテクチャ

### 2.1 モジュール構成
- **js/modules/loadout-manager.js**:
    - シングルトンオブジェクトとして実装。
    - `localStorage` との通信を担当。
    - 各マネージャーへのインターフェースを持つ。
    - UIレンダリングロジックを含む。

### 2.2 データフロー
1.  **保存時**:
    - `ClassManager.currentClassId`
    - `InventoryManager.state.equippedId`
    - `TitleManager.state.currentPrefix`, `TitleManager.state.currentSuffix`
    - これらを取得し、一つのオブジェクトとして `loadouts` 配列に追加して保存。

2.  **適用時**:
    - 選択された `loadout` オブジェクトからIDを取り出す。
    - `ClassManager.changeClass(id)`
    - `InventoryManager.equipWeapon(id)`
    - `TitleManager.equip(prefixId, suffixId)`
    - 各マネージャーの更新メソッドを呼び出し、装備を変更する。

### 2.3 UI設計
- **トリガー**:
    - ステータスパネル、または設定メニュー内に「マイセット」ボタンを配置。
    - アイコンは「フォルダ」または「リスト」のような形状を想定。
- **モーダル**:
    - タイトル: 「マイセット管理」
    - コンテンツ:
        - **新規保存エリア**: 現在の装備概要と「新規保存」ボタン。
        - **保存済みリスト**: 各リストアイテムに「適用」「削除」ボタン。
    - スタイル: 既存の `modal` クラスと `card` スタイルを流用。

## 3. 必要な変更
- **HTML**: `index.html` に `#loadout-modal` とトリガーボタンを追加。
- **CSS**: `styles.css` にマイセットリスト用のスタイルを追加。
- **JS**: `js/modules/loadout-manager.js` 新規作成。`js/app.js` で初期化。

## 4. 検証計画
- **単体テスト**: `LoadoutManager` のロジック（保存、取得、削除）をテスト。
- **統合テスト**: 実際にManagerをまたいで状態が変更されるかを確認（モックを使用）。
- **E2Eテスト**: Playwright を用いて、UI操作による保存と適用、リロード後の永続化を確認。
