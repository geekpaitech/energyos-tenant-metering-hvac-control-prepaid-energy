/**
 * /console/energy/photovoltaic 页面 API 与 mock
 *
 * 接口（均为 POST，参数放 JSON Body，根地址 PHOTOVOLTAIC_SERVICE_URL）：
 * - /api/station/detail          body: {}
 * - /api/station/day             body: { time, timeZone? }
 * - /api/station/month           body: { month, timeZone? }
 * - /api/station/year            body: { year, timeZone? }
 *
 * Mock（字段与锦浪接口一致，仅供对照）：
 * - MOCK_STATION_DETAIL / MOCK_STATION_LIST / getMockStationDetail
 * - MOCK_DAY_RUNTIME_RECORDS / MOCK_MONTH_RUNTIME_RECORDS / MOCK_YEAR_RUNTIME_RECORDS
 */

// ------------------------------------------------------------------
// 1. 本地联调（Node 中转，默认端口 3000）
export const PHOTOVOLTAIC_SERVICE_URL = 'https://pv-proxy.example.com'
// 2. 上线部署（改为实际域名）
// export const PHOTOVOLTAIC_SERVICE_URL = 'https://pv-proxy.example.com'
// ------------------------------------------------------------------

function getPhotovoltaicApiUrl (path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const baseUrl = PHOTOVOLTAIC_SERVICE_URL.replace(/\/$/, '')
  return `${baseUrl}${normalizedPath}`
}

function isPhotovoltaicSuccess (body) {
  if (!body || typeof body !== 'object') return false
  const code = body.code
  return body.success !== false && (code == null || String(code) === '0')
}

/** 剥掉 Node / 锦浪多层 { code, data } 包装，直到拿到业务数据 */
export function peelPhotovoltaicPayload (value) {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return value
  if (isPhotovoltaicSuccess(value) && value.data != null) {
    return peelPhotovoltaicPayload(value.data)
  }
  return value
}

function unwrapPhotovoltaicBody (body) {
  if (!body) throw new Error('空响应')
  if (!isPhotovoltaicSuccess(body)) {
    throw new Error(body.msg || '请求失败')
  }
  return peelPhotovoltaicPayload(body.data)
}

function buildStationPayload (params = {}) {
  const payload = { ...params }
  Object.keys(payload).forEach(key => {
    if (payload[key] == null || payload[key] === '') delete payload[key]
  })
  return payload
}

function photovoltaicRequest (path, { method = 'POST', body = {}, signal } = {}) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal
  }
  if (method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(buildStationPayload(body))
  }

  return fetch(getPhotovoltaicApiUrl(path), options)
    .then(async response => {
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.msg || `HTTP ${response.status}`)
      }
      return unwrapPhotovoltaicBody(data)
    })
}

/** POST /api/station/detail  body: {}, signal?: AbortSignal */
export function fetchStationDetail (params = {}, signal) {
  return photovoltaicRequest('/api/station/detail', { body: params, signal })
}

/** POST /api/station/day  body: { time, timeZone? }, signal?: AbortSignal */
export function fetchStationDayRuntime (time, params = {}, signal) {
  const { timeZone = 8, ...rest } = params
  return photovoltaicRequest('/api/station/day', {
    body: { ...rest, time, timeZone },
    signal
  })
}

/** POST /api/station/month  body: { month, timeZone? }, signal?: AbortSignal */
export function fetchStationMonthRuntime (month, params = {}, signal) {
  const { timeZone = 8, ...rest } = params
  return photovoltaicRequest('/api/station/month', {
    body: { ...rest, month, timeZone },
    signal
  })
}

/** POST /api/station/year  body: { year, timeZone? }, signal?: AbortSignal */
export function fetchStationYearRuntime (year, params = {}, signal) {
  const { timeZone = 8, ...rest } = params
  return photovoltaicRequest('/api/station/year', {
    body: { ...rest, year, timeZone },
    signal
  })
}

/** 电站快照 mock（样例数据，开源版本已脱敏） */
export const MOCK_STATION_DETAIL = {
  id: '',
  dataTimestamp: '',
  mobile: '',
  fullHour: 0,
  monthCarbonDioxide: 0,
  installerId: '',
  installer: '',
  installerMobile: '',
  installerEmail: '',
  stationName: '示例电站',
  sno: '',
  country: '1',
  countryStr: '中国',
  region: '',
  regionStr: '江苏省',
  city: '',
  cityStr: '苏州市',
  county: '',
  countyStr: '',
  addr: '',
  gdAreaCode: 0,
  state: 1,
  dip: 30.000,
  azimuth: 0.000,
  power: 189.330,
  timeZone: 8.00,
  timeZoneName: '(UTC+08:00) 北京，重庆，香港特别行政区，乌鲁木齐',
  timeZoneStr: '(UTC+08:00)',
  timeZoneId: '97',
  daylight: 0,
  powerStr: 'kW',
  price: 0.7000,
  capacity: 330.860,
  capacityStr: 'kWp',
  capacityPercent: 0,
  capacity1: 0,
  dayEnergy: 1.197,
  dayEnergyStr: 'MWh',
  monthEnergy: 2.496,
  monthEnergyStr: 'MWh',
  yearEnergy: 2.496,
  yearEnergyStr: 'MWh',
  allEnergy: 2.496,
  allEnergyStr: 'MWh',
  allEnergy1: 2495.500,
  updateDate: 1782265991000,
  type: 1,
  synchronizationType: 1,
  epmType: 0,
  gridSwitch: 0,
  gridSwitch1: 0,
  longitude: '120.000000',
  latitude: '31.000000',
  shareProcess: 1,
  dcInputType: 15,
  stationTypeNew: 0,
  batteryCapacityEnergy: 0.000,
  batteryTotalDischargeEnergy: 0,
  batteryTotalChargeEnergy: 0,
  gridPurchasedTotalEnergy: 0.000,
  gridSellTotalEnergy: 0.000,
  homeLoadTotalEnergy: 2.494,
  oneSelf: 189330.00000,
  batteryTodayDischargeEnergy: 0,
  batteryTodayChargeEnergy: 0,
  homeLoadTodayEnergy: 1.197,
  money: '元',
  condTxtD: '阴',
  condTxtN: '晴',
  condCodeD: '104',
  condCodeN: '150',
  remark1: '',
  remark2: '',
  remark3: '',
  simFlowState: -1,
  jxbType: 0,
  createDate: 1782177981000,
  createDateStr: '2026-06-23 09:26:21',
  connectTime: 1782144000000,
  accessTime: 1782144000000,
  fisPowerTime: 1782177981000,
  fisPowerTimeStr: '2026-06-23 09:26:21',
  fisGenerateTime: 1782189275000,
  fisGenerateTimeStr: '2026-06-23 12:34:35',
  generateDays: 3,
  generateDaysContinuous: 3,
  inverterCount: 3,
  inverterOnlineCount: 0,
  inverterStateOrder: 0,
  epmCount: 0,
  chargerCount: 0,
  alarmCount: 0,
  inverterBwCount: 0,
  inverterStorageCount: 0,
  orgCode: 'AA77E2',
  visitorCount: 0,
  isJoined: false,
  timeZoneStandardId: 'PRC',
  daylightSwitch: 0,
  daylightType: 0,
  fullHourStr: 'h',
  capacityPec: '1',
  dipStr: '30.000°',
  azimuthStr: '0.000°',
  dateTime: '1782177981000',
  offset: 0,
  offsetStr: 'kWh',
  dayInCome: 837.900,
  dayInComeUnit: '元',
  monthInCome: 1746.850,
  monthInComeUnit: '元',
  yearInCome: 1746.850,
  yearInComeUnit: '元',
  allInCome: 1746.850,
  allInCome1: 1745.800,
  allInComeUnit: '元',
  powerStationNumTree: 1.38,
  powerStationNumTreeUnit: '棵',
  powerStationAvoidedCo2: 2486.51800,
  powerStationAvoidedTce: 997.60000,
  powerPec: '1',
  porwerPercent: 0.5723,
  batteryPower: 0.000,
  batteryPowerStr: 'kW',
  batteryPowerPec: '1',
  batteryPowerZheng: 0,
  batteryPowerFu: 0,
  batteryPercent: 0,
  batteryDirection: 4,
  familyLoadPercent: 1000.000,
  psum: 0.000,
  psumStr: 'kW',
  psumPec: '1',
  psumZheng: 0,
  psumFu: 0,
  gridPurchasedTotalEnergyStr: 'kWh',
  gridSellTotalEnergyStr: 'kWh',
  gridPurchasedEnergy: 0.000,
  gridPurchasedEnergyStr: 'kWh',
  gridSellEnergy: 0.000,
  gridSellEnergyStr: 'kWh',
  gridPurchasedDayEnergy: 0.000,
  gridPurchasedDayEnergyStr: 'kWh',
  gridSellDayEnergy: 0.000,
  gridSellDayEnergyStr: 'kWh',
  gridPurchasedMonthEnergy: 0.000,
  gridPurchasedMonthEnergyStr: 'kWh',
  gridSellMonthEnergy: 0.000,
  gridSellMonthEnergyStr: 'kWh',
  gridPurchasedYearEnergy: 0.000,
  gridPurchasedYearEnergyStr: 'kWh',
  gridSellYearEnergy: 0.000,
  gridSellYearEnergyStr: 'kWh',
  batteryDischargeEnergy: 0.000,
  batteryDischargeEnergyStr: 'kWh',
  batteryChargeEnergy: 0.000,
  batteryChargeEnergyStr: 'kWh',
  batteryDischargeMonthEnergy: 0.000,
  batteryDischargeMonthEnergyStr: 'kWh',
  batteryChargeMonthEnergy: 0.000,
  batteryChargeMonthEnergyStr: 'kWh',
  batteryDischargeYearEnergy: 0.000,
  batteryDischargeYearEnergyStr: 'kWh',
  batteryChargeYearEnergy: 0.000,
  batteryChargeYearEnergyStr: 'kWh',
  batteryDischargeTotalEnergy: 0.000,
  batteryDischargeTotalEnergyStr: 'kWh',
  batteryChargeTotalEnergy: 0.000,
  batteryChargeTotalEnergyStr: 'kWh',
  familyLoadPower: 189.330,
  familyLoadPowerStr: 'kW',
  familyLoadPowerPec: '1',
  homeGridTodayEnergy: 0.000,
  homeGridTodayEnergyStr: 'kWh',
  homeGridMonthEnergy: 0.000,
  homeGridMonthEnergyStr: 'kWh',
  homeGridYearEnergy: 0.000,
  homeGridYearEnergyStr: 'kWh',
  homeGridTotalEnergy: 0,
  homeGridTotalEnergyStr: 'kWh',
  backupTodayEnergy: 0.000,
  backupTodayEnergyStr: 'kWh',
  backupMonthEnergy: 0.000,
  backupMonthEnergyStr: 'kWh',
  backupYearEnergy: 0.000,
  backupYearEnergyStr: 'kWh',
  backupTotalEnergy: 0,
  backupTotalEnergyStr: 'kWh',
  totalLoadPower: 189.330,
  totalLoadPowerStr: 'kW',
  bypassLoadPower: 0.000,
  bypassLoadPowerStr: 'kW',
  homeLoadEnergy: 1.197,
  homeLoadEnergyStr: 'MWh',
  homeLoadTodayEnergyStr: 'MWh',
  homeLoadMonthEnergy: 2.496,
  homeLoadYearEnergy: 2.496,
  picUrl: 'https://oss.example.com/picDefault/STATION_default_industry.png',
  weather: '日出:04:56 日落:19:06 19 - 29 苏州市 阴',
  sr: '04:56',
  ss: '19:06',
  tmpMax: '29',
  tmpMin: '19',
  tmpUnit: '℃',
  hum: '74',
  weatherUpdateDate: '1782428858000',
  weatherUpdateDateStr: '2026-06-26 07:07:38',
  pcpn: '2.0',
  pres: '1005',
  windSpd: '3',
  windDir: '北风',
  weatherType: 0,
  windSpeed: 0,
  windDirection: 0,
  humidity: 0,
  temp: 0,
  rainfall: 0,
  airPressure: 0,
  contribution: 0,
  screenMap: 0,
  screenGuideState: 0,
  storedInverterType: 0,
  countryShortName: 'CN',
  inverterPower: 300.000,
  bypassAcOnoffSet: 0,
  priceMap: {
    sell: '0.7000',
    buy: '0'
  },
  sysGridPriceList: [
    {
      id: '909302',
      createDate: 1782177982000,
      updateDate: 1782177982000,
      deleteFlag: 0,
      unit: '元',
      type: 0,
      source: 0,
      sellBuy: 0,
      refId: '',
      price: 0.7000
    },
    {
      unit: '元',
      type: 0,
      source: 0,
      sellBuy: 1,
      refId: ''
    }
  ],
  generatorPower: 0,
  generatorPowerStr: 'kW',
  generatorPowerPec: '1',
  generatorTodayEnergy: 0.000,
  generatorTodayEnergyStr: 'kWh',
  generatorTodayEnergyPec: '1',
  generatorMonthEnergy: 0,
  generatorMonthEnergyStr: 'kWh',
  generatorMonthEnergyPec: '1',
  generatorYearEnergy: 0,
  generatorYearEnergyStr: 'kWh',
  generatorYearEnergyPec: '1',
  generatorTotalEnergy: 0,
  generatorTotalEnergyStr: 'kWh',
  generatorTotalEnergyPec: '1',
  weatherCount: 0,
  powerAmmeter2: 0.000,
  hourEnergyAmmeter2: 0,
  dayEnergyAmmeter2: 0.000,
  dayIncomeAmmeter2: 0,
  monthEnergyAmmeter2: 0.000,
  monthIncomeAmmeter2: 0,
  yearEnergyAmmeter2: 0.000,
  yearIncomeAmmeter2: 0,
  totalEnergyAmmeter2: 0.000,
  totalIncomeAmmeter2: 0,
  doubleAmmeterStoragePower: 189.330,
  doubleAmmeterStorageDayEnergy: 1197.000,
  totalInvAcE: 0,
  totalGridBatteryE: 0,
  oneSelfVersion: 0,
  touscdSwitch: 0,
  dischargeOffsetPriceType: 0,
  chargeOffsetPriceType: 0,
  backup2Power: 0,
  backup2PowerStr: 'kW',
  acCoupledPower: 0,
  acCoupledPowerStr: 'kW',
  backup2TodayEnergy: 0,
  backup2TodayEnergyStr: 'kWh',
  backup2MonthEnergy: 0,
  backup2MonthEnergyStr: 'kWh',
  backup2YearEnergy: 0,
  backup2YearEnergyStr: 'kWh',
  backup2TotalEnergy: 0,
  backup2TotalEnergyStr: 'kWh',
  acCoupledTodayEnergy: 0,
  acCoupledTodayEnergyStr: 'kWh',
  acCoupledMonthEnergy: 0,
  acCoupledMonthEnergyStr: 'kWh',
  acCoupledYearEnergy: 0,
  acCoupledYearEnergyStr: 'kWh',
  acCoupledTotalEnergy: 0,
  acCoupledTotalEnergyStr: 'kWh',
  parallelOnoffValid: false,
  smartShow: 0,
  epmCostationSwitch: 0,
  touscdVersion: 0,
  touscdStrategyTemplate: '',
  extraInfo: '{"useV5":1,"epVersion":"v5","epSetting":{"exportMode":"manual","exportType":"fix"}}',
  dnspRegisterFlag: false,
  touscdPageVersion: 2,
  hybridInverterPower: 0,
  chargerPower: 0,
  totalAndSmartLoadPower: 0,
  roofType: 0,
  pvAndAcCoupledPower: 0,
  firstOldBatterySn: 'nullBAT01',
  sscCurrentFlowMap: {
    gridToLoad: 0,
    batteryToLoad: 0,
    batteryToGrid: 0,
    pvToBattery: 0
  },
  currentFlowMapV3: {
    load: 0,
    grid: 0,
    inverterToElectricBox: 0,
    pvToInverter: 0
  },
  industryCurrentFlowMapV2: {
    gridToLoad: 0,
    batteryToLoad: 0,
    batteryToGrid: 0,
    pvToBattery: 0,
    gridOrGen: 0,
    pvToLoad: 0,
    pvToGrid: 0
  },
  industryCurrentFlowMapGplot: {
    grid: 0,
    inverterToElectricBox: 0,
    battery: 0
  },
  energyUnit: 'kWh',
  pvStorageGridInvPower: 0,
  pvStorageGridInvTodayEnergy: 0,
  pvStorageGridInvMonthEnergy: 0,
  pvStorageGridInvYearEnergy: 0,
  pvStorageGridInvTotalEnergy: 0,
  notPvStorageGridInvPower: 0,
  powerStorage: 0,
  dayEnergyStorage: 0,
  hybridPower: 0,
  batteryCapacityAutoSwitch: 0,
  batteryCapacityEnergyUnit: 'kWh',
  powerOriginV2: 189330.00000,
  powerAmmeter2Origin: 0,
  acCoupledPowerOrigin: 0,
  inverterPowerStr: 'kW',
  hybridInverterPowerStr: 'kW',
  chargerPowerStr: 'kW',
  totalAndSmartLoadPowerStr: 'kW',
  totalAndSmartLoadPowerOrigin: 0,
  powerV2: 189.330,
  powerStrV2: 'kW',
  pvAndAcCoupledPowerStr: 'kW',
  pvAndAcCoupledPowerOrigin: 0,
  psumV2: 0.000,
  psumStrV2: 'kW',
  batteryPowerV2: 0.000,
  batteryPowerStrV2: 'kW',
  familyLoadPowerV2: 189.330,
  familyLoadPowerStrV2: 'kW',
  familyLoadPowerOrigin: 189330.000,
  bypassLoadPowerOrigin: 0,
  generatorPowerOrigin: 0,
  psumOrgin: 0,
  batteryPowerOrigin: 0,
  backup2PowerOrigin: 0,
  totalLoadPowerOrigin: 189330.000,
  batteryPowerOriginV2: 0,
  pvStorageGridInvPowerOrigin: 0,
  homeLoadMonthEnergyStr: 'MWh',
  homeLoadYearEnergyStr: 'MWh',
  homeLoadTotalEnergyStr: 'MWh',
  batteryTodayChargeEnergyUnit: 'kWh',
  batteryTodayDischargeEnergyUnit: 'kWh',
  batteryTotalChargeEnergyUnit: 'kWh',
  batteryTotalDischargeEnergyUnit: 'kWh',
  generatorPowerV2: 0,
  generatorPowerStrV2: 'kW',
  generatorTodayEnergyV2: 0.000,
  generatorTodayEnergyUnitV2: 'kWh',
  powerAmmeter2Str: 'kW',
  powerAmmeter2Pec: '1',
  dayEnergyAmmeter2Str: 'kWh',
  dayEnergyAmmeter2Pec: '1',
  monthEnergyAmmeter2Str: 'kWh',
  monthEnergyAmmeter2Pec: '1',
  yearEnergyAmmeter2Str: 'kWh',
  yearEnergyAmmeter2Pec: '1',
  totalEnergyAmmeter2Str: 'kWh',
  totalEnergyAmmeter2Pec: '1',
  doubleAmmeterStoragePowerStr: 'kW',
  doubleAmmeterStoragePowerPec: '1',
  doubleAmmeterStorageDayEnergyStr: 'MWh',
  doubleAmmeterStorageDayEnergyPec: '0.001',
  batteryCapacityEnergyStr: 'kWh',
  batteryCapacityEnergyOrigin: 0,
  batteryCapacityStr: 'kWh',
  inverterBatteryCapacityStr: 'kWh',
  pvStorageGridInvPowerStr: 'kW',
  notPvStorageGridInvPowerOrigin: 0,
  notPvStorageGridInvPowerStr: 'kW',
  hybridPowerOrigin: 0,
  hybridPowerStr: 'kW',
  powerStorageStr: 'kW',
  pvStorageGridInvTodayEnergyStr: 'kWh',
  dayEnergyStorageStr: 'kWh',
  pvStorageGridInvMonthEnergyStr: 'kWh',
  pvStorageGridInvYearEnergyStr: 'kWh',
  pvStorageGridInvTotalEnergyStr: 'kWh',
  compatibleCityStr: '苏州市',
  dayEnergy1: 0,
  power1: 0,
  batteryCapacityEnergyOriginal: 0,
  batteryTodayChargeEnergyOriginal: 0,
  batteryTodayDischargeEnergyOriginal: 0,
  batteryTotalChargeEnergyOriginal: 0,
  batteryTotalDischargeEnergyOriginal: 0,
  monthEnergy1: 0,
  yearEnergy1: 0
}

/** 电站列表 mock（与 MOCK_STATION_DETAIL 同源） */
export const MOCK_STATION_LIST = [
  {
    id: MOCK_STATION_DETAIL.id,
    stationName: MOCK_STATION_DETAIL.stationName,
    sno: MOCK_STATION_DETAIL.sno,
    state: MOCK_STATION_DETAIL.state,
    inverterCount: MOCK_STATION_DETAIL.inverterCount,
    inverterOnlineCount: MOCK_STATION_DETAIL.inverterOnlineCount
  }
]

/** 获取 mock stationDetail（轮询时刷新时间戳） */
export function getMockStationDetail () {
  return {
    ...MOCK_STATION_DETAIL,
    dataTimestamp: String(Date.now()),
    updateDate: Date.now()
  }
}

/** 日运行曲线 mock：2026-06-25，5 分钟间隔 04:45–13:45 */
export const MOCK_DAY_RUNTIME_RECORDS = [
  {
    timeStr: '04:45:00',
    power: 300,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 300
  },
  {
    timeStr: '04:50:00',
    power: 880,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 880
  },
  {
    timeStr: '04:55:00',
    power: 970,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 970
  },
  {
    timeStr: '05:00:00',
    power: 1600,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 1600
  },
  {
    timeStr: '05:05:00',
    power: 2650,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 2650
  },
  {
    timeStr: '05:10:00',
    power: 3960,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 3960
  },
  {
    timeStr: '05:15:00',
    power: 5870,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 5870
  },
  {
    timeStr: '05:20:00',
    power: 8010,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 8010
  },
  {
    timeStr: '05:25:00',
    power: 10390,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 10390
  },
  {
    timeStr: '05:30:00',
    power: 10950,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 10950
  },
  {
    timeStr: '05:35:00',
    power: 13740,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 13740
  },
  {
    timeStr: '05:40:00',
    power: 13290,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 13290
  },
  {
    timeStr: '05:45:00',
    power: 7720,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 7720
  },
  {
    timeStr: '05:50:00',
    power: 6080,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 6080
  },
  {
    timeStr: '05:55:00',
    power: 6320,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 6320
  },
  {
    timeStr: '06:00:00',
    power: 11990,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 11990
  },
  {
    timeStr: '06:05:00',
    power: 20950,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 20950
  },
  {
    timeStr: '06:10:00',
    power: 26310,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 26310
  },
  {
    timeStr: '06:15:00',
    power: 33370,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 33370
  },
  {
    timeStr: '06:20:00',
    power: 36910,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 36910
  },
  {
    timeStr: '06:25:00',
    power: 40590,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 40590
  },
  {
    timeStr: '06:30:00',
    power: 41580,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 41580
  },
  {
    timeStr: '06:35:00',
    power: 44180,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 44180
  },
  {
    timeStr: '06:40:00',
    power: 52010,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 52010
  },
  {
    timeStr: '06:45:00',
    power: 53100,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 53100
  },
  {
    timeStr: '06:50:00',
    power: 59640,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 59640
  },
  {
    timeStr: '06:55:00',
    power: 65540,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 65540
  },
  {
    timeStr: '07:00:00',
    power: 70070,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 70070
  },
  {
    timeStr: '07:05:00',
    power: 74940,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 74940
  },
  {
    timeStr: '07:10:00',
    power: 79990,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 79990
  },
  {
    timeStr: '07:15:00',
    power: 85610,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 85610
  },
  {
    timeStr: '07:20:00',
    power: 91650,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 91650
  },
  {
    timeStr: '07:25:00',
    power: 94100,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 94100
  },
  {
    timeStr: '07:30:00',
    power: 100930,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 100930
  },
  {
    timeStr: '07:35:00',
    power: 104160,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 104160
  },
  {
    timeStr: '07:40:00',
    power: 105970,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 105970
  },
  {
    timeStr: '07:45:00',
    power: 111440,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 111440
  },
  {
    timeStr: '07:50:00',
    power: 119850,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 119850
  },
  {
    timeStr: '07:55:00',
    power: 126560,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 126560
  },
  {
    timeStr: '08:00:00',
    power: 128520,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 128520
  },
  {
    timeStr: '08:05:00',
    power: 134780,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 134780
  },
  {
    timeStr: '08:10:00',
    power: 141730,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 141730
  },
  {
    timeStr: '08:15:00',
    power: 148270,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 148270
  },
  {
    timeStr: '08:20:00',
    power: 149840,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 149840
  },
  {
    timeStr: '08:25:00',
    power: 155370,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 155370
  },
  {
    timeStr: '08:30:00',
    power: 158090,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 158090
  },
  {
    timeStr: '08:35:00',
    power: 165810,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 165810
  },
  {
    timeStr: '08:40:00',
    power: 167540,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 167540
  },
  {
    timeStr: '08:45:00',
    power: 170060,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 170060
  },
  {
    timeStr: '08:50:00',
    power: 182590,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 182590
  },
  {
    timeStr: '08:55:00',
    power: 185330,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 185330
  },
  {
    timeStr: '09:00:00',
    power: 195020,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 195020
  },
  {
    timeStr: '09:05:00',
    power: 199890,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 199890
  },
  {
    timeStr: '09:10:00',
    power: 200530,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 200530
  },
  {
    timeStr: '09:15:00',
    power: 206020,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 206020
  },
  {
    timeStr: '09:20:00',
    power: 207030,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 207030
  },
  {
    timeStr: '09:25:00',
    power: 213210,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 213210
  },
  {
    timeStr: '09:30:00',
    power: 216090,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 216090
  },
  {
    timeStr: '09:35:00',
    power: 217920,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 217920
  },
  {
    timeStr: '09:40:00',
    power: 221630,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 221630
  },
  {
    timeStr: '09:45:00',
    power: 226810,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 226810
  },
  {
    timeStr: '09:50:00',
    power: 227580,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 227580
  },
  {
    timeStr: '09:55:00',
    power: 230220,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 230220
  },
  {
    timeStr: '10:00:00',
    power: 233530,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 233530
  },
  {
    timeStr: '10:05:00',
    power: 235970,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 235970
  },
  {
    timeStr: '10:10:00',
    power: 235780,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 235780
  },
  {
    timeStr: '10:15:00',
    power: 238290,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 238290
  },
  {
    timeStr: '10:20:00',
    power: 239990,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 239990
  },
  {
    timeStr: '10:25:00',
    power: 244210,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 244210
  },
  {
    timeStr: '10:30:00',
    power: 245860,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 245860
  },
  {
    timeStr: '10:35:00',
    power: 246470,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 246470
  },
  {
    timeStr: '10:40:00',
    power: 249080,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 249080
  },
  {
    timeStr: '10:45:00',
    power: 248760,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 248760
  },
  {
    timeStr: '10:50:00',
    power: 249640,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 249640
  },
  {
    timeStr: '10:55:00',
    power: 252440,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 252440
  },
  {
    timeStr: '11:00:00',
    power: 253530,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 253530
  },
  {
    timeStr: '11:05:00',
    power: 254570,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 254570
  },
  {
    timeStr: '11:10:00',
    power: 253820,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 253820
  },
  {
    timeStr: '11:15:00',
    power: 255070,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 255070
  },
  {
    timeStr: '11:20:00',
    power: 261350,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 261350
  },
  {
    timeStr: '11:25:00',
    power: 260650,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 260650
  },
  {
    timeStr: '11:30:00',
    power: 264430,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 264430
  },
  {
    timeStr: '11:35:00',
    power: 264190,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 264190
  },
  {
    timeStr: '11:40:00',
    power: 263210,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 263210
  },
  {
    timeStr: '11:45:00',
    power: 266400,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 266400
  },
  {
    timeStr: '11:50:00',
    power: 261290,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 261290
  },
  {
    timeStr: '11:55:00',
    power: 256110,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 256110
  },
  {
    timeStr: '12:00:00',
    power: 269460,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 269460
  },
  {
    timeStr: '12:05:00',
    power: 279100,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 279100
  },
  {
    timeStr: '12:10:00',
    power: 266330,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 266330
  },
  {
    timeStr: '12:15:00',
    power: 270110,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 270110
  },
  {
    timeStr: '12:20:00',
    power: 251900,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 251900
  },
  {
    timeStr: '12:25:00',
    power: 268080,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 268080
  },
  {
    timeStr: '12:30:00',
    power: 243680,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 243680
  },
  {
    timeStr: '12:35:00',
    power: 185430,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 185430
  },
  {
    timeStr: '12:40:00',
    power: 189330,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 189330
  },
  {
    timeStr: '12:45:00',
    power: 181560,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 181560
  },
  {
    timeStr: '12:50:00',
    power: 147600,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 147600
  },
  {
    timeStr: '12:55:00',
    power: 164520,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 164520
  },
  {
    timeStr: '13:00:00',
    power: 145700,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 145700
  },
  {
    timeStr: '13:05:00',
    power: 91650,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 91650
  },
  {
    timeStr: '13:10:00',
    power: 86350,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 86350
  },
  {
    timeStr: '13:15:00',
    power: 82330,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 82330
  },
  {
    timeStr: '13:20:00',
    power: 75470,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 75470
  },
  {
    timeStr: '13:25:00',
    power: 104070,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 104070
  },
  {
    timeStr: '13:30:00',
    power: 148910,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 148910
  },
  {
    timeStr: '13:35:00',
    power: 172550,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 172550
  },
  {
    timeStr: '13:40:00',
    power: 239880,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 239880
  },
  {
    timeStr: '13:45:00',
    power: 234660,
    powerPec: '0.001',
    familyLoadPower: 0,
    psum: 0,
    oneSelf: 234660
  }
]

/** 月运行 mock：2026-06 按日汇总（6/23–6/26） */
export const MOCK_MONTH_RUNTIME_RECORDS = [
  {
    dateStr: '2026-06-23',
    money: 117.53,
    moneyPec: '1',
    energy: 167.9,
    energyPec: '0.001',
    energyStr: 'MWh',
    fullHour: 0.51,
    gridPurchasedEnergy: 0,
    gridSellEnergy: 0,
    homeLoadEnergy: 167.9,
    oneSelf: 167.9
  },
  {
    dateStr: '2026-06-24',
    money: 397.11,
    moneyPec: '1',
    energy: 567.3,
    energyPec: '0.001',
    energyStr: 'MWh',
    fullHour: 1.71,
    gridPurchasedEnergy: 0,
    gridSellEnergy: 0,
    homeLoadEnergy: 567.3,
    oneSelf: 567.3
  },
  {
    dateStr: '2026-06-25',
    money: 394.31,
    moneyPec: '1',
    energy: 563.3,
    energyPec: '0.001',
    energyStr: 'MWh',
    fullHour: 1.7,
    gridPurchasedEnergy: 0,
    gridSellEnergy: 0,
    homeLoadEnergy: 563.3,
    oneSelf: 563.3
  },
  {
    dateStr: '2026-06-26',
    money: 1039.29,
    moneyPec: '1',
    energy: 1484.7,
    energyPec: '0.001',
    energyStr: 'MWh',
    fullHour: 4.49,
    gridPurchasedEnergy: 0,
    gridSellEnergy: 0,
    homeLoadEnergy: 1484.7,
    oneSelf: 1484.7
  }
]

/** 年运行 mock：2026 按月汇总（当前仅 6 月有数据） */
export const MOCK_YEAR_RUNTIME_RECORDS = [
  {
    dateStr: '2026-06',
    money: 1971.13,
    moneyPec: '1',
    moneyStr: '元',
    energy: 2815.9,
    energyPec: '0.001',
    energyStr: 'MWh',
    fullHour: 8.51,
    gridPurchasedEnergy: 0,
    gridSellEnergy: 0,
    homeLoadEnergy: 2815.9,
    oneSelf: 2815.9
  }
]
