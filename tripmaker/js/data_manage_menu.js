// data_manage_menu.js
// カスタムデータ管理メニュー（セレクト形式の簡易UI）

export function showDataManageMenu(onSelect, anchorBtn) {
  // 既存メニューがあれば削除
  const oldMenu = document.getElementById('data-manage-menu');
  if (oldMenu) oldMenu.remove();

  if (!anchorBtn) {
    anchorBtn = document.getElementById('data-manage-btn');
  }
  if (!anchorBtn) return;

  // メニューのラッパー（ドロップダウン風）
  const menu = document.createElement('div');
  menu.id = 'data-manage-menu';
  menu.style.position = 'absolute';
  menu.style.zIndex = 9999;
  menu.style.background = '#fff';
  menu.style.border = '1px solid #888';
  menu.style.borderRadius = '8px';
  menu.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)';
  menu.style.padding = '8px 0 4px 0';
  menu.style.minWidth = '200px';
  menu.style.textAlign = 'left';

  // ボタンリスト
  const actions = [
    { label: 'JSON/GeoJSONインポート', value: 'import-json' },
    { label: 'CSVインポート', value: 'import-csv' },
    { label: 'JSONエクスポート', value: 'export-json' },
    { label: 'GeoJSONエクスポート', value: 'export-geojson' },
  ];
  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.textContent = action.label;
    btn.style.display = 'block';
    btn.style.width = '100%';
    btn.style.padding = '10px 16px';
    btn.style.fontSize = '15px';
    btn.style.border = 'none';
    btn.style.borderRadius = '0';
    btn.style.background = 'none';
    btn.style.color = '#333';
    btn.style.textAlign = 'left';
    btn.style.cursor = 'pointer';
    btn.onmouseenter = () => btn.style.background = '#f3f4f6';
    btn.onmouseleave = () => btn.style.background = 'none';
    btn.onclick = () => {
      menu.remove();
      if (onSelect) onSelect(action.value);
    };
    menu.appendChild(btn);
  });

  // キャンセルボタン
  const cancel = document.createElement('button');
  cancel.textContent = 'キャンセル';
  cancel.style.display = 'block';
  cancel.style.width = '100%';
  cancel.style.padding = '10px 16px';
  cancel.style.fontSize = '15px';
  cancel.style.border = 'none';
  cancel.style.borderRadius = '0 0 8px 8px';
  cancel.style.background = '#e5e7eb';
  cancel.style.color = '#333';
  cancel.style.textAlign = 'left';
  cancel.style.cursor = 'pointer';
  cancel.onclick = () => menu.remove();
  menu.appendChild(cancel);

  // ボタン直下に配置
  const rect = anchorBtn.getBoundingClientRect();
  menu.style.left = rect.left + 'px';
  menu.style.top = (rect.bottom + window.scrollY) + 'px';

  document.body.appendChild(menu);
  // 外をクリックしたら閉じる
  setTimeout(() => {
    function handleClick(e) {
      if (!menu.contains(e.target) && e.target !== anchorBtn) {
        menu.remove();
        document.removeEventListener('mousedown', handleClick);
      }
    }
    document.addEventListener('mousedown', handleClick);
  }, 10);
}

