import request from '@/utils/request'
// 桑基图API
function queryTenantSankey1(data) {
    return request({
      url: '/api/ebc-content/useReport/queryTenantSankey',
      method: 'POST',
      headers: {
        'userDeviceType': 'PC',
        'Content-Type': 'application/json'
      },
      data
    })
  }