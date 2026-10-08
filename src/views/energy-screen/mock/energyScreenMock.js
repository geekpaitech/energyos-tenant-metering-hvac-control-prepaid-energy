/**
 * 综合能源管理大屏 — 演示用 Mock 数据（可整体删除）
 *
 * 生效场景（三选一）：
 *   1. 经开资管（集团模式）下「全部」业态
 *   2. 经开资管（集团模式）下「商办」业态
 *   3. 切换到「南都广场」管理方
 *
 * 仅覆盖以下三个模块，其余模块维持原样（--）：
 *   - 配电环境监测  footer.environmentPanel
 *   - 配电安全态势  right.powerSafety.cells
 *   - 配电运维告警  right.alarm.list
 *
 * 删除方式：删除本文件 + 移除 energyScreenApi.js 中的 import 与 applyEnergyScreenMock 调用。
 */
import moment from 'moment'
import { isPhotovoltaicReturnAvailable } from '../config'

/** 是否命中 Mock 场景 */
export function shouldApplyEnergyScreenMock (managerId, business) {
  return isPhotovoltaicReturnAvailable(managerId, business)
}

/** 告警时间：相对当前时间往前推，保证演示时看起来是「今天」的数据 */
function alarmTime (minutesAgo) {
  return moment().subtract(minutesAgo, 'minutes').format('MM/DD HH:mm')
}

/** 配电安全态势（2×2 卡片） */
function mockPowerSafety () {
  return {
    cells: [
      { key: 'transformerLoad', label: '变压器负载率', value: 62.5, unit: '%', icon: 'load', tone: 'cyan', status: '正常', statusTone: 'ok' },
      { key: 'maxTemp', label: '最高测点温度', value: 68.3, unit: '℃', icon: 'peak-temperature', tone: 'gold', status: '正常', statusTone: 'ok' },
      { key: 'groundResistance', label: '接地电阻', value: 2.4, unit: 'Ω', icon: 'ground', tone: 'green', status: '正常', statusTone: 'ok' },
      { key: 'maxResidual', label: '最大剩余电流', value: 126, unit: 'mA', icon: 'residual', tone: 'violet', status: '正常', statusTone: 'ok' }
    ]
  }
}

/** 配电运维告警（表格） */
function mockAlarm () {
  return {
    list: [
      { id: 1, time: alarmTime(6), content: '变压器绕组温度越限', level: '预警', status: '未处理' },
      { id: 2, time: alarmTime(42), content: '配电柜剩余电流超限', level: '一般', status: '未处理' },
      { id: 3, time: alarmTime(125), content: '烟感探测器故障', level: '预警', status: '已处理' },
      { id: 4, time: alarmTime(310), content: '变压器接地电阻偏高', level: '一般', status: '已处理' },
      { id: 5, time: alarmTime(1440), content: '配电回路电流波动', level: '一般', status: '已处理' }
    ]
  }
}

/** 配电环境监测 */
function mockEnvironmentPanel () {
  return [
    { key: 'temperature', label: '当前温度', value: 26.5, unit: '℃', icon: 'thermometer', tone: 'cyan', status: '正常', statusTone: 'ok' },
    { key: 'humidity', label: '当前湿度', value: 52, unit: '%', icon: 'drop', tone: 'blue', status: '正常', statusTone: 'ok' },
    { key: 'smoke', label: '烟雾报警器', value: 12, unit: '个', icon: 'smoke', tone: 'gold', status: '正常', statusTone: 'ok' },
    { key: 'flood', label: '水浸', value: 8, unit: '个', icon: 'flood', tone: 'blue', status: '正常', statusTone: 'ok' }
  ]
}

/**
 * 命中场景时覆盖三个模块，未命中则原样返回。
 * @param {Object} overview getEnergyScreenOverview 的返回结果
 * @param {{ managerId: string|null, business: string }} context
 */
export function applyEnergyScreenMock (overview, { managerId, business } = {}) {
  if (!overview || !shouldApplyEnergyScreenMock(managerId, business)) return overview

  overview.right = overview.right || {}
  overview.right.powerSafety = mockPowerSafety()
  overview.right.alarm = mockAlarm()

  overview.footer = overview.footer || {}
  overview.footer.environmentPanel = mockEnvironmentPanel()

  return overview
}
