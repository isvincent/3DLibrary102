// 導覽路線：點位以平面圖 px 表示，level = 0（一樓地面）～1（二樓地面），樓梯段為小數。
// 樓梯為示意的折返梯：第一段沿南側由西向東上升至平台，第二段沿北側由東向西抵達二樓樓梯井。
export const STAIR_GEOMETRY = {
  flightA: { y1: 1050, y2: 1100, xStart: 1645, xEnd: 1900, levelStart: 0, levelEnd: 0.5 },
  landing: { x1: 1900, x2: 1966, y1: 990, y2: 1100, level: 0.5 },
  flightB: { y1: 990, y2: 1045, xStart: 1900, xEnd: 1712, levelStart: 0.5, levelEnd: 1 },
};

const UPSTAIRS = [
  { px: [1645, 1075], level: 0 },
  { px: [1900, 1075], level: 0.5 },
  { px: [1935, 1045], level: 0.5 },
  { px: [1900, 1017], level: 0.5 },
  { px: [1712, 1017], level: 1 },
];

export const BORROW_ROUTE = [
  {
    id: 'enter', title: '由一樓大門進館', targetZone: 'f1-entrance',
    hint: '找到一樓南側的「大門」並點擊它。', floor: 1,
    path: [],
  },
  {
    id: 'to-stairs', title: '走到往 2F 樓梯', targetZone: 'f1-stairs',
    hint: '沿著地面箭頭，經過公佈欄走道到東南角的樓梯，點擊樓梯。', floor: 1,
    path: [
      { px: [973, 1100], level: 0 }, { px: [973, 1040], level: 0 }, { px: [1300, 1040], level: 0 },
      { px: [1630, 1040], level: 0 }, { px: [1645, 1075], level: 0 },
    ],
  },
  {
    id: 'to-stacks', title: '上樓到二樓書庫', targetZone: 'f2-shelf-06',
    hint: '上樓後往北走到書庫，點擊第 6 排書架（箭頭終點）。也可點任一書架。', floor: 2, anyShelf: true,
    path: [
      ...UPSTAIRS,
      { px: [1690, 1017], level: 1 }, { px: [1690, 529], level: 1 }, { px: [1157, 529], level: 1 }, { px: [1157, 300], level: 1 },
    ],
  },
  {
    id: 'pick-books', title: '選書（最多 4 本）', targetZone: null, action: 'pickBooks',
    hint: '從書架上選擇想借的書，每人最多可借 4 本。', floor: 2,
    path: [],
  },
  {
    id: 'back-down', title: '返回一樓', targetZone: 'f2-stairs',
    hint: '帶著書回到二樓樓梯，點擊樓梯下樓。', floor: 2,
    path: [
      { px: [1157, 300], level: 1 }, { px: [1157, 529], level: 1 }, { px: [1690, 529], level: 1 }, { px: [1690, 1017], level: 1 },
      { px: [1712, 1017], level: 1 },
    ],
  },
  {
    id: 'to-counter', title: '到借還書櫃台', targetZone: 'f1-counter',
    hint: '下樓後沿箭頭到行政辦公室西側的借還書櫃台，點擊櫃台。', floor: 1,
    path: [
      ...[...UPSTAIRS].reverse(),
      { px: [1630, 1040], level: 0 }, { px: [1040, 1040], level: 0 }, { px: [1040, 800], level: 0 },
    ],
  },
  {
    id: 'show-card', title: '出示學生證', targetZone: null, action: 'showCard',
    hint: '借書請攜學生證，於開放日 16:00 前完成借書程序。', floor: 1,
    path: [],
  },
];

// 自動導覽（語音解說）
export const AUTO_TOUR = [
  { zoneId: 'f1-entrance', say: '歡迎來到楊梅高中圖書館！這裡是一樓南側的大門。圖書館開放時間為早上八點到下午四點。' },
  { zoneId: 'f1-newbooks', say: '進門左前方是新書展示區，可以看到最新的館藏。想推薦新書，可以透過新書推薦系統。' },
  { zoneId: 'f1-sdgs', say: '北側是 SDGs 永續發展專區，旁邊有平板車。' },
  { zoneId: 'f1-magazine-1', say: '這裡是雜誌區。一樓的當月期刊雜誌不外借，過期雜誌會移到二樓書庫供外借。' },
  { zoneId: 'f1-discussion', say: '西北側是大型討論室，設有螢幕，適合小組討論。' },
  { zoneId: 'f1-meigao', say: '東北角是梅高特藏區，陳列梅岡風、畢業紀念冊、梅高青年等刊物，不開放外借。' },
  { zoneId: 'f1-machines', say: '這是事務機器，影印列印要自備悠遊卡，餘額十元以上。黑白每頁兩元，彩色每頁六元，掃描不收費。' },
  { zoneId: 'f1-opac', say: '資訊檢索區可以查詢館藏，請勿連線任何不當網頁。' },
  { zoneId: 'f1-counter', say: '行政辦公室西側是借還書櫃台。借書請攜學生證，每人最多四本，借期兩週。' },
  { zoneId: 'f1-stairs', say: '東南角的樓梯通往二樓。' },
  { zoneId: 'f2-stacks', say: '二樓書庫共有十排書架，借書時請到這裡找書、取書，再回一樓櫃台辦理。' },
  { zoneId: 'f2-reading-center', say: '二樓中央是閱讀區，四周還有沿牆的閱讀桌與兩間討論室。導覽結束，祝你閱讀愉快！' },
];
