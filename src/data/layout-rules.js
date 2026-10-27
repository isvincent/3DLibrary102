// 空間配置方位規則（需求書第十四節），驗證模式與 scripts/check-layout.mjs 共用
import { ZONES, getZone } from './zones.js';
import { PLAN } from './config.js';
import { STAIR_GEOMETRY } from './tour-paths.js';

const center = (b) => ({ u: b.x + b.w / 2, v: b.y + b.h / 2 });
const zb = (id) => getZone(id)?.mapBounds;
const TOL = 0.01;

// 依需求書第十四節逐項檢查（使用目前資料，含人工校正後的值）
export const RULES = [
  { floor: 1, text: '大門位於圖面下方中央', test: () => { const c = center(zb('f1-entrance')); return c.u > 0.4 && c.u < 0.6 && c.v > 0.9; } },
  { floor: 1, text: '樓梯位於右下角', test: () => { const c = center(zb('f1-stairs')); return c.u > 0.75 && c.v > 0.8; } },
  { floor: 1, text: '討論室位於左上角', test: () => { const b = zb('f1-discussion'); return b.x < 0.05 && b.y < 0.05 && center(b).u < 0.5; } },
  { floor: 1, text: '梅高特藏區位於右上角', test: () => { const c = center(zb('f1-meigao')); return c.u > 0.85 && c.v < 0.4; } },
  { floor: 1, text: '行政辦公室位於右下區域', test: () => { const c = center(zb('f1-office')); return c.u > 0.6 && c.v > 0.5; } },
  { floor: 1, text: '借還書櫃台位於行政辦公室左側', test: () => { const a = zb('f1-counter'); const o = zb('f1-office'); return a.x + a.w <= o.x + TOL && a.y < o.y + o.h && a.y + a.h > o.y; } },
  { floor: 1, text: '資訊檢索區位於行政辦公室上方', test: () => { const a = zb('f1-opac'); const o = zb('f1-office'); return a.y + a.h <= o.y + TOL && a.x < o.x + o.w && a.x + a.w > o.x; } },
  { floor: 1, text: '新書展示區位於圖面下方偏左的中央', test: () => { const c = center(zb('f1-newbooks')); return c.u > 0.2 && c.u < 0.5 && c.v > 0.75; } },
  { floor: 1, text: 'SDGs 專區位於討論室下方、閱讀區上方', test: () => { const s = zb('f1-sdgs'); const d = zb('f1-discussion'); const r = zb('f1-reading-a'); return s.y >= d.y + d.h - TOL && s.y + s.h <= r.y + TOL; } },
  { floor: 2, text: '十排書架位於圖面上半部且為縱向排列', test: () => { const s = ZONES.filter((z) => z.kind === 'bookshelf'); return s.length === 10 && s.every((z) => center(z.mapBounds).v < 0.5 && z.mapBounds.h * PLAN.height > z.mapBounds.w * PLAN.width); } },
  { floor: 2, text: '書架由西向東依序排列、間距一致', test: () => { const xs = ZONES.filter((z) => z.kind === 'bookshelf').map((z) => center(z.mapBounds).u); const gaps = xs.slice(1).map((x, i) => x - xs[i]); return gaps.every((g) => g > 0 && Math.abs(g - gaps[0]) < 0.01); } },
  { floor: 2, text: '左右兩側討論室位於圖面上方', test: () => { const w = center(zb('f2-discussion-w')); const e = center(zb('f2-discussion-e')); return w.u < 0.1 && w.v < 0.2 && e.u > 0.9 && e.v < 0.2; } },
  { floor: 2, text: '中央閱讀區保留 3 列 × 2 組配置', test: () => { const z = getZone('f2-reading-center'); const c = center(z.mapBounds); return z.options.tables.length === 6 && c.u > 0.3 && c.u < 0.7 && c.v > 0.5; } },
  { floor: 2, text: '樓梯位於圖面右下側', test: () => { const c = center(zb('f2-stairs')); return c.u > 0.8 && c.v > 0.6; } },
  { floor: 2, text: '儲物室位於最右側靠下', test: () => { const b = zb('f2-storage'); return b.x + b.w > 0.97 && center(b).v > 0.7; } },
  { floor: 2, text: '南側閱讀桌位於圖面下方', test: () => [zb('f2-desk-sw'), zb('f2-desk-se')].every((b) => center(b).v > 0.9) },
  { floor: 0, text: '1F 樓梯上端與 2F 樓梯井垂直對齊', test: () => { const s = zb('f2-stairs'); const f = STAIR_GEOMETRY.flightB; const x1 = f.xEnd / PLAN.width; const x2 = f.xStart / PLAN.width; return x1 >= s.x - TOL && x1 <= s.x + s.w; } },
];

