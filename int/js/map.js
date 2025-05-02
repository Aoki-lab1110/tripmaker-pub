// map.js - 地図関連機能
import { savePlaceData } from './data.js';
import { renderUI } from './ui.js';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../config.js';

// シングルトンパターンでマップインスタンスを管理
const getMapInstance = (() => {
  let instance = null;
  
  return () => {
    if (instance) return instance;
    
    if (!window.google?.maps) {
      throw new Error('Google Maps APIが正しく読み込まれていません');
    }
    
    // 対応表に基づいてコンテナ要素を取得
    let container = document.getElementById('map');
    
    // 見つからない場合は他の選択子も試す
    if (!container) {
      container = document.querySelector('.map-container');
    }
    
    // それでも見つからない場合は様々なクラスやIDを試す
    if (!container) {
      container = document.getElementById('map-container') ||
                document.getElementById('tm-map-container') ||
                document.querySelector('[data-role="map-area"]');
    }
    
    if (!container) {
      throw new Error('マップコンテナ要素が見つかりません。対応表のインデックス.htmlを確認してください。');
    }
    
    instance = new google.maps.Map(container, {
      center: { lat: 35.6812, lng: 139.7671 },
      zoom: 12,
      disableDefaultUI: true,
      gestureHandling: 'greedy'
    });
    
    return instance;
  };
})();

// グローバルマップインスタンス
let _mapInstance = null;

// マップ初期化メソッド
export async function initMap() {
  console.group('マップ初期化プロセス');
  
  try {
    // すでに初期化済みならインスタンスを返す
    if (_mapInstance) {
      console.debug('マップは既に初期化されています');
      return _mapInstance;
    }
    
    // DOMにはすぐにアクセスできない場合があるので、少し待つ
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 対応表に基づき、正しい要素IDを確認
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      // 必要な要素がない場合は作成
      console.warn('マップ要素が見つからないため、作成します');
      
      // コンテナを取得
      const mapContainer = document.getElementById('tm-map-container') || 
                          document.querySelector('.map-container');
      
      if (!mapContainer) {
        throw new Error('マップコンテナが見つかりません');
      }
      
      // map要素を作成
      const newMapElement = document.createElement('div');
      newMapElement.id = 'map';
      newMapElement.style.width = '100%';
      newMapElement.style.height = '100%';
      newMapElement.style.minHeight = '500px';
      
      // コンテナに追加
      mapContainer.appendChild(newMapElement);
      
      console.debug('新しいマップ要素を作成しました');
    }

    // API読み込み確認
    if (!window.google?.maps) {
      throw new Error('Google Maps APIが正しく読み込まれていません');
    }
    
    console.debug('マップを初期化しています...');
    _mapInstance = new google.maps.Map(document.getElementById('map'), {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: true,
      mapTypeControl: true,
      fullscreenControl: true
    });
    
    // マップコントロールの設定
    setupMapControls();
    
    console.debug('マップインスタンス作成成功！');
    
    // 初期化完了イベントを発行
    window.dispatchEvent(new CustomEvent('map-initialized'));
    
    return _mapInstance;
    
  } catch (error) {
    console.error('マップ初期化エラー:', error);
    alert('地図の初期化に失敗しました: ' + error.message);
    throw error;
    
  } finally {
    console.groupEnd();
  }
}

// マップコントロール初期化
function setupMapControls() {
  console.debug('マップコントロールを初期化します');
  
  try {
    // 全ルート表示ボタン
    const allRoutesElements = [
      document.getElementById('fit-all-routes-btn'),
      document.querySelector('[data-role="desktop-show-all-routes"]'),
      document.querySelector('[data-role="mobile-show-all-routes"]'),
      document.getElementById('mobile-all-routes-btn')
    ];
    
    allRoutesElements.forEach(element => {
      if (element) {
        element.addEventListener('click', () => {
          console.debug('全ルート表示がクリックされました');
          fitMapToAllRoutes();
        });
      }
    });
    
    // ピン表示切替セレクター
    const pinDisplaySelectors = [
      document.getElementById('pinDisplaySelector'),
      document.querySelector('[data-role="pin-display"]')
    ];
    
    pinDisplaySelectors.forEach(selector => {
      if (selector) {
        selector.addEventListener('change', (e) => {
          console.debug(`ピン表示モードを変更: ${e.target.value}`);
          updateMarkerDisplayMode(e.target.value);
          
          // 日付セレクターの表示制御
          const dateSelector = document.getElementById('date-filter-selector');
          if (dateSelector) {
            if (e.target.value === 'date') {
              // 日付フィルターを表示
              dateSelector.parentElement.style.display = 'block';
            } else {
              // 日付フィルターを非表示
              dateSelector.parentElement.style.display = 'none';
            }
          }
        });
      }
    });
    
    // 日付フィルターセレクター
    const dateFilterSelector = document.getElementById('date-filter-selector');
    if (dateFilterSelector) {
      // 初期状態では非表示
      dateFilterSelector.parentElement.style.display = 'none';
      
      // 日付オプションの生成
      populateDateFilterOptions();
      
      dateFilterSelector.addEventListener('change', (e) => {
        console.debug(`日付フィルターを変更: ${e.target.value}`);
        if (e.target.value === 'all') {
          refreshMarkers();
        } else {
          // 特定の日付のみ表示
          displayRoutesForDate(e.target.value);
        }
      });
    }
    
    // 日付フィルターセレクター
    const dayFilterSelectors = [
      document.getElementById('day-filter-select'),
      document.getElementById('mobile-day-select'),
      document.querySelector('[data-role="day-filter"]'),
      document.querySelector('[data-role="mobile-day-filter"]')
    ];
    
    dayFilterSelectors.forEach(selector => {
      if (selector) {
        selector.addEventListener('change', (e) => {
          const selectedDate = e.target.value;
          console.debug(`日付フィルター変更: ${selectedDate}`);
          
          if (selectedDate === 'all') {
            // 全て表示
            window.state.displayedRouteDate = null;
            refreshMarkers();
            fitMapToAllRoutes();
          } else {
            // 日付でフィルタリング
            displayRoutesForDate(selectedDate);
          }
        });
      }
    });
    
    // 地図タイプ切替
    const mapTypeSelector = document.getElementById('map-type-selector');
    if (mapTypeSelector) {
      mapTypeSelector.addEventListener('change', (e) => {
        const mapType = e.target.value;
        const mapInstance = _mapInstance || getMapInstance();
        if (mapInstance) {
          mapInstance.setMapTypeId(mapType);
          localStorage.setItem('map_type', mapType);
        }
      });
    }
    
    console.debug('マップコントロール設定完了');
  } catch (error) {
    console.error('マップコントロール初期化エラー:', error);
  }
}

// すべてのルート表示ボタン
const allRoutesBtn = document.getElementById('show-all-routes-btn');
if (allRoutesBtn) {
  allRoutesBtn.addEventListener('click', function() {
    displayRoutesForDate('all');
  });
}

// マーカー表示モード更新
function updateMarkerDisplayMode(mode) {
  window.state.activeMarkerDisplay = mode;
  window.state.metadata.markerDisplayMode = mode;
  
  // マーカーラベル更新
  refreshMarkers();
  
  // メタデータ保存
  saveMarkerDisplayMode();
}

// マーカー表示モード保存
function saveMarkerDisplayMode() {
  if (window.state.metadata) {
    window.state.metadata.markerDisplayMode = window.state.activeMarkerDisplay;
    // データ保存
    localStorage.setItem('tripmaker_metadata', JSON.stringify(window.state.metadata));
  }
}

// 日付フィルターオプションを生成
function populateDateFilterOptions() {
  const dateSelector = document.getElementById('date-filter-selector');
  if (!dateSelector || !window.state || !window.state.placeData) return;
  
  // 既存のオプションをクリア
  while (dateSelector.options.length > 1) { // 「すべての日付」オプションを残す
    dateSelector.remove(1);
  }
  
  // 全ての場所から日付を取得
  const uniqueDates = new Set();
  
  window.state.placeData.forEach(place => {
    if (place.date) {
      uniqueDates.add(place.date);
    }
  });
  
  // 日付ごとにソート
  const sortedDates = Array.from(uniqueDates).sort();
  
  // 日付オプションを追加
  sortedDates.forEach((date, index) => {
    const option = document.createElement('option');
    option.value = date;
    
    // 日付フォーマットを整形
    const formattedDate = new Date(date);
    const month = formattedDate.getMonth() + 1;
    const day = formattedDate.getDate();
    option.text = `Day ${index + 1} (${month}/${day})`;
    
    dateSelector.appendChild(option);
  });
}

// マーカー更新
function refreshMarkers() {
  console.debug('マーカーを更新します');
  
  // 入力チェック
  const mapInstance = _mapInstance || getMapInstance();
  if (!mapInstance) {
    console.error('マップインスタンスがありません');
    return;
  }
  
  // 既存のマーカーをクリア
  clearMarkers();
  
  // グローバル状態の確認
  window.state = window.state || { placeData: [], markers: [], routes: [] };
  
  // データがない場合は何もしない
  if (!window.state.placeData || window.state.placeData.length === 0) {
    console.debug('表示する場所データがありません');
    return;
  }
  
  // マーカーを作成
  window.state.placeData.forEach((place, index) => {
    addMarker(place, index);
  });
  
  console.debug(`${window.state.markers.length}個のマーカーを表示しました`);
}

// マーカークリア
function clearMarkers() {
  if (window.state.markers && window.state.markers.length > 0) {
    window.state.markers.forEach(marker => {
      if (marker) {
        marker.setMap(null);
      }
    });
  }
  window.state.markers = [];
}

// マーカー追加
function addMarker(place, index) {
  // 座標が有効か確認
  if (!place.lat || !place.lng || !isValidCoordinate({lat: parseFloat(place.lat), lng: parseFloat(place.lng)})) {
    return null;
  }
  
  // マーカータイプに基づいたラベルを生成
  let label = '';
  let color = '#4285F4'; // デフォルト青色
  
  switch (window.state.activeMarkerDisplay) {
    case 'sequence':
      label = `${index + 1}`;
      break;
    case 'date':
      // 日付の頭文字または数字を使用
      if (place.date) {
        const dateObj = new Date(place.date);
        label = dateObj.getDate().toString();
        color = getColorForDate(place.date);
      } else {
        label = '?';
        color = '#9E9E9E'; // 日付なしはグレー
      }
      break;
    case 'category':
      // カテゴリの頭文字を使用
      if (place.category) {
        label = place.category.charAt(0);
        color = getCategoryColor(place.category);
      } else {
        label = '?';
        color = '#9E9E9E'; // カテゴリなしはグレー
      }
      break;
  }
  
  // マーカーオプション
  const markerOptions = {
    position: { lat: parseFloat(place.lat), lng: parseFloat(place.lng) },
    map: window.state.map,
    label: {
      text: label,
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    title: place.name,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.9,
      strokeWeight: 1,
      strokeColor: 'white',
      scale: 12
    }
  };
  
  // マーカー作成
  const marker = new google.maps.Marker(markerOptions);
  
  // クリックイベント
  marker.addListener('click', function() {
    window.dispatchEvent(new CustomEvent('marker_click', {
      detail: { placeId: place.id }
    }));
  });
  
  // マーカー配列に追加
  window.state.markers.push(marker);
  
  return marker;
}

// 座標の有効性確認
function isValidCoordinate(coord) {
  return coord.lat >= -90 && coord.lat <= 90 && coord.lng >= -180 && coord.lng <= 180;
}

// カテゴリに基づく色を取得
function getCategoryColor(category) {
  const colors = {
    '観光': '#FF5722', // オレンジ
    '食事': '#4CAF50', // グリーン
    'ホテル': '#9C27B0', // パープル
    '移動': '#3F51B5', // インディゴ
    '買い物': '#E91E63', // ピンク
    'イベント': '#FFC107', // アンバー
    '休憩': '#795548', // ブラウン
    'その他': '#607D8B'  // ブルーグレー
  };
  
  return colors[category] || '#4285F4'; // デフォルトは青
}

// 日付に基づく色を取得
function getColorForDate(dateStr) {
  // 日付のハッシュに基づいて色を生成
  const hashValue = hashCode(dateStr) % 10;
  const colors = [
    '#4285F4', // 青
    '#EA4335', // 赤
    '#FBBC05', // 黄
    '#34A853', // 緑
    '#8E24AA', // 紫
    '#16A2D7', // 水色
    '#FF5722', // オレンジ
    '#795548', // 茶
    '#9E9E9E', // グレー
    '#607D8B'  // ブルーグレー
  ];
  
  return colors[hashValue];
}

// 文字列のハッシュ値を計算（色分け用）
function hashCode(str) {
  let hash = 0;
  if (!str || str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return Math.abs(hash);
}

// 地図を全ルートに合わせる
function fitMapToAllRoutes() {
  if (!window.state.map) return;
  
  const bounds = new google.maps.LatLngBounds();
  let hasValidBounds = false;
  
  // 表示されているマーカーを含める
  if (window.state.markers && window.state.markers.length > 0) {
    window.state.markers.forEach(marker => {
      if (marker && marker.getVisible()) {
        bounds.extend(marker.getPosition());
        hasValidBounds = true;
      }
    });
  }
  
  // 表示されているルートを含める
  if (window.state.routePolylines && window.state.routePolylines.length > 0) {
    window.state.routePolylines.forEach(polyline => {
      if (polyline && polyline.getVisible()) {
        const path = polyline.getPath();
        path.forEach(latLng => {
          bounds.extend(latLng);
          hasValidBounds = true;
        });
      }
    });
  }
  
  // 有効な境界があれば地図に適用
  if (hasValidBounds) {
    window.state.map.fitBounds(bounds);
    
    // ズームレベルの調整（あまりに遠すぎる場合）
    const listener = google.maps.event.addListener(window.state.map, 'idle', function() {
      if (window.state.map.getZoom() > 16) {
        window.state.map.setZoom(16);
      }
      google.maps.event.removeListener(listener);
    });
  }
}

// 日付ごとのルート表示
function displayRoutesForDate(dateToShow, allowToggle = true) {
  if (!window.state.routes || !window.state.routePolylines) {
    console.warn('ルートが計算されていません');
    return;
  }
  
  // アクティブ日付と同じ場合はトグル動作（全ルート表示に戻る）
  if (allowToggle && window.state.displayedRouteDate === dateToShow) {
    dateToShow = 'all';
  }
  
  // 表示日付を保存
  window.state.displayedRouteDate = dateToShow;
  
  // ボタンのハイライト更新
  updateDayRouteButtonHighlights();
  
  // すべてのルートを表示/非表示
  window.state.routePolylines.forEach(polyline => {
    if (!polyline) return;
    
    const routeDate = polyline.routeDate; // ポリラインに保存された日付
    
    if (dateToShow === 'all') {
      // すべて表示
      polyline.setVisible(true);
    } else if (dateToShow === 'none') {
      // すべて非表示
      polyline.setVisible(false);
    } else {
      // 特定の日付のみ表示
      polyline.setVisible(routeDate === dateToShow);
    }
  });
}

// 日付ルートボタンのハイライト更新
function updateDayRouteButtonHighlights() {
  const buttons = document.querySelectorAll('.day-route-btn');
  const allRoutesBtn = document.getElementById('show-all-routes-btn');
  
  // 日付ボタンの更新
  buttons.forEach(btn => {
    const btnDate = btn.dataset.date;
    if (btnDate === window.state.displayedRouteDate) {
      btn.classList.add('active-day-route');
    } else {
      btn.classList.remove('active-day-route');
    }
  });
  
  // 全ルートボタンの更新
  if (allRoutesBtn) {
    if (window.state.displayedRouteDate === 'all') {
      allRoutesBtn.classList.add('active');
    } else {
      allRoutesBtn.classList.remove('active');
    }
  }
}

// 地点詳細ポップアップを表示
function displayPlacePopup(placeId) {
  const place = window.state.placeData.find(p => p.id === placeId);
  if (!place) return;
  
  const popup = document.getElementById('map-popup');
  if (!popup) return;
  
  // ポップアップ内容を設定
  document.getElementById('popup-title').textContent = place.name;
  document.getElementById('popup-category').textContent = place.category || 'カテゴリなし';
  document.getElementById('popup-date').textContent = place.date ? new Date(place.date).toLocaleDateString('ja-JP') : '日付なし';
  document.getElementById('popup-time').textContent = place.time || '時間なし';
  document.getElementById('popup-address').textContent = place.address || '住所なし';
  document.getElementById('popup-memo').textContent = place.memo || 'メモなし';
  
  // タグ表示
  const tagsContainer = document.getElementById('popup-tags');
  tagsContainer.innerHTML = '';
  if (place.tags && place.tags.length > 0) {
    place.tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'popup-tag';
      tagEl.textContent = tag;
      tagsContainer.appendChild(tagEl);
    });
  } else {
    const noTag = document.createElement('span');
    noTag.className = 'popup-tag empty';
    noTag.textContent = 'タグなし';
    tagsContainer.appendChild(noTag);
  }
  
  // 編集・削除ボタンのイベント更新
  const editBtn = document.getElementById('popup-edit-btn');
  const deleteBtn = document.getElementById('popup-delete-btn');
  
  editBtn.onclick = () => {
    // 編集モーダルを開く処理（modal.jsを使用）
    if (window.openEditPlaceModal) {
      window.openEditPlaceModal(place, function(updatedPlace) {
        // 保存後の処理
        const index = window.state.placeData.findIndex(p => p.id === updatedPlace.id);
        if (index !== -1) {
          window.state.placeData[index] = updatedPlace;
          savePlaceData();
          renderUI(true);
          popup.classList.remove('visible');
        }
      });
    }
  };
  
  deleteBtn.onclick = () => {
    if (confirm(`「${place.name}」を削除しますか？`)) {
      // 場所を削除する処理
      window.state.placeData = window.state.placeData.filter(p => p.id !== place.id);
      savePlaceData();
      renderUI(true);
      popup.classList.remove('visible');
    }
  };
  
  // ポップアップを表示
  popup.classList.add('visible');
  
  // 閉じるボタンの処理
  document.getElementById('popup-close-btn').onclick = () => {
    popup.classList.remove('visible');
  };
}

// ルート情報の取得
function getRouteDetails(index) {
  const route = window.state.routes[index];
  if (!route) return null;
  
  return {
    distance: route.distance,
    duration: route.duration,
    transport: route.transport
  };
}

// 公開API
export {
  addMarker,
  getCategoryColor,
  getColorForDate,
  initMap as default,
  setupMapControls,
  populateDateFilterOptions,
  updateMarkerDisplayMode,
  refreshMarkers,
  displayRoutesForDate,
  fitMapToAllRoutes
};
