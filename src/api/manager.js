import request from '@/utils/request'

// 获取用户管理方列表
export function getManagerListByUser () {
  return request({
    url: '/api/ebc-content/manager/getManagerListByUser',
    method: 'post',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    }
  })
}
export function getManagerById (params) {
  return request({
    url: '/api/ebc-content/manager/getManagerById',
    method: 'post',
    params
  })
}

// 分页查询管理方列表
export function managerPageManager (data) {
  return request({
    url: '/api/ebc-content/manager/pageManager',
    method: 'post',
    data
  })
}

// 新增管理方
export function managerAddManager (data) {
  return request({
    url: '/api/ebc-content/manager/addManager',
    method: 'post',
    data
  })
}

// 更新管理方信息
export function managerUpdateManager (data) {
  return request({
    url: '/api/ebc-content/manager/updateManager',
    method: 'post',
    data
  })
}

// 设置默认管理方
export function setDefaultManagerByUser (params) {
  return request({
    url: '/api/ebc-content/manager/setDefaultManagerByUser',
    method: 'post',
    params
  })
}
