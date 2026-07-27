/**
 * 4F · 仅平面图展示（透明底 PNG，画布铺浅灰）
 */
import map4f from '@/assets/nandu4f.png'

export const MAP_OFFSET_X = 0
export const MAP_OFFSET_Y = 0
export const MAP_SCALE_X = 1
export const MAP_SCALE_Y = 1
export const MAP_PIVOT_X = 648
export const MAP_PIVOT_Y = 528
export const MAP_ZONE_PATCHES = []
export const MAP_PLACEMENT_PATCHES = []

/**
 * 透明底 PNG：画布与负1F 一致（#FEFEFE）
 * 约 1024×1536 RGBA
 */
export const MAP_CANVAS_BG = '#FEFEFE'

/** 与负1F 展示层：复位视图内边距（px） */
export const MAP_VIEW_PADDING = 40

export function resolveLocalMapUrl () {
  return map4f || ''
}
