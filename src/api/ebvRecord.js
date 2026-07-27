import request from '@/utils/request'

// 核查联列表查询
export function getEbvRecordList (data) {
  return request({
    url: '/api/ebc-content/ebvRecord/list',
    method: 'post',
    data: data, // body
    headers: {
      userDeviceType: 'PC'
    }
  })
}

// 修改核查联
export function editEbvRecord (data) {
  return request({
    url: '/api/ebc-content/ebvRecord/editEbv',
    method: 'post',
    data: data,
    headers: {
      userDeviceType: 'PC'
    }
  })
}
