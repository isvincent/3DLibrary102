// 模式 6：2D／3D 對照（2D 熱區與 3D 模型共用同一份 mapBounds）
import { $, esc } from './dom.js';
import { on } from '../core/events.js';
import { ZONES } from '../data/zones.js';
import { PLAN } from '../data/config.js';

let sm;
let activeId = null;

function renderPlan() {
  const floor = sm.floor;
  $('#compare-title').textContent = `${floor}F 原始平面配置圖`;
  const img = $('#plan-img');
  if (img.getAttribute('src') !== PLAN.images[floor]) img.src = PLAN.images[floor];
  const svg = $('#plan-svg');
  svg.innerHTML = ZONES.filter((z) => z.floor === floor && !z.hidden && z.interactionType !== 'none')
    .sort((a, b) => b.mapBounds.w * b.mapBounds.h - a.mapBounds.w * a.mapBounds.h)
    .map((z) => {
      const [x1, y1, x2, y2] = z.px;
      return `<rect class="plan-zone ${z.id === activeId ? 'active' : ''}" data-zone="${z.id}" x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" rx="6"><title>${esc(z.name)}</title></rect>`;
    })
    .join('');
}

function fitPlan() {
  const pane = $('#compare-pane');
  const wrap = $('#plan-wrap');
  const head = pane.querySelector('.compare-head');
  const availH = pane.clientHeight - head.offsetHeight - 8;
  const availW = pane.clientWidth - 8;
  const ratio = PLAN.width / PLAN.height;
  const w = Math.min(availW, availH * ratio);
  wrap.style.width = `${Math.max(120, w)}px`;
}

export function initCompare(sceneManager) {
  sm = sceneManager;
  $('#plan-svg').addEventListener('click', (e) => {
    const id = e.target.closest('.plan-zone')?.dataset.zone;
    if (id) sm.handleZoneClick(id);
  });
  on('mode', ({ mode }) => {
    const show = mode === 'compare';
    $('#compare-pane').hidden = !show;
    document.body.classList.toggle('split', show);
    if (show) {
      renderPlan();
      requestAnimationFrame(() => {
        fitPlan();
        sm.resize();
        // 版面分割後長寬比改變，重新計算鏡頭距離
        if (sm.selected) sm.focusZone(sm.selected);
        else sm.flyTo(sm.presetFor('compare'));
      });
    } else requestAnimationFrame(() => sm.resize());
  });
  on('zone:select', (z) => {
    activeId = z?.id || null;
    if (sm.mode === 'compare') {
      renderPlan();
      const el = document.querySelector(`.plan-zone[data-zone="${activeId}"]`);
      el?.scrollIntoView?.({ block: 'nearest' });
    }
  });
  new ResizeObserver(() => sm.mode === 'compare' && fitPlan()).observe($('#compare-pane'));
}
