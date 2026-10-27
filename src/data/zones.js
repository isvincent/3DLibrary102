// 將兩層樓的原始配置整理成統一的場域資料（含 mapBounds、position、size、rotation）
import { FLOOR1_ZONES } from './floor1-layout.js';
import { FLOOR2_ZONES } from './floor2-layout.js';
import { pxRect, boundsToWorld } from '../core/coords.js';
import { PLAN } from './config.js';

const OVERRIDE_KEY = 'ymsh-lib-layout-overrides';

export const CATEGORY_META = {
  entrance: { label: '出入口', color: '#ef6c4a' },
  service: { label: '服務設施', color: '#f2a900' },
  reading: { label: '閱讀空間', color: '#3fa36b' },
  collection: { label: '館藏區', color: '#3b7ddd' },
  display: { label: '展示區', color: '#b05cc8' },
  facility: { label: '設備', color: '#6b7a8f' },
  room: { label: '獨立空間', color: '#d9577f' },
  circulation: { label: '樓層動線', color: '#00a3a3' },
};

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || '{}');
  } catch {
    return {};
  }
}

let overrides = loadOverrides();

function finalize(raw, floor) {
  const px = overrides[raw.id] || raw.px;
  const mapBounds = pxRect(...px);
  const w = boundsToWorld(mapBounds);
  return {
    ...raw,
    floor,
    px,
    originalPx: raw.px,
    mapBounds,
    position: { x: w.x, z: w.z },
    size: { w: w.w, d: w.d },
    rotation: 0,
    quizIds: raw.quizIds || [],
    keywords: raw.keywords || [],
    options: raw.options || {},
  };
}

export let ZONES = [];
export const ZONE_MAP = new Map();

export function rebuildZoneData() {
  overrides = loadOverrides();
  ZONES = [...FLOOR1_ZONES.map((z) => finalize(z, 1)), ...FLOOR2_ZONES.map((z) => finalize(z, 2))];
  ZONE_MAP.clear();
  ZONES.forEach((z) => ZONE_MAP.set(z.id, z));
  return ZONES;
}

rebuildZoneData();

export function getZone(id) {
  return ZONE_MAP.get(id);
}

export function visibleZones(floor) {
  return ZONES.filter((z) => !z.hidden && (floor == null || z.floor === floor));
}

// 驗證模式：人工校正座標（以 px 儲存）
export function setZoneOverride(id, px) {
  overrides[id] = px.map((n) => Math.round(Math.max(0, Math.min(n, Math.max(PLAN.width, PLAN.height)))));
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
  rebuildZoneData();
}

export function clearZoneOverrides() {
  localStorage.removeItem(OVERRIDE_KEY);
  rebuildZoneData();
}

export function getOverrides() {
  return { ...overrides };
}
