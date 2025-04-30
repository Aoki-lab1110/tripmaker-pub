# 新旧UI要素対応表（shinkyuu_taiouhyou.md）

| 機能・画面要素 | tripmaker_old（旧UI: index.html等） | tripmaker-responsive-unified.html（新UI: bunkai） |
|:---|:---|:---|
| 旅行タイトル表示 | `id="currentTripName"` | `id="current-trip-name"`（PC）、`class="trip-title"`（モバイル） |
| 場所検索入力 | `id="headerSearchInput"` | `id="search-places-input"` |
| 検索追加ボタン | `id="headerAddPlaceBtn"` | 検索横の追加ロジックに内包 |
| 予定追加 | `id="addPlaceBtn"` | `id="add-schedule-btn"` |
| URL共有 | `id="generateShareUrl"` | `id="share-url-btn"` |
| Google Mapで開く | `id="googleMapTransferBtn"` | 選択アクションバーの「Google Mapsで開く」ボタン |
| 地図種別切替 | `id="mapTypeSelector"` | 地図コントロールバー/パネル（モバイル）、PC版は要実装 |
| ピン表示切替 | `id="pinDisplaySelector"` | 地図コントロールバー/パネル（モバイル）、PC版は要実装 |
| データ管理 | `id="dataManagementSelector"` | `id="data-manage-btn"`（PC）|
| 設定 | `id="tripSettingsBtn"` | `id="settings-btn"`（PC）、`id="settings-button"`（モバイル）|
| エラーメッセージ | `id="error-message"` | `id="error-message"`（要追加/共通化）|
| 場所リスト本体 | `id="sortable-list"` | `.list-content`（PC）、`#list-view`（モバイル）|
| 地点編集モーダル | `id="editModal"` | `.modal`/`.modal-content`（PC/モバイル）|
| 地図本体 | `id="map"` | `#map`（モバイル）、`.map-container`（PC）|
| 全ルート表示 | `id="fitAllRoutesBtn"` | `.filter-btn`や地図コントロールバーに統合可 |
| ルート再設定 | `id="recalcRouteBtn"` | `.filter-btn`や地図コントロールバーに統合可 |
| リスト内検索 | `id="searchInput"` | `.filter-input`（PC）、`class="filter-input"`（モバイル）|
| カテゴリフィルター | `id="categoryFilterSelect"` | `.category-select`（モバイル）、PC版は要実装 |
| 選択アクションバー | なし（独自実装） | `.selection-bar`（PC/モバイル共通）|
| ナイトモード | 独自JS/CSS | `.nightmode-btn`＋テーマCSS（共通）|
| コピー完了表示 | `id="copyFeedback"` | `.copy-feedback`（要追加/共通化）|

---

## 属性・クラス・イベント詳細対応表

| 機能・要素 | 旧UI 属性・クラス | 新UI 属性・クラス | 主なイベント・用途 |
|:---|:---|:---|:---|
| 場所リストアイテム | `<li class="place-item" data-id>` | `<div class="place-item" data-id>` | click, drag, checkbox change, 編集/削除ボタン |
| 場所選択チェック | `<input type="checkbox" class="place-checkbox">` | 同左 | change（選択アクションバー連動）|
| 場所編集ボタン | `<button class="edit-btn">` | `<i class="fas fa-pen" data-role="edit">` | click（編集モーダル表示）|
| 場所削除ボタン | `<button class="delete-btn">` | `<i class="fas fa-trash" data-role="delete">` | click（削除処理）|
| 日付ヘッダー | `<div class="day-header">` | 同左 | click（開閉トグル）、日付選択 |
| 日付ルート表示 | `<button class="day-route-btn">` | `<button class="day-action-btn highlight">` | click（その日のルート表示）|
| 検索バー | `<input id="headerSearchInput">` | `<input id="search-places-input">` | input, enter, 検索・追加 |
| フィルター入力 | `<input id="searchInput">` | `<input class="filter-input">` | input, 検索フィルター |
| カテゴリ選択 | `<select id="categoryFilterSelect">` | `<select class="category-select">` | change（カテゴリフィルター）|
| 地図エリア | `<div id="map">` | `<div class="map-container">`/`#map` | 地図初期化、ピン/ルート描画 |
| 地図種別セレクト | `<select id="mapTypeSelector">` | 地図コントロールバー/パネル | change（地図タイプ切替）|
| ピン表示セレクト | `<select id="pinDisplaySelector">` | 地図コントロールバー/パネル | change（ピン表示切替）|
| データ管理 | `<select id="dataManagementSelector">` | `<button id="data-manage-btn">` | change, click（インポート/エクスポート）|
| 設定 | `<button id="tripSettingsBtn">` | `<button id="settings-btn">` | click（設定モーダル表示）|
| ナイトモード | 独自JS/CSS | `.nightmode-btn`, `data-role="theme-switch"` | click（テーマ切替）|
| 選択アクションバー | 独自実装 | `.selection-bar`, `.selection-btn` | 選択時表示、ボタンで一括操作 |
| コピー完了表示 | `<div id="copyFeedback">` | `<div class="copy-feedback">` | コピー時一時表示 |

---

## 特定イベントの実装例・移植方針

### 1. 場所編集ボタン（編集モーダル表示）
- **旧UI例**:
  ```js
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      // 編集モーダル表示処理
    });
  });
  ```
- **新UI方針**:
  - `<i class="fas fa-pen" data-role="edit">` などのアイコンに `data-role` 属性でイベント委譲。
  - 例：
    ```js
    document.addEventListener('click', function(e) {
      if (e.target.matches('[data-role="edit"]')) {
        // 編集モーダル表示処理
      }
    });
    ```

### 2. 場所選択チェックボックス（選択アクションバー連動）
- **旧UI例**:
  ```js
  document.querySelectorAll('.place-checkbox').forEach(cb => {
    cb.addEventListener('change', updateSelectionBar);
  });
  ```
- **新UI方針**:
  - 同様に `change` イベントで `.selection-bar` の表示・件数更新を行う。
  - 例：
    ```js
    document.addEventListener('change', function(e) {
      if (e.target.matches('.place-checkbox')) {
        updateSelectionBar();
      }
    });
    ```

### 3. ナイトモード切替
- **旧UI（tripmaker_old）には存在しない新機能**
- **新UI方針**:
  - ヘッダー右端などに `.nightmode-btn`（三日月ボタン）を新規追加し、クリックでテーマ切替
  - `body`や主要コンテナに `nightmode` クラスを付与し、CSSで配色・背景色・文字色などを切り替え
  - ユーザーの選択状態を `localStorage` で保存し、再訪時も状態を維持
  - アクセシビリティ（コントラスト比・フォーカス可視性）にも配慮
  - 例：
    ```js
    document.querySelector('.nightmode-btn').addEventListener('click', function() {
      document.body.classList.toggle('nightmode');
      localStorage.setItem('theme', document.body.classList.contains('nightmode') ? 'night' : 'light');
    });
    // 初期化時
    if(localStorage.getItem('theme') === 'night') {
      document.body.classList.add('nightmode');
    }
    ```
- **CSS例**:
    ```css
    body.nightmode {
      background: #181a20;
      color: #f3f3f3;
    }
    .nightmode .app-header { background: #222c3a; }
    /* 他、ボタン・リスト・地図枠なども夜用配色に */
    ```
- **移植・追加方針まとめ**:
  - tripmaker_old には存在しないため、「新規追加」としてUI・JS・CSSを設計・実装する
  - 既存の機能やデータ構造と競合しないよう、独立した実装とする
  - 既存UI要素への影響を最小化しつつ、アクセシビリティも考慮する
  - ナイトモード切替時は、Google Maps等の地図表示もナイトモード（ダークテーマ）に自動で切り替える（例：Google Maps APIの地図スタイル切替を併用）

### 4. データ管理ボタン（インポート/エクスポート）
- **旧UI例**:
  ```js
  document.getElementById('dataManagementSelector').addEventListener('change', function(e) {
    if (e.target.value === 'exportJson') { ... }
  });
  ```
- **新UI方針**:
  - `#data-manage-btn` クリック時にメニュー表示、選択肢ごとに処理を分岐。
  - 例：
    ```js
    document.getElementById('data-manage-btn').addEventListener('click', function() {
      // メニュー表示・選択肢ごとの処理
    });
    ```

### 5. 選択アクションバーの一括操作
- **新UI方針**:
  - `.selection-btn` クラスのボタンに `click` イベントを付与し、選択中アイテムに対して一括操作を実装。

---

この表はplan0427.mdの「新旧UI要素対応表の作成」タスクに対応しています。

さらに細かな属性・クラス・イベントの対応、および実装例・移植方針を追記しました。

