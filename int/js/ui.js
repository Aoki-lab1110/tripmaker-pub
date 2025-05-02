// ui.js - UI操作・表示関連機能
import { savePlaceData, deletePlace } from './data.js';
import { refreshMarkers, displayRoutesForDate, fitMapToAllRoutes } from './map.js';
import { setupMobileFeatures } from './mobile_map.js';
import { openModal } from './modal_.js';

// UI全体の初期描画/再描画
// UI初期化処理
export function renderUI(calculateRoutes = true, fitMap = false) {
  console.group('UI初期化プロセス');
  
  try {
    // 複数の可能性のあるIDをチェック
    const appSelectors = ['#app', '#sortable-list', '[data-role="sortable-container"]', '.list-container'];
    let appContainer = null;
    
    // DOMアクセスは非同期に処理
    for (const selector of appSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        appContainer = element;
        console.debug(`アプリケーションコンテナ発見: ${selector}`);
        break;
      }
    }

    // もしも見つからない場合は作成する
    if (!appContainer) {
      console.warn('アプリケーションコンテナが見つからないため、新規作成します');
      appContainer = document.createElement('div');
      appContainer.id = 'app';
      document.body.appendChild(appContainer);
    }

    console.log('UI再描画中...');
    
    // グローバル状態の確認
    window.state = window.state || {
      placeData: [],
      markers: [],
      routes: [],
      displayedRouteDate: null
    };
    
    try {
      // リスト表示更新
      if (typeof renderListGroupedByDate === 'function') {
        renderListGroupedByDate();
      }
    } catch (e) {
      console.warn('リスト表示更新でエラー:', e);
    }
    
    try {
      // マーカー更新
      if (typeof refreshMarkers === 'function') {
        refreshMarkers();
      }
    } catch (e) {
      console.warn('マーカー更新でエラー:', e);
    }
    
    try {
      // ルート表示更新
      if (window.state.displayedRouteDate && typeof displayRoutesForDate === 'function') {
        displayRoutesForDate(window.state.displayedRouteDate, false);
      }
    } catch (e) {
      console.warn('ルート表示更新でエラー:', e);
    }
    
    // 地図の表示範囲調整
    if (fitMap && typeof fitMapToAllRoutes === 'function') {
      setTimeout(() => {
        try {
          fitMapToAllRoutes();
        } catch (e) {
          console.warn('地図表示範囲調整でエラー:', e);
        }
      }, 500);
    }
    
    console.debug('UI初期化完了');
    
  } catch (error) {
    console.error('UI初期化エラー:', error);
    
  } finally {
    console.groupEnd();
  }
}

// 日付ごとにグループ化されたリストを描画
function renderListGroupedByDate() {
  // 複数の可能性のあるIDを確認
  const listSelectors = [
    '#sortable-list', 
    '#app', 
    '[data-role="sortable-container"]', 
    '.sortable-list'
  ];
  
  let listContainer = null;
  
  // いずれかの要素を探す
  for (const selector of listSelectors) {
    const found = document.querySelector(selector);
    if (found) {
      listContainer = found;
      console.debug(`リストコンテナ発見: ${selector}`);
      break;
    }
  }
  
  // 見つからない場合は作成
  if (!listContainer) {
    console.warn('リストコンテナが見つからないため、作成します');
    listContainer = document.createElement('div');
    listContainer.id = 'app';
    listContainer.className = 'sortable-list';
    listContainer.setAttribute('data-role', 'sortable-container');
    
    // 適切な親要素を探す
    const parent = document.querySelector('.list-container, [data-role="trip-day-list"], #tm-list-container');
    if (parent) {
      parent.appendChild(listContainer);
    } else {
      // 最悪の場合はbodyに追加
      document.body.appendChild(listContainer);
    }
  }
  
  // コンテナをクリア
  listContainer.innerHTML = '';
  
  // データがない場合は案内を表示
  if (!window.state.placeData || window.state.placeData.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-list">
        <div class="empty-icon"><i class="fas fa-map-marked-alt"></i></div>
        <div class="empty-text">地点が登録されていません</div>
        <div class="empty-subtext">右上の「+」ボタンから地点を追加してください</div>
      </div>
    `;
    return;
  }
  
  // 日付でグループ化
  const groupedData = groupPlacesByDate(window.state.placeData);
  
  // 並び替え用のIDリスト
  let allItemIds = [];
  
  // 各日付グループごとに描画
  Object.keys(groupedData).forEach((dateStr, dateIndex) => {
    const places = groupedData[dateStr];
    
    // 日付ヘッダーのフォーマット
    const formattedHeader = formatDayHeader(dateStr, dateIndex);
    
    // グループコンテナ作成
    const groupContainer = document.createElement('div');
    groupContainer.className = 'date-group';
    groupContainer.dataset.date = dateStr;
    
    // ヘッダー作成
    const header = document.createElement('div');
    header.className = 'date-group-header';
    header.innerHTML = `
      <div class="day-top-row">
        <div class="day-title-container">
          <div class="day-title">${formattedHeader}</div>
          <div class="day-count">${places.length}件</div>
        </div>
        <button class="show-day-route-btn" data-date="${dateStr}">
          <i class="fas fa-route"></i> ルート表示
        </button>
        <div class="day-toggle">
          <i class="fas fa-chevron-down"></i>
        </div>
      </div>
    `;
    
    // 日付グループの内容コンテナ
    const contentContainer = document.createElement('div');
    contentContainer.className = 'collapsible-content';
    contentContainer.id = `date-group-content-${dateStr.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    // 場所リストアイテム
    const sortableList = document.createElement('div');
    sortableList.className = 'sortable-group';
    sortableList.dataset.date = dateStr;
    
    // グローバルインデックスの計算
    let globalStartIndex = 0;
    Object.keys(groupedData).forEach(d => {
      if (d === dateStr) return;
      if (Object.keys(groupedData).indexOf(d) < Object.keys(groupedData).indexOf(dateStr)) {
        globalStartIndex += groupedData[d].length;
      }
    });
    
    // 各場所アイテムを作成
    places.forEach((place, index) => {
      const globalIndex = globalStartIndex + index;
      const listItem = createPlaceListItem(place, globalIndex);
      sortableList.appendChild(listItem);
      
      // IDをリストに追加（並び替え用）
      allItemIds.push(place.id);
    });
    
    // コンテンツをコンテナに追加
    contentContainer.appendChild(sortableList);
    
    // グループに追加
    groupContainer.appendChild(header);
    groupContainer.appendChild(contentContainer);
    
    // リストに追加
    listContainer.appendChild(groupContainer);
  });
  
  // 折りたたみイベント設定
  initToggleEvents();
  
  // 並び替え機能の初期化
  initSortableGroups();
}

// 日付でデータをグループ化
function groupPlacesByDate(places) {
  const groups = {};
  
  // 日付なしのグループを作成
  groups['日付なし'] = [];
  
  places.forEach(place => {
    // 日付の正規化
    const dateStr = normalizeDate(place.date);
    
    // グループに追加
    if (dateStr) {
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(place);
    } else {
      groups['日付なし'].push(place);
    }
  });
  
  // 日付なしグループが空なら削除
  if (groups['日付なし'].length === 0) {
    delete groups['日付なし'];
  }
  
  // 日付順にソート
  const sortedGroups = {};
  Object.keys(groups)
    .sort((a, b) => {
      if (a === '日付なし') return 1;
      if (b === '日付なし') return -1;
      return new Date(a) - new Date(b);
    })
    .forEach(key => {
      sortedGroups[key] = groups[key];
    });
  
  return sortedGroups;
}

// 日付の正規化
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  
  // 既にYYYY-MM-DD形式ならそのまま返す
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // スラッシュ区切りの日付を処理
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // 年が2桁の場合
      if (parts[0].length === 2) {
        parts[0] = '20' + parts[0];
      }
      
      // MM/DD/YYYYの場合
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[0]}-${parts[1]}`;
      }
      
      // YYYY/MM/DDの場合
      if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        return `${parts[0]}-${month}-${day}`;
      }
    }
  }
  
  // その他の形式はDateオブジェクトに変換
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (e) {
    return null;
  }
}

// 日付ヘッダーフォーマット
function formatDayHeader(dateStr, index) {
  if (dateStr === '日付なし') {
    return '<i class="fas fa-calendar-times"></i> 日付なし';
  }
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    
    const formattedDate = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    }).format(date);
    
    const dayCount = index + 1;
    
    // 曜日のクラスを取得
    const colorClass = getColorClassFromDate(dateStr);
    
    return `<span class="day-number">${dayCount}日目</span> <span class="day-date ${colorClass}">${formattedDate}</span>`;
  } catch (e) {
    return dateStr;
  }
}

// 日付から曜日の色クラスを取得
function getColorClassFromDate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const dayOfWeek = date.getDay();
    switch (dayOfWeek) {
      case 0: return 'sunday';    // 日曜日
      case 6: return 'saturday';  // 土曜日
      default: return 'weekday';  // 平日
    }
  } catch (e) {
    return '';
  }
}

// 地点リストアイテムを作成
function createPlaceListItem(place, globalIndex) {
  // コンテナ作成
  const listItem = document.createElement('div');
  listItem.className = 'place-item';
  listItem.id = `place-${place.id}`;
  listItem.dataset.placeId = place.id;
  
  // カテゴリアイコン取得
  const categoryIcon = getCategoryIcon(place.category);
  const categoryClass = getCategoryClass(place.category);
  
  // 順番（1から始まる）
  const displayIndex = globalIndex + 1;
  
  // 時間表示
  const timeDisplay = createTimeDisplay(place);
  
  // 交通手段表示
  const transportDisplay = createTransportDisplay(place);
  
  // ルート情報表示
  const routeInfoDisplay = createRouteInfoDisplay(place);
  
  // タグ表示
  let tagsDisplay = '';
  if (place.tags && place.tags.length > 0) {
    tagsDisplay = `<div class="place-tags">${place.tags.map(tag => 
      `<span class="place-tag">${tag}</span>`).join('')}</div>`;
  }
  
  // 日付表示（オプション）
  let dateDisplay = '';
  if (place.date) {
    const date = new Date(place.date);
    const formattedDate = new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short'
    }).format(date);
    
    const colorClass = getColorClassFromDate(place.date);
    dateDisplay = `<span class="list-item-date ${colorClass}">${formattedDate}</span>`;
  }
  
  // チェックボックス対応
  const checkbox = `<input type="checkbox" class="place-checkbox" data-place-id="${place.id}">`;
  
  // HTML構造
  listItem.innerHTML = `
    <div class="place-header">
      <div class="place-title">
        ${checkbox}
        <span class="place-number">${displayIndex}.</span>
        <span class="category-icon ${categoryClass}">${categoryIcon}</span>
        <span class="place-name">${place.name}</span>
        ${dateDisplay}
      </div>
      <div class="place-actions">
        <button class="place-edit-btn" data-place-id="${place.id}"><i class="fas fa-pen"></i></button>
        <button class="place-delete-btn" data-place-id="${place.id}"><i class="fas fa-trash"></i></button>
      </div>
    </div>
    ${timeDisplay}
    ${tagsDisplay}
    ${transportDisplay}
    ${routeInfoDisplay}
    <div class="place-address">${place.address || ''}</div>
    ${place.memo ? `<div class="place-memo">${place.memo}</div>` : ''}
  `;
  
  // イベントリスナー設定
  listItem.querySelector('.place-edit-btn').addEventListener('click', () => {
    editPlace(place.id);
  });
  
  listItem.querySelector('.place-delete-btn').addEventListener('click', () => {
    if (confirm(`「${place.name}」を削除しますか？`)) {
      deletePlace(place.id);
      renderUI(true);
    }
  });
  
  // リストアイテムクリックでマーカーにフォーカス
  listItem.addEventListener('click', (e) => {
    // ボタンクリックは除外
    if (e.target.closest('.place-edit-btn') || e.target.closest('.place-delete-btn') || e.target.closest('.place-checkbox')) {
      return;
    }
    
    const marker = window.state.markers[globalIndex];
    if (marker) {
      // 地図が表示されていない場合は地図タブに切り替え
      if (window.innerWidth <= 768 && !document.getElementById('map-tab').classList.contains('active')) {
        document.getElementById('map-tab').click();
      }
      
      // 地図の中央をマーカーに移動
      window.state.map.panTo(marker.getPosition());
      window.state.map.setZoom(15);
      
      // マーカークリックイベントを発火
      window.dispatchEvent(new CustomEvent('marker_click', {
        detail: { placeId: place.id }
      }));
    }
  });
  
  return listItem;
}

// カテゴリアイコン取得
function getCategoryIcon(category) {
  const icons = {
    '観光': '📸',
    '食事': '🍔',
    'ホテル': '🏨',
    '移動': '✈️',
    '買い物': '🛍️',
    'イベント': '🎉',
    '休憩': '☕',
    'その他': '📌'
  };
  
  return icons[category] || '📍';
}

// カテゴリクラス名取得
function getCategoryClass(category) {
  if (!category) return 'category-other';
  
  return 'category-' + category.toLowerCase()
    .replace(/[^\w\s]/g, '')  // 特殊文字を削除
    .replace(/\s+/g, '-');    // スペースをハイフンに変換
}

// 時間表示を作成
function createTimeDisplay(place) {
  if (!place.time) return '';
  
  return `<div class="place-time"><i class="far fa-clock"></i> ${place.time}</div>`;
}

// 交通手段表示を作成
function createTransportDisplay(place) {
  if (!place.transport) return '';
  
  const transportIcons = {
    '徒歩': '<i class="fas fa-walking"></i>',
    '自転車': '<i class="fas fa-bicycle"></i>',
    '車': '<i class="fas fa-car"></i>',
    'バス': '<i class="fas fa-bus"></i>',
    '電車': '<i class="fas fa-train"></i>',
    '地下鉄': '<i class="fas fa-subway"></i>',
    '新幹線': '<i class="fas fa-train"></i>',
    'タクシー': '<i class="fas fa-taxi"></i>',
    '飛行機': '<i class="fas fa-plane"></i>',
    'フェリー': '<i class="fas fa-ship"></i>',
    'その他': '<i class="fas fa-arrows-alt-h"></i>'
  };
  
  const icon = transportIcons[place.transport] || '<i class="fas fa-arrows-alt-h"></i>';
  
  return `<div class="place-transport">${icon} ${place.transport}</div>`;
}

// ルート情報表示を作成
function createRouteInfoDisplay(place) {
  if (!place.routeInfo) return '';
  
  const { distance, duration } = place.routeInfo;
  
  let displayText = '';
  if (distance) {
    displayText += `${distance} `;
  }
  if (duration) {
    displayText += `${duration}`;
  }
  
  if (displayText) {
    return `<div class="route-info"><i class="fas fa-info-circle"></i> ${displayText}</div>`;
  }
  
  return '';
}

// 地点編集
function editPlace(placeId) {
  const place = window.state.placeData.find(p => p.id === placeId);
  if (!place) return;
  
  // モーダルを開く
  openModal('edit', {
    place: place,
    onSave: function(updatedPlace) {
      // 既存のデータを更新
      const index = window.state.placeData.findIndex(p => p.id === updatedPlace.id);
      if (index !== -1) {
        window.state.placeData[index] = updatedPlace;
        window.state.isDirty = true;
        
        // データ保存
        savePlaceData();
        
        // UI更新
        renderUI(true);
      }
    }
  });
}

// 折りたたみ機能の初期化
export function initToggleEvents() {
  // 日付グループのトグルイベント
  const toggles = document.querySelectorAll('.date-group-header .day-toggle');
  toggles.forEach(toggle => {
    // 既存イベントを削除
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);
    
    // 新しいイベントを設定
    newToggle.addEventListener('click', handleToggleClick);
  });
  
  // ルート表示ボタンのイベント
  const routeButtons = document.querySelectorAll('.show-day-route-btn');
  routeButtons.forEach(button => {
    // 既存イベントを削除
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // 新しいイベントを設定
    newButton.addEventListener('click', function(event) {
      event.stopPropagation();
      const date = this.dataset.date;
      displayRoutesForDate(date);
    });
  });
}

// 折りたたみトグルクリック処理
function handleToggleClick(event) {
  // 親要素（ヘッダー）を取得
  const header = event.currentTarget.closest('.date-group-header');
  if (!header) return;
  
  // グループコンテナを取得
  const group = header.closest('.date-group');
  if (!group) return;
  
  // コンテンツコンテナを取得
  const content = group.querySelector('.collapsible-content');
  if (!content) return;
  
  // トグルアイコンを取得
  const toggleIcon = event.currentTarget.querySelector('i');
  
  // 現在の状態を確認
  const isCollapsed = content.classList.contains('collapsed');
  
  // 状態を切り替え
  if (isCollapsed) {
    // 展開
    content.classList.remove('collapsed');
    content.style.maxHeight = content.scrollHeight + 'px';
    if (toggleIcon) {
      toggleIcon.className = 'fas fa-chevron-down';
    }
  } else {
    // 折りたたみ
    content.classList.add('collapsed');
    content.style.maxHeight = '0';
    if (toggleIcon) {
      toggleIcon.className = 'fas fa-chevron-right';
    }
  }
}

// 並び替え機能初期化
function initSortableGroups() {
  const sortableGroups = document.querySelectorAll('.sortable-group');
  
  if (!sortableGroups.length) return;
  
  if (typeof Sortable === 'undefined') {
    console.error('Sortable.jsがロードされていません');
    return;
  }
  
  // 既存のSortableインスタンスを破棄
  sortableGroups.forEach(group => {
    const sortableInstance = Sortable.get(group);
    if (sortableInstance) {
      sortableInstance.destroy();
    }
  });
  
  // 新しいSortableインスタンスを作成
  sortableGroups.forEach(group => {
    new Sortable(group, {
      handle: '.place-header',
      animation: 150,
      ghostClass: 'dragging',
      onEnd: function(evt) {
        // ドラッグ完了後にデータの順序を更新
        updatePlaceDataOrder();
        
        // ルートの再計算が必要
        window.state.isRoutesDirty = true;
      }
    });
  });
}

// DOM順序に基づきplaceDataを更新
function updatePlaceDataOrder() {
  // 現在のDOM順序を取得
  const itemElements = document.querySelectorAll('.place-item');
  const orderedIds = Array.from(itemElements).map(item => item.dataset.placeId);
  
  // 新しい順序でデータを並び替え
  const newOrder = [];
  orderedIds.forEach(id => {
    const place = window.state.placeData.find(p => p.id === id);
    if (place) {
      newOrder.push(place);
    }
  });
  
  // データ更新
  if (newOrder.length === window.state.placeData.length) {
    window.state.placeData = newOrder;
    window.state.isDirty = true;
    
    // データ保存
    savePlaceData();
  } else {
    console.error('並び替え後のアイテム数が一致しません');
  }
}

// イベントリスナー設定
export function setupEventListeners() {
  // 追加ボタン
  const addButton = document.getElementById('add-place-btn');
  if (addButton) {
    addButton.addEventListener('click', () => {
      // 新規追加モーダル表示
      openModal('add', {
        onSave: function(newPlace) {
          // 新しい場所を追加
          window.state.placeData.push(newPlace);
          window.state.isDirty = true;
          
          // データ保存
          savePlaceData();
          
          // UI更新
          renderUI(true);
        }
      });
    });
  }
  
  // トリップ設定ボタン
  const settingsButton = document.getElementById('trip-settings-btn');
  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      // 設定モーダル表示
      openModal('settings', {
        metadata: window.state.metadata,
        onSave: function(updatedMetadata) {
          // メタデータ更新
          window.state.metadata = {
            ...window.state.metadata,
            ...updatedMetadata
          };
          
          // UI更新
          updateHeaderTripName();
          
          // データ保存
          localStorage.setItem('tripmaker_metadata', JSON.stringify(window.state.metadata));
        }
      });
    });
  }
  
  // ダークモードボタン
  const darkModeButton = document.getElementById('dark-mode-btn');
  if (darkModeButton) {
    darkModeButton.addEventListener('click', () => {
      const isDarkMode = document.body.classList.toggle('night-mode');
      
      // 設定を保存
      localStorage.setItem('tripmaker_dark_mode', isDarkMode);
      
      // アイコン更新
      const icon = darkModeButton.querySelector('i');
      if (icon) {
        icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
      }
    });
    
    // 初期状態設定
    const isDarkMode = localStorage.getItem('tripmaker_dark_mode') === 'true';
    if (isDarkMode) {
      document.body.classList.add('night-mode');
      const icon = darkModeButton.querySelector('i');
      if (icon) {
        icon.className = 'fas fa-sun';
      }
    }
  }
  
  // 保存ボタン
  const saveButton = document.getElementById('save-data-btn');
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      savePlaceData();
      alert('データを保存しました');
    });
  }
  
  // エクスポートボタン
  const exportButton = document.getElementById('export-btn');
  if (exportButton) {
    exportButton.addEventListener('click', () => {
      const format = prompt('エクスポート形式を選択してください: json, csv', 'json');
      if (format === 'json') {
        exportDataToJson();
      } else if (format === 'csv') {
        exportDataToCsv();
      } else if (format) {
        alert('無効な形式です。json または csv を選択してください。');
      }
    });
  }
  
  // インポートボタン
  const importButton = document.getElementById('import-btn');
  if (importButton) {
    importButton.addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json,.csv';
      
      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          
          // ファイル形式に応じた処理
          if (file.name.endsWith('.json')) {
            importDataFromJson(content);
          } else if (file.name.endsWith('.csv')) {
            importDataFromCsv(content);
          } else {
            alert('サポートされていないファイル形式です。');
          }
        };
        
        reader.readAsText(file);
      });
      
      fileInput.click();
    });
  }
}

// ヘッダーの旅行名を更新
export function updateHeaderTripName() {
  const tripNameElement = document.getElementById('trip-name');
  if (tripNameElement && window.state.metadata && window.state.metadata.tripName) {
    tripNameElement.textContent = window.state.metadata.tripName;
  }
}

// モバイル表示の設定
export function setupMobileView() {
  // 画面サイズに応じた表示切替
  const resizeHandler = () => {
    const isMobile = window.innerWidth <= 768;
    const desktopContainer = document.getElementById('desktop-container');
    const mobileContent = document.getElementById('mobile-content');
    const tabs = document.getElementById('main-tabs');
    
    if (isMobile) {
      if (desktopContainer) desktopContainer.style.display = 'none';
      if (mobileContent) mobileContent.style.display = 'block';
      if (tabs) tabs.style.display = 'flex';
    } else {
      if (desktopContainer) desktopContainer.style.display = 'flex';
      if (mobileContent) mobileContent.style.display = 'none';
      if (tabs) tabs.style.display = 'none';
    }
  };
  
  // 初期表示設定
  resizeHandler();
  
  // リサイズイベント
  window.addEventListener('resize', resizeHandler);
  
  // モバイル機能設定
  setupMobileFeatures();
}

// 公開API
export {
  renderListGroupedByDate,
  normalizeDate,
  formatDayHeader,
  getColorClassFromDate,
  createPlaceListItem,
  getCategoryIcon,
  getCategoryClass,
  createTimeDisplay,
  createTransportDisplay,
  createRouteInfoDisplay,
  editPlace,
  handleToggleClick,
  updatePlaceDataOrder,
};
