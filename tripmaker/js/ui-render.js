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
        const category = place.category || DEFAULT_CATEGORY;
        const groupClass = `group-${category}`;
        const card = document.createElement('div');
        card.className = `tm-place-card ${groupClass}`;
        card.innerHTML = `
            <div class="tm-card-header">
                <div class="tm-card-title">${place.title || ''}</div>
                <div class="tm-card-badge">${category}</div>
            </div>
            <div class="tm-card-body">
                <div class="tm-card-meta">${[place.date, place.address].filter(Boolean).join(' / ')}</div>
                <div class="tm-card-actions">
                    <input type="checkbox" class="place-checkbox" />
                    <button class="tm-edit-btn">編集</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}
