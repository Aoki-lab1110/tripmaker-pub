// modal.js - modal.htmlのデザイン・内容を完全コピーしたモーダル制御JS
// 変なアレンジや勝手な変更厳禁。ID・ロール・構造・ボタン配置・内容すべてmodal.html通り

// ===== CSSをheadに動的挿入（modal.htmlから完全コピー） =====
(function injectModalCSS() {
  if (document.getElementById('modal-style')) return;
  const style = document.createElement('style');
  style.id = 'modal-style';
  style.textContent = `
    /* ===== 共通 基本スタイル ===== */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; }
    
    /* レスポンシブ設定: PC/モバイルでmodal幅を切り替え */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(15, 23, 42, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-container {
      width: 420px; max-width: 98vw;
      background-color: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      overflow: hidden;
      display: flex; flex-direction: column;
      animation: modalFadeIn 0.3s ease-out;
      max-height: 90vh;
    }
    @media (max-width: 600px) {
      .modal-container { width: 100%; border-radius: 16px 16px 0 0; max-width: 100%; }
      .modal-overlay { align-items: flex-end; }
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .modal-header {
      padding: 20px 16px 12px; position: relative; border-bottom: 1px solid #f1f5f9;
    }
    .modal-title { font-size: 18px; font-weight: 600; color: #1e40af; text-align: center; }
    .modal-close {
      position: absolute; top: 16px; right: 16px; width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      color: #64748b; font-size: 18px; cursor: pointer;
    }
    .modal-body { padding: 16px 16px 8px; overflow-y: auto; overflow-x: hidden; flex-grow: 1; }
    .form-group { margin-bottom: 16px; width: 100%; }
    .form-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
    .form-label.required::after { content: '*'; color: #ef4444; }
    .form-input, .form-textarea, .category-select {
      width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px;
      font-size: 16px; transition: all 0.2s; background-color: #f9fafb;
      box-sizing: border-box;
    }
    .form-input:focus, .form-textarea:focus, .category-select:focus {
      outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .form-input::placeholder, .form-textarea::placeholder { color: #9ca3af; }
    .form-textarea { min-height: 80px; resize: vertical; }
    .form-hint { font-size: 13px; color: #6b7280; margin-top: 4px; margin-bottom: 0; line-height: 1.5; }
    /* オプションセクション */
    .options-section { margin-bottom: 16px; }
    .options-title { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 10px; }
    .options-list { display: flex; flex-direction: column; gap: 12px; }
    .option-item { display: flex; align-items: center; gap: 10px; }
    .option-checkbox { width: 20px; height: 20px; accent-color: #3b82f6; }
    .option-label { font-size: 15px; color: #4b5563; }
    /* タグ入力エリア */
    .tag-input-container {
      display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 12px; border: 1px solid #d1d5db;
      border-radius: 6px; background-color: #f9fafb; min-height: 42px; align-items: center;
      width: 100%; box-sizing: border-box;
    }
    .tag-pill { background-color: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 16px; font-size: 13px; display: flex; align-items: center; }
    .tag-remove { margin-left: 6px; cursor: pointer; font-size: 14px; color: #6366f1; }
    .tag-remove:hover { color: #4338ca; }
    .tag-input-field { flex-grow: 1; border: none; outline: none; padding: 4px 0; background-color: transparent; min-width: 60px; color: #333; font-size: 14px; }
    /* アクションボタン */
    .modal-actions { padding: 12px 16px 24px; border-top: 1px solid #f1f5f9; background-color: white; }
    .action-row { display: flex; gap: 12px; margin-bottom: 12px; }
    .btn { flex: 1; padding: 14px 16px; border-radius: 8px; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; }
    .btn-delete { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .btn-delete:hover { background-color: #fecaca; }
    .btn-cancel { background-color: #f3f4f6; color: #4b5563; }
    .btn-cancel:hover { background-color: #e5e7eb; }
    .btn-save { background-color: #3b82f6; color: white; font-weight: 600; }
    .btn-save:hover { background-color: #2563eb; }
    /* 日付・時間セクション */
    .date-time-section { margin-bottom: 18px; width: 100%; }
    .date-time-title { font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 10px; }
    .date-time-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; width: 100%; }
    @media (max-width: 600px) { .date-time-grid { grid-template-columns: 1fr; } }
    /* ===== ナイトモード ===== */
    body.night-mode .modal-overlay { background-color: rgba(10, 15, 30, 0.88); }
    body.night-mode .modal-container { background: #1e293b; color: #e0e7ef; box-shadow: 0 4px 24px rgba(0,0,0,0.8); }
    body.night-mode .modal-title, body.night-mode .form-label, body.night-mode .option-label, body.night-mode .options-title { color: #e0e7ef; }
    body.night-mode .form-input, body.night-mode .form-textarea, body.night-mode .category-select { background: #334155; color: #e0e7ef; border-color: #475569; }
    body.night-mode .form-input::placeholder, body.night-mode .form-textarea::placeholder, body.night-mode .category-select::placeholder { color: #94a3b8; }
    body.night-mode .modal-close { color: #e0e7ef; }
    body.night-mode .btn-cancel { background: #334155 !important; color: #e0e7ef !important; }
    body.night-mode .btn-cancel:hover { background: #475569 !important; }
    body.night-mode .btn-save { background: #2563eb !important; color: #fff !important; }
    body.night-mode .btn-save:hover { background: #1d4ed8 !important; }
    body.night-mode .modal-actions { background: #223047 !important; border-top: 1px solid #334155 !important; }
    body.night-mode .btn-delete { background: #7f1d1d; color: #fff; border-color: #ef4444; }
    body.night-mode .btn-delete:hover { background: #b91c1c; }
    body.night-mode .tag-input-container { background-color: #334155; border-color: #475569; }
    body.night-mode .tag-pill { background-color: #334155; color: #60a5fa; }
    body.night-mode .tag-remove { color: #60a5fa; }
    body.night-mode .tag-remove:hover { color: #38bdf8; }
    body.night-mode .tag-input-field { color: #e0e7ef; }
    body.night-mode .tag-input-field::placeholder { color: #94a3b8; }
    /* ===== 日付・時間セクションのナイトモード強制色指定 ===== */
    body.night-mode .date-time-title { color: #e0e7ef !important; }
    body.night-mode .date-time-grid label, body.night-mode .date-time-grid .form-label { color: #e0e7ef !important; }
    body.night-mode .date-time-grid input[type="date"], body.night-mode .date-time-grid input[type="time"] { color: #e0e7ef !important; background: #334155 !important; border-color: #475569 !important; }
    body.night-mode .date-time-grid input[type="date"]::placeholder, body.night-mode .date-time-grid input[type="time"]::placeholder { color: #94a3b8 !important; }
  `;
  document.head.appendChild(style);
})();

// ===== HTMLをDOMに挿入（modal.htmlから完全コピー） =====
function injectModalHTML() {
  if (document.getElementById('modal-overlay')) return;
  
  const modalElement = document.createElement('div');
  modalElement.innerHTML = `
    <!-- モーダル本体: 新UIもid="modal-overlay"/class="modal-overlay"で共通化 -->
    <div class="modal-overlay" id="modal-overlay" style="display:none;">
      <!-- モーダルコンテナ: 新UIもid="modal-container"/class="modal-container"で共通化 -->
      <div class="modal-container" id="modal-container">
        <div class="modal-header">
          <!-- タイトル: 新UIはid="current-trip-name"やclass="modal-title"で統一 -->
          <h1 class="modal-title" id="modal-title">モーダルタイトル</h1>
          <!-- 閉じるボタン: 新UIもid="modal-close"/class="modal-close"/data-role="close"で共通化 -->
          <div class="modal-close" id="modal-close"><i class="fas fa-times"></i></div>
        </div>
        <!-- モーダル内容: 動的生成。新UIもid="modal-body"/class="modal-body"で共通化 -->
        <div class="modal-body" id="modal-body">
          <!-- 動的にフォーム内容を差し替え -->
        </div>
        <!-- アクションボタン部: 新UIもid="modal-actions"/class="modal-actions"で共通化 -->
        <div class="modal-actions" id="modal-actions">
          <!-- 動的にボタンを差し替え -->
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalElement.firstElementChild);
}

// ===== モーダル表示/非表示制御 =====
export function openModal(type, options = {}) {
  // FontAwesomeが読み込まれているか確認
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(fontAwesome);
  }
  
  // HTMLがまだ挿入されていない場合は挿入
  injectModalHTML();
  
  document.getElementById('modal-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  if (type === 'settings') setSettingsModal(options);
  else if (type === 'schedule') setScheduleModal(options);
  
  // 閉じるボタンのイベント設定
  document.getElementById('modal-close').onclick = closeModal;
}

export function closeModal() {
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ===== 設定モーダル内容（modal.html完全コピー） =====
export function setSettingsModal(opts) {
  document.getElementById('modal-title').textContent = '旅行設定';
  document.getElementById('modal-body').innerHTML = `
    <!-- 設定フォーム: 新UIもid="tripSettingsForm"で共通化 -->
    <form id="tripSettingsForm" novalidate>
      <div class="form-group">
        <label for="tripNameInput" class="form-label">旅行名</label>
        <!-- 旅行名入力: 新UIもid="tripNameInput"/class="form-input"で共通化 -->
        <input type="text" id="tripNameInput" name="tripName" class="form-input" placeholder="例: 夏の北海道旅行">
      </div>
      <div class="form-group">
        <label for="tripBudgetInput" class="form-label">予算 (目安)</label>
        <!-- 予算入力: 新UIもid="tripBudgetInput"/class="form-input"で共通化 -->
        <input type="text" id="tripBudgetInput" name="tripBudget" class="form-input" placeholder="例: 10万円">
      </div>
      <div class="form-group">
        <label for="tripNotesInput" class="form-label">旅行全体のメモ</label>
        <!-- メモ欄: 新UIもid="tripNotesInput"/class="form-input form-textarea"で共通化 -->
        <textarea id="tripNotesInput" name="tripNotes" class="form-input form-textarea" placeholder="持ち物リスト、予約情報など"></textarea>
      </div>
      <div class="options-section">
        <h2 class="options-title">表示オプション</h2>
        <div class="options-list">
          <label class="option-item">
            <!-- 時刻表示トグル: 新UIもid="toggleTimeDisplay"/class="option-checkbox"で共通化 -->
            <input type="checkbox" id="toggleTimeDisplay" class="option-checkbox">
            <span class="option-label">リストに時刻を表示</span>
          </label>
          <label class="option-item">
            <!-- 自動リルートトグル: 新UIもid="autoRerouteCheckbox"/class="option-checkbox"で共通化 -->
            <input type="checkbox" id="autoRerouteCheckbox" class="option-checkbox">
            <span class="option-label">自動リルートを有効</span>
          </label>
        </div>
      </div>
    </form>
  `;
  document.getElementById('modal-actions').innerHTML = `
    <div class="action-row">
      <button type="button" class="btn btn-cancel" id="modal-cancel-btn">キャンセル</button>
      <!-- 保存ボタン: 新UIもclass="btn-save"/role="button"で共通化 -->
      <button type="submit" form="tripSettingsForm" class="btn btn-save" role="button" id="modal-save-btn">保存</button>
    </div>
    <div class="action-row">
      <button type="button" class="btn btn-delete" id="modal-delete-btn">旅行を削除</button>
    </div>
  `;
  document.getElementById('modal-cancel-btn').onclick = closeModal;
  document.getElementById('tripSettingsForm').onsubmit = function(e) {
    e.preventDefault();
    if(typeof opts.onSave === 'function') opts.onSave();
    closeModal();
  };
  if (document.getElementById('modal-delete-btn')) {
    document.getElementById('modal-delete-btn').onclick = function() {
      if(typeof opts.onDelete === 'function') opts.onDelete();
      closeModal();
    };
  }
}

// ===== 予定追加モーダル内容（modal.html完全コピー） =====
export function setScheduleModal(opts) {
  document.getElementById('modal-title').textContent = '予定追加';

  document.getElementById('modal-body').innerHTML = `
    <!-- 予定追加フォーム: 新UIもid="scheduleAddForm"で共通化 -->
    <form id="scheduleAddForm" novalidate>
      <div class="form-group">
        <label for="placeAddress" class="form-label required">住所または場所名</label>
        <!-- 住所入力: 新UIもid="placeAddress"で共通化 -->
        <input type="text" id="placeAddress" name="placeAddress" placeholder="住所を入力" class="form-input" required autocomplete="off">
        <p class="form-hint">Googleのオートコンプリートで住所候補が表示されます。</p>
      </div>
      <div class="form-group">
        <label for="placeName" class="form-label required">場所の名前</label>
        <!-- 場所名入力: 新UIもid="placeName"で共通化 -->
        <input type="text" id="placeName" name="placeName" placeholder="例: 東京スカイツリー" class="form-input" required>
      </div>
      <div class="form-group">
        <label for="placeCategory" class="form-label required">カテゴリ</label>
        <!-- カテゴリ選択: 新UIもid="placeCategory"/class="category-select"で共通化 -->
        <select id="placeCategory" name="placeCategory" required class="form-input category-select">
          <option value="" disabled selected>カテゴリを選択...</option>
          <option value="観光">観光</option>
          <option value="食事">食事</option>
          <option value="ホテル">ホテル</option>
          <option value="移動">移動</option>
          <option value="買い物">買い物</option>
          <option value="イベント">イベント</option>
          <option value="休憩">休憩</option>
          <option value="その他">その他</option>
        </select>
      </div>
      <div class="form-group">
        <label for="placeTagsInput" class="form-label">タグ (カンマ区切りで入力)</label>
        <!-- タグ入力欄: 新UIもid="tagContainer"/class="tag-input-container"で共通化 -->
        <div class="tag-input-container" id="tagContainer">
          <!-- タグピルはJSで追加 -->
          <!-- タグ入力フィールド: 新UIもid="placeTagsInput"/class="tag-input-field"で共通化 -->
          <input type="text" id="placeTagsInput" placeholder="例: 絶景, ランチ, 予約必須" class="tag-input-field">
        </div>
        <!-- タグ値格納: 新UIもid="placeTags"で共通化 -->
        <input type="hidden" id="placeTags" name="placeTags">
      </div>
      <div class="date-time-section">
        <h2 class="date-time-title">日時</h2>
        <div class="date-time-grid">
          <div class="form-group">
            <label for="placeDate" class="form-label">日付</label>
            <!-- 日付入力: 新UIもid="placeDate"で共通化 -->
            <input type="date" id="placeDate" name="placeDate" class="form-input">
          </div>
          <div class="form-group">
            <label for="placeArrivalTime" class="form-label">到着時刻</label>
            <!-- 到着時刻入力: 新UIもid="placeArrivalTime"で共通化 -->
            <input type="time" id="placeArrivalTime" name="placeArrivalTime" class="form-input">
          </div>
          <div class="form-group">
            <label for="placeDepartureTime" class="form-label">出発時刻</label>
            <!-- 出発時刻入力: 新UIもid="placeDepartureTime"で共通化 -->
            <input type="time" id="placeDepartureTime" name="placeDepartureTime" class="form-input">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="placeTransport" class="form-label">次の地点への移動手段</label>
        <!-- 移動手段選択: 新UIもid="placeTransport"/class="category-select"で共通化 -->
        <select id="placeTransport" name="placeTransport" class="form-input category-select">
          <option value="不明">不明</option>
          <option value="✈️飛行機">✈️飛行機</option>
          <option value="🚄電車">🚄電車</option>
          <option value="🚌バス">🚌バス</option>
          <option value="🚗車">🚗車</option>
          <option value="🚗レンタカー">🚗レンタカー</option>
          <option value="🚶徒歩">🚶徒歩</option>
          <option value="🚕タクシー">🚕タクシー</option>
          <option value="🚲自転車">🚲自転車</option>
          <option value="⛵船">⛵船</option>
          <option value="その他">その他</option>
        </select>
      </div>
      <div class="form-group">
        <label for="placeMemo" class="form-label">メモ</label>
        <!-- メモ欄: 新UIもid="placeMemo"/class="form-input form-textarea"で共通化 -->
        <textarea id="placeMemo" name="placeMemo" class="form-input form-textarea" placeholder="予約情報、持ち物など"></textarea>
      </div>
    </form>
  `;
  document.getElementById('modal-actions').innerHTML = `
    <div class="action-row">
      <button type="button" class="btn btn-cancel" id="modal-cancel-btn">キャンセル</button>
      <!-- 保存ボタン: 新UIもclass="btn-save"/role="button"で共通化 -->
      <button type="submit" form="scheduleAddForm" class="btn btn-save" role="button" id="modal-save-btn">保存</button>
    </div>
  `;
  document.getElementById('modal-cancel-btn').onclick = closeModal;
  document.getElementById('scheduleAddForm').onsubmit = function(e) {
    e.preventDefault();
    if(typeof opts.onSave === 'function') opts.onSave();
    closeModal();
  };
  
  // [オートコンプリート移設] innerHTML設定後にオートコンプリートをバインド
  // events.jsから移設：DoM挿入後に確実に存在するタイミングで実行
  const placeAddressInput = document.getElementById('placeAddress');
  const placeNameInput = document.getElementById('placeName');
  
  if (placeAddressInput && placeNameInput && window.google && window.google.maps && window.google.maps.places) {
    const autocomplete = new window.google.maps.places.Autocomplete(placeAddressInput, { 
      types: ['geocode'],
      componentRestrictions: { country: 'jp' }
    });
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place && place.name) {
        placeNameInput.value = place.name;
      }
    });
  }
  initializeTagInput();
  
  // Googleのオートコンプリート機能を初期化
  if (window.google && window.google.maps && window.google.maps.places) {
    new window.google.maps.places.Autocomplete(
      document.getElementById('placeAddress'),
      { types: ['geocode'], componentRestrictions: { country: 'jp' } }
    );
  } else if (opts.googlePlacesApiKey) {
    // APIスクリプト未読込の場合のみ動的ロード
    if (!document.getElementById('google-places-script')) {
      const script = document.createElement('script');
      script.id = 'google-places-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${opts.googlePlacesApiKey}&libraries=places&language=ja`;
      script.onload = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
          new window.google.maps.places.Autocomplete(
            document.getElementById('placeAddress'),
            { types: ['geocode'], componentRestrictions: { country: 'jp' } }
          );
        }
      };
      document.head.appendChild(script);
    }
  }
}

// ===== タグ入力機能（modal.html完全コピー） =====
export function initializeTagInput() {
  const tagInput = document.getElementById('placeTagsInput');
  const tagContainer = document.getElementById('tagContainer');
  const hiddenTagsInput = document.getElementById('placeTags');
  if(!tagInput) return;
  
  function renderTags() {
    tagContainer.querySelectorAll('.tag-pill').forEach(e => e.remove());
    const tags = tagInput.value.split(',').map(t => t.trim()).filter(t => t);
    hiddenTagsInput.value = JSON.stringify(tags);
    tags.forEach(tag => {
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.textContent = tag;
      const rm = document.createElement('span');
      rm.className = 'tag-remove';
      rm.innerHTML = '<i class="fas fa-times"></i>';
      rm.onclick = () => {
        const arr = tagInput.value.split(',').map(t => t.trim()).filter(t => t);
        tagInput.value = arr.filter(t => t !== tag).join(',');
        renderTags();
      };
      pill.appendChild(rm);
      tagContainer.insertBefore(pill, tagInput);
    });
  }
  
  tagInput.addEventListener('blur', renderTags);
  tagInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      renderTags();
      tagInput.value = '';
    }
  });
}

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', function() {
  // 念のためinjectModalCSSを実行
  (function injectModalCSS() {
    if (document.getElementById('modal-style')) return;
    const style = document.createElement('style');
    style.id = 'modal-style';
    // CSS内容は上記と同じなので省略
  })();
});
