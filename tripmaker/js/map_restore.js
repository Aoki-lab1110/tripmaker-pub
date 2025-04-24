// Polyline復元用ユーティリティ
import * as state from './state.js';
import { drawSinglePolyline } from './map.js';

/**
 * placeDataのrouteInfo.geometryからdailyPolylinesを再生成する
 * - state.dailyPolylinesが消去された場合や初期化時に呼ぶ
 */
import { normalizeDate } from './utils.js';

export function restorePolylinesFromPlaceData() {
  state.clearPolylinesFromState();
  state.placeData.forEach((place, idx) => {
    if (place.routeInfo?.geometry && Array.isArray(place.routeInfo.geometry) && place.routeInfo.geometry.length > 0) {
      const routeDate = normalizeDate(place.date) || '日付なし';
      const polyline = drawSinglePolyline(place.routeInfo.geometry, place.transport || '');
      if (polyline) {
        state.addPolyline(routeDate, polyline);
      }
    }
  });
}

