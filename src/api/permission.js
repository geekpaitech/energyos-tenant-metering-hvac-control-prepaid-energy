import request from '@/utils/request'

// 获取用户权限菜单
export function getMenuRoleList(role) {
  return request({
    url: '/api/ebc-evc/evcMenuRole/getMenuRoleListByRole',
    method: 'post',
    params: {
      role: role,
      menuStatus: 1
    }
  })
}