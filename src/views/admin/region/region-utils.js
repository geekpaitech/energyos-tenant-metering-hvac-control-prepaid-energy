/**
 * 落位图坐标与设备数据转换
 *
 * 接口约定：
 * - 落位坐标在 config.data.x / data.y（配置器画布像素）
 * - 展示校准按楼层 mapConfig（floors/<楼层>/map-config.js）
 */

export const MAP_DESIGN_W = 1296
export const MAP_DESIGN_H = 1056

export function parsePlacementConfig (configStr) {
  if (!configStr) return null
  try {
    const cfg = typeof configStr === 'string' ? JSON.parse(configStr) : configStr
    const d = cfg && cfg.data
    if (!d || d.x == null || d.y == null) return null
    return {
      x: Number(d.x),
      y: Number(d.y),
      text: d.text || ''
    }
  } catch (e) {
    return null
  }
}

export function buildDeviceMap (deviceGroups) {
  const map = Object.create(null)
  ;(deviceGroups || []).forEach(group => {
    ;(group.deviceInfoList || []).forEach(dev => {
      map[dev.id] = dev
    })
  })
  return map
}

export function getSwitchState (device) {
  if (!device) return { on: false, updatedAt: '' }
  const prop = (device.dataPropertyList || []).find(p => p.identifier === 'C')
  const uploadTime = device.commonDeviceData && device.commonDeviceData.uploadTime
  return {
    on: prop ? !!prop.data : false,
    updatedAt: uploadTime || device.lastUpdateTime || ''
  }
}

export function mergePlacementsWithDevices (placements, deviceGroups, floorLabel = '') {
  const deviceMap = buildDeviceMap(deviceGroups)

  return (placements || [])
    .map(p => {
      const pos = parsePlacementConfig(p.config)
      if (!pos) return null

      const dev = deviceMap[p.deviceId] || {}
      const { on, updatedAt } = getSwitchState(dev)

      return {
        id: p.id,
        placementId: p.id,
        deviceId: p.deviceId,
        name: pos.text || dev.deviceName || dev.alias || '未知设备',
        serial: dev.sn || dev.deviceNo || '-',
        area: dev.addressName || floorLabel || '',
        x: pos.x,
        y: pos.y,
        px: 0,
        py: 0,
        status: on ? 'on' : 'off',
        power: on ? '-' : '0 W',
        energy: '-',
        updatedAt,
        deviceNo: dev.deviceNo
      }
    })
    .filter(Boolean)
}

function transformPlacementXY (x, y, opts = {}) {
  const pivotX = opts.pivotX != null ? opts.pivotX : 0
  const pivotY = opts.pivotY != null ? opts.pivotY : 0
  const scaleX = opts.scaleX == null ? 1 : opts.scaleX
  const scaleY = opts.scaleY == null ? 1 : opts.scaleY
  const offsetX = opts.offsetX || 0
  const offsetY = opts.offsetY || 0
  return {
    x: (x - pivotX) * scaleX + pivotX - offsetX,
    y: (y - pivotY) * scaleY + pivotY - offsetY
  }
}

function findZonePatch (meta, mapConfig) {
  const zones = (mapConfig && mapConfig.MAP_ZONE_PATCHES) || []
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i]
    if (z.placementIds && z.placementIds.indexOf(meta.placementId) >= 0) return z
    if (z.namePattern && meta.name && new RegExp(z.namePattern).test(meta.name)) return z
  }
  return null
}

function findPlacementPatch (meta, mapConfig) {
  const list = (mapConfig && mapConfig.MAP_PLACEMENT_PATCHES) || []
  for (let i = 0; i < list.length; i++) {
    const p = list[i]
    if (p.placementIds && p.placementIds.indexOf(meta.placementId) >= 0) return p
  }
  return null
}

export function adjustPlacementXY (x, y, meta = {}, mapConfig) {
  const cfg = mapConfig || {}
  let out = transformPlacementXY(x, y, {
    pivotX: cfg.MAP_PIVOT_X || 0,
    pivotY: cfg.MAP_PIVOT_Y || 0,
    scaleX: cfg.MAP_SCALE_X == null ? 1 : cfg.MAP_SCALE_X,
    scaleY: cfg.MAP_SCALE_Y == null ? 1 : cfg.MAP_SCALE_Y,
    offsetX: cfg.MAP_OFFSET_X || 0,
    offsetY: cfg.MAP_OFFSET_Y || 0
  })
  const zone = findZonePatch(meta, cfg)
  if (zone) {
    out = transformPlacementXY(out.x, out.y, zone)
  }
  const one = findPlacementPatch(meta, cfg)
  if (one) {
    out = transformPlacementXY(out.x, out.y, one)
  }
  return out
}

export function applyMapScale (lights, mapNW, mapNH, mapConfig) {
  if (!mapNW || !mapNH) return lights
  const designW = (mapConfig && mapConfig.MAP_DESIGN_W) || MAP_DESIGN_W
  const designH = (mapConfig && mapConfig.MAP_DESIGN_H) || MAP_DESIGN_H
  return lights.map(l => {
    const { x: ax, y: ay } = adjustPlacementXY(l.x, l.y, {
      placementId: l.placementId,
      name: l.name
    }, mapConfig)
    return {
      ...l,
      px: (ax / designW) * mapNW,
      py: (ay / designH) * mapNH
    }
  })
}
