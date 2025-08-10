<template>
  <div v-if="!item.hidden" class="sidebar-item-wrapper">
    <!-- 如果是分隔线 -->
    <div 
      v-if="item.meta && item.meta.isDivider" 
      class="menu-divider"
      :class="{ 'with-label': item.meta.dividerLabel }"
      :data-label="item.meta.dividerLabel"
    ></div>
    
    <!-- 单一菜单项（无子菜单） -->
    <template v-else-if="hasOneShowingChild(item.children, item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.alwaysShow">
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path)" style="text-decoration:none">
        <div 
          class="menu-item single-item"
          :class="{ 
            'is-active': isActive(resolvePath(onlyOneChild.path)),
            'is-selected': isSelected(resolvePath(onlyOneChild.path))
          }"
          @click="handleSingleClick(resolvePath(onlyOneChild.path))"
        >
          <div class="menu-content">
            <i v-if="onlyOneChild.meta.icon || (item.meta && item.meta.icon)" 
   :class="['iconfont', onlyOneChild.meta.icon || (item.meta && item.meta.icon)]" 
   class="menu-icon" />
            <span class="menu-title" v-show="!isCollapsed">
              {{ onlyOneChild.meta.title }}
            </span>
          </div>
        </div>
      </app-link>
    </template>

    <!-- 带子菜单的菜单项 -->
    <div v-else 
         class="menu-item parent-item" 
         :class="{ 
           'is-active': isParentActive(item),
           'is-expanded': expandedItem === item.path,
           'is-selected': isParentSelected(item)
         }"
         @click="handleParentClick(item)">
      <div class="menu-content">
        <i v-if="item.meta && item.meta.icon" 
   :class="['iconfont', item.meta.icon]" 
   class="menu-icon" />
        <span class="menu-title" v-show="!isCollapsed">
          {{ item.meta.title }}
        </span>
        <!-- 调试信息 - 生产环境可删除 -->
        <div v-if="false" style="position: absolute; top: 0; right: 0; font-size: 10px; color: red;">
          {{ isParentSelected(item) ? 'S' : '' }}{{ expandedItem === item.path ? 'E' : '' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import path from 'path'
import { isExternal } from '@/utils/validate'
import Item from './Item'
import AppLink from './Link'

export default {
  name: 'SidebarItem',
  components: { Item, AppLink },
  props: {
    item: {
      type: Object,
      required: true
    },
    isNest: {
      type: Boolean,
      default: false
    },
    basePath: {
      type: String,
      default: ''
    }
  },
  data() {
    this.onlyOneChild = null
    return {}
  },
  computed: {
    // 计算侧边栏是否收缩
    isCollapsed() {
      return this.$store.getters.sidebar && this.$store.getters.sidebar.collapse
    },
    
    // 获取可见的子菜单项
    visibleChildren() {
      if (!this.item.children) return []
      return this.item.children.filter(child => !child.hidden)
    },

    // 是否有子菜单
    hasChildren() {
      return this.visibleChildren.length > 0
    },

    // 当前展开的菜单项 - 从父组件获取
    expandedItem() {
      let parent = this.$parent
      while (parent && parent.expandedItem === undefined) {
        parent = parent.$parent
      }
      const expanded = parent ? parent.expandedItem : null
      // console.log(`SidebarItem ${this.item.path} - expandedItem:`, expanded)
      return expanded
    },

    // 当前选中的菜单项 - 从父组件获取
    selectedItem() {
      let parent = this.$parent
      while (parent && parent.selectedItem === undefined) {
        parent = parent.$parent
      }
      const selected = parent ? parent.selectedItem : null
      // console.log(`SidebarItem ${this.item.path} - selectedItem:`, selected)
      return selected
    }
  },
  
  methods: {
    hasOneShowingChild(children = [], parent) {
      const showingChildren = children.filter(item => {
        if (item.hidden) {
          return false
        } else {
          this.onlyOneChild = item
          return true
        }
      })

      if (showingChildren.length === 1) {
        return true
      }

      if (showingChildren.length === 0) {
        this.onlyOneChild = { ...parent, path: '', noShowingChildren: true }
        return true
      }

      return false
    },

    resolvePath(routePath) {
      if (isExternal(routePath)) {
        return routePath
      }
      if (isExternal(this.basePath)) {
        return this.basePath
      }
      return path.resolve(this.basePath, routePath)
    },

    // 判断菜单项是否激活（基于路由）
    isActive(path) {
      return this.$route.path === path
    },

    // 判断菜单项是否被选中（基于用户点击）
    isSelected(path) {
      return this.selectedItem === path
    },

    // 判断父菜单是否激活（有子菜单激活）
    isParentActive(item) {
      if (!item.children) return false
      return item.children.some(child => {
        if (child.hidden) return false
        return this.$route.path === this.resolvePath(child.path)
      })
    },

    // 关键修复：判断父菜单是否被选中
    isParentSelected(item) {
      const currentSelected = this.selectedItem
      const currentExpanded = this.expandedItem
      const itemPath = item.path
      
      // 调试日志
      console.log(`isParentSelected 检查 ${itemPath}:`, {
        currentSelected,
        currentExpanded,
        itemPath,
        directMatch: currentSelected === itemPath
      })
      
      // 1. 如果当前选中的就是父菜单本身，直接返回true
      if (currentSelected === itemPath) {
        console.log(`父菜单 ${itemPath} 直接匹配选中`)
        return true
      }
      
      // 2. 检查是否有子菜单被选中，且子菜单面板未展开
      if (!item.children) return false
      
      const isChildSelected = item.children.some(child => {
        if (child.hidden) return false
        const childPath = this.resolvePath(child.path)
        return currentSelected === childPath
      })
      
      // 只有子菜单被选中且子菜单面板未展开时，父菜单才显示选中状态
      const result = isChildSelected && currentExpanded !== itemPath
      
      console.log(`父菜单 ${itemPath} 子菜单选中检查:`, {
        isChildSelected,
        isExpanded: currentExpanded === itemPath,
        result
      })
      
      return result
    },

    // 处理父菜单点击
    handleParentClick(item) {
      console.log("=== SidebarItem handleParentClick ===")
      console.log("父菜单被点击:", item.path)
      console.log("当前 isCollapsed:", this.isCollapsed)
      console.log("当前 hasChildren:", this.hasChildren)
      
      // 如果侧边栏收缩或没有子菜单，不处理展开逻辑
      if (this.isCollapsed || !this.hasChildren) {
        console.log("侧边栏收缩或无子菜单，不处理")
        return
      }
      
      // 向上查找到 Layout 组件并调用 toggleSubmenu
      let parent = this.$parent
      while (parent && !parent.toggleSubmenu) {
        parent = parent.$parent
      }
      
      if (parent && parent.toggleSubmenu) {
        console.log("找到 Layout 组件，调用 toggleSubmenu")
        parent.toggleSubmenu(item)
      } else {
        console.error("未找到 Layout 组件的 toggleSubmenu 方法")
      }
      console.log("=== SidebarItem handleParentClick 结束 ===")
    },

    // 处理单一菜单点击
    handleSingleClick(path) {
      console.log("单一菜单被点击:", path)
      this.setSelectedItem(path)
    },

    // 设置选中项
    setSelectedItem(path) {
      let parent = this.$parent
      while (parent && !parent.setSelectedItem) {
        parent = parent.$parent
      }
      if (parent && parent.setSelectedItem) {
        parent.setSelectedItem(path)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebar-item-wrapper {
  margin-bottom: 2px;
}

// 分隔线样式
.menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 12px;
  position: relative;
  
  // 可选：添加标签样式的分隔线
  &.with-label {
    height: auto;
    background: none;
    margin: 16px 12px 8px;
    
    &::before {
      content: attr(data-label);
      display: block;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      padding: 0 4px;
    }
    
    &::after {
      content: '';
      display: block;
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin-top: 4px;
    }
  }
}

// 在收缩状态下的分隔线
.app-wrapper.hideSidebar {
  .menu-divider {
    margin: 8px 6px;
    
    &.with-label::before {
      display: none;
    }
  }
}

.menu-item {
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--menu-text);
  position: relative;
  margin: 2px 4px;
  border-radius: 8px;
  width: calc(100% - 8px);
  overflow: hidden;
  
  // 移除button元素的默认样式
  &.parent-item {
    border: none;
    background: transparent;
    outline: none !important;
    font-family: inherit;
    
    &:focus {
      outline: none !important;
      box-shadow: none !important;
      border: none !important;
    }
    
    &:focus-visible {
      outline: none !important;
      box-shadow: none !important;
    }
    
    &::-moz-focus-inner {
      border: 0 !important;
      outline: none !important;
    }
    
    &:active {
      outline: none !important;
    }
  }

  .menu-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 16px 8px 12px;
    min-height: 70px;
    position: relative;
    text-align: center;
    transition: all 0.2s ease;

    .menu-icon {
      font-size: 22px;
      margin-bottom: 8px;
      color: inherit;
      transition: all 0.2s ease;
    }

    .menu-title {
      font-size: 12px;
      font-weight: 500;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .expand-icon {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 10px;
      transition: transform 0.3s ease;
      color: var(--menu-text);
      opacity: 0.7;
    }
  }

  // 悬停效果
  &:hover {
    background: var(--menu-hover-bg);
    color: var(--menu-text-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  // 激活状态（基于路由）
  &.is-active {
    background: var(--menu-active-bg);
    color: #ffffff;
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2);
    
    .menu-content {
      .menu-title {
        font-weight: 600;
      }
    }

    // 激活指示器
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(to bottom, #ffffff, rgba(255, 255, 255, 0.8));
      border-radius: 0 3px 3px 0;
    }
  }

  // 选中状态（基于用户点击）- 关键修复
  &.is-selected {
    background: var(--menu-active-bg) !important;
    color: #ffffff !important;
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2) !important;
    
    .menu-content {
      .menu-title {
        font-weight: 600;
      }
    }

    // 选中指示器 - 使用不同的样式区分
    &::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(to bottom, #ffffff, rgba(255, 255, 255, 0.8));
      border-radius: 3px 0 0 3px;
    }
  }

  // 当同时有激活和选中状态时，优先显示激活状态
  &.is-active.is-selected {
    &::after {
      display: none;
    }
  }

  // 展开状态
  &.is-expanded {
    background: var(--menu-hover-bg);
    color: var(--menu-text-hover);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .expand-icon {
      transform: rotate(90deg);
      opacity: 1;
    }
  }
}

// 收缩状态样式
.app-wrapper.hideSidebar {
  .menu-item {
    margin: 2px 2px;
    width: calc(100% - 4px);

    .menu-content {
      padding: 12px 4px 8px;
      min-height: 60px;

      .menu-icon {
        font-size: 20px;
        margin-bottom: 6px;
      }

      .menu-title {
        font-size: 10px;
      }

      .expand-icon {
        display: none;
      }
    }
  }
}

// 响应式优化
@media (max-width: 768px) {
  .menu-item {
    .menu-content {
      min-height: 65px;
      padding: 14px 6px 10px;

      .menu-icon {
        font-size: 18px;
      }

      .menu-title {
        font-size: 11px;
      }
    }
  }
}
</style>