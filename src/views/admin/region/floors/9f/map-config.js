/**
 * 9F · 本地底图 + 展示微调（仅本文件，不改接口/mock 坐标）
 *
 * 落位坐标仍以接口 config.data.x/y 为准；
 * 下列参数只补偿「nandu9.png ≠ 配置器底图」的偏差。
 */
import map9f from '@/assets/nandu9.png'

/** 全层微调（9F 仅 3 个点时可保持 0，主要靠下方分区） */
export const MAP_OFFSET_X = 0
export const MAP_OFFSET_Y = 0

export const MAP_SCALE_X = 1
export const MAP_SCALE_Y = 1

export const MAP_PIVOT_X = 648
export const MAP_PIVOT_Y = 528

/**
 * 公共区域三点整体校准（与 10F 同逻辑，数值按 9F 底图单独调）
 * offsetX 正值向左；offsetY 正值向上
 */
export const MAP_ZONE_PATCHES = [
  {
    label: '9F-公共区域三点',
    placementIds: [
      '9053664024598437889', // 北过道＋小过道
      '9054020418312888321', // 公共空间墙侧筒灯
      '9054020490014515201' // 公共空间长条灯
    ],
    pivotX: 1130,
    pivotY: 495,
    offsetX: 35,
    offsetY: 0,
    scaleX: 1,
    scaleY: 1
  }
]

/** 单点微调：某一颗仍不准时在此追加，勿只改其中一颗的 offset 却不改同组其它点 */
export const MAP_PLACEMENT_PATCHES = []

/** 与 nandu9.png 四边画布一致，避免 map-wrap 默认蓝灰 #D8DEE8 */
export const MAP_CANVAS_BG = '#F5F6F6'

export function resolveLocalMapUrl () {
  return map9f || ''
}
