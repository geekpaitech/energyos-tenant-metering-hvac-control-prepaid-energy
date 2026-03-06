import request from '@/utils/request'

// 用户登录 - 真实接口
export function login(data) {
  return request({
    url: '/api/ebc-auth/auth/login',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    data: {
      channel: 1,
      code: "",
      password: data.password,
      phone: data.username // 将username映射为phone字段
    }
  })
}

// 获取用户信息 - 真实接口
export function getUserInfo(token) {
  return request({
    url: '/api/ebc-auth/auth/userInfo',
    method: 'post',
    headers: {
      'Authorization': token,
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    }
  })
}

// 用户退出登录
export function logout() {
  return Promise.resolve({
    code: 200,
    data: 'success'
  })
}

// 修改密码
export function changePassword(params) {
  return request({
    url: '/api/ebc-auth/auth/changePassword',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}

// 发送验证码（用于调价验证）
export function authSendSmsCode(params) {
  return request({
    url: '/api/ebc-auth/auth/sendSmsCode',
    method: 'post',
    headers: {
      'userDeviceType': 'PC',
      'Content-Type': 'application/json'
    },
    params
  })
}