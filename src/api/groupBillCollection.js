import request from '@/utils/request'
import {
  GROUP_ENERGY_MANAGERS,
  getGroupEnergyDateRange
} from './groupEnergyOverview'

const SETTLE_BASE = '/api/ebc-settle'
const REPORT_HEADERS = {
  userDeviceType: 'PC',
  'Content-Type': 'application/json'
}
function post (url, data) {
  return request({
    url,
    method: 'post',
    data,
    headers: REPORT_HEADERS,
    skipErrorMessage: true
  })
}

function ensureSuccess (response) {
  if (!response || String(response.code) !== '200') {
    throw new Error((response && response.msg) || '账单收缴统计请求失败')
  }
  return response.data || {}
}

function requiredNumber (value, field) {
  if (value == null || value === '') {
    throw new Error(`账单统计缺少字段：${field}`)
  }
  const number = Number(value)
  if (!Number.isFinite(number)) {
    throw new Error(`账单统计字段异常：${field}`)
  }
  return number
}

function round2 (value) {
  return Number(Number(value).toFixed(2))
}

export function queryManagerBillCollection ({ manager, range }) {
  return post(`${SETTLE_BASE}/capitalManage/tenantSettleStatis`, {
    managerId: manager.managerId,
    tenantId: '',
    startDate: range.startDate,
    endDate: range.endDate,
    tenantStatus: '0',
    tenantType: 0
  }).then(response => {
    const data = ensureSuccess(response)
    const electricityReceivable = requiredNumber(data.elecBillTotalAmt, 'elecBillTotalAmt')
    const waterReceivable = requiredNumber(data.waterBillTotalAmt, 'waterBillTotalAmt')
    const electricityCollected = requiredNumber(data.elecPayTotalAmt, 'elecPayTotalAmt')
    const waterCollected = requiredNumber(data.waterPayTotalAmt, 'waterPayTotalAmt')
    const receivable = round2(electricityReceivable + waterReceivable)
    const collected = round2(electricityCollected + waterCollected)

    return {
      ...manager,
      receivable,
      collected,
      uncollected: round2(receivable - collected),
      rate: receivable > 0 ? round2(collected / receivable * 100) : 0,
      electricityReceivable: round2(electricityReceivable),
      waterReceivable: round2(waterReceivable),
      electricityCollected: round2(electricityCollected),
      waterCollected: round2(waterCollected),
      available: true
    }
  })
}

/**
 * 集团驾驶舱专用水电收缴汇总。
 * 四个管理方独立取数；服务费不计入“租户水电收缴”口径。
 */
export async function queryGroupBillCollection ({
  period,
  managers = GROUP_ENERGY_MANAGERS
}) {
  const range = getGroupEnergyDateRange(period)
  const settled = await Promise.allSettled(
    managers.map(manager => queryManagerBillCollection({ manager, range }))
  )
  const projects = settled.map((result, index) => {
    if (result.status === 'fulfilled') return result.value
    return {
      ...managers[index],
      receivable: null,
      collected: null,
      uncollected: null,
      rate: null,
      available: false,
      error: result.reason && result.reason.message
        ? result.reason.message
        : '数据获取失败'
    }
  })
  const complete = projects.every(project => project.available)

  if (!complete) {
    return {
      range,
      projects,
      complete,
      receivable: null,
      collected: null,
      uncollected: null,
      rate: null
    }
  }

  const receivable = round2(projects.reduce((sum, project) => sum + project.receivable, 0))
  const collected = round2(projects.reduce((sum, project) => sum + project.collected, 0))
  return {
    range,
    projects,
    complete,
    receivable,
    collected,
    uncollected: round2(receivable - collected),
    rate: receivable > 0 ? round2(collected / receivable * 100) : 0
  }
}
