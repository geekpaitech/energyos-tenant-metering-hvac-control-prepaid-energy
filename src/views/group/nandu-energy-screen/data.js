// Presentation snapshot only. Future manager integration should return this shape.
// Values are deterministic: changing tabs or reopening the page never invents consumption.
export const screenConfig = {
  projectName: '南都广场',
  title: '南都广场智慧能源管理大屏',
  subtitle: '智慧能源 · 绿色低碳 · 高效运营',
  width: 1920,
  height: 1080,
  landmarks: [
    { id: 'tower', label: '南都广场主楼', x: 43.1, y: 35, labelX: 33.1, labelY: 29.2, leader: [[40.6, 31.2], [43.1, 35]] },
    { id: 'podium', label: '裙楼屋顶光伏', x: 57.3, y: 56, labelX: 60.8, labelY: 48.9, leader: [[60.8, 51], [60, 51], [57.3, 56]] },
    { id: 'entrance', label: '项目入口', x: 56.3, y: 74.7, labelX: 52.1, labelY: 69.9, leader: [[55.7, 72], [56.3, 74.7]] }
  ]
}

export function percentage (part, total) {
  return total > 0 ? Number((part / total * 100).toFixed(1)) : 0
}

export function formatNumber (value) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(value)
}

export function createDemoSnapshot () {
  const tenantElectricity = 218600
  const commonElectricity = 68000
  const photovoltaicSelfUse = 15800
  const photovoltaicExport = 2800
  const deviceOnline = 570
  const deviceOffline = 14
  const indoorElectricity = 153020
  const airConditioningElectricity = 65580
  const receivable = 264500
  const received = 253920
  const deviceTypes = [
    { key: 'electric', name: '电表', icon: 'flash', total: 320, online: 314, offline: 6 },
    { key: 'water', name: '水表', icon: 'water', total: 48, online: 46, offline: 2 },
    { key: 'ac', name: '空调内机', icon: 'fan', total: 216, online: 210, offline: 6 }
  ]
  return {
    mode: 'demo',
    updatedAt: '2026.09.17 10:30',
    period: '2026.09.01 — 09.17',
    energy: {
      total: tenantElectricity + commonElectricity,
      tenant: tenantElectricity,
      common: commonElectricity,
      gridImport: tenantElectricity + commonElectricity - photovoltaicSelfUse,
      tenantToday: 12480,
      commonToday: 3940,
      projectToday: 16420,
      waterToday: 186,
      tenantWater: 3280,
      indoor: indoorElectricity,
      airConditioning: airConditioningElectricity,
      indoorPercent: percentage(indoorElectricity, tenantElectricity),
      airConditioningPercent: percentage(airConditioningElectricity, tenantElectricity)
    },
    trend: [
      { date: '09/10', value: 12100 },
      { date: '09/11', value: 12800 },
      { date: '09/12', value: 11900 },
      { date: '09/13', value: 10600 },
      { date: '09/14', value: 13200 },
      { date: '09/15', value: 13850 },
      { date: '09/16', value: 13400 }
    ],
    photovoltaic: {
      generated: photovoltaicSelfUse + photovoltaicExport,
      selfUse: photovoltaicSelfUse,
      exported: photovoltaicExport,
      selfUsePercent: percentage(photovoltaicSelfUse, photovoltaicSelfUse + photovoltaicExport),
      zones: [
        { name: '屋顶分区 A', generated: 7200, selfUse: 6120, exported: 1080 },
        { name: '屋顶分区 B', generated: 6400, selfUse: 5440, exported: 960 },
        { name: '屋顶分区 C', generated: 5000, selfUse: 4240, exported: 760 }
      ]
    },
    devices: {
      total: deviceOnline + deviceOffline,
      online: deviceOnline,
      offline: deviceOffline,
      onlinePercent: percentage(deviceOnline, deviceOnline + deviceOffline),
      types: deviceTypes,
      airConditioning: { total: 216, running: 148, standby: 62, offline: 6 }
    },
    deviceRecords: deviceTypes.reduce((records, type) => records.concat(Array.from({ length: type.total }, (_, index) => ({
      id: `${type.key.toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
      name: `${type.name} ${String(index + 1).padStart(3, '0')}`,
      type: type.key,
      typeName: type.name,
      status: index >= type.online ? 'offline' : (type.key === 'ac' && index >= 148 ? 'standby' : 'online'),
      updatedAt: index >= type.online ? '09:57' : '10:30'
    }))), []),
    events: [
      { id: 'EV-003', time: '10:24', title: '空调网关通信中断', detail: '6 台空调内机暂未返回状态，请检查网关供电与网络。', severity: '重要', status: '待排查', deviceType: 'ac' },
      { id: 'EV-002', time: '09:57', title: '计量采集链路异常', detail: '6 台电表、2 台水表暂未更新，恢复后需核对补传数据。', severity: '重要', status: '待排查', deviceType: 'electric' },
      { id: 'EV-001', time: '08:42', title: '采集通信短时中断', detail: '采集连接已于 08:46 恢复，该事件不计入当前离线设备。', severity: '提示', status: '已恢复', deviceType: 'water' }
    ],
    finance: {
      receivable,
      received,
      outstanding: receivable - received,
      collectionPercent: percentage(received, receivable),
      balance: 128640,
      categories: [
        { name: '电费', receivable: 239000, received: 230000 },
        { name: '水费', receivable: 18600, received: 17420 },
        { name: '服务费', receivable: 6900, received: 6500 }
      ]
    }
  }
}

export function loadScreenSnapshot () {
  // Replace this adapter when the manager and source API are confirmed.
  // No manager ID, credentials, external iframe or live API is used by the demo.
  return Promise.resolve(createDemoSnapshot())
}
