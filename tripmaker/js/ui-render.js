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
  const item = document.createElement("div");
  item.className = `place-item group-${place.category || 'default'}`;
  item.innerHTML = `
    <div class="place-top">
      <div class="place-checkbox-container">
        <input type="checkbox" class="place-checkbox" data-index="${index}">
        <div class="place-title">
          <span class="place-number">${index + 1}.</span> ${place.title || '無題'}
        </div>
      </div>
      <div class="place-actions">
        <i class="fas fa-pen place-action-icon" data-index="${index}"></i>
        <i class="fas fa-trash place-action-icon" data-index="${index}"></i>
      </div>
    </div>
    <div class="place-info">
      <div class="place-address">
        <i class="fas fa-map-marker-alt address-pin"></i>
        <div class="address-text">${place.address || ''}</div>
      </div>
      <div class="place-meta">
        <div class="meta-item primary">
          <i class="fas fa-tag"></i>
          <span>${place.category || '未分類'}</span>
        </div>
        ${place.date ? `<div class="meta-item time"><i class="far fa-clock"></i><span>${place.date}</span></div>` : ''}
      </div>
    </div>
  `;
  container.appendChild(item);
});

// 編集・削除アイコンのイベント
container.querySelectorAll('.fa-pen.place-action-icon').forEach(btn => {
  btn.addEventListener('click', e => {
    const idx = e.target.dataset.index;
    alert(`編集: ${places[idx].title}`);
  });
});
container.querySelectorAll('.fa-trash.place-action-icon').forEach(btn => {
  btn.addEventListener('click', e => {
    const idx = e.target.dataset.index;
    alert(`削除: ${places[idx].title}`);
  });
});
}
