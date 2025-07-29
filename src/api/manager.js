import request from '@/utils/request'

// 获取用户管理方列表
export function getManagerListByUser() {
  return request({
    url: '/api/ebc-content/manager/getManagerListByUser',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    }
  })
}