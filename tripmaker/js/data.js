// tripmaker/js/data.js
import * as state from './state.js';
import { renderUI } from './ui.js';
import { geocodeAndRefreshAfterCsvImport, clearMapData } from './map.js';
import { setRouteDirty, clearRoutes } from './route.js';
import { showCopyFeedback, showError, downloadFile, generateTimestamp, normalizeDate, parseCSVLine, isValidCoordinate } from './utils.js';
import { STORAGE_KEY_PLACES, STORAGE_KEY_METADATA, STORAGE_KEY_MARKER_MODE, DEFAULT_CATEGORY, DEFAULT_TRANSPORT, MAX_SHARE_URL_LENGTH } from '../config.js';

// --- Data Loading ---

export function loadAndInitializeData() {
    loadMetadata();
    loadPlaceData();
    // Load other settings like marker display mode, show time preference
    const savedMarkerMode = localStorage.getItem(STORAGE_KEY_MARKER_MODE) || 'numbered';
    state.setMarkerDisplayMode(savedMarkerMode);

    // Initial UI render needs to happen after data is loaded
    // renderUI() will be called by init.js after map is potentially ready.
}

// --- データの読み込み ---
// --- データの読み込み・保存（state依存バージョンのみ） ---
export function loadPlaceData() {
    const savedData = localStorage.getItem(STORAGE_KEY_PLACES);
    let loadedPlaces = [];
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (Array.isArray(parsedData)) {
                loadedPlaces = parsedData;
                console.log(`Loaded ${loadedPlaces.length} places from localStorage.`);
            } else {
                console.warn("Invalid place data format in localStorage. Using empty data.");
            }
        } catch (error) {
            showError(`保存された地点データの読み込みに失敗: ${error.message}`);
            console.error("Failed to parse place data from localStorage:", error);
        }
    } else {
        console.log('No place data found in localStorage.');
    }
    state.setPlaceData(loadedPlaces);
}

export function loadMetadata() {
    const savedMeta = localStorage.getItem(STORAGE_KEY_METADATA);
    let loadedMeta = {};
    if (savedMeta) {
        try {
            const parsedMeta = JSON.parse(savedMeta);
            loadedMeta = parsedMeta;
            console.log('Metadata loaded:', loadedMeta);
        } catch (error) {
            showError(`保存された旅行設定の読み込みに失敗: ${error.message}`);
            console.error("Failed to parse metadata from localStorage:", error);
        }
    } else {
        console.log('No metadata found in localStorage, using defaults.');
    }
    state.setTravelMetadata(loadedMeta);
}

export function savePlaceData() {
    localStorage.setItem(STORAGE_KEY_PLACES, JSON.stringify(state.placeData));
}

export function saveMetadata() {
    localStorage.setItem(STORAGE_KEY_METADATA, JSON.stringify(state.travelMetadata));
}

// --- モーダルの操作 ---
export function closeEditModal() {
  const modal = document.getElementById('editModal');
  if (modal) modal.classList.add('hidden');
}

export function closeTripSettingsModal() {
  const modal = document.getElementById('tripSettingsModal');
  if (modal) modal.classList.add('hidden');
}

// --- 地点の削除 ---

// --- 旅行全体の削除 ---
export function clearTripData() {
  localStorage.removeItem('placeData');
  localStorage.removeItem('metadata');
}

// --- 既存のstate依存の関数群はそのまま残す（必要に応じて） ---
// --- Data Loading ---

// ↓ ここから既存のロジック（state依存版）
    const savedData = localStorage.getItem(STORAGE_KEY_PLACES);
    let loadedPlaces = [];
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (Array.isArray(parsedData)) {
                 // Basic validation/migration could happen here
                 loadedPlaces = parsedData;
                console.log(`Loaded ${loadedPlaces.length} places from localStorage.`);
            } else {
                console.warn("Invalid place data format in localStorage. Using empty data.");
            }
        } catch (error) {
            showError(`保存された地点データの読み込みに失敗: ${error.message}`);
            console.error("Failed to parse place data from localStorage:", error);
        }
    } else {
        console.log('No place data found in localStorage.');
    }
    state.setPlaceData(loadedPlaces); // Update state


    const savedMeta = localStorage.getItem(STORAGE_KEY_METADATA);
    let loadedMeta = {};
    if (savedMeta) {
        try {
            const parsedMeta = JSON.parse(savedMeta);
            // Combine loaded data with defaults to ensure all keys exist
            loadedMeta = parsedMeta;
            console.log('Metadata loaded:', loadedMeta);
        } catch (error) {
            showError(`保存された旅行設定の読み込みに失敗: ${error.message}`);
            console.error("Failed to parse metadata from localStorage:", error);
        }
    } else {
        console.log('No metadata found in localStorage, using defaults.');
    }
    state.setTravelMetadata(loadedMeta); // Update state, merging with defaults

// --- Data Saving ---


    try {
        localStorage.setItem(STORAGE_KEY_PLACES, JSON.stringify(state.placeData));
        // console.log(`${state.placeData.length} place data items saved.`);
    } catch (error) {
        showError('地点データの保存に失敗。容量超過の可能性があります。');
        console.error('Failed to save place data to localStorage:', error);
    }





// --- Data Deletion ---

export function deletePlace(placeId) {
    const place = state.placeData.find(p => p.id === placeId);
    if (!place) return false;

    if (confirm(`地点「${place.name}」を削除してもよろしいですか？`)) {
        state.deletePlaceData(placeId); // Update state array
        savePlaceData(); // Persist changes
        setRouteDirty(true); // Mark routes as needing recalculation
        renderUI(false); // Re-render UI without immediate route recalc
        console.log(`Place "${place.name}" deleted. Routes marked as dirty.`);
        showCopyFeedback(`地点「${place.name}」を削除しました。`);
        return true;
    }
    return false;
}

export function handleDeleteTrip() {
    if (confirm("本当にこの旅程の全データ（地点、ルート、設定）を削除しますか？\nこの操作は元に戻せません。")) {
        console.log("Deleting all trip data...");

        // Clear state
        state.setPlaceData([]);
        state.resetTravelMetadata();
        state.clearPolylinesFromState();
        state.clearRouteCache();
        state.clearSelectedPlaceIds();
        state.setCurrentlyDisplayedDate('all');
        state.setRouteDirty(false);
        state.setLastUsedDate('');
        state.setHeaderSelectedPlace(null);

        // Clear storage
        localStorage.removeItem(STORAGE_KEY_PLACES);
        localStorage.removeItem(STORAGE_KEY_METADATA);
        localStorage.removeItem(STORAGE_KEY_MARKER_MODE);
        localStorage.removeItem(STORAGE_KEY_SHOW_TIME);

        // Clear map visually
        clearMapData(); // Clears markers and resets map view in map.js

        // Reset UI elements handled by renderUI
        renderUI(false); // Re-render empty state
        closeTripSettingsModal(); // Ensure modal is closed
        showCopyFeedback("旅程データをすべて削除しました。");
    }
}


// --- Import/Export ---

// JSON Export
export function exportDataToJson() {
    if (state.placeData.length === 0) {
        showError('エクスポートするデータがありません。', true);
        return;
    }
    try {
        const dataToExport = {
            version: "1.0",
            metadata: state.travelMetadata,
            places: state.placeData
        };
        const jsonData = JSON.stringify(dataToExport, null, 2); // Pretty print
        downloadFile(jsonData, `tripmaker-data-${generateTimestamp()}.json`, 'application/json');
        console.log('Data exported to JSON.');
        showCopyFeedback("JSONデータをエクスポートしました。");
    } catch (error) {
        showError('JSONエクスポートに失敗しました。', true);
        console.error('JSON export failed:', error);
    }
}

// JSON Import
export function importDataFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Handle GeoJSON via specific function
    if (file.name.toLowerCase().endsWith('.geojson')) {
        importDataFromGeoJson(file);
        event.target.value = ''; // Reset file input
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsedData = JSON.parse(e.target.result);
            let importedContainer;

            // Handle old array-only format
            if (Array.isArray(parsedData)) {
                console.log('Legacy JSON array format detected. Converting...');
                importedContainer = {
                    version: "0.5", // Indicate legacy import
                    metadata: { tripName: `インポート (${file.name})` }, // Basic metadata
                    places: parsedData
                };
            } else {
                importedContainer = parsedData;
            }

            // Validate structure
            if (typeof importedContainer !== 'object' || !importedContainer.places || !importedContainer.version) {
                throw new Error('JSONファイルの基本構造が不正です (version, placesが必須)。metadataは推奨。');
            }
            if (!Array.isArray(importedContainer.places)) {
                throw new Error('JSONデータ内の "places" が配列形式ではありません。');
            }

            // Basic validation of place items (id and name minimum)
            const isValid = importedContainer.places.every(item =>
                item && typeof item.id === 'string' && typeof item.name === 'string'
            );
            if (!isValid) {
                throw new Error('地点データに必要な項目 (id, name) が不足しています。');
            }

            // --- Import Data ---
            state.setPlaceData(importedContainer.places); // Updates state with validation/defaults
            state.setTravelMetadata(importedContainer.metadata || { tripName: `インポート (${file.name})` }); // Update metadata

            console.log(`Imported ${state.placeData.length} places and metadata from JSON (v${importedContainer.version}).`);

            savePlaceData();
            saveMetadata();
            clearRoutes(); // Clear existing routes before rendering/recalculating
            setRouteDirty(true); // Mark as dirty to trigger recalc
            renderUI(true, true); // Re-render, schedule route recalc, fit map
            showCopyFeedback(`${state.placeData.length}件のデータをインポートしました。`);

        } catch (parseError) {
            showError(`JSONファイルの読み込みに失敗: ${parseError.message}`, true);
            console.error('JSON import failed:', parseError);
        } finally {
            event.target.value = ''; // Reset file input
        }
    };
    reader.onerror = () => {
        showError('JSONファイルの読み込みに失敗しました。', true);
        console.error('File read error (JSON)');
        event.target.value = '';
    };
    reader.readAsText(file);
}

// GeoJSON Export
export function exportDataToGeoJson() {
    if (state.placeData.length === 0) {
        showError('エクスポートするデータがありません。', true);
        return;
    }
    try {
        const features = [];

        // Add Point features for places
        state.placeData.forEach(place => {
            if (isValidCoordinate(place.lat) && isValidCoordinate(place.lng)) {
                const properties = { ...place }; // Copy all properties
                delete properties.lat; // Geometry holds coordinates
                delete properties.lng;
                // Optionally remove routeInfo from point properties if desired
                // delete properties.routeInfo;
                features.push({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [place.lng, place.lat] // GeoJSON is [lon, lat]
                    },
                    properties: properties
                });
            } else {
                 console.warn(`Skipping GeoJSON export for place with invalid coords: ${place.name}`);
            }
        });

         // Add LineString features for routes (using stored geometry)
         state.placeData.forEach((place, index) => {
             const nextPlace = state.placeData[index + 1];
             if (nextPlace && place.routeInfo?.geometry && place.routeInfo.geometry.length > 0) {
                 features.push({
                     type: "Feature",
                     geometry: {
                         type: "LineString",
                         coordinates: place.routeInfo.geometry // Assumes [[lng, lat], ...]
                     },
                     properties: {
                          origin_id: place.id,
                          origin_name: place.name,
                          destination_id: nextPlace.id,
                          destination_name: nextPlace.name,
                          transport: place.transport,
                          distance: place.routeInfo.distance, // Store text representation
                          duration: place.routeInfo.duration, // Store text representation
                          // Add any other relevant route segment properties
                      }
                 });
             }
         });

        const geoJsonData = {
            type: "FeatureCollection",
            metadata: { // Add metadata block
                 name: "Tripmaker Lab Export",
                 version: "1.1", // Indicate GeoJSON export includes routes
                 timestamp: new Date().toISOString(),
                 tripInfo: state.travelMetadata // Include trip metadata
            },
            features: features
        };

        const geoJsonString = JSON.stringify(geoJsonData, null, 2);
        downloadFile(geoJsonString, `tripmaker-export-${generateTimestamp()}.geojson`, 'application/geo+json');
        console.log('Data exported to GeoJSON.');
        showCopyFeedback("GeoJSONデータをエクスポートしました。");

    } catch (error) {
        showError('GeoJSONエクスポートに失敗しました。', true);
        console.error('GeoJSON export failed:', error);
    }
}

// GeoJSON Import
function importDataFromGeoJson(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const geojson = JSON.parse(e.target.result);

            if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
                throw new Error("GeoJSONの構造が正しくありません (FeatureCollectionが必要です)");
            }

            // Extract trip metadata if present
            let importedMetadata = { tripName: `GeoJSONインポート (${file.name})` }; // Default name
            if (geojson.metadata?.tripInfo && typeof geojson.metadata.tripInfo === 'object') {
                 importedMetadata = geojson.metadata.tripInfo;
            }

            // Process Point features into placeData
            const pointFeatures = geojson.features.filter(f => f.geometry?.type === "Point");
            const importedPlaces = pointFeatures.map((f, i) => {
                 if (!f.properties || !f.properties.name || !f.geometry?.coordinates || f.geometry.coordinates.length < 2) {
                      console.warn(`Skipping invalid GeoJSON Point feature at index ${i}`);
                      return null; // Skip invalid features
                 }
                 const [lng, lat] = f.geometry.coordinates;
                 if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
                     console.warn(`Skipping GeoJSON Point feature with invalid coordinates: ${f.properties.name}`);
                     return null;
                 }
                 return {
                     // Merge properties, ensuring required fields exist
                     id: f.properties.id || `place-${Date.now()}-${i}`,
                     name: f.properties.name,
                     address: f.properties.address || `(${lat.toFixed(4)}, ${lng.toFixed(4)})`, // Provide fallback address
                     lat: lat,
                     lng: lng,
                     date: normalizeDate(f.properties.date) || '', // Normalize date
                     category: typeof f.properties.category === "string" ? f.properties.category : DEFAULT_CATEGORY,
                     tags: Array.isArray(f.properties.tags) ? f.properties.tags : [],
                     arrivalTime: f.properties.arrivalTime || '',
                     departureTime: f.properties.departureTime || '',
                     transport: f.properties.transport || DEFAULT_TRANSPORT,
                     memo: f.properties.memo || '',
                     // RouteInfo might be in properties, but we'll recalculate anyway
                     routeInfo: undefined
                 };
            }).filter(Boolean); // Remove null entries from skipped features

            if (importedPlaces.length === 0) {
                throw new Error("GeoJSONファイルに有効なPoint地点データが見つかりませんでした。");
            }

            console.log(`Imported ${importedPlaces.length} places from GeoJSON.`);

            // --- Update State and UI ---
            state.setPlaceData(importedPlaces);
            state.setTravelMetadata(importedMetadata);
            savePlaceData();
            saveMetadata();
            clearRoutes(); // Clear existing routes
            setRouteDirty(true); // Mark for recalculation
            renderUI(true, true); // Re-render, schedule route recalc, fit map
            showCopyFeedback(`${importedPlaces.length}件のGeoJSONデータをインポートしました。`);

        } catch (error) {
            showError(`GeoJSON読み込みに失敗: ${error.message}`, true);
            console.error("GeoJSON import failed:", error);
        }
        // Resetting file input happens in the caller (importDataFromJson)
    };
    reader.onerror = () => {
        showError('GeoJSONファイルの読み込みに失敗しました。', true);
        console.error('File read error (GeoJSON)');
        // Resetting file input happens in the caller (importDataFromJson)
    };
    reader.readAsText(file);
}


// CSV Import
export function importDataFromCsv(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const csvContent = e.target.result;
            const importedData = parseCSV(csvContent); // Use updated parseCSV

            if (!Array.isArray(importedData) || importedData.length === 0) {
                throw new Error('CSVデータが空か、形式が不正です。');
            }

            // --- Update State ---
            state.setPlaceData(importedData);
            state.resetTravelMetadata(); // Clear existing metadata for CSV import
            state.setTravelMetadata({ tripName: `CSVインポート (${file.name})` }); // Set basic name

            console.log(`CSVから${state.placeData.length}件のデータをインポートしました`);

            savePlaceData();
            saveMetadata();
            clearRoutes(); // Clear old routes

            // Geocode addresses lacking coordinates, then refresh UI
            geocodeAndRefreshAfterCsvImport()
                .then(() => {
                    // Geocoding might take time, routes still need calculation
                    setRouteDirty(true);
                    renderUI(true, true); // Render potentially geocoded data, calc routes, fit map
                })
                .catch(err => {
                    console.error("Error during post-CSV geocoding:", err);
                    // Even if geocoding fails, render the imported data
                    setRouteDirty(true);
                    renderUI(true, true);
                });

        } catch (parseError) {
            showError(`CSVファイルの読み込みに失敗: ${parseError.message}`, true);
            console.error('CSV import failed:', parseError);
        } finally {
            event.target.value = ''; // Reset file input
        }
    };
    reader.onerror = () => {
        showError('CSVファイルの読み込みに失敗しました。', true);
        console.error('CSV file read error');
        event.target.value = '';
    };
    reader.readAsText(file);
}

/**
 * Parses CSV text content into an array of place data objects.
 * Uses flexible header mapping.
 * @param {string} csvText - The raw CSV content.
 * @returns {Array<object>} Array of place objects.
 */
function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error('CSVにはヘッダー行と最低1つのデータ行が必要です。');

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

    // --- Flexible Column Mapping ---
    const findHeaderIndex = (possibleNames) => {
        for (const name of possibleNames) {
             const index = headers.indexOf(name.toLowerCase());
             if (index !== -1) return index;
         }
         return -1;
    };

    const columnMap = {
        id: findHeaderIndex(['id']),
        name: findHeaderIndex(['name', '場所', '地点名', '名称']),
        address: findHeaderIndex(['address', '住所']),
        lat: findHeaderIndex(['lat', 'latitude', '緯度']),
        lng: findHeaderIndex(['lng', 'lon', 'longitude', '経度']),
        date: findHeaderIndex(['date', '日付']),
        category: findHeaderIndex(['category', 'カテゴリ']),
        tags: findHeaderIndex(['tags', 'tag', 'タグ']), // Expect comma-separated
        arrivalTime: findHeaderIndex(['arrivaltime', 'arrival', '到着時刻', '到着']),
        departureTime: findHeaderIndex(['departuretime', 'departure', '出発時刻', '出発']),
        transport: findHeaderIndex(['transport', '移動手段', '交通手段']),
        memo: findHeaderIndex(['memo', 'メモ', '備考'])
    };
    // --- End Column Mapping ---

    // Basic validation: Name and Address are essential
    if (columnMap.name === -1) {
        throw new Error('CSVに必須の列が見つかりません: name (場所, 地点名, 名称)');
    }
     if (columnMap.address === -1 && (columnMap.lat === -1 || columnMap.lng === -1)) {
         throw new Error('CSVに必須の列が見つかりません: address (住所) または lat/lng (緯度/経度) の両方が必要です。');
     }


    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0 || (values.length === 1 && values[0] === '')) continue; // Skip empty lines

        // Helper to safely get value based on mapped index
        const getColumnValue = (key) => {
            const index = columnMap[key];
            return (index !== -1 && index < values.length) ? (values[index] || '').trim() : '';
        };

        const placeName = getColumnValue('name');
        let placeAddress = getColumnValue('address');
        let latVal = getColumnValue('lat');
        let lngVal = getColumnValue('lng');
        let lat = parseFloat(latVal) || null;
        let lng = parseFloat(lngVal) || null;

        // Skip row if no name
        if (!placeName) {
            console.warn(`CSV 行 ${i + 1}: name が空のためスキップします。`);
            continue;
        }
        // Skip if no address AND no valid coords
        if (!placeAddress && (!isValidCoordinate(lat) || !isValidCoordinate(lng))) {
             console.warn(`CSV 行 ${i + 1} (${placeName}): address も有効な lat/lng もないためスキップします。`);
             continue;
        }

        // Attempt to use coords as fallback address if address is missing
        if (!placeAddress && isValidCoordinate(lat) && isValidCoordinate(lng)) {
            placeAddress = `(${lat.toFixed(5)}, ${lng.toFixed(5)})`; // Create fallback address
        }

        // Re-validate coordinates after potential parsing
         if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
             if (latVal || lngVal) { // Only warn if there was input
                 console.warn(`CSV 行 ${i+1} (${placeName}): 無効な座標です。座標はクリアされます。 Lat: ${latVal}, Lng: ${lngVal}`);
             }
            lat = null;
            lng = null;
        }

        // Parse tags (comma-separated)
        const tagsString = getColumnValue('tags');
        const tagsArray = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : [];

        const placeObj = {
            id: getColumnValue('id') || `place-${Date.now()}-${i}`,
            name: placeName,
            address: placeAddress,
            lat: lat,
            lng: lng,
            date: normalizeDate(getColumnValue('date')) || '', // Normalize date format
            category: getColumnValue('category') || DEFAULT_CATEGORY,
            tags: tagsArray,
            arrivalTime: getColumnValue('arrivalTime'),
            departureTime: getColumnValue('departureTime'),
            transport: getColumnValue('transport') || DEFAULT_TRANSPORT,
            memo: getColumnValue('memo'),
            routeInfo: undefined // Ensure routeInfo is cleared on import
        };

        result.push(placeObj);
    }

    if (result.length === 0) {
        throw new Error('CSVファイルから有効なデータを読み込めませんでした。必須列（nameとaddress、またはnameとlat/lng）を確認してください。');
    }
    return result;
}

// --- URL Import/Export (using LZ-String) ---

export function generateShareUrl() {
    if (state.placeData.length === 0) {
        showError("共有するデータがありません。", true);
        return;
    }
    // Only share place data, not metadata for simplicity/privacy/length
    const dataToShare = { version: "1.0", places: state.placeData };

    try {
        // Ensure LZString is loaded (might need dynamic import or ensure it's global)
        if (typeof LZString === 'undefined') {
            showError("共有機能に必要なライブラリ(LZString)が読み込まれていません。", true);
            return;
        }

        const dataString = JSON.stringify(dataToShare);
        const compressed = LZString.compressToEncodedURIComponent(dataString);
        const baseUrl = window.location.href.split('?')[0].split('#')[0];
        const shareUrl = `${baseUrl}?data=${compressed}`;

        if (shareUrl.length > MAX_SHARE_URL_LENGTH) {
             console.warn("Generated Share URL is very long:", shareUrl.length, "chars");
             showError("生成されたURLが長すぎるため共有できない可能性があります。地点数を減らすか、JSONエクスポート機能を利用してください。", true);
             // Offer manual copy for very long URLs
             prompt("URLが長すぎるため、手動でコピーしてください:", shareUrl);
             return;
         }

        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                showCopyFeedback("共有URLをクリップボードにコピーしました！");
            })
            .catch(err => {
                console.error('Clipboard copy failed:', err);
                showError('URLのコピーに失敗しました。', true);
                prompt("以下のURLを手動でコピーしてください:", shareUrl); // Fallback prompt
            });

    } catch (error) {
        showError(`共有URLの生成に失敗: ${error.message}`, true);
        console.error("URL sharing error:", error);
    }
}

export function importFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const compressedData = urlParams.get('data');

    if (compressedData) {
        console.log("Importing data from URL parameter...");
        try {
            // Ensure LZString is loaded
            if (typeof LZString === 'undefined') {
                throw new Error("データ解凍に必要なライブラリ(LZString)が読み込まれていません。");
            }
            const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
            if (!decompressed) throw new Error("データの解凍に失敗しました。URLが破損している可能性があります。");

            const importedContainer = JSON.parse(decompressed);

            // Validate structure { version: "...", places: [...] }
            if (typeof importedContainer !== 'object' || !importedContainer.places || !importedContainer.version) {
                 throw new Error("URLデータの基本構造が不正です (version, placesが必須)");
            }
            if (!Array.isArray(importedContainer.places)) {
                throw new Error("URLデータ内の 'places' が配列形式ではありません");
            }
            // Basic validation of place items
            const isValid = importedContainer.places.every(item => item && typeof item.id === 'string' && typeof item.name === 'string');
            if (!isValid) throw new Error('URLデータの形式が不正（id/name不足）');

            // --- Import Data ---
            state.setPlaceData(importedContainer.places);
            state.resetTravelMetadata(); // Clear existing metadata
            state.setTravelMetadata({ tripName: `URLからのインポート` }); // Set basic name

            console.log(`Imported ${state.placeData.length} places from URL (v${importedContainer.version})`);

            savePlaceData(); // Save the imported data
            saveMetadata();

            // Remove the 'data' param from URL without reload
            window.history.replaceState({}, document.title, window.location.pathname);

            // Update UI (map needs to be ready)
            // renderUI will be called after map init checks complete.
            // Mark routes as dirty for recalc.
            clearRoutes();
            setRouteDirty(true);

            showCopyFeedback(`URLから${state.placeData.length}件のデータをインポートしました。`);
            return true; // Indicate successful import

        } catch (error) {
            showError(`URLからのデータ読み込み失敗: ${error.message}`, true);
            console.error("URL import failed:", error);
            window.history.replaceState({}, document.title, window.location.pathname); // Clear param on error too
            return false; // Indicate failed import
        }
    }
    return false; // No data in URL
}

// --- Modal Close Functions (Used by Settings Save/Delete) ---
// These are here because they trigger data saves/resets
