<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item,index) in levelList" :key="`${item.path}-${index}`">
        <span v-if="item.redirect==='noRedirect'||index==levelList.length-1" class="no-redirect">{{ item.meta.title }}</span>
        <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script>
import pathToRegexp from '@/utils/path-to-regexp'

export default {
  name: 'Breadcrumb',
  data () {
    return {
      levelList: []
    }
  },
  watch: {
    $route: {
      handler(route) {
        // if you go to the redirect page, do not update the breadcrumbs
        if (route.path.startsWith('/redirect/')) {
          return
        }
        this.getBreadcrumb()
      },
      immediate: true
    }
  },
  created () {
    this.getBreadcrumb()
  },
  methods: {
    getBreadcrumb () {
      // only show routes with meta.title
      let matched = this.$route.matched.filter(item => item.meta && item.meta.title)
      
      // 确保 matched 不为空
      if (!matched || matched.length === 0) {
        this.levelList = []
        return
      }

      const first = matched[0]

      // 检查是否需要添加首页
      if (!this.isDashboard(first)) {
        matched = [{ path: '/dashboard', meta: { title: '看板' }, name: 'Dashboard' }].concat(matched)
      }

      // 去重处理，避免重复的路径
      const uniqueMatched = []
      const pathSet = new Set()
      
      matched.forEach(item => {
        if (item.meta && item.meta.title && item.meta.breadcrumb !== false) {
          const key = `${item.path}-${item.meta.title}`
          if (!pathSet.has(key)) {
            pathSet.add(key)
            uniqueMatched.push(item)
          }
        }
      })

      this.levelList = uniqueMatched
    },
    isDashboard (route) {
      const name = route && route.name
      if (!name) {
        return false
      }
      return name.trim().toLowerCase() === 'dashboard'
    },
    pathCompile (path) {
      // To solve this problem https://github.com/PanJiaChen/vue-element-admin/issues/561
      const { params } = this.$route
      var toPath = pathToRegexp.compile(path)
      return toPath(params)
    },
    handleLink (item) {
      const { redirect, path } = item
      if (redirect) {
        this.$router.push(redirect)
        return
      }
      this.$router.push(this.pathCompile(path))
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
}
</style>