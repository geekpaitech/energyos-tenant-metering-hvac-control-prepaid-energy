// @/api/labelManage.js
import request from '@/utils/request'

export function fetchLabelList (data) {
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

export function addLabel (data) {
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

export function updateLabel (data) {
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

export function deleteLabel (params) {
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
