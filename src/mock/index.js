import Mock from 'mockjs'
import user from './user'
import role from './role'

// 设置延迟时间，模拟网络请求
Mock.setup({
  timeout: '200-600'
})

console.log('Mock 服务启动中...')

// 注册用户相关的mock接口
user.forEach(item => {
  Mock.mock(new RegExp(item.url), item.type || 'get', item.response)
})

// 注册角色相关的mock接口
role.forEach(item => {
  Mock.mock(new RegExp(item.url), item.type || 'get', item.response)
})

console.log('Mock 服务已启动')
