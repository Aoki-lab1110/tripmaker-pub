// nightmode.js
// ナイトモードの初期化・切り替え専用モジュール（PC/モバイル共通）

export function initializeNightMode() {
    const nightBtn = document.getElementById('toggle-nightmode');
    const moonIcon = document.getElementById('theme-icon');
    if (!nightBtn || !moonIcon) return;

    // 既存リスナーを一度解除（イベント重複防止）
    nightBtn.replaceWith(nightBtn.cloneNode(true));
    const newNightBtn = document.getElementById('toggle-nightmode');

    // 初期状態（localStorageによる復元）
    const isNight = localStorage.getItem('night-mode') === 'on';
    if (isNight) {
        document.body.classList.add('night-mode');
        moonIcon.classList.remove('fa-moon');
        moonIcon.classList.add('fa-sun');
        if (window.setMapNightMode) setMapNightMode(true);
    } else {
        document.body.classList.remove('night-mode');
        moonIcon.classList.remove('fa-sun');
        moonIcon.classList.add('fa-moon');
        if (window.setMapNightMode) setMapNightMode(false);
    }

    newNightBtn.addEventListener('click', function() {
        const isNight = document.body.classList.toggle('night-mode');
        if (isNight) {
            moonIcon.classList.remove('fa-moon');
            moonIcon.classList.add('fa-sun');
            localStorage.setItem('night-mode', 'on');
            if (window.setMapNightMode) setMapNightMode(true);
        } else {
            moonIcon.classList.remove('fa-sun');
            moonIcon.classList.add('fa-moon');
            localStorage.setItem('night-mode', 'off');
            if (window.setMapNightMode) setMapNightMode(false);
        }
    });
}

