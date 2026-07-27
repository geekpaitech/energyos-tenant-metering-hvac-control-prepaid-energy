// @/api/label.js
import request from '@/utils/request'

// 标签列表查询
export function labelList (data) {
  return request({
    url: '/api/ebc-content/label/list',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 新增标签
export function labelAdd (data) {
  return request({
    url: '/api/ebc-content/label/add',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 删除标签
export function labelDelete (params) {
  return request({
    url: '/api/ebc-content/label/delete',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 修改标签
export function labelUpdate (data) {
  return request({
    url: '/api/ebc-content/label/update',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}
