// mobile_map.js
// モバイル専用の地図タブ切替・UI制御

// 設定ボタンと設定メニューの制御
function setupSettingsMenu() {
    const settingsButton = document.getElementById('settings-button');
    const settingsMenu = document.getElementById('settings-menu');
    
    if (!settingsButton || !settingsMenu) {
        console.warn('設定メニュー: 必要なDOM要素が見つかりません');
        return;
    }
    
    settingsButton.addEventListener('click', function() {
        if (settingsMenu.style.display === 'block') {
            settingsMenu.style.display = 'none';
        } else {
            settingsMenu.style.display = 'block';
        }
    });
    
    // 設定メニュー項目のイベント設定
    const shareUrlItem = document.getElementById('share-url-menu-item');
    const saveMapItem = document.getElementById('save-map-menu-item');
    const settingsItem = document.getElementById('settings-menu-item');
    
    if (shareUrlItem) {
        shareUrlItem.addEventListener('click', function() {
            // URL共有ロジックを実装
            console.log('URL共有がクリックされました');
            settingsMenu.style.display = 'none';
            // 現在のURLをコピー
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                alert('URLがクリップボードにコピーされました');
            }).catch(err => {
                console.error('URLのコピーに失敗しました', err);
            });
        });
    }
    
    if (saveMapItem) {
        saveMapItem.addEventListener('click', function() {
            // 地図保存ロジックを実装
            console.log('地図保存がクリックされました');
            settingsMenu.style.display = 'none';
            alert('地図保存機能は現在実装中です');
        });
    }
    
    if (settingsItem) {
        settingsItem.addEventListener('click', function() {
            // 設定を開くロジックを実装
            console.log('設定がクリックされました');
            settingsMenu.style.display = 'none';
            // モーダルが存在する場合は開く
            if (typeof openModal === 'function') {
                openModal('settings');
            } else {
                alert('設定画面は現在実装中です');
            }
        });
    }
}

// 地図コントロールトグルと地図コントロールパネルの制御
function setupMapControlsToggle() {
    const mapControlsToggle = document.getElementById('map-controls-toggle');
    const mapControlsPanel = document.getElementById('map-controls-panel');
    
    if (!mapControlsToggle || !mapControlsPanel) {
        console.warn('地図コントロール: 必要なDOM要素が見つかりません');
        return;
    }
    
    mapControlsToggle.addEventListener('click', function() {
        if (mapControlsToggle.classList.contains('active')) {
            mapControlsToggle.classList.remove('active');
            mapControlsPanel.style.display = 'none';
        } else {
            mapControlsToggle.classList.add('active');
            mapControlsPanel.style.display = 'block';
        }
    });
    
    // 地図コントロールパネル項目のイベント設定
    const routeAllOption = document.getElementById('route-all-option');
    const routeDayOption = document.getElementById('route-day-option');
    const mapTypeOption = document.getElementById('map-type-option');
    
    if (routeAllOption) {
        routeAllOption.addEventListener('click', function() {
            console.log('全ルート表示がクリックされました');
            mapControlsPanel.style.display = 'none';
            mapControlsToggle.classList.remove('active');
            // 全ルート表示ロジックを実装
            if (window.state) {
                window.state.displayedRouteDate = 'all';
                if (typeof displayRoutesForDate === 'function') {
                    displayRoutesForDate('all');
                }
            }
        });
    }
    
    if (routeDayOption) {
        routeDayOption.addEventListener('click', function() {
            console.log('日別ルート表示がクリックされました');
            mapControlsPanel.style.display = 'none';
            mapControlsToggle.classList.remove('active');
            // 日別ルート表示ロジックを実装
            // ここでは仮に1日目を表示
            if (window.state && window.state.placeData.length > 0) {
                const date = window.state.placeData[0].date || '1';
                window.state.displayedRouteDate = date;
                if (typeof displayRoutesForDate === 'function') {
                    displayRoutesForDate(date);
                }
            }
        });
    }
    
    if (mapTypeOption) {
        mapTypeOption.addEventListener('click', function() {
            console.log('地図タイプ切替がクリックされました');
            mapControlsPanel.style.display = 'none';
            mapControlsToggle.classList.remove('active');
            // 地図タイプ切替ロジックを実装
            if (window.state && window.state.map) {
                const currentMapType = window.state.map.getMapTypeId();
                if (currentMapType === 'roadmap') {
                    window.state.map.setMapTypeId('satellite');
                } else if (currentMapType === 'satellite') {
                    window.state.map.setMapTypeId('hybrid');
                } else if (currentMapType === 'hybrid') {
                    window.state.map.setMapTypeId('terrain');
                } else {
                    window.state.map.setMapTypeId('roadmap');
                }
            }
        });
    }
}

// モバイル機能の全体セットアップ
export function setupMobileFeatures() {
    setupMobileMapTabs();
    setupSettingsMenu();
    setupMapControlsToggle();
}

export function setupMobileMapTabs() {
    const listTab = document.getElementById('list-tab');
    const mapTab = document.getElementById('map-tab');
    const listView = document.getElementById('list-view');
    const mapView = document.getElementById('map-view');
    const mapPlaceholder = document.getElementById('mobile-map-placeholder');
    const settingsButton = document.getElementById('settings-button');
    const mapControlsToggle = document.getElementById('map-controls-toggle');
    
    if (!listTab || !mapTab || !listView || !mapView) {
        console.warn('モバイル地図タブ: 必要なDOM要素が見つかりません');
        return;
    }
    
    // 既存イベントをクリア（競合防止）
    listTab.replaceWith(listTab.cloneNode(true));
    mapTab.replaceWith(mapTab.cloneNode(true));
    const newListTab = document.getElementById('list-tab');
    const newMapTab = document.getElementById('map-tab');
    
    newListTab.addEventListener('click', function() {
        console.log('[mobile_map.js] リストタブクリック');
        newListTab.classList.add('active');
        newMapTab.classList.remove('active');
        listView.style.display = 'block';
        mapView.style.display = 'none';
        if (mapPlaceholder) mapPlaceholder.style.display = 'flex';
        
        // リスト表示時は設定ボタンを表示し、地図コントロールを非表示にする
        if (settingsButton) settingsButton.style.display = 'flex';
        if (mapControlsToggle) mapControlsToggle.style.display = 'none';
        
        // data-content属性を設定してCSSセレクタで制御できるようにする
        const mobileContent = document.getElementById('mobile-content');
        if (mobileContent) {
            mobileContent.classList.add('mobile-content-active');
            mobileContent.setAttribute('data-content', 'list');
        }
    });
    
    newMapTab.addEventListener('click', function() {
        console.log('[mobile_map.js] 地図タブクリック');
        newMapTab.classList.add('active');
        newListTab.classList.remove('active');
        listView.style.display = 'none';
        mapView.style.display = 'block';
        if (mapPlaceholder) mapPlaceholder.style.display = 'none';
        
        // 地図表示時は地図コントロールを表示し、設定ボタンを非表示にする
        if (settingsButton) settingsButton.style.display = 'none';
        if (mapControlsToggle) mapControlsToggle.style.display = 'flex';
        
        // data-content属性を設定してCSSセレクタで制御できるようにする
        const mobileContent = document.getElementById('mobile-content');
        if (mobileContent) {
            mobileContent.classList.add('mobile-content-active');
            mobileContent.setAttribute('data-content', 'map');
        }
        
        // Google Map初期化（必要なら）
        if (typeof window.initializeMap === 'function') {
            window.initializeMap();
        }
        if (window.google && window.google.maps && window.state && window.state.map) {
            setTimeout(() => {
                window.google.maps.event.trigger(window.state.map, 'resize');
            }, 200);
        }
    });
}

