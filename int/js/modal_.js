// modal.js - モーダル制御JS

// グローバル変数
let searchMap = null;
let searchMapMarker = null;

// CSSをheadに動的挿入
function injectModalCSS() {
  if (document.getElementById('modal-style')) return;
  
  const style = document.createElement('style');
  style.id = 'modal-style';
  style.textContent = `
    /* モーダル基本スタイル */
    #modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    
    #modal-container {
      background-color: #fff;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: modalFadeIn 0.3s ease;
    }
    
    @keyframes modalFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    #modal-header {
      padding: 15px;
      border-bottom: 1px solid #eee;
      position: relative;
    }
    
    #modal-title {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
    }
    
    #modal-close {
      position: absolute;
      top: 15px;
      right: 15px;
      cursor: pointer;
      font-size: 20px;
    }
    
    #modal-body {
      padding: 20px;
    }
    
    #modal-footer {
      padding: 15px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    
    .btn {
      padding: 8px 16px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
    }
    
    .btn-save {
      background-color: #2563eb;
      color: white;
    }
    
    .btn-cancel {
      background-color: #e5e7eb;
      color: #374151;
    }
    
    /* フォームスタイル */
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }
    
    .form-label.required::after {
      content: '*';
      color: red;
      margin-left: 4px;
    }
    
    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .form-textarea {
      min-height: 80px;
      resize: vertical;
    }
    
    .small-map {
      height: 200px;
      margin-top: 10px;
      border-radius: 4px;
      border: 1px solid #d1d5db;
    }
    
    .map-search {
      display: flex;
      gap: 8px;
    }
    
    .form-row {
      display: flex;
      gap: 10px;
    }
    
    .form-group.half {
      flex: 1;
    }
  `;
  
  document.head.appendChild(style);
}

// HTMLをDOMに挿入
function injectModalHTML() {
  if (document.getElementById('modal-overlay')) return;
  
  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'modal-overlay';
  
  modalOverlay.innerHTML = `
    <div id="modal-container">
      <div id="modal-header">
        <h2 id="modal-title">タイトル</h2>
        <span id="modal-close">&times;</span>
      </div>
      <div id="modal-body"></div>
      <div id="modal-footer"></div>
    </div>
  `;
  
  document.body.appendChild(modalOverlay);
  
  // イベントリスナーの設定
  document.getElementById('modal-close').addEventListener('click', closeModal);
  
  // モーダル外クリックで閉じる
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}

// モーダルを開く
function openModal(type, options = {}) {
  injectModalHTML();
  const modalOverlay = document.getElementById('modal-overlay');
  
  if (!modalOverlay) return;
  
  if (type === 'schedule') {
    setScheduleModal(options);
  } else if (type === 'settings') {
    setSettingsModal(options);
  }
  
  modalOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // スクロール防止
}

// モーダルを閉じる
function closeModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  
  if (!modalOverlay) return;
  
  modalOverlay.style.display = 'none';
  document.body.style.overflow = ''; // スクロール許可
}

// モーダルイベント設定
function setupModalEvents() {
  const closeBtn = document.getElementById('modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  
  const cancelBtn = document.getElementById('modal-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }
}

// 設定モーダル
function setSettingsModal(opts = {}) {
  document.getElementById('modal-title').textContent = '設定';
  
  const modalBody = document.getElementById('modal-body');
  if (modalBody) {
    modalBody.innerHTML = `
      <form id="settings-form">
        <div class="form-group">
          <label for="theme-select" class="form-label">テーマ</label>
          <select id="theme-select" class="form-select">
            <option value="light">ライトモード</option>
            <option value="dark">ダークモード</option>
            <option value="auto">システム設定に合わせる</option>
          </select>
        </div>
        <div class="form-group">
          <label for="map-type" class="form-label">地図タイプ</label>
          <select id="map-type" class="form-select">
            <option value="roadmap">ロードマップ</option>
            <option value="satellite">衛星写真</option>
            <option value="hybrid">ハイブリッド</option>
            <option value="terrain">地形</option>
          </select>
        </div>
      </form>
    `;
  }
  
  const modalFooter = document.getElementById('modal-footer');
  if (modalFooter) {
    modalFooter.innerHTML = `
      <button type="button" id="modal-cancel-btn" class="btn btn-cancel">キャンセル</button>
      <button type="button" id="modal-save-btn" class="btn btn-save">保存</button>
    `;
    
    const saveBtn = document.getElementById('modal-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        // 設定を保存する処理
        const theme = document.getElementById('theme-select').value;
        const mapType = document.getElementById('map-type').value;
        
        if (window.state) {
          window.state.settings = {
            ...window.state.settings,
            theme,
            mapType
          };
          
          // 設定を適用
          if (theme === 'dark') {
            document.body.classList.add('night-mode');
          } else {
            document.body.classList.remove('night-mode');
          }
          
          // マップタイプを変更
          if (window.map) {
            window.map.setMapTypeId(mapType);
          }
        }
        
        closeModal();
      });
    }
  }
  
  setupModalEvents();
}

// 予定追加モーダル
function setScheduleModal(opts = {}) {
  document.getElementById('modal-title').textContent = '予定追加';
  
  const modalBody = document.getElementById('modal-body');
  if (modalBody) {
    modalBody.innerHTML = `
      <form id="schedule-form" class="modal-form">
        <div class="form-group">
          <label for="placeName" class="form-label required">場所名</label>
          <input type="text" id="placeName" name="placeName" class="form-input" required>
        </div>
        <div class="form-group">
          <label for="placeAddress" class="form-label required">住所</label>
          <input type="text" id="placeAddress" name="placeAddress" class="form-input" required>
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label for="placeDate" class="form-label">日付</label>
            <input type="date" id="placeDate" name="placeDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group half">
            <label for="placeArrivalTime" class="form-label">到着時間</label>
            <input type="time" id="placeArrivalTime" name="placeArrivalTime" class="form-input" value="12:00">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label for="placeDepartureTime" class="form-label">出発時間</label>
            <input type="time" id="placeDepartureTime" name="placeDepartureTime" class="form-input" value="13:00">
          </div>
          <div class="form-group half">
            <label for="placeCategory" class="form-label required">カテゴリ</label>
            <select id="placeCategory" name="placeCategory" class="form-select" required>
              <option value="" disabled selected>カテゴリを選択...</option>
              <option value="観光">観光</option>
              <option value="食事">食事</option>
              <option value="ホテル">ホテル</option>
              <option value="移動">移動</option>
              <option value="買い物">買い物</option>
              <option value="イベント">イベント</option>
              <option value="休憩">休憩</option>
              <option value="その他">その他</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="placeTransport" class="form-label">次の地点への移動手段</label>
          <select id="placeTransport" name="placeTransport" class="form-select">
            <option value="不明">不明</option>
            <option value="✈️飛行機">✈️飛行機</option>
            <option value="🚄電車">🚄電車</option>
            <option value="🚌バス">🚌バス</option>
            <option value="🚗車">🚗車</option>
            <option value="🚗レンタカー">🚗レンタカー</option>
            <option value="🚶徒歩">🚶徒歩</option>
            <option value="🚕タクシー">🚕タクシー</option>
            <option value="🚲自転車">🚲自転車</option>
            <option value="⛵船">⛵船</option>
            <option value="その他">その他</option>
          </select>
        </div>
        <div class="form-group">
          <label for="placeTags" class="form-label">タグ（カンマ区切り）</label>
          <input type="text" id="placeTags" name="placeTags" class="form-input" placeholder="例: 夜景、絶景、カフェ">
        </div>
        <div class="form-group">
          <label for="placeMemo" class="form-label">メモ</label>
          <textarea id="placeMemo" name="placeMemo" class="form-textarea" rows="3"></textarea>
        </div>
        <div class="form-group">
          <div class="map-search">
            <input type="text" id="search-for-place" class="form-input" placeholder="場所を検索...">
            <button type="button" id="search-place-btn" class="btn">検索</button>
          </div>
        </div>
        <div class="form-group">
          <div id="search-map" class="small-map"></div>
          <input type="hidden" id="place-lat" name="placeLat">
          <input type="hidden" id="place-lng" name="placeLng">
        </div>
      </form>
    `;
    
    const modalFooter = document.getElementById('modal-footer');
    if (modalFooter) {
      modalFooter.innerHTML = `
        <button type="button" id="modal-cancel-btn" class="btn btn-cancel">キャンセル</button>
        <button type="button" id="modal-save-btn" class="btn btn-save">保存</button>
      `;
      
      const saveBtn = document.getElementById('modal-save-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', handleScheduleSave);
      }
    }
    
    // 検索機能のセットアップ
    setTimeout(() => {
      initializeModalAutocomplete();
      initSearchMapForModal();
    }, 500);
  }
}

// 予定追加の保存ハンドラー
function handleScheduleSave() {
  // フォームから値を取得
  const name = document.getElementById('placeName').value;
  const address = document.getElementById('placeAddress').value;
  const date = document.getElementById('placeDate').value;
  const arrivalTime = document.getElementById('placeArrivalTime').value || '';
  const departureTime = document.getElementById('placeDepartureTime').value || '';
  const category = document.getElementById('placeCategory').value;
  const transport = document.getElementById('placeTransport').value;
  const memo = document.getElementById('placeMemo').value;
  const tags = document.getElementById('placeTags').value;
  const lat = document.getElementById('place-lat').value;
  const lng = document.getElementById('place-lng').value;
  
  // 必須フィールドのバリデーション
  if (!name || !address || !category) {
    alert('場所名、住所、カテゴリは必須入力です。');
    return;
  }
  
  // 新しい場所データの作成
  const newPlace = {
    id: Date.now().toString(), // ユニークIDの生成
    name,
    address,
    date,
    arrivalTime,
    departureTime,
    category,
    transport,
    memo,
    tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [],
    lat: parseFloat(lat) || null,
    lng: parseFloat(lng) || null,
    created: new Date().toISOString()
  };
  
  // window.stateがあればデータを追加
  if (window.state && window.state.placeData) {
    window.state.placeData.push(newPlace);
    
    // データ保存関数を呼び出す
    if (typeof window.savePlaceData === 'function') {
      window.savePlaceData();
    } else if (typeof savePlaceData === 'function') {
      savePlaceData();
    }
    
    // リストとマップを更新
    if (typeof window.renderPlaceList === 'function') {
      window.renderPlaceList();
    }
    if (typeof window.renderMap === 'function') {
      window.renderMap();
    }
    
    console.log('場所を追加しました:', newPlace);
  } else {
    console.error('状態データが保存できません');
  }
  
  // モーダルを閉じる
  closeModal();
}

// Autocompleteを設定する関数
function initializeModalAutocomplete() {
  const input = document.getElementById('placeAddress');
  const nameField = document.getElementById('placeName');
  const latField = document.getElementById('place-lat');
  const lngField = document.getElementById('place-lng');
  
  if (!input || !nameField || !window.google || !window.google.maps || !window.google.maps.places) {
    console.log('検索機能に必要な要素が満たされていません');
    return;
  }
  
  const autocomplete = new window.google.maps.places.Autocomplete(input, {
    types: ['establishment', 'geocode'],
    componentRestrictions: { country: 'jp' },
    fields: ['name', 'formatted_address', 'geometry', 'address_components']
  });
  
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
      console.warn('選択された場所の地理情報がありません');
      return;
    }
    
    nameField.value = place.name || place.formatted_address || '';
    
    // 緯度経度を保存
    if (latField && lngField && place.geometry.location) {
      latField.value = place.geometry.location.lat();
      lngField.value = place.geometry.location.lng();
    }
    
    // 地図で場所を表示
    showLocationOnSearchMap(place.geometry.location.lat(), place.geometry.location.lng(), place.name);
  });
}

// 検索用の小さい地図の初期化
function initSearchMapForModal() {
  const mapDiv = document.getElementById('search-map');
  const searchInput = document.getElementById('search-for-place');
  const searchBtn = document.getElementById('search-place-btn');
  
  if (!mapDiv || !window.google || !window.google.maps) {
    console.log('地図を初期化できません');
    return;
  }
  
  // 小さい地図を初期化
  searchMap = new window.google.maps.Map(mapDiv, {
    center: { lat: 35.6812, lng: 139.7671 }, // 東京駅をデフォルトに
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false
  });
  
  // 場所検索ボタンのイベント設定
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value;
      if (!query) return;
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: query }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          // 地図で場所を表示
          showLocationOnSearchMap(lat, lng, results[0].formatted_address);
          
          // フォームに入力
          document.getElementById('placeName').value = results[0].formatted_address.split(',')[0] || query;
          document.getElementById('placeAddress').value = results[0].formatted_address;
          document.getElementById('place-lat').value = lat;
          document.getElementById('place-lng').value = lng;
        } else {
          alert('場所を見つけることができませんでした。');
        }
      });
    });
  }
  
  // 既存の緯度経度があれば表示
  const lat = document.getElementById('place-lat').value;
  const lng = document.getElementById('place-lng').value;
  const name = document.getElementById('placeName').value;
  
  if (lat && lng) {
    showLocationOnSearchMap(parseFloat(lat), parseFloat(lng), name);
  }
}

// 検索マップに場所を表示
function showLocationOnSearchMap(lat, lng, title) {
  if (!searchMap) return;
  
  // 既存のマーカーを削除
  if (searchMapMarker) {
    searchMapMarker.setMap(null);
  }
  
  const location = new window.google.maps.LatLng(lat, lng);
  
  // 地図の中心を移動
  searchMap.setCenter(location);
  
  // 新しいマーカーを作成
  searchMapMarker = new window.google.maps.Marker({
    position: location,
    map: searchMap,
    title: title || '選択した場所'
  });
}

// グローバルモーダル呼び出し機能を追加
window.showScheduleModal = function() {
  openModal('schedule');
};

window.showSettingsModal = function() {
  openModal('settings');
};

window.showDataManageModal = function() {
  // データ管理モーダルの設定
  openModal('settings', { tab: 'data' });
};

window.closeModalGlobal = function() {
  closeModal();
};

// 初期化処理
function initModals() {
  injectModalCSS();
  setupModalEvents();
}

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', initModals);

// 公開API
export { 
  openModal, 
  closeModal, 
  setScheduleModal, 
  setSettingsModal 
};
