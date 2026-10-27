// 由樓層資料產生雙層圖書館（樓板、外牆、窗、屋頂、各場域物件、點選區、標籤）
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { WORLD, PLAN } from '../data/config.js';
import { ZONES, CATEGORY_META } from '../data/zones.js';
import { FLOOR1_WALL_GAPS } from '../data/floor1-layout.js';
import { FLOOR2_WALL_GAPS, FLOOR2_STAIR_OPENING } from '../data/floor2-layout.js';
import { buildZone } from './furniture.js';
import { box, mat, rectW, signPlane } from './kit.js';
import { pxToWorld } from '../core/coords.js';

const OUT = rectW(PLAN.outline);

function mergeGroup(g) {
  g.updateMatrixWorld(true);
  const byMat = new Map();
  const keep = [];
  g.traverse((o) => {
    if (!o.isMesh) return;
    if (o.material.map || o.userData.noMerge) {
      keep.push(o);
      return;
    }
    const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
    if (!byMat.has(o.material)) byMat.set(o.material, []);
    byMat.get(o.material).push(geo);
  });
  const out = new THREE.Group();
  out.name = g.name;
  byMat.forEach((geos, material) => {
    const merged = mergeGeometries(geos, false);
    geos.forEach((x) => x.dispose());
    if (!merged) return;
    const m = new THREE.Mesh(merged, material);
    m.castShadow = !material.transparent;
    m.receiveShadow = true;
    out.add(m);
  });
  keep.forEach((o) => {
    o.updateMatrixWorld(true);
    const clone = o.clone();
    o.matrixWorld.decompose(clone.position, clone.quaternion, clone.scale);
    out.add(clone);
  });
  return out;
}

function contentBox(g) {
  const b = new THREE.Box3();
  g.updateMatrixWorld(true);
  g.traverse((o) => {
    if (o.isMesh && !o.userData.footprint) b.expandByObject(o);
  });
  return b;
}

function booksMesh(books) {
  if (!books.length) return null;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.7, flatShading: true }), books.length);
  const d = new THREE.Object3D();
  const c = new THREE.Color();
  books.forEach((b, i) => {
    d.position.set(b.x, b.y, b.z);
    d.rotation.set(b.rx || 0, 0, b.rz || 0);
    d.scale.set(b.sx, b.sy, b.sz);
    d.updateMatrix();
    m.setMatrixAt(i, d.matrix);
    m.setColorAt(i, c.set(b.color));
  });
  m.castShadow = false;
  m.receiveShadow = true;
  return m;
}

// 外牆：依缺口切段，並在牆面加上窗帶
function outerWalls(floor, gaps) {
  const g = new THREE.Group();
  const T = 0.3;
  const H = WORLD.wallHeight;
  const wallMat = mat(floor === 1 ? '#f4efe6' : '#f7f2ea');
  const glass = mat('#8ecae6', { transparent: true, opacity: 0.55, roughness: 0.15, emissive: '#000000' });
  glass.userData.isWindow = true;
  const sides = {
    north: { a: OUT.minX, b: OUT.maxX, fixed: OUT.minZ, axis: 'x' },
    south: { a: OUT.minX, b: OUT.maxX, fixed: OUT.maxZ, axis: 'x' },
    west: { a: OUT.minZ, b: OUT.maxZ, fixed: OUT.minX, axis: 'z' },
    east: { a: OUT.minZ, b: OUT.maxZ, fixed: OUT.maxX, axis: 'z' },
  };
  Object.entries(sides).forEach(([side, s]) => {
    const gp = gaps
      .filter((x) => x.side === side)
      .map((x) => (s.axis === 'x' ? [pxToWorld(x.from, 0).x, pxToWorld(x.to, 0).x] : [pxToWorld(0, x.from).z, pxToWorld(0, x.to).z]));
    let cur = s.a;
    const segs = [];
    gp.forEach(([a, b]) => {
      segs.push([cur, a]);
      cur = b;
    });
    segs.push([cur, s.b]);
    segs.forEach(([a, b]) => {
      const len = b - a;
      if (len <= 0.05) return;
      const mid = (a + b) / 2;
      if (s.axis === 'x') g.add(box(len + T, H, T, wallMat, mid, 0, s.fixed));
      else g.add(box(T, H, len, wallMat, s.fixed, 0, mid));
      // 窗帶（每 4 m 一扇）
      const n = Math.floor(len / 4);
      for (let i = 0; i < n; i++) {
        const c = a + (len / n) * (i + 0.5);
        const w = Math.min(2.6, len / n - 0.8);
        const off = side === 'north' || side === 'west' ? -T / 2 - 0.02 : T / 2 + 0.02;
        const win = s.axis === 'x' ? box(w, 1.5, 0.06, glass, c, 1.1, s.fixed + off) : box(0.06, 1.5, w, glass, s.fixed + off, 1.1, c);
        win.castShadow = false;
        g.add(win);
      }
    });
  });
  return g;
}

function slab(floor) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  const pad = 0.15;
  shape.moveTo(OUT.minX - pad, -(OUT.minZ - pad));
  shape.lineTo(OUT.maxX + pad, -(OUT.minZ - pad));
  shape.lineTo(OUT.maxX + pad, -(OUT.maxZ + pad));
  shape.lineTo(OUT.minX - pad, -(OUT.maxZ + pad));
  shape.closePath();
  if (floor === 2) {
    const o = rectW(FLOOR2_STAIR_OPENING);
    const hole = new THREE.Path();
    hole.moveTo(o.minX, -o.minZ);
    hole.lineTo(o.minX, -o.maxZ);
    hole.lineTo(o.maxX, -o.maxZ);
    hole.lineTo(o.maxX, -o.minZ);
    hole.closePath();
    shape.holes.push(hole);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: WORLD.slabThickness, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2); // shape 的 y → 世界 -z；擠出方向 → +y
  geo.translate(0, -WORLD.slabThickness, 0);
  const m = new THREE.Mesh(geo, [mat(floor === 1 ? '#efe3cf' : '#ece0cc', { flatShading: false }), mat('#c9b99f')]);
  m.receiveShadow = true;
  m.castShadow = floor === 2;
  g.add(m);
  return g;
}

function roof() {
  const g = new THREE.Group();
  g.add(box(OUT.w + 1.2, 0.35, OUT.d + 1.2, '#5c7c8a', OUT.x, WORLD.wallHeight, OUT.z));
  g.add(box(OUT.w + 1.3, 0.5, 0.25, '#e9c46a', OUT.x, WORLD.wallHeight + 0.35, OUT.minZ - 0.5));
  g.add(box(OUT.w + 1.3, 0.5, 0.25, '#e9c46a', OUT.x, WORLD.wallHeight + 0.35, OUT.maxZ + 0.5));
  g.add(box(0.25, 0.5, OUT.d + 1.2, '#e9c46a', OUT.minX - 0.5, WORLD.wallHeight + 0.35, OUT.z));
  g.add(box(0.25, 0.5, OUT.d + 1.2, '#e9c46a', OUT.maxX + 0.5, WORLD.wallHeight + 0.35, OUT.z));
  // 屋頂設備與綠化
  g.add(box(3, 1, 2, '#adb5bd', OUT.minX + 6, WORLD.wallHeight + 0.35, OUT.minZ + 4));
  g.add(box(10, 0.15, 5, '#7cb518', OUT.x + 4, WORLD.wallHeight + 0.35, OUT.z));
  const sign = signPlane('楊梅高中圖書館', 9, 1.4, { bg: '#ffffff', fg: '#1d3557', border: '#e9c46a' });
  sign.position.set(OUT.x - 2, WORLD.wallHeight + 0.95, OUT.maxZ + 0.66);
  g.add(sign);
  return g;
}

// 樓層展開／完整建築時只顯示的主要標籤（避免擁擠）
const MAJOR_LABELS = new Set([
  'f1-entrance', 'f1-counter', 'f1-opac', 'f1-meigao', 'f1-machines', 'f1-newbooks', 'f1-sdgs', 'f1-discussion',
  'f1-stairs', 'f1-office', 'f1-magazine-1', 'f2-stacks', 'f2-reading-center', 'f2-stairs', 'f2-discussion-w', 'f2-discussion-e',
]);

function makeLabel(zone) {
  const el = document.createElement('button');
  el.className = MAJOR_LABELS.has(zone.id) ? 'zone-label major' : 'zone-label';
  el.type = 'button';
  el.dataset.zone = zone.id;
  el.style.setProperty('--c', CATEGORY_META[zone.category]?.color || '#333');
  el.textContent = zone.name;
  const obj = new CSS2DObject(el);
  obj.userData.zoneId = zone.id;
  return obj;
}

const pickMat = new THREE.MeshBasicMaterial({ visible: false });

export class LibraryModel {
  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'library';
    this.floors = {};
    this.zoneObjects = new Map();
    this.pickables = [];
    [1, 2].forEach((f) => {
      const fg = new THREE.Group();
      fg.name = `floor-${f}`;
      fg.position.y = f === 1 ? 0 : WORLD.floorHeight;
      const walls = outerWalls(f, f === 1 ? FLOOR1_WALL_GAPS : FLOOR2_WALL_GAPS);
      const s = slab(f);
      const zonesGroup = new THREE.Group();
      fg.add(s, walls, zonesGroup);
      const entry = { group: fg, walls, slab: s, zonesGroup, labels: new THREE.Group() };
      fg.add(entry.labels);
      if (f === 2) {
        entry.roof = roof();
        fg.add(entry.roof);
      }
      this.floors[f] = entry;
      this.root.add(fg);
      this.buildZones(f);
    });
  }

  buildZones(floor) {
    const entry = this.floors[floor];
    // 清除舊物件
    [...entry.zonesGroup.children].forEach((c) => {
      entry.zonesGroup.remove(c);
      c.traverse((o) => o.isInstancedMesh && o.geometry.dispose());
    });
    [...entry.labels.children].forEach((c) => {
      c.element?.remove();
      entry.labels.remove(c);
    });
    for (const [id, zo] of this.zoneObjects) if (zo.zone.floor === floor) this.zoneObjects.delete(id);
    this.pickables = this.pickables.filter((p) => p.userData.floor !== floor);

    const ctx = { books: [] };
    ZONES.filter((z) => z.floor === floor).forEach((zone) => {
      const raw = buildZone(zone, ctx);
      const cb = contentBox(raw);
      const merged = mergeGroup(raw);
      merged.userData.zoneId = zone.id;
      entry.zonesGroup.add(merged);
      const r = rectW(zone.px);
      const top = cb.isEmpty() ? 0.2 : Math.max(0.15, cb.max.y);
      const pick = new THREE.Mesh(new THREE.BoxGeometry(r.w, top, r.d), pickMat);
      pick.position.set(r.x, top / 2, r.z);
      pick.userData = { zoneId: zone.id, floor, area: r.w * r.d };
      if (zone.interactionType !== 'none') {
        entry.zonesGroup.add(pick);
        this.pickables.push(pick);
      }
      let label = null;
      if (!zone.hidden && zone.interactionType !== 'none') {
        label = makeLabel(zone);
        label.position.set(r.x, top + 0.5, r.z);
        entry.labels.add(label);
      }
      this.zoneObjects.set(zone.id, { zone, group: merged, pick, label, contentBox: cb, top, rect: r });
    });
    const bm = booksMesh(ctx.books);
    if (bm) entry.zonesGroup.add(bm);
  }

  rebuildAll() {
    [1, 2].forEach((f) => this.buildZones(f));
  }
}
