// DOM 小工具：元素建立、Toast、對話框、慶祝動畫
import { sfx } from '../core/audio.js';
import { emit } from '../core/events.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function toast(msg, type = '', ms = 2600) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('#toast-root').appendChild(el);
  setTimeout(() => el.remove(), ms);
}

let modalOnClose = null;
export function openModal(title, html, { onClose, wide } = {}) {
  closeModal(true);
  $('#modal-title').textContent = title;
  const c = $('#modal-content');
  if (typeof html === 'string') c.innerHTML = html;
  else {
    c.innerHTML = '';
    c.appendChild(html);
  }
  $('#modal .modal-box').style.width = wide ? 'min(1100px, 100%)' : '';
  $('#modal').hidden = false;
  modalOnClose = onClose || null;
  $('#modal .modal-close').focus();
  emit('modal', true);
  return c;
}

export function closeModal(silent = false) {
  if ($('#modal').hidden) return;
  $('#modal').hidden = true;
  const fn = modalOnClose;
  modalOnClose = null;
  if (!silent) fn?.();
  emit('modal', false);
}

export function initModal() {
  $('#modal .modal-close').addEventListener('click', () => closeModal());
  $('#modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

export function celebrate(text, { sound = 'win' } = {}) {
  sfx(sound);
  const colors = ['#ffb703', '#fb8500', '#2f6fdf', '#00a3a3', '#e5484d', '#8338ec', '#3fa36b'];
  const reduce = document.body.classList.contains('perf-saver');
  const n = reduce ? 0 : 70;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
    c.style.animationDelay = `${Math.random() * 0.4}s`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3800);
  }
  if (text) {
    const w = document.createElement('div');
    w.className = 'celebrate';
    w.innerHTML = `<div>${esc(text)}</div>`;
    document.body.appendChild(w);
    setTimeout(() => w.remove(), 1900);
  }
}

export function download(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}
