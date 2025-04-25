
**Tripmaker Lab β PC版モックアップ 要素分解リスト**

このHTMLドキュメントは、旅行プラン作成ツール「Tripmaker Lab β」のPC版画面モックアップ（デザイン見本）です。大きく分けて以下の要素で構成されています。

**1. 全体構造・基本設定 (`<head>`内)**

*   **文字コード・表示設定:**
    *   `charset="UTF-8"`: 文字コードをUTF-8に設定。
    *   `viewport`: スマートフォンなどでの表示幅や初期ズーム倍率を設定。
*   **タイトル:**
    *   `<title>`: ブラウザのタブに表示されるタイトル「Tripmaker Lab β - PC版」。
*   **外部CSS読み込み:**
    *   `Font Awesome`: アイコンフォントライブラリを読み込み、各種アイコン（`<i class="fas fa-...">`など）を表示可能にしています。
*   **内部CSS (`<style>`内):**
    *   画面全体のレイアウト、各パーツ（ヘッダー、サイドバー、地図、リスト項目、ボタンなど）のデザイン（色、サイズ、配置、余白、影など）を定義しています。
    *   レスポンシブデザインではなく、PC表示を前提としたスタイルが中心です。

**2. ページ本体 (`<body>`内)**

**2.1. アプリヘッダー (`<header class="app-header">`)**

*   画面最上部に固定される青いヘッダー領域。
*   **アプリタイトル (`<div class="app-title">`)**:
    *   「Tripmaker Lab β」: アプリケーション名。
    *   「ニュージーランド旅行」: 現在開いている旅行プランのタイトル（例）。
*   **検索バー (`<div class="search-container">`)**:
    *   `<input type="text" class="search-input">`: 場所を検索してプランに追加するための入力欄。
*   **メインアクションボタン群 (`<div class="main-actions">`)**:
    *   `<button class="action-btn">`: 主要な操作を行うボタン。
        *   「予定追加」(<i class="fas fa-plus"></i>)
        *   「URL共有」(<i class="fas fa-share-alt"></i>)
        *   「設定」(<i class="fas fa-cog"></i>)
        *   「データ管理」(<i class="fas fa-database"></i>): 強調表示 (primary)。

**2.2. 選択アクションバー (`<div class="selection-bar">`)**

*   リスト内の項目（場所）が1つ以上選択された時に表示される想定のバー（初期状態では表示）。
*   **選択件数表示 (`<div class="selection-count">`)**:
    *   例：「2件選択中」のように、選択されているアイテム数を表示。
*   **選択項目アクションボタン群 (`<div class="selection-actions">`)**:
    *   `<button class="selection-btn">`: 選択中のアイテムに対する操作ボタン。
        *   「削除」(<i class="fas fa-trash-alt"></i>)
        *   「Google Mapsで開く」(<i class="fas fa-external-link-alt"></i>)

**2.3. メインコンテンツエリア (`<div class="main-container">`)**

*   ヘッダーと選択バーの下に位置し、画面の主要部分を占めるエリア。左右に分割されています。

    **2.3.1. リストサイドバー (`<div class="list-sidebar">`)**
    *   画面左側に配置される、旅行プランの場所リストを表示するエリア。
    *   **フィルターバー (`<div class="filter-bar">`)**:
        *   リスト上部にあり、リスト内の項目を絞り込むための機能を提供。
        *   `<input type="text" class="filter-input">`: リスト内のテキスト検索用入力欄。
        *   `<button class="filter-btn">`: フィルター操作ボタン。
            *   「全ルート表示」(<i class="fas fa-map-marker-alt"></i>): 現在アクティブ状態 (active)。
            *   「ルート計測」(<i class="fas fa-route"></i>)
    *   **リストコンテンツ (`<div class="list-content">`)**:
        *   フィルターバーの下にあり、スクロール可能な場所リスト本体。
        *   **日付ヘッダー (`<div class="day-header">`)**:
            *   各日付ごとの区切りとなるヘッダー。`day2`, `day3` クラスで日付ごとに背景色や左ボーダー色が変わる。
            *   `<div class="day-top-row">`: ヘッダー上段。
                *   `<div class="day-toggle">`: リストの開閉用アイコン (<i class="fas fa-caret-down"></i>)。
                *   `<div class="day-label">`: 日付表示（例: DAY 1 <span class="day-badge">日</span> <span class="day-date">2025-05-11</span>）。
                *   `<div class="day-point-count">`: その日の地点数を表示（例: 1地点）。
                *   `<div class="day-status">`: 状態表示（例: <div class="status-badge">経路表示中</div>）。
            *   `<div class="day-actions">`: ヘッダー下段（日付ごとのアクション）。
                *   `<button class="day-action-btn highlight">`: 「この日のルート表示」ボタン。
        *   **場所アイテム (`<div class="place-item">`)**:
            *   リスト内の個々の場所（地点）を表すカード形式の要素。`selected` クラスが付くと選択状態のデザインになる。
            *   `<div class="place-top">`: 場所カード上段。
                *   `<input type="checkbox" class="place-checkbox">`: 場所選択用のチェックボックス。
                *   `<div class="place-title">`: 場所の番号と名前（例: <span class="place-number">1.</span> 成田国際空港）。
                *   `<div class="place-actions">`: 場所ごとのアクションアイコン（編集 <i class="fas fa-pen"></i>, 削除 <i class="fas fa-trash"></i>）。
            *   `<div class="place-info">`: 場所カード下段（詳細情報）。
                *   `<div class="place-address">`: 住所情報（ピンアイコン <i class="fas fa-map-marker-alt address-pin"></i> とテキスト）。
                *   `<div class="place-meta">`: 場所に関するメタ情報（タグ）。
                    *   `<div class="meta-item">`: 各メタ情報タグ。アイコンとテキストで構成（例: 移動手段 <i class="fas fa-plane-departure"></i>, 時間 <i class="far fa-clock"></i>, 距離 <i class="fas fa-route"></i>, カテゴリ <i class="fas fa-plane"></i>）。`primary`, `time`, `distance` クラスで色分け。

    **2.3.2. 地図エリア (`<div class="map-container">`)**
    *   画面右側に配置される、地図を表示するエリア。
    *   **地図モックアップ表示**:
        *   `<div style="...">地図表示エリア</div>`: 実際の地図の代わりにプレースホルダーテキストを表示。
    *   **地図コントロール (`<div class="map-controls">`)**:
        *   地図上部にオーバーレイ表示される操作ボタン群。
        *   `<div class="map-control-left">`: 左側のコントロール。
            *   `<button class="map-control-btn">`: 「全ルート表示」ボタン (<i class="fas fa-route"></i>)。
            *   `<select class="map-select">`: 表示する日付を選択するドロップダウンリスト。
        *   `<div class="map-control-right">`: 右側のコントロール。
            *   `<button class="map-control-btn">`: 「地図タイプ」ボタン (<i class="fas fa-layer-group"></i>)。
            *   `<button class="map-control-btn">`: 「ピン表示」ボタン (<i class="fas fa-map-pin"></i>)。
    *   **地図ポップアップ (`<div class="map-popup">`)**:
        *   地図上のピン（マーカー）をクリックした際に表示される想定の詳細情報ウィンドウ。
        *   `<div class="popup-header">`: ポップアップ上部。
            *   `<div class="popup-close">`: 閉じるボタン (<i class="fas fa-times"></i>)。
            *   `<h3 class="popup-title">`: 場所の名前（例: 2. オークランド・エアポート）。
            *   `<div class="popup-meta">`: 日付 (<i class="far fa-calendar-alt"></i>) と場所 (<i class="fas fa-map-marker-alt"></i>) の情報。
        *   `<div class="popup-body">`: ポップアップ下部。
            *   `<div class="popup-section">`: セクション（例: 次の移動）。
                *   `<div class="popup-section-title">`: セクションタイトル。
                *   `<div class="popup-route-info">`: 次の地点への移動情報（移動手段 <i class="fas fa-plane"></i>, 距離 <i class="fas fa-route"></i>, 時間 <i class="far fa-clock"></i>）。
            *   `<div class="popup-actions">`: ポップアップ内のアクションボタン。
                *   `<button class="popup-action-btn">`: 「編集」ボタン (<i class="fas fa-pencil-alt"></i>)。
                *   `<button class="popup-action-btn primary">`: 「Mapsで開く」ボタン (<i class="fas fa-external-link-alt"></i>)。

**3. JavaScript (`<script>`内)**

*   **簡易インタラクション:**
    *   ページ読み込み完了時に実行される処理 (`DOMContentLoaded`)。
    *   場所アイテムのチェックボックスの状態変化を監視し、選択されたアイテム数に応じて「選択アクションバー」の表示/非表示と件数表示を更新する機能 (`updateSelectionBar`関数)。
    *   地図ポップアップの閉じるボタンをクリックしたときに、ポップアップを非表示にする機能。

---

このリストは、HTMLの構造と各要素の役割、表示内容、および簡単な機能を網羅的に説明したものです。実際のアプリケーションでは、これらの要素が連携し、より動的な機能を提供することになります。