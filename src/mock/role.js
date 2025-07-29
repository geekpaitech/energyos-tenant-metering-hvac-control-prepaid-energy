import Mock from 'mockjs'

const List = []
const count = 5

const baseContent = '<p>我是角色描述内容，这里可以随便写点什么。</p>'
const image_uri = 'https://wpimg.wallstcn.com/e4558086-631c-425c-9430-56ffb46e70b3'

for (let i = 0; i < count; i++) {
  List.push(Mock.mock({
    id: '@increment',
    roleName: '@word(3, 5)',
    roleKey: '@word(3, 10)',
    'status|1': [0, 1],
    remark: baseContent,
    createTime: '@datetime',
    updateTime: '@datetime'
  }))
}

export default [
  {
    url: '/api/system/role/list',
    type: 'get',
    response: config => {
      const { page = 1, limit = 20, roleName } = config.query

      const mockList = List.filter(item => {
        if (roleName && item.roleName.indexOf(roleName) < 0) return false
        return true
      })

      const pageList = mockList.filter((item, index) => index < limit * page && index >= limit * (page - 1))

      return {
        code: 200,
        data: {
          total: mockList.length,
          items: pageList
        }
      }
    }
  },

  {
    url: '/api/system/role',
    type: 'post',
    response: _ => {
      return {
        code: 200,
        data: 'success'
      }
    }
  },

  {
    url: '/api/system/role',
    type: 'put',
    response: _ => {
      return {
        code: 200,
        data: 'success'
      }
    }
  },

  {
    url: '/api/system/role',
    type: 'delete',
    response: _ => {
      return {
        code: 200,
        data: 'success'
      }
    }
  }
]
