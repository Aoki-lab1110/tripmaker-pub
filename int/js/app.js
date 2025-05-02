// app.js - アプリケーションのメインエントリーポイント
import { setupMapControls, refreshMarkers, clearMarkers, fitMapToAllRoutes } from './map.js';
import { loadPlaceData, savePlaceData, exportDataToJson, importDataFromJson, loadMetadata, saveMetadata } from './data.js';
import { renderUI, setupEventListeners, initToggleEvents, updateHeaderTripName, setupMobileView } from './ui.js';

// グローバル状態
window.state = {
  map: null,                // Google Map インスタンス
  markers: [],              // 地図上のマーカー
  routes: [],               // 表示中のルート
  placeData: [],            // 場所データ
  routePolylines: [],       // ルートライン
  displayedRouteDate: 'all',// 表示中の日付ルート
  activeMarkerDisplay: 'sequence', // マーカー表示モード（sequence, date, category）
  metadata: {               // メタデータ
    tripName: 'Tripmaker Lab β',
    routesCalculated: false,
    markerDisplayMode: 'sequence'
  },
  isDirty: false,           // 未保存の変更があるか
  isRoutesDirty: false,     // ルート再計算が必要か
  searchService: null,      // 場所検索サービス
  geocoder: null            // ジオコーダー
};

// アプリケーション初期化
export function initApp() {
  console.log('Tripmaker アプリケーション初期化中...');
  
  // グローバル状態の確認と初期化
  if (!window.state) {
    window.state = {
      map: null,
      markers: [],
      routes: [],
      placeData: [],
      routePolylines: [],
      displayedRouteDate: 'all',
      activeMarkerDisplay: 'sequence',
      metadata: { tripName: 'Tripmaker Lab β', routesCalculated: false },
      isDirty: false,
      isRoutesDirty: false
    };
  }
  
  // データ読み込み
  loadMetadata();
  loadPlaceData();
  
  // 検索入力欄の設定
  setupSearchInput();
  
  // Google Maps API読み込み後の処理
  window.initMap = function() {
    console.log('Google Maps 初期化...');
    initMap();
    
    // Google 検索サービス初期化
    if (window.google?.maps) {
      window.state.searchService = new google.maps.places.PlacesService(document.createElement('div'));
      window.state.geocoder = new google.maps.Geocoder();
    }
    
    // UIのレンダリング
    renderUI(true, true);
    
    // イベントリスナー設定
    setupEventListeners();
    initToggleEvents();
    
    // モバイル対応の設定
    setupMobileView();
    
    // その他初期設定
    updateHeaderTripName();
    setupMapControls();
    
    // Dark Mode適用（保存されている設定があれば）
    const isDarkMode = localStorage.getItem('tripmaker_dark_mode') === 'true';
    if (isDarkMode) {
      document.body.classList.add('night-mode');
    }
  };
  
  // Google Maps API非同期読み込み
  if (!window.google || !window.google.maps) {
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAQD6no6w3iNOMziL2Gc3IcmZHamuPht3c&callback=initMap&libraries=places,marker,routes,geometry&v=weekly';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  } else {
    window.initMap();
  }
}

// DOM読み込み完了後に初期化実行
document.addEventListener('DOMContentLoaded', initApp);

// 未保存データチェック（ページ離脱時）
window.addEventListener('beforeunload', function(e) {
  if (window.state.isDirty) {
    const message = '保存されていない変更があります。本当にページを離れますか？';
    e.returnValue = message;
    return message;
  }
});

// ナビゲーション操作
export function navigateTo(tabId) {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => tab.classList.remove('active'));
  contents.forEach(content => content.style.display = 'none');
  
  document.getElementById(tabId).classList.add('active');
  
  if (tabId === 'list-tab') {
    document.getElementById('list-view').style.display = 'block';
  } else if (tabId === 'map-tab') {
    document.getElementById('map-view').style.display = 'block';
    // 地図サイズリフレッシュ
    if (window.google && window.google.maps && window.state.map) {
      setTimeout(() => {
        google.maps.event.trigger(window.state.map, 'resize');
        fitMapToAllRoutes();
      }, 100);
    }
  }
}

// ダークモード切替
export function toggleDarkMode() {
  const isDarkMode = document.body.classList.toggle('night-mode');
  localStorage.setItem('tripmaker_dark_mode', isDarkMode);
  // 地図スタイル更新（もし地図が初期化されていれば）
  if (window.state.map) {
    const mapStyles = isDarkMode ? [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      // 他のスタイル設定...
    ] : [];
    
    window.state.map.setOptions({
      styles: mapStyles
    });
  }
  return isDarkMode;
}

export function initMap() {
  // 別ファイルに実装されている
}

// 検索入力欄のセットアップ
function setupSearchInput() {
  console.debug('検索入力欄をセットアップします');
  
  // 検索入力欄要素取得
  const searchInput = document.getElementById('search-places-input');
  if (!searchInput) {
    console.warn('検索入力欄が見つかりません');
    return;
  }
  
  // エンターキー押下時のイベント
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && this.value.trim()) {
      e.preventDefault();
      searchAndAddPlace(this.value.trim());
      this.value = ''; // 入力内容をクリア
    }
  });
  
  // モバイル用検索入力欄
  const mobileSearchInput = document.getElementById('mobile-search-input');
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && this.value.trim()) {
        e.preventDefault();
        searchAndAddPlace(this.value.trim());
        this.value = ''; // 入力内容をクリア
      }
    });
  }
  
  // モバイル用地点追加ボタン
  const mobileAddBtn = document.getElementById('mobile-add-btn');
  if (mobileAddBtn) {
    mobileAddBtn.addEventListener('click', function() {
      window.showScheduleModal && window.showScheduleModal();
    });
  }
}

// 場所検索と追加
function searchAndAddPlace(query) {
  console.debug(`場所を検索します: ${query}`);
  
  // Google Places APIが利用可能か確認
  if (!window.google?.maps?.places || !window.state.searchService) {
    console.error('Google Places APIが利用できません');
    alert('検索機能を使用するにはGoogle Maps APIが必要です');
    return;
  }
  
  // 検索リクエスト設定
  const request = {
    query: query,
    fields: ['name', 'geometry', 'formatted_address', 'place_id'],
  };
  
  // 検索実行
  window.state.searchService.findPlaceFromQuery(request, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
      // 最初の検索結果を取得
      const place = results[0];
      
      // 場所データを作成
      const placeData = {
        id: place.place_id || generateId(),
        name: place.name,
        address: place.formatted_address || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        category: '観光スポット', // デフォルトカテゴリ
        date: new Date().toISOString().split('T')[0], // 今日の日付
        time: '12:00',
        notes: '',
        tags: []
      };
      
      // 場所データを追加
      if (!window.state.placeData) window.state.placeData = [];
      window.state.placeData.push(placeData);
      
      // データ保存
      savePlaceData();
      
      // UI再描画
      renderUI(true, true);
      
      // 追加場所にマップを移動
      const mapInstance = window.state.map;
      if (mapInstance) {
        mapInstance.setCenter({ lat: placeData.lat, lng: placeData.lng });
        mapInstance.setZoom(15);
      }
      
      console.debug('場所を追加しました:', placeData.name);
    } else {
      console.error('場所検索エラー:', status);
      alert(`「${query}」の検索結果が見つかりませんでした`);
    }
  });
}

// ID生成用ヘルパー関数
function generateId() {
  return 'p' + Math.random().toString(36).substring(2, 10);
}
