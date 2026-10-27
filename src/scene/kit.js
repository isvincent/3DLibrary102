// 共用建模工具：材質快取、方塊、文字貼圖、平面座標換算
import * as THREE from 'three';
import { pxToWorld } from '../core/coords.js';

const matCache = new Map();

export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.02, flatShading: true, ...opts }));
  }
  return matCache.get(key);
}

const boxGeo = new THREE.BoxGeometry(1, 1, 1);

// 以「底面中心」放置方塊：y 為底面高度
export function box(w, h, d, color, x, y, z, opts) {
  const m = new THREE.Mesh(boxGeo, color instanceof THREE.Material ? color : mat(color, opts));
  m.scale.set(w, h, d);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// 平面圖 px 矩形 → 世界範圍
export function rectW(px) {
  const a = pxToWorld(px[0], px[1]);
  const b = pxToWorld(px[2], px[3]);
  return {
    minX: a.x, maxX: b.x, minZ: a.z, maxZ: b.z,
    x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, w: b.x - a.x, d: b.z - a.z,
  };
}

export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function textTexture(text, { bg = '#ffffff', fg = '#1d3557', w = 512, h = 128, font = 'bold 64px "Noto Sans TC", "Microsoft JhengHei", sans-serif', border } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  if (border) {
    g.strokeStyle = border;
    g.lineWidth = Math.max(4, h * 0.06);
    g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth);
  }
  g.fillStyle = fg;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lines = String(text).split('\n');
  const lh = h / (lines.length + 0.4);
  lines.forEach((ln, i) => g.fillText(ln, w / 2, lh * (i + 0.7)));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// 立牌（雙面文字板）
export function signPlane(text, width, height, opts = {}) {
  const tex = textTexture(text, { w: 512, h: Math.round((512 * height) / width), ...opts });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  return m;
}

export const BOOK_COLORS = ['#d1495b', '#edae49', '#00798c', '#30638e', '#003d5b', '#8d6a9f', '#5b8e7d', '#f4a259', '#bc4b51', '#3d5a80', '#e07a5f', '#81b29a', '#f2cc8f', '#6d597a'];
