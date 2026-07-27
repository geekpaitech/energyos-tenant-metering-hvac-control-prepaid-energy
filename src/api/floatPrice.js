import request from '@/utils/request'

// 浮动电价相关接口

// 分页查询浮动电价列表
export function floatPageFloat (data) {
  return request({
    url: '/api/ebc-settle/float/pageFloat',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 预查询浮动电价
export function floatPreQuery (data) {
  return request({
    url: '/api/ebc-settle/float/preQuery',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 创建浮动电价
export function floatDoFloat (data) {
  return request({
    url: '/api/ebc-settle/float/doFloat',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 查询浮动电价详情
export function queryFloatDetail (rid) {
  return request({
    url: '/api/ebc-settle/float/queryFloatDetail',
    method: 'post',
    headers: {
      userDeviceType: 'PC'
    },
    params: {
      rid
    }
  })
}

// 分页查询租户列表（用于树形结构）
export function tenantPage (data) {
  return request({
    url: '/api/ebc-content/tenant/page',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}
