# 設計書: 戦績シェアカード生成機能

**ドキュメントID**: `share-card-design`
**関連仕様**: `share-card-generator`

## 1. アーキテクチャ概要

### モジュール構成
新規モジュール `js/modules/share-manager.js` を作成し、シェア機能に関するロジックを集約する。

- **責務**:
  - シェア用モーダルの表示・非表示管理
  - 戦績データのDOMへのバインディング
  - `html2canvas` を使用したDOMの画像化
  - 画像ファイルのダウンロード処理
- **依存モジュール**:
  - `InventoryManager`: 武器情報の取得
  - `TitleManager`: 称号情報の取得
  - `RpgSystem`: ボス情報の取得
  - `html2canvas` (Vendor Library): 画像生成エンジン

### データフロー
1. `WorkoutTimer` がトレーニング完了時に `ShareManager.open(resultData)` を呼び出す。
2. `ShareManager` は必要な追加情報（現在の武器、称号等）を各マネージャーから取得・結合する。
3. `ShareManager` はDOM (`#share-card-target`) にデータを描画する。
4. ユーザーが「保存」ボタンを押すと、`html2canvas` が `#share-card-target` をキャプチャする。
5. 生成されたBase64画像データをBlobに変換し、`<a>` タグ生成経由でダウンロードさせる。

## 2. UI/DOM設計

### HTML構造
動的に以下の構造を `body` 末尾（または `#modal-container`）に注入、あるいは静的に `index.html` に配置する（今回はJSによる動的生成を採用し、依存性を下げる）。

```html
<div id="share-modal" class="modal" aria-hidden="true">
  <div class="modal-overlay"></div>
  <div class="modal-content share-modal-content">
    <div class="modal-header">
      <h2>戦績シェア</h2>
      <button class="close-btn">&times;</button>
    </div>

    <!-- キャプチャ対象エリア -->
    <!-- 固定幅（例: 600px）でレイアウトし、画面上では transform: scale() で縮小表示する -->
    <div class="share-preview-container">
      <div id="share-card-target" class="rpg-card">
        <div class="card-header">
          <span class="app-name">Squat Quest</span>
          <span class="date">2024.05.23</span>
        </div>
        <div class="card-hero">
           <!-- ボス画像または背景 -->
           <img src="..." class="boss-image" />
        </div>
        <div class="card-stats">
          <div class="stat-row">
            <span class="label">TOTAL REPS</span>
            <span class="value">150</span>
          </div>
          <div class="stat-row">
            <span class="label">CALORIES</span>
            <span class="value">45 kcal</span>
          </div>
        </div>
        <div class="card-equipment">
          <div class="weapon-info">
             <span class="icon">🗡️</span>
             <span class="name">エクスカリバー (UR)</span>
          </div>
          <div class="title-info">
             <span class="badge">Title</span>
             <span class="name">不屈の勇者</span>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button id="share-download-btn" class="btn primary">画像を保存</button>
    </div>
  </div>
</div>
```

### スタイリング戦略 (CSS)
- `#share-card-target`:
  - `width: 600px` (固定)
  - `background`: RPG風のテクスチャまたはダークグラデーション
  - `color`: 白 (#ffffff)
  - フォント: ゲームライクなフォント指定
- `.share-preview-container`:
  - モーダル内でこのコンテナを配置し、JavaScriptでウィンドウ幅に応じて `transform: scale(...)` を適用し、画面からはみ出さないようにする。
  - これにより、スマホでもPCでも「600px幅のカード」の縮小版がきれいに見える。

## 3. ライブラリ利用方針

### html2canvas
- **配置**: `js/vendor/html2canvas.min.js`
- **読み込み**: `js/app.js` で動的に `<script>` タグを生成してロードするか、`index.html` に記述。今回は `app.js` 初期化時にロード確認を行う。
- **設定**:
  - `scale`: 2 (Retina対応のため高解像度で出力)
  - `useCORS`: true (ローカル画像等の読み込みトラブル防止)
  - `backgroundColor`: null (透明背景を許可、ただしカード自体に背景色をつける)

## 4. エラーハンドリング
- 画像生成失敗時: `catch` ブロックで捕捉し、`showToast` でユーザーに通知する。
- ライブラリ未ロード時: ボタンを押した時点でロードを試みるか、エラーを表示する。
