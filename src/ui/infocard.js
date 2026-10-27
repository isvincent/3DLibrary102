// 右側：可收合的空間資訊卡（手機版為底部抽屜）
import { $, esc } from './dom.js';
import { on, emit } from '../core/events.js';
import { CATEGORY_META } from '../data/zones.js';
import { FAQS } from '../data/faq-data.js';
import { QUIZ } from '../data/quiz-data.js';
import { DEMO_BOOKS, DEMO_NEW_BOOKS, DEMO_NOTICE } from '../data/books-data.js';
import { BORROW_RULES, RECOMMEND_STEPS, OPEN_HOURS, GUIDE_SECTIONS } from '../data/library-content.js';
import { PLAN } from '../data/config.js';
import { markExplored } from '../core/store.js';
import { speak, speechSupported } from '../core/audio.js';

const steps = (arr) => `<div class="steps">${arr.map((s, i) => `${i ? '<i>➜</i>' : ''}<span>${esc(s)}</span>`).join('')}</div>`;

function extraFor(z) {
  switch (z.interactionType) {
    case 'opac':
      return `<div class="card-section"><h4>🔎 館藏查詢</h4><p>點擊電腦螢幕即可開啟模擬查詢介面（示範資料）。</p>
        <button class="btn primary" data-card="opac">開啟模擬查詢</button></div>`;
    case 'copier':
      return `<div class="card-section"><h4>🖨️ 事務機器價目</h4>
        <ul class="rule-list"><li>黑白影印／列印：每頁 2 元</li><li>彩色影印／列印：每頁 6 元</li><li>掃描：只需過卡，不收費</li><li>請自備悠遊卡（餘額 10 元以上）</li></ul>
        <button class="btn primary" data-card="copier">費用試算</button></div>`;
    case 'newbooks':
      return `<div class="card-section"><h4>📗 新書介紹 <span class="demo-tag">${DEMO_NOTICE}</span></h4>
        ${DEMO_NEW_BOOKS.map((b) => `<div class="book-row"><span class="spine" style="background:${b.color}"></span><div class="bi"><b>${esc(b.title)}</b><small>${esc(b.blurb)}</small></div></div>`).join('')}
        <h4 style="margin-top:10px">✍️ 新書推薦流程（FAQ Q11）</h4>${steps(RECOMMEND_STEPS)}</div>`;
    case 'stairs':
      return `<div class="card-section"><h4>🪜 樓層移動</h4><p>借書請由一樓進入圖書館，至二樓書庫找書／取書，至一樓櫃台完成借書程序。</p>
        <button class="btn primary" data-card="floor" data-floor="${z.options.target}">前往 ${z.options.target}F</button></div>`;
    case 'shelf': {
      const idx = z.options.index;
      const books = idx ? DEMO_BOOKS.filter((b) => b.shelf === idx) : [];
      return `<div class="card-section"><h4>📚 書庫說明</h4><p>借書：每人最多 ${BORROW_RULES.maxBooks} 本、借期 2 週。過期雜誌移置於二樓書庫供讀者外借；漫畫僅供在館閱讀。</p>
        ${idx ? `<p><b>示範分類：</b>${esc(z.options.className)} <span class="demo-tag">${DEMO_NOTICE}</span></p>
        ${books.map((b) => `<div class="book-row"><span class="spine" style="background:#3b7ddd"></span><div class="bi"><b>${esc(b.title)}</b><small>${esc(b.callNo)}｜${esc(b.author)}${b.inLibraryOnly ? '｜限館內閱讀' : ''}</small></div></div>`).join('') || '<p>（此書架無示範書目）</p>'}` : ''}
        <button class="btn accent" data-card="borrow">模擬借書</button></div>`;
    }
    case 'special':
      return `<div class="card-section"><h4>🏛️ 特藏資料</h4><ul class="rule-list"><li>梅岡風</li><li>最近幾屆畢業紀念冊</li><li>梅高青年</li></ul><p><b>不開放外借</b>，請在館內閱覽。</p></div>`;
    case 'counter':
      return `<div class="card-section"><h4>📋 借還規則</h4>
        <ul class="rule-list">${GUIDE_SECTIONS[1].items.slice(2).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <button class="btn accent" data-card="borrow">模擬借書流程</button></div>`;
    default:
      if (z.id === 'f1-entrance')
        return `<div class="card-section"><h4>🕗 開放時間</h4><p><b>${OPEN_HOURS.open}～${OPEN_HOURS.close}</b></p><ul class="rule-list">${OPEN_HOURS.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
          <ul class="rule-list">${GUIDE_SECTIONS[3].items.slice(0, 1).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
      return '';
  }
}

function render(z) {
  const body = $('#card-body');
  if (!z) {
    body.innerHTML = `
      <span class="card-cat" style="--c:#2f6fdf">開始探索</span>
      <h2 class="card-title">歡迎來到圖書館探索島！</h2>
      <p class="card-desc">拖曳旋轉、滾輪或雙指縮放；點擊建築中的任何區域查看介紹。</p>
      <div class="card-section"><h4>🧭 建議路線</h4>
        <ol class="rule-list"><li>上方切換「一樓俯視」「二樓俯視」看配置</li><li>打開「探險任務」完成 6 個關卡</li><li>到「學習中心」學借書規則與 FAQ</li><li>用「2D／3D 對照」比對平面圖</li></ol></div>
      <div class="card-section"><h4>🕗 開放時間</h4><p>${OPEN_HOURS.open}～${OPEN_HOURS.close}；${esc(OPEN_HOURS.notes[0])}</p></div>`;
    return;
  }
  const cat = CATEGORY_META[z.category] || {};
  const faqs = FAQS.filter((f) => f.zoneId === z.id);
  const quizzes = QUIZ.filter((q) => z.quizIds.includes(q.id) || q.zoneId === z.id);
  const b = z.mapBounds;
  body.innerHTML = `
    <span class="card-cat" style="--c:${cat.color}">${esc(cat.label || '')}</span>
    <h2 class="card-title">${esc(z.name)}</h2>
    <div class="card-meta">${z.floor}F｜ID：${z.id}</div>
    <p class="card-desc">${esc(z.description)}</p>
    <div class="card-actions">
      <button class="btn primary" data-card="focus">🎯 聚焦</button>
      ${speechSupported ? '<button class="btn" data-card="speak">🔊 朗讀</button>' : ''}
      <button class="btn" data-card="compare">🗺️ 平面圖位置</button>
    </div>
    ${extraFor(z)}
    ${faqs.length ? `<div class="card-section"><h4>❓ 相關 FAQ</h4>${faqs.map((f) => `<details class="qa"><summary><span class="qid">${f.id}</span>${esc(f.q)}</summary><div class="ans">${esc(f.a)}</div></details>`).join('')}</div>` : ''}
    ${quizzes.length ? `<div class="card-section"><h4>✏️ 相關測驗</h4><p>${quizzes.length} 題與此空間相關。</p><button class="btn" data-card="quiz">去測驗</button></div>` : ''}
    <div class="card-section"><h4>📍 平面圖位置（${z.floor}F）</h4>
      <div class="mini-plan"><img src="${PLAN.images[z.floor]}" alt="${z.floor}F 平面圖" />
        <div class="mp-box" style="left:${b.x * 100}%;top:${b.y * 100}%;width:${b.w * 100}%;height:${b.h * 100}%"></div></div>
      <small style="color:var(--ink-2)">標準化座標 x=${b.x.toFixed(3)}, y=${b.y.toFixed(3)}, w=${b.w.toFixed(3)}, h=${b.h.toFixed(3)}</small>
    </div>`;
}

export function initInfoCard(sm) {
  let current = null;
  const close = () => document.body.classList.add('card-closed');
  const open = () => document.body.classList.remove('card-closed');
  $('#card-close').addEventListener('click', () => {
    close();
    setTimeout(() => sm.resize(), 50);
  });
  on('zone:select', (z) => {
    current = z;
    render(z);
    if (z) {
      open();
      markExplored(z.id);
      speak(`${z.name}。${z.description}`);
    }
    setTimeout(() => sm.resize(), 50);
  });
  $('#card-body').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-card]');
    if (!btn) return;
    const act = btn.dataset.card;
    if (act === 'focus' && current) sm.focusZone(current.id);
    if (act === 'speak' && current) speak(`${current.name}。${current.description}`, { force: true });
    if (act === 'compare' && current) {
      sm.floor = current.floor;
      sm.setMode('compare');
      sm.select(current.id);
    }
    if (act === 'opac') emit('open:learn', { tab: 'opac' });
    if (act === 'copier') emit('open:learn', { tab: 'copier' });
    if (act === 'quiz') emit('open:learn', { tab: 'quiz' });
    if (act === 'borrow') emit('borrow:start');
    if (act === 'floor') sm.setFloor(+btn.dataset.floor);
  });
  if (window.matchMedia('(max-width: 860px)').matches) close();
  render(null);
}
