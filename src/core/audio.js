// 音效（WebAudio 合成，免外部檔案）與語音解說（SpeechSynthesis）
import { settings } from './store.js';

let ctx = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const TONES = {
  click: [[660, 0.05]],
  ok: [[660, 0.08], [880, 0.12]],
  bad: [[300, 0.12], [220, 0.16]],
  win: [[523, 0.1], [659, 0.1], [784, 0.1], [1046, 0.22]],
};

export function sfx(name = 'click') {
  if (!settings.sound) return;
  const a = ac();
  if (!a) return;
  let t = a.currentTime;
  (TONES[name] || TONES.click).forEach(([f, d]) => {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + d + 0.02);
    t += d * 0.9;
  });
}

export const speechSupported = 'speechSynthesis' in window;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'zh-TW') || voices.find((v) => v.lang.startsWith('zh')) || null;
}

// force：使用者主動按下朗讀按鈕時，即使「語音解說」關閉也朗讀
export function speak(text, { force = false, onend } = {}) {
  if (!speechSupported || (!settings.voice && !force)) {
    onend?.();
    return false;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-TW';
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = Math.min(1.6, 0.85 + (settings.animSpeed - 1) * 0.3);
  if (onend) u.onend = onend;
  speechSynthesis.speak(u);
  return true;
}

export function stopSpeak() {
  if (speechSupported) speechSynthesis.cancel();
}
