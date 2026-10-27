// 一樓空間資料：px 為「圖書館空間配置圖1F.PNG」(2000×1125) 中量得的像素範圍 [左, 上, 右, 下]
// 以色塊自動偵測後人工命名；所有 3D 幾何皆由此資料產生。
export const FLOOR1_WALL_GAPS = [
  { side: 'south', from: 875, to: 1072, label: '大門' },
  { side: 'north', from: 1677, to: 1748, label: '北側門' },
];

export const FLOOR1_ZONES = [
  {
    id: 'f1-entrance', name: '大門', category: 'entrance', kind: 'door', px: [875, 1084, 1072, 1114],
    description: '圖書館主要出入口，位於一樓南側（圖面下方中央）。借書請由一樓進入圖書館。',
    interactionType: 'info', quizIds: ['qz-borrow-flow'], keywords: ['入口', '門', '進館'],
  },
  {
    id: 'f1-north-door', name: '北側門', category: 'entrance', kind: 'sideDoor', px: [1677, 14, 1748, 24],
    description: '圖面上方深色標示之開口（位於展示螢幕與梅高特藏區之間），平面圖未標註名稱，此處以「北側門」示意。',
    interactionType: 'info', quizIds: [], keywords: ['門', '開口'],
  },
  {
    id: 'f1-discussion', name: '討論室', category: 'room', kind: 'room', px: [30, 25, 1071, 205],
    description: '一樓西北側大型討論室，設有螢幕與討論桌，適合小組討論。',
    interactionType: 'info', quizIds: [], keywords: ['討論', '小組', '會議'],
    options: { doors: [{ side: 'east', from: 25, to: 83 }], furniture: 'discussion' },
  },
  {
    id: 'f1-discussion-screen', name: '討論室螢幕', category: 'facility', kind: 'screen', px: [41, 30, 83, 166],
    description: '討論室西側牆面的螢幕，可供簡報及影片播放。',
    interactionType: 'info', quizIds: [], keywords: ['螢幕', '投影'], options: { facing: 'east' },
  },
  {
    id: 'f1-desk-nw', name: '閱讀桌（西側北段）', category: 'reading', kind: 'tables', px: [30, 219, 140, 486],
    description: '一樓西側靠牆的長形閱讀桌。', interactionType: 'info', quizIds: [], keywords: ['閱讀', '座位', '自習'],
  },
  {
    id: 'f1-tablet-cart', name: '平板車', category: 'facility', kind: 'cart', px: [151, 218, 242, 277],
    description: '存放教學用平板電腦的充電車，位於 SDGs 專區西側。', interactionType: 'info', quizIds: [], keywords: ['平板', '充電'],
  },
  {
    id: 'f1-sdgs', name: 'SDGs 專區', category: 'display', kind: 'sdgs', px: [252, 218, 1071, 277],
    description: '聯合國永續發展目標（SDGs）主題書展專區，位於討論室南側、主要閱讀空間北側。',
    interactionType: 'info', quizIds: [], keywords: ['永續', '主題書展', 'SDGs'],
  },
  {
    id: 'f1-newspaper', name: '報架', category: 'collection', kind: 'newsRack', px: [28, 497, 55, 590],
    description: '一樓陳列當日報紙，圖書館至少保存最近二週內之報紙，以供查閱使用。',
    interactionType: 'info', quizIds: ['qz-newspaper'], keywords: ['報紙', '新聞'],
  },
  {
    id: 'f1-desk-sw', name: '閱讀桌（西側南段）', category: 'reading', kind: 'tables', px: [30, 601, 140, 869],
    description: '一樓西側報架南方的長形閱讀桌。', interactionType: 'info', quizIds: [], keywords: ['閱讀', '座位'],
  },
  {
    id: 'f1-lockers', name: '置物櫃', category: 'facility', kind: 'lockers', px: [30, 884, 140, 1102],
    description: '一樓西南角置物櫃。依規定不可攜帶書包、飲食（含礦泉水）等私人物品入館。',
    interactionType: 'info', quizIds: ['qz-bag'], keywords: ['書包', '寄物'],
  },
  {
    id: 'f1-carpet-reading', name: '閱讀區底座', category: 'reading', kind: 'carpet', px: [250, 310, 875, 463],
    description: '中央閱讀區範圍。', interactionType: 'none', quizIds: [], keywords: [], hidden: true,
  },
  {
    id: 'f1-reading-a', name: '閱讀區 A', category: 'reading', kind: 'tables', px: [275, 330, 541, 443],
    description: '一樓中西側主要閱讀區（西）。', interactionType: 'info', quizIds: [], keywords: ['閱讀', '座位'],
  },
  {
    id: 'f1-reading-b', name: '閱讀區 B', category: 'reading', kind: 'tables', px: [584, 330, 850, 443],
    description: '一樓中西側主要閱讀區（東）。', interactionType: 'info', quizIds: [], keywords: ['閱讀', '座位'],
  },
  {
    id: 'f1-carpet-magazine', name: '雜誌區底座', category: 'collection', kind: 'carpet', px: [250, 475, 875, 621],
    description: '雜誌區範圍。', interactionType: 'none', quizIds: [], keywords: [], hidden: true,
  },
  {
    id: 'f1-magazine-1', name: '雜誌區（北排）', category: 'collection', kind: 'magazine', px: [250, 492, 875, 539],
    description: '一樓置放當月期刊雜誌，不外借；過期雜誌移置於二樓書庫供讀者外借。',
    interactionType: 'info', quizIds: ['qz-magazine'], keywords: ['期刊', '雜誌'],
  },
  {
    id: 'f1-magazine-2', name: '雜誌區（南排）', category: 'collection', kind: 'magazine', px: [250, 557, 875, 604],
    description: '一樓置放當月期刊雜誌，不外借；過期雜誌移置於二樓書庫供讀者外借。',
    interactionType: 'info', quizIds: ['qz-magazine'], keywords: ['期刊', '雜誌'],
  },
  {
    id: 'f1-sunning-1', name: '曬書桌 1', category: 'display', kind: 'flatDisplay', px: [252, 639, 874, 685],
    description: '平放展示書籍的「曬書桌」，方便瀏覽封面。', interactionType: 'info', quizIds: [], keywords: ['展示', '曬書'],
  },
  {
    id: 'f1-sunning-2', name: '曬書桌 2', category: 'display', kind: 'flatDisplay', px: [252, 705, 874, 751],
    description: '平放展示書籍的「曬書桌」，方便瀏覽封面。', interactionType: 'info', quizIds: [], keywords: ['展示', '曬書'],
  },
  {
    id: 'f1-sunning-3', name: '曬書桌 3', category: 'display', kind: 'flatDisplay', px: [252, 771, 874, 818],
    description: '平放展示書籍的「曬書桌」，方便瀏覽封面。', interactionType: 'info', quizIds: [], keywords: ['展示', '曬書'],
  },
  {
    id: 'f1-board-w', name: '公佈欄（西）', category: 'facility', kind: 'board', px: [175, 884, 489, 900],
    description: '一樓西南側公佈欄，張貼圖書館活動與公告。', interactionType: 'info', quizIds: [], keywords: ['公告', '活動'],
  },
  {
    id: 'f1-newbooks', name: '新書展示區', category: 'display', kind: 'newBooks', px: [502, 886, 874, 976],
    description: '位於圖面下方偏左的中央，展示新進圖書。點擊可查看新書介紹（範例資料）與新書推薦流程。',
    interactionType: 'newbooks', quizIds: ['qz-recommend'], keywords: ['新書', '推薦'],
  },
  {
    id: 'f1-display-screen', name: '展示螢幕', category: 'facility', kind: 'screen', px: [1277, 23, 1667, 74],
    description: '一樓東北側展示螢幕，播放圖書館公告與活動資訊。', interactionType: 'info', quizIds: [], keywords: ['螢幕', '公告'],
    options: { facing: 'south', wide: true },
  },
  {
    id: 'f1-reading-ne', name: '東北閱讀區', category: 'reading', kind: 'tableGrid', px: [1277, 97, 1667, 511],
    description: '一樓東北側閱讀區，共 6 組閱讀桌（圖面標示「閱讀區」）。', interactionType: 'info', quizIds: [], keywords: ['閱讀', '座位'],
    options: {
      tables: [
        [1326, 112, 1450, 229], [1494, 112, 1618, 229],
        [1326, 246, 1450, 362], [1494, 246, 1618, 362],
        [1326, 379, 1450, 496], [1494, 379, 1618, 496],
      ],
    },
  },
  {
    id: 'f1-meigao', name: '梅高特藏區', category: 'collection', kind: 'special', px: [1759, 25, 1966, 409],
    description: '位於一樓東北角，陳列梅岡風、最近幾屆畢業紀念冊、梅高青年等刊物，不開放外借。',
    interactionType: 'special', quizIds: ['qz-meigao'], keywords: ['特藏', '畢業紀念冊', '梅岡風', '梅高青年'],
    options: { shelves: [[1765, 32, 1959, 92], [1885, 92, 1959, 402]] },
  },
  {
    id: 'f1-machines', name: '事務機器', category: 'service', kind: 'copier', px: [1861, 423, 1967, 513],
    description: '影印、列印與掃描設備。須自備悠遊卡（餘額 10 元以上）；黑白每頁 2 元、彩色每頁 6 元，掃描只需過卡不收費。',
    interactionType: 'copier', quizIds: ['qz-copy', 'qz-scan'], keywords: ['影印', '列印', '掃描', '悠遊卡'],
  },
  {
    id: 'f1-opac', name: '資訊檢索區', category: 'service', kind: 'computers', px: [1277, 550, 1970, 634],
    description: '一樓東側、行政辦公室北方的電腦檢索區，可查詢館藏。電腦不可連線任何不當網頁，違者將受校規警告以上處分。',
    interactionType: 'opac', quizIds: ['qz-opac', 'qz-search'], keywords: ['電腦', '查詢', '館藏', 'OPAC'],
    options: {
      computers: [
        [1292, 565, 1373, 619], [1425, 565, 1506, 619], [1516, 565, 1597, 619],
        [1650, 565, 1731, 619], [1741, 565, 1822, 619], [1874, 565, 1955, 619],
      ],
    },
  },
  {
    id: 'f1-counter', name: '借還書櫃台', category: 'service', kind: 'counter', px: [1074, 637, 1276, 978],
    description: '讀者服務櫃台，位於行政辦公室西側。借書請攜學生證，每人最多 4 本、借期 2 週，請於開放日 16:00 前完成借書程序。',
    interactionType: 'counter', quizIds: ['qz-limit', 'qz-card'], keywords: ['借書', '還書', '櫃台', '學生證'],
    options: { legs: [[1074, 637, 1129, 908], [1074, 908, 1276, 978]] },
  },
  {
    id: 'f1-office', name: '行政辦公室', category: 'room', kind: 'room', px: [1279, 637, 1969, 978],
    description: '圖書館行政辦公區，位於一樓東南側。', interactionType: 'info', quizIds: [], keywords: ['辦公室', '館員'],
    options: { doors: [{ side: 'west', from: 640, to: 725 }], furniture: 'office' },
  },
  {
    id: 'f1-board-se', name: '公佈欄（東南）', category: 'facility', kind: 'boardPair', px: [1277, 983, 1627, 1106],
    description: '通往樓梯走道兩側的公佈欄。', interactionType: 'info', quizIds: [], keywords: ['公告'],
    options: { boards: [[1277, 983, 1627, 993], [1277, 1096, 1627, 1106]] },
  },
  {
    id: 'f1-stairs', name: '往 2F 樓梯', category: 'circulation', kind: 'stairs', px: [1637, 983, 1970, 1106],
    description: '位於一樓東南角，通往二樓書庫與閱讀區。點擊可切換至二樓。',
    interactionType: 'stairs', quizIds: ['qz-borrow-flow'], keywords: ['樓梯', '二樓', '上樓'],
    options: { target: 2 },
  },
];
