<template>
  <div class="sidebar-container">
    <!-- Logo区域 -->
    <div class="sidebar-logo-container">
      <transition name="sidebarLogoFade">
        <router-link
          v-if="collapse"
          key="collapse"
          class="sidebar-logo-link"
          to="/"
        >
          <img src="@/assets/images/logo.png" class="sidebar-logo" onerror="this.style.display='none';this.parentNode.querySelector('.logo-placeholder').style.display='block'">
          <div class="logo-placeholder" style="display:none; width: 32px; height: 32px; background: #409EFF; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">永</div>
          <h1 v-show="!collapse" class="sidebar-title">{{ title }}</h1>
        </router-link>
        <router-link
          v-else
          key="expand"
          class="sidebar-logo-link"
          to="/"
        >
          <img src="@/assets/images/logo.png" class="sidebar-logo" onerror="this.style.display='none';this.parentNode.querySelector('.logo-placeholder').style.display='block'">
          <div class="logo-placeholder" style="display:none; width: 32px; height: 32px; background: #409EFF; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">永</div>
          <h1 class="sidebar-title">{{ title }}</h1>
        </router-link>
      </transition>
    </div>

    <!-- 菜单区域 -->
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="variables.menuBg"
        :text-color="variables.menuText"
        :unique-opened="false"
        :active-text-color="variables.menuActiveText"
        :collapse-transition="false"
        mode="vertical"
      >
        <sidebar-item
          v-for="route in routes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import SidebarItem from './SidebarItem.vue'
import variables from '@/assets/styles/variables.scss'
import {
  canAccessMonitoringMenus,
  MONITORING_ROOT_PATH
} from '@/config/monitoringAccess'

export default {
  name: 'Sidebar',
  components: { SidebarItem },
  computed: {
    ...mapGetters([
      'sidebar',
      'permission_routes',
      'currentManagerId',
      'currentManager'
    ]),
    routes () {
      const src = Array.isArray(this.permission_routes) ? this.permission_routes : []
      const filtered = this.filterByManager(src)
      return filtered.filter(route => !route.hidden)
    },
    activeMenu () {
      const route = this.$route
      const { meta, path } = route
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    },
    variables () {
      return variables
    },
    isCollapse () {
      return !this.sidebar.opened
    },
    title () {
      return this.$store.state.settings.title
    },
    collapse () {
      return !this.sidebar.opened
    }
  },
  methods: {
    matchesManagerVisibility (route) {
      const mv = route && route.meta && route.meta.managerVisibility
      if (!mv) return true

      const id = this.currentManagerId
      const manager = this.currentManager || {}
      const name = String(manager.managerName || manager.name || '')

      const ids = Array.isArray(mv.ids) ? mv.ids.map(v => Number(v)) : []
      const names = Array.isArray(mv.names) ? mv.names.map(v => String(v)) : []

      const idMatch = ids.length > 0 && id !== null && id !== undefined && ids.includes(Number(id))
      const nameMatch = names.length > 0 && name && names.some(n => name.includes(n))

      // 配置了 ids/names 就必须命中其一；否则默认可见
      if (ids.length === 0 && names.length === 0) return true
      return idMatch || nameMatch
    },
    pruneDividers (routes) {
      const src = Array.isArray(routes) ? routes : []
      const kept = []
      let hasVisibleItemAfter = false

      for (let i = src.length - 1; i >= 0; i--) {
        const r = src[i]
        if (!r) continue
        const isDivider = !!r.meta && !!r.meta.isDivider
        const isVisibleItem = !isDivider && !r.hidden && !(r.meta && r.meta.hidden)

        if (isDivider) {
          if (hasVisibleItemAfter) {
            kept.push(r)
            hasVisibleItemAfter = false
          }
          continue
        }

        kept.push(r)
        if (isVisibleItem) hasVisibleItemAfter = true
      }

      return kept.reverse()
    },
    filterByManager (routes) {
      const src = Array.isArray(routes) ? routes : []
      const out = []

      src.forEach((r) => {
        if (!r) return

        if (
          r.path === MONITORING_ROOT_PATH &&
          !canAccessMonitoringMenus(this.currentManagerId)
        ) {
          return
        }

        const next = { ...r }
        if (Array.isArray(r.children)) {
          next.children = this.filterByManager(r.children)
          next.children = this.pruneDividers(next.children)
        }

        const isDivider = !!next.meta && !!next.meta.isDivider
        const hasChildren = Array.isArray(next.children) && next.children.length > 0

        // 分隔线是否保留交给 pruneDividers 处理
        if (isDivider) {
          out.push(next)
          return
        }

        const selfVisible = this.matchesManagerVisibility(next)
        if (hasChildren) {
          // 父节点：如果子节点都被隐藏且自身也不满足，则隐藏父节点
          const hasAnyVisibleChild = next.children.some(c => c && !c.hidden)
          if (!hasAnyVisibleChild && !selfVisible) {
            next.hidden = true
          }
          out.push(next)
          return
        }

        if (!selfVisible) {
          next.hidden = true
        }
        out.push(next)
      })

      return out
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebar-container {
  .scrollbar-wrapper {
    overflow-x: hidden !important;
  }

  .el-scrollbar__bar.is-vertical {
    right: 0px;
  }

  .el-scrollbar {
    height: 100%;
  }

  &.has-logo {
    .el-scrollbar {
      height: calc(100% - 50px);
    }
  }

  .el-menu {
    border: none;
    height: 100%;
    width: 100% !important;
  }

  // 菜单悬浮效果
  .el-menu--vertical {
    &>.el-menu-item {
      &.is-active {
        background-color: rgba(64, 158, 255, 0.2) !important;
      }

      &:hover {
        background-color: rgba(64, 158, 255, 0.1) !important;
      }
    }

    .el-submenu {
      &>.el-submenu__title {
        &:hover {
          background-color: rgba(64, 158, 255, 0.1) !important;
        }
      }
    }
  }
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 50px;
  line-height: 50px;
  background: #2b2f3a;
  text-align: center;
  overflow: hidden;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    & .sidebar-logo {
      width: 32px;
      height: 32px;
      margin-right: 12px;
    }

    & .sidebar-title {
      font-size: 14px;
      font-weight: 600;
      line-height: 50px;
      margin: 0;
      color: #fff;
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }
}

.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}
</style>
