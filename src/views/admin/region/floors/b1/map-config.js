/**
 * 负1F · 仅平面图展示（无照明落位，不做坐标微调）
 */
import mapB1 from '@/assets/nanduf1.png'

export const MAP_OFFSET_X = 0
export const MAP_OFFSET_Y = 0
export const MAP_SCALE_X = 1
export const MAP_SCALE_Y = 1
export const MAP_PIVOT_X = 648
export const MAP_PIVOT_Y = 528
export const MAP_ZONE_PATCHES = []
export const MAP_PLACEMENT_PATCHES = []

/**
 * 与 nanduf1.png 四边画布一致（加载后 region.vue 会边缘采样覆盖）
 */
export const MAP_CANVAS_BG = '#FEFEFE'

/** 与 4F 展示层：复位视图内边距（px） */
export const MAP_VIEW_PADDING = 40

export function resolveLocalMapUrl () {
  return mapB1 || ''
}
