<template>
  <el-breadcrumb class="app-breadcrumb" separator-class="el-icon-arrow-right">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in levelList" :key="item.path">
        <!-- 最后一个面包屑不可点击 -->
        <span
          v-if="item.redirect === 'noRedirect' || index == levelList.length - 1"
          class="no-redirect"
        >
          {{ $localeText(item.meta.title) }}
        </span>
        <!-- 其他面包屑可点击跳转 -->
        <a v-else @click.prevent="handleLink(item)">
          {{ $localeText(item.meta.title) }}
        </a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script>
export default {
  name: 'Breadcrumb',
  data () {
    return {
      levelList: []
    }
  },
  watch: {
    $route: {
      handler (route) {
        // 路由变化时更新面包屑
        if (route.path.startsWith('/redirect/')) {
          return
        }
        this.getBreadcrumb()
      },
      immediate: true
    }
  },
  methods: {
    getBreadcrumb () {
      let matched = this.$route.matched.filter(
        (item) => item.meta && item.meta.title
      )

      // 检查第一个匹配项是否是首页，如果不是则添加当前平台的首页
      const first = matched[0]
      if (!this.isDashboard(first)) {
        // 获取当前平台的首页路径和标题
        const homeInfo = this.getCurrentPlatformHome()
        if (homeInfo && !matched.some((item) => item.path === homeInfo.path)) {
          matched = [homeInfo].concat(matched)
        }
      }

      // 确保没有重复路径
      const seen = new Set()
      this.levelList = matched.filter((item) => {
        if (!item.meta || !item.meta.title || item.meta.breadcrumb === false) {
          return false
        }
        // 去重
        if (seen.has(item.path)) {
          return false
        }
        seen.add(item.path)
        return true
      })
    },

    isDashboard (route) {
      if (!route || !route.name) {
        return false
      }
      const name = route.name.trim().toLowerCase()
      // 检查是否是任一平台的首页
      return name === 'consoledashboard' || name === 'admindashboard'
    },

    // 获取当前平台的首页信息
    getCurrentPlatformHome () {
      // 获取当前平台
      const currentPlatform = this.$store.getters['permission/currentPlatform']

      console.log('面包屑 - 当前平台:', currentPlatform)

      switch (currentPlatform) {
        case 'console':
          return {
            path: '/metering/dashboard',
            meta: { title: '控制台' }
          }
        case 'admin':
          return {
            path: '/admin/dashboard',
            meta: { title: '管理后台首页' }
          }
        default:
          // 如果没有明确的平台，根据用户权限和当前路径判断
          const currentPath = this.$route.path
          console.log('面包屑 - 当前路径:', currentPath)

          if (currentPath.startsWith('/console')) {
            return {
              path: '/metering/dashboard',
              meta: { title: '控制台' }
            }
          } else if (currentPath.startsWith('/admin')) {
            return {
              path: '/admin/dashboard',
              meta: { title: '管理后台首页' }
            }
          }

          // 最后尝试根据用户权限确定默认首页
          const userRole = this.$store.state.user?.role || (this.$store.state.user?.roles && this.$store.state.user.roles[0])
          if (userRole) {
            // 动态导入工具函数
            try {
              const { getAvailablePlatforms } = require('@/utils/routeConfig')
              const availablePlatforms = getAvailablePlatforms(userRole)

              if (availablePlatforms.includes('console')) {
                return {
                  path: '/metering/dashboard',
                  meta: { title: '控制台' }
                }
              } else if (availablePlatforms.includes('admin')) {
                return {
                  path: '/admin/dashboard',
                  meta: { title: '管理后台首页' }
                }
              }
            } catch (error) {
              console.warn('面包屑获取用户权限失败:', error)
            }
          }

          // 默认返回null，不添加首页面包屑
          return null
      }
    },

    handleLink (item) {
      console.log('面包屑点击跳转:', item)

      const { redirect, path } = item

      if (redirect) {
        console.log('使用redirect跳转:', redirect)
        this.$router.push(redirect)
        return
      }

      if (path) {
        console.log('使用path跳转:', path)
        this.$router.push(path)
        return
      }

      console.warn('面包屑跳转失败，没有有效的路径:', item)
    }
  }
}
</script>

<style lang="scss" scoped>
.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
  margin-left: 8px;

  .no-redirect {
    color: #97a8be;
    cursor: text;
  }

  a {
    color: #409eff;
    cursor: pointer;
    text-decoration: none;

    &:hover {
      color: #66b1ff;
    }
  }
}

// 面包屑动画
.breadcrumb-enter-active,
.breadcrumb-leave-active {
  transition: all 0.3s;
}

.breadcrumb-enter,
.breadcrumb-leave-active {
  opacity: 0;
  transform: translateX(20px);
}

.breadcrumb-leave-active {
  position: absolute;
}
</style>
