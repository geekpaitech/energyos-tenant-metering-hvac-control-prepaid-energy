// @/api/priceModifyRecord.js
import request from '@/utils/request'

// 分页查询改价记录
export function priceModifyRecordPageRecord(data) {
  return request({
    url: '/api/ebc-device/priceModifyRecord/pageRecord',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 重试改价
export function priceModifyRecordRetryModify(params) {
  return request({
    url: '/api/ebc-device/priceModifyRecord/retryModify',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}