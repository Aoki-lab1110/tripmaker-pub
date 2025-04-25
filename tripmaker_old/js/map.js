// tripmaker/js/map.js
import * as state from './state.js';
import { renderUI, openEditModal, updateMarkerModeButtonStyles, updateDayRouteButtonHighlights } from './ui.js';
import { deletePlace } from './data.js'; // Import deletePlace for InfoWindow button
import { setRouteDirty, getRouteColorByTransport } from './route.js';
import { isValidCoordinate, showError, showCopyFeedback, hashCode, getCategoryIcon, normalizeDate } from './utils.js'; // getCategoryIcon, normalizeDate を追加
import { GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, GEOCODING_DELAY, GEOCODING_MAX_RETRIES, PREDEFINED_CATEGORIES, DEFAULT_CATEGORY, DEFAULT_TRANSPORT, STORAGE_KEY_MARKER_MODE } from '../config.js'; // STORAGE_KEY_MARKER_MODE を追加

let mapInitialized = false;
let autocompleteInstance = null; // For modal
let headerAutocompleteInstance = null; // For header


// --- Initialization ---

/**
 * Loads the Google Maps API script dynamically.
 * Resolves when the API is loaded and map initialization can proceed.
 * Rejects if the API key is missing or loading fails.
 */
function loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
        if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "YOUR_API_KEY_HERE") {
            const errorMsg = "Google Maps API Keyが見つかりません。config.jsを確認してください。";
            showError(errorMsg, true); // Use alert for this critical error
            console.error(errorMsg);
            return reject(new Error(errorMsg));
        }

        if (window.google && window.google.maps) {
            console.log("Google Maps API already loaded.");
            return resolve();
        }

        // Define the callback function globally
        window.googleMapsApiLoaded = () => {
            console.log("Google Maps API loaded successfully via callback.");
            delete window.googleMapsApiLoaded; // Clean up global scope
            resolve();
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=googleMapsApiLoaded&libraries=places,marker,routes,geometry&v=weekly`;
        script.async = true;
        script.defer = true;
        script.onerror = (e) => {
            const errorMsg = "Google Maps APIの読み込みに失敗しました。ネットワーク接続またはAPIキーを確認してください。";
            showError(errorMsg, true);
            console.error("Google Maps API script loading failed:", e);
            delete window.googleMapsApiLoaded;
            reject(new Error(errorMsg));
        };
        document.head.appendChild(script);
    });
}

/**
 * Initializes the Google Map, services, and autocompletes.
 * This function should be called AFTER the Google Maps API is loaded.
 * Returns true if initialization was successful, false otherwise.
 */
export async function initializeMap() {
    if (mapInitialized) {
        console.log("Map already initialized.");
        return true;
    }

    try {
        await loadGoogleMapsAPI(); // Ensure API is loaded

        console.log('Initializing map components...');
        const mapOptions = {
            zoom: DEFAULT_MAP_ZOOM,
            center: DEFAULT_MAP_CENTER,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false, // Using custom control
            fullscreenControl: true,
            streetViewControl: false,
            scaleControl: true,
        };
        const mapInstance = new google.maps.Map(document.getElementById('map'), mapOptions);
        state.setMap(mapInstance); // Store map instance in state

        state.setDirectionsService(new google.maps.DirectionsService());
        state.setGeocoder(new google.maps.Geocoder());
        state.setInfoWindow(new google.maps.InfoWindow({ pixelOffset: new google.maps.Size(0, -10) }));

        initAutocompletes();
        setupMapEventListeners();

        mapInitialized = true;
        console.log('Map initialization complete.');
        return true;

    } catch (error) {
        console.error('Map initialization failed:', error);
        // Error is shown by loadGoogleMapsAPI if it fails there
        if (!window.google || !window.google.maps) {
             showError('マップの初期化に失敗しました。Google Maps APIが読み込めませんでした。', true);
        } else {
            showError(`マップの初期化に失敗: ${error.message || '不明なエラー'}`, true);
        }
        // Disable map-dependent UI elements if init fails?
        document.getElementById('map-container')?.classList.add('hidden');
        document.getElementById('list-container')?.classList.remove('md:w-1/3');
        document.getElementById('list-container')?.classList.add('w-full');
        return false;
    }
}

// --- Map Event Listeners ---
function setupMapEventListeners() {
    if (!state.map) return;
    // Update marker labels on zoom change (if needed, handled by refreshMarkers now)
    // state.map.addListener('zoom_changed', throttle(updateMarkerLabels, 200));

    // Potentially other listeners like 'click' to close infowindow, etc.
    state.map.addListener('click', () => {
        state.infoWindow?.close();
    });
}

// --- Autocomplete ---
function initAutocompletes() {
    if (!google.maps.places) {
        console.error("Google Places library not loaded. Autocomplete unavailable.");
        return;
    }
    try {
        // Header Search Autocomplete
        const headerSearchInput = document.getElementById('headerSearchInput');
        if (headerSearchInput) {
            headerAutocompleteInstance = new google.maps.places.Autocomplete(headerSearchInput, {
                fields: ['geometry', 'name', 'formatted_address', 'place_id', 'types'] // Request 'types'
            });
            headerAutocompleteInstance.addListener('place_changed', handleHeaderPlaceChange);
        }

        // Modal Address Autocomplete
        const placeAddressInput = document.getElementById('placeAddress');
        if (placeAddressInput) {
            autocompleteInstance = new google.maps.places.Autocomplete(placeAddressInput, {
                fields: ['geometry', 'name', 'formatted_address', 'place_id', 'types'] // Request 'types'
            });
            autocompleteInstance.addListener('place_changed', handleModalPlaceChange);
        }
         console.log("Autocompletes initialized.");
    } catch (error) {
        console.error("Error initializing autocompletes:", error);
        showError("場所検索機能の初期化に失敗しました。");
    }
}

function handleHeaderPlaceChange() {
    const place = headerAutocompleteInstance.getPlace();
    const addBtn = document.getElementById('headerAddPlaceBtn');

    if (place.geometry?.location) {
        state.setHeaderSelectedPlace({
            name: place.name,
            address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            place_id: place.place_id,
            // Attempt to guess category from place types
            category: guessCategoryFromPlaceTypes(place.types)
        });
        if(addBtn) addBtn.disabled = false;
    } else {
        console.warn('Header search: Place geometry not found.');
        state.setHeaderSelectedPlace(null);
        if(addBtn) addBtn.disabled = true;
    }
}

function handleModalPlaceChange() {
    const place = autocompleteInstance.getPlace();
    if (place.geometry?.location) {
        document.getElementById('editPlaceLat').value = place.geometry.location.lat();
        document.getElementById('editPlaceLng').value = place.geometry.location.lng();

        const placeNameInput = document.getElementById('placeName');
        // Only prefill name if it's empty
        if (placeNameInput && !placeNameInput.value.trim()) {
            placeNameInput.value = place.name || '';
        }
        // Always update address field with the selected formatted address
        const placeAddressInput = document.getElementById('placeAddress');
         if (placeAddressInput && place.formatted_address) {
             placeAddressInput.value = place.formatted_address;
         }

        // Attempt to guess category if not already set by user
        const categorySelect = document.getElementById('placeCategory');
        if (categorySelect && !categorySelect.value) {
             categorySelect.value = guessCategoryFromPlaceTypes(place.types);
        }

        console.log(`Modal Autocomplete: Selected - ${place.name}`);
    } else {
        console.warn('Modal Autocomplete: Place geometry not found.');
    }
}

/**
 * Attempts to guess a relevant category based on Google Place types.
 * @param {string[]} types - Array of place types from Google Places API.
 * @returns {string} A suggested category name (from PREDEFINED_CATEGORIES).
 */
function guessCategoryFromPlaceTypes(types) {
    if (!Array.isArray(types)) return DEFAULT_CATEGORY;

    // Prioritize specific types
    if (types.includes('lodging')) return 'ホテル';
    if (types.includes('restaurant') || types.includes('cafe') || types.includes('food')) return '食事';
    if (types.includes('store') || types.includes('shopping_mall')) return '買い物';
    if (types.includes('tourist_attraction') || types.includes('museum') || types.includes('park') || types.includes('landmark')) return '観光';
    if (types.includes('train_station') || types.includes('subway_station') || types.includes('bus_station') || types.includes('airport') || types.includes('transit_station')) return '移動';
    if (types.includes('movie_theater') || types.includes('stadium') || types.includes('amusement_park')) return 'イベント';

    // Broader categories
    if (types.includes('point_of_interest') || types.includes('establishment')) return 'その他'; // Could be anything

    return DEFAULT_CATEGORY; // Default if no match
}


// --- Markers ---

export function refreshMarkers() {
    state.clearMarkersFromState(); // Clear existing markers from state and map
    if (!state.map || state.markerDisplayMode === "hidden") return;

    // Ensure data order matches list order before creating markers
    // This relies on the list DOM, so maybe call updatePlaceDataOrder() from ui.js before this?
    // Or assume state.placeData is already correctly ordered by SortableJS updates.

    state.placeData.forEach((place, index) => {
        addMarker(place, index);
    });
    updateMarkerLabels(); // Apply styles/labels based on current mode
    console.log(`Refreshed ${state.markers.length} markers.`);
}

function addMarker(place, index) {
    if (!isValidCoordinate(place.lat) || !isValidCoordinate(place.lng)) {
        console.warn(`Skipping marker: ${index + 1}. ${place.name} - Invalid coordinates`);
        return;
    }
    if (!state.map) return;

    const position = { lat: place.lat, lng: place.lng };
    const markerIndex = index + 1; // 1-based index for display

    const markerOptions = {
        position: position,
        map: state.map,
        title: `${markerIndex}. ${place.name}\n${place.address || ''}`,
        draggable: false,
        // Store placeId directly on marker for easy retrieval in click listener
        placeId: place.id
        // Icon and Label are set by updateMarkerLabels
    };

    const marker = new google.maps.Marker(markerOptions);

    // Add click listener to zoom and show InfoWindow
    marker.addListener('click', () => {
        zoomToPlace(marker.placeId); // Use stored placeId
    });

    state.addMarkerToState(marker); // Add to central state
}

// Update marker appearance (label/icon) based on display mode and zoom level
export function updateMarkerLabels() {
    if (!state.map || !state.markers || state.markers.length === 0) return;

    // const zoomLevel = state.map.getZoom(); // Might use zoom level later

    state.markers.forEach((marker, index) => {
        if (!marker || !marker.setOptions) return; // Basic check

        const markerIndex = index + 1; // 1-based index
        let options = {
            visible: true,
            label: null,
            icon: null,
            // zIndex: markerIndex // Optional: control stacking order
        };

        switch (state.markerDisplayMode) {
            case "numbered":
                options.label = { text: markerIndex.toString(), color: '#ffffff', fontWeight: 'bold', fontSize: '12px' };
                // Use default Google Maps icon
                options.icon = null; // Explicitly set to null to override previous custom icons
                break;

            case "dot":
                options.label = null; // No label for dot mode
                options.icon = {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: '#3b82f6', // Blue color
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: 'white'
                };
                break;

            case "hidden":
                options.visible = false;
                break;

            default: // Fallback to numbered
                 options.label = { text: markerIndex.toString(), color: '#ffffff', fontWeight: 'bold', fontSize: '12px' };
                 options.icon = null;
                 break;
        }
        marker.setOptions(options);
    });
}

// --- Polylines (Routes) ---

/**
 * Draws a single polyline segment on the map.
 * Visibility is initially off; controlled by displayRoutesForDate.
 * @param {Array<[number, number]>} geometry - Array of [lng, lat] coordinates.
 * @param {string} transport - Transport mode string to determine color/style.
 * @returns {google.maps.Polyline | null} The created polyline object or null.
 */
export function drawSinglePolyline(geometry, transport) {
    if (!state.map || !geometry || geometry.length < 2) return null;

    const path = geometry.map(coords => ({ lng: coords[0], lat: coords[1] }));
    const color = getRouteColorByTransport(transport);
    const isAir = transport?.includes('飛行機');
    // Crude check for potential straight line fallback (e.g., from ZERO_RESULTS)
    const isFallback = !isAir && geometry.length === 2 && transport !== '徒歩'; // Don't dash short walks

    const polylineOptions = {
        path: path,
        geodesic: true, // Good default
        strokeColor: color,
        strokeOpacity: isFallback ? 0.5 : 0.8,
        strokeWeight: isAir ? 3 : (isFallback ? 2 : 5), // Thicker default
        map: null, // Initially hidden
        zIndex: 1, // Below markers (default marker zIndex is usually higher)
        icons: []
    };

    // Add dashed/dotted effect for air or fallback lines
    if (isAir) {
        polylineOptions.icons = [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '10px' }]; // Dashed
    } else if (isFallback) {
        polylineOptions.icons = [{ icon: { path: google.maps.SymbolPath.CIRCLE, scale: 2, strokeOpacity: 1, strokeColor: color }, offset: '0', repeat: '8px' }]; // Dotted
    }

    return new google.maps.Polyline(polylineOptions);
}

/**
 * Controls the visibility of polylines based on the selected date.
 * @param {string} dateToShow - 'all', 'YYYY-MM-DD', or '日付なし'.
 * @param {boolean} [fitBoundsToDate=true] - Whether to fit the map bounds to the selected date's route.
 */
export function displayRoutesForDate(dateToShow, fitBoundsToDate = true) {
    if (!state.map) return;
    console.log(`Displaying routes for: ${dateToShow}`);
    state.setCurrentlyDisplayedDate(dateToShow);

    const bounds = new google.maps.LatLngBounds();
    let boundsCounter = 0;

    // Iterate through all stored polylines and set visibility
    Object.entries(state.dailyPolylines).forEach(([date, polylines]) => {
        const isVisible = (dateToShow === 'all' || dateToShow === date);
        polylines.forEach(polyline => {
            polyline.setMap(isVisible ? state.map : null);
            // If visible and fitting bounds for this date, extend bounds
            if (isVisible && dateToShow !== 'all' && fitBoundsToDate) {
                 const path = polyline.getPath();
                 path.forEach(point => {
                     bounds.extend(point);
                     boundsCounter++;
                 });
            }
        });
    });

    // Fit map to the specific date's route/markers if a date is selected
    if (dateToShow !== 'all' && fitBoundsToDate) {
         // Also include markers for that date in bounds calculation
         state.placeData.forEach(place => {
             const placeDate = normalizeDate(place.date) || '日付なし';
             if (placeDate === dateToShow && isValidCoordinate(place.lat) && isValidCoordinate(place.lng)) {
                  bounds.extend({ lat: place.lat, lng: place.lng });
                  boundsCounter++;
             }
         });

         if (boundsCounter > 0 && !bounds.isEmpty()) {
              state.map.fitBounds(bounds, 80); // Add padding
              // Prevent over-zooming on very short routes/single points
              google.maps.event.addListenerOnce(state.map, 'idle', () => {
                   if (state.map.getZoom() > 17) state.map.setZoom(17);
               });
         } else {
             console.log(`No geometry found for date: ${dateToShow} to fit bounds.`);
              // Maybe zoom out slightly or center on the first point of the day?
         }
    } else if (dateToShow === 'all' && fitBoundsToDate) {
         // If showing all, optionally fit to all visible routes (called separately by fitMapToAllRoutes usually)
         // fitMapToAllRoutes();
    }

    updateDayRouteButtonHighlights(); // Update button styles in the list UI
    console.log(`Routes updated for ${dateToShow}`);
}

// --- Map View Adjustment ---

/**
 * Fits the map bounds to encompass all currently visible markers and polylines.
 */
export function fitMapToAllRoutes() {
    if (!state.map) return;

    // Ensure 'all' routes are theoretically visible if called explicitly
    if (state.currentlyDisplayedDate !== 'all') {
        displayRoutesForDate('all', false); // Show all, don't fit yet
    }

    const bounds = new google.maps.LatLngBounds();
    let boundsCounter = 0;

    // Visible Markers
    state.markers.forEach(marker => {
        if (marker.getVisible() && marker.getPosition()) {
            bounds.extend(marker.getPosition());
            boundsCounter++;
        }
    });

    // Visible Polylines
    Object.values(state.dailyPolylines).flat().forEach(polyline => {
        if (polyline.getMap() === state.map) { // Check if actually on the map
            const path = polyline.getPath();
            path.forEach(point => {
                bounds.extend(point);
                boundsCounter++;
            });
        }
    });

    if (boundsCounter > 0 && !bounds.isEmpty()) {
        state.map.fitBounds(bounds, 60); // Padding
        console.log(`Map fitted to ${boundsCounter} visible geometries.`);
        // Prevent over-zooming
         google.maps.event.addListenerOnce(state.map, 'idle', () => {
            const maxZoom = 17;
            if (state.map.getZoom() > maxZoom) { state.map.setZoom(maxZoom); }
        });
    } else {
        // No visible items, reset view?
        state.map.setCenter(DEFAULT_MAP_CENTER);
        state.map.setZoom(DEFAULT_MAP_ZOOM);
        console.log('No visible routes/markers to fit.');
    }
}


/**
 * Pans and zooms the map to a specific place and opens its InfoWindow.
 * @param {string} placeId - The ID of the place to zoom to.
 */
export function zoomToPlace(placeId) {
    const place = state.placeData.find(p => p.id === placeId);
    if (!place || !isValidCoordinate(place.lat) || !isValidCoordinate(place.lng)) {
        showError(`ズーム対象の地点が見つからないか、座標が無効です: ${placeId}`);
        console.error(`Zoom target not found or invalid coords: ${placeId}`);
        return;
    }
     if (!state.map || !state.infoWindow) {
         console.warn("Map or InfoWindow not initialized for zoomToPlace.");
         return;
     }

    const position = { lat: place.lat, lng: place.lng };
    state.map.panTo(position);
    if (state.map.getZoom() < 15) {
        // UsepanTo for smooth transition if already close, otherwise setZoom
        // Heuristic: Check distance? Simpler: just set zoom if far below threshold.
         state.map.setZoom(15);
    }

    // Find the corresponding marker
    const marker = state.markers.find(m => m && m.placeId === placeId);

    // Build InfoWindow Content
    const index = state.placeData.findIndex(p => p.id === placeId) + 1;
    const dateText = place.date ? `📅 ${place.date}` : '📅 日付なし';
    const category = place.category || DEFAULT_CATEGORY;
    const categoryIcon = getCategoryIcon(category); // Use utility
    const categoryText = `<p class="text-sm mb-1 font-medium"><span class="mr-1">${categoryIcon}</span> ${category}</p>`;

    let tagsText = '';
    if (place.tags && place.tags.length > 0) {
        tagsText = `<p class="text-xs text-gray-600 mb-1">🏷️ ${place.tags.join(', ')}</p>`;
    }

    let transportText = '';
    if (place.transport && place.transport !== DEFAULT_TRANSPORT) {
        transportText = `<p class="text-sm mb-1">➡️ 次の移動: ${place.transport}</p>`;
    }
    let routeInfoHTML = '';
    if (place.routeInfo && (place.routeInfo.distance || place.routeInfo.duration)) {
        const dist = place.routeInfo.distance || '';
        const dur = place.routeInfo.duration || '';
        routeInfoHTML = `<p class="text-sm text-gray-600 mb-1">🚏 ${dist}${dist && dur ? ' / ' : ''}${dur}</p>`;
    }
    const memoHTML = place.memo ? `<p class="text-sm mt-1 italic text-gray-700 border-t pt-1">📝 ${place.memo.replace(/\n/g, '<br>')}</p>` : ''; // Handle newlines in memo

    // Create buttons with event listeners attached via JS later if possible,
    // but inline onclick is simpler for InfoWindow content. We need functions on window scope.
    // Assign functions needed by InfoWindow content to window scope in init.js
    const contentString = `
        <div class="p-1" style="max-width: 300px; font-family: sans-serif; font-size: 14px;">
            <h3 class="font-bold text-base mb-1">${index}. ${place.name}</h3>
            ${categoryText}
            ${tagsText}
            <p class="text-sm mb-1">${dateText}</p>
            <p class="text-sm mb-1">📍 ${place.address || '(住所なし)'}</p>
            ${transportText}
            ${routeInfoHTML}
            ${memoHTML}
            <div class="flex justify-end space-x-2 mt-2 border-t pt-2">
                <button onclick="window.tripmaker_openEditModal('${place.id}')" class="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs">編集</button>
                <button onclick="window.tripmaker_deletePlaceWrapper('${place.id}')" class="bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded text-xs">削除</button>
            </div>
        </div>
    `;

    state.infoWindow.close(); // Close previous
    state.infoWindow.setContent(contentString);

    if (marker) {
        state.infoWindow.open(state.map, marker);
        // Add bounce animation
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 750); // Stop bounce after ~1 bounce cycle
    } else {
        // Fallback if marker doesn't exist (e.g., hidden mode or error)
        state.infoWindow.setPosition(position);
        state.infoWindow.open(state.map);
        console.warn(`Marker not found for place ${placeId}, opening InfoWindow at position.`);
    }
}


// --- Geocoding ---

/**
 * Geocodes places in state.placeData that lack coordinates using their address.
 * Handles API rate limits with delays.
 */
export async function geocodeAndRefreshAfterCsvImport() {
    if (!state.geocoder) {
        showError("ジオコーダーが初期化されていません。座標検索をスキップします。", true);
        console.warn("Geocoder not initialized. Skipping geocoding.");
        return; // Or reject? Resolve seems safer.
    }
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    showCopyFeedback("住所から座標を検索中...");

    const placesToGeocode = state.placeData.filter(place =>
        (!isValidCoordinate(place.lat) || !isValidCoordinate(place.lng)) && place.address?.trim()
    );

    if (placesToGeocode.length === 0) {
         console.log("No places need geocoding.");
         if (loadingIndicator) loadingIndicator.classList.add('hidden');
         showCopyFeedback("インポート完了。座標検索は不要でした。");
         return; // Resolve immediately
    }

    console.log(`Attempting to geocode ${placesToGeocode.length} places...`);
    let geocodedCount = 0;
    let failedCount = 0;

    // Process sequentially with delay
    for (const place of placesToGeocode) {
         try {
             const success = await geocodeSinglePlaceWithRetry(place);
             if(success) geocodedCount++;
             else failedCount++;
         } catch (error) {
             failedCount++;
             console.error(`Geocoding failed ultimately for ${place.name}: ${error}`);
             // Don't stop the whole batch, just log the error
         }
         // Wait before the next request
         await new Promise(resolve => setTimeout(resolve, GEOCODING_DELAY));
    }

    console.log(`Geocoding finished. Success: ${geocodedCount}, Failed: ${failedCount}`);
    if (loadingIndicator) loadingIndicator.classList.add('hidden');

    if (geocodedCount > 0) {
         state.savePlaceData(); // Save updated coordinates
         showCopyFeedback(`インポート完了。${geocodedCount}件の座標を検索しました。`);
         setRouteDirty(true); // Coordinates might have changed, mark routes dirty
    } else {
         showCopyFeedback(`インポート完了。座標の検索に失敗しました。`);
    }
     // UI refresh happens in the calling function (importDataFromCsv)
}

// Geocodes a single place with retry logic for OVER_QUERY_LIMIT
async function geocodeSinglePlaceWithRetry(place) {
    if (!state.geocoder || !place.address?.trim()) return false; // Nothing to geocode

    let attempts = 0;
    while (attempts <= GEOCODING_MAX_RETRIES) {
        try {
            // console.log(`Geocoding attempt ${attempts + 1} for: ${place.address}`);
            const response = await state.geocoder.geocode({ address: place.address });

            if (response && response.results && response.results.length > 0) {
                const location = response.results[0].geometry.location;
                // Update the place object directly in the state array
                state.updateSinglePlaceData(place.id, {
                    lat: location.lat(),
                    lng: location.lng(),
                    // Optionally update address with formatted_address?
                    // address: response.results[0].formatted_address
                });
                console.log(`Geocoding success for ${place.name}: ${place.address}`);
                return true; // Success
            } else {
                 console.warn(`Geocoding: No results for ${place.name}: ${place.address}`);
                 state.updateSinglePlaceData(place.id, { lat: null, lng: null }); // Mark as failed
                 return false; // No results found, don't retry
            }
        } catch (error) {
            console.error(`Geocoding error for ${place.name} (${place.address}):`, error);
            if (error.code === 'OVER_QUERY_LIMIT') {
                 attempts++;
                 if (attempts <= GEOCODING_MAX_RETRIES) {
                     const backoffDelay = Math.pow(2, attempts) * 100 + Math.random() * 100; // Exponential backoff
                     console.warn(`OVER_QUERY_LIMIT for ${place.name}. Retrying in ${backoffDelay.toFixed(0)} ms...`);
                     await new Promise(resolve => setTimeout(resolve, backoffDelay));
                     // Continue to next iteration of the while loop
                 } else {
                     console.error(`Geocoding failed for ${place.name} after ${GEOCODING_MAX_RETRIES} retries due to OVER_QUERY_LIMIT.`);
                     state.updateSinglePlaceData(place.id, { lat: null, lng: null });
                     return false; // Max retries reached
                 }
            } else {
                 // Other errors (ZERO_RESULTS handled above, INVALID_REQUEST, UNKNOWN_ERROR etc.)
                 state.updateSinglePlaceData(place.id, { lat: null, lng: null });
                 return false; // Non-retryable error
            }
        }
    }
    return false; // Should technically be unreachable if logic is correct
}


// --- Map Controls ---

export function setMapType(mapTypeId) {
    if (state.map && mapTypeId) {
        state.map.setMapTypeId(mapTypeId);
        console.log(`Map type set to: ${mapTypeId}`);
    }
}

// Updates marker display mode and refreshes markers
export function updatePinDisplayMode(mode) {
    if (['numbered', 'dot', 'hidden'].includes(mode)) {
        state.setMarkerDisplayMode(mode);
        localStorage.setItem(STORAGE_KEY_MARKER_MODE, mode); // Persist setting
        refreshMarkers(); // Update markers immediately
        updateMarkerModeButtonStyles(); // Update UI dropdown
        console.log(`Marker display mode set to: ${mode}`);
    } else {
        console.warn(`Invalid marker display mode: ${mode}`);
    }
}


// --- Air Route Calculation (Helper) ---
// Calculates straight-line distance and estimated duration for air travel.
export function getAirRouteDetails(originCoords, destinationCoords) {
     if (!google.maps.geometry) {
          console.error("Google Geometry library not loaded for air route calculation.");
          return { distance: null, duration: null, geometry: [] };
      }
    const originLatLng = new google.maps.LatLng(originCoords.lat, originCoords.lng);
    const destLatLng = new google.maps.LatLng(destinationCoords.lat, destinationCoords.lng);

    const distanceMeters = google.maps.geometry.spherical.computeDistanceBetween(originLatLng, destLatLng);
    const distanceKm = distanceMeters / 1000;

    // Estimate duration (very rough estimate)
    const avgSpeedKmh = 800; // Assumed average cruise speed
    const durationHours = distanceKm / avgSpeedKmh;
    let durationText = "計算不可";
    let durationSeconds = null;

    if (durationHours > 0) {
        durationSeconds = Math.round(durationHours * 3600);
        const totalMinutes = Math.round(durationHours * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        let parts = [];
        if (hours > 0) parts.push(`${hours}時間`);
        if (minutes > 0) parts.push(`${minutes}分`);
        durationText = parts.length > 0 ? `約 ${parts.join('')}` : "短時間";
    }

    return {
        distance: { text: `${distanceKm.toFixed(0)} km`, value: distanceMeters },
        duration: { text: durationText, value: durationSeconds },
        geometry: [[originCoords.lng, originCoords.lat], [destinationCoords.lng, destinationCoords.lat]] // Straight line GeoJSON
    };
}


/**
 * Clears markers, polylines from the map and resets the map view.
 * Does NOT clear the underlying data in state.js arrays.
 */
export function clearMapData() {
    state.clearMarkersFromState(); // Clears state.markers and removes from map
    state.clearPolylinesFromState(); // Clears state.dailyPolylines and removes from map

    // Reset map view
    if (state.map) {
        state.map.setCenter(DEFAULT_MAP_CENTER);
        state.map.setZoom(DEFAULT_MAP_ZOOM);
    }
    // Close InfoWindow if open
    state.infoWindow?.close();

    console.log("Cleared markers and polylines from map.");
}

// --- Helper to get category color (used potentially by custom markers if implemented) ---
function getCategoryColor(category) {
    const categoryColorMap = {
        '観光': '#3b82f6', '食事': '#ef4444', 'ホテル': '#8b5cf6',
        '移動': '#10b981', '買い物': '#f59e0b', 'イベント': '#ec4899',
        '休憩': '#6366f1', 'その他': '#6b7280'
    };
    return categoryColorMap[category] || categoryColorMap[DEFAULT_CATEGORY];
}

// --- Helper to get date-based color (used potentially by custom markers/routes) ---
function getColorForDate(dateStr) {
    // Simple color cycling based on date hash
    const defaultColors = [
        '#3b82f6', '#10b981', '#ec4899', '#f59e0b', '#8b5cf6',
        '#ef4444', '#06b6d4', '#eab308', '#6366f1', '#14b8a6'
    ];
    if (!dateStr || dateStr === '日付なし') return '#6b7280'; // Grey for no date

    // Memoization can be added here if called frequently with same dates
    const hash = hashCode(dateStr); // Use utility hash function
    return defaultColors[hash % defaultColors.length];
}