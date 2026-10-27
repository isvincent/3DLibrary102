// 介面文字（繁體中文為預設；英文為預留，教材內容維持中文）
import { settings } from './store.js';

const DICT = {
  'zh-TW': {
    title: '楊梅高中圖書館 3D 互動探索島',
    'mode.full': '完整建築', 'mode.explode': '樓層展開', 'mode.f1': '一樓俯視', 'mode.f2': '二樓俯視',
    'mode.interior': '室內探索', 'mode.compare': '2D／3D 對照', 'mode.validate': '配置驗證',
    learn: '學習中心', quest: '探險任務', record: '學習歷程', settings: '設定',
    home: '返回全景', bird: '鳥瞰', rotate: '自動旋轉', day: '日夜', labels: '標籤', tour: '自動導覽',
    voice: '語音', fullscreen: '全螢幕', speed: '速度', saver: '省電', directory: '空間目錄', search: '搜尋空間…',
    floorAll: '全部', floor1: '1F', floor2: '2F', explode: '分離距離',
  },
  en: {
    title: 'YMSH Library 3D Explorer Island',
    'mode.full': 'Building', 'mode.explode': 'Exploded', 'mode.f1': '1F Top', 'mode.f2': '2F Top',
    'mode.interior': 'Interior', 'mode.compare': '2D / 3D', 'mode.validate': 'Validate',
    learn: 'Learn', quest: 'Quests', record: 'Record', settings: 'Settings',
    home: 'Home', bird: 'Bird view', rotate: 'Rotate', day: 'Day/Night', labels: 'Labels', tour: 'Tour',
    voice: 'Voice', fullscreen: 'Fullscreen', speed: 'Speed', saver: 'Saver', directory: 'Spaces', search: 'Search…',
    floorAll: 'All', floor1: '1F', floor2: '2F', explode: 'Gap',
  },
};

export function t(key) {
  const lang = DICT[settings.lang] ? settings.lang : 'zh-TW';
  return DICT[lang][key] ?? DICT['zh-TW'][key] ?? key;
}

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
    el.setAttribute('aria-label', el.title);
  });
  document.documentElement.lang = settings.lang;
}
