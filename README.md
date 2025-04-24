
# Tripmaker 開発ログ

tripmaker/
├── index.html
├── config.js                  ← APIキーなど
├── js/
│   ├── init.js                ← 初期化とロード処理
│   ├── ui-render.js           ← HTML描画・更新処理
│   ├── maps.js                ← Google Maps操作
│   ├── data.js                ← ローカル保存・取得
│   ├── events.js              ← イベントハンドリング
│   └── route.js               ← ルート系ロジック
└── css/
    └── tripmaker.css

##  2025-04-23

### ✅ 実施内容
- ローカルGit初期化＆`.gitignore`設定
- GitHub Desktopと連携完了（リポジトリ名：tripmaker-dev）
- `tripmaker-public` を `pub/` に作成（後で分割してコピー用に）

### 🧠 メモ
- `.gitignore`には  と `config.js` を入れてある
- README.mdをCursorのログ＆命令記録に使う方針に変更