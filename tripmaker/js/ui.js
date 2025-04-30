// tripmaker/js/ui.js
import * as state from './state.js';
import { savePlaceData, saveMetadata, deletePlace } from './data.js'; // 存在しない関数のインポートを削除
import { zoomToPlace, refreshMarkers, fitMapToAllRoutes, displayRoutesForDate, setMapType, updatePinDisplayMode } from './map.js';
import { setRouteDirty, recalculateRoutes } from './route.js';
import { normalizeDate, getCategoryIcon, isValidCoordinate, showError, showCopyFeedback } from './utils.js';
import { closeTripSettingsModal } from './data.js';
import { restorePolylinesFromPlaceData } from './map_restore.js';
import { PREDEFINED_CATEGORIES, DEFAULT_CATEGORY, DEFAULT_TRANSPORT, CATEGORY_ICONS, WEEKDAY_COLOR_MAP, STORAGE_KEY_SHOW_TIME, MAX_GOOGLE_MAPS_TRANSFER_PLACES } from '../config.js'; // MAX_GOOGLE_MAPS_TRANSFER_PLACES を追加

// Reference to Sortable library (assuming it's loaded globally via script tag)
// If using npm, import Sortable from 'sortablejs';
const Sortable = window.Sortable;

// --- モバイル用ビュー切り替え ---
export function switchToMobileMapView() {
    // タブ切り替え
    document.getElementById('map-tab')?.classList.add('active');
    document.getElementById('list-tab')?.classList.remove('active');
    // ビュー切り替え
    const mapView = document.getElementById('map-view');
    const listView = document.getElementById('list-view');
    if (mapView) mapView.style.display = 'block';
    if (listView) listView.style.display = 'none';
    // 地図初期化・リサイズ
    if (window.google && window.google.maps) {
        setTimeout(() => {
            if (window.state && window.state.map) {
                window.google.maps.event.trigger(window.state.map, 'resize');
            }
            // プレースホルダー非表示
            const placeholder = document.getElementById('mobile-map-placeholder');
            if (placeholder) placeholder.style.display = 'none';
        }, 200);
    }
}
export function switchToMobileListView() {
    document.getElementById('list-tab')?.classList.add('active');
    document.getElementById('map-tab')?.classList.remove('active');
    const mapView = document.getElementById('map-view');
    const listView = document.getElementById('list-view');
    if (listView) listView.style.display = 'block';
    if (mapView) mapView.style.display = 'none';
}

// --- Main UI Rendering ---

/**
 * Renders the entire UI based on the current state.
 * @param {boolean} [calculateRoutesOnRender=false] - If true, trigger route calculation after rendering.
 * @param {boolean} [fitMapOnRender=false] - If true, fit map bounds after rendering.
 */
export function renderUI(calculateRoutesOnRender = false, fitMapOnRender = false) {
    // Polylineが全て消えている場合は復元
    if (Object.keys(state.dailyPolylines).length === 0) {
        restorePolylinesFromPlaceData();
    }
    console.log("Rendering UI...", { calc: calculateRoutesOnRender, fit: fitMapOnRender });
    renderListGroupedByDate(); // Update the sortable list
    updateHeaderTripName();     // Update trip name in header
    renderCategoryFilterOptions(); // Update category filter dropdown
    applyCurrentFilters();      // Apply search/category filters to the list
    updateMarkerModeButtonStyles(); // Set correct marker display dropdown value
    updateTimeVisibility(); // Ensure time display matches preference

    // Map related updates (only if map is initialized)
    if (state.map) {
        refreshMarkers(); // Redraw markers based on current data and display mode
        if (calculateRoutesOnRender) {
            recalculateRoutes(fitMapOnRender); // Recalculate routes (pass fit flag)
        } else {
            // If not recalculating, ensure current polylines are displayed correctly
            displayRoutesForDate(state.currentlyDisplayedDate, false);
            if (fitMapOnRender) {
                 fitMapToAllRoutes(); // Fit map if requested, even without recalc
            }
        }
    } else {
        console.warn("Map not initialized, skipping map-related rendering.");
    }
    updateGoogleMapTransferButtonState(); // Update state of the "Open in Google Maps" button
}

// --- List Rendering ---

function renderListGroupedByDate() {
    // console.log("Rendering list grouped by date...");
    const listContainer = document.getElementById('sortable-list');
    if (!listContainer) return;
    listContainer.innerHTML = ''; // Clear existing list
    state.destroySortableInstances(); // Destroy old Sortable instances

    if (state.placeData.length === 0) {
        listContainer.innerHTML = '<li class="text-gray-500 p-4 text-center">地点データがありません。「予定追加」ボタンや「データ管理」メニューから地点を追加・インポートしてください。</li>';
        return;
    }

    // 1. Group places by normalized date
    const dateGroups = {};
    state.placeData.forEach(place => {
        const dateKey = normalizeDate(place.date) || '日付なし'; // Use normalized date or '日付なし'
        if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = [];
        }
        dateGroups[dateKey].push(place);
    });

    // 2. Sort dates ("日付なし" at the end)
    const sortedDates = Object.keys(dateGroups).sort((a, b) => {
        if (a === '日付なし') return 1;
        if (b === '日付なし') return -1;
        // Sort actual dates chronologically
        try {
            // Add time component to avoid timezone issues during comparison only
            const dateA = new Date(a + 'T00:00:00').getTime();
            const dateB = new Date(b + 'T00:00:00').getTime();
            if (isNaN(dateA) || isNaN(dateB)) return a.localeCompare(b); // Fallback for invalid dates
             return dateA - dateB;
        } catch (e) {
             return a.localeCompare(b); // Fallback sort
        }
    });

    // 3. Render each date group
    let globalIndex = 1; // Overall item index (1-based)
    sortedDates.forEach((dateKey, groupIndex) => { // dateKey is 'YYYY-MM-DD' or '日付なし'
        const placesInGroup = dateGroups[dateKey];
        const dateInfo = formatDayHeader(dateKey, groupIndex); // Get formatted header info

        // Create Header Element
        const headerElement = createDateGroupHeader(dateKey, dateInfo, placesInGroup.length);
        listContainer.appendChild(headerElement);

        // Create Collapsible Content Wrapper
        const contentElement = document.createElement('li');
        contentElement.className = 'collapsible-content day-items'; // Initially expanded
        contentElement.setAttribute('data-date', dateKey);
        // contentElement.style.maxHeight = 'none'; // Default state (or use CSS)

        // Create Sortable List for the group
        const groupList = document.createElement('ul');
        groupList.className = 'sortable-group';
        groupList.setAttribute('data-date', dateKey);

        // Create and add List Items for places in this group
        placesInGroup.forEach((place) => {
            const listItem = createPlaceListItem(place, globalIndex);
            groupList.appendChild(listItem);
            globalIndex++;
        });

        contentElement.appendChild(groupList);
        listContainer.appendChild(contentElement);
    });

    // 4. Initialize SortableJS for the new groups
    initSortableGroups();

    // 5. Apply filters (search/category) to hide/show items
    applyCurrentFilters();

    // 6. Ensure time visibility matches preference
    updateTimeVisibility();
}


/**
 * Creates the header element for a date group.
 * @param {string} dateKey - 'YYYY-MM-DD' or '日付なし'.
 * @param {object} dateInfo - Formatted date info from formatDayHeader.
 * @param {number} placeCount - Number of places in this group.
 * @returns {HTMLElement} The created header list item element.
 */
function createDateGroupHeader(dateKey, dateInfo, placeCount) {
    const headerElement = document.createElement('li');
    headerElement.className = `date-group-header p-2 sm:p-3 cursor-pointer hover:bg-opacity-70 transition-colors ${dateInfo.colorClass} border-l-4 rounded-l mb-1 flex flex-col sm:flex-row sm:items-center w-full`;
    headerElement.setAttribute('data-date', dateKey);
    headerElement.setAttribute('role', 'button'); // Accessibility
    headerElement.setAttribute('aria-expanded', 'true'); // Initially expanded

    const isActiveDay = state.currentlyDisplayedDate === dateKey;
    const buttonHighlightClass = isActiveDay ? 'active-day-route bg-blue-500 text-white' : 'bg-white text-blue-600 hover:bg-blue-100';

    // Determine badge styles
    const getWeekdayBadgeStyle = (dayIndex) => {
        if (dayIndex < 0 || dayIndex > 6) return 'bg-gray-100 text-gray-600'; // Fallback for invalid index
        const colorClass = WEEKDAY_COLOR_MAP[dayIndex] || '';
        const bgMatch = colorClass.match(/bg-([a-z]+)-(\d+)/);
        const textMatch = colorClass.match(/text-([a-z]+)-(\d+)/);
        // Use a slightly darker background for badge if possible
        const badgeBg = bgMatch ? `bg-${bgMatch[1]}-100` : 'bg-gray-100';
        const badgeText = textMatch ? `text-${textMatch[1]}-700` : 'text-gray-700';
        return `${badgeBg} ${badgeText} shadow-sm`;
    };
    const badgeColorClass = dateKey === '日付なし' ? 'bg-gray-100 text-gray-600' : getWeekdayBadgeStyle(dateInfo.dayIndex);


    headerElement.innerHTML = `
        <!-- Left Side: Toggle, Day/Date Info -->
        <div class="flex items-center flex-grow mb-2 sm:mb-0" data-action="toggle-collapse">
            <span class="toggle-icon transform transition-transform duration-200 mr-2 text-gray-600">▼</span>

            ${dateInfo.dayNumber ? `
                <span class="day-badge rounded-full px-2 py-0.5 font-bold text-xs sm:text-sm bg-white bg-opacity-70 shadow-sm mr-2">
                    DAY ${dateInfo.dayNumber}
                </span>
            ` : ''}

            ${dateInfo.dayName ? `
                <span class="weekday-badge font-medium text-xs sm:text-sm rounded-full w-6 h-6 flex items-center justify-center ${badgeColorClass} mr-2 flex-shrink-0">
                    ${dateInfo.dayName}
                </span>
            ` : ''}

            <span class="font-medium text-sm sm:text-base">${dateInfo.displayDate || '日付なし'}</span>

            <span class="ml-2 text-xs bg-white bg-opacity-70 px-2 py-0.5 rounded-full shadow-sm">
                ${placeCount}地点
            </span>
        </div>

        <!-- Right Side: Show Route Button -->
        <button class="show-day-route-btn ${buttonHighlightClass} rounded shadow-sm border text-xs sm:text-sm py-1 px-2 w-full sm:w-auto mt-1 sm:mt-0 flex-shrink-0"
                data-date="${dateKey}"
                data-action="show-day-route"
                title="${isActiveDay ? '全ルート表示に戻す' : 'この日のルートのみ地図に表示'}">
            ${isActiveDay ? '🗺️ 表示中' : '🗺️ この日のルート表示'}
        </button>
    `;
    return headerElement;
}

/**
 * Formats date information for the group header.
 * @param {string} dateKey - 'YYYY-MM-DD' or '日付なし'.
 * @param {number} groupIndex - The 0-based index of this date group.
 * @returns {object} { displayDate, dayNumber, dayName, dayIndex, colorClass }
 */
function formatDayHeader(dateKey, groupIndex) {
    const dayMap = ["日", "月", "火", "水", "木", "金", "土"];
    if (dateKey === '日付なし') {
        return {
            displayDate: '日付なし',
            dayNumber: null,
            dayName: null,
            dayIndex: -1,
            colorClass: 'bg-gray-50 text-gray-700 border-gray-200' // Specific style for 'no date'
        };
    }

    try {
        // Add time to avoid potential off-by-one timezone issues with Date() constructor alone
        const date = new Date(dateKey + 'T00:00:00');
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date format for header: ${dateKey}`);
        }

        const dayIndex = date.getDay(); // 0 (Sun) to 6 (Sat)
        const dayName = dayMap[dayIndex];
        const dayNumber = groupIndex + 1; // 1-based day number
        const colorClass = WEEKDAY_COLOR_MAP[dayIndex] || 'bg-gray-50 text-gray-700 border-gray-200'; // Fallback color

        return {
            displayDate: dateKey, // Show the YYYY-MM-DD date
            dayNumber: dayNumber,
            dayName: dayName,
            dayIndex: dayIndex,
            colorClass: colorClass
        };
    } catch (e) {
        console.error("Error formatting date header:", e);
        return { // Fallback for invalid dates passed in
            displayDate: dateKey,
            dayNumber: groupIndex + 1,
            dayName: '?',
            dayIndex: -1,
            colorClass: 'bg-red-50 text-red-700 border-red-200' // Error indication
        };
    }
}

/**
 * Creates a list item element for a single place.
 * @param {object} place - The place data object.
 * @param {number} globalIndex - The 1-based index of this place in the overall list.
 * @returns {HTMLElement} The created list item element.
 */
function createPlaceListItem(place, globalIndex) {
    const listItem = document.createElement('li');
    // Base classes + hover/focus + transition
    listItem.className = 'place-item p-3 mb-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 focus-within:ring-2 focus-within:ring-blue-300 cursor-move transition-colors duration-150';
    listItem.setAttribute('data-id', place.id);
    listItem.setAttribute('data-date', normalizeDate(place.date) || '日付なし'); // Use normalized date
    listItem.setAttribute('tabindex', '0'); // Make it focusable

    const category = place.category || DEFAULT_CATEGORY;
    const categoryIcon = getCategoryIcon(category);
    // Add data-category for styling specific categories via CSS
    const categoryHTML = `<span class="category-label" data-category="${category}" title="カテゴリ: ${category}"><span class="icon">${categoryIcon}</span>${category}</span>`;

    let tagsHTML = '';
    if (place.tags && place.tags.length > 0) {
        tagsHTML = place.tags.map(tag => `<span class="tag-label" title="タグ: ${tag}">#${tag}</span>`).join('');
    }

    const isChecked = state.selectedPlaceIdsForMap.has(place.id) ? 'checked' : '';
    const showTime = localStorage.getItem(STORAGE_KEY_SHOW_TIME) !== 'false';

    listItem.innerHTML = `
        <div class="flex items-start">
            <!-- Checkbox for Google Maps Transfer -->
            <input type="checkbox" class="place-checkbox mt-1" data-id="${place.id}" data-action="toggle-gmap-selection" ${isChecked} title="Google Map転送用に選択/解除">

            <!-- Index Number -->
            <div class="font-semibold text-indigo-700 mr-3 text-lg w-6 text-right flex-shrink-0 pt-px" aria-hidden="true">${globalIndex}.</div>

            <!-- Main Content Area -->
            <div class="flex-grow min-w-0">
                <!-- Top Row: Name and Action Buttons -->
                <div class="flex justify-between items-start mb-1">
                    <h3 class="font-medium text-base truncate pr-2 pt-px" id="place-name-${place.id}">${place.name}</h3>
                    <div class="flex space-x-1 flex-shrink-0 items-center">
                        <button class="text-gray-400 hover:text-blue-600 text-lg p-1 -m-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400" title="編集" data-action="edit-place" data-id="${place.id}" aria-controls="editModal" aria-labelledby="place-name-${place.id}">✏️</button>
                        <button class="text-gray-400 hover:text-red-600 text-lg p-1 -m-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400" title="削除" data-action="delete-place" data-id="${place.id}" aria-labelledby="place-name-${place.id}">🗑️</button>
                    </div>
                </div>

                <!-- Address -->
                <div class="text-sm text-gray-500 truncate mb-1" title="${place.address || ''}">📍 ${place.address || '(住所なし)'}</div>

                <!-- Details Row: Category, Tags, Time, Transport, Route -->
                <div class="list-item-details">
                    ${categoryHTML}
                    ${tagsHTML}
                    ${createTimeDisplay(place, showTime)}
                    ${createTransportDisplay(place)}
                    ${createRouteInfoDisplay(place)}
                </div>

                <!-- Memo (if exists) -->
                ${place.memo ? `<div class="text-xs text-gray-600 mt-2 italic border-t border-gray-100 pt-1">📝 ${place.memo.replace(/\n/g, '<br>')}</div>` : ''}
            </div>
        </div>
    `;

    // Add click listener to the main item (excluding buttons/checkbox) for zooming
    listItem.addEventListener('click', (e) => {
        if (!e.target.closest('button, input[type="checkbox"]')) {
            zoomToPlace(place.id);
        }
    });
    // Add keydown listener for accessibility (Enter/Space to zoom)
     listItem.addEventListener('keydown', (e) => {
         if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button, input[type="checkbox"]')) {
             e.preventDefault(); // Prevent space scroll
             zoomToPlace(place.id);
         }
     });

    return listItem;
}

// Helper to create time display HTML
function createTimeDisplay(place, showTime) {
    const hasArrival = place.arrivalTime && place.arrivalTime.trim() !== '';
    const hasDeparture = place.departureTime && place.departureTime.trim() !== '';
    if (!hasArrival && !hasDeparture) return '';

    let content = '';
    if (hasArrival) content += `<span>到着: ${place.arrivalTime}</span>`;
    if (hasArrival && hasDeparture) content += '<span class="mx-1">|</span>';
    if (hasDeparture) content += `<span>出発: ${place.departureTime}</span>`;

    // Add 'hidden' class directly if time shouldn't be shown initially
    const hiddenClass = showTime ? '' : 'hidden';

    return `
        <div class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center schedule-info ${hiddenClass}">
            <span class="mr-1">🕒</span>
            ${content}
        </div>`;
}

// Helper to create transport display HTML
function createTransportDisplay(place) {
    if (!place.transport || place.transport === DEFAULT_TRANSPORT) return '';
    return `
        <div class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded flex items-center">
            <span class="mr-1">➡️</span>
            <span>${place.transport}</span>
        </div>`;
}

// Helper to create route info display HTML
function createRouteInfoDisplay(place) {
    if (!place.routeInfo || (!place.routeInfo.distance && !place.routeInfo.duration)) return '';
    const dist = place.routeInfo.distance || '';
    const dur = place.routeInfo.duration || '';
    const infoText = dist && dur ? `${dist}・${dur}` : dist || dur;
    return `
        <div class="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded flex items-center route-info">
            <span class="mr-1">🚏</span>
            <span>${infoText}</span>
        </div>`;
}

// --- SortableJS Integration ---

function initSortableGroups() {
    state.destroySortableInstances(); // Clean up previous instances
    document.querySelectorAll('.sortable-group').forEach(groupEl => {
        const sortable = new Sortable(groupEl, {
            group: 'shared-places', // Group name allows dragging between date groups
            animation: 150,
            handle: '.place-item', // Use the whole item as handle
            ghostClass: 'sortable-ghost', // 複数クラス不可。CSSで .sortable-ghost { ... } を定義してください。
            // chosenClass: "sortable-chosen", // Style for the item being dragged
            // dragClass: "sortable-drag", // Style for the item being dragged
            forceFallback: true, // Recommended for better cross-browser compatibility
            onEnd: handleSortEnd
        });
        state.addSortableInstance(sortable); // Store instance
    });
}

function handleSortEnd(evt) {
    const movedItem = evt.item; // The dragged element
    const targetList = evt.to; // The list element where it was dropped
    const placeId = movedItem.getAttribute('data-id');
    const targetDateKey = targetList.getAttribute('data-date'); // 'YYYY-MM-DD' or '日付なし'

    const placeIndex = state.placeData.findIndex(p => p.id === placeId);
    if (placeIndex === -1) {
        showError("並び替えエラー: 移動された地点が見つかりません。");
        console.error("Sortable onEnd: Moved item data not found:", placeId);
        renderUI(false); // Re-render to fix potential visual inconsistency
        return;
    }

    // --- Update Place Data ---
    // 1. Update date if moved to a different group
    const originalDateKey = normalizeDate(state.placeData[placeIndex].date) || '日付なし';
    if (targetDateKey !== originalDateKey) {
        const newDateValue = (targetDateKey === '日付なし') ? '' : targetDateKey; // Store empty string or YYYY-MM-DD
        state.updateSinglePlaceData(placeId, { date: newDateValue });
        console.log(`Item ${placeId} date changed: ${originalDateKey} -> ${targetDateKey}`);
    }

    // 2. Update order based on new DOM position across all groups
    const orderedPlaceIds = [];
    document.querySelectorAll('#sortable-list .place-item').forEach(item => {
        orderedPlaceIds.push(item.getAttribute('data-id'));
    });
    state.sortPlaceData(orderedPlaceIds); // Reorder the placeData array in state.js

    // --- Save and Update UI ---
    savePlaceData(); // Persist changes
    setRouteDirty(true); // Mark routes as needing recalculation

    // --- 自動リルート機能 ---
    const autoRerouteCheckbox = document.getElementById('autoRerouteCheckbox');
    if (autoRerouteCheckbox && autoRerouteCheckbox.checked) {
        // ルートを即時再計算
        recalculateRoutes();
        console.log("自動リルート: ルート再計算実行");
    } else {
        // Re-render the list to reflect new order and potential date change.
        // Pass the flag to NOT recalculate routes immediately.
        renderUI(false);
    }

    console.log("List order/date updated. Routes marked as dirty.");
}


// --- Filtering ---

function renderCategoryFilterOptions() {
    const categoryFilterSelect = document.getElementById('categoryFilterSelect');
    if (!categoryFilterSelect) return;

    const currentSelection = state.currentCategoryFilter; // Use value from state
    // Clear old options (except the first "all" option)
    while (categoryFilterSelect.options.length > 1) {
        categoryFilterSelect.remove(1);
    }

    // Get unique categories from data AND predefined list
    const categoriesInData = state.placeData.map(p => p.category || DEFAULT_CATEGORY).filter(Boolean);
    const allCategories = [...new Set([...PREDEFINED_CATEGORIES, ...categoriesInData])];
    allCategories.sort((a, b) => {
        // Keep predefined order somewhat? Or just alphabetical? Alphabetical is simpler.
        return a.localeCompare(b, 'ja');
    });

    allCategories.forEach(categoryName => {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        categoryFilterSelect.appendChild(option);
    });

    // Restore selection or default to 'all'
    categoryFilterSelect.value = allCategories.includes(currentSelection) ? currentSelection : 'all';
    // Update state just in case it was reset to 'all'
    state.setCurrentCategoryFilter(categoryFilterSelect.value);
}

// Applies category and search filters to the list items
export function applyCurrentFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const selectedCategory = state.currentCategoryFilter;

    let visibleCount = 0;
    document.querySelectorAll('.place-item').forEach(item => {
        const placeId = item.getAttribute('data-id');
        const place = state.placeData.find(p => p.id === placeId);
        if (!place) {
            item.classList.add('hidden');
            return; // Skip if place data somehow missing
        }

        // Category Filter
        const categoryMatch = selectedCategory === 'all' || (place.category || DEFAULT_CATEGORY) === selectedCategory;

        // Search Filter (checks name, address, memo, category, tags)
        let searchMatch = true;
        if (searchTerm) {
            const placeCategory = place.category || DEFAULT_CATEGORY;
            searchMatch = (place.name && place.name.toLowerCase().includes(searchTerm)) ||
                          (place.address && place.address.toLowerCase().includes(searchTerm)) ||
                          (place.memo && place.memo.toLowerCase().includes(searchTerm)) ||
                          (placeCategory && placeCategory.toLowerCase().includes(searchTerm)) ||
                          (place.tags && place.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        }

        // Show/Hide item
        if (categoryMatch && searchMatch) {
            item.classList.remove('hidden');
            visibleCount++;
        } else {
            item.classList.add('hidden');
        }
    });

    updateDateGroupVisibility(); // Hide date headers if all items within are hidden
    // console.log(`List filtered: Category='${selectedCategory}', Search='${searchTerm}'. Visible items: ${visibleCount}`);
}

// Hides date group headers if no visible items remain within them
function updateDateGroupVisibility() {
    document.querySelectorAll('.date-group-header').forEach(header => {
        const dateKey = header.getAttribute('data-date');
        const contentWrapper = document.querySelector(`.day-items[data-date="${dateKey}"]`);
        if (contentWrapper) {
            // Check if there's any non-hidden place-item inside this group's content wrapper
            const hasVisibleItems = contentWrapper.querySelector('.place-item:not(.hidden)');
            header.classList.toggle('hidden', !hasVisibleItems);
            contentWrapper.classList.toggle('hidden', !hasVisibleItems);
        } else {
             // If content wrapper doesn't exist (e.g., during initial render issues), hide header
             header.classList.add('hidden');
        }
    });
}

// --- Header Updates ---

function updateHeaderTripName() {
    const tripNameElement = document.getElementById('current-trip-name');
    if (tripNameElement) {
        const name = state.travelMetadata.tripName || '無題の旅行';
        tripNameElement.textContent = name;
        tripNameElement.title = `現在の旅行名: ${name}`;
    }
}


// --- Edit Modal UI ---

export function openEditModal(placeId = null, prefillData = null) {
    const modal = document.getElementById('editModal');
    const form = document.getElementById('editForm');
    const modalTitle = document.getElementById('modalTitle');
    if (!modal || !form || !modalTitle) return;

    form.reset(); // Clear form fields
    state.setCurrentTags([]); // Clear tag state for the modal
    document.getElementById('editPlaceId').value = '';
    document.getElementById('editPlaceLat').value = '';
    document.getElementById('editPlaceLng').value = '';

    let currentPlace = null;

    if (placeId) {
        // --- Edit Mode ---
        modalTitle.textContent = '地点情報を編集';
        currentPlace = state.placeData.find(p => p.id === placeId);
        if (!currentPlace) {
            showError(`編集対象の地点が見つかりません: ${placeId}`);
            return;
        }
        document.getElementById('editPlaceId').value = placeId;

        // Populate form from currentPlace data
        document.getElementById('placeName').value = currentPlace.name || '';
        document.getElementById('placeAddress').value = currentPlace.address || ''; // Autocomplete will likely overwrite if used
        document.getElementById('editPlaceLat').value = currentPlace.lat || '';
        document.getElementById('editPlaceLng').value = currentPlace.lng || '';
        document.getElementById('placeDate').value = currentPlace.date || ''; // Assumes YYYY-MM-DD format
        document.getElementById('placeArrivalTime').value = currentPlace.arrivalTime || '';
        document.getElementById('placeDepartureTime').value = currentPlace.departureTime || '';
        document.getElementById('placeTransport').value = currentPlace.transport || DEFAULT_TRANSPORT;
        document.getElementById('placeMemo').value = currentPlace.memo || '';
        document.getElementById('placeCategory').value = currentPlace.category || DEFAULT_CATEGORY;
        state.setCurrentTags(currentPlace.tags || []); // Load existing tags into modal state

        state.setLastUsedDate(currentPlace.date || state.lastUsedDate); // Update last used date

    } else {
        // --- Add Mode ---
        modalTitle.textContent = '新規地点を追加';
        document.getElementById('placeDate').value = state.lastUsedDate; // Pre-fill last used date
        document.getElementById('placeCategory').value = ''; // Reset category dropdown
        document.getElementById('placeTransport').value = DEFAULT_TRANSPORT; // Reset transport

        // If prefill data from header autocomplete exists
        if (prefillData) {
            document.getElementById('placeName').value = prefillData.name || '';
            document.getElementById('placeAddress').value = prefillData.address || '';
            document.getElementById('editPlaceLat').value = prefillData.lat || '';
            document.getElementById('editPlaceLng').value = prefillData.lng || '';
            // Use category guessed from autocomplete if available
            document.getElementById('placeCategory').value = prefillData.category || '';
        } else {
            // Set a default category if no prefill guess
             document.getElementById('placeCategory').value = DEFAULT_CATEGORY;
        }
    }

    renderTagsUI(); // Render tags based on modal state (empty or loaded)
    updateHiddenTagsInput(); // Sync hidden input

    modal.classList.remove('hidden');
    document.getElementById('placeName').focus(); // Focus the name field
}

// Update the visual tag pills in the edit modal
function renderTagsUI() {
    const tagContainer = document.getElementById('tagContainer');
    const tagsInput = document.getElementById('placeTagsInput'); // The actual <input> field
    if (!tagContainer || !tagsInput) return;

    // Clear existing tag pills (spans) before the input field
    tagContainer.querySelectorAll('.tag-pill').forEach(pill => pill.remove());

    // Add pills for current tags in modal state
    state.currentTags.forEach(tag => {
        const pill = document.createElement('span');
        pill.className = 'tag-pill';
        pill.textContent = tag; // Text content of the tag

        const removeBtn = document.createElement('span');
        removeBtn.className = 'tag-remove';
        removeBtn.textContent = '✕'; // Close icon
        removeBtn.setAttribute('role', 'button');
        removeBtn.setAttribute('aria-label', `タグ「${tag}」を削除`);
        removeBtn.title = `タグ「${tag}」を削除`;
        removeBtn.dataset.action = 'remove-tag'; // For event delegation
        removeBtn.dataset.tag = tag;

        pill.appendChild(removeBtn);
        // Insert the pill *before* the input field within the container
        tagContainer.insertBefore(pill, tagsInput);
    });
}

// Update the hidden input value that stores the tags as JSON
function updateHiddenTagsInput() {
    const hiddenInput = document.getElementById('placeTags');
    if (hiddenInput) {
        hiddenInput.value = JSON.stringify(state.currentTags);
    }
}

// --- Trip Settings Modal UI ---

export function openTripSettingsModal() {
    const modal = document.getElementById('tripSettingsModal');
    if (!modal) return;
    // Load current metadata into form
    document.getElementById('tripNameInput').value = state.travelMetadata.tripName || '';
    document.getElementById('tripBudgetInput').value = state.travelMetadata.budget || '';
    document.getElementById('tripNotesInput').value = state.travelMetadata.notes || '';

    // Load time display preference
    const showTime = localStorage.getItem(STORAGE_KEY_SHOW_TIME) !== 'false';
    document.getElementById('toggleTimeDisplay').checked = showTime;

    modal.classList.remove('hidden');
}

// Handles saving trip settings AND time display preference
export function saveTripSettings(event) {
    event.preventDefault(); // Prevent default form submission
    const newName = document.getElementById('tripNameInput').value.trim() || '無題の旅行';
    const newBudget = document.getElementById('tripBudgetInput').value.trim();
    const newNotes = document.getElementById('tripNotesInput').value.trim();

    state.setTravelMetadata({
        tripName: newName,
        budget: newBudget,
        notes: newNotes
    });
    saveMetadata(); // Persist metadata changes

    // Save time display preference
    const showTime = document.getElementById('toggleTimeDisplay').checked;
    localStorage.setItem(STORAGE_KEY_SHOW_TIME, showTime);

    updateHeaderTripName(); // Update header display immediately
    updateTimeVisibility(); // Apply time visibility change

    closeTripSettingsModal();
    showCopyFeedback("旅行設定を保存しました。");
}


// --- UI Updates & Toggles ---

// Toggles visibility of time elements in the list based on saved preference
export function updateTimeVisibility() {
    const showTime = localStorage.getItem(STORAGE_KEY_SHOW_TIME) !== 'false';
    document.querySelectorAll('.schedule-info').forEach(el => {
        el.classList.toggle('hidden', !showTime);
    });
    // Update the checkbox in the settings modal if it exists
    const toggleCheckbox = document.getElementById('toggleTimeDisplay');
     if (toggleCheckbox) {
         toggleCheckbox.checked = showTime;
     }
}


// Updates the style of the marker display mode dropdown
export function updateMarkerModeButtonStyles() {
    const selector = document.getElementById('pinDisplaySelector');
    if (selector) {
        selector.value = state.markerDisplayMode || 'numbered';
    }
}

// Updates the highlight style on the "Show Day Route" buttons in the list
export function updateDayRouteButtonHighlights() {
    document.querySelectorAll('.show-day-route-btn').forEach(btn => {
        const date = btn.getAttribute('data-date');
        const isActive = state.currentlyDisplayedDate === date;
        btn.classList.toggle('active-day-route', isActive);
        btn.classList.toggle('bg-blue-500', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('bg-white', !isActive);
        btn.classList.toggle('text-blue-600', !isActive);
        btn.innerHTML = isActive ? '🗺️ 表示中' : '🗺️ この日のルート表示';
        btn.title = isActive ? '全ルート表示に戻す' : 'この日のルートのみ地図に表示';
    });
}

// Updates the enabled/disabled state and text of the Google Maps transfer button
export function updateGoogleMapTransferButtonState() {
    const btn = document.getElementById('googleMapTransferBtn');
    if (!btn) return;

    const count = state.selectedPlaceIdsForMap.size;
    const maxAllowed = MAX_GOOGLE_MAPS_TRANSFER_PLACES;
    let enabled = (count >= 1 && count <= maxAllowed);
    let reason = "";

    if (enabled) {
        // Check if all selected places have valid coordinates
        for (const id of state.selectedPlaceIdsForMap) {
            const place = state.placeData.find(p => p.id === id);
            if (!place || !isValidCoordinate(place.lat) || !isValidCoordinate(place.lng)) {
                enabled = false;
                reason = "選択された地点の中に座標が無効なものが含まれています。";
                break;
            }
        }
    } else if (count > maxAllowed) {
        reason = `最大${maxAllowed}件まで選択可能です。`;
    } else if (count === 0) {
        reason = "地図で開く地点を1件以上選択してください。";
    }

    btn.disabled = !enabled;
    btn.title = enabled ? `選択中の${count}件をGoogle Mapで開く` : (reason || `選択した地点(1-${maxAllowed}件)をGoogle Mapで開く`);
    // Use textContent for security against XSS if reason contained HTML-like chars
    btn.textContent = enabled ? `📍 ${count}件をMapで開く` : '📍 Google Mapで開く';
}

// Handles collapsing/expanding date groups in the list
export function toggleDateGroupCollapse(headerElement) {
    const dateKey = headerElement.getAttribute('data-date');
    const contentElement = document.querySelector(`.day-items[data-date="${dateKey}"]`);
    const toggleIcon = headerElement.querySelector('.toggle-icon');

    if (!contentElement) return;

    const isCurrentlyCollapsed = contentElement.classList.contains('collapsed');

    if (isCurrentlyCollapsed) {
        // Expand
        contentElement.classList.remove('collapsed');
        headerElement.setAttribute('aria-expanded', 'true');
        if (toggleIcon) toggleIcon.textContent = '▼';
        // Set max-height to scrollHeight for animation, then remove it
        contentElement.style.maxHeight = contentElement.scrollHeight + "px";
        // Use event listener to remove max-height after transition
        const transitionEndHandler = () => {
            // Check again in case it was collapsed quickly
            if (!contentElement.classList.contains('collapsed')) {
                contentElement.style.maxHeight = null; // Use null or 'none'
            }
            contentElement.removeEventListener('transitionend', transitionEndHandler);
        };
        contentElement.addEventListener('transitionend', transitionEndHandler);

    } else {
        // Collapse
        // Set max-height to current scrollHeight first to allow transition FROM it
        contentElement.style.maxHeight = contentElement.scrollHeight + "px";
        // Force reflow before setting to 0
        void contentElement.offsetWidth;
        // Set max-height to 0 to trigger collapse animation
        contentElement.style.maxHeight = '0';
        contentElement.classList.add('collapsed');
        headerElement.setAttribute('aria-expanded', 'false');
        if (toggleIcon) toggleIcon.textContent = '▶';
    }
}