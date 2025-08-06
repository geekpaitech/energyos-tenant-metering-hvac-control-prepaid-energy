// @/api/pay.js
import request from '@/utils/request'

// 统一预下单（手动充值）
export function payPreOrder(data) {
  return request({
    url: '/api/ebc-settle/pay/preOrder',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 线下充值
export function payOfflineRechargePreOrder(data) {
  return request({
    url: '/api/ebc-settle/pay/offlineRechargePreOrder',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 催缴
export function balancePush(tenantId) {
  return request({
    url: '/api/ebc-settle/pay/balancePush',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: { tenantId }
  })
}