/** 区域资源状态（Mock，字段与后续明源 rentStatus 对齐） */

export const ZONE_RENT_STATUS = {
  VACANT: 'VACANT',
  RENTED: 'RENTED',
  NOT_LEASABLE: 'NOT_LEASABLE'
}

export const ZONE_STATUS_OPTIONS = [
  {
    value: ZONE_RENT_STATUS.VACANT,
    label: '空租',
    color: '#00C9B7',
    border: 'rgba(0, 201, 183, 0.9)',
    bg: 'rgba(0, 201, 183, 0.14)'
  },
  {
    value: ZONE_RENT_STATUS.RENTED,
    label: '已租',
    color: '#0170FE',
    border: 'rgba(1, 112, 254, 0.9)',
    bg: 'rgba(1, 112, 254, 0.14)'
  },
  {
    value: ZONE_RENT_STATUS.NOT_LEASABLE,
    label: '不可租',
    color: '#909399',
    border: 'rgba(144, 147, 153, 0.9)',
    bg: 'rgba(144, 147, 153, 0.16)'
  }
]

export function normalizeZoneRentStatus (status) {
  const hit = ZONE_STATUS_OPTIONS.find(o => o.value === status)
  return hit ? hit.value : ZONE_RENT_STATUS.VACANT
}

export function getZoneStatusOption (status) {
  return ZONE_STATUS_OPTIONS.find(o => o.value === normalizeZoneRentStatus(status)) || ZONE_STATUS_OPTIONS[0]
}

export function zoneStatusMapStyle (status) {
  const opt = getZoneStatusOption(status)
  return {
    borderColor: opt.border,
    backgroundColor: opt.bg,
    '--zone-status-color': opt.color
  }
}
