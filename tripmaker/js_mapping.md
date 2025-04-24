
## 1. UI要素と関数のマッピング

HTML (`index.html`) 内の主要な `id` 付き要素と、それに対応する JavaScript (`events.js` など) のイベントリスナーおよび呼び出される主要な関数をマッピングします。

| UI要素 (id)               | 説明                                       | イベント    | ハンドラ関数 (events.js)       | 呼び出す主要関数/モジュール                                                                                                    |
| :------------------------ | :----------------------------------------- | :---------- | :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `headerAddPlaceBtn`       | ヘッダーの場所追加ボタン                     | `click`     | `handleHeaderAddPlace`         | `ui.openEditModal` (prefillData付き)                                                                                             |
| `addPlaceBtn`             | 「予定追加」ボタン (詳細入力用)            | `click`     | `() => ui.openEditModal(null)` | `ui.openEditModal` (新規モード)                                                                                                  |
| `generateShareUrl`        | 「URL共有」ボタン                          | `click`     | `data.generateShareUrl`        | `data.generateShareUrl`                                                                                                        |
| `recalcRouteBtn`          | 「ルート再設定」ボタン                       | `click`     | `handleRecalcRoute`            | `route.recalculateRoutes`                                                                                                        |
| `tripSettingsBtn`         | 「設定」ボタン                             | `click`     | `ui.openTripSettingsModal`     | `ui.openTripSettingsModal`                                                                                                       |
| `fitAllRoutesBtn`         | 「全ルート表示」ボタン                       | `click`     | `map.fitMapToAllRoutes`        | `map.fitMapToAllRoutes`                                                                                                        |
| `googleMapTransferBtn`    | 「Google Mapで開く」ボタン                 | `click`     | `handleGoogleMapTransfer`    | `route.getTravelModeForGoogleMaps`, Google Maps URL生成                                                                           |
| `headerSearchInput`       | ヘッダーの場所検索入力                     | `input`     | `() => { ... }`                | Addボタンの有効/無効切り替え, `state.setHeaderSelectedPlace`                                                                     |
|                           |                                            | `keydown`   | `(e) => { if(e.key === 'Enter') ... }` | `handleHeaderAddPlace`                                                                                                        |
|                           | (Autocomplete)                             | `place_changed` | `handleHeaderPlaceChange` (map.js) | `state.setHeaderSelectedPlace`, `map.guessCategoryFromPlaceTypes`                                                              |
| `sortable-list`           | リスト全体のコンテナ                       | `click`     | `handleListClick`              | イベントデリゲーションで各種アクション実行 (下記参照)                                                                           |
|                           |                                            | `keydown`   | `handleListKeydown`            | `map.zoomToPlace` (Enter/Spaceキー)                                                                                             |
| (リスト内 `.place-item`)  | 個々の地点リスト項目                       | `click`     | `handleListClick`              | `map.zoomToPlace` (ボタン/チェックボックス以外)                                                                                 |
|                           |                                            | `keydown`   | `handleListKeydown`            | `map.zoomToPlace` (Enter/Spaceキー)                                                                                             |
| (リスト内 `[data-action="edit-place"]`) | 編集ボタン (鉛筆アイコン)       | `click`     | `handleListClick`              | `ui.openEditModal` (編集モード)                                                                                                  |
| (リスト内 `[data-action="delete-place"]`) | 削除ボタン (ゴミ箱アイコン)     | `click`     | `handleListClick`              | `data.deletePlace`                                                                                                             |
| (リスト内 `.place-checkbox`) | Google Map転送用チェックボックス        | `click`     | `handleListClick` (経由で `handlePlaceCheckboxChange`) | `state.addSelectedPlaceId`, `state.removeSelectedPlaceId`, `ui.updateGoogleMapTransferButtonState`                     |
| (リスト内 `.show-day-route-btn`) | 日付ヘッダーのルート表示ボタン      | `click`     | `handleListClick`              | `map.displayRoutesForDate`                                                                                                       |
| (リスト内 `.date-group-header` 内 `[data-action="toggle-collapse"]`) | 日付ヘッダーの折りたたみトグル | `click`     | `handleListClick`              | `ui.toggleDateGroupCollapse`                                                                                                   |
| `searchInput`             | リスト内検索入力                           | `input`     | `debounce(ui.applyCurrentFilters, ...)` | `ui.applyCurrentFilters` (デバウンス付き)                                                                                     |
| `categoryFilterSelect`    | カテゴリフィルター選択                     | `change`    | `handleCategoryFilterChange`   | `state.setCurrentCategoryFilter`, `ui.applyCurrentFilters`                                                                         |
| `mapTypeSelector`         | 地図タイプ選択                             | `change`    | `handleMapTypeChange`          | `map.setMapType`                                                                                                               |
| `pinDisplaySelector`      | ピン表示モード選択                         | `change`    | `handlePinDisplayChange`       | `map.updatePinDisplayMode`                                                                                                       |
| `dataManagementSelector`  | データ管理選択                             | `change`    | `(e) => { ... }`               | JSで動的に作成されたファイル入力要素 (`csvFileInput`, `jsonFileInput`) の `click()`、`data.exportDataToJson`, `data.exportDataToGeoJson` |
| `csvFileInput`            | CSVインポート用 (非表示)                   | `change`    | `data.importDataFromCsv`       | `data.importDataFromCsv`                                                                                                       |
| `jsonFileInput`           | JSON/GeoJSONインポート用 (非表示)          | `change`    | `data.importDataFromJson`      | `data.importDataFromJson` (GeoJSONも内部で分岐)                                                                                |
| `editModal`               | 編集/追加モーダル                          | -           | -                              | `ui.openEditModal` で表示, `data.closeEditModal` で非表示                                                                        |
| `editForm`                | 編集/追加モーダルフォーム                    | `submit`    | `handleSaveEdit`               | `state.updateSinglePlaceData` または `state.addPlaceData`, `data.savePlaceData`, `route.setRouteDirty`, `ui.renderUI`, `map.zoomToPlace` |
| `cancelEdit`              | 編集モーダルのキャンセルボタン               | `click`     | `data.closeEditModal`          | `data.closeEditModal`                                                                                                          |
| `placeAddress` (モーダル内) | 住所入力 (Autocomplete)                    | `place_changed` | `handleModalPlaceChange` (map.js) | モーダル内のLat/Lng/名前/カテゴリを更新, `map.guessCategoryFromPlaceTypes`                                                        |
| `tagContainer` (モーダル内) | タグ表示/入力コンテナ                    | `click`     | `(e) => { ... }`               | `state.removeCurrentTag`, `ui.renderTagsUI`, `ui.updateHiddenTagsInput` (タグ削除時)                                               |
| `placeTagsInput` (モーダル内) | タグ入力フィールド                       | `keydown`   | `(e) => { ... }`               | `state.addCurrentTag`, `state.removeCurrentTag`, `ui.renderTagsUI`, `ui.updateHiddenTagsInput`                                     |
|                           |                                            | `blur`      | `() => { ... }`                | `state.addCurrentTag`, `ui.renderTagsUI`, `ui.updateHiddenTagsInput`                                                               |
| `tripSettingsModal`       | 設定モーダル                               | -           | -                              | `ui.openTripSettingsModal` で表示, `data.closeTripSettingsModal` で非表示                                                          |
| `tripSettingsForm`        | 設定モーダルフォーム                       | `submit`    | `ui.saveTripSettings`          | `state.setTravelMetadata`, `data.saveMetadata`, `localStorage.setItem(STORAGE_KEY_SHOW_TIME)`, `ui.updateHeaderTripName`, `ui.updateTimeVisibility` |
| `cancelTripSettings`      | 設定モーダルのキャンセルボタン               | `click`     | `data.closeTripSettingsModal`  | `data.closeTripSettingsModal`                                                                                                  |
| `deleteTripBtn`           | 「この旅程を削除」ボタン                   | `click`     | `data.handleDeleteTrip`        | `data.handleDeleteTrip` (確認後、全データ削除とUIリセット)                                                                       |
| `toggleTimeDisplay`       | 設定モーダル内の時刻表示トグル               | `change`    | `(e) => { ui.updateTimeVisibility(); }` | `ui.updateTimeVisibility` (即時反映)                                                                                         |
| `autoRerouteCheckbox`     | 設定モーダル内の自動リルートトグル           | `change`    | -                              | `handleSortEnd` (ui.js) 内で状態をチェックしてルート再計算を制御                                                                 |

---

## 2. 関数の役割（UI/State更新）

各主要関数の目的と、それがどのUI要素や `state.js` の状態変数を更新するかの概要です。

**`init.js`**

*   `main()`: アプリケーション全体の初期化フローを制御。
    *   **State更新:** なし（他モジュールの初期化関数を呼び出す）
    *   **UI更新:** `ui.renderUI()` を呼び出して初期描画。
*   `loadGoogleMapsAPI()` (map.js内だが init から呼ばれる): Google Maps APIスクリプトを非同期でロード。
    *   **State更新:** なし
    *   **UI更新:** 失敗時にエラー表示 (`showError`)。

**`events.js`**

*   `setupEventListeners()`: 上記「1. UI要素と関数のマッピング」の通り、UI要素にイベントリスナーを設定。
*   `handle...` (各種イベントハンドラ): ユーザー操作に応じて、他のモジュール (`ui`, `data`, `map`, `route`) の関数を呼び出し、State更新やUI更新を間接的にトリガーする。
*   `exposeGlobalFunctions()`: `ui.openEditModal`, `data.deletePlace` を `window` オブジェクトに割り当て、InfoWindow内のボタン (`onclick`) から呼び出せるようにする。

**`ui.js`**

*   `renderUI()`: アプリケーション全体のUIを再描画する中心的な関数。
    *   **State更新:** なし（読み取りが主）
    *   **UI更新:** `#sortable-list` の内容更新 (`renderListGroupedByDate`), `#currentTripName` 更新 (`updateHeaderTripName`), `#categoryFilterSelect` オプション更新 (`renderCategoryFilterOptions`), リスト項目のフィルタリング (`applyCurrentFilters`), ピン表示セレクタ更新 (`updateMarkerModeButtonStyles`), 時刻表示更新 (`updateTimeVisibility`), マーカー再描画 (`map.refreshMarkers`), ルート表示/計算 (`map.displayRoutesForDate`, `route.recalculateRoutes`), 地図フィット (`map.fitMapToAllRoutes`), Google Map転送ボタン状態更新 (`updateGoogleMapTransferButtonState`)。
*   `renderListGroupedByDate()`: 日付ごとにグループ化されたリスト (`#sortable-list`) を描画。
    *   **State更新:** `state.destroySortableInstances`, `state.addSortableInstance` (Sortableインスタンス管理)。
    *   **UI更新:** `#sortable-list` の `innerHTML` を更新、SortableJS の初期化。
*   `createDateGroupHeader()`, `createPlaceListItem()`: リストのヘッダーとアイテムのHTML文字列を生成。
*   `openEditModal()`, `closeEditModal()`: 編集/追加モーダル (`#editModal`) の表示/非表示、フォームの初期化/リセット。
    *   **State更新:** `state.setCurrentTags`, `state.setLastUsedDate` (モーダル表示時)。
    *   **UI更新:** モーダルの表示状態、フォームの内容、タグ表示 (`renderTagsUI`)。
*   `openTripSettingsModal()`, `closeTripSettingsModal()`: 設定モーダル (`#tripSettingsModal`) の表示/非表示、フォームへのデータ読み込み。
    *   **State更新:** なし
    *   **UI更新:** モーダルの表示状態、フォームの内容。
*   `saveTripSettings()`: 設定モーダルからの保存処理。
    *   **State更新:** `state.setTravelMetadata`。
    *   **UI更新:** ヘッダーの旅行名 (`updateHeaderTripName`), リストの時刻表示 (`updateTimeVisibility`)。
*   `applyCurrentFilters()`: 検索語とカテゴリフィルターに基づいてリスト項目 (`.place-item`) の表示/非表示を切り替え。
    *   **State更新:** なし
    *   **UI更新:** リスト項目と日付ヘッダーの `hidden` クラスをトグル。
*   `update...` (各種UI更新関数): 特定のUI要素（ヘッダー、ボタン、セレクタなど）の表示やスタイルを現在の状態に合わせて更新。
*   `toggleDateGroupCollapse()`: リストの日付グループの折りたたみ/展開。
    *   **State更新:** なし
    *   **UI更新:** `.collapsible-content` の `maxHeight` と `collapsed` クラス、ヘッダーの `aria-expanded` 属性とアイコンを更新。

**`data.js`**

*   `loadAndInitializeData()`: アプリ初期化時にデータをロード。
    *   **State更新:** `state.setPlaceData`, `state.setTravelMetadata`, `state.setMarkerDisplayMode`。
    *   **UI更新:** なし（`renderUI` が後で呼ばれる）。
*   `loadPlaceData()`, `loadMetadata()`: localStorage からデータを読み込み、Stateを更新。
*   `savePlaceData()`, `saveMetadata()`: 現在の `state.placeData`, `state.travelMetadata` をlocalStorageに保存。
*   `deletePlace()`: 指定された地点を削除。
    *   **State更新:** `state.deletePlaceData`, `state.setRouteDirty`。
    *   **UI更新:** `ui.renderUI` を呼び出してリスト/マーカーを更新、フィードバック表示 (`showCopyFeedback`)。
*   `handleDeleteTrip()`: 全ての旅程データを削除。
    *   **State更新:** `state.setPlaceData`, `state.resetTravelMetadata`, `state.clearPolylinesFromState`, etc. (ほぼ全てリセット)。
    *   **UI更新:** `map.clearMapData`, `ui.renderUI` でUIを空の状態に、設定モーダルを閉じる、フィードバック表示。
*   `importData...()`: 各形式のデータをインポート。
    *   **State更新:** `state.setPlaceData`, `state.setTravelMetadata` (リセットする場合あり), `state.clearRoutes`, `state.setRouteDirty`。
    *   **UI更新:** `ui.renderUI` (ルート計算/地図フィットを伴う場合あり)、CSVインポート後は `map.geocodeAndRefreshAfterCsvImport` を呼び出し、座標取得後に再度 `renderUI`。
*   `exportData...()`: 各形式でデータをエクスポート/共有。
    *   **State更新:** なし
    *   **UI更新:** ファイルダウンロードのトリガー、フィードバック表示 (`showCopyFeedback`)、エラー表示 (`showError`)。
*   `generateShareUrl()`: 共有URLを生成してクリップボードにコピー。
    *   **State更新:** なし
    *   **UI更新:** フィードバック/エラー表示。

**`map.js`**

*   `initializeMap()`: Google Maps APIと地図を初期化。
    *   **State更新:** `state.setMap`, `state.setDirectionsService`, `state.setGeocoder`, `state.setInfoWindow`。
    *   **UI更新:** `#map` divに地図を表示、Autocomplete機能の初期化。失敗時にエラー表示、地図非表示。
*   `refreshMarkers()`: 現在の `state.placeData` に基づいてマーカーを再描画。
    *   **State更新:** `state.clearMarkersFromState`, `state.addMarkerToState`。
    *   **UI更新:** 地図上のマーカーを更新 (`updateMarkerLabels` も呼び出す)。
*   `updateMarkerLabels()`: マーカーの表示（数字、点、非表示）を `state.markerDisplayMode` に合わせて更新。
    *   **State更新:** なし
    *   **UI更新:** 地図上のマーカーのアイコン/ラベル/表示状態を変更。
*   `drawSinglePolyline()`: 1区間のルートポリラインオブジェクトを作成 (地図への追加は別)。
*   `displayRoutesForDate()`: `state.currentlyDisplayedDate` に基づいてポリラインの表示/非表示を切り替え。
    *   **State更新:** `state.setCurrentlyDisplayedDate`。
    *   **UI更新:** 地図上のポリライン表示、日付別ルート表示ボタンのハイライト (`ui.updateDayRouteButtonHighlights`)、必要に応じて地図範囲調整 (`fitBounds`)。
*   `fitMapToAllRoutes()`: 表示中のマーカーとポリラインが全て収まるように地図の表示範囲を調整。
*   `zoomToPlace()`: 特定の地点に地図をパン/ズームし、InfoWindowを表示。
    *   **State更新:** なし
    *   **UI更新:** 地図の中心/ズームレベル、InfoWindowの表示と内容更新。
*   `geocodeAndRefreshAfterCsvImport()`: 座標のない地点のジオコーディングを実行。
    *   **State更新:** `state.updateSinglePlaceData` (座標更新), `state.setRouteDirty` (ジオコーディング成功時)。
    *   **UI更新:** ローディング表示、フィードバック/エラー表示。
*   `setMapType()`: 地図の種類（標準、衛星写真など）を変更。
*   `updatePinDisplayMode()`: ピン表示モードを更新し、マーカーを再描画。
    *   **State更新:** `state.setMarkerDisplayMode`。
    *   **UI更新:** `refreshMarkers`, `ui.updateMarkerModeButtonStyles` を呼び出す。
*   `clearMapData()`: 地図上のマーカーとポリラインを全て消去。
    *   **State更新:** `state.clearMarkersFromState`, `state.clearPolylinesFromState`。
    *   **UI更新:** 地図を初期表示に戻す、InfoWindowを閉じる。

**`route.js`**

*   `setRouteDirty()`: ルートが再計算必要かどうかの状態を更新。
    *   **State更新:** `state.setRouteDirty`。
    *   **UI更新:** 「ルート再設定」ボタン (`#recalcRouteBtn`) の表示/非表示とスタイルを更新。
*   `clearRoutes()`: 計算済みのルート情報（ポリラインと地点データ内の情報）を削除。
    *   **State更新:** `state.clearPolylinesFromState`, `state.clearRouteInfoFromPlaces`。
    *   **UI更新:** 地図上のポリラインを消去。
*   `recalculateRoutes()`: ルート計算の起点。`processRouteQueue` を呼び出す。
*   `processRouteQueue()`: ルート計算リクエストを順次処理。
    *   **State更新:** `state.updatePlaceRouteInfo` (計算結果で地点データ更新), `state.cacheRouteResult` (キャッシュ)。
    *   **UI更新:** ローディング表示、`drawCalculatedPolylines` 呼び出し、完了後に `renderUI`、フィードバック表示。
*   `calculateSingleRoute()`: 1区間のルートを計算（API、キャッシュ、代替手段）。
*   `drawCalculatedPolylines()`: 計算結果 (`state.placeData` 内の `routeInfo.geometry`) に基づいてポリラインを地図に描画。
    *   **State更新:** `state.clearPolylinesFromState`, `state.addPolyline`。
    *   **UI更新:** 地図上のポリラインを描画/更新 (`map.displayRoutesForDate` も呼び出す)。

**`state.js`**

*   全関数: アプリケーションの状態変数 (`placeData`, `travelMetadata`, `map`, `markers`, etc.) を直接変更する。これらの変更は、他のモジュール（特に `ui.js`）によってUIに反映される。

**`map_restore.js`**

*   `restorePolylinesFromPlaceData()`: `state.placeData` の情報から `state.dailyPolylines` を復元。
    *   **State更新:** `state.clearPolylinesFromState`, `state.addPolyline`。
    *   **UI更新:** なし（地図への描画は `renderUI` や `displayRoutesForDate` で行われる）。

---

## 3. 機能単位の流れ

アプリケーションの主要な機能が、ユーザー操作からどのように実行されるかの概要です。

1.  **初期化:**
    *   ページ読み込み完了 (`DOMContentLoaded`) → `init.js:main()` 実行。
    *   `data.loadAndInitializeData()`: LocalStorageからデータ読み込み → `state` 更新。
    *   `map.initializeMap()`: Google Maps APIロード & 地図初期化 → `state` 更新 (mapインスタンス等)。
    *   `events.setupEventListeners()`, `events.setupNewModalEventListeners()`: UI要素にイベントリスナー設定。
    *   `events.exposeGlobalFunctions()`: InfoWindow用関数をグローバル公開。
    *   `data.importFromUrl()`: URLパラメータからのデータインポート試行 → `state` 更新 (あれば)。
    *   `map_restore.restorePolylinesFromPlaceData()`: 保存済みのルートジオメトリからポリライン状態を復元。
    *   `ui.renderUI()`: `state` に基づいてリスト、マーカー、ルート表示を初期描画（インポート等でルートがdirtyなら再計算&フィットも）。

2.  **地点追加 (詳細入力):**
    *   ユーザーが `#addPlaceBtn` クリック → `events` → `ui.openEditModal(null)`。
    *   モーダル表示、フォーム初期化 (`state.setCurrentTags`等も)。
    *   ユーザーがフォーム入力 & 住所検索でAutocomplete候補選択 → `map.handleModalPlaceChange` → 座標・名前・カテゴリ等が自動入力。
    *   ユーザーが「保存」(`editForm` submit) → `events:handleSaveEdit`。
    *   フォームデータ取得、バリデーション。
    *   `state.addPlaceData()` で `state.placeData` に新規地点追加。
    *   `data.savePlaceData()` でLocalStorage保存。
    *   `route.setRouteDirty(true)` でルート再計算フラグ設定。
    *   `data.closeEditModal()` でモーダル閉じる。
    *   `ui.renderUI(false)` でリスト/マーカー再描画。
    *   `map.zoomToPlace()` で追加地点にズーム。

3.  **地点追加 (ヘッダー検索から):**
    *   ユーザーが `#headerSearchInput` に入力 → Autocomplete候補表示。
    *   候補選択 → `map.handleHeaderPlaceChange` → `state.headerSelectedPlace` に情報格納、`#headerAddPlaceBtn` 有効化。
    *   ユーザーが `#headerAddPlaceBtn` クリック (またはEnter) → `events:handleHeaderAddPlace`。
    *   `ui.openEditModal(null, state.headerSelectedPlace)` でモーダルを事前入力データ付きで開く。
    *   (以降は「地点追加 (詳細入力)」のモーダル保存フローと同様)

4.  **地点編集:**
    *   ユーザーがリスト内の編集ボタン (`[data-action="edit-place"]`) クリック → `events:handleListClick`。
    *   `ui.openEditModal(placeId)` でモーダルを既存データ付きで開く。
    *   (以降は「地点追加 (詳細入力)」のモーダル保存フローと同様、ただし `state.addPlaceData` の代わりに `state.updateSinglePlaceData` が呼ばれる)

5.  **地点削除:**
    *   ユーザーがリスト内の削除ボタン (`[data-action="delete-place"]`) クリック → `events:handleListClick`。
    *   `data.deletePlace(placeId)` 実行。
    *   `confirm()` で確認ダイアログ表示。
    *   OKなら → `state.deletePlaceData()` で `state.placeData` から削除。
    *   `data.savePlaceData()` でLocalStorage保存。
    *   `route.setRouteDirty(true)`。
    *   `ui.renderUI(false)` でリスト/マーカー再描画。
    *   `showCopyFeedback` で完了メッセージ表示。

6.  **リスト並び替え/日付変更:**
    *   ユーザーがリスト項目 (`.place-item`) をドラッグ＆ドロップ。
    *   SortableJSの `onEnd` イベント → `ui.handleSortEnd` 実行。
    *   移動先リスト (`evt.to`) から新しい日付 (`targetDateKey`) を取得。
    *   `state.updateSinglePlaceData()` で必要なら地点の `date` プロパティを更新。
    *   全リスト項目からIDを取得し `state.sortPlaceData()` で `state.placeData` 配列の順序を更新。
    *   `data.savePlaceData()` でLocalStorage保存。
    *   `route.setRouteDirty(true)`。
    *   自動リルートが有効 (`#autoRerouteCheckbox`) なら `route.recalculateRoutes()` を即時実行、無効なら `ui.renderUI(false)` でリストのみ再描画。

7.  **ルート計算 (手動):**
    *   ユーザーが「ルート再設定」ボタン (`#recalcRouteBtn`) をクリック (dirty状態のとき表示)。
    *   `events:handleRecalcRoute` → `route.recalculateRoutes(false)` 実行。
    *   `route.clearRoutes()` で既存ルート削除。
    *   計算対象区間リスト作成。
    *   `route.processRouteQueue()`: 各区間を `route.calculateSingleRoute` で計算 (API/キャッシュ/代替)。
    *   計算結果で `state.placeData` の `routeInfo` を更新 (`state.updatePlaceRouteInfo`)。
    *   `route.drawCalculatedPolylines()`: `state.placeData` の `routeInfo.geometry` からポリラインを `state.dailyPolylines` に作成。
    *   `route.setRouteDirty(false)`。
    *   `ui.renderUI(false, false)` でリスト情報（距離/時間）と地図上のポリラインを更新。
    *   `data.savePlaceData()`。

8.  **日付別ルート表示:**
    *   ユーザーが日付ヘッダーの「この日のルート表示」ボタン (`.show-day-route-btn`) をクリック → `events:handleListClick`。
    *   `map.displayRoutesForDate(dateKey, true)` 実行。
    *   `state.currentlyDisplayedDate` 更新。
    *   `state.dailyPolylines` を参照し、該当日のポリラインのみ表示、他は非表示。
    *   `ui.updateDayRouteButtonHighlights()` でボタンのスタイル更新。
    *   地図範囲を該当日のルート/マーカーにフィット (`map.fitBounds`)。

9.  **データインポート (例: JSON):**
    *   ユーザーがデータ管理 (`#dataManagementSelector`) で「JSONインポート」選択 → `events` → 非表示の `#jsonFileInput` の `click()`。
    *   ファイル選択ダイアログ表示、ユーザーがファイル選択 → `jsonFileInput` の `change` イベント。
    *   `data.importDataFromJson()` 実行。
    *   FileReaderでファイル読み込み → `JSON.parse()`。
    *   データ構造検証。
    *   `state.setPlaceData()`, `state.setTravelMetadata()` でStateを上書き。
    *   `data.savePlaceData()`, `data.saveMetadata()`。
    *   `route.clearRoutes()`, `route.setRouteDirty(true)`。
    *   `ui.renderUI(true, true)` でUI再描画、ルート計算予約、地図フィット。

10. **データエクスポート (例: GeoJSON):**
    *   ユーザーがデータ管理 (`#dataManagementSelector`) で「GeoJSONエクスポート」選択 → `events`。
    *   `data.exportDataToGeoJson()` 実行。
    *   `state.placeData` と `state.travelMetadata` からGeoJSONオブジェクト生成 (PointとLineString)。
    *   `JSON.stringify()`。
    *   `downloadFile()` でファイルダウンロード開始。
    *   `showCopyFeedback`。

11. **Google Map転送:**
    *   ユーザーがリストのチェックボックス (`.place-checkbox`) をクリック → `events:handlePlaceCheckboxChange` → `state.selectedPlaceIdsForMap` 更新、`ui.updateGoogleMapTransferButtonState` でボタン状態更新。
    *   ユーザーが「Google Mapで開く」ボタン (`#googleMapTransferBtn`) をクリック (有効な場合) → `events:handleGoogleMapTransfer`。
    *   `state.selectedPlaceIdsForMap` と `state.placeData` から選択された地点をリスト順に取得、座標検証。
    *   地点数に応じて Google Maps URL (Search API または Directions API 形式) を生成。
    *   `window.open()` で新しいタブでGoogle Mapsを開く。

---