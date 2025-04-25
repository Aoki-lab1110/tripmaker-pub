// tripmaker/js/ui-render.js
// 地点リストをJSONデータから描画する専用モジュール
import * as state from './state.js';
import { DEFAULT_CATEGORY } from '../config.js';

/**
 * JSON配列データから地点リストを描画する
 * @param {Array} places - [{title, category, address, date, ...}]
 */
export function renderPlaceList(places) {
    const container = document.querySelector('.tm-list-content');
    if (!container) return;
    if (!Array.isArray(places) || places.length === 0) {
        container.innerHTML = '<div class="text-gray-500 p-4 text-center">地点データがありません。</div>';
        return;
    }
    container.innerHTML = '';
    places.forEach(place => {
        const card = document.createElement('div');
        card.className = 'tm-place-card mb-4';
        card.innerHTML = `
            <div class="tm-card-title text-lg font-bold mb-1">${place.title || ''}</div>
            <span class="tm-card-badge inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs mr-2">${place.category || DEFAULT_CATEGORY}</span>
            <span class="text-xs text-gray-600">${place.date || ''}</span>
            <div class="text-sm text-gray-700 mt-1">${place.address || ''}</div>
        `;
        container.appendChild(card);
    });
}
