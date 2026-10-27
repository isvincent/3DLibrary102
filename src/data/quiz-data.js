// 圖書館利用教育測驗（題目內容依 PDF 規定）
export const QUIZ = [
  {
    id: 'qz-limit', q: '每位學生最多可以借幾本書？',
    options: ['2 本', '3 本', '4 本', '5 本'], answer: 2,
    explain: '借書請攜學生證，每人最多可借 4 本。', zoneId: 'f1-counter',
  },
  {
    id: 'qz-loan', q: '圖書的借期是多久？',
    options: ['1 週', '2 週', '3 週', '1 個月'], answer: 1,
    explain: '借期 2 週；續借期亦為二週。', zoneId: 'f1-counter',
  },
  {
    id: 'qz-renew', q: '想要續借，應在什麼時候辦理？',
    options: ['到期日前 1～2 日', '到期後 3 天內', '借書當天', '任何時間都可以'], answer: 0,
    explain: '於到期日前 1～2 日到圖書館或圖書查詢系統辦理，續借期為二週。', zoneId: 'f1-counter',
  },
  {
    id: 'qz-overdue', q: '小華有 2 本書各逾期 3 天，會被暫停借閱權限幾天？',
    options: ['3 天', '5 天', '6 天', '不會暫停'], answer: 2,
    explain: '累計每本書逾期天數為暫停借閱權限天數：3 + 3 = 6 天。', zoneId: 'f1-counter',
  },
  {
    id: 'qz-borrow-flow', q: '借書的正確流程是？',
    options: ['由二樓進館，在二樓櫃台借書', '由一樓進入，至二樓書庫取書，再到一樓櫃台完成借書', '在一樓櫃台請館員代為取書', '在資訊檢索區自助借書'], answer: 1,
    explain: '借書請由一樓進入圖書館，至二樓書庫找書／取書，至一樓櫃台完成借書程序。', zoneId: 'f2-stacks',
  },
  {
    id: 'qz-card', q: '辦理借書時必須攜帶什麼？',
    options: ['悠遊卡', '學生證', '身分證', '借書單'], answer: 1,
    explain: '借書請攜學生證。', zoneId: 'f1-counter',
  },
  {
    id: 'qz-hours', q: '圖書館館舍開放時間為？',
    options: ['07:30～17:00', '08:00～16:00', '08:00～17:30', '09:00～16:00'], answer: 1,
    explain: '開放時間：08:00～16:00。', zoneId: 'f1-entrance',
  },
  {
    id: 'qz-copy', q: '彩色影印每頁收費多少？',
    options: ['2 元', '4 元', '6 元', '10 元'], answer: 2,
    explain: '影印黑白文件每頁 2 元、彩色文件每頁 6 元。', zoneId: 'f1-machines',
  },
  {
    id: 'qz-scan', q: '使用事務機器掃描，下列敘述何者正確？',
    options: ['每頁 1 元', '需向館員借影印卡', '自備悠遊卡，只需過卡，無需付費', '不提供掃描服務'], answer: 2,
    explain: '掃描請自備悠遊卡（餘額 10 元以上），掃描只需過卡，無需付費。', zoneId: 'f1-machines',
  },
  {
    id: 'qz-magazine', q: '一樓的當月期刊雜誌可以外借嗎？',
    options: ['可以，借期 2 週', '不外借，過期雜誌移至二樓書庫後可外借', '只有教師可借', '可以，借期 1 週'], answer: 1,
    explain: '一樓置放當月期刊雜誌不外借，過期雜誌則移置於二樓書庫供讀者外借。', zoneId: 'f1-magazine-1',
  },
  {
    id: 'qz-meigao', q: '梅高特藏區陳列的刊物（如畢業紀念冊）可以外借嗎？',
    options: ['可以', '不開放外借', '只限高三', '需導師同意'], answer: 1,
    explain: '梅高特藏區陳列梅岡風、最近幾屆畢業紀念冊、梅高青年等刊物，不開放外借。', zoneId: 'f1-meigao',
  },
  {
    id: 'qz-bag', q: '下列哪一項可以帶進圖書館？',
    options: ['礦泉水', '書包', '自己的書籍', '便當'], answer: 2,
    explain: '可以帶自己的書籍，但不可攜帶飲食（含礦泉水）、書包等私人物品入館。', zoneId: 'f1-lockers',
  },
  {
    id: 'qz-opac', q: '資訊檢索電腦若連線不當網頁，會受到什麼處分？',
    options: ['口頭提醒', '經查證、記錄後受校規警告以上處分', '停用一天電腦', '沒有處分'], answer: 1,
    explain: '資訊檢索電腦不可連線任何不當網頁，違者經查證、記錄後將受校規警告以上處分。', zoneId: 'f1-opac',
  },
  {
    id: 'qz-search', q: '圖書查詢系統的正確步驟順序是？',
    options: ['館藏圖書查詢 → 圖書館網頁 → 開始查詢', '圖書館網頁 → 館藏圖書查詢 → 選擇關鍵字、ISBN 等 → 開始查詢', '登入個人帳號 → 填寫推薦內容', '直接詢問館員'], answer: 1,
    explain: '楊梅高中圖書館網頁 → 館藏圖書查詢 → 選擇關鍵字、ISBN 等 → 開始查詢。', zoneId: 'f1-opac',
  },
  {
    id: 'qz-newspaper', q: '圖書館至少保存最近多久的報紙？',
    options: ['三天', '一週', '二週', '一個月'], answer: 2,
    explain: '圖書館至少保存最近二週內之報紙，以供查閱使用。', zoneId: 'f1-newspaper',
  },
  {
    id: 'qz-recommend', q: '推薦圖書館購買新書的流程，「登入個人帳號」之後是？',
    options: ['圖書館審核', '填寫推薦內容', '館藏圖書查詢', '至櫃台登記'], answer: 1,
    explain: '楊梅高中圖書館網頁 → 登入個人帳號 → 填寫推薦內容 → 圖書館審核。', zoneId: 'f1-newbooks',
  },
];

export const QUIZ_SIZE = 10;
export const QUIZ_PASS = 70;
