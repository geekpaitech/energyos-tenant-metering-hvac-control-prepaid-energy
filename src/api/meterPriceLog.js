import request from '@/utils/request'

// 电表调价日志 - 查询调价日志（分页）
export function meterPriceLogPageMeterPriceLog (data) {
  return request({
    url: '/api/ebc-content/meterPriceLog/pageMeterPriceLog',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 电表调价日志 - 撤回
export function meterPriceLogWithdraw (data) {
  return request({
    url: '/api/ebc-content/meterPriceLog/withdraw',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}
