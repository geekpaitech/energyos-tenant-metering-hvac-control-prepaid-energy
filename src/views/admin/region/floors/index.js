/**
 * 落位页 · 按楼层注册（一层一套，互不共用）
 */
import * as mapConfig10f from './10f/map-config'
import * as mock10f from './10f/mock-data'
import * as mapConfig9f from './9f/map-config'
import * as mock9f from './9f/mock-data'
import * as mapConfig4f from './4f/map-config'
import { F4_ADDRESS } from './4f/address'
import * as mapConfigB1 from './b1/map-config'
import { B1_ADDRESS } from './b1/address'
import { ZONES_SEED as ZONES_SEED_10F } from './10f/zones-seed'
import { ZONES_SEED as ZONES_SEED_9F } from './9f/zones-seed'
import { ZONES_SEED as ZONES_SEED_4F } from './4f/zones-seed'
import { ZONES_SEED as ZONES_SEED_B1 } from './b1/zones-seed'

const FLOOR_PROFILES = [
  {
    key: '10F',
    label: '10F',
    addressId: mock10f.MOCK_ADDRESS.id,
    mapConfig: mapConfig10f,
    zonesSeed: ZONES_SEED_10F,
    mock: {
      placements: mock10f.MOCK_PLACEMENTS,
      deviceGroups: mock10f.MOCK_DEVICE_GROUPS,
      address: mock10f.MOCK_ADDRESS
    }
  },
  {
    key: '9F',
    label: '9F',
    addressId: mock9f.MOCK_ADDRESS.id,
    mapConfig: mapConfig9f,
    zonesSeed: ZONES_SEED_9F,
    mock: {
      placements: mock9f.MOCK_PLACEMENTS,
      deviceGroups: mock9f.MOCK_DEVICE_GROUPS,
      address: mock9f.MOCK_ADDRESS
    }
  },
  {
    key: '4F',
    label: '4F',
    displayOnly: true,
    addressId: F4_ADDRESS.id,
    mapConfig: mapConfig4f,
    zonesSeed: ZONES_SEED_4F,
    mock: null
  },
  {
    key: 'B1',
    label: '负1F',
    displayOnly: true,
    addressId: B1_ADDRESS.id,
    mapConfig: mapConfigB1,
    zonesSeed: ZONES_SEED_B1,
    mock: null
  }
]

export function listFloorProfiles () {
  return FLOOR_PROFILES.filter(f => f.enabled !== false)
}

export function getFloorProfile (floorKey) {
  const key = floorKey || '10F'
  return FLOOR_PROFILES.find(f => f.key === key) || listFloorProfiles()[0] || null
}

export function isDisplayOnlyFloor (floorKey) {
  const floor = getFloorProfile(floorKey)
  return !!(floor && floor.displayOnly)
}

export function getFloorZonesSeed (floorKey) {
  const floor = getFloorProfile(floorKey)
  return (floor && floor.zonesSeed) || []
}
