// 2D 平面圖 ↔ 3D 世界座標轉換（唯一來源）
// 標準化平面座標：左上 (0,0)、右下 (1,1)；圖片上方 = 場景北側 = 世界 -Z，右方 = 東側 = 世界 +X。
import { PLAN, WORLD } from '../data/config.js';

export function pxToNorm(x, y) {
  return { u: x / PLAN.width, v: y / PLAN.height };
}

export function pxRect(x1, y1, x2, y2) {
  return { x: x1 / PLAN.width, y: y1 / PLAN.height, w: (x2 - x1) / PLAN.width, h: (y2 - y1) / PLAN.height };
}

export function normToWorld(u, v) {
  return { x: (u - 0.5) * WORLD.width, z: (v - 0.5) * WORLD.depth };
}

export function worldToNorm(x, z) {
  return { u: x / WORLD.width + 0.5, v: z / WORLD.depth + 0.5 };
}

export function pxToWorld(x, y) {
  const n = pxToNorm(x, y);
  return normToWorld(n.u, n.v);
}

// mapBounds（標準化）→ 世界中心點與尺寸
export function boundsToWorld(b) {
  const c = normToWorld(b.x + b.w / 2, b.y + b.h / 2);
  return { x: c.x, z: c.z, w: b.w * WORLD.width, d: b.h * WORLD.depth };
}

// 世界平面範圍 → mapBounds（標準化），供驗證模式反算
export function worldBoxToBounds(minX, minZ, maxX, maxZ) {
  const a = worldToNorm(minX, minZ);
  const b = worldToNorm(maxX, maxZ);
  return { x: a.u, y: a.v, w: b.u - a.u, h: b.v - a.v };
}

export function boundsIoU(a, b) {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}

// 樓層底面高度（含爆炸圖分離距離）
export function floorBaseY(floor, explode = 0) {
  return floor === 1 ? 0 : WORLD.floorHeight + explode;
}
