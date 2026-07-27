import request from '@/utils/request'

export function adminUserPageUserInfo (data) {
  return request({
    url: '/api/ebc-auth/user/pageUserInfo',
    method: 'post',
    data
  })
}

export function adminUserUpdateUserInfo (data) {
  return request({
    url: '/api/ebc-auth/user/updateUserInfo',
    method: 'post',
    data
  })
}

export function adminResetPassword (userId) {
  return request({
    url: '/api/ebc-auth/auth/resetPassword',
    method: 'post',
    params: { userId }
  })
}

export function adminAddUser (data) {
  return request({
    url: '/api/ebc-auth/auth/addUser',
    method: 'post',
    data
  })
}

export function adminGetMenuTree (data) {
  return request({
    url: '/api/ebc-content/menu/getMenuTree',
    method: 'post',
    data
  })
}

export function adminMenuEnableDisable (params) {
  return request({
    url: '/api/ebc-content/menu/menuEnableDisable',
    method: 'post',
    params
  })
}

export function adminCreateMenu (data) {
  return request({
    url: '/api/ebc-content/menu/createMenu',
    method: 'post',
    data
  })
}

export function adminUpdateMenu (data) {
  return request({
    url: '/api/ebc-content/menu/updateMenu',
    method: 'post',
    data
  })
}

export function adminGetMenuStatistics (params) {
  return request({
    url: '/api/ebc-content/menu/getMenuStatistics',
    method: 'post',
    params
  })
}

export function adminGetMenuUser (data) {
  return request({
    url: '/api/ebc-content/menu/getMenuUser',
    method: 'post',
    data
  })
}

export function adminAddAllMenuRole (data) {
  return request({
    url: '/api/ebc-content/menuRole/addAllMenuRole',
    method: 'post',
    data
  })
}

export function adminGetMenuRoleListByRole (params) {
  return request({
    url: '/api/ebc-content/menuRole/getMenuRoleListByRole',
    method: 'post',
    params
  })
}

export function adminGetRolePage (data) {
  return request({
    url: '/api/ebc-content/menuRole/pageRole',
    method: 'post',
    data
  })
}

export function adminAddRole (data) {
  return request({
    url: '/api/ebc-content/menuRole/addRole',
    method: 'post',
    data
  })
}

export function adminGetUserManagerList (params) {
  return request({
    url: '/api/ebc-content/manager/getUserManagerList',
    method: 'post',
    params
  })
}

export function adminManagerPageManager (data) {
  return request({
    url: '/api/ebc-content/manager/pageManager',
    method: 'post',
    data
  })
}

export function adminManagerGetManagerListByUser () {
  return request({
    url: '/api/ebc-content/manager/getManagerListByUser',
    method: 'post'
  })
}

export function adminManagerGetUserManagerBatchList (data) {
  return request({
    url: '/api/ebc-content/manager/getUserManagerBatchList',
    method: 'post',
    data
  })
}

export function adminAddManagerUser (params) {
  return request({
    url: '/api/ebc-content/manager/addManagerUser',
    method: 'post',
    params
  })
}

export function adminRemoveManagerUser (params) {
  return request({
    url: '/api/ebc-content/manager/removeManagerUser',
    method: 'post',
    params
  })
}

export function adminTenantList (data) {
  return request({
    url: '/api/ebc-content/tenant/list',
    method: 'post',
    data
  })
}

export function adminTenantGetPhoneTenantList (params) {
  return request({
    url: '/api/ebc-content/tenant/getPhoneTenantList',
    method: 'post',
    params
  })
}

export function adminTenantGetPhoneTenantBatchList (data) {
  return request({
    url: '/api/ebc-content/tenant/getPhoneTenantBatchList',
    method: 'post',
    data
  })
}

export function adminTenantBindUserToTenant (params) {
  return request({
    url: '/api/ebc-content/tenant/bindUserToTenant',
    method: 'post',
    params
  })
}

export function adminTenantUnbindUserToTenant (params) {
  return request({
    url: '/api/ebc-content/tenant/unbindUserToTenant',
    method: 'post',
    params
  })
}

// Admin Air - isolated API set
export function adminAirInfoPageAir (data) {
  return request({ url: '/api/ebc-content/airInfo/pageAir', method: 'post', data })
}
export function adminAirInfoControlAir (data) {
  return request({ url: '/api/ebc-content/airInfo/controlAir', method: 'post', data })
}
export function adminAirInfoBatchBindAirInfo (params) {
  return request({ url: '/api/ebc-content/airInfo/batchBindAirInfo', method: 'post', params })
}
export function adminAirInfoBathcLockAir (data) {
  return request({ url: '/api/ebc-content/airInfo/bathcLockAir', method: 'post', data })
}
export function adminAirInfoBatchBindAir (data) {
  return request({ url: '/api/ebc-content/airInfo/batchBindAir', method: 'post', data })
}
export function adminAirInfoBindTenantAir (params) {
  return request({ url: '/api/ebc-content/airInfo/bindTenantAir', method: 'post', params })
}
export function adminAirInfoCreateAir (data) {
  return request({ url: '/api/ebc-content/airInfo/createAir', method: 'post', data })
}
export function adminAirInfoDelete (params) {
  return request({ url: '/api/ebc-content/airInfo/delete', method: 'post', params })
}
export function adminAirInfoGetTenantAirBindEdit (params) {
  return request({ url: '/api/ebc-content/airInfo/getTenantAirBindEdit', method: 'post', params })
}
export function adminAirInfoLockAir (data) {
  return request({ url: '/api/ebc-content/airInfo/lockAir', method: 'post', data })
}
export function adminAirInfoUpdateAir (data) {
  return request({ url: '/api/ebc-content/airInfo/updateAir', method: 'post', data })
}
export function adminAirInfoUpdateBillingMode (data) {
  return request({ url: '/api/ebc-content/airInfo/updateBillingMode', method: 'post', data })
}
export function adminAirInfoGetAirById (params) {
  return request({ url: '/api/ebc-content/airInfo/getAirById', method: 'post', params })
}
export function adminAirInfoQueryAirUseStatis (data) {
  return request({ url: '/api/ebc-content/airInfo/queryAirUseStatis', method: 'post', data })
}
export function adminAirInfoListAirInfo (params) {
  return request({ url: '/api/ebc-content/airInfo/listAirInfo', method: 'post', params })
}
export function adminAirInfoPageAirAccumulateUse (data) {
  return request({ url: '/api/ebc-content/airInfo/pageAirAccumulateUse', method: 'post', data })
}
export function adminAirControlLogPageAirGateWay (data) {
  return request({ url: '/api/ebc-content/airControlLog/pageAirGateWay', method: 'post', data })
}
export function adminAirGatewayCreateAirGateway (data) {
  return request({ url: '/api/ebc-content/airGateway/createAirGateway', method: 'post', data })
}
export function adminAirGatewayDelete (params) {
  return request({ url: '/api/ebc-content/airGateway/delete', method: 'post', params })
}
export function adminAirGatewayListAirGateWay (params) {
  return request({ url: '/api/ebc-content/airGateway/listAirGateWay', method: 'post', params })
}
export function adminAirPageAirGateWay (data) {
  return request({
    url: '/api/ebc-content/airGateway/pageAirGateWay',
    method: 'post',
    headers: { userDeviceType: 'PC', 'Content-Type': 'application/json' },
    data
  })
}
export function adminAirGatewayUpdateAirGateway (data) {
  return request({ url: '/api/ebc-content/airGateway/updateAirGateway', method: 'post', data })
}
export function adminAirGatewayBatchBindPriceAirGateway (data) {
  return request({ url: '/api/ebc-content/airGateway/batchBindPriceAirGateway', method: 'post', data })
}
export function adminAirGatewayAirGateWayList (data) {
  return request({ url: '/api/ebc-content/airGateway/listAirGateWay', method: 'post', params: data })
}
export function adminAirScheduledTaskPageAirScheduledTask (data) {
  return request({ url: '/api/ebc-content/airScheduledTask/pageAirScheduledTask', method: 'post', data })
}
export function adminAirScheduledTaskAddAirScheduledTasks (data) {
  return request({ url: '/api/ebc-content/airScheduledTask/addAirScheduledTasks', method: 'post', data })
}
export function adminAirScheduledTaskDelete (params) {
  return request({ url: '/api/ebc-content/airScheduledTask/delete', method: 'post', params })
}
export function adminAirScheduledTaskGetAirScheduledTaskById (params) {
  return request({ url: '/api/ebc-content/airScheduledTask/getAirScheduledTaskById', method: 'post', params })
}
export function adminAirScheduledTaskListAirInfoByIds (params) {
  return request({ url: '/api/ebc-content/airScheduledTask/listAirInfoByIds', method: 'post', params })
}
export function adminAirScheduledTaskUpdateEnabled (params) {
  return request({ url: '/api/ebc-content/airScheduledTask/updateEnabled', method: 'post', params })
}
export function adminAirScheduledTaskEditAirScheduledTasks (data) {
  return request({ url: '/api/ebc-content/airScheduledTask/editAirScheduledTasks', method: 'post', data })
}
export function adminAirListAirMeterInfo (params) {
  return request({ url: '/api/ebc-content/meter/listAirMeterInfo', method: 'post', params })
}

// compatibility aliases for copied air pages
export const airInfoPageAir = adminAirInfoPageAir
export const airInfoControlAir = adminAirInfoControlAir
export const airInfoBatchBindAirInfo = adminAirInfoBatchBindAirInfo
export const airInfoBathcLockAir = adminAirInfoBathcLockAir
export const airInfoBatchBindAir = adminAirInfoBatchBindAir
export const airInfoBindTenantAir = adminAirInfoBindTenantAir
export const airInfoCreateAir = adminAirInfoCreateAir
export const airInfoDelete = adminAirInfoDelete
export const airInfoGetTenantAirBindEdit = adminAirInfoGetTenantAirBindEdit
export const airInfoLockAir = adminAirInfoLockAir
export const airInfoUpdateAir = adminAirInfoUpdateAir
export const airInfoUpdateBillingMode = adminAirInfoUpdateBillingMode
export const airInfoGetAirById = adminAirInfoGetAirById
export const airInfoQueryAirUseStatis = adminAirInfoQueryAirUseStatis
export const airInfoListAirInfo = adminAirInfoListAirInfo
export const airInfoPageAirAccumulateUse = adminAirInfoPageAirAccumulateUse
export const airControlLogPageAirGateWay = adminAirControlLogPageAirGateWay
export const airGatewayCreateAirGateway = adminAirGatewayCreateAirGateway
export const airGatewayDelete = adminAirGatewayDelete
export const airGatewayListAirGateWay = adminAirGatewayListAirGateWay
export const pageAirGateWay = adminAirPageAirGateWay
export const airGatewayUpdateAirGateway = adminAirGatewayUpdateAirGateway
export const airGatewayBatchBindPriceAirGateway = adminAirGatewayBatchBindPriceAirGateway
export const airGatewayAirGateWayList = adminAirGatewayAirGateWayList
export const airGatewayPageAirGateWay = adminAirPageAirGateWay
export const airScheduledTaskPageAirScheduledTask = adminAirScheduledTaskPageAirScheduledTask
export const airScheduledTaskAddAirScheduledTasks = adminAirScheduledTaskAddAirScheduledTasks
export const airScheduledTaskDelete = adminAirScheduledTaskDelete
export const airScheduledTaskGetAirScheduledTaskById = adminAirScheduledTaskGetAirScheduledTaskById
export const airScheduledTaskListAirInfoByIds = adminAirScheduledTaskListAirInfoByIds
export const airScheduledTaskUpdateEnabled = adminAirScheduledTaskUpdateEnabled
export const airScheduledTaskEditAirScheduledTasks = adminAirScheduledTaskEditAirScheduledTasks
export const listAirMeterInfo = adminAirListAirMeterInfo
