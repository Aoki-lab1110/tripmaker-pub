// tripmaker/js/route.js
import * as state from './state.js';
import { drawSinglePolyline, displayRoutesForDate, getAirRouteDetails } from './map.js';
import { renderUI } from './ui.js';
import { savePlaceData } from './data.js'; // ルート計算後の保存用
import { showCopyFeedback, showError, isValidCoordinate, normalizeDate } from './utils.js'; // normalizeDate を追加
import { DIRECTIONS_DELAY, TRANSPORT_ROUTE_COLORS } from '../config.js'; // パス修正: 1つ上のディレクトリからconfig.jsをインポート

/**
 * Sets the route dirty state and updates the recalc button UI.
 * @param {boolean} isDirty - True if routes need recalculation.
 */
export function setRouteDirty(dirty) {
    state.setRouteDirty(dirty);
    const recalcBtn = document.getElementById('recalcRouteBtn');
    if (!recalcBtn) return;

    recalcBtn.classList.toggle('hidden', !dirty);
    recalcBtn.classList.toggle('dirty', dirty); // For animation/styling
    recalcBtn.title = dirty
        ? "リストが変更されました。クリックしてルートを再計算します。"
        : "ルートは最新です";
    // console.log(`Route dirty state set to: ${dirty}`);
}

/**
 * Clears all route polylines from the map and associated data.
 */
export function clearRoutes() {
    state.clearPolylinesFromState(); // Clears map and internal structure
    state.clearRouteInfoFromPlaces(); // Remove geometry/dist/dur from placeData
    // state.clearRouteCache(); // Optionally clear cache too
    console.log('Routes cleared from map and data.');
    // No need to re-render list here, usually called before a full renderUI
}

/**
 * Calculates routes between consecutive points in placeData.
 * Handles API rate limiting and updates UI upon completion.
 * @param {boolean} [isInitialLoad=false] - Indicates if called during initial page load.
 */
export function recalculateRoutes(isInitialLoad = false) {
    // Ensure data is ordered correctly before calculation (SortableJS should handle this)
    // state.sortPlaceData based on DOM if needed, but might be redundant.

    clearRoutes(); // Clear existing routes first

    if (!state.map || !state.directionsService || state.placeData.length < 2) {
        setRouteDirty(false); // No routes to calculate, so not dirty
        console.log("Route calculation skipped: Not enough places or map not ready.");
        renderUI(false); // Still render the list even if no routes
        return;
    }

    const routesToCalculate = [];
    for (let i = 0; i < state.placeData.length - 1; i++) {
        const originPlace = state.placeData[i];
        const destPlace = state.placeData[i + 1];

        if (!isValidCoordinate(originPlace.lat) || !isValidCoordinate(originPlace.lng) ||
            !isValidCoordinate(destPlace.lat) || !isValidCoordinate(destPlace.lng)) {
            console.warn(`Skipping route calculation due to invalid coordinates: ${originPlace.name} -> ${destPlace.name}`);
            // Clear any potential old route info for this segment
            state.updatePlaceRouteInfo(originPlace.id, { distance: null, duration: null, geometry: null });
            continue;
        }

        routesToCalculate.push({
            origin: { lat: originPlace.lat, lng: originPlace.lng },
            destination: { lat: destPlace.lat, lng: destPlace.lng },
            transport: originPlace.transport || DEFAULT_TRANSPORT,
            originId: originPlace.id,
            originDate: normalizeDate(originPlace.date) || '日付なし' // Use normalized date for grouping
        });
    }

    if (routesToCalculate.length > 0) {
        console.log(`Calculating ${routesToCalculate.length} route segments...`);
        processRouteQueue(routesToCalculate, isInitialLoad);
    } else {
        console.log("No valid route segments to calculate.");
        setRouteDirty(false); // No routes calculated
        renderUI(false); // Update list display
    }
}

/**
 * Processes the queue of route calculations sequentially with delays.
 * @param {Array<object>} queue - Array of route calculation requests.
 * @param {boolean} isInitialLoad - True if initial load.
 */
async function processRouteQueue(queue, isInitialLoad) {
    const results = [];
    let successfulCalculations = 0;
    const loadingIndicator = document.getElementById('loading-indicator');

    if (!isInitialLoad && loadingIndicator) loadingIndicator.classList.remove('hidden');
    showCopyFeedback("ルート計算中...");

    for (let i = 0; i < queue.length; i++) {
        const routeInfo = queue[i];
        try {
            const result = await calculateSingleRoute(routeInfo);
            results.push(result);
            if (result.status === google.maps.DirectionsStatus.OK) {
                successfulCalculations++;
            }
            // Add delay even after the last item? No, only between items.
            if (i < queue.length - 1) {
                 await new Promise(resolve => setTimeout(resolve, DIRECTIONS_DELAY));
            }
        } catch (error) {
            console.error("Unexpected error during batch route calculation:", error, routeInfo);
            // Add a placeholder error result to maintain array length correspondence?
             results.push({ status: 'INTERNAL_ERROR', error: error, request: routeInfo, leg: null });
            // Add delay even after error? Yes, to prevent hammering API after failure.
             if (i < queue.length - 1) {
                 await new Promise(resolve => setTimeout(resolve, DIRECTIONS_DELAY));
             }
        }
    }

    console.log(`Route calculation complete. Success: ${successfulCalculations}/${queue.length}`);
    if (loadingIndicator) loadingIndicator.classList.add('hidden'); // Hide regardless of initial load now

    // Update placeData with distance, duration, and geometry
    updatePlaceDataWithRouteResults(results);

    // Draw the polylines on the map (initially hidden or shown based on current filter)
    drawCalculatedPolylines();

    // Routes are now up-to-date
    setRouteDirty(false);

    // Refresh the list display with new route info & display routes on map
    renderUI(false, isInitialLoad); // Re-render list, display routes, fit map only if initial load

    // Save the updated placeData with route info
    savePlaceData();
    showCopyFeedback("ルート計算完了。");
}

/**
 * Calculates a single route segment using DirectionsService or cache/fallback.
 * @param {object} routeInfo - Contains origin, destination, transport, originId, originDate.
 * @returns {Promise<object>} Promise resolving with route result object.
 */
function calculateSingleRoute(routeInfo) {
    return new Promise((resolve) => {
        const { origin, destination, transport, originId } = routeInfo;
        const travelMode = getTravelMode(transport); // Can return null for air/ship

        // --- Handle Air Travel (Direct Calculation) ---
        if (transport?.includes('飛行機')) {
            const airRouteResult = getAirRouteDetails(origin, destination); // From map.js
            const result = {
                status: google.maps.DirectionsStatus.OK, // Treat as OK for processing
                request: routeInfo,
                route: null, // No DirectionsRoute object
                leg: airRouteResult, // Contains distance, duration, geometry
                fromCache: false // Not from API cache
            };
            resolve(result);
            return;
        }

        // --- Handle unsupported or non-API modes (e.g., 船/Ferry) ---
         if (travelMode === null && !transport?.includes('飛行機')) {
              console.log(`Unsupported transport for Directions API: ${transport}. Using straight line.`);
              const straightLineLeg = {
                   distance: null, // Cannot calculate reliable distance/duration
                   duration: null,
                   geometry: [[origin.lng, origin.lat], [destination.lng, destination.lat]] // Straight line
              };
              resolve({
                   status: google.maps.DirectionsStatus.OK, // Treat as OK
                   request: routeInfo,
                   route: null,
                   leg: straightLineLeg,
                   fromCache: false
              });
              return;
         }

        // --- Use Directions API (with Cache) ---
        const request = { origin, destination, travelMode };
        const cacheKey = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}-${travelMode}`;

        // Check Cache
        if (state.routeCache[cacheKey]) {
            // console.log(`Using cached route for: ${originId}`);
            resolve({
                status: google.maps.DirectionsStatus.OK,
                request: routeInfo,
                route: null, // No full route object needed from cache
                leg: state.routeCache[cacheKey], // Cached leg info (dist, dur, geom)
                fromCache: true
            });
            return;
        }

        // Call Directions Service
        state.directionsService.route(request, (response, status) => {
            let legInfo = null;
            let route = null;

            if (status === google.maps.DirectionsStatus.OK && response?.routes?.[0]?.legs?.[0]) {
                route = response.routes[0];
                const leg = route.legs[0];
                // Prepare leg info including GeoJSON geometry
                legInfo = {
                    distance: leg.distance, // Keep original google.maps.Distance object
                    duration: leg.duration, // Keep original google.maps.Duration object
                    // Store detailed path as GeoJSON [[lng, lat], ...]
                    geometry: leg.steps.flatMap(step => step.path).map(p => [p.lng(), p.lat()])
                    // Or simpler overview path:
                    // geometry: route.overview_path.map(p => [p.lng(), p.lat()])
                };
                state.cacheRouteResult(cacheKey, legInfo); // Cache the successful result
            } else {
                console.warn(`Route calculation failed (${status}) for ${originId} -> ... (${transport})`);
                // For ZERO_RESULTS or errors, create a fallback straight line geometry
                 legInfo = {
                     distance: null,
                     duration: null,
                     geometry: [[origin.lng, origin.lat], [destination.lng, destination.lat]] // Straight line
                 };
                 // Do not cache errors/fallbacks
            }
            resolve({ status, request: routeInfo, route, leg: legInfo, fromCache: false });
        });
    });
}

/**
 * Updates the central placeData state with the results from route calculations.
 * @param {Array<object>} results - Array of route result objects from processRouteQueue.
 */
function updatePlaceDataWithRouteResults(results) {
    results.forEach(result => {
        if (!result || !result.request) return;
        const { originId } = result.request;
        let routeInfoUpdate = {
             distance: null,
             duration: null,
             geometry: null // Ensure geometry is cleared if calculation failed
         };

        if (result.leg) {
             // Use text representations for display, store geometry
             if (result.leg.distance) {
                 routeInfoUpdate.distance = result.leg.distance.text;
             }
             if (result.leg.duration) {
                 routeInfoUpdate.duration = result.leg.duration.text;
             }
             if (result.leg.geometry) {
                  routeInfoUpdate.geometry = result.leg.geometry; // GeoJSON format [[lng, lat], ...]
             }
        }
        // Update the specific place's routeInfo in the central state
        state.updatePlaceRouteInfo(originId, routeInfoUpdate);
    });
    // console.log("placeData updated with route calculation results.");
}


/**
 * Iterates through placeData, draws polylines based on stored routeInfo.geometry,
 * and stores them in the state.dailyPolylines structure.
 */
function drawCalculatedPolylines() {
    state.clearPolylinesFromState(); // Clear previous polylines first

    state.placeData.forEach((place, index) => {
        if (index < state.placeData.length - 1 && place.routeInfo?.geometry && place.routeInfo.geometry.length > 0) {
            const routeDate = normalizeDate(place.date) || '日付なし';
            const polyline = drawSinglePolyline(place.routeInfo.geometry, place.transport);
            if (polyline) {
                 state.addPolyline(routeDate, polyline); // Add to state, associated with date
            }
        }
     });
     console.log(`Drew ${Object.values(state.dailyPolylines).flat().length} polyline objects.`);

     // After drawing, ensure the correct ones are visible based on the current filter
     displayRoutesForDate(state.currentlyDisplayedDate, false); // Update visibility, don't fit bounds here
 }


// --- Helpers ---

/**
 * Maps transport string to Google Maps TravelMode.
 * Returns null for modes not directly supported by Directions API (like air, ship).
 * @param {string} transport - The transport mode string.
 * @returns {google.maps.TravelMode | null}
 */
export function getTravelMode(transport) {
    if (!transport) return google.maps.TravelMode.DRIVING; // Default if unspecified
    const t = transport.toLowerCase();
    if (t.includes('車') || t.includes('レンタカー') || t.includes('car') || t.includes('taxi') || t.includes('タクシー')) return google.maps.TravelMode.DRIVING;
    if (t.includes('徒歩') || t.includes('walk')) return google.maps.TravelMode.WALKING;
    if (t.includes('電車') || t.includes('train') || t.includes('地下鉄') || t.includes('subway') || t.includes('バス') || t.includes('bus')) return google.maps.TravelMode.TRANSIT;
    if (t.includes('自転車') || t.includes('bike') || t.includes('bicycle')) return google.maps.TravelMode.BICYCLING;
    // Modes without direct API support - return null to handle manually (e.g., straight line)
    if (t.includes('飛行機') || t.includes('airplane')) return null;
    if (t.includes('船') || t.includes('フェリー') || t.includes('boat') || t.includes('ferry')) return null;
    // Default to DRIVING for unknown "その他" etc.
    return google.maps.TravelMode.DRIVING;
}

/**
 * Gets a color hex string based on the transport mode.
 * @param {string} transport - The transport mode string.
 * @returns {string} Hex color code.
 */
export function getRouteColorByTransport(transport) {
    if (!transport) return TRANSPORT_ROUTE_COLORS['default'];
    const t = transport.toLowerCase();
    // Match specific keywords
    for (const [keyword, color] of Object.entries(TRANSPORT_ROUTE_COLORS)) {
         if (keyword !== 'default' && t.includes(keyword.toLowerCase())) {
             return color;
         }
     }
    return TRANSPORT_ROUTE_COLORS['default']; // Fallback color
}