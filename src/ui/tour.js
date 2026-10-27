// 自動導覽：依序飛到各空間並語音解說
import { AUTO_TOUR } from '../data/tour-paths.js';
import { speak, stopSpeak } from '../core/audio.js';
import { settings } from '../core/store.js';
import { emit, on } from '../core/events.js';
import { startTask, endTask, activeTask } from './task.js';

let sm;
let running = false;
let idx = 0;
let timer = null;

function step() {
  if (!running) return;
  if (idx >= AUTO_TOUR.length) return stop();
  const s = AUTO_TOUR[idx];
  sm.handleZoneClick(s.zoneId);
  startTask({
    title: `🧭 自動導覽 ${idx + 1}/${AUTO_TOUR.length}`,
    text: s.say,
    buttons: [
      { label: '⏭ 下一站', onClick: next },
      { label: '⏹ 停止', onClick: stop },
    ],
    isTour: true,
    onCancel: stop,
  });
  const ms = Math.max(4500, s.say.length * 230) / (settings.animSpeed || 1);
  let advanced = false;
  const go = () => {
    if (advanced) return;
    advanced = true;
    clearTimeout(timer);
    timer = setTimeout(next, 600);
  };
  // 有語音時於朗讀結束後前進，否則依文字長度計時
  if (!speak(s.say, { force: settings.voice, onend: go })) timer = setTimeout(go, ms);
  else timer = setTimeout(go, ms + 8000);
}

function next() {
  clearTimeout(timer);
  idx++;
  step();
}

export function startTour() {
  running = true;
  idx = 0;
  if (sm.mode === 'full') sm.setMode('interior');
  emit('tour', true);
  step();
}

export function stop() {
  running = false;
  clearTimeout(timer);
  stopSpeak();
  if (activeTask()?.isTour) endTask();
  emit('tour', false);
}

export function toggleTour() {
  if (running) stop();
  else startTour();
}

export function initTour(sceneManager) {
  sm = sceneManager;
  on('modal', (open) => open && running && stop());
}
