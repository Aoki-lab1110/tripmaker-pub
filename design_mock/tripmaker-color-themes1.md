# Tripmaker Lab カラーテーマサンプル

## 目次
1. [現行テーマ：クラシックブルー](#現行テーマクラシックブルー)
2. [モダンダークテーマ](#モダンダークテーマ)
3. [ネイチャーテーマ](#ネイチャーテーマ)
4. [オーシャンテーマ](#オーシャンテーマ)
5. [サンセットテーマ](#サンセットテーマ)
6. [ミニマリストテーマ](#ミニマリストテーマ)

---

## 現行テーマ：クラシックブルー

### メインカラー
- **プライマリ**: #1e3a8a (深いブルー)
- **セカンダリ**: #3b82f6 (ブルー)
- **アクセント**: #ffd700 (ゴールド)

### 曜日別カラー（公式）
| 曜日 | 背景色 | テキスト色 | ボーダー色 |
|------|--------|------------|------------|
| 日(0) | #fef2f2 | #b91c1c | #fecaca |
| 月(1) | #f0fdf4 | #15803d | #bbf7d0 |
| 火(2) | #f0fdfa | #0f766e | #99f6e4 |
| 水(3) | #eff6ff | #1d4ed8 | #bfdbfe |
| 木(4) | #f5f3ff | #6d28d9 | #ddd6fe |
| 金(5) | #faf5ff | #7e22ce | #e9d5ff |
| 土(6) | #fdf2f8 | #be185d | #fbcfe8 |

### UI要素カラー
- **背景**: #f5f7fa (薄いグレー)
- **カード背景**: #ffffff (白)
- **テキスト主要**: #333333 (濃いグレー)
- **テキスト補助**: #64748b (中間グレー)

### カラーサンプル

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
  <div style="width: 100px; height: 100px; background-color: #1e3a8a; color: white; display: flex; align-items: center; justify-content: center; border-radius: 8px;">プライマリ</div>
  <div style="width: 100px; height: 100px; background-color: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; border-radius: 8px;">セカンダリ</div>
  <div style="width: 100px; height: 100px; background-color: #ffd700; color: black; display: flex; align-items: center; justify-content: center; border-radius: 8px;">アクセント</div>
</div>

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
  <div style="width: 80px; height: 80px; background-color: #fef2f2; color: #b91c1c; border: 2px solid #fecaca; display: flex; align-items: center; justify-content: center; border-radius: 8px;">日</div>
  <div style="width: 80px; height: 80px; background-color: #f0fdf4; color: #15803d; border: 2px solid #bbf7d0; display: flex; align-items: center; justify-content: center; border-radius: 8px;">月</div>
  <div style="width: 80px; height: 80px; background-color: #f0fdfa; color: #0f766e; border: 2px solid #99f6e4; display: flex; align-items: center; justify-content: center; border-radius: 8px;">火</div>
  <div style="width: 80px; height: 80px; background-color: #eff6ff; color: #1d4ed8; border: 2px solid #bfdbfe; display: flex; align-items: center; justify-content: center; border-radius: 8px;">水</div>
  <div style="width: 80px; height: 80px; background-color: #f5f3ff; color: #6d28d9; border: 2px solid #ddd6fe; display: flex; align-items: center; justify-content: center; border-radius: 8px;">木</div>
  <div style="width: 80px; height: 80px; background-color: #faf5ff; color: #7e22ce; border: 2px solid #e9d5ff; display: flex; align-items: center; justify-content: center; border-radius: 8px;">金</div>
  <div style="width: 80px; height: 80px; background-color: #fdf2f8; color: #be185d; border: 2px solid #fbcfe8; display: flex; align-items: center; justify-content: center; border-radius: 8px;">土</div>
</div>

```css
:root {
  --color-primary: #1e3a8a;
  --color-secondary: #3b82f6;
  --color-accent: #ffd700;
  
  /* 曜日カラー */
  --color-sun-bg: #fef2f2;
  --color-sun-text: #b91c1c;
  --color-sun-border: #fecaca;
  
  --color-mon-bg: #f0fdf4;
  --color-mon-text: #15803d;
  --color-mon-border: #bbf7d0;
  
  --color-tue-bg: #f0fdfa;
  --color-tue-text: #0f766e;
  --color-tue-border: #99f6e4;
  
  --color-wed-bg: #eff6ff;
  --color-wed-text: #1d4ed8;
  --color-wed-border: #bfdbfe;
  
  --color-thu-bg: #f5f3ff;
  --color-thu-text: #6d28d9;
  --color-thu-border: #ddd6fe;
  
  --color-fri-bg: #faf5ff;
  --color-fri-text: #7e22ce;
  --color-fri-border: #e9d5ff;
  
  --color-sat-bg: #fdf2f8;
  --color-sat-text: #be185d;
  --color-sat-border: #fbcfe8;
  
  --color-background: #f5f7fa;
  --color-card: #ffffff;
  --color-text-primary: #333333;
  --color-text-secondary: #64748b;
}
```



## 利用方法

これらのカラーテーマは、CSSカスタムプロパティ（変数）として実装できます。実装時には以下の点に注意してください：

1. **アクセシビリティ**: すべてのテーマでテキストと背景のコントラスト比がWCAG AAレベル（4.5:1以上）を満たすようにしてください

2. **Tailwind対応**: 下記のようにTailwindのクラス名でも実装可能です

```javascript
// Tailwind CSS での曜日クラス実装例
const dayClassMap = {
  0: { // 日曜日
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  1: { // 月曜日
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  // 以下同様
};

// 日付から曜日クラスを取得する関数
function getDayClasses(date) {
  const day = date.getDay(); // 0-6 (日-土)
  return dayClassMap[day];
}
```

