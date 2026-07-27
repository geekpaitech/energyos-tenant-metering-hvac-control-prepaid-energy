import request from '@/utils/request'

// 创建电费核查联会话
export function addEBVSession (data) {
  return request({
    url: '/api/ebc-content/userSessionMsg/addEBV',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 创建/修改普通会话
export function addUserSessionMsg (data) {
  return request({
    url: '/api/ebc-content/userSessionMsg/addUserSessionMsg',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

export function getUserSessionMsgList (data) {
  return request({
    url: '/api/ebc-content/userSessionMsg/list',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 会话-列表查询
export function getEBVSessionList (data) {
  return request({
    url: '/api/ebc-content/userSessionMsg/list',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 删除会话
export function deleteEBVSession (id) {
  return request({
    url: '/api/ebc-content/userSessionMsg/delete',
    method: 'post',
    headers: {
      userDeviceType: 'PC'
    },
    params: { id }
  })
}
