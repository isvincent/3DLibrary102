// 空間配置驗證模式：平面圖半透明疊合、範圍框、方位規則檢查、人工座標校正
import * as THREE from 'three';
import { $, esc, toast, download } from './dom.js';
import { on } from '../core/events.js';
import { ZONES, getZone, setZoneOverride, clearZoneOverrides, getOverrides } from '../data/zones.js';
import { PLAN, WORLD } from '../data/config.js';
import { worldBoxToBounds } from '../core/coords.js';
import { RULES } from '../data/layout-rules.js';

let sm;
let overlayOpacity = 0.55;
let overlayHigh = true;
let selectedId = null;
const texCache = {};

const center = (b) => ({ u: b.x + b.w / 2, v: b.y + b.h / 2 });

// 模型實際幾何（不含地面色塊）→ 標準化範圍，與 mapBounds 比較
function zoneStatus(id) {
  const zo = sm.model.zoneObjects.get(id);
  if (!zo || zo.contentBox.isEmpty()) return { level: 'ok', inside: 1 };
  const cb = zo.contentBox;
  const g = worldBoxToBounds(cb.min.x, cb.min.z, cb.max.x, cb.max.z);
  const m = zo.zone.mapBounds;
  const ix = Math.max(0, Math.min(g.x + g.w, m.x + m.w) - Math.max(g.x, m.x));
  const iy = Math.max(0, Math.min(g.y + g.h, m.y + m.h) - Math.max(g.y, m.y));
  const inside = (ix * iy) / Math.max(1e-9, g.w * g.h);
  const c = center(g);
  const cIn = c.u >= m.x && c.u <= m.x + m.w && c.v >= m.y && c.v <= m.y + m.h;
  const level = !cIn ? 'bad' : inside >= 0.9 ? 'ok' : 'warn';
  return { level, inside, g };
}

const COLORS = { ok: '#2e9e5b', warn: '#f2a900', bad: '#e5484d', map: '#2f6fdf' };

function rectLine(b, color, y, dashed) {
  const x1 = (b.x - 0.5) * WORLD.width;
  const x2 = (b.x + b.w - 0.5) * WORLD.width;
  const z1 = (b.y - 0.5) * WORLD.depth;
  const z2 = (b.y + b.h - 0.5) * WORLD.depth;
  const geo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z1), new THREE.Vector3(x2, y, z2), new THREE.Vector3(x1, y, z2), new THREE.Vector3(x1, y, z1),
  ]);
  const m = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.3, gapSize: 0.2 }) : new THREE.LineBasicMaterial({ color });
  const l = new THREE.Line(geo, m);
  if (dashed) l.computeLineDistances();
  l.renderOrder = 10;
  return l;
}

function clearOverlays() {
  [1, 2].forEach((f) => sm.overlays[f].clear());
}

function buildOverlays() {
  clearOverlays();
  if (sm.mode !== 'validate') return;
  const f = sm.floor;
  const g = sm.overlays[f];
  if (!texCache[f]) {
    texCache[f] = new THREE.TextureLoader().load(PLAN.images[f]);
    texCache[f].colorSpace = THREE.SRGBColorSpace;
  }
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.width, WORLD.depth),
    new THREE.MeshBasicMaterial({ map: texCache[f], transparent: true, opacity: overlayOpacity, depthWrite: false, side: THREE.DoubleSide }),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = overlayHigh ? 2.95 : 0.03;
  plane.renderOrder = 9;
  g.add(plane);
  const y = overlayHigh ? 3.0 : 0.08;
  ZONES.filter((z) => z.floor === f && z.kind !== 'carpet').forEach((z) => {
    g.add(rectLine(z.mapBounds, z.id === selectedId ? '#ff00aa' : COLORS.map, y + 0.01));
    const st = zoneStatus(z.id);
    if (st.g) g.add(rectLine(st.g, COLORS[st.level], y + 0.02, true));
  });
}

function renderPanel() {
  const p = $('#validate-panel');
  if (sm.mode !== 'validate') {
    p.hidden = true;
    return;
  }
  p.hidden = false;
  const f = sm.floor;
  const rules = RULES.filter((r) => r.floor === f || r.floor === 0).map((r) => ({ ...r, ok: safe(r.test) }));
  const zones = ZONES.filter((z) => z.floor === f && z.kind !== 'carpet').map((z) => ({ z, st: zoneStatus(z.id) }));
  const bad = zones.filter((x) => x.st.level !== 'ok');
  const sel = selectedId && getZone(selectedId);
  const ov = getOverrides();
  p.innerHTML = `
    <h3>🧪 空間配置驗證｜${f}F</h3>
    <div class="vp-row">
      <div class="seg" role="group" aria-label="樓層"><button data-vf="1" class="${f === 1 ? 'active' : ''}">1F</button><button data-vf="2" class="${f === 2 ? 'active' : ''}">2F</button></div>
      <label style="font-size:.85rem">平面圖透明度 <input type="range" id="vp-op" min="0" max="1" step="0.05" value="${overlayOpacity}"></label>
    </div>
    <div class="vp-row"><label style="font-size:.85rem"><input type="checkbox" id="vp-high" ${overlayHigh ? 'checked' : ''}> 疊合圖置於家具上方（取消＝貼地）</label></div>
    <div class="legend"><span><i style="background:${COLORS.map}"></i>配置圖範圍（mapBounds）</span><span><i style="background:${COLORS.ok}"></i>模型吻合</span><span><i style="background:${COLORS.warn}"></i>部分超出</span><span><i style="background:${COLORS.bad}"></i>位置偏移</span></div>
    <h3 style="margin-top:12px">方位規則檢查（${rules.filter((r) => r.ok).length}/${rules.length} 通過）</h3>
    ${rules.map((r) => `<div class="check"><span class="st ${r.ok ? 'ok' : 'bad'}">${r.ok ? '✔' : '✘'}</span><span>${esc(r.text)}</span></div>`).join('')}
    <h3 style="margin-top:12px">模型 ↔ 配置圖差異</h3>
    <p style="font-size:.88rem;margin:0 0 6px">共 ${zones.length} 個物件，${zones.length - bad.length} 個吻合${bad.length ? `，需注意：${bad.map((b) => esc(b.z.name)).join('、')}` : '。'}</p>
    <h3 style="margin-top:12px">座標校正</h3>
    ${sel ? `<p style="margin:0 0 6px"><b>${esc(sel.name)}</b>（${sel.id}）${ov[sel.id] ? ' <span class="demo-tag">已校正</span>' : ''}</p>
      <div class="adj-grid">
        ${['左 x1', '上 y1', '右 x2', '下 y2'].map((l, i) => `<label>${l}<input type="number" data-adj="${i}" value="${sel.px[i]}"></label>`).join('')}
      </div>
      <div class="vp-row" style="margin-top:8px">
        <button class="btn sm primary" id="vp-apply">套用</button>
        <button class="btn sm" id="vp-revert">還原此區</button>
      </div>` : '<p style="font-size:.9rem;color:var(--ink-2)">點擊 3D 中的區域即可調整其像素座標（以原始 2000×1125 平面圖為準）。</p>'}
    <div class="vp-row" style="margin-top:8px">
      <button class="btn sm" id="vp-export">匯出校正 JSON</button>
      <button class="btn sm danger" id="vp-reset">清除全部校正</button>
    </div>`;
  p.querySelectorAll('[data-vf]').forEach((b) => b.addEventListener('click', () => {
    sm.floor = +b.dataset.vf;
    selectedId = null;
    sm.setMode('validate');
  }));
  p.querySelector('#vp-op').addEventListener('input', (e) => {
    overlayOpacity = +e.target.value;
    sm.overlays[sm.floor].children.forEach((c) => c.isMesh && (c.material.opacity = overlayOpacity));
  });
  p.querySelector('#vp-high').addEventListener('change', (e) => {
    overlayHigh = e.target.checked;
    buildOverlays();
  });
  p.querySelector('#vp-apply')?.addEventListener('click', () => {
    const vals = [...p.querySelectorAll('[data-adj]')].map((i) => +i.value);
    if (vals.some((v) => !Number.isFinite(v)) || vals[2] <= vals[0] || vals[3] <= vals[1]) {
      toast('座標不正確：右需大於左、下需大於上', 'bad');
      return;
    }
    setZoneOverride(selectedId, vals);
    afterDataChange();
    toast('已套用並重建模型', 'ok');
  });
  p.querySelector('#vp-revert')?.addEventListener('click', () => {
    const z = getZone(selectedId);
    setZoneOverride(selectedId, z.originalPx);
    afterDataChange();
  });
  p.querySelector('#vp-export').addEventListener('click', () => {
    const data = { generatedAt: new Date().toISOString(), note: 'px 為原始平面圖像素座標 [x1,y1,x2,y2]', overrides: getOverrides() };
    download('layout-overrides.json', JSON.stringify(data, null, 2));
  });
  p.querySelector('#vp-reset').addEventListener('click', () => {
    if (!confirm('確定清除全部座標校正？')) return;
    clearZoneOverrides();
    afterDataChange();
  });
}

function safe(fn) {
  try {
    return !!fn();
  } catch {
    return false;
  }
}

function afterDataChange() {
  sm.rebuildModel();
  buildOverlays();
  renderPanel();
}

export function initValidate(sceneManager) {
  sm = sceneManager;
  on('mode', ({ mode }) => {
    if (mode !== 'validate') clearOverlays();
    buildOverlays();
    renderPanel();
  });
  on('zone:select', (z) => {
    if (sm.mode !== 'validate') return;
    selectedId = z?.id || null;
    buildOverlays();
    renderPanel();
  });
}
