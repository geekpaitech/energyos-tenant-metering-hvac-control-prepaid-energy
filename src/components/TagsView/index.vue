<template>
  <div class="tags-view-container">
    <div class="tags-view-wrapper">
      <div class="tags-view-scroll" ref="scrollContainer">
        <router-link
          v-for="tag in visitedViews"
          ref="tag"
          :key="tag.path"
          :class="{ active: isActive(tag) }"
          :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
          tag="span"
          class="tags-view-item"
          @click.middle.native="!isAffix(tag) ? closeSelectedTag(tag) : ''"
          @contextmenu.prevent.native="openMenu(tag, $event)"
        >
          <span class="tag-title">{{ tag.title }}</span>
          <span
            v-if="!isAffix(tag)"
            class="tag-close-icon"
            @click.prevent.stop="closeSelectedTag(tag)"
          >
            <i class="el-icon-close"></i>
          </span>
        </router-link>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ul
      v-show="visible"
      :style="{ left: left + 'px', top: top + 'px' }"
      class="contextmenu"
    >
      <li @click="refreshSelectedTag(selectedTag)">
        <i class="el-icon-refresh-right"></i>
        刷新页面
      </li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)">
        <i class="el-icon-close"></i>
        关闭标签
      </li>
      <li @click="closeOthersTags">
        <i class="el-icon-circle-close"></i>
        关闭其他
      </li>
      <li v-if="!isFirstView(selectedTag)" @click="closeLeftTags">
        <i class="el-icon-back"></i>
        关闭左侧
      </li>
      <li v-if="!isLastView(selectedTag)" @click="closeRightTags">
        <i class="el-icon-right"></i>
        关闭右侧
      </li>
      <li @click="closeAllTags(selectedTag)">
        <i class="el-icon-folder-delete"></i>
        关闭全部
      </li>
    </ul>
  </div>
</template>

<script>
import path from "path";

export default {
  name: "TagsView",
  data() {
    return {
      visible: false,
      top: 0,
      left: 0,
      selectedTag: {},
      affixTags: [],
      // 添加平台相关状态
      currentPlatformCache: null,
      isInitialized: false, // 添加初始化标志
    };
  },
  computed: {
    visitedViews() {
      return this.$store.state.tagsView.visitedViews;
    },
    routes() {
      return this.$store.state.permission.routes;
    },
    // 添加当前平台监听
    currentPlatform() {
      return this.$store.getters['permission/currentPlatform'];
    },
    // 添加当前管理方ID监听
    currentManagerId() {
      return this.$store.getters['manager/currentManagerId'];
    }
  },
  watch: {
    $route() {
      this.addTags();
      this.moveToCurrentTag();
    },
    visible(value) {
      if (value) {
        document.body.addEventListener("click", this.closeMenu);
      } else {
        document.body.removeEventListener("click", this.closeMenu);
      }
    },
    // 监听平台切换
    currentPlatform: {
      handler(newPlatform, oldPlatform) {
        console.log('TagsView: 平台变化检测', { 
          oldPlatform, 
          newPlatform, 
          cache: this.currentPlatformCache,
          isInitialized: this.isInitialized,
          timestamp: new Date().toISOString()
        });
        
        // 确保组件已初始化，且真的发生了平台切换
        if (this.isInitialized && this.currentPlatformCache && this.currentPlatformCache !== newPlatform) {
          console.log('TagsView: 检测到平台切换，执行清空操作');
          this.handlePlatformSwitch(newPlatform);
        }
        
        // 更新缓存
        this.currentPlatformCache = newPlatform;
      },
      immediate: false
    },
    // 监听管理方切换
    currentManagerId: {
      handler(newManagerId, oldManagerId) {
        console.log('TagsView: 管理方ID变化检测', { 
          oldManagerId, 
          newManagerId,
          isInitialized: this.isInitialized,
          timestamp: new Date().toISOString()
        });
        
        // 确保组件已初始化，且真的发生了管理方切换
        if (this.isInitialized && oldManagerId && newManagerId && oldManagerId !== newManagerId) {
          console.log('TagsView: 检测到管理方切换，执行清空操作');
          this.handleManagerSwitch();
        }
      },
      immediate: false
    }
  },
  mounted() {
    console.log('TagsView: 组件挂载');
    
    // 初始化平台缓存
    this.currentPlatformCache = this.$store.getters['permission/currentPlatform'];
    console.log('TagsView: 初始平台缓存', this.currentPlatformCache);
    
    this.initTags();
    this.addTags();

    // 监听自定义的平台切换事件
    this.$bus && this.$bus.$on('platform-switched', this.handlePlatformSwitchEvent);
    
    // 监听管理方切换事件
    this.$bus && this.$bus.$on('manager-switched', this.handleManagerSwitchEvent);
    
    // 设置初始化完成标志
    this.$nextTick(() => {
      this.isInitialized = true;
      console.log('TagsView: 初始化完成');
    });
  },
  beforeDestroy() {
    // 清理事件监听
    this.$bus && this.$bus.$off('platform-switched', this.handlePlatformSwitchEvent);
    this.$bus && this.$bus.$off('manager-switched', this.handleManagerSwitchEvent);
  },
  methods: {
    isActive(route) {
      return route.path === this.$route.path;
    },

    isAffix(tag) {
      return tag.meta && tag.meta.affix;
    },

    isFirstView(view) {
      try {
        return (
          this.visitedViews.indexOf(view) === 0 ||
          (this.visitedViews.length === 1 && this.isAffix(view))
        );
      } catch (err) {
        return false;
      }
    },

    isLastView(view) {
      try {
        return this.visitedViews.indexOf(view) === this.visitedViews.length - 1;
      } catch (err) {
        return false;
      }
    },

    filterAffixTags(routes, basePath = "/") {
      let tags = [];
      routes.forEach((route) => {
        if (route.meta && route.meta.affix) {
          const tagPath = path.resolve(basePath, route.path);
          tags.push({
            fullPath: tagPath,
            path: tagPath,
            name: route.name,
            meta: { ...route.meta },
          });
        }
        if (route.children) {
          const tempTags = this.filterAffixTags(route.children, route.path);
          if (tempTags.length >= 1) {
            tags = [...tags, ...tempTags];
          }
        }
      });
      return tags;
    },

    initTags() {
      const affixTags = (this.affixTags = this.filterAffixTags(this.routes));
      for (const tag of affixTags) {
        // Must have tag name
        if (tag.name) {
          this.$store.dispatch("tagsView/addVisitedView", tag);
        }
      }
    },

    addTags() {
      const { name } = this.$route;
      if (name) {
        this.$store.dispatch("tagsView/addView", this.$route);
        // 获取当前平台的首页信息并确保添加
        this.ensureHomeTag();
      }
      return false;
    },

    // 处理平台切换事件
    handlePlatformSwitchEvent(newPlatform) {
      console.log('TagsView: 接收到平台切换事件', newPlatform);
      this.handlePlatformSwitch(newPlatform);
    },

    // 处理管理方切换事件
    handleManagerSwitchEvent(newManagerId) {
      console.log('TagsView: 接收到管理方切换事件', newManagerId);
      this.handleManagerSwitch();
    },

    // 处理平台切换
    handlePlatformSwitch(newPlatform) {
      console.log('TagsView: 开始处理平台切换到', newPlatform);
      
      // 强制清空所有标签页
      this.forceCleanAll().then(() => {
        console.log('TagsView: 清空完成，重新初始化');
        
        // 延迟重新初始化，确保平台路由已更新
        this.$nextTick(() => {
          setTimeout(() => {
            this.reinitialize();
          }, 100);
        });
      }).catch(error => {
        console.error('TagsView: 处理平台切换失败', error);
      });
    },

    // 处理管理方切换
    handleManagerSwitch() {
      console.log('TagsView: 开始处理管理方切换');
      
      // 强制清空所有标签页
      this.forceCleanAll().then(() => {
        console.log('TagsView: 管理方切换清空完成，重新初始化');
        
        // 延迟重新初始化
        this.$nextTick(() => {
          setTimeout(() => {
            this.reinitialize();
          }, 100);
        });
      }).catch(error => {
        console.error('TagsView: 处理管理方切换失败', error);
      });
    },

    // 强制清空所有标签
    forceCleanAll() {
      return new Promise((resolve, reject) => {
        console.log('TagsView: 强制清空所有标签');
        
        try {
          // 使用强制清空的 action
          this.$store.dispatch('tagsView/clearAllForPlatformSwitch').then(() => {
            // 清空本地缓存
            this.affixTags = [];
            
            console.log('TagsView: 清空完成');
            console.log('TagsView: 当前visitedViews:', this.visitedViews);
            console.log('TagsView: 当前cachedViews:', this.$store.state.tagsView.cachedViews);
            
            resolve();
          }).catch(error => {
            console.error('TagsView: 清空失败', error);
            reject(error);
          });
        } catch (error) {
          console.error('TagsView: 清空过程出错', error);
          reject(error);
        }
      });
    },

    // 重新初始化
    reinitialize() {
      console.log('TagsView: 重新初始化开始');
      console.log('TagsView: 当前路由', this.$route);
      console.log('TagsView: 当前平台', this.currentPlatform);
      console.log('TagsView: 当前管理方ID', this.currentManagerId);
      
      try {
        // 重新初始化固定标签
        this.initTags();
        
        // 添加当前路由标签
        if (this.$route.name) {
          this.addTags();
        }
        
        // 确保首页标签存在
        this.ensureHomeTag();
        
        console.log('TagsView: 重新初始化完成');
        console.log('TagsView: 当前访问的视图', this.visitedViews);
      } catch (error) {
        console.error('TagsView: 重新初始化失败', error);
      }
    },

    // 确保首页标签存在
    ensureHomeTag() {
      const homeInfo = this.getCurrentPlatformHome();
      console.log('TagsView: ensureHomeTag - 首页信息', homeInfo);
      
      if (homeInfo) {
        const homeTag = {
          path: homeInfo.path,
          fullPath: homeInfo.path,
          name: this.getHomeRouteName(),
          title: homeInfo.meta.title,
          meta: { ...homeInfo.meta, affix: true },
        };

        console.log('TagsView: ensureHomeTag - 准备添加首页标签', homeTag);

        // 检查是否已存在首页标签
        const existingHome = this.visitedViews.find(
          (view) => view.path === homeInfo.path
        );
        
        if (!existingHome) {
          console.log('TagsView: ensureHomeTag - 添加首页标签');
          this.$store.dispatch("tagsView/addVisitedView", homeTag);
        } else {
          console.log('TagsView: ensureHomeTag - 首页标签已存在');
        }
      } else {
        console.warn('TagsView: ensureHomeTag - 无法获取首页信息');
      }
    },

    // 获取当前平台的首页信息
    getCurrentPlatformHome() {
      const currentPlatform = this.$store.getters['permission/currentPlatform'];
      
      console.log('TagsView: getCurrentPlatformHome - 当前平台', currentPlatform);
      console.log('TagsView: getCurrentPlatformHome - 当前路由', this.$route.path);
      
      switch (currentPlatform) {
        case "console":
          return {
            path: "/console/dashboard",
            meta: { title: "控制台首页", affix: true },
          };
        case "admin":
          return {
            path: "/admin/dashboard",
            meta: { title: "管理后台首页", affix: true },
          };
        default:
          // 兜底逻辑：根据当前路径判断
          const currentPath = this.$route.path;
          if (currentPath.startsWith("/console")) {
            return {
              path: "/console/dashboard",
              meta: { title: "控制台首页", affix: true },
            };
          } else if (currentPath.startsWith("/admin")) {
            return {
              path: "/admin/dashboard",
              meta: { title: "管理后台首页", affix: true },
            };
          }
          return null;
      }
    },

    // 获取首页路由名称
    getHomeRouteName() {
      const currentPlatform = this.$store.getters['permission/currentPlatform'];
      return currentPlatform === "admin"
        ? "AdminDashboard"
        : "ConsoleDashboard";
    },

    moveToCurrentTag() {
      const tags = this.$refs.tag;
      this.$nextTick(() => {
        for (const tag of tags) {
          if (tag.to.path === this.$route.path) {
            this.moveToTarget(tag);
            // when query is different then update
            if (tag.to.fullPath !== this.$route.fullPath) {
              this.$store.dispatch("tagsView/updateVisitedView", this.$route);
            }
            break;
          }
        }
      });
    },

    moveToTarget(currentTag) {
      const $container = this.$refs.scrollContainer;
      const $containerWidth = $container.offsetWidth;
      const $scrollWrapper = this.$refs.scrollContainer;
      const tagList = this.$refs.tag;

      let firstTag = null;
      let lastTag = null;

      // find first tag and last tag
      if (tagList.length > 0) {
        firstTag = tagList[0];
        lastTag = tagList[tagList.length - 1];
      }

      if (firstTag === currentTag) {
        $scrollWrapper.scrollLeft = 0;
      } else if (lastTag === currentTag) {
        $scrollWrapper.scrollLeft =
          $scrollWrapper.scrollWidth - $containerWidth;
      } else {
        // find preTag and nextTag
        const currentIndex = tagList.findIndex((item) => item === currentTag);
        const prevTag = tagList[currentIndex - 1];
        const nextTag = tagList[currentIndex + 1];

        // the tag's offsetLeft after of nextTag
        const afterNextTagOffsetLeft =
          nextTag.$el.offsetLeft + nextTag.$el.offsetWidth + 4;

        // the tag's offsetLeft before of prevTag
        const beforePrevTagOffsetLeft = prevTag.$el.offsetLeft - 4;

        if (
          afterNextTagOffsetLeft >
          $scrollWrapper.scrollLeft + $containerWidth
        ) {
          $scrollWrapper.scrollLeft = afterNextTagOffsetLeft - $containerWidth;
        } else if (beforePrevTagOffsetLeft < $scrollWrapper.scrollLeft) {
          $scrollWrapper.scrollLeft = beforePrevTagOffsetLeft;
        }
      }
    },

    refreshSelectedTag(view) {
      this.$store.dispatch("tagsView/delCachedView", view).then(() => {
        const { fullPath } = view;
        this.$nextTick(() => {
          this.$router.replace({
            path: "/redirect" + fullPath,
          });
        });
      });
    },

    closeSelectedTag(view) {
      this.$store
        .dispatch("tagsView/delView", view)
        .then(({ visitedViews }) => {
          if (this.isActive(view)) {
            this.toLastView(visitedViews, view);
          }
        });
    },

    closeRightTags() {
      this.$store
        .dispatch("tagsView/delRightTags", this.selectedTag)
        .then((visitedViews) => {
          if (!visitedViews.find((i) => i.fullPath === this.$route.fullPath)) {
            this.toLastView(visitedViews);
          }
        });
    },

    closeLeftTags() {
      this.$store
        .dispatch("tagsView/delLeftTags", this.selectedTag)
        .then((visitedViews) => {
          if (!visitedViews.find((i) => i.fullPath === this.$route.fullPath)) {
            this.toLastView(visitedViews);
          }
        });
    },

    closeOthersTags() {
      this.$router.push(this.selectedTag);
      this.$store
        .dispatch("tagsView/delOthersViews", this.selectedTag)
        .then(() => {
          this.moveToCurrentTag();
        });
    },

    closeAllTags(view) {
      this.$store.dispatch("tagsView/delAllViews").then(({ visitedViews }) => {
        if (this.affixTags.some((tag) => tag.path === view.path)) {
          return;
        }
        this.toLastView(visitedViews, view);
      });
    },

    toLastView(visitedViews, view) {
      const latestView = visitedViews.slice(-1)[0];
      if (latestView) {
        this.$router.push(latestView.fullPath);
      } else {
        // 如果没有访问过的视图，跳转到当前平台首页
        const homeInfo = this.getCurrentPlatformHome();
        if (homeInfo) {
          this.$router.push(homeInfo.path);
        } else {
          this.$router.push("/");
        }
      }
    },

    openMenu(tag, e) {
      const menuMinWidth = 105;
      const offsetLeft = this.$el.getBoundingClientRect().left; // container margin left
      const offsetWidth = this.$el.offsetWidth; // container width
      const maxLeft = offsetWidth - menuMinWidth; // left boundary
      const left = e.clientX - offsetLeft + 15; // 15: margin right

      if (left > maxLeft) {
        this.left = maxLeft;
      } else {
        this.left = left;
      }

      this.top = e.clientY;
      this.visible = true;
      this.selectedTag = tag;
    },

    closeMenu() {
      this.visible = false;
    },

    handleScroll(e) {
      const eventDelta = e.wheelDelta || -e.deltaY * 40;
      this.$refs.scrollContainer.scrollLeft =
        this.$refs.scrollContainer.scrollLeft + eventDelta / 4;
    },
  },
};
</script>

<style lang="scss" scoped>
/* TagsView 优化样式 */
.tags-view-container {
  height: 40px;
  width: 100%;
  background: var(--card-bg, #fff);
  border-bottom: 1px solid var(--border-color, #e4e7ed);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

  .tags-view-wrapper {
    height: 100%;
    .tags-view-scroll {
      height: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
      display: flex;
      align-items: center;
      padding: 0 12px;

      /* 隐藏滚动条但保持滚动功能 */
      &::-webkit-scrollbar {
        height: 0;
      }

      /* 支持鼠标滚轮横向滚动 */
      &:hover {
        &::-webkit-scrollbar {
          height: 3px;
        }
        &::-webkit-scrollbar-thumb {
          background: var(--border-color, #dcdfe6);
          border-radius: 2px;
        }
      }
    }
  }
}

.tags-view-item {
  display: inline-flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  height: 28px;
  line-height: 28px;
  border: 1px solid var(--border-color, #dcdfe6);
  color: var(--text-secondary, #606266);
  background: var(--card-bg, #fff);
  padding: 0 12px 0 10px;
  font-size: 12px;
  margin-right: 6px;
  border-radius: 6px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  max-width: 160px;
  min-width: 60px;

  /* 第一个标签的特殊样式 */
  &:first-of-type {
    margin-left: 0;
  }

  /* 最后一个标签的特殊样式 */
  &:last-of-type {
    margin-right: 12px;
  }

  /* 激活状态 */
  &.active {
    background: linear-gradient(135deg, #e6f4ff 0%, #f0f9ff 100%);
    color: #1890ff;
    border-color: #91caff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
    transform: translateY(-1px);

    /* 激活状态的小圆点 */
    &::before {
      content: "";
      background: #1890ff;
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 6px;
      flex-shrink: 0;
      box-shadow: 0 0 3px rgba(24, 144, 255, 0.3);
    }

    .tag-close-icon {
      color: rgba(24, 144, 255, 0.8);
      background: rgba(24, 144, 255, 0.1);

      &:hover {
        background: rgba(24, 144, 255, 0.2);
        color: #1890ff;
        transform: scale(1.1);
      }
    }
  }

  /* 悬停状态 */
  &:hover:not(.active) {
    background: var(--hover-bg, #f5f7fa);
    border-color: #c0c4cc;
    color: var(--text-primary, #303133);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .tag-close-icon {
      opacity: 1;
      background: rgba(0, 0, 0, 0.05);
    }
  }

  /* 标签标题 */
  .tag-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    min-width: 0;
  }

  /* 关闭按钮优化 */
  .tag-close-icon {
    width: 18px;
    height: 18px;
    margin-left: 6px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0.7;
    background: transparent;
    color: var(--text-muted, #909399);
    flex-shrink: 0;
    cursor: pointer;

    /* 默认状态下稍微隐藏 */
    transform: scale(0.8);

    &:hover {
      opacity: 1;
      background: rgba(245, 108, 108, 0.1);
      color: #f56c6c;
      transform: scale(1);
    }

    &:active {
      transform: scale(0.9);
    }

    i {
      font-size: 10px;
      line-height: 1;
      font-weight: bold;
    }
  }

  /* 鼠标悬停时显示关闭按钮 */
  &:hover .tag-close-icon {
    transform: scale(1);
    opacity: 1;
  }
}

/* 固定标签特殊样式（首页等） */
.tags-view-item.is-affix {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #bae7ff;
  color: #1890ff;

  &::before {
    content: "";
    background: #1890ff;
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
    flex-shrink: 0;
  }

  .tag-title {
    font-weight: 600;
  }
}

/* 右键菜单优化 */
.contextmenu {
  margin: 0;
  background: var(--card-bg, #fff);
  z-index: 3000;
  position: absolute;
  list-style-type: none;
  padding: 8px 0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #303133);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--border-color, #e4e7ed);
  min-width: 140px;

  li {
    margin: 0;
    padding: 10px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      background: var(--hover-bg, #f5f7fa);
      color: var(--primary-color, #409eff);
    }

    &:active {
      background: var(--active-bg, #ecf5ff);
    }

    i {
      margin-right: 10px;
      font-size: 14px;
      width: 16px;
      text-align: center;
      opacity: 0.8;
    }

    /* 分割线 */
    &:not(:last-child)::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 16px;
      right: 16px;
      height: 1px;
      background: var(--border-light, #f0f0f0);
    }
  }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .tags-view-container {
    height: 36px;

    .tags-view-scroll {
      padding: 0 8px;
    }
  }

  .tags-view-item {
    height: 24px;
    line-height: 24px;
    font-size: 11px;
    padding: 0 8px 0 6px;
    margin-right: 4px;
    max-width: 120px;

    .tag-title {
      font-size: 11px;
    }

    .tag-close-icon {
      width: 16px;
      height: 16px;
      margin-left: 4px;

      i {
        font-size: 9px;
      }
    }

    &::before {
      width: 4px;
      height: 4px;
      margin-right: 4px;
    }
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .tags-view-container {
    background: var(--dark-bg-2, #1f2937);
    border-bottom-color: var(--dark-border, #374151);
  }

  .tags-view-item {
    background: var(--dark-bg-3, #374151);
    border-color: var(--dark-border, #4b5563);
    color: var(--dark-text, #e5e7eb);

    &:hover:not(.active) {
      background: var(--dark-bg-hover, #4b5563);
      border-color: var(--dark-border-hover, #6b7280);
    }
  }

  .contextmenu {
    background: var(--dark-bg-2, #1f2937);
    border-color: var(--dark-border, #374151);
    color: var(--dark-text, #e5e7eb);

    li:hover {
      background: var(--dark-bg-hover, #374151);
    }
  }
}

/* 动画增强 */
@keyframes tagSlideIn {
  from {
    opacity: 0;
    transform: translateX(-10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.tags-view-item {
  animation: tagSlideIn 0.3s ease-out;
}

/* 滚动动画 */
.tags-view-scroll {
  scroll-behavior: smooth;
}

/* 额外的视觉增强 */
.tags-view-item {
  /* 添加微妙的渐变背景 */
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.1),
    rgba(0, 0, 0, 0.02)
  );

  /* 边框渐变效果 */
  background-clip: padding-box;

  &.active {
    /* 激活状态的动态效果 */
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      background: linear-gradient(45deg, #e6f4ff, #f0f9ff, #e6f4ff);
      border-radius: 6px;
      z-index: -1;
      opacity: 0.3;
      filter: blur(1px);
    }
  }
}
</style>