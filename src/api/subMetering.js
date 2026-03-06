import request from '@/utils/request'

// 获取分项信息树
export function getSubTree(data) {
  return request({
    url: '/api/ebc-content/sub/subTree',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: data
  })
}

// 新增分项/子项
export function addSub(data) {
  return request({
    url: '/api/ebc-content/sub/add',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 修改分项
export function updateSub(data) {
  return request({
    url: '/api/ebc-content/sub/update',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 删除分项
export function deleteSub(data) {
  return request({
    url: '/api/ebc-content/sub/delete',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: data
  })
}

// 分页查询分项电表
export function pageSubMeter(data) {
  return request({
    url: '/api/ebc-content/sub/pageSubMeter',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 绑定/解绑电表
export function bindSubMeter(data) {
  return request({
    url: '/api/ebc-content/sub/bindSubMeter',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 统计用能
export function statisticUse(queryData, params) {
  return request({
    url: '/api/ebc-content/sub/statisticUse',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data: queryData,
    params
  })
}

// 桑基图数据
export function getSankeyDiagram(data) {
  return request({
    url: '/api/ebc-content/sub/sankeyDiagram',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: data
  })
}

// 分项排序
export function reSortSub(data) {
  return request({
    url: '/api/ebc-content/sub/reSortSub',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 获取电表最新详情数据
export function getMeterLastDetail(data) {
  return request({
    url: '/api/ebc-content/customerWorkbench/queryMeterLastDetail',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: data
  })
}

// 获取电表历史记录列表
export function getMeterRecordList(data) {
  return request({
    url: '/api/ebc-content/meterLive/getMeterRecordList',
    method: 'POST',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params: data
  })
}