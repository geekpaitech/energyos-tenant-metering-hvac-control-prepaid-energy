
const tokens = {
  admin: { token: 'admin-token' },
  editor: { token: 'editor-token' }
}

const users = {
  'admin-token': {
    roles: ['admin'],
    introduction: '我是超级管理员',
    avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
    name: '超级管理员',
    permissions: ['*:*:*']
  },
  'editor-token': {
    roles: ['editor'],
    introduction: '我是编辑员',
    avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
    name: '编辑员',
    permissions: ['system:user:list']
  }
}

// 提取纯净数据的工具函数
function extractPureData (data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (e) {
      return data
    }
  }

  // 如果是响应式对象，转换为纯净对象
  if (data && typeof data === 'object') {
    return JSON.parse(JSON.stringify(data))
  }

  return data
}

export default [
  {
    url: '/api/user/login',
    type: 'post',
    response: config => {
      console.log('Mock收到原始登录请求:', config)

      // 提取纯净的请求数据
      const pureBody = extractPureData(config.body)
      console.log('提取的纯净数据:', pureBody)

      const { username, password } = pureBody
      console.log('用户名:', username, '密码:', password)

      const token = tokens[username]
      console.log('找到的token:', token)

      if (!token) {
        console.log('登录失败：用户名不存在')
        return {
          code: 60204,
          message: '账号或密码不正确.'
        }
      }

      console.log('登录成功')
      return {
        code: 200,
        data: token
      }
    }
  },

  {
    url: '/api/user/info',
    type: 'get',
    response: config => {
      console.log('获取用户信息请求:', config)

      let token = null
      if (config.query && config.query.token) {
        token = config.query.token
      } else if (config.url && config.url.includes('token=')) {
        token = config.url.split('token=')[1].split('&')[0]
      }

      console.log('解析到的token:', token)
      const info = users[token]
      console.log('找到的用户信息:', info)

      if (!info) {
        return {
          code: 50008,
          message: 'Login failed, unable to get user details.'
        }
      }

      return {
        code: 200,
        data: info
      }
    }
  },

  {
    url: '/api/user/logout',
    type: 'post',
    response: _ => {
      return {
        code: 200,
        data: 'success'
      }
    }
  }
]
