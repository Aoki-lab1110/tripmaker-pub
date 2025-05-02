// debug.js - デバッグウィンドウ機能

// デバッグウィンドウのHTML要素を作成
function createDebugWindow() {
  // すでに存在する場合は何もしない
  if (document.getElementById('debug-window')) {
    return;
  }

  // メインコンテナの作成
  const debugWindow = document.createElement('div');
  debugWindow.id = 'debug-window';
  debugWindow.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    max-height: 500px;
    background-color: rgba(0, 0, 0, 0.85);
    color: #00ff00;
    border: 1px solid #00ff00;
    border-radius: 5px;
    font-family: monospace;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
    overflow: hidden;
  `;

  // ヘッダー部分
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background-color: rgba(0, 50, 0, 0.9);
    border-bottom: 1px solid #00ff00;
    cursor: move;
  `;
  
  // タイトル
  const title = document.createElement('div');
  title.textContent = 'デバッグコンソール';
  title.style.fontWeight = 'bold';
  
  // ボタンコンテナ
  const buttonContainer = document.createElement('div');
  
  // コピーボタン
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'コピー';
  copyBtn.style.cssText = `
    background-color: #004400;
    color: #00ff00;
    border: 1px solid #00ff00;
    border-radius: 3px;
    margin-right: 5px;
    cursor: pointer;
    font-size: 12px;
    padding: 2px 8px;
  `;
  
  // クリアボタン
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'クリア';
  clearBtn.style.cssText = `
    background-color: #440000;
    color: #00ff00;
    border: 1px solid #00ff00;
    border-radius: 3px;
    margin-right: 5px;
    cursor: pointer;
    font-size: 12px;
    padding: 2px 8px;
  `;
  
  // 閉じるボタン
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    background-color: #440000;
    color: #00ff00;
    border: 1px solid #00ff00;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
    padding: 2px 8px;
  `;
  
  // コンテンツ領域
  const content = document.createElement('div');
  content.id = 'debug-content';
  content.style.cssText = `
    padding: 10px;
    overflow-y: auto;
    flex-grow: 1;
    white-space: pre-wrap;
    font-size: 12px;
    max-height: 400px;
  `;
  
  // ドラッグ機能のための変数
  let isDragging = false;
  let offsetX, offsetY;
  
  // イベントリスナーの設定
  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - debugWindow.getBoundingClientRect().left;
    offsetY = e.clientY - debugWindow.getBoundingClientRect().top;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      debugWindow.style.left = (e.clientX - offsetX) + 'px';
      debugWindow.style.top = (e.clientY - offsetY) + 'px';
      // 右下固定位置を解除
      debugWindow.style.right = 'auto';
      debugWindow.style.bottom = 'auto';
    }
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  // ボタンのイベントリスナー
  copyBtn.addEventListener('click', () => {
    const content = document.getElementById('debug-content');
    if (content) {
      navigator.clipboard.writeText(content.textContent)
        .then(() => {
          showNotification('コピーしました');
        })
        .catch(err => {
          console.error('コピーに失敗しました:', err);
        });
    }
  });
  
  clearBtn.addEventListener('click', () => {
    const content = document.getElementById('debug-content');
    if (content) {
      content.textContent = '';
      showNotification('クリアしました');
    }
  });
  
  closeBtn.addEventListener('click', () => {
    hideDebugWindow();
  });
  
  // 要素の組み立て
  buttonContainer.appendChild(copyBtn);
  buttonContainer.appendChild(clearBtn);
  buttonContainer.appendChild(closeBtn);
  header.appendChild(title);
  header.appendChild(buttonContainer);
  debugWindow.appendChild(header);
  debugWindow.appendChild(content);
  document.body.appendChild(debugWindow);
  
  return debugWindow;
}

// 通知メッセージを表示
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    padding: 10px 20px;
    border-radius: 5px;
    font-family: monospace;
    z-index: 10001;
    border: 1px solid #00ff00;
  `;
  
  document.body.appendChild(notification);
  
  // 2秒後に消える
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 2000);
}

// デバッグウィンドウにログを表示
function debugLog(...args) {
  const debugWindow = document.getElementById('debug-window') || createDebugWindow();
  const content = document.getElementById('debug-content');
  
  if (content) {
    const timestamp = new Date().toLocaleTimeString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    const logEntry = document.createElement('div');
    logEntry.innerHTML = `<span style="color: #888;">[${timestamp}]</span> ${message}`;
    content.appendChild(logEntry);
    
    // 自動スクロール
    content.scrollTop = content.scrollHeight;
  }
}

// デバッグウィンドウの表示状態を切り替え
function toggleDebugWindow() {
  const debugWindow = document.getElementById('debug-window');
  
  if (debugWindow) {
    if (debugWindow.style.display === 'none' || debugWindow.style.display === '') {
      debugWindow.style.display = 'flex';
    } else {
      debugWindow.style.display = 'none';
    }
  } else {
    createDebugWindow();
  }
}

// デバッグウィンドウを隠す
function hideDebugWindow() {
  const debugWindow = document.getElementById('debug-window');
  if (debugWindow) {
    debugWindow.style.display = 'none';
  }
}

// デバッグウィンドウを表示
function showDebugWindow() {
  const debugWindow = document.getElementById('debug-window') || createDebugWindow();
  debugWindow.style.display = 'flex';
}

// オブジェクトのプロパティを詳細にログ
function debugObject(obj, label = '') {
  let prefix = label ? `${label}: ` : '';
  try {
    debugLog(`${prefix}${JSON.stringify(obj, null, 2)}`);
  } catch (e) {
    debugLog(`${prefix}[表示できないオブジェクト]`, String(obj));
  }
}

// デバッグトグルボタンを作成
function createDebugToggleButton() {
  // すでに存在する場合は何もしない
  if (document.getElementById('debug-toggle-button')) {
    return;
  }
  
  const button = document.createElement('button');
  button.id = 'debug-toggle-button';
  button.textContent = 'デバッグ';
  button.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background-color: rgba(0, 50, 0, 0.8);
    color: #00ff00;
    border: 1px solid #00ff00;
    border-radius: 5px;
    padding: 5px 10px;
    font-family: monospace;
    z-index: 9999;
    cursor: pointer;
  `;
  
  button.addEventListener('click', toggleDebugWindow);
  document.body.appendChild(button);
  
  return button;
}

// スクリプト初期化
function initDebugTools() {
  // DOM準備が完了してから実行
  if (document.readyState === 'complete') {
    setupDebugFeatures();
  } else {
    window.addEventListener('load', setupDebugFeatures);
  }

  // コンソールオーバーライド処理（元の実装を保持）
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.log = function(...args) {
    originalConsoleLog.apply(console, args);
    debugLog(...args);
  };

  console.error = function(...args) {
    originalConsoleError.apply(console, args);
    const errorArgs = args.map(arg => `<span style="color: #ff0000;">${arg}</span>`);
    debugLog(...errorArgs);
  };

  console.warn = function(...args) {
    originalConsoleWarn.apply(console, args);
    const warnArgs = args.map(arg => `<span style="color: #ffff00;">${arg}</span>`);
    debugLog(...warnArgs);
  };

  // エラーハンドリング
  window.addEventListener('error', function(event) {
    debugLog(`<span style="color: #ff0000;">未キャッチエラー: ${event.message}</span> at ${event.filename}:${event.lineno}:${event.colno}`);
  });

  window.addEventListener('unhandledrejection', function(event) {
    debugLog(`<span style="color: #ff0000;">未処理のPromise拒否: ${event.reason}</span>`);
  });
}

// デバッグUI要素のセットアップ
function setupDebugFeatures() {
  console.log('デバッグツールを初期化しています...');
  try {
    createDebugToggleButton();
    console.log('デバッグボタンを生成しました');
  } catch (e) {
    console.error('デバッグツールの初期化に失敗しました:', e);
  }
}

// 公開API
export {
  debugLog,
  debugObject,
  showDebugWindow,
  hideDebugWindow,
  toggleDebugWindow,
  initDebugTools
};

// アプリケーション起動時にデバッグツールを初期化
document.addEventListener('DOMContentLoaded', initDebugTools);
