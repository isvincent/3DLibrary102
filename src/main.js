// 進入點：建立 3D 場景並串接所有介面模組
import './style.css';
import { SceneManager } from './scene/SceneManager.js';
import { WORLD } from './data/config.js';
import { settings, setSetting } from './core/store.js';
import { on } from './core/events.js';
import { t } from './core/i18n.js';
import { sfx, speechSupported, stopSpeak } from './core/audio.js';
import { $, $$, initModal, toast } from './ui/dom.js';
import { initSidebar } from './ui/sidebar.js';
import { initInfoCard } from './ui/infocard.js';
import { initCompare } from './ui/compare.js';
import { initValidate } from './ui/validate.js';
import { initSettings, openSettings, toggleFullscreen, isFullscreen } from './ui/settings.js';
import { initTour, toggleTour } from './ui/tour.js';
import { activeTask } from './ui/task.js';
import { initUnits, openLearn } from './learning/units.js';
import { initBorrow, startBorrow } from './learning/borrow.js';
import { initQuests, openQuests } from './learning/quests.js';
import { openRecord } from './learning/record.js';

const MODE_HINT = {
  full: '完整建築：拖曳旋轉、滾輪縮放，點擊建築進入室內',
  explode: '樓層展開：上層 2F、下層 1F，可調整分離距離',
  f1: '一樓俯視：點擊各區域查看介紹',
  f2: '二樓俯視：10 排書架與閱讀區',
  interior: '室內探索：點擊空間，鏡頭自動移到安全視角',
  compare: '2D／3D 對照：點平面圖或 3D 區域互相同步',
  validate: '配置驗證：平面圖疊合與方位檢查',
};

function boot() {
  initModal();
  const sm = new SceneManager($('#canvas-host'));
  window.__library = sm; // 方便除錯與自動化測試

  initSettings(sm);
  initSidebar(sm);
  initInfoCard(sm);
  initCompare(sm);
  initValidate(sm);
  initUnits(sm);
  initBorrow(sm);
  initQuests(sm);
  initTour(sm);

  // 模式分頁
  $$('#mode-tabs [data-mode]').forEach((b) =>
    b.addEventListener('click', () => {
      sfx();
      const m = b.dataset.mode;
      if (m === 'f1' || m === 'f2') sm.floor = m === 'f1' ? 1 : 2;
      sm.setMode(m);
    }),
  );
  const explodeRange = $('#explode-range');
  explodeRange.max = WORLD.explodeMax;
  explodeRange.value = sm.explode;
  explodeRange.addEventListener('input', () => sm.setExplode(+explodeRange.value));
  on('mode', ({ mode, floor }) => {
    $$('#mode-tabs [data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
    const floorTxt = ['interior', 'compare', 'validate'].includes(mode) ? `｜${floor}F` : '';
    $('#mode-badge').textContent = `${t(`mode.${mode}`)}${floorTxt}`;
    $('#mode-badge').title = MODE_HINT[mode];
    $('#explode-ctrl').hidden = mode !== 'explode';
  });
  // 初始模式事件已在建構時送出，補一次同步
  $$('#mode-tabs [data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === sm.mode));
  $('#mode-badge').textContent = t(`mode.${sm.mode}`);
  $('#explode-ctrl').hidden = sm.mode !== 'explode';

  // 頂部按鈕
  $$('[data-open]').forEach((b) =>
    b.addEventListener('click', () => {
      sfx();
      ({ learn: () => openLearn(), quest: openQuests, record: openRecord, settings: openSettings })[b.dataset.open]();
    }),
  );
  on('borrow:start', startBorrow);

  // 工具列
  const speeds = [0.5, 1, 1.5, 2];
  const press = (act, v) => $(`#toolbar [data-act="${act}"]`)?.setAttribute('aria-pressed', String(!!v));
  const syncToolbar = () => {
    press('rotate', settings.autoRotate);
    press('night', settings.night);
    press('labels', settings.labels);
    press('voice', settings.voice);
    press('saver', settings.performance === 'saver');
    press('fullscreen', isFullscreen());
    $('#speed-val').textContent = `${settings.animSpeed}×`;
  };
  const actions = {
    home: () => sm.home(),
    bird: () => sm.birdView(),
    rotate: () => {
      setSetting('autoRotate', !settings.autoRotate);
      sm.setAutoRotate(settings.autoRotate);
    },
    night: () => {
      setSetting('night', !settings.night);
      sm.setNight(settings.night);
    },
    labels: () => {
      setSetting('labels', !settings.labels);
      sm.setLabels(settings.labels);
    },
    tour: () => toggleTour(),
    voice: () => {
      if (!speechSupported) return toast('此瀏覽器不支援語音解說', 'warn');
      setSetting('voice', !settings.voice);
      if (!settings.voice) stopSpeak();
      toast(settings.voice ? '語音解說已開啟：點擊區域會朗讀介紹' : '語音解說已關閉');
    },
    speed: () => {
      const i = speeds.indexOf(settings.animSpeed);
      setSetting('animSpeed', speeds[(i + 1) % speeds.length]);
      toast(`動畫速度 ${settings.animSpeed}×`);
    },
    saver: () => {
      setSetting('performance', settings.performance === 'saver' ? 'standard' : 'saver');
      toast(settings.performance === 'saver' ? '手機省電模式：已關閉陰影並降低畫面更新率' : '已恢復標準效能');
    },
    fullscreen: () => toggleFullscreen(),
  };
  $$('#toolbar [data-act]').forEach((b) =>
    b.addEventListener('click', () => {
      sfx();
      actions[b.dataset.act]();
      syncToolbar();
    }),
  );
  on('tour', (v) => press('tour', v));
  on('settings', syncToolbar);
  document.addEventListener('fullscreenchange', syncToolbar);
  syncToolbar();

  // 滑鼠懸停提示
  const tip = $('#hover-tip');
  const host = $('#viewport');
  let lastXY = [0, 0];
  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    lastXY = [e.clientX - r.left, e.clientY - r.top];
    tip.style.left = `${lastXY[0]}px`;
    tip.style.top = `${lastXY[1]}px`;
  });
  on('zone:hover', (z) => {
    tip.hidden = !z;
    if (z) tip.textContent = `${z.floor}F｜${z.name}`;
  });

  // 點擊資訊檢索區電腦：直接開啟模擬查詢（任務進行中則不打斷）
  on('zone:click', (z) => {
    if (z.id === 'f1-opac' && !activeTask()) setTimeout(() => openLearn('opac'), 650);
  });

  // 鍵盤快捷鍵
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select') || !$('#modal').hidden) return;
    const map = { 1: 'full', 2: 'explode', 3: 'f1', 4: 'f2', 5: 'interior', 6: 'compare', 7: 'validate' };
    if (map[e.key]) {
      if (e.key === '3' || e.key === '4') sm.floor = e.key === '3' ? 1 : 2;
      sm.setMode(map[e.key]);
    }
    if (e.key === 'h' || e.key === 'H') sm.home();
    if (e.key === '/') {
      e.preventDefault();
      $('#zone-search').focus();
    }
  });

  requestAnimationFrame(() => $('#loading').classList.add('done'));
  setTimeout(() => ($('#loading').hidden = true), 600);
}

try {
  boot();
} catch (err) {
  console.error(err);
  const l = document.getElementById('loading');
  l.textContent = `3D 場景載入失敗：${err.message}（請確認瀏覽器支援 WebGL）`;
}
