import { ENERGY_SCREEN_MANAGER_IDS, MANAGER_TO_BUSINESS } from '@/views/energy-screen/config'
import { createDemoSnapshot, percentage } from '../nandu-energy-screen/data'

// Display anchors belong to the supplied regional illustration, not geographic coordinates.
// Keep the address/source separate so a future GIS layer can replace the illustration.
const registry = [
  { id: '1000107', name: '南都广场', shortName: '南都广场', address: '枫津南路18号', scene: 'nandu', hasPv: true, point: [54, 28], label: [50, 16], factor: 1, counts: [320, 48, 216], offline: [6, 2, 6] },
  { id: '1000171', name: '吴淞江新邻荟', shortName: '吴淞江新邻荟', address: '淞苇路1084号', scene: 'wusong', point: [71, 21], label: [77, 7], factor: 0.74, counts: [238, 64, 180], offline: [4, 1, 3] },
  { id: '1000175', name: '苏旺商务中心广场', shortName: '苏旺商务中心', address: '南官渡路500号', scene: 'suwang', point: [23, 66], label: [27, 62], factor: 1.82, counts: [508, 92, 368], offline: [8, 1, 9] },
  { id: '1000178', name: '经开-机器人产业园', shortName: '机器人产业园', address: '吴中大道1368号', scene: null, point: [40, 39], label: [45, 48], factor: 1.46, counts: [412, 76, 254], offline: [11, 2, 7] },
  { id: '1000183', name: '塔韵商务广场', shortName: '塔韵商务广场', address: '塔韵路188号', scene: 'tayun', point: [31, 35], label: [22, 23], factor: 0.61, counts: [196, 38, 142], offline: [3, 0, 2] },
  { id: '1000198', name: 'OPC人工智能产业园', shortName: 'OPC人工智能产业园', address: '南湖路58号', scene: null, point: [61, 32], label: [76, 44], factor: 1.34, counts: [368, 72, 296], offline: [5, 1, 4] }
]

export const PROJECTS = registry.filter(project => ENERGY_SCREEN_MANAGER_IDS.includes(project.id)).map(project => ({
  ...project, business: MANAGER_TO_BUSINESS[project.id], businessName: MANAGER_TO_BUSINESS[project.id] === 'industrial' ? '产业园' : '商办', hasPv: Boolean(project.hasPv)
}))

export function createProjectSnapshot (project) {
  const base = createDemoSnapshot()
  const scaled = value => Math.round(value * project.factor)
  if (project.id !== '1000107') {
    const e = base.energy
    ;['tenant', 'common', 'indoor', 'tenantToday', 'commonToday', 'waterToday', 'tenantWater'].forEach(key => { e[key] = scaled(e[key]) })
    e.airConditioning = e.tenant - e.indoor
    e.total = e.tenant + e.common
    e.projectToday = e.tenantToday + e.commonToday
    e.gridImport = e.total
    e.indoorPercent = percentage(e.indoor, e.tenant)
    e.airConditioningPercent = percentage(e.airConditioning, e.tenant)
    base.trend = base.trend.map(row => ({ ...row, value: scaled(row.value) }))
    base.photovoltaic = { generated: 0, selfUse: 0, exported: 0, selfUsePercent: 0, zones: [] }
    base.finance.categories = base.finance.categories.map((category, index) => {
      const receivable = scaled(category.receivable)
      return { ...category, receivable, received: Math.round(receivable * (0.935 + (Number(project.id.slice(-1)) + index) % 5 * 0.008)) }
    })
    base.finance.receivable = base.finance.categories.reduce((sum, row) => sum + row.receivable, 0)
    base.finance.received = base.finance.categories.reduce((sum, row) => sum + row.received, 0)
    base.finance.outstanding = base.finance.receivable - base.finance.received
    base.finance.collectionPercent = percentage(base.finance.received, base.finance.receivable)
    base.finance.balance = scaled(base.finance.balance)
    base.devices.types = base.devices.types.map((type, index) => ({ ...type, total: project.counts[index], offline: project.offline[index], online: project.counts[index] - project.offline[index] }))
    base.devices.total = project.counts.reduce((a, b) => a + b, 0)
    base.devices.offline = project.offline.reduce((a, b) => a + b, 0)
    base.devices.online = base.devices.total - base.devices.offline
    base.devices.onlinePercent = percentage(base.devices.online, base.devices.total)
    const ac = base.devices.types[2]
    const running = Math.round(ac.online * 0.71)
    base.devices.airConditioning = { total: ac.total, running, standby: ac.online - running, offline: ac.offline }
    base.deviceRecords = base.devices.types.reduce((records, type) => records.concat(Array.from({ length: type.total }, (_, index) => ({
      id: `${type.key.toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
      name: `${type.name} ${String(index + 1).padStart(3, '0')}`,
      type: type.key,
      typeName: type.name,
      status: index >= type.online ? 'offline' : (type.key === 'ac' && index >= running ? 'standby' : 'online'),
      updatedAt: index >= type.online ? '09:57' : '10:30'
    }))), [])
    base.events = [
      { id: 'EV-002', time: '10:24', title: '空调采集通信异常', detail: `${ac.offline} 台空调内机暂未返回状态，等待排查采集链路。`, severity: '重要', status: '待排查', deviceType: 'ac' },
      { id: 'EV-001', time: '09:57', title: '计量采集链路异常', detail: `${project.offline[0]} 台电表、${project.offline[1]} 台水表暂未更新，等待排查。`, severity: '重要', status: '待排查', deviceType: 'electric' }
    ]
  }
  base.projectId = project.id
  base.projectName = project.name
  return base
}

export function aggregateSnapshots (snapshots) {
  const total = createDemoSnapshot()
  const sum = (section, key) => snapshots.reduce((value, snapshot) => value + snapshot[section][key], 0)
  Object.keys(total.energy).filter(key => !key.endsWith('Percent')).forEach(key => { total.energy[key] = sum('energy', key) })
  total.energy.indoorPercent = percentage(total.energy.indoor, total.energy.tenant)
  total.energy.airConditioningPercent = percentage(total.energy.airConditioning, total.energy.tenant)
  ;['generated', 'selfUse', 'exported'].forEach(key => { total.photovoltaic[key] = sum('photovoltaic', key) })
  total.photovoltaic.selfUsePercent = percentage(total.photovoltaic.selfUse, total.photovoltaic.generated)
  total.photovoltaic.zones = snapshots.flatMap(snapshot => snapshot.photovoltaic.zones.map(zone => ({ ...zone, name: `${snapshot.projectName} · ${zone.name}` })))
  ;['total', 'online', 'offline'].forEach(key => { total.devices[key] = sum('devices', key) })
  total.devices.onlinePercent = percentage(total.devices.online, total.devices.total)
  total.devices.types = total.devices.types.map(type => ({ ...type, ...Object.fromEntries(['total', 'online', 'offline'].map(key => [key, snapshots.reduce((sum, snapshot) => sum + snapshot.devices.types.find(item => item.key === type.key)[key], 0)])) }))
  Object.keys(total.devices.airConditioning).forEach(key => { total.devices.airConditioning[key] = snapshots.reduce((sum, snapshot) => sum + snapshot.devices.airConditioning[key], 0) })
  total.deviceRecords = snapshots.flatMap(snapshot => snapshot.deviceRecords.map(device => ({ ...device, id: `${snapshot.projectId}-${device.id}`, name: `${snapshot.projectName} · ${device.name}` })))
  total.events = snapshots.flatMap(snapshot => snapshot.events.map(event => ({ ...event, id: `${snapshot.projectId}-${event.id}`, projectId: snapshot.projectId, projectName: snapshot.projectName })))
  ;['receivable', 'received', 'outstanding', 'balance'].forEach(key => { total.finance[key] = sum('finance', key) })
  total.finance.collectionPercent = percentage(total.finance.received, total.finance.receivable)
  total.finance.categories = total.finance.categories.map(category => ({ name: category.name, ...Object.fromEntries(['receivable', 'received'].map(key => [key, snapshots.reduce((sum, snapshot) => sum + snapshot.finance.categories.find(row => row.name === category.name)[key], 0)])) }))
  total.trend = total.trend.map((point, index) => ({ ...point, value: snapshots.reduce((sum, snapshot) => sum + snapshot.trend[index].value, 0) }))
  return total
}

export function createGroupModel () {
  const projects = PROJECTS.map(project => ({ ...project, snapshot: createProjectSnapshot(project) }))
  return { projects, snapshot: aggregateSnapshots(projects.map(project => project.snapshot)) }
}
