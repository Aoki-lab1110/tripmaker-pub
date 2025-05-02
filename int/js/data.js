// data.js - データ管理モジュール

// localStorage からデータを読み込み
export function loadPlaceData() {
  try {
    const data = localStorage.getItem('tripmaker_places');
    if (data) {
      window.state.placeData = JSON.parse(data);
      console.log(`${window.state.placeData.length}件の場所データを読み込みました`);
    } else {
      console.log('保存された場所データはありません。新しいトリップを開始します。');
      window.state.placeData = [];
    }
    
    // データの整合性チェック
    window.state.placeData = window.state.placeData.filter(place => {
      return place && place.id && place.name;
    });
    
    // ルート計算状態の更新
    if (window.state.metadata) {
      window.state.isRoutesDirty = !window.state.metadata.routesCalculated;
    }
    
    return window.state.placeData;
  } catch (error) {
    console.error('データ読み込みエラー:', error);
    window.state.placeData = [];
    return [];
  }
}

// データを localStorage に保存
export function savePlaceData() {
  try {
    localStorage.setItem('tripmaker_places', JSON.stringify(window.state.placeData));
    console.log(`${window.state.placeData.length}件の場所データを保存しました`);
    saveMetadata();
    window.state.isDirty = false;
    return true;
  } catch (error) {
    console.error('データ保存エラー:', error);
    return false;
  }
}

// メタデータを localStorage から読み込み
export function loadMetadata() {
  try {
    const data = localStorage.getItem('tripmaker_metadata');
    if (data) {
      window.state.metadata = JSON.parse(data);
      console.log('メタデータを読み込みました:', window.state.metadata);
      return true;
    }
    return false;
  } catch (error) {
    console.error('メタデータ読み込みエラー:', error);
    return false;
  }
}

// メタデータを localStorage に保存
export function saveMetadata() {
  try {
    localStorage.setItem('tripmaker_metadata', JSON.stringify(window.state.metadata));
    console.log('メタデータを保存しました');
    return true;
  } catch (error) {
    console.error('メタデータ保存エラー:', error);
    return false;
  }
}

// ヘッダーの旅行名を更新
export function updateHeaderTripName() {
  const tripNameElement = document.getElementById('trip-name');
  if (tripNameElement && window.state.metadata && window.state.metadata.tripName) {
    tripNameElement.textContent = window.state.metadata.tripName;
  }
}

// 新しい場所データを追加
function addPlace(placeData) {
  // IDがない場合は生成
  if (!placeData.id) {
    placeData.id = generateId();
  }
  
  // 既存のデータを更新または新規追加
  const existingIndex = window.state.placeData.findIndex(place => place.id === placeData.id);
  
  if (existingIndex !== -1) {
    // 既存データを更新
    window.state.placeData[existingIndex] = {
      ...window.state.placeData[existingIndex],
      ...placeData
    };
  } else {
    // 新規追加
    window.state.placeData.push(placeData);
  }
  
  // 変更フラグを設定
  window.state.isDirty = true;
  window.state.isRoutesDirty = true;
  
  // データ保存
  savePlaceData();
  
  return placeData;
}

// 場所データを削除
export function deletePlace(placeId) {
  const initialLength = window.state.placeData.length;
  window.state.placeData = window.state.placeData.filter(place => place.id !== placeId);
  
  if (initialLength !== window.state.placeData.length) {
    window.state.isDirty = true;
    savePlaceData();
    return true;
  }
  return false;
}

// 場所データの順序を更新
export function updatePlaceOrder(orderedIds) {
  // IDの順序に基づいて配列を並べ替え
  const newOrder = [];
  
  orderedIds.forEach(id => {
    const place = window.state.placeData.find(p => p.id === id);
    if (place) {
      newOrder.push(place);
    }
  });
  
  // 見つからなかった項目を末尾に追加（念のため）
  window.state.placeData.forEach(place => {
    if (!orderedIds.includes(place.id)) {
      newOrder.push(place);
    }
  });
  
  window.state.placeData = newOrder;
  window.state.isDirty = true;
  window.state.isRoutesDirty = true;
  
  savePlaceData();
  return newOrder;
}

// ランダムなIDを生成
export function generateId() {
  return 'place_' + Math.random().toString(36).substr(2, 9);
}

// JSONデータをエクスポート
export function exportDataToJson() {
  try {
    const exportData = {
      metadata: window.state.metadata,
      placeData: window.state.placeData
    };
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('JSONエクスポートエラー:', error);
    return null;
  }
}

// JSONデータをインポート
export function importDataFromJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    // バリデーション
    if (!data.metadata || !data.placeData) {
      throw new Error('無効なデータ形式です');
    }
    
    // 状態を更新
    window.state.metadata = data.metadata;
    window.state.placeData = data.placeData;
    window.state.isDirty = true;
    
    return true;
  } catch (error) {
    console.error('JSONインポートエラー:', error);
    return false;
  }
}

// CSVファイルへエクスポート
function exportDataToCsv() {
  try {
    // ヘッダー行
    const headers = [
      'name', 'category', 'date', 'time', 
      'address', 'lat', 'lng', 'memo', 'tags'
    ];
    
    // ヘッダー行
    let csvContent = headers.join(',') + '\n';
    
    // データ行
    window.state.placeData.forEach(place => {
      const row = [
        csvEscape(place.name || ''),
        csvEscape(place.category || ''),
        csvEscape(place.date || ''),
        csvEscape(place.time || ''),
        csvEscape(place.address || ''),
        place.lat || '',
        place.lng || '',
        csvEscape(place.memo || ''),
        place.tags ? csvEscape(place.tags.join(';')) : ''
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    // ファイル名の作成
    const fileName = `tripmaker_${window.state.metadata.tripName || 'export'}_${generateTimestamp()}.csv`;
    
    // ダウンロード
    downloadFile(csvContent, fileName, 'text/csv');
    
    return true;
  } catch (error) {
    console.error('CSVエクスポートエラー:', error);
    alert('CSVエクスポート中にエラーが発生しました。');
    return false;
  }
}

// CSVインポート
function importDataFromCsv(csvContent) {
  try {
    // CSVパース
    const lines = csvContent.split('\n');
    if (lines.length < 2) {
      throw new Error('有効なCSVデータがありません');
    }
    
    // ヘッダー行
    const headers = parseCSVLine(lines[0]);
    
    // 必須フィールドの確認
    if (!headers.includes('name')) {
      throw new Error('必須フィールド "name" がCSVに見つかりません');
    }
    
    // データ行のパース
    const importedPlaces = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length < headers.length) continue;
      
      const place = {};
      
      // 各フィールドを処理
      headers.forEach((header, index) => {
        if (header === 'tags' && values[index]) {
          place[header] = values[index].split(';').map(tag => tag.trim());
        } else {
          place[header] = values[index];
        }
      });
      
      // IDの追加
      place.id = place.id || generateId();
      
      // 有効な場所データのみ追加
      if (place.name) {
        importedPlaces.push(place);
      }
    }
    
    if (importedPlaces.length === 0) {
      throw new Error('インポート可能なデータがありません');
    }
    
    // 既存データの確認
    if (window.state.placeData && window.state.placeData.length > 0) {
      const confirmed = confirm(`既存の${window.state.placeData.length}件のデータを上書きして、${importedPlaces.length}件の新しいデータをインポートしますか？`);
      if (!confirmed) {
        return false;
      }
    }
    
    // データの更新
    window.state.placeData = importedPlaces;
    window.state.isDirty = true;
    window.state.isRoutesDirty = true;
    
    // 保存
    savePlaceData();
    
    return {
      success: true,
      count: importedPlaces.length,
      message: `${importedPlaces.length}件のデータをCSVからインポートしました`
    };
  } catch (error) {
    console.error('CSVインポートエラー:', error);
    return {
      success: false,
      message: `CSVインポートに失敗しました: ${error.message}`
    };
  }
}

// CSV行解析（引用符対応）
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // 引用符内の引用符のエスケープ処理
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 区切り文字（引用符の外側）
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // 最後のフィールドを追加
  result.push(current);
  
  return result;
}

// CSV用エスケープ
function csvEscape(value) {
  if (!value) return '';
  
  // 文字列に変換
  value = String(value);
  
  // 引用符、カンマ、改行があれば引用符で囲む
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    // 内部の引用符をエスケープ
    value = value.replace(/"/g, '""');
    // 引用符で囲む
    return `"${value}"`;
  }
  
  return value;
}

// タイムスタンプ生成
function generateTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}_${hour}${minute}`;
}

// ファイルダウンロード
function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

// すべての関数は直接エクスポートされているため、エクスポートブロックは不要
