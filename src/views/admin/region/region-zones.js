/**
 * 区域（合并 / 拆分）· 设计坐标系 1296×1056，与落位 config 一致
 */

import { normalizeZoneRentStatus, ZONE_RENT_STATUS } from './region-zone-status'

export const ZONE_DESIGN_W = 1296
export const ZONE_DESIGN_H = 1056

const STORAGE_PREFIX = 'region-zones-v2:'

export function createZoneId () {
  return `zone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function normalizeRect (a, b) {
  const x1 = Math.min(a.x, b.x)
  const y1 = Math.min(a.y, b.y)
  const x2 = Math.max(a.x, b.x)
  const y2 = Math.max(a.y, b.y)
  return {
    x: x1,
    y: y1,
    w: Math.max(8, x2 - x1),
    h: Math.max(8, y2 - y1)
  }
}

export function clampRectToDesign (rect) {
  const x = Math.max(0, Math.min(rect.x, ZONE_DESIGN_W - 8))
  const y = Math.max(0, Math.min(rect.y, ZONE_DESIGN_H - 8))
  const w = Math.max(8, Math.min(rect.w, ZONE_DESIGN_W - x))
  const h = Math.max(8, Math.min(rect.h, ZONE_DESIGN_H - y))
  return { x, y, w, h }
}

export function designToMapPx (rect, mapNW, mapNH) {
  if (!mapNW || !mapNH) return { x: 0, y: 0, w: 0, h: 0 }
  return {
    x: (rect.x / ZONE_DESIGN_W) * mapNW,
    y: (rect.y / ZONE_DESIGN_H) * mapNH,
    w: (rect.w / ZONE_DESIGN_W) * mapNW,
    h: (rect.h / ZONE_DESIGN_H) * mapNH
  }
}

export function mapPxToDesign (px, py, mapNW, mapNH) {
  if (!mapNW || !mapNH) return { x: 0, y: 0 }
  return {
    x: (px / mapNW) * ZONE_DESIGN_W,
    y: (py / mapNH) * ZONE_DESIGN_H
  }
}

export function mapPxRectToDesign (rect, mapNW, mapNH) {
  const tl = mapPxToDesign(rect.x, rect.y, mapNW, mapNH)
  const br = mapPxToDesign(rect.x + rect.w, rect.y + rect.h, mapNW, mapNH)
  return clampRectToDesign(normalizeRect(tl, br))
}

export function pointInRect (px, py, rect) {
  return px >= rect.x && py >= rect.y && px <= rect.x + rect.w && py <= rect.y + rect.h
}

/** 落位点（map 像素）是否落在区域内 */
export function lightInZone (light, zoneRectDesign, mapNW, mapNH) {
  const d = mapPxToDesign(light.px, light.py, mapNW, mapNH)
  return pointInRect(d.x, d.y, zoneRectDesign)
}

export function splitRect (rect, splits) {
  if (!splits || !splits.parts || splits.parts < 2) {
    return [{ ...rect, partIndex: 0 }]
  }
  const n = splits.parts
  const vertical = splits.direction !== 'horizontal'
  const out = []
  for (let i = 0; i < n; i++) {
    if (vertical) {
      const w = rect.w / n
      out.push({
        x: rect.x + w * i,
        y: rect.y,
        w,
        h: rect.h,
        partIndex: i
      })
    } else {
      const h = rect.h / n
      out.push({
        x: rect.x,
        y: rect.y + h * i,
        w: rect.w,
        h,
        partIndex: i
      })
    }
  }
  return out
}

/** 将带 splits 的旧数据转为多个独立区域（各自独立名称与矩形） */
export function explodeZoneToParts (zone) {
  if (!zone.splits || zone.splits.parts < 2) {
    return [{ ...cloneZone(zone) }]
  }
  const parts = splitRect(zone.rect, zone.splits)
  const labels = zone.partLabels || []
  return parts.map((part, idx) => ({
    id: createZoneId(),
    type: 'merged',
    label: (labels[idx] && String(labels[idx]).trim()) || `${zone.label}-${idx + 1}`,
    rect: { x: part.x, y: part.y, w: part.w, h: part.h },
    rentStatus: normalizeZoneRentStatus(zone.rentStatus),
    splits: null
  }))
}

export function cloneZone (zone) {
  return {
    ...zone,
    rect: zone.rect ? { ...zone.rect } : zone.rect,
    rentStatus: normalizeZoneRentStatus(zone.rentStatus),
    splits: zone.splits ? { ...zone.splits } : null,
    partLabels: zone.partLabels ? [...zone.partLabels] : undefined
  }
}

/** 加载后统一：拆分预览数据 → 独立区域列表 */
export function normalizeZonesList (zones) {
  const out = []
  ;(zones || []).forEach((z) => {
    if (z.splits && z.splits.parts >= 2) {
      out.push(...explodeZoneToParts(z))
    } else {
      out.push(cloneZone(z))
    }
  })
  return out
}

/**
 * @param {Array} zones 原始区域（均已独立，无虚拟子块）
 */
export function buildDisplayZones (zones) {
  return (zones || []).map((zone) => ({
    ...cloneZone(zone),
    renderRect: zone.rect,
    displayLabel: zone.label,
    isChild: false,
    isSplitLine: false,
    sourceZoneId: zone.id
  }))
}

export function loadFloorZones (floorKey) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + floorKey)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return normalizeZonesList(parsed)
    }
  } catch (e) {
    console.warn('[region-zones] load failed', floorKey, e)
  }
  return []
}

export function saveFloorZones (floorKey, zones) {
  const data = (zones || []).map((z) => {
    const copy = cloneZone(z)
    delete copy.isNew
    delete copy.partLabels
    if (copy.splits) delete copy.splits
    return copy
  })
  localStorage.setItem(STORAGE_PREFIX + floorKey, JSON.stringify(data))
}

export function resetFloorZones (floorKey, seedZones = []) {
  const data = JSON.parse(JSON.stringify(seedZones || []))
  saveFloorZones(floorKey, data)
  return data
}
