// 學習歷程：暱稱、探索區域、關卡、測驗、錯題、時間；JSON／CSV 匯出、列印、清除
import { progress, saveProgress, resetProgress } from '../core/store.js';
import { openModal, esc, download, toast } from '../ui/dom.js';
import { ZONES, getZone } from '../data/zones.js';
import { QUESTS, BADGE } from './quests.js';
import { FIND_TARGETS } from '../data/library-content.js';

const fmtTime = (s) => `${Math.floor(s / 3600)} 時 ${Math.floor((s % 3600) / 60)} 分 ${s % 60} 秒`;
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('zh-TW', { hour12: false }) : '—');

function summary() {
  const explorable = ZONES.filter((z) => !z.hidden && z.interactionType !== 'none');
  return {
    nickname: progress.nickname || '（未設定）',
    exploredCount: progress.explored.length,
    explorableCount: explorable.length,
    explored: progress.explored.map((id) => getZone(id)?.name || id),
    quests: QUESTS.map((q) => ({ id: q.id, name: q.name, done: !!progress.quests[q.id]?.done, at: progress.quests[q.id]?.at || '' })),
    points: progress.points,
    badge: progress.badge ? BADGE : '',
    quizBest: progress.quiz.best,
    quizLast: progress.quiz.last,
    quizAttempts: progress.quiz.attempts,
    wrong: progress.quiz.wrong,
    findFound: progress.findFound.map((i) => FIND_TARGETS[i]?.prompt),
    borrowCompleted: progress.borrowCompleted,
    timeSec: progress.timeSec,
    startedAt: progress.startedAt,
    lastStudy: progress.lastStudy,
  };
}

function toCSV(s) {
  const rows = [
    ['項目', '內容'],
    ['暱稱', s.nickname],
    ['探索區域數', `${s.exploredCount}/${s.explorableCount}`],
    ['探索過的區域', s.explored.join('、')],
    ['積分', s.points],
    ['徽章', s.badge],
    ...s.quests.map((q) => [`關卡：${q.name}`, q.done ? `完成 ${fmtDate(q.at)}` : '未完成']),
    ['測驗最佳分數', s.quizBest ?? ''],
    ['測驗最近分數', s.quizLast ?? ''],
    ['測驗次數', s.quizAttempts],
    ...s.wrong.map((w, i) => [`錯誤題目 ${i + 1}`, `${w.q}（正解：${w.answer}）`]),
    ['認識空間已找到', s.findFound.join('、')],
    ['完成模擬借書次數', s.borrowCompleted],
    ['探索時間', fmtTime(s.timeSec)],
    ['開始時間', fmtDate(s.startedAt)],
    ['最近學習時間', fmtDate(s.lastStudy)],
  ];
  return '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

function printReport(s) {
  const root = document.getElementById('print-root');
  root.innerHTML = `<h1>楊梅高中圖書館 3D 探索島｜學習成果</h1>
    <p>列印時間：${fmtDate(new Date().toISOString())}</p>
    <table>
      <tr><th>暱稱</th><td>${esc(s.nickname)}</td></tr>
      <tr><th>積分／徽章</th><td>${s.points} 分 ${esc(s.badge)}</td></tr>
      <tr><th>探索區域</th><td>${s.exploredCount}/${s.explorableCount}：${esc(s.explored.join('、'))}</td></tr>
      <tr><th>完成關卡</th><td>${s.quests.filter((q) => q.done).map((q) => esc(q.name)).join('、') || '—'}</td></tr>
      <tr><th>測驗</th><td>最佳 ${s.quizBest ?? '—'} 分、最近 ${s.quizLast ?? '—'} 分、共 ${s.quizAttempts} 次</td></tr>
      <tr><th>錯誤題目</th><td>${s.wrong.map((w) => `${esc(w.q)}（正解：${esc(w.answer)}）`).join('<br>') || '—'}</td></tr>
      <tr><th>模擬借書</th><td>${s.borrowCompleted} 次</td></tr>
      <tr><th>探索時間</th><td>${fmtTime(s.timeSec)}</td></tr>
      <tr><th>最近學習</th><td>${fmtDate(s.lastStudy)}</td></tr>
    </table>`;
  window.print();
}

export function openRecord() {
  const s = summary();
  const doneQ = s.quests.filter((q) => q.done).length;
  const box = openModal('📒 學習歷程', `
    <div class="row"><div class="field" style="flex:1;min-width:200px"><label for="rec-nick">暱稱</label><input id="rec-nick" maxlength="20" value="${esc(progress.nickname)}" placeholder="輸入暱稱（僅存於本機）"></div>
      <button class="btn primary" id="rec-save">儲存暱稱</button></div>
    <div class="stat-grid">
      <div class="stat">積分<b>${s.points}</b></div>
      <div class="stat">完成關卡<b>${doneQ}/${QUESTS.length}</b></div>
      <div class="stat">探索區域<b>${s.exploredCount}/${s.explorableCount}</b></div>
      <div class="stat">測驗最佳<b>${s.quizBest ?? '—'}</b></div>
      <div class="stat">模擬借書<b>${s.borrowCompleted} 次</b></div>
      <div class="stat">探索時間<b style="font-size:1rem">${fmtTime(s.timeSec)}</b></div>
    </div>
    ${s.badge ? `<div class="badge-big"><div class="medal">🏅</div><b>${esc(s.badge)}</b></div>` : ''}
    <div class="card-section"><h4>完成的關卡</h4>${s.quests.map((q) => `<div>${q.done ? '✅' : '⬜'} ${esc(q.name)} ${q.done ? `<small>（${fmtDate(q.at)}）</small>` : ''}</div>`).join('')}</div>
    <div class="card-section"><h4>探索過的區域</h4><p>${esc(s.explored.join('、')) || '尚未探索，點擊 3D 模型中的區域試試！'}</p></div>
    <div class="card-section"><h4>錯誤題目</h4>${s.wrong.length ? s.wrong.map((w) => `<div>• ${esc(w.q)} <small>（正解：${esc(w.answer)}）</small></div>`).join('') : '<p>沒有錯題紀錄。</p>'}</div>
    <p style="font-size:.88rem;color:var(--ink-2)">開始時間：${fmtDate(s.startedAt)}｜最近學習：${fmtDate(s.lastStudy)}｜資料僅儲存在此瀏覽器（localStorage），不會上傳。</p>
    <div class="row">
      <button class="btn" id="rec-json">⬇ 匯出 JSON</button>
      <button class="btn" id="rec-csv">⬇ 匯出 CSV</button>
      <button class="btn" id="rec-print">🖨 列印學習成果</button>
      <button class="btn" id="rec-restart">🔁 重新開始（保留暱稱）</button>
      <button class="btn danger" id="rec-clear">🗑 清除紀錄</button>
    </div>`);
  box.querySelector('#rec-save').addEventListener('click', () => {
    progress.nickname = box.querySelector('#rec-nick').value.trim().slice(0, 20);
    saveProgress();
    toast('暱稱已儲存', 'ok');
  });
  const stamp = new Date().toISOString().slice(0, 10);
  box.querySelector('#rec-json').addEventListener('click', () => download(`library-record-${stamp}.json`, JSON.stringify({ summary: summary(), raw: progress }, null, 2)));
  box.querySelector('#rec-csv').addEventListener('click', () => download(`library-record-${stamp}.csv`, toCSV(summary()), 'text/csv;charset=utf-8'));
  box.querySelector('#rec-print').addEventListener('click', () => printReport(summary()));
  box.querySelector('#rec-restart').addEventListener('click', () => {
    if (!confirm('重新開始會清除關卡、測驗與探索紀錄（保留暱稱），確定嗎？')) return;
    resetProgress(true);
    openRecord();
  });
  box.querySelector('#rec-clear').addEventListener('click', () => {
    if (!confirm('確定清除全部學習紀錄（含暱稱）？此動作無法復原。')) return;
    resetProgress(false);
    openRecord();
  });
}
