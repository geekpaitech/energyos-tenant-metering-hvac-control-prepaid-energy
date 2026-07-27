/**
 * 10F · 本地底图 + 展示微调（不是落位坐标来源）
 *
 * 数据流：
 *   接口 config.data.x/y → 主坐标
 *   本文件 MAP_OFFSET_* / MAP_ZONE_* → 仅因「本地底图 ≠ 配置器底图」做像素级补偿
 *   不使用接口返回的平面图 URL
 *
 * 底图：10F 使用 assets/nandu10.png
 */
import map10f from '@/assets/nandu10.png'

export const MAP_OFFSET_X = 10
export const MAP_OFFSET_Y = 0

export const MAP_SCALE_X = 1
export const MAP_SCALE_Y = 1

export const MAP_PIVOT_X = 648
export const MAP_PIVOT_Y = 528

export const MAP_ZONE_PATCHES = [
  {
    label: '北过道+右侧公共空间（三点整体左移）',
    placementIds: [
      '2053664024598437889',
      '2054020418312888321',
      '2054020490014515201'
    ],
    offsetX: 25,
    offsetY: 0,
    scaleX: 1,
    scaleY: 1
  },
  {
    label: '右上-1012',
    namePattern: '^1012房间',
    pivotX: 800,
    pivotY: 190,
    scaleX: 0.8,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0
  },
  {
    label: '右上-1013',
    namePattern: '^1013房间',
    pivotX: 980,
    pivotY: 190,
    scaleX: 0.8,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0
  }
]

export const MAP_PLACEMENT_PATCHES = []

/** 与 nandu10.png 四边画布一致，避免 map-wrap 默认蓝灰 #D8DEE8 */
export const MAP_CANVAS_BG = '#F2F2F2'

export function resolveLocalMapUrl () {
  return map10f || ''
}
