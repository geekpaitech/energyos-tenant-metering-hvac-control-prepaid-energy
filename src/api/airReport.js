// @/api/airReport.js
import request from '@/utils/request'

// 获取空调每日电量
export function listAirUse(data) {
  return request({
    url: '/api/ebc-settle/air/listAirUse',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}