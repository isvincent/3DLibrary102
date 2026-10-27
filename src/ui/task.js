// 「點擊 3D 區域」型任務的共用執行器（單元 1 找找看、探險任務、借書模擬共用）
import { $, esc } from './dom.js';
import { on } from '../core/events.js';
import { sfx } from '../core/audio.js';
import { getZone } from '../data/zones.js';

let current = null;

function render() {
  const hud = $('#task-hud');
  document.querySelectorAll('.zone-label.target').forEach((el) => el.classList.remove('target'));
  if (!current) {
    hud.hidden = true;
    hud.innerHTML = '';
    return;
  }
  hud.hidden = false;
  hud.innerHTML = `
    <div class="th-title">${esc(current.title)}</div>
    <div class="th-text">${esc(current.text)}</div>
    <div class="th-row">
      ${(current.buttons || []).map((b, i) => `<button class="btn sm ${b.cls || ''}" data-tb="${i}">${esc(b.label)}</button>`).join('')}
      <button class="btn sm" data-tb="cancel">結束</button>
      ${current.feedback ? `<span class="th-fb" style="font-weight:700;color:${current.feedback.ok ? 'var(--good)' : 'var(--bad)'}">${esc(current.feedback.msg)}</span>` : ''}
    </div>`;
  hud.querySelectorAll('[data-tb]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const k = btn.dataset.tb;
      if (k === 'cancel') {
        const c = current;
        endTask();
        c?.onCancel?.();
      } else current.buttons[+k].onClick?.();
    }),
  );
  if (current.hintZones && current.showHint) {
    current.hintZones.forEach((id) => document.querySelector(`.zone-label[data-zone="${id}"]`)?.classList.add('target'));
  }
}

export function startTask(task) {
  current = { ...task, feedback: null };
  render();
}

export function updateTask(patch) {
  if (!current) return;
  Object.assign(current, patch);
  render();
}

export function endTask() {
  current = null;
  render();
}

export function activeTask() {
  return current;
}

on('zone:click', (zone) => {
  if (!current?.accept) return;
  const res = current.accept(zone);
  if (res === true) {
    sfx('ok');
    const t = current;
    current.feedback = { ok: true, msg: `✔ 正確！這是「${zone.name}」` };
    render();
    t.onSuccess?.(zone);
  } else if (res === false) {
    sfx('bad');
    current.feedback = { ok: false, msg: `✘ 這是「${zone.name}」，再找找看！` };
    current.misses = (current.misses || 0) + 1;
    if (current.misses >= 2 && current.hintZones) current.showHint = true;
    render();
    current.onWrong?.(zone);
  }
});

export function zoneName(id) {
  return getZone(id)?.name || id;
}
