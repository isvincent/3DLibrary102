// 全域尺寸參數（示意比例，非真實建築尺寸，可依現場量測調整）
// 平面圖原始影像為 2000 × 1125 px；以 1 px ≈ 0.02 m 換算為示意尺寸。
export const PLAN = {
  width: 2000,
  height: 1125,
  images: {
    1: 'plans/floor1.png',
    2: 'plans/floor2.png',
  },
  // 建築外牆在平面圖中的像素範圍（左, 上, 右, 下）
  outline: [16, 16, 1984, 1110],
};

export const WORLD = {
  width: 40, // 對應平面圖寬度（公尺，示意）
  depth: 22.5, // 對應平面圖高度（公尺，示意）
  floorHeight: 4.2, // 樓層高（示意）
  wallHeight: 3.6, // 外牆可見高度
  slabThickness: 0.3,
  cutawayWallScale: 0.32, // 剖面模式時牆體保留比例
  explodeDefault: 7, // 樓層爆炸圖預設分離距離
  explodeMax: 16,
};

export const DISCLAIMER =
  '本模型依 1F／2F 空間配置圖之相對位置與比例重建，尺寸為示意比例（1 px ≈ 0.02 m），不等同真實建築尺寸。';
