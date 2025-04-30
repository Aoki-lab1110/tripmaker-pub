// mobile_map.js
// モバイル専用の地図タブ切替・UI制御

export function setupMobileMapTabs() {
    const listTab = document.getElementById('list-tab');
    const mapTab = document.getElementById('map-tab');
    const listView = document.getElementById('list-view');
    const mapView = document.getElementById('map-view');
    const mapPlaceholder = document.getElementById('mobile-map-placeholder');
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
    });
    newMapTab.addEventListener('click', function() {
        console.log('[mobile_map.js] 地図タブクリック');
        newMapTab.classList.add('active');
        newListTab.classList.remove('active');
        listView.style.display = 'none';
        mapView.style.display = 'block';
        if (mapPlaceholder) mapPlaceholder.style.display = 'none';
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

