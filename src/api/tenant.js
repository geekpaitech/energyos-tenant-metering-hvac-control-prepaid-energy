import request from '@/utils/request'
export function tenantPageTenant(data) {
    return request({
      url: '/api/ebc-content/tenant/list',
      method: 'post',
      headers: {
        'userDeviceType': 'PC',
        'Content-Type': 'application/json'
      },
      data
    })
  }