// tripmaker/js/state.js
import { DEFAULT_CATEGORY } from '../config.js'; // パス修正: 1つ上のディレクトリからconfig.jsをインポート

// --- Application State ---
// These variables hold the core data and UI state of the application.
// They are modified by functions primarily in data.js, map.js, and ui.js.

// Data State
export let placeData = []; // Array of place objects {id, name, address, lat, lng, date, category, tags, arrivalTime, departureTime, transport, memo, routeInfo}
export let travelMetadata = { // Metadata about the trip
    tripName: '無題の旅行',
    budget: '',
    notes: '',
    version: '1.0'
};

// Map & Route State
export let map = null; // Google Map instance
export let markers = []; // Array of Google Map marker objects
export let dailyPolylines = {}; // {'YYYY-MM-DD': [polyline1, ...], '日付なし': [...]}
export let routeCache = {}; // Cache for Directions API results: { cacheKey: legInfo }
export let infoWindow = null; // Single InfoWindow instance
export let directionsService = null; // DirectionsService instance
export let geocoder = null; // Geocoder instance

// UI & Interaction State
export let sortableInstances = []; // Array of SortableJS instances
export let currentlyDisplayedDate = 'all'; // 'all', 'YYYY-MM-DD', or '日付なし' (for route display)
export let markerDisplayMode = "numbered"; // "numbered", "dot", "hidden"
export let isRouteDirty = false; // Flag indicating if routes need recalculation
export let currentCategoryFilter = 'all'; // Selected category filter
export let currentTags = []; // Tags being edited in the modal
export let selectedPlaceIdsForMap = new Set(); // Place IDs selected for Google Maps transfer
export let lastUsedDate = ''; // Remembers the last date used in the modal for convenience
export let headerSelectedPlace = null; // Place selected via header autocomplete but not yet added

// --- State Modification Functions ---
// These functions provide controlled ways to update the state.

export function setPlaceData(newPlaceData) {
    placeData = newPlaceData.map(p => ({
        ...p,
        category: p.category || DEFAULT_CATEGORY, // Ensure category default
        tags: Array.isArray(p.tags) ? p.tags : [], // Ensure tags is array
        routeInfo: p.routeInfo || undefined
    }));
}

export function updateSinglePlaceData(placeId, updatedData) {
    const index = placeData.findIndex(p => p.id === placeId);
    if (index !== -1) {
        placeData[index] = { ...placeData[index], ...updatedData };
    } else {
        console.warn(`updateSinglePlaceData: Place not found with ID ${placeId}`);
    }
}

export function addPlaceData(placeObj) {
    placeData.push(placeObj);
}

export function deletePlaceData(placeId) {
    const index = placeData.findIndex(p => p.id === placeId);
    if (index !== -1) {
        placeData.splice(index, 1);
    }
    selectedPlaceIdsForMap.delete(placeId); // Also remove from selection
}

export function sortPlaceData(orderedPlaceIds) {
     placeData.sort((a, b) => {
         return orderedPlaceIds.indexOf(a.id) - orderedPlaceIds.indexOf(b.id);
     });
}

export function clearRouteInfoFromPlaces() {
     placeData.forEach(place => {
         if (place.routeInfo) {
             delete place.routeInfo.geometry; // Keep distance/duration maybe? Or clear all:
             // delete place.routeInfo;
         }
     });
}

export function updatePlaceRouteInfo(placeId, routeInfoUpdate) {
     const placeIndex = placeData.findIndex(p => p.id === placeId);
     if (placeIndex !== -1) {
         placeData[placeIndex].routeInfo = {
             ...(placeData[placeIndex].routeInfo || {}),
             ...routeInfoUpdate
         };
     }
}

export function setTravelMetadata(newMetadata) {
    travelMetadata = { ...travelMetadata, ...newMetadata, version: "1.0" };
}

export function resetTravelMetadata() {
     travelMetadata = { tripName: '無題の旅行', budget: '', notes: '', version: '1.0' };
}

export function setMap(mapInstance) {
    map = mapInstance;
}

export function setDirectionsService(service) {
    directionsService = service;
}

export function setGeocoder(geo) {
    geocoder = geo;
}

export function setInfoWindow(iw) {
    infoWindow = iw;
}

export function addMarkerToState(marker) {
    markers.push(marker);
}

export function clearMarkersFromState() {
    markers.forEach(marker => marker.setMap(null)); // Remove from map visually
    markers = []; // Clear array
}

export function addPolyline(date, polyline) {
    if (!dailyPolylines[date]) {
        dailyPolylines[date] = [];
    }
    dailyPolylines[date].push(polyline);
}

export function clearPolylinesFromState() {
    Object.values(dailyPolylines).forEach(polylines => {
        polylines.forEach(p => p.setMap(null)); // Remove from map visually
    });
    dailyPolylines = {}; // Clear structure
}

export function clearRouteCache() {
    routeCache = {};
}

export function cacheRouteResult(key, legInfo) {
    routeCache[key] = legInfo;
};

export function setRouteDirty(dirty) {
    isRouteDirty = dirty;
}

export function setMarkerDisplayMode(mode) {
    markerDisplayMode = mode;
}

export function setCurrentCategoryFilter(category) {
    currentCategoryFilter = category;
}

export function setCurrentlyDisplayedDate(date) {
    currentlyDisplayedDate = date;
}

export function setCurrentTags(tags) {
    currentTags = [...tags]; // Ensure copy
}

export function addCurrentTag(tag) {
    if (tag && !currentTags.includes(tag)) {
        currentTags.push(tag);
    }
}

export function removeCurrentTag(tag) {
    currentTags = currentTags.filter(t => t !== tag);
}

export function addSelectedPlaceId(id) {
    selectedPlaceIdsForMap.add(id);
}

export function removeSelectedPlaceId(id) {
    selectedPlaceIdsForMap.delete(id);
}

export function clearSelectedPlaceIds() {
     selectedPlaceIdsForMap.clear();
}

export function setLastUsedDate(date) {
    lastUsedDate = date;
}

export function setHeaderSelectedPlace(place) {
    headerSelectedPlace = place;
}

export function addSortableInstance(instance) {
    sortableInstances.push(instance);
}

export function destroySortableInstances() {
    sortableInstances.forEach(s => s.destroy());
    sortableInstances = [];
}
