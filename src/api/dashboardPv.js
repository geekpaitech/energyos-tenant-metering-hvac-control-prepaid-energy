/**
 * Dashboard 光伏发电量查询
 * 从 /api/station/month 获取月度运行记录，匹配昨日 dateStr 取出日发电量（kWh）
 */
import moment from 'moment'
import { fetchStationMonthRuntime } from '@/api/photovoltaic'

/** 南都广场电站 ID */
const NANDU_STATION_ID = '1299184320439459357'

/**
 * 将锦浪接口日发电量转为 kWh
 * @param {number} value - energy 原始值
 * @param {string} pec  - 精度（如 "0.001"）
 * @param {string} unit - 单位（MWh / kWh）
 */
function energyToKwh (value, pec = '0.001', unit = 'MWh') {
  const amount = (Number(value) || 0) * (Number(pec) || 0.001)
  if (String(unit).toUpperCase() === 'MWH') return amount * 1000
  if (String(unit).toUpperCase() === 'KWH') return amount
  return amount * 1000
}

/**
 * 获取昨日光伏日发电量（kWh）
 * @returns {Promise<number>}
 */
export async function fetchYesterdayPvKwh () {
  const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD')
  const monthKey = yesterday.slice(0, 7)
  const daySuffix = yesterday.slice(-2)

  const records = await fetchStationMonthRuntime(monthKey, {
    stationId: NANDU_STATION_ID,
    timeZone: 8
  })

  if (!Array.isArray(records)) return 0

  for (const r of records) {
    const dateStr = r.dateStr || ''
    if (dateStr === yesterday || dateStr === daySuffix || dateStr.endsWith(`-${daySuffix}`)) {
      const kwh = energyToKwh(r.energy, r.energyPec, r.energyStr)
      console.log('[PV API] matched dateStr:', dateStr, 'energy:', r.energy, 'pec:', r.energyPec, 'unit:', r.energyStr, '→ kWh:', kwh)
      return Math.round(kwh)
    }
  }

  console.log('[PV API] no record found for yesterday:', yesterday)
  return 0
}
