// tripmaker/js/events.js
import * as state from './state.js';
import * as ui from './ui.js';
import * as data from './data.js';
import * as map from './map.js';
import { showCopyFeedback } from './utils.js';
import * as route from './route.js';
import { debounce, showError, isValidCoordinate } from './utils.js';
import { MAX_GOOGLE_MAPS_TRANSFER_PLACES, SEARCH_DEBOUNCE_DELAY } from '../config.js'; // パス修正: 1つ上のディレクトリからconfig.jsをインポート


// --- Setup Main Event Listeners ---
export function setupEventListeners() {
    console.log('Setting up event listeners...');

    // --- Header Actions ---
    document.getElementById('headerAddPlaceBtn')?.addEventListener('click', handleHeaderAddPlace);
    document.getElementById('addPlaceBtn')?.addEventListener('click', () => ui.openEditModal(null)); // Open modal for new place
    document.getElementById('generateShareUrl')?.addEventListener('click', data.generateShareUrl);
    document.getElementById('recalcRouteBtn')?.addEventListener('click', handleRecalcRoute);
    document.getElementById('tripSettingsBtn')?.addEventListener('click', ui.openTripSettingsModal);
    document.getElementById('fitAllRoutesBtn')?.addEventListener('click', map.fitMapToAllRoutes);
    document.getElementById('googleMapTransferBtn')?.addEventListener('click', handleGoogleMapTransfer);

    // --- Header Search Input (Simple handler, actual logic in map.js autocomplete) ---
    const headerSearchInput = document.getElementById('headerSearchInput');
    if(headerSearchInput){
        headerSearchInput.addEventListener('input', () => {
            // Disable add button if input is cleared manually
            if (!headerSearchInput.value.trim()) {
                 document.getElementById('headerAddPlaceBtn').disabled = true;
                 state.setHeaderSelectedPlace(null);
            }
        });
         headerSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                 handleHeaderAddPlace(); // Try to add on Enter if a place is selected
             }
         });
    }


    // --- List Interactions (Event Delegation on List Container) ---
    const listContainer = document.getElementById('sortable-list');
    if (listContainer) {
        listContainer.addEventListener('click', handleListClick);
         listContainer.addEventListener('keydown', handleListKeydown); // For accessibility on list items
    }

    // --- Filtering ---
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('input', debounce(ui.applyCurrentFilters, SEARCH_DEBOUNCE_DELAY));
    }
    document.getElementById('categoryFilterSelect')?.addEventListener('change', handleCategoryFilterChange);

    // --- Map Controls ---
    document.getElementById('mapTypeSelector')?.addEventListener('change', handleMapTypeChange);
    document.getElementById('pinDisplaySelector')?.addEventListener('change', handlePinDisplayChange);

    // --- Data Management ---
    setupDataManagementListeners();

    // --- Modals ---
    setupEditModalListeners();
    setupTripSettingsModalListeners();
    setupNewModalEventListeners();

    // --- モバイル用フッタータブ切り替え ---
    const mapTab = document.getElementById('map-tab');
    const listTab = document.getElementById('list-tab');
    const mapView = document.getElementById('map-view');
    const listView = document.getElementById('list-view');
    if (mapTab && listTab) {
        mapTab.addEventListener('click', () => {
            ui.switchToMobileMapView();
        });
        listTab.addEventListener('click', () => {
            ui.switchToMobileListView();
        });
    }

    console.log('Event listeners set up.');
}

// --- Event Handlers ---

// Header "Add" button
function handleHeaderAddPlace() {
    if (state.headerSelectedPlace) {
        ui.openEditModal(null, state.headerSelectedPlace); // Open modal with prefill data
        // Clear selection state after opening modal
        document.getElementById('headerSearchInput').value = '';
        document.getElementById('headerAddPlaceBtn').disabled = true;
        state.setHeaderSelectedPlace(null);
    } else {
        showError("追加する場所が選択されていません。検索して候補を選んでください。");
    }
}

// Recalculate Route button
function handleRecalcRoute() {
    if (state.isRouteDirty) {
        console.log("Recalculating routes via button click...");
        route.recalculateRoutes(false); // false = not initial load
    } else {
        console.log("Routes are already up-to-date.");
        showCopyFeedback("ルートは最新です。"); // Give feedback
    }
}

// Google Map Transfer button
function handleGoogleMapTransfer() {
    const selectedIds = state.selectedPlaceIdsForMap;
    if (selectedIds.size === 0 || selectedIds.size > MAX_GOOGLE_MAPS_TRANSFER_PLACES) {
        showError(`Google Mapで開くには、1件以上${MAX_GOOGLE_MAPS_TRANSFER_PLACES}件以下の地点を選択してください。`, true);
        return;
    }

    // Get selected places *in the current list order* to respect user arrangement
    const orderedSelectedPlaces = [];
    document.querySelectorAll('#sortable-list .place-item:not(.hidden)').forEach(item => {
        const id = item.getAttribute('data-id');
        if (selectedIds.has(id)) {
            const place = state.placeData.find(p => p.id === id);
            // Final coordinate check before generating URL
            if (place && isValidCoordinate(place.lat) && isValidCoordinate(place.lng)) {
                orderedSelectedPlaces.push(place);
            } else {
                 showError(`選択された地点「${place?.name || id}」の座標が無効なため、転送できません。`, true);
                 orderedSelectedPlaces.length = 0; // Invalidate transfer
                 return; // Exit forEach early
            }
        }
    });

     // Check if the number of found valid places matches the selection count
     if (orderedSelectedPlaces.length !== selectedIds.size || orderedSelectedPlaces.length === 0) {
          showError("選択された有効な地点が見つかりませんでした。フィルターを確認してください。", true);
         ui.updateGoogleMapTransferButtonState(); // Refresh button state might be needed
         return;
     }

    // --- Generate Google Maps URL ---
    let googleMapsUrl = '';
    const firstPlace = orderedSelectedPlaces[0];
    const lastPlace = orderedSelectedPlaces[orderedSelectedPlaces.length - 1];

    if (orderedSelectedPlaces.length === 1) {
        // Single place: Use search query with lat/lng for precision
        // Encoding name/address can be complex, lat/lng is more robust
        googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(firstPlace.lat + ',' + firstPlace.lng)}`;
        // Alternative: query by name/address (less precise if coords exist)
        // googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(firstPlace.name + ', ' + firstPlace.address)}`;
    } else {
        // Multiple places (2-5): Use Directions API URL format
        const origin = `${firstPlace.lat},${firstPlace.lng}`;
        const destination = `${lastPlace.lat},${lastPlace.lng}`;
        // Waypoints are intermediate points
        const waypoints = orderedSelectedPlaces
            .slice(1, -1) // Exclude first and last
            .map(p => `${p.lat},${p.lng}`)
            .join('|'); // Pipe separated

        // Determine travel mode based on the *first* selected place's transport setting
        const travelMode = route.getTravelModeForGoogleMaps(firstPlace.transport); // Use helper

        googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
        if (waypoints) {
            googleMapsUrl += `&waypoints=${encodeURIComponent(waypoints)}`;
        }
        if (travelMode) {
            googleMapsUrl += `&travelmode=${travelMode}`;
        }
    }

    console.log("Opening Google Maps URL:", googleMapsUrl);
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer'); // Security best practice
}

// --- List Event Delegation Handler ---
function handleListClick(event) {
    const target = event.target;
    const actionElement = target.closest('[data-action]'); // Find nearest element with data-action

    if (!actionElement) {
        // If click is not on an action element, check if it's on the list item itself (for zooming)
        const listItem = target.closest('.place-item');
        if (listItem && !target.closest('button, input[type="checkbox"]')) {
            const placeId = listItem.getAttribute('data-id');
            if (placeId) map.zoomToPlace(placeId);
        }
        return;
    }

    const action = actionElement.dataset.action;
    const placeId = actionElement.dataset.id; // Used by edit/delete
    const dateKey = actionElement.dataset.date; // Used by show-day-route/toggle-collapse

    switch (action) {
        case 'edit-place':
            if (placeId) ui.openEditModal(placeId);
            break;
        case 'delete-place':
            if (placeId) data.deletePlace(placeId); // deletePlace handles confirmation
            break;
        case 'toggle-gmap-selection':
             // This specific handler might be better attached directly in createPlaceListItem
             // due to needing the checkbox's checked state *after* the click.
             // Or handle it here:
             if (target.tagName === 'INPUT' && target.type === 'checkbox') {
                handlePlaceCheckboxChange(target);
             }
            break;
        case 'show-day-route':
            if (dateKey) map.displayRoutesForDate(dateKey, true); // true = allow toggle
            break;
        case 'toggle-collapse':
            // Find the parent header element to pass to the toggle function
            const header = actionElement.closest('.date-group-header');
             if (header) ui.toggleDateGroupCollapse(header);
            break;
         case 'remove-tag': // Handle tag removal click from within the list handler (for edit modal)
             const tagToRemove = actionElement.dataset.tag;
             if (tagToRemove) {
                 state.removeCurrentTag(tagToRemove);
                 ui.renderTagsUI(); // Update modal UI
                 ui.updateHiddenTagsInput(); // Update hidden input
             }
             break;
        // Add other actions as needed
    }
}

// Accessibility handler for list items (Enter/Space)
function handleListKeydown(event) {
     const listItem = event.target.closest('.place-item');
     if (!listItem) return;

     // Handle Enter or Space on the list item itself (not buttons inside)
     if ((event.key === 'Enter' || event.key === ' ') && event.target === listItem) {
         event.preventDefault(); // Prevent spacebar scroll
         const placeId = listItem.getAttribute('data-id');
         if (placeId) map.zoomToPlace(placeId);
     }
     // Future: Could handle arrow keys for navigation within/between groups if needed.
 }

// List Checkbox Change Handler (specific for Google Map transfer)
function handlePlaceCheckboxChange(checkbox) {
    const placeId = checkbox.dataset.id;
    if (!placeId) return;

    if (checkbox.checked) {
        if (state.selectedPlaceIdsForMap.size >= MAX_GOOGLE_MAPS_TRANSFER_PLACES) {
            checkbox.checked = false; // Prevent checking more
            showError(`Google Mapで開けるのは最大${MAX_GOOGLE_MAPS_TRANSFER_PLACES}件までです。`, true);
        } else {
             state.addSelectedPlaceId(placeId);
        }
    } else {
         state.removeSelectedPlaceId(placeId);
    }
    ui.updateGoogleMapTransferButtonState(); // Update button enabled state/text
}


// --- Filter Handlers ---
function handleCategoryFilterChange(event) {
    state.setCurrentCategoryFilter(event.target.value);
    ui.applyCurrentFilters(); // Apply filters immediately
}

// --- Map Control Handlers ---
function handleMapTypeChange(event) {
    map.setMapType(event.target.value);
}

function handlePinDisplayChange(event) {
    const mode = event.target.value;
    if (mode) { // Ignore the placeholder/disabled option
        map.updatePinDisplayMode(mode);
    }
}

// --- Data Management Listeners (新UI: data-manage-btn対応) ---
function setupDataManagementListeners() {
    // 旧UIのセレクターではなく、ボタン＋メニューで実装
    const btn = document.getElementById('data-manage-btn');
    if (!btn) return;
    // ファイルインプット（CSV/JSON）を必要に応じて生成
    let csvFileInput = document.getElementById('csvFileInput');
    let jsonFileInput = document.getElementById('jsonFileInput');
    if (!csvFileInput) {
        csvFileInput = document.createElement('input');
        csvFileInput.type = 'file';
        csvFileInput.id = 'csvFileInput';
        csvFileInput.accept = '.csv';
        csvFileInput.style.display = 'none';
        document.body.appendChild(csvFileInput);
        csvFileInput.addEventListener('change', data.importDataFromCsv);
    }
    if (!jsonFileInput) {
        jsonFileInput = document.createElement('input');
        jsonFileInput.type = 'file';
        jsonFileInput.id = 'jsonFileInput';
        jsonFileInput.accept = '.json,.geojson';
        jsonFileInput.style.display = 'none';
        document.body.appendChild(jsonFileInput);
        jsonFileInput.addEventListener('change', data.importDataFromJson);
    }
    // シンプルなメニュー（window.confirm/alert/カスタムUIでもOK）
    // 旧UIスタイルで素直にイベントリスナーを登録
    // カスタムUIでメニュー表示
    btn.addEventListener('click', function() {
        if (btn.disabled) return;
        import('./data_manage_menu.js').then(mod => {
            mod.showDataManageMenu(action => {
                switch (action) {
                    case 'import-json':
                        jsonFileInput.click();
                        break;
                    case 'import-csv':
                        csvFileInput.click();
                        break;
                    case 'export-json':
                        data.exportDataToJson();
                        break;
                    case 'export-geojson':
                        data.exportDataToGeoJson();
                        break;
                    default:
                        // キャンセルや何もしない
                        break;
                }
            }, btn);
        });
    });
}

// --- Edit Modal Listeners ---
function setupEditModalListeners() {
    const modal = document.getElementById('editModal');
    const form = document.getElementById('editForm');
    const tagsInput = document.getElementById('placeTagsInput');
    const tagContainer = document.getElementById('tagContainer'); // Container for pills + input

    form?.addEventListener('submit', handleSaveEdit);
    document.getElementById('cancelEdit')?.addEventListener('click', data.closeEditModal);

    // Event delegation for removing tags within the container
     tagContainer?.addEventListener('click', (e) => {
         const removeButton = e.target.closest('[data-action="remove-tag"]');
         if (removeButton) {
             const tagToRemove = removeButton.dataset.tag;
             if (tagToRemove) {
                 state.removeCurrentTag(tagToRemove);
                 ui.renderTagsUI(); // Update modal UI
                 ui.updateHiddenTagsInput(); // Update hidden input
             }
         } else if (e.target === tagContainer) {
              // Focus input if clicking empty space in container
              tagsInput?.focus();
          }
     });

    // Handle typing in tags input (comma, Enter, Backspace)
    tagsInput?.addEventListener('keydown', (e) => {
        if (e.key === ',' || e.key === 'Enter') {
             e.preventDefault(); // Prevent comma/enter in input itself
             const newTag = tagsInput.value.trim();
             if (newTag) {
                 state.addCurrentTag(newTag);
                 ui.renderTagsUI();
                 ui.updateHiddenTagsInput();
                 tagsInput.value = ''; // Clear input
             }
        } else if (e.key === 'Backspace' && tagsInput.value === '' && state.currentTags.length > 0) {
            // Remove last tag on backspace if input is empty
            const lastTag = state.currentTags[state.currentTags.length - 1];
            state.removeCurrentTag(lastTag);
            ui.renderTagsUI();
            ui.updateHiddenTagsInput();
        }
    });

    // Add tag if input loses focus and has content
     tagsInput?.addEventListener('blur', () => {
         const newTag = tagsInput.value.trim();
         if (newTag) {
             state.addCurrentTag(newTag);
             ui.renderTagsUI();
             ui.updateHiddenTagsInput();
             tagsInput.value = '';
         }
     });
}

// Handle saving from the Edit Modal
function handleSaveEdit(event) {
    event.preventDefault(); // Prevent default form submission

    // --- Get values from form ---
    const placeId = document.getElementById('editPlaceId').value; // Empty if new
    const name = document.getElementById('placeName').value.trim();
    const address = document.getElementById('placeAddress').value.trim();
    const latStr = document.getElementById('editPlaceLat').value;
    const lngStr = document.getElementById('editPlaceLng').value;
    const date = document.getElementById('placeDate').value; // Already YYYY-MM-DD
    const arrivalTime = document.getElementById('placeArrivalTime').value;
    const departureTime = document.getElementById('placeDepartureTime').value;
    const transport = document.getElementById('placeTransport').value;
    const memo = document.getElementById('placeMemo').value.trim();
    const category = document.getElementById('placeCategory').value;
    // Tags are already managed in state.currentTags via input handlers
    const tags = [...state.currentTags]; // Get a copy from state

    // --- Validation ---
    if (!name || !address || !category) {
        showError('場所の名前、住所、カテゴリは必須です。', true); return;
    }
    let lat = parseFloat(latStr);
    let lng = parseFloat(lngStr);
    if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
        showError('座標が無効です。住所検索で候補を選択するか、有効な数値を入力してください。', true); return;
    }

    // --- Prepare data object ---
    const placeDataObj = {
        name, address, lat, lng, date, category, tags,
        arrivalTime, departureTime, transport, memo,
        // Keep routeInfo undefined here; recalc will handle it
    };

    let isNew = false;
    if (placeId) {
        // --- Edit Existing Place ---
        state.updateSinglePlaceData(placeId, placeDataObj);
        console.log(`Place updated: ${name} (ID: ${placeId})`);
    } else {
        // --- Add New Place ---
        isNew = true;
        placeDataObj.id = `place-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        state.addPlaceData(placeDataObj); // Add to state array
        console.log(`Place added: ${name} (ID: ${placeDataObj.id})`);
    }

    state.setLastUsedDate(date || state.lastUsedDate); // Update last used date
    data.savePlaceData(); // Save the updated data array
    route.setRouteDirty(true); // Mark routes as needing recalculation
    data.closeEditModal(); // Close the modal
    ui.renderUI(false); // Re-render list/markers, don't recalc routes yet

    // Optional: Pan/Zoom map to the newly added/edited place
    if (isNew) {
        map.zoomToPlace(placeDataObj.id); // Zoom to the newly added place
    } else {
        map.zoomToPlace(placeId); // Zoom to the edited place
    }
    showCopyFeedback(isNew ? "地点を追加しました。" : "地点情報を更新しました。");
}


// --- Trip Settings Modal Listeners ---
function setupTripSettingsModalListeners() {
    const form = document.getElementById('tripSettingsForm');
    form?.addEventListener('submit', ui.saveTripSettings); // saveTripSettings handles persistence
    document.getElementById('cancelTripSettings')?.addEventListener('click', data.closeTripSettingsModal);
    document.getElementById('deleteTripBtn')?.addEventListener('click', data.handleDeleteTrip); // handleDeleteTrip handles confirmation and deletion

    // Update time visibility preview immediately on toggle change
    document.getElementById('toggleTimeDisplay')?.addEventListener('change', (e) => {
        ui.updateTimeVisibility(); // Update list items based on checkbox state
    });
}

// --- 新規モーダル用イベントリスナー ---
export function setupNewModalEventListeners() {
    // ここに新規モーダルのイベントリスナーを今後追加
}

// --- Make functions needed by inline HTML onclick accessible ---
// Assign necessary handlers to window scope for InfoWindow buttons
export function exposeGlobalFunctions() {
    window.tripmaker_openEditModal = ui.openEditModal;
    // Wrap deletePlace in a function that calls the data module version
    window.tripmaker_deletePlaceWrapper = (id) => {
         data.deletePlace(id); // data.deletePlace includes confirmation
     };
}