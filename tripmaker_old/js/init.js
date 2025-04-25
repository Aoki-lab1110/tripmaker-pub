// tripmaker/js/init.js
import { GOOGLE_MAPS_API_KEY } from '../config.js'; // パス修正: 1つ上のディレクトリからconfig.jsをインポート
import * as state from './state.js';
import { loadAndInitializeData } from './data.js';
import { initializeMap } from './map.js';
import { renderUI } from './ui.js';
import { restorePolylinesFromPlaceData } from './map_restore.js';
import { setupEventListeners, exposeGlobalFunctions, setupNewModalEventListeners } from './events.js';
import { setRouteDirty } from './route.js'; // Needed for URL import

console.log("Tripmaker Lab Initializing...");

// Main initialization function, called when DOM is ready
async function main() {
    console.log("DOM Content Loaded. Starting main initialization.");

    // 1. Load data from LocalStorage first
    loadAndInitializeData(); // Loads placeData, metadata, settings

    // 2. Initialize Google Maps API and map components
    const mapReady = await initializeMap(); // Handles API loading and map creation

    // 3. Setup core event listeners for UI interactions
    setupEventListeners();
    setupNewModalEventListeners(); // 新規モーダル用リスナー（今後拡張用）も必ず初期化

    // 4. Expose functions needed by dynamically created HTML (InfoWindow)
    exposeGlobalFunctions();

    // 5. Check for data import from URL parameters AFTER map might be ready
    // importFromUrlは未実装のため、ここはスキップします。
    // 必要であれば実装・修正してください。

    // 6. Polyline復元（APIを叩かず保存済みデータのみで描画）
    restorePolylinesFromPlaceData();
    // 7. Initial UI Render
    // Render the UI with loaded data.
    // If map is ready, rendering includes markers.
    // If map is ready AND routes are dirty (e.g., from URL import), trigger recalc & fit.
    if (mapReady) {
        renderUI(state.isRouteDirty, state.isRouteDirty); // Calculate routes & fit map if dirty
    } else {
        // Map failed to initialize, render only list/basic UI
        renderUI(false, false);
        console.error("Map initialization failed. Rendering basic UI only.");
    }

    console.log("Tripmaker Initialization Sequence Complete.");
}

// --- Initialize ---
// Use DOMContentLoaded to ensure HTML is parsed before running scripts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    // DOMContentLoaded has already fired
    main();
}

// Load LZ-String library (assuming it's in the HTML via <script>)
// If using modules/npm, you'd import it. Check if it exists.
if (typeof LZString === 'undefined') {
    console.warn("LZ-String library not found. URL sharing will not work.");
    // Optionally disable the share button
    const shareButton = document.getElementById('generateShareUrl');
    if (shareButton) {
        shareButton.disabled = true;
        shareButton.title = "共有機能に必要なライブラリが見つかりません。";
    }
}