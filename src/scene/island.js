// 漂浮式 Low-poly 島嶼與戶外環境
import * as THREE from 'three';
import { box, mat, seeded, signPlane, rectW } from './kit.js';
import { PLAN } from '../data/config.js';
import { pxToWorld } from '../core/coords.js';

const OUT = rectW(PLAN.outline);
const DOOR_X = pxToWorld(973, 0).x;

function tree(rand) {
  const g = new THREE.Group();
  const h = 1.6 + rand() * 1.4;
  g.add(box(0.35, h, 0.35, '#7f5539', 0, 0, 0));
  const leaf = mat(['#4caf50', '#43a047', '#66bb6a', '#2e7d32'][Math.floor(rand() * 4)]);
  const kind = rand();
  if (kind < 0.5) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.5 + rand(), 3 + rand() * 1.5, 6), leaf);
    c.position.y = h + 1.4;
    c.castShadow = true;
    g.add(c);
  } else {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 + rand() * 0.8, 0), leaf);
    s.position.y = h + 1.1;
    s.castShadow = true;
    g.add(s);
  }
  return g;
}

function student(color) {
  const g = new THREE.Group();
  g.add(box(0.36, 0.7, 0.24, '#2b2d42', 0, 0, 0));
  g.add(box(0.44, 0.6, 0.28, color, 0, 0.7, 0));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mat('#f1c27d'));
  head.position.y = 1.5;
  head.castShadow = true;
  g.add(head);
  g.add(box(0.42, 0.12, 0.42, '#3d2c1e', 0, 1.62, 0));
  return g;
}

export function buildIsland() {
  const g = new THREE.Group();
  g.name = 'island';
  const rand = seeded(20251026);
  const RX = 33;
  const RZ = 25;

  // 草地頂面
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.2, 14), mat('#8bc34a'));
  top.scale.set(RX, 1, RZ);
  top.position.y = -0.95;
  top.receiveShadow = true;
  g.add(top);
  const dirt = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.96, 1.4, 14), mat('#a1887f'));
  dirt.scale.set(RX, 1, RZ);
  dirt.position.y = -2.2;
  g.add(dirt);
  // 懸浮岩塊
  const rockGeo = new THREE.ConeGeometry(1, 1, 14, 3);
  const pos = rockGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < 0.49) {
      pos.setX(i, pos.getX(i) * (0.85 + rand() * 0.3));
      pos.setZ(i, pos.getZ(i) * (0.85 + rand() * 0.3));
    }
  }
  rockGeo.computeVertexNormals();
  const rock = new THREE.Mesh(rockGeo, mat('#795548'));
  rock.rotation.x = Math.PI;
  rock.scale.set(RX * 0.96, 14, RZ * 0.96);
  rock.position.y = -2.9 - 7;
  g.add(rock);

  // 校園路面（建築周邊）
  g.add(box(OUT.w + 4, 0.06, OUT.d + 4, '#d6ccc2', OUT.x, -0.36, OUT.z));
  // 入口步道與廣場
  const pathLen = RZ - OUT.maxZ - 1;
  g.add(box(4, 0.08, pathLen, '#e9d8a6', DOOR_X, -0.34, OUT.maxZ + pathLen / 2 + 1));
  for (let i = 0; i < pathLen / 1.2; i++) g.add(box(4.1, 0.02, 0.08, '#cdb47b', DOOR_X, -0.25, OUT.maxZ + 2 + i * 1.2));
  g.add(box(9, 0.07, 5, '#e9d8a6', DOOR_X, -0.34, OUT.maxZ + 6));

  // 校園導覽看板
  const board = new THREE.Group();
  board.add(box(0.15, 2.2, 0.15, '#5d4037', -1.4, 0, 0));
  board.add(box(0.15, 2.2, 0.15, '#5d4037', 1.4, 0, 0));
  const bp = signPlane('楊梅高中\n圖書館 3D 探索島', 3, 1.4, { bg: '#fefae0', fg: '#283618', border: '#bc6c25', font: 'bold 56px "Noto Sans TC", sans-serif' });
  bp.position.y = 2;
  board.add(bp);
  board.position.set(DOOR_X + 6, -0.3, OUT.maxZ + 6.5);
  board.rotation.y = -0.35;
  g.add(board);
  // 指示牌
  const sign = new THREE.Group();
  sign.add(box(0.12, 1.8, 0.12, '#6d4c41', 0, 0, 0));
  const sp = signPlane('← 圖書館大門', 1.8, 0.45, { bg: '#e76f51', fg: '#fff', font: 'bold 56px "Noto Sans TC", sans-serif' });
  sp.position.y = 1.6;
  sign.add(sp);
  sign.position.set(DOOR_X - 3.2, -0.3, OUT.maxZ + 9);
  g.add(sign);

  // 樹木
  const keepOut = (x, z) =>
    (x > OUT.minX - 3 && x < OUT.maxX + 3 && z > OUT.minZ - 3 && z < OUT.maxZ + 3) ||
    (Math.abs(x - DOOR_X) < 6 && z > OUT.maxZ) ||
    (x / RX) ** 2 + (z / RZ) ** 2 > 0.82;
  let placed = 0;
  for (let i = 0; i < 400 && placed < 46; i++) {
    const x = (rand() * 2 - 1) * RX;
    const z = (rand() * 2 - 1) * RZ;
    if (keepOut(x, z)) continue;
    const t = tree(rand);
    t.position.set(x, -0.35, z);
    t.scale.setScalar(0.8 + rand() * 0.5);
    g.add(t);
    placed++;
  }
  // 花圃
  const flowerColors = ['#ff6b6b', '#ffd93d', '#f78fb3', '#c084fc', '#ffffff'];
  [[-1, 1], [1, 1]].forEach(([sx]) => {
    const fx = DOOR_X + sx * 4.2;
    g.add(box(2.4, 0.35, 5, '#6d4c41', fx, -0.35, OUT.maxZ + 3.5));
    for (let i = 0; i < 26; i++) {
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), mat(flowerColors[i % flowerColors.length]));
      f.position.set(fx + (rand() - 0.5) * 2.1, 0.12, OUT.maxZ + 1.2 + rand() * 4.6);
      g.add(f);
    }
  });
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2;
    const r = 0.88 + rand() * 0.07;
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6 + rand() * 0.5, 0), mat('#558b2f'));
    bush.position.set(Math.cos(a) * RX * r, -0.1, Math.sin(a) * RZ * r);
    bush.castShadow = true;
    g.add(bush);
  }

  // 微型學生（沿步道往返）
  const walkers = [];
  ['#e63946', '#457b9d', '#f4a261', '#2a9d8f'].forEach((c, i) => {
    const s = student(c);
    s.scale.setScalar(0.85);
    s.position.set(DOOR_X + (i % 2 ? 1 : -1), -0.3, OUT.maxZ + 3 + i * 3);
    g.add(s);
    walkers.push({ obj: s, phase: i * 1.7, lane: i % 2 ? 1 : -1 });
  });

  // 雲
  const clouds = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const p = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + rand() * 1.2, 0), mat('#ffffff', { transparent: true, opacity: 0.92 }));
      p.position.set(j * 2 - 2, rand() * 0.6, rand());
      c.add(p);
    }
    c.position.set((rand() * 2 - 1) * 60, 18 + rand() * 10, (rand() * 2 - 1) * 45);
    c.userData.speed = 0.4 + rand() * 0.6;
    clouds.add(c);
  }
  g.add(clouds);

  // 星空（夜間）
  const starGeo = new THREE.BufferGeometry();
  const sp2 = [];
  for (let i = 0; i < 500; i++) {
    const th = rand() * Math.PI * 2;
    const ph = rand() * Math.PI * 0.45;
    const R = 160;
    sp2.push(R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph), R * Math.sin(ph) * Math.sin(th));
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp2, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.8, sizeAttenuation: true }));
  stars.visible = false;
  g.add(stars);

  // 戶外路燈
  const lamps = [];
  [-1, 1].forEach((sx) => {
    [6, 13].forEach((dz) => {
      const l = new THREE.Group();
      l.add(box(0.12, 3, 0.12, '#37474f', 0, 0, 0));
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), mat('#fff3b0', { emissive: '#ffd166', emissiveIntensity: 0.2 }));
      bulb.position.y = 3.1;
      l.add(bulb);
      l.position.set(DOOR_X + sx * 2.6, -0.3, OUT.maxZ + dz);
      g.add(l);
      lamps.push(bulb);
    });
  });

  const update = (t, dt) => {
    walkers.forEach((w) => {
      const p = (Math.sin(t * 0.25 + w.phase) + 1) / 2;
      const z = OUT.maxZ + 2.5 + p * (RZ - OUT.maxZ - 5);
      const dir = Math.cos(t * 0.25 + w.phase);
      w.obj.position.z = z;
      w.obj.position.x = DOOR_X + w.lane * 1.1;
      w.obj.rotation.y = dir > 0 ? 0 : Math.PI;
      w.obj.position.y = -0.3 + Math.abs(Math.sin(t * 6 + w.phase)) * 0.06;
    });
    clouds.children.forEach((c) => {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 70) c.position.x = -70;
    });
  };

  return { group: g, update, stars, lamps };
}
