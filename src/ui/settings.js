// 七大顯示與操作設定（立即生效並存入 localStorage）
import { openModal, toast } from './dom.js';
import { settings, setSetting } from '../core/store.js';
import { applyI18n } from '../core/i18n.js';
import { on } from '../core/events.js';

let sm;

export function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

export async function toggleFullscreen(force) {
  const want = force ?? !isFullscreen();
  try {
    if (want && !isFullscreen()) {
      const el = document.documentElement;
      await (el.requestFullscreen?.() || el.webkitRequestFullscreen?.());
    } else if (!want && isFullscreen()) {
      await (document.exitFullscreen?.() || document.webkitExitFullscreen?.());
    }
  } catch {
    toast('此瀏覽器不支援全螢幕', 'warn');
  }
}

export function applySettings() {
  const b = document.body;
  const touch = settings.device === 'touch' || (settings.device === 'auto' && matchMedia('(pointer: coarse)').matches);
  b.classList.toggle('touch', touch);
  ['standard', 'focus', 'simple'].forEach((l) => b.classList.toggle(`layout-${l}`, settings.layout === l));
  document.documentElement.classList.toggle('fs-large', settings.fontSize === 'large');
  document.documentElement.classList.toggle('fs-xlarge', settings.fontSize === 'xlarge');
  b.classList.toggle('perf-saver', settings.performance === 'saver');
  applyI18n();
  if (sm) {
    sm.controls.rotateSpeed = touch ? 0.7 : 1;
    sm.controls.zoomSpeed = touch ? 0.8 : 1;
    requestAnimationFrame(() => sm.resize());
  }
}

const OPTIONS = [
  { key: 'fullscreen', label: '全螢幕', desc: '進入或離開全螢幕', opts: [[true, '開'], [false, '關']] },
  { key: 'sound', label: '音效', desc: '點擊與答題回饋音效', opts: [[true, '開'], [false, '關']] },
  { key: 'device', label: '裝置模式', desc: '觸控模式會放大按鈕', opts: [['auto', '自動'], ['desktop', '電腦'], ['touch', '觸控']] },
  { key: 'layout', label: '版面', desc: '專注＝隱藏目錄；簡潔＝隱藏目錄與資訊卡', opts: [['standard', '標準'], ['focus', '專注'], ['simple', '簡潔']] },
  { key: 'lang', label: '語言', desc: '英文為預留版本（僅介面文字）', opts: [['zh-TW', '繁體中文'], ['en', 'English']] },
  { key: 'fontSize', label: '字體', desc: '調整全站文字大小', opts: [['standard', '標準'], ['large', '大'], ['xlarge', '特大']] },
  { key: 'performance', label: '動畫效能', desc: '省電：關閉陰影、30 FPS、停止背景動畫', opts: [['high', '高'], ['standard', '標準'], ['saver', '省電']] },
];

export function openSettings() {
  const cur = (k) => (k === 'fullscreen' ? isFullscreen() : settings[k]);
  const box = openModal('⚙️ 顯示與操作設定', `
    ${OPTIONS.map((o) => `<div class="set-row"><div class="sl">${o.label}<small>${o.desc}</small></div>
      <div class="seg" role="group" aria-label="${o.label}">${o.opts.map(([v, l]) => `<button data-k="${o.key}" data-v='${JSON.stringify(v)}' class="${cur(o.key) === v ? 'active' : ''}">${l}</button>`).join('')}</div></div>`).join('')}
    <p style="font-size:.85rem;color:var(--ink-2)">設定會自動儲存在此瀏覽器。</p>`);
  box.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-k]');
    if (!btn) return;
    const k = btn.dataset.k;
    const v = JSON.parse(btn.dataset.v);
    if (k === 'fullscreen') await toggleFullscreen(v);
    else setSetting(k, v);
    box.querySelectorAll(`[data-k="${k}"]`).forEach((b) => b.classList.toggle('active', b === btn));
    if (k === 'lang' && v === 'en') toast('English UI is a preview; learning content remains in Traditional Chinese.', '', 3500);
  });
}

export function initSettings(sceneManager) {
  sm = sceneManager;
  on('settings', ({ key, value }) => {
    if (key === 'performance') sm.applyPerformance(value);
    applySettings();
  });
  applySettings();
}
