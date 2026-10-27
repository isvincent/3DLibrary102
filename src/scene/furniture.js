// 依場域 kind 產生 3D 家具／設施（樓層區域座標，y=0 為該層地板）
import * as THREE from 'three';
import { box, mat, rectW, seeded, hashStr, signPlane, BOOK_COLORS } from './kit.js';
import { STAIR_GEOMETRY } from '../data/tour-paths.js';
import { WORLD } from '../data/config.js';
import { pxToWorld } from '../core/coords.js';

const WOOD = '#c99a6b';
const WOOD_DARK = '#8a5a3b';
const TABLE = '#e8d3b0';
const CHAIR = '#4f7cac';
const METAL = '#9aa5b1';
const SCREEN = '#16213e';

// ---------- 基本家具 ----------
function chair(g, x, z, angle, color = CHAIR) {
  const c = new THREE.Group();
  c.add(box(0.44, 0.06, 0.42, color, 0, 0.42, 0));
  c.add(box(0.44, 0.45, 0.06, color, 0, 0.48, 0.19));
  c.add(box(0.05, 0.42, 0.05, METAL, -0.18, 0, -0.16));
  c.add(box(0.05, 0.42, 0.05, METAL, 0.18, 0, -0.16));
  c.add(box(0.05, 0.42, 0.05, METAL, -0.18, 0, 0.16));
  c.add(box(0.05, 0.42, 0.05, METAL, 0.18, 0, 0.16));
  c.position.set(x, 0, z);
  c.rotation.y = angle;
  g.add(c);
}

function table(g, x, z, w, d, color = TABLE, h = 0.74) {
  g.add(box(w, 0.05, d, color, x, h - 0.05, z));
  const lx = w / 2 - 0.08;
  const lz = d / 2 - 0.08;
  [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].forEach(([a, b]) => g.add(box(0.06, h - 0.05, 0.06, WOOD_DARK, x + a, 0, z + b)));
}

// 沿長邊排列椅子；side = ±1 表示在桌子哪一側
function chairsAlong(g, t, side, along, spacing = 0.85) {
  const len = along === 'x' ? t.w : t.d;
  const n = Math.max(1, Math.floor((len - 0.3) / spacing));
  const start = -((n - 1) * spacing) / 2;
  for (let i = 0; i < n; i++) {
    const o = start + i * spacing;
    if (along === 'x') chair(g, t.x + o, t.z + side * (t.d / 2 + 0.32), side > 0 ? 0 : Math.PI);
    else chair(g, t.x + side * (t.w / 2 + 0.32), t.z + o, side > 0 ? Math.PI / 2 : -Math.PI / 2);
  }
}

function seatedTable(g, r, opts = {}) {
  const alongX = r.w >= r.d;
  const short = alongX ? r.d : r.w;
  const tDepth = Math.min(short * (opts.fill ? 0.55 : 0.42), 1.3);
  // 窄長區域：桌子靠一側、椅子放另一側，確保不超出配置範圍
  const narrow = (short - tDepth) / 2 < 0.45;
  const side = opts.side || 1;
  const off = narrow ? -side * Math.max(0, short / 2 - tDepth / 2 - 0.05) : 0;
  const t = alongX ? { x: r.x, z: r.z + off, w: r.w * 0.94, d: tDepth } : { x: r.x + off, z: r.z, w: tDepth, d: r.d * 0.94 };
  // 太長的桌面切成多張
  const len = alongX ? t.w : t.d;
  const segs = Math.max(1, Math.round(len / 3.6));
  const segLen = len / segs;
  for (let i = 0; i < segs; i++) {
    const o = -len / 2 + segLen * (i + 0.5);
    const tt = alongX ? { x: t.x + o, z: t.z, w: segLen - 0.25, d: t.d } : { x: t.x, z: t.z + o, w: t.w, d: segLen - 0.25 };
    table(g, tt.x, tt.z, tt.w, tt.d);
    const sides = narrow ? [side] : [-1, 1];
    sides.forEach((s) => chairsAlong(g, tt, s, alongX ? 'x' : 'z'));
  }
}

function floorTint(g, r, color, opacity = 1, y = 0.012) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), mat(color, { transparent: opacity < 1, opacity, flatShading: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(r.x, y, r.z);
  m.receiveShadow = true;
  m.userData.footprint = true;
  g.add(m);
  return m;
}

// 書本：寫入 ctx.books，最後以 InstancedMesh 一次繪製
function bookRow(ctx, rand, { x0, x1, z, y, depth, maxH = 0.3, axis = 'x', lean = 0 }) {
  let p = x0;
  while (p < x1 - 0.03) {
    const t = 0.025 + rand() * 0.035;
    const h = maxH * (0.62 + rand() * 0.38);
    const color = BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)];
    const cx = p + t / 2;
    if (axis === 'x') ctx.books.push({ x: cx, y: y + h / 2, z, sx: t, sy: h, sz: depth, color, rz: lean });
    else ctx.books.push({ x: z, y: y + h / 2, z: cx, sx: depth, sy: h, sz: t, color, rx: lean });
    p += t + (rand() < 0.08 ? 0.05 : 0.004);
  }
}

// ---------- 各類型 builder ----------
const builders = {
  door(z, g) {
    const r = rectW(z.px);
    const zWall = pxToWorld(0, 1110).z;
    const w = r.w;
    g.add(box(w, 0.25, 0.3, '#264653', r.x, 2.6, zWall - 0.1));
    g.add(box(0.15, 2.6, 0.3, '#264653', r.minX + 0.08, 0, zWall - 0.1));
    g.add(box(0.15, 2.6, 0.3, '#264653', r.maxX - 0.08, 0, zWall - 0.1));
    const glass = mat('#9ed8f5', { transparent: true, opacity: 0.45, roughness: 0.1 });
    g.add(box(w / 2 - 0.1, 2.5, 0.06, glass, r.x - w / 4 - 0.05, 0, zWall - 0.05));
    g.add(box(w / 2 - 0.1, 2.5, 0.06, glass, r.x + w / 4 + 0.05, 0, zWall - 0.05));
    // 門外腳踏墊屬地面裝飾，不列入配置比對
    const matMesh = box(w + 1.2, 0.04, 1.6, '#e76f51', r.x, 0, zWall + 1.1);
    matMesh.userData.footprint = true;
    g.add(matMesh);
    const sign = signPlane('圖書館 LIBRARY', 3.6, 0.6, { bg: '#264653', fg: '#ffffff', font: 'bold 60px "Noto Sans TC", sans-serif' });
    sign.position.set(r.x, 3.15, zWall + 0.06);
    g.add(sign);
  },
  sideDoor(z, g) {
    const r = rectW(z.px);
    const zc = r.z;
    g.add(box(r.w * 0.9, 2.3, 0.08, '#6c584c', r.x, 0, zc));
    g.add(box(r.w, 0.15, 0.18, '#264653', r.x, 2.3, zc));
  },
  room(z, g, ctx) {
    const r = rectW(z.px);
    floorTint(g, r, z.floor === 1 ? '#f6e7d3' : '#f1e4d2');
    const T = 0.12;
    const H = 2.7;
    const wallMat = mat('#fdf6ec');
    const doors = z.options.doors || [];
    const sides = {
      north: { a: r.minX, b: r.maxX, fixed: r.minZ, axis: 'x' },
      south: { a: r.minX, b: r.maxX, fixed: r.maxZ, axis: 'x' },
      west: { a: r.minZ, b: r.maxZ, fixed: r.minX, axis: 'z' },
      east: { a: r.minZ, b: r.maxZ, fixed: r.maxX, axis: 'z' },
    };
    Object.entries(sides).forEach(([side, s]) => {
      const gaps = doors
        .filter((d) => d.side === side)
        .map((d) => {
          const p1 = pxToWorld(d.from, d.from);
          const p2 = pxToWorld(d.to, d.to);
          return s.axis === 'x' ? [p1.x, p2.x] : [p1.z, p2.z];
        })
        .sort((a, b) => a[0] - b[0]);
      let cur = s.a;
      const segs = [];
      gaps.forEach(([ga, gb]) => {
        if (ga > cur) segs.push([cur, ga]);
        cur = Math.max(cur, gb);
      });
      if (cur < s.b) segs.push([cur, s.b]);
      segs.forEach(([a, b]) => {
        const len = b - a;
        if (len < 0.05) return;
        const m = s.axis === 'x' ? box(len, H, T, wallMat, (a + b) / 2, 0, s.fixed) : box(T, H, len, wallMat, s.fixed, 0, (a + b) / 2);
        m.userData.roomWall = true;
        g.add(m);
      });
      gaps.forEach(([ga, gb]) => {
        const m = s.axis === 'x' ? box(gb - ga, 0.3, T, '#d9c3a5', (ga + gb) / 2, H - 0.3, s.fixed) : box(T, 0.3, gb - ga, '#d9c3a5', s.fixed, H - 0.3, (ga + gb) / 2);
        m.userData.roomWall = true;
        g.add(m);
      });
    });
    const f = z.options.furniture;
    const inner = { ...r, w: r.w - 0.6, d: r.d - 0.6 };
    if (f === 'discussion') {
      // 兩組長形討論桌 + 白板
      const t1 = { x: r.x - r.w * 0.18, z: r.z, w: r.w * 0.3, d: 1.4 };
      const t2 = { x: r.x + r.w * 0.22, z: r.z, w: r.w * 0.3, d: 1.4 };
      [t1, t2].forEach((t) => {
        table(g, t.x, t.z, t.w, t.d, '#f0e2c8');
        chairsAlong(g, t, -1, 'x', 0.9);
        chairsAlong(g, t, 1, 'x', 0.9);
      });
      g.add(box(3, 1.2, 0.05, '#ffffff', r.x + r.w * 0.05, 0.9, r.minZ + 0.1));
    } else if (f === 'smallDiscussion') {
      const t = { x: r.x, z: r.z + 0.2, w: Math.min(inner.w * 0.45, 0.8), d: Math.min(inner.d * 0.5, 1.6) };
      table(g, t.x, t.z, t.w, t.d, '#f0e2c8');
      chairsAlong(g, t, -1, 'z', 0.7);
      chairsAlong(g, t, 1, 'z', 0.7);
    } else if (f === 'office') {
      const rand = seeded(hashStr(z.id));
      for (let i = 0; i < 4; i++) {
        const x = r.minX + 2.2 + i * (r.w - 4) / 3;
        table(g, x, r.z - 1.2, 1.6, 0.8, '#ddc7a4');
        g.add(box(0.5, 0.35, 0.05, SCREEN, x, 0.74, r.z - 1.45));
        chair(g, x, r.z - 0.5, 0, '#7b6d8d');
      }
      for (let i = 0; i < 6; i++) g.add(box(0.9, 1.8, 0.45, rand() > 0.5 ? '#b8c4d0' : '#c9b79c', r.minX + 1 + i * 1.05, 0, r.maxZ - 0.4));
      g.add(box(2.4, 0.74, 1.1, '#ddc7a4', r.maxX - 2, 0, r.z + 1.5));
    } else if (f === 'storage') {
      for (let i = 0; i < 3; i++) g.add(box(0.5, 2, inner.d * 0.8, '#a1866f', r.minX + 0.6 + i * 0.75, 0, r.z));
      g.add(box(0.5, 0.5, 0.5, '#d4a373', r.maxX - 0.5, 0, r.maxZ - 0.6));
    }
  },
  screen(z, g) {
    const r = rectW(z.px);
    const facing = z.options.facing || 'south';
    const screenMat = mat(SCREEN, { emissive: '#1f6feb', emissiveIntensity: 0.35 });
    if (facing === 'south' || facing === 'north') {
      const w = r.w * 0.9;
      g.add(box(w, 0.08, r.d * 0.6, '#555', r.x, 0, r.z));
      g.add(box(0.12, 1.1, 0.12, METAL, r.x, 0, r.z));
      g.add(box(w, w * 0.18, 0.1, screenMat, r.x, 1.1, r.z));
    } else {
      const d = r.d * 0.9;
      g.add(box(r.w * 0.6, 0.08, d, '#555', r.x, 0, r.z));
      g.add(box(0.12, 1.1, 0.12, METAL, r.x, 0, r.z));
      g.add(box(0.1, Math.min(d * 0.55, 1.6), d, screenMat, r.x, 1.1, r.z));
    }
  },
  tables(z, g) {
    const r = rectW(z.px);
    floorTint(g, r, '#e9f3e4', 0.9);
    seatedTable(g, r);
  },
  tableGrid(z, g) {
    const r = rectW(z.px);
    floorTint(g, r, '#e3eefb', 0.9);
    (z.options.tables || []).forEach((px) => {
      const t = rectW(px);
      const alongX = t.w >= t.d;
      const tt = alongX ? { x: t.x, z: t.z, w: t.w * 0.92, d: Math.min(t.d * 0.5, 1.3) } : { x: t.x, z: t.z, w: Math.min(t.w * 0.5, 1.3), d: t.d * 0.92 };
      table(g, tt.x, tt.z, tt.w, tt.d);
      chairsAlong(g, tt, -1, alongX ? 'x' : 'z');
      chairsAlong(g, tt, 1, alongX ? 'x' : 'z');
    });
  },
  carpet(z, g) {
    const r = rectW(z.px);
    floorTint(g, r, z.floor === 2 ? '#dbe7f5' : '#e6eef8', 1, 0.006);
  },
  cart(z, g) {
    const r = rectW(z.px);
    g.add(box(r.w * 0.7, 0.95, r.d * 0.6, '#5c677d', r.x, 0.08, r.z));
    for (let i = 0; i < 8; i++) g.add(box(0.03, 0.28, r.d * 0.45, '#222', r.x - r.w * 0.3 + i * (r.w * 0.6) / 7, 1.03, r.z));
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => g.add(box(0.08, 0.08, 0.08, '#111', r.x + sx * r.w * 0.3, 0, r.z + sz * r.d * 0.25))));
  },
  sdgs(z, g, ctx) {
    const r = rectW(z.px);
    floorTint(g, r, '#e8f6ee');
    const SDG = ['#e5243b', '#dda63a', '#4c9f38', '#c5192d', '#ff3a21', '#26bde2', '#fcc30b', '#a21942', '#fd6925', '#dd1367', '#fd9d24', '#bf8b2e', '#3f7e44', '#0a97d9', '#56c02b', '#00689d', '#19486a'];
    g.add(box(r.w * 0.96, 0.9, 0.5, '#f4f1de', r.x, 0, r.z + 0.15));
    const step = (r.w * 0.92) / SDG.length;
    SDG.forEach((c, i) => {
      const x = r.minX + r.w * 0.04 + step * (i + 0.5);
      g.add(box(step * 0.82, step * 0.82, 0.08, c, x, 1.3, r.z - 0.1));
    });
    g.add(box(r.w * 0.96, 0.06, 0.2, '#666', r.x, 1.25 + step * 0.82, r.z - 0.1));
    const rand = seeded(hashStr(z.id));
    bookRow(ctx, rand, { x0: r.minX + 0.4, x1: r.maxX - 0.4, z: r.z + 0.15, y: 0.9, depth: 0.22, maxH: 0.28 });
    const s = signPlane('SDGs 專區', 2.4, 0.5, { bg: '#19486a', fg: '#fff' });
    s.position.set(r.x, 2.45, r.z - 0.1);
    g.add(s);
  },
  newsRack(z, g) {
    const r = rectW(z.px);
    g.add(box(r.w * 0.8, 1.4, r.d * 0.9, '#7f5539', r.x, 0, r.z));
    for (let i = 0; i < 5; i++) g.add(box(0.06, 0.55, r.d * 0.75, i % 2 ? '#f1f1f1' : '#e0e0e0', r.x + r.w * 0.45, 0.4 + i * 0.15, r.z));
  },
  lockers(z, g) {
    const r = rectW(z.px);
    const cols = Math.floor(r.d / 0.5);
    const depth = Math.min(r.w * 0.45, 0.6);
    const x = r.minX + depth / 2 + 0.05;
    for (let i = 0; i < cols; i++) {
      const zz = r.minZ + 0.25 + i * (r.d - 0.5) / Math.max(1, cols - 1);
      for (let j = 0; j < 4; j++) {
        g.add(box(depth, 0.45, 0.46, j % 2 ? '#8ecae6' : '#219ebc', x, j * 0.47, zz));
        g.add(box(0.02, 0.05, 0.12, '#333', x + depth / 2 + 0.01, j * 0.47 + 0.2, zz + 0.12));
      }
    }
  },
  magazine(z, g, ctx) {
    const r = rectW(z.px);
    const rand = seeded(hashStr(z.id));
    g.add(box(r.w * 0.96, 1.25, r.d * 0.45, '#b08968', r.x, 0, r.z));
    [-1, 1].forEach((side) => {
      for (let lvl = 0; lvl < 3; lvl++) {
        const y = 0.25 + lvl * 0.35;
        for (let x = r.minX + 0.4; x < r.maxX - 0.4; x += 0.32) {
          const c = BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)];
          ctx.books.push({ x, y: y + 0.14, z: r.z + side * (r.d * 0.24), sx: 0.24, sy: 0.3, sz: 0.02, color: c, rx: side * -0.25 });
        }
      }
    });
  },
  flatDisplay(z, g, ctx) {
    const r = rectW(z.px);
    const rand = seeded(hashStr(z.id));
    table(g, r.x, r.z, r.w * 0.96, r.d * 0.7, '#deb887', 0.8);
    for (let x = r.minX + 0.4; x < r.maxX - 0.3; x += 0.42) {
      const c = BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)];
      ctx.books.push({ x, y: 0.82, z: r.z + (rand() - 0.5) * 0.2, sx: 0.22, sy: 0.04, sz: 0.3, color: c });
    }
  },
  board(z, g) {
    const r = rectW(z.px);
    const rand = seeded(hashStr(z.id));
    g.add(box(r.w, 1.3, 0.08, '#2a9d8f', r.x, 0.6, r.z));
    g.add(box(0.06, 0.6, 0.06, METAL, r.minX + 0.2, 0, r.z));
    g.add(box(0.06, 0.6, 0.06, METAL, r.maxX - 0.2, 0, r.z));
    for (let i = 0; i < Math.floor(r.w / 0.6); i++) {
      g.add(box(0.36, 0.45, 0.02, ['#fefae0', '#ffd6a5', '#caffbf', '#bde0fe'][Math.floor(rand() * 4)], r.minX + 0.4 + i * 0.6, 0.9 + rand() * 0.3, r.z + 0.05 * (rand() > 0.5 ? 1 : -1)));
    }
  },
  boardPair(z, g) {
    (z.options.boards || []).forEach((px, i) => builders.board({ ...z, id: z.id + i, px }, g));
    floorTint(g, rectW(z.px), '#f6f1e7', 0.6);
  },
  newBooks(z, g, ctx) {
    const r = rectW(z.px);
    const rand = seeded(hashStr(z.id));
    floorTint(g, r, '#fde2e4');
    g.add(box(r.w * 0.9, 0.4, r.d * 0.7, '#ffffff', r.x, 0, r.z));
    g.add(box(r.w * 0.8, 0.4, r.d * 0.45, '#f8edeb', r.x, 0.4, r.z));
    g.add(box(r.w * 0.6, 0.4, r.d * 0.22, '#fec5bb', r.x, 0.8, r.z));
    [0.4, 0.8, 1.2].forEach((y, lvl) => {
      const half = r.w * (0.43 - lvl * 0.1);
      for (let x = r.x - half + 0.2; x < r.x + half - 0.2; x += 0.45) {
        ctx.books.push({ x, y: y + 0.17, z: r.z + 0.05 - lvl * 0.02, sx: 0.26, sy: 0.34, sz: 0.04, color: BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)], rx: -0.2 });
      }
    });
    const s = signPlane('新書展示 NEW', 2.4, 0.45, { bg: '#e63946', fg: '#fff' });
    s.position.set(r.x, 1.95, r.z);
    g.add(s);
  },
  special(z, g, ctx) {
    const r = rectW(z.px);
    floorTint(g, r, '#fff1d6');
    const glass = mat('#cfe8f7', { transparent: true, opacity: 0.35 });
    g.add(box(r.w, 2.4, 0.06, glass, r.x, 0, r.maxZ));
    g.add(box(0.06, 2.4, r.d, glass, r.minX, 0, r.z));
    g.add(box(r.w, 2.4, 0.08, '#fdf6ec', r.x, 0, r.minZ));
    g.add(box(0.08, 2.4, r.d, '#fdf6ec', r.maxX, 0, r.z));
    const rand = seeded(hashStr(z.id));
    (z.options.shelves || []).forEach((px) => {
      const s = rectW(px);
      const alongX = s.w >= s.d;
      const depth = Math.min(alongX ? s.d : s.w, 0.55);
      const sx = alongX ? s.x : s.maxX - depth / 2;
      const sz = alongX ? s.minZ + depth / 2 : s.z;
      const len = alongX ? s.w : s.d;
      g.add(box(alongX ? len : depth, 2.1, alongX ? depth : len, '#6f4e37', sx, 0, sz));
      for (let lvl = 0; lvl < 5; lvl++) {
        const y = 0.12 + lvl * 0.4;
        const off = depth / 2 + 0.01;
        if (alongX) bookRow(ctx, rand, { x0: s.minX + 0.1, x1: s.maxX - 0.1, z: sz + off - 0.12, y, depth: 0.22, maxH: 0.33, axis: 'x' });
        else bookRow(ctx, rand, { x0: s.minZ + 0.1, x1: s.maxZ - 0.1, z: sx - off + 0.12, y, depth: 0.22, maxH: 0.33, axis: 'z' });
      }
    });
    // 展示櫃：畢業紀念冊
    g.add(box(1.4, 0.9, 0.7, '#c9a227', r.x - 0.6, 0, r.z + 1.5));
    g.add(box(1.3, 0.35, 0.6, mat('#e6f2ff', { transparent: true, opacity: 0.4 }), r.x - 0.6, 0.9, r.z + 1.5));
    const sg = signPlane('梅高特藏區', 2.2, 0.45, { bg: '#7b2cbf', fg: '#fff' });
    sg.position.set(r.x - 0.6, 2.3, r.maxZ + 0.05);
    g.add(sg);
  },
  copier(z, g) {
    const r = rectW(z.px);
    floorTint(g, r, '#fff3c4');
    g.add(box(0.9, 1.0, 0.75, '#e9ecef', r.x - 0.45, 0, r.z));
    g.add(box(0.9, 0.12, 0.75, '#adb5bd', r.x - 0.45, 1.0, r.z));
    g.add(box(0.3, 0.05, 0.2, '#2ec4b6', r.x - 0.2, 1.12, r.z + 0.25));
    g.add(box(0.6, 0.75, 0.55, '#dee2e6', r.x + 0.55, 0, r.z));
    g.add(box(0.55, 0.3, 0.5, '#495057', r.x + 0.55, 0.75, r.z));
    const s = signPlane('事務機器\n影印・列印・掃描', 1.4, 0.55, { bg: '#ffb703', fg: '#023047', font: 'bold 52px "Noto Sans TC", sans-serif' });
    s.position.set(r.x, 1.75, r.z - 0.2);
    g.add(s);
  },
  computers(z, g) {
    const r = rectW(z.px);
    floorTint(g, r, '#e0f4f4');
    g.add(box(r.w * 0.98, 0.05, 0.9, '#d4b483', r.x, 0.7, r.z + 0.2));
    g.add(box(r.w * 0.98, 0.7, 0.05, '#b08968', r.x, 0, r.z + 0.6));
    const screenMat = mat(SCREEN, { emissive: '#4cc9f0', emissiveIntensity: 0.45 });
    (z.options.computers || []).forEach((px) => {
      const c = rectW(px);
      g.add(box(0.08, 0.18, 0.08, '#333', c.x, 0.75, c.z + 0.25));
      g.add(box(0.62, 0.4, 0.05, screenMat, c.x, 0.9, c.z + 0.25));
      g.add(box(0.45, 0.02, 0.15, '#222', c.x, 0.75, c.z - 0.05));
      chair(g, c.x, r.minZ + 0.25, 0, '#2a9d8f');
    });
  },
  counter(z, g) {
    const r = rectW(z.px);
    floorTint(g, r, '#fff0d9');
    (z.options.legs || []).forEach((px) => {
      const l = rectW(px);
      g.add(box(l.w * 0.85, 1.05, l.d * 0.85, '#e09f3e', l.x, 0, l.z));
      g.add(box(l.w * 0.95, 0.06, l.d * 0.95, '#f4f1de', l.x, 1.05, l.z));
    });
    const a = rectW(z.options.legs[0]);
    g.add(box(0.5, 0.35, 0.05, SCREEN, a.x + 0.1, 1.11, a.z - 1.5));
    g.add(box(0.3, 0.08, 0.25, '#264653', a.x, 1.11, a.z));
    chair(g, a.maxX + 0.6, a.z - 1.5, -Math.PI / 2, '#9c6644');
    chair(g, a.maxX + 0.6, a.z + 1.2, -Math.PI / 2, '#9c6644');
    const s = signPlane('借還書櫃台', 2.2, 0.5, { bg: '#e09f3e', fg: '#fff' });
    s.rotation.y = -Math.PI / 2;
    s.position.set(a.minX - 0.02, 1.7, a.z);
    g.add(s);
  },
  stairs(z, g) {
    const r = rectW(z.px);
    floorTint(g, r, '#d8f3f0');
    const H = WORLD.floorHeight;
    const S = STAIR_GEOMETRY;
    const stepMat = mat('#c8d5e0');
    const flight = (f) => {
      const a = pxToWorld(f.xStart, f.y1);
      const b = pxToWorld(f.xEnd, f.y2);
      const n = 14;
      const dx = (b.x - a.x) / n;
      const width = Math.abs(b.z - a.z);
      const zc = (a.z + b.z) / 2;
      for (let i = 0; i < n; i++) {
        const y1 = (f.levelStart + ((f.levelEnd - f.levelStart) * (i + 1)) / n) * H;
        g.add(box(Math.abs(dx), y1, width, stepMat, a.x + dx * (i + 0.5), 0, zc));
      }
      // 扶手
      const yA = f.levelStart * H + 0.95;
      const yB = f.levelEnd * H + 0.95;
      const len = Math.hypot(b.x - a.x, yB - yA);
      const rail = box(len, 0.06, 0.06, '#e76f51', (a.x + b.x) / 2, (yA + yB) / 2 - 0.03, Math.min(a.z, b.z));
      rail.rotation.z = Math.atan2(yB - yA, b.x - a.x);
      g.add(rail);
    };
    flight(S.flightA);
    flight(S.flightB);
    const l1 = pxToWorld(S.landing.x1, S.landing.y1);
    const l2 = pxToWorld(S.landing.x2, S.landing.y2);
    g.add(box(l2.x - l1.x, S.landing.level * H, l2.z - l1.z, stepMat, (l1.x + l2.x) / 2, 0, (l1.z + l2.z) / 2));
    const s = signPlane('往 2F ↑', 1.4, 0.4, { bg: '#00a3a3', fg: '#fff' });
    s.position.set(r.minX + 0.6, 1.9, r.maxZ - 0.3);
    g.add(s);
  },
  stairwell(z, g) {
    const r = rectW(z.px);
    floorTint(g, r, '#d8f3f0');
    const rail = '#e76f51';
    const o = rectW([1712, 985, 1837, 1102]);
    g.add(box(o.w, 1, 0.06, rail, o.x, 0, o.minZ));
    g.add(box(0.06, 1, o.d, rail, o.maxX, 0, o.z));
    const s = signPlane('往 1F ↓', 1.4, 0.4, { bg: '#00a3a3', fg: '#fff' });
    s.position.set(r.x, 1.9, r.minZ + 0.4);
    g.add(s);
  },
  bookshelf(z, g, ctx) {
    const r = rectW(z.px);
    const rand = seeded(hashStr(z.id));
    floorTint(g, r, '#dce9f7');
    const depth = 0.9;
    const H = 2.1;
    const len = r.d * 0.96;
    g.add(box(depth, H, len, '#a47148', r.x, 0, r.z));
    g.add(box(depth + 0.1, 0.08, len + 0.1, WOOD_DARK, r.x, H, r.z));
    for (let lvl = 0; lvl < 6; lvl++) {
      const y = 0.1 + lvl * 0.34;
      [-1, 1].forEach((side) => {
        g.add(box(0.06, 0.03, len, WOOD, r.x + side * (depth / 2 + 0.01), y - 0.03, r.z));
        bookRow(ctx, rand, { x0: r.minZ + 0.1, x1: r.maxZ - 0.1, z: r.x + side * (depth / 2 - 0.1), y, depth: 0.2, maxH: 0.3, axis: 'z' });
      });
    }
    const sg = signPlane(`書架 ${z.options.index}`, 0.9, 0.32, { bg: '#1d3557', fg: '#fff' });
    sg.position.set(r.x, H + 0.32, r.maxZ + 0.02);
    g.add(sg);
  },
  marker(z, g) {
    const r = rectW(z.px);
    g.add(box(r.w, 0.25, r.d, '#264653', r.x, 0, r.z));
  },
};

export function buildZone(zone, ctx) {
  const g = new THREE.Group();
  g.name = zone.id;
  const fn = builders[zone.kind];
  if (fn) fn(zone, g, ctx);
  return g;
}
