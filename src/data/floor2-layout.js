// 二樓空間資料：px 為「圖書館空間配置圖2F.PNG」(2000×1125) 中量得的像素範圍 [左, 上, 右, 下]
const SHELF_PX = [
  [232, 148, 356, 484], [389, 148, 512, 484], [546, 148, 669, 484], [703, 148, 826, 484], [860, 148, 983, 484],
  [1017, 148, 1140, 484], [1174, 148, 1297, 484], [1331, 148, 1454, 484], [1488, 148, 1611, 484], [1644, 148, 1768, 484],
];

export const SHELF_COUNT = SHELF_PX.length;

// 示範用分類（依中國圖書分類法大類，非現場實際排架）
const SHELF_CLASSES = [
  '000 總類', '100 哲學類', '200 宗教類', '300 科學類', '400 應用科學類',
  '500 社會科學類', '600-700 史地類', '800 語文類', '900 藝術類', '漫畫・過期期刊',
];

export const FLOOR2_WALL_GAPS = [];

// 二樓樓板開口（樓梯井），與一樓樓梯第二段梯段對齊
export const FLOOR2_STAIR_OPENING = [1712, 985, 1837, 1102];

export const FLOOR2_ZONES = [
  {
    id: 'f2-seats-north', name: '閱讀座位（北側）', category: 'reading', kind: 'tables', px: [190, 25, 1812, 82],
    description: '二樓最北側、橫向延伸的閱讀座位區。', interactionType: 'info', quizIds: [], keywords: ['閱讀', '座位'],
  },
  {
    id: 'f2-stacks', name: '二樓書庫', category: 'collection', kind: 'carpet', px: [188, 121, 1813, 510],
    description: '二樓書庫共 10 排書架，借書請至二樓書庫找書／取書，再至一樓櫃台完成借書程序。過期雜誌亦移置於此供外借。',
    interactionType: 'shelf', quizIds: ['qz-borrow-flow'], keywords: ['書庫', '書架', '找書', '借書'],
  },
  ...SHELF_PX.map((px, i) => ({
    id: `f2-shelf-${String(i + 1).padStart(2, '0')}`,
    name: `書架 ${i + 1}`,
    category: 'collection',
    kind: 'bookshelf',
    px,
    description: `二樓書庫第 ${i + 1} 排書架（由西向東編號）。示範分類：${SHELF_CLASSES[i]}。`,
    interactionType: 'shelf',
    quizIds: [],
    keywords: ['書架', '書庫', SHELF_CLASSES[i]],
    options: { index: i + 1, className: SHELF_CLASSES[i] },
  })),
  {
    id: 'f2-discussion-w', name: '討論室（西）', category: 'room', kind: 'room', px: [26, 25, 126, 197],
    description: '二樓西北角討論室。', interactionType: 'info', quizIds: [], keywords: ['討論'],
    options: { doors: [{ side: 'south', from: 50, to: 100 }], furniture: 'smallDiscussion' },
  },
  {
    id: 'f2-discussion-e', name: '討論室（東）', category: 'room', kind: 'room', px: [1869, 25, 1970, 197],
    description: '二樓東北角討論室。', interactionType: 'info', quizIds: [], keywords: ['討論'],
    options: { doors: [{ side: 'south', from: 1895, to: 1945 }], furniture: 'smallDiscussion' },
  },
  {
    id: 'f2-desk-w', name: '閱讀桌（西側）', category: 'reading', kind: 'tables', px: [28, 210, 128, 1100],
    description: '二樓西側沿牆長形閱讀桌（圖面為一整列，北接討論室）。', interactionType: 'info', quizIds: [], keywords: ['閱讀', '座位'],
  },
  {
    id: 'f2-desk-e', name: '閱讀桌（東側）', category: 'reading', kind: 'tables', px: [1868, 210, 1968, 729],
    description: '二樓東側沿牆閱讀桌，北接東側討論室。', interactionType: 'info', quizIds: [], keywords: ['閱讀', '座位'],
  },
  {
    id: 'f2-reading-center', name: '中央閱讀區', category: 'reading', kind: 'tableGrid', px: [187, 548, 1665, 1010],
    description: '二樓中央閱讀區，圖面標示為「閱讀區」的 6 組長形配置，此處以閱讀桌椅示意（保留設定供日後依現場照片修正）。',
    interactionType: 'info', quizIds: [], keywords: ['閱讀', '座位', '自習'],
    options: {
      tables: [
        [250, 580, 834, 701], [927, 580, 1510, 701],
        [250, 718, 834, 840], [927, 718, 1510, 840],
        [250, 857, 834, 979], [927, 857, 1510, 979],
      ],
    },
  },
  {
    id: 'f2-screen', name: '螢幕（二樓）', category: 'facility', kind: 'screen', px: [1571, 646, 1633, 912],
    description: '二樓中央閱讀區東側的螢幕。', interactionType: 'info', quizIds: [], keywords: ['螢幕'], options: { facing: 'west' },
  },
  {
    id: 'f2-stairs', name: '往 1F 樓梯', category: 'circulation', kind: 'stairwell', px: [1712, 728, 1837, 1102],
    description: '二樓東南側樓梯，通往一樓。點擊可切換至一樓。', interactionType: 'stairs', quizIds: [], keywords: ['樓梯', '一樓', '下樓'],
    options: { target: 1 },
  },
  {
    id: 'f2-storage', name: '儲物室', category: 'room', kind: 'room', px: [1850, 827, 1973, 1101],
    description: '二樓最東側靠南的儲物室（非開放空間）。', interactionType: 'info', quizIds: [], keywords: ['儲藏'],
    options: { doors: [{ side: 'west', from: 860, to: 920 }], furniture: 'storage' },
  },
  {
    id: 'f2-desk-sw', name: '閱讀桌（南側西段）', category: 'reading', kind: 'tables', px: [140, 1044, 863, 1101],
    description: '二樓最南側中央偏西的閱讀桌。', interactionType: 'info', quizIds: [], keywords: ['閱讀', '座位'],
  },
  {
    id: 'f2-desk-se', name: '閱讀桌（南側東段）', category: 'reading', kind: 'tables', px: [1081, 1044, 1700, 1101],
    description: '二樓最南側中央偏東的閱讀桌。', interactionType: 'info', quizIds: [], keywords: ['閱讀', '座位'],
  },
  {
    id: 'f2-south-mark', name: '南側深色標示', category: 'facility', kind: 'marker', px: [886, 1084, 1061, 1111],
    description: '二樓圖面下方中央的深色標示（位於一樓大門正上方），平面圖未註記用途，此處僅以示意方塊呈現。',
    interactionType: 'info', quizIds: [], keywords: [],
  },
];
