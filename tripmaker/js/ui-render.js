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
    places.forEach((place, index) => {
    const card = document.createElement("div");
    card.className = `tm-place-card group-${place.category || 'default'}`;
    card.innerHTML = `
      <div class="tm-card-header">
        <div class="tm-card-title">
          ${place.title || '無題'}
          <span class="tm-card-badge">${place.category || '未分類'}</span>
        </div>
      </div>
      <div class="tm-card-body">
        <div class="tm-card-meta">${place.date || ''} ${place.address || ''}</div>
        <div class="tm-card-actions">
          <input type="checkbox" class="place-checkbox" data-index="${index}">
          <button class="tm-edit-btn" data-index="${index}">編集</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // 編集ボタンのイベント
  document.querySelectorAll('.tm-edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = e.target.dataset.index;
      alert(`編集: ${places[idx].title}`);
    });
  });
}
