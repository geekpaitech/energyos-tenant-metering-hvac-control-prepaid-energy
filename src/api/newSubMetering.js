import request from '@/utils/request'

// 1. 绑定节点(创建分类/设备)
export function bindNode (data) {
  return request({
    url: '/api/ebc-content/new/submeasure/bindNode',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 2. 删除节点/解绑电表
export function deleteNode (nodeId) {
  return request({
    url: '/api/ebc-content/new/submeasure/deleteNode',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params: { nodeId }
  })
}

// 3. 获取分项计量树
export function getTree (data) {
  return request({
    url: '/api/ebc-content/new/submeasure/getTree',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params: data
  })
}

// 4. 分页查询分项电表
export function pageSubMeter (data) {
  return request({
    url: '/api/ebc-content/new/submeasure/pageSubMeter',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 5. 修改节点
export function updateNode (data) {
  return request({
    url: '/api/ebc-content/new/submeasure/updateNode',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 6. 拖动节点
export function updateNodeByParentId (data) {
  return request({
    url: '/api/ebc-content/new/submeasure/updateNodeByParentId',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    data
  })
}

// 7. 获取分类下所有电表的日电量总计
export function getCategoryDailyEnergy (params) {
  return request({
    url: '/api/ebc-content/new/submeasure/getCategoryDailyEnergy',
    method: 'POST',
    headers: {
      userDeviceType: 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}
