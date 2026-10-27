// 左側：樓層切換、空間關鍵字搜尋、空間目錄
import { $, $$, esc } from './dom.js';
import { ZONES, CATEGORY_META } from '../data/zones.js';
import { on } from '../core/events.js';
import { progress } from '../core/store.js';
import { DISCLAIMER } from '../data/config.js';

let filterFloor = 'all';
let query = '';
let activeId = null;

function matches(z, q) {
  if (!q) return true;
  const hay = [z.name, z.description, ...(z.keywords || []), CATEGORY_META[z.category]?.label, `${z.floor}f`, `${z.floor}樓`].join(' ').toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
}

export function searchZones(q) {
  return ZONES.filter((z) => !z.hidden && z.interactionType !== 'none' && matches(z, q));
}

function render() {
  const list = $('#zone-list');
  // 有搜尋字詞時搜尋全館，不受樓層篩選限制
  const zones = searchZones(query).filter((z) => query || filterFloor === 'all' || z.floor === +filterFloor);
  if (!zones.length) {
    list.innerHTML = `<p class="zl-empty">找不到「${esc(query)}」相關的空間，試試「借書」、「影印」、「書架」。</p>`;
    return;
  }
  const groups = {};
  zones.forEach((z) => (groups[z.category] ||= []).push(z));
  list.innerHTML = Object.entries(groups)
    .map(
      ([cat, zs]) => `
      <div class="zl-group" style="--c:${CATEGORY_META[cat]?.color}">
        <h3><span class="dot"></span>${esc(CATEGORY_META[cat]?.label || cat)}</h3>
        ${zs
          .map(
            (z) => `<button class="zl-item ${z.id === activeId ? 'active' : ''}" data-zone="${z.id}">
              <span class="fl">${z.floor}F</span><span>${esc(z.name)}</span>
              ${progress.explored.includes(z.id) ? '<span class="seen" title="已探索">✔</span>' : ''}
            </button>`,
          )
          .join('')}
      </div>`,
    )
    .join('');
}

export function initSidebar(sm) {
  $('#disclaimer').textContent = DISCLAIMER;
  $('#zone-list').addEventListener('click', (e) => {
    const id = e.target.closest('.zl-item')?.dataset.zone;
    if (!id) return;
    sm.handleZoneClick(id);
    document.body.classList.remove('side-open');
  });
  const input = $('#zone-search');
  input.addEventListener('input', () => {
    query = input.value.trim();
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = $('#zone-list .zl-item');
      if (first) first.click();
    }
  });
  $$('.floor-switch button').forEach((b) =>
    b.addEventListener('click', () => {
      filterFloor = b.dataset.floor;
      if (filterFloor === 'all') {
        if (['f1', 'f2', 'interior'].includes(sm.mode)) sm.setMode('explode');
      } else sm.setFloor(+filterFloor);
      syncFloorButtons(sm);
      render();
    }),
  );
  $('#sidebar-toggle').addEventListener('click', () => document.body.classList.toggle('side-open'));
  document.addEventListener('pointerdown', (e) => {
    if (document.body.classList.contains('side-open') && !e.target.closest('#sidebar') && !e.target.closest('#sidebar-toggle')) {
      document.body.classList.remove('side-open');
    }
  });
  on('zone:select', (z) => {
    activeId = z?.id || null;
    render();
  });
  on('progress', render);
  on('mode', () => syncFloorButtons(sm));
  syncFloorButtons(sm);
  render();
}

function syncFloorButtons(sm) {
  const showsBoth = ['full', 'explode'].includes(sm.mode);
  const cur = showsBoth && filterFloor === 'all' ? 'all' : String(sm.floor);
  if (!showsBoth) filterFloor = String(sm.floor);
  $$('.floor-switch button').forEach((b) => b.classList.toggle('active', b.dataset.floor === (showsBoth ? filterFloor : cur)));
}

export function refreshSidebar() {
  render();
}
