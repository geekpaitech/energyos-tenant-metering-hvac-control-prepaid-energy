import { EMS_API_ROOT } from '@/config/services'

async function emsPost (path, body = {}, signal) {
  const token = await getEmsToken()
  const url = `${EMS_BASE}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body),
    signal
  })
  if (!res.ok) throw new Error(`EMS ${path}: HTTP ${res.status}`)
  const json = await res.json()
  if (json.code !== 200) {
    throw new Error(json.msg || `EMS ${path} 请求失败`)
  }
  return json.data
}

/**
 * EMS 能耗管理平台 API（南都广场本地电表数据）
 *
 * 基地址由 vue.config.js 的 emsOrigin / emsApiPath 配置
 * 认证：mockLogin → token（jipai/123456）
 * 独立 fetch 链路，不与项目 axios 实例共享拦截器
 */

const EMS_BASE = EMS_API_ROOT
const LOGIN_URL = `${EMS_BASE}/mockLogin`
const LOGIN_CREDENTIALS = { username: 'jipai', password: '123456' }

/** Token 缓存：25 分钟 TTL，避免每次调用都 login */
let cachedToken = null
let tokenExpiry = 0
const TOKEN_TTL_MS = 25 * 60 * 1000

async function getEmsToken () {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }
  const res = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(LOGIN_CREDENTIALS)
  })
  if (!res.ok) throw new Error(`EMS login failed: HTTP ${res.status}`)
  const body = await res.json()
  if (body.code !== 200 || !body.data || !body.data.token) {
    throw new Error(body.msg || 'EMS token 获取失败')
  }
  cachedToken = body.data.token
  tokenExpiry = Date.now() + TOKEN_TTL_MS
  return cachedToken
}

async function emsGet (path, params = {}, signal) {
  const token = await getEmsToken()
  const url = new URL(`${EMS_BASE}${path}`)
  Object.keys(params).forEach(key => {
    if (params[key] != null && params[key] !== '') {
      url.searchParams.set(key, params[key])
    }
  })
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    },
    signal
  })
  if (!res.ok) throw new Error(`EMS ${path}: HTTP ${res.status}`)
  const body = await res.json()
  if (body.code !== 200) {
    throw new Error(body.msg || `EMS ${path} 请求失败`)
  }
  return body.data
}

/**
 * 获取日用电功率曲线（每小时 kW，00:00~23:00）
 * @param {string} areaId - 区域 ID
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ todayData: string[], yesterdayData: string[] }>}
 */
export function fetchDailyLoadPower (areaId, signal) {
  return emsGet('/data/energy/getDailyP', { areaId }, signal)
}

/**
 * 获取能耗趋势（kWh / MWh）
 * @param {string} areaId - 区域 ID
 * @param {'day'|'month'|'year'} dateType
 * @param {string} [nowTime] - 时间点，格式 yyyy-MM-dd HH:mm:ss，默认当前
 * @param {AbortSignal} [signal]
 * @returns {Promise<string[]>} 数值数组（含 "--" 占位）
 */
export function fetchOverviewTrend (areaId, dateType, nowTime, signal) {
  return emsGet('/data/energy/overviewTrend', {
    areaId,
    dateType,
    nowTime
  }, signal)
}

/**
 * 从 todayData 提取当前小时的总负载功率（kW）
 * 取最后一个非 "--" 的有效值
 * @param {string[]} todayData
 * @returns {number}
 */
export function extractCurrentLoadPower (todayData) {
  if (!Array.isArray(todayData)) return 0
  for (let i = todayData.length - 1; i >= 0; i--) {
    const val = parseFloat(todayData[i])
    if (Number.isFinite(val)) return val
  }
  return 0
}

/**
 * 将小时级负载功率阶梯填充为 N 点序列（对齐锦浪 5 分钟粒度）
 * @param {string[]} hourlyLoad - 每小时总负载功率数组（00:00 ~ 23:00）
 * @param {number} pointsPerHour - 每小时填充点数（默认 12，即 5min 一个点）
 * @returns {(number|null)[]}
 */
export function expandHourlyToMinuteSlots (hourlyLoad, pointsPerHour = 12) {
  const totalSlots = 24 * pointsPerHour
  const slots = new Array(totalSlots).fill(null)
  if (!Array.isArray(hourlyLoad)) return slots

  for (let h = 0; h < hourlyLoad.length && h < 24; h++) {
    const val = parseFloat(hourlyLoad[h])
    if (!Number.isFinite(val)) continue
    const baseIdx = h * pointsPerHour
    for (let p = 0; p < pointsPerHour; p++) {
      slots[baseIdx + p] = val
    }
  }
  return slots
}

/**
 * 从 overviewTrend 返回的数组中提取最后一个有效数值
 * @param {string[]} data
 * @returns {number}
 */
export function extractLastTrendValue (data) {
  if (!Array.isArray(data)) return 0
  for (let i = data.length - 1; i >= 0; i--) {
    const val = parseFloat(data[i])
    if (Number.isFinite(val)) return val
  }
  return 0
}

/**
 * 获取 5 分钟粒度功率参数（总有功功率 kW）
 * 用于日视图负载折线图，替代 getDailyP 的小时级阶梯数据
 * @param {string} areaId - 区域 ID
 * @param {string} startTime - 起始时间 "yyyy-MM-dd HH:mm:ss"
 * @param {string} endTime - 结束时间 "yyyy-MM-dd HH:mm:ss"
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{ ts: string, p: number, ... }>>}
 */
export function fetchPowerParam (areaId, startTime, endTime, signal) {
  // POST 方式，参数走 query string（与 GET 不兼容，需显式 POST + URL params）
  return getEmsToken().then(token => {
    const url = new URL(`${EMS_BASE}/dataQuery/powerParam`)
    url.searchParams.set('areaId', areaId)
    url.searchParams.set('startTime', startTime)
    url.searchParams.set('endTime', endTime)
    return fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal
    }).then(async res => {
      if (!res.ok) throw new Error(`EMS /dataQuery/powerParam: HTTP ${res.status}`)
      const json = await res.json()
      if (json.code !== 200) {
        throw new Error(json.msg || '请求失败')
      }
      return json.data
    })
  })
}

/**
 * 将 overviewTrend 值数组转为纯数值数组（"--" → null）
 * @param {string[]} data
 * @returns {(number|null)[]}
 */
export function normalizeTrendValues (data) {
  if (!Array.isArray(data)) return []
  return data.map(v => {
    const val = parseFloat(v)
    return Number.isFinite(val) ? val : null
  })
}
