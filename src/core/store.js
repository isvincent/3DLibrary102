// 偏好設定與學習歷程（localStorage）
import { emit } from './events.js';

const SETTINGS_KEY = 'ymsh-lib-settings';
const PROGRESS_KEY = 'ymsh-lib-progress';

export const DEFAULT_SETTINGS = {
  sound: true,
  device: 'auto', // auto | desktop | touch
  layout: 'standard', // standard | focus | simple
  lang: 'zh-TW', // zh-TW | en
  fontSize: 'standard', // standard | large | xlarge
  performance: 'standard', // high | standard | saver
  labels: true,
  voice: false,
  animSpeed: 1, // 0.5 | 1 | 1.5 | 2
  night: false,
  autoRotate: false,
};

function read(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v && typeof v === 'object' ? v : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 隱私模式等情況下忽略 */
  }
}

export const settings = { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) };

export function setSetting(key, value) {
  settings[key] = value;
  write(SETTINGS_KEY, settings);
  emit('settings', { key, value });
}

function freshProgress() {
  const now = new Date().toISOString();
  return {
    nickname: '',
    explored: [],
    quests: {},
    points: 0,
    quiz: { best: null, last: null, attempts: 0, wrong: [] },
    findFound: [],
    rulesAnswered: {},
    borrowCompleted: 0,
    badge: false,
    timeSec: 0,
    startedAt: now,
    lastStudy: now,
  };
}

export const progress = { ...freshProgress(), ...read(PROGRESS_KEY, {}) };

export function saveProgress() {
  progress.lastStudy = new Date().toISOString();
  write(PROGRESS_KEY, progress);
  emit('progress', progress);
}

export function markExplored(zoneId) {
  if (!progress.explored.includes(zoneId)) {
    progress.explored.push(zoneId);
    saveProgress();
  }
}

export function resetProgress(keepNickname = false) {
  const nick = progress.nickname;
  Object.keys(progress).forEach((k) => delete progress[k]);
  Object.assign(progress, freshProgress());
  if (keepNickname) progress.nickname = nick;
  saveProgress();
}

// 探索時間：分頁可見時每 5 秒累計一次
let tick = 0;
setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  progress.timeSec += 5;
  tick += 1;
  if (tick % 6 === 0) write(PROGRESS_KEY, progress);
}, 5000);
window.addEventListener('beforeunload', () => write(PROGRESS_KEY, progress));
