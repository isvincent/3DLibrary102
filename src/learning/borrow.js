// 單元 2：模擬借書（真正的 3D 導覽路線 + 地面箭頭 + 小人物移動）
import { BORROW_ROUTE } from '../data/tour-paths.js';
import { BORROW_RULES } from '../data/library-content.js';
import { DEMO_BOOKS, DEMO_NOTICE } from '../data/books-data.js';
import { startTask, updateTask, endTask } from '../ui/task.js';
import { openModal, closeModal, esc, toast, celebrate } from '../ui/dom.js';
import { progress, saveProgress } from '../core/store.js';
import { emit } from '../core/events.js';
import { speak } from '../core/audio.js';

let sm;
let stepIdx = 0;
let chosen = [];
let chosenShelf = 6;

export function initBorrow(sceneManager) {
  sm = sceneManager;
}

function fmt(d) {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function goStep(i) {
  stepIdx = i;
  const step = BORROW_ROUTE[i];
  if (!step) return finish();
  if (step.floor !== sm.floor || !['interior', 'explode'].includes(sm.mode)) {
    sm.floor = step.floor;
    sm.setMode('interior');
  }
  sm.showPath(step.path.length ? step.path : null);
  if (step.path.length) sm.placeAvatar(step.path[0]);
  const title = `模擬借書 ${i + 1}/${BORROW_ROUTE.length}：${step.title}`;
  speak(step.hint);
  if (step.action === 'pickBooks') {
    startTask({ title, text: step.hint, buttons: [{ label: '📚 開啟書架選書', cls: 'primary', onClick: pickBooks }], onCancel: cancel });
    pickBooks();
    return;
  }
  if (step.action === 'showCard') {
    startTask({ title, text: `${step.hint}（已選 ${chosen.length} 本）`, buttons: [{ label: '🪪 出示學生證', cls: 'accent', onClick: showCard }], onCancel: cancel });
    return;
  }
  const targets = step.anyShelf ? null : [step.targetZone];
  startTask({
    title,
    text: step.hint,
    hintZones: [step.targetZone],
    showHint: true,
    accept: (z) => (step.anyShelf ? z.kind === 'bookshelf' || z.id === 'f2-stacks' : targets.includes(z.id)),
    onSuccess: async (z) => {
      if (z.kind === 'bookshelf') chosenShelf = z.options.index;
      if (step.path.length) await sm.walkAvatar(step.path);
      if (step.id === 'to-stairs' || step.id === 'back-down') {
        // 樓梯：切換樓層
        sm.floor = step.id === 'to-stairs' ? 2 : 1;
        sm.setMode('interior');
      }
      setTimeout(() => goStep(stepIdx + 1), 400);
    },
    onCancel: cancel,
  });
  if (step.targetZone) sm.focusZone(step.targetZone);
}

function pickBooks() {
  const list = DEMO_BOOKS.slice().sort((a, b) => (a.shelf === chosenShelf ? -1 : 0) - (b.shelf === chosenShelf ? -1 : 0));
  const box = openModal(`選書（第 ${chosenShelf} 排書架附近）`, `
    <p><span class="demo-tag">${DEMO_NOTICE}</span> 每人最多可借 <b>${BORROW_RULES.maxBooks}</b> 本，借期 2 週。標示「限館內閱讀」的書不能外借。</p>
    <div id="pick-list">${list.map((b) => `
      <label class="book-row"><input type="checkbox" value="${b.id}" ${chosen.includes(b.id) ? 'checked' : ''}>
        <span class="spine" style="background:${b.shelf === chosenShelf ? '#fb8500' : '#3b7ddd'}"></span>
        <span class="bi"><b>${esc(b.title)}</b><small>書架 ${b.shelf}｜${esc(b.callNo)}${b.inLibraryOnly ? '｜<b style="color:var(--bad)">限館內閱讀</b>' : ''}</small></span></label>`).join('')}</div>
    <div class="row" style="margin-top:10px"><b id="pick-count"></b><button class="btn primary" id="pick-done">完成選書</button></div>`);
  const update = () => {
    box.querySelector('#pick-count').textContent = `已選 ${chosen.length} / ${BORROW_RULES.maxBooks} 本`;
  };
  update();
  box.querySelectorAll('input[type=checkbox]').forEach((cb) =>
    cb.addEventListener('change', () => {
      const b = DEMO_BOOKS.find((x) => x.id === cb.value);
      if (cb.checked) {
        if (b.inLibraryOnly) {
          cb.checked = false;
          toast('漫畫書籍僅供在館閱讀，不開放外借！', 'warn');
          return;
        }
        if (chosen.length >= BORROW_RULES.maxBooks) {
          cb.checked = false;
          toast(`每人最多可借 ${BORROW_RULES.maxBooks} 本喔！`, 'warn');
          return;
        }
        chosen.push(b.id);
      } else chosen = chosen.filter((x) => x !== b.id);
      update();
    }),
  );
  box.querySelector('#pick-done').addEventListener('click', () => {
    if (!chosen.length) {
      toast('請至少選 1 本書', 'warn');
      return;
    }
    closeModal(true);
    goStep(stepIdx + 1);
  });
}

function showCard() {
  const due = new Date(Date.now() + BORROW_RULES.loanDays * 86400000);
  const renewFrom = new Date(due.getTime() - 2 * 86400000);
  const books = chosen.map((id) => DEMO_BOOKS.find((b) => b.id === id));
  progress.borrowCompleted += 1;
  saveProgress();
  endTask();
  sm.clearPath();
  sm.hideAvatar();
  celebrate('🎉 借書完成！');
  emit('borrow:done');
  openModal('借書完成（模擬）', `
    <div class="result-box ok"><b>✔ 已出示學生證，完成借書程序</b></div>
    <h4>借閱書目 <span class="demo-tag">${DEMO_NOTICE}</span></h4>
    ${books.map((b) => `<div class="book-row"><span class="spine" style="background:#2e9e5b"></span><div class="bi"><b>${esc(b.title)}</b><small>${esc(b.callNo)}</small></div></div>`).join('')}
    <div class="stat-grid">
      <div class="stat">到期日<b>${fmt(due)}</b></div>
      <div class="stat">可辦續借<b>${fmt(renewFrom)} 起</b></div>
      <div class="stat">續借期<b>2 週</b></div>
    </div>
    <ul class="rule-list">
      <li>續借：於到期日前 1～2 日到圖書館或圖書查詢系統辦理，續借期為二週。</li>
      <li>還書：出借之圖書須於到期前至圖書館讀者服務櫃台辦理歸還。</li>
      <li>逾期：累計每本書逾期天數為暫停借閱權限天數。</li>
    </ul>`);
}

function finish() {
  endTask();
}

function cancel() {
  sm.clearPath();
  sm.hideAvatar();
}

export function startBorrow() {
  chosen = [];
  chosenShelf = 6;
  closeModal(true);
  toast('開始模擬借書：依地面箭頭前進！', 'ok');
  goStep(0);
}
