// 遊戲化：「圖書館新生探險」六大關卡 + 徽章
import { progress, saveProgress } from '../core/store.js';
import { on, emit } from '../core/events.js';
import { startTask, endTask } from '../ui/task.js';
import { openModal, closeModal, esc, celebrate, toast } from '../ui/dom.js';

let sm;

export const QUESTS = [
  { id: 'q1', name: '找到圖書館大門', desc: '在 3D 模型中找到一樓南側的大門並點擊它。', target: ['f1-entrance'], points: 20, floor: 1, op: '旋轉／縮放，點擊大門' },
  { id: 'q2', name: '找出一樓資訊檢索區', desc: '找到可以查詢館藏的電腦區（提示：在行政辦公室上方）。', target: ['f1-opac'], points: 20, floor: 1, op: '點擊電腦區域' },
  { id: 'q3', name: '從一樓走到二樓書庫', desc: '先點擊一樓「往 2F 樓梯」，再點擊二樓任一書架。', target: ['f1-stairs'], then: 'shelf', points: 30, floor: 1, op: '點樓梯 → 點書架' },
  { id: 'q4', name: '選書並完成借書模擬', desc: '依地面箭頭完成：大門 → 樓梯 → 書庫選書 → 一樓櫃台 → 出示學生證。', borrow: true, points: 40, op: '跟著導覽線操作' },
  { id: 'q5', name: '找到梅高特藏區', desc: '找到陳列畢業紀念冊、梅岡風的特藏區。', target: ['f1-meigao'], points: 20, floor: 1, op: '點擊東北角區域' },
  { id: 'q6', name: '完成圖書館利用教育測驗', desc: '完成 10 題測驗，答對 70% 以上即過關。', quiz: true, points: 50, op: '在學習中心作答' },
];

export const BADGE = '楊梅高中圖書館探索達人';

export function questDone(id) {
  return !!progress.quests[id]?.done;
}

export function completeQuest(id) {
  const q = QUESTS.find((x) => x.id === id);
  if (!q || questDone(id)) return;
  progress.quests[id] = { done: true, at: new Date().toISOString(), points: q.points };
  progress.points = Object.values(progress.quests).reduce((s, x) => s + (x.points || 0), 0);
  const all = QUESTS.every((x) => questDone(x.id));
  if (all) progress.badge = true;
  saveProgress();
  celebrate(`🏅 關卡完成：${q.name}（+${q.points} 分）`);
  if (all) setTimeout(() => showBadge(), 2000);
  emit('quest:done', q);
}

function runQuest(q) {
  closeModal(true);
  if (q.borrow) {
    emit('borrow:start');
    return;
  }
  if (q.quiz) {
    emit('open:learn', { tab: 'quiz' });
    return;
  }
  sm.floor = q.floor;
  sm.setMode('interior');
  const stageTwo = () => {
    sm.floor = 2;
    sm.setMode('interior');
    startTask({
      title: `探險任務：${q.name}（2/2）`,
      text: '上樓了！現在點擊二樓任一排書架。',
      hintZones: ['f2-shelf-01', 'f2-shelf-05', 'f2-shelf-10'],
      accept: (z) => z.kind === 'bookshelf' || z.id === 'f2-stacks',
      onSuccess: () => {
        setTimeout(endTask, 1200);
        completeQuest(q.id);
      },
    });
  };
  startTask({
    title: `探險任務：${q.name}${q.then ? '（1/2）' : ''}`,
    text: q.desc,
    hintZones: q.target,
    accept: (z) => q.target.includes(z.id),
    onSuccess: () => {
      if (q.then) setTimeout(stageTwo, 700);
      else {
        setTimeout(endTask, 1200);
        completeQuest(q.id);
      }
    },
  });
}

export function showBadge() {
  openModal('🏅 恭喜獲得徽章！', `
    <div class="badge-big"><div class="medal">🏅</div><h2>${BADGE}</h2>
    <p>${esc(progress.nickname || '同學')}，你已完成全部 ${QUESTS.length} 個探險關卡，累積 ${progress.points} 分！</p></div>`);
  celebrate(BADGE);
}

export function openQuests() {
  const doneN = QUESTS.filter((q) => questDone(q.id)).length;
  const box = openModal('🗺️ 圖書館新生探險', `
    <p class="unit-intro">完成 ${QUESTS.length} 個關卡即可獲得「${BADGE}」徽章。目前積分 <b>${progress.points}</b> 分。</p>
    <div class="progress-bar" aria-label="任務進度"><i style="width:${(doneN / QUESTS.length) * 100}%"></i></div>
    <p style="font-size:.9rem;color:var(--ink-2)">進度 ${doneN} / ${QUESTS.length}</p>
    ${QUESTS.map((q, i) => `
      <div class="quest ${questDone(q.id) ? 'done' : ''}">
        <div class="qn">${questDone(q.id) ? '✔' : i + 1}</div>
        <div class="qb"><h4>${esc(q.name)} <small style="color:var(--accent)">+${q.points} 分</small></h4>
          <p>${esc(q.desc)}<br><small>3D 操作：${esc(q.op)}</small></p>
          <button class="btn sm ${questDone(q.id) ? '' : 'primary'}" data-q="${q.id}">${questDone(q.id) ? '再玩一次' : '開始任務'}</button></div>
      </div>`).join('')}
    ${progress.badge ? `<div class="badge-big" style="margin-top:10px"><div class="medal">🏅</div><b>${BADGE}</b></div>` : ''}`);
  box.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => runQuest(QUESTS.find((q) => q.id === b.dataset.q))));
}

export function initQuests(sceneManager) {
  sm = sceneManager;
  on('borrow:done', () => completeQuest('q4'));
  on('quiz:done', ({ percent }) => {
    if (percent >= 70) completeQuest('q6');
    else toast('測驗需達 70% 才能完成第 6 關，再挑戰一次！', 'warn');
  });
}
