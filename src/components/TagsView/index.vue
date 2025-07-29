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
          <!-- 修复：增强title显示逻辑 -->
          <span class="tag-title">{{ getTagTitle(tag) }}</span>
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
    // 修正：当前平台应该是computed属性，不是watch
    currentPlatform() {
      return this.$store.getters['permission/currentPlatform'];
    },
    // 添加当前管理方ID监听
    currentManagerId() {
      return this.$store.getters['manager/currentManagerId'];
    }
  },
  watch: {
    $route(route) {
      // 添加过滤检查
      if (this.shouldAddToTagsView(route)) {
        this.addTags()
        this.moveToCurrentTag()
      }
    },
    visible(value) {
      if (value) {
        document.body.addEventListener("click", this.closeMenu);
      } else {
        document.body.removeEventListener("click", this.closeMenu);
      }
    },
    // 修正：平台切换监听器
    currentPlatform: {
      handler(newPlatform, oldPlatform) {
        console.log('TagsView: 平台变化检测', { 
          oldPlatform, 
          newPlatform, 
          cache: this.currentPlatformCache,
          isInitialized: this.isInitialized,
          timestamp: new Date().toISOString()
        });
        
        // 只有在组件已初始化且发生真正的平台切换时才处理
        if (this.isInitialized && 
            this.currentPlatformCache && 
            this.currentPlatformCache !== newPlatform &&
            this.isPlatformSwitch(this.currentPlatformCache, newPlatform)) {
          
          console.log('TagsView: 检测到真正的平台切换，执行清空操作');
          this.handlePlatformSwitch(newPlatform);
        }
        
        // 更新缓存
        this.currentPlatformCache = newPlatform;
      },
      immediate: false
    },
    // 监听企业切换但不清空TagsView
    currentManagerId: {
      handler(newManagerId, oldManagerId) {
        console.log('TagsView: 管理方ID变化检测', { 
          oldManagerId, 
          newManagerId,
          isInitialized: this.isInitialized,
          timestamp: new Date().toISOString()
        });
        
        // 注意：根据需求，企业切换时不清空TagsView
        // 这里只做必要的内容刷新
        if (this.isInitialized && 
            oldManagerId && 
            newManagerId && 
            oldManagerId !== newManagerId &&
            this.isManagerSwitch(oldManagerId, newManagerId, this.currentPlatform)) {
          
          console.log('TagsView: 检测到企业切换，但保留TagsView内容');
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

    // 只监听平台切换事件
    this.$bus && this.$bus.$on('platform-switched', this.handlePlatformSwitchEvent);
    
    // 监听企业切换事件，但不清空TagsView
    this.$bus && this.$bus.$on('manager-switched', this.handleManagerSwitchEvent);
    
    // 设置初始化完成标志
    this.$nextTick(() => {
      this.isInitialized = true;
      console.log('TagsView: 初始化完成');
      
      // 添加调试信息
      setTimeout(() => {
        console.log('=== TagsView 调试信息 ===');
        console.log('visitedViews:', this.visitedViews);
        this.visitedViews.forEach((tag, index) => {
          console.log(`标签${index}:`, {
            path: tag.path,
            title: tag.title,
            metaTitle: tag.meta?.title,
            computedTitle: this.getTagTitle(tag)
          });
        });
        console.log('=== TagsView 调试信息结束 ===');
      }, 1000);
    });
  },
  beforeDestroy() {
    // 清理事件监听
    this.$bus && this.$bus.$off('platform-switched', this.handlePlatformSwitchEvent);
    this.$bus && this.$bus.$off('manager-switched', this.handleManagerSwitchEvent);
  },
  methods: {
    // 修复：增强的title获取方法
    getTagTitle(tag) {
      // 优先级：tag.title > tag.meta.title > tag.name > 路径名 > 兜底文本
      const title = tag.title || 
                   (tag.meta && tag.meta.title) || 
                   tag.name || 
                   (tag.path && tag.path.split('/').pop()) || 
                   '未命名页面'
      
      // 调试日志
      if (tag.path && tag.path.includes('dashboard')) {
        console.log('首页标签title计算:', {
          tagTitle: tag.title,
          metaTitle: tag.meta?.title,
          tagName: tag.name,
          finalTitle: title
        });
      }
      
      return title;
    },

    shouldAddToTagsView(route) {
      // 过滤redirect路径
      if (route.path.startsWith('/redirect/')) {
        return false;
      }
      
      // 过滤系统路径
      const systemPaths = ['/login', '/404', '/401', '/switching'];
      if (systemPaths.includes(route.path)) {
        return false;
      }
      
      // 检查meta标记
      if (route.meta) {
        if (route.meta.noTagsView || route.meta.hidden) {
          return false;
        }
      }
      
      return true;
    },

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
          // 修复：确保title正确传递
          const title = route.meta.title || route.name || '首页'
          tags.push({
            fullPath: tagPath,
            path: tagPath,
            name: route.name,
            title: title, // 添加title字段
            meta: { ...route.meta, title: title },
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
      
      // 确保首页标签始终在第一位
      this.ensureHomeTagFirst();
    },

    addTags() {
      const { name } = this.$route;
      if (name) {
        // 修复：确保路由信息完整传递，包括title
        const routeInfo = {
          ...this.$route,
          title: this.$route.meta?.title || this.$route.name
        }
        this.$store.dispatch("tagsView/addView", routeInfo);
        // 确保首页标签始终在第一位
        this.ensureHomeTagFirst();
      }
      return false;
    },

    // 处理平台切换事件 - 确保完全清空TagsView
    handlePlatformSwitchEvent(eventData) {
      console.log('=== TagsView: 接收到平台切换事件 ===');
      console.log('事件数据:', eventData);
      
      // 验证这确实是平台切换事件
      if (eventData.type !== 'platform-switch' || !eventData.clearTagsView) {
        console.warn('TagsView: 接收到的不是平台切换事件或不需要清空TagsView');
        return;
      }
      
      this.handlePlatformSwitch(eventData.to, eventData);
    },

    // 处理企业切换事件 - 保留TagsView，只清空缓存
    handleManagerSwitchEvent(eventData) {
      console.log('=== TagsView: 接收到企业切换事件 ===');
      console.log('事件数据:', eventData);
      
      // 验证这确实是企业切换事件
      if (eventData.type !== 'manager-switch' || eventData.clearTagsView !== false) {
        console.warn('TagsView: 接收到的不是企业切换事件或配置错误');
        return;
      }
      
      this.handleManagerSwitch(eventData);
    },

    // 处理平台切换的具体逻辑
    handlePlatformSwitch(newPlatform, eventData = {}) {
      console.log('=== TagsView: 开始处理平台切换 ===');
      console.log('目标平台:', newPlatform);
      console.log('事件数据:', eventData);
      
      // 检查TagsView store模块是否存在
      if (!this.$store.hasModule('tagsView')) {
        console.error('TagsView: store模块不存在');
        return;
      }
      
      // 记录切换前的状态
      const beforeState = {
        visitedViews: this.visitedViews.length,
        cachedViews: this.$store.state.tagsView.cachedViews.length,
        currentPlatformCache: this.currentPlatformCache
      };
      console.log('切换前状态:', beforeState);
      
      // 执行完全清空
      this.$store.dispatch('tagsView/clearAllForPlatformSwitch').then(() => {
        console.log('TagsView: 平台切换 - 完全清空完成');
        
        // 更新平台缓存
        this.currentPlatformCache = newPlatform;
        
        // 记录切换后的状态
        const afterState = {
          visitedViews: this.visitedViews.length,
          cachedViews: this.$store.state.tagsView.cachedViews.length,
          currentPlatformCache: this.currentPlatformCache
        };
        console.log('切换后状态:', afterState);
        
        // 验证清空结果
        if (afterState.visitedViews === 0 && afterState.cachedViews === 0) {
          console.log('✅ TagsView: 平台切换清空成功');
        } else {
          console.error('❌ TagsView: 平台切换清空失败', afterState);
        }
        
        // 延迟重新初始化，确保新平台路由已准备就绪
        this.$nextTick(() => {
          setTimeout(() => {
            this.reinitializeForNewPlatform(newPlatform);
          }, 300); // 增加延迟时间，确保路由完全准备好
        });
        
      }).catch(error => {
        console.error('TagsView: 平台切换清空失败', error);
      });
    },

    // 新增：为新平台重新初始化TagsView
    reinitializeForNewPlatform(platform) {
      console.log('=== TagsView: 为新平台重新初始化 ===');
      console.log('新平台:', platform);
      console.log('当前路由:', this.$route);
      
      try {
        // 确保首页标签存在并在第一位
        this.$store.dispatch('tagsView/ensureHomeTagFirst').then(() => {
          console.log('首页标签已确保在第一位');
          
          // 如果当前路由是有效路由且不是首页，添加当前路由标签
          if (this.$route.name && this.shouldAddToTagsView(this.$route)) {
            this.addTags();
          }
          
          console.log('新平台重新初始化完成');
          console.log('当前访问的视图:', this.visitedViews);
        }).catch(error => {
          console.error('确保首页标签失败:', error);
        });
        
      } catch (error) {
        console.error('TagsView: 新平台重新初始化失败', error);
      }
    },

    // 处理企业切换的具体逻辑 - 保留TagsView，只清空缓存
    handleManagerSwitch(eventData = {}) {
      console.log('=== TagsView: 开始处理企业切换 ===');
      console.log('事件数据:', eventData);
      
      // 检查TagsView store模块是否存在
      if (!this.$store.hasModule('tagsView')) {
        console.error('TagsView: store模块不存在');
        return;
      }
      
      // 记录切换前的状态
      const beforeState = {
        visitedViews: this.visitedViews.length,
        cachedViews: this.$store.state.tagsView.cachedViews.length
      };
      console.log('企业切换前状态:', beforeState);
      
      // 使用企业切换专用方法：只清空缓存，保留TagsView
      this.$store.dispatch('tagsView/clearCacheForManagerSwitch').then(() => {
        console.log('TagsView: 企业切换 - 缓存已清空，TagsView保留');
        
        // 记录切换后的状态
        const afterState = {
          visitedViews: this.visitedViews.length,
          cachedViews: this.$store.state.tagsView.cachedViews.length
        };
        console.log('企业切换后状态:', afterState);
        
        // 验证结果：visitedViews应该保持不变，cachedViews应该为0
        if (afterState.visitedViews === beforeState.visitedViews && afterState.cachedViews === 0) {
          console.log('✅ TagsView: 企业切换处理成功 - TagsView保留，缓存已清空');
        } else {
          console.warn('⚠️ TagsView: 企业切换处理异常', { beforeState, afterState });
        }
        
        // 确保首页标签始终在第一位
        this.ensureHomeTagFirst();
        
        // 刷新当前页面内容
        this.refreshCurrentPageContent();
        
      }).catch(error => {
        console.error('TagsView: 企业切换处理失败', error);
      });
    },

    // 新增：刷新当前页面内容（企业切换时调用）
    refreshCurrentPageContent() {
      console.log('TagsView: 刷新当前页面内容');
      
      // 方法1: 如果当前路由配置了需要在管理方切换时刷新，则刷新
      if (this.$route.meta && this.$route.meta.refreshOnManagerSwitch !== false) {
        // 通过查询参数触发页面更新，但保持在当前页面
        const newQuery = { 
          ...this.$route.query, 
          _t: Date.now(),  // 添加时间戳强制更新
          _m: this.currentManagerId    // 添加管理方ID
        };
        
        this.$router.replace({
          path: this.$route.path,
          query: newQuery
        }).catch(err => {
          console.log('路由更新完成或无需更新');
        });
      }
      
      // 确保首页标签始终在第一位
      this.ensureHomeTagFirst();
    },

    // 重新初始化（平台切换时使用）
    reinitialize() {
      console.log('TagsView: 重新初始化开始');
      console.log('TagsView: 当前路由', this.$route);
      console.log('TagsView: 当前平台', this.currentPlatform);
      console.log('TagsView: 当前管理方ID', this.currentManagerId);
      
      try {
        // 重新初始化固定标签
        this.initTags();
        
        // 添加当前路由标签
        if (this.$route.name && this.shouldAddToTagsView(this.$route)) {
          this.addTags();
        }
        
        // 确保首页标签存在且在第一位
        this.ensureHomeTagFirst();
        
        console.log('TagsView: 重新初始化完成');
        console.log('TagsView: 当前访问的视图', this.visitedViews);
      } catch (error) {
        console.error('TagsView: 重新初始化失败', error);
      }
    },

    // 确保首页标签始终在第一位
    ensureHomeTagFirst() {
      console.log('TagsView: 确保首页标签在第一位');
      
      // 使用store的新方法
      this.$store.dispatch('tagsView/ensureHomeTagFirst').then(() => {
        console.log('TagsView: 首页标签位置已确保');
      }).catch(error => {
        console.error('TagsView: 确保首页标签位置失败', error);
      });
    },

    // 新增辅助方法：判断是否为平台切换
    isPlatformSwitch(fromPlatform, toPlatform) {
      // 判断是否为不同平台之间的切换
      const platformMap = {
        'admin': '管理系统',
        'console': '控制台'
      };
      
      const isValid = fromPlatform !== toPlatform && 
             platformMap[fromPlatform] && 
             platformMap[toPlatform];
             
      console.log('isPlatformSwitch检查:', { fromPlatform, toPlatform, isValid });
      return isValid;
    },

    // 新增辅助方法：判断是否为企业切换
    isManagerSwitch(fromManagerId, toManagerId, currentPlatform) {
      // 只有在控制台平台内，且企业ID不同时，才是企业切换
      const isValid = currentPlatform === 'console' && 
             fromManagerId !== toManagerId && 
             fromManagerId && toManagerId;
             
      console.log('isManagerSwitch检查:', { fromManagerId, toManagerId, currentPlatform, isValid });
      return isValid;
    },

    // ... 其他方法保持不变
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
      // 防止关闭首页标签
      if (this.isAffix(view)) {
        this.$message.warning('首页标签不能关闭');
        return;
      }
      
      this.$store
        .dispatch("tagsView/delView", view)
        .then(({ visitedViews }) => {
          if (this.isActive(view)) {
            this.toLastView(visitedViews, view);
          }
          // 确保首页标签始终在第一位
          this.ensureHomeTagFirst();
        });
    },

    closeRightTags() {
      this.$store
        .dispatch("tagsView/delRightTags", this.selectedTag)
        .then((visitedViews) => {
          if (!visitedViews.find((i) => i.fullPath === this.$route.fullPath)) {
            this.toLastView(visitedViews);
          }
          // 确保首页标签始终在第一位
          this.ensureHomeTagFirst();
        });
    },

    closeLeftTags() {
      this.$store
        .dispatch("tagsView/delLeftTags", this.selectedTag)
        .then((visitedViews) => {
          if (!visitedViews.find((i) => i.fullPath === this.$route.fullPath)) {
            this.toLastView(visitedViews);
          }
          // 确保首页标签始终在第一位
          this.ensureHomeTagFirst();
        });
    },

    closeOthersTags() {
      this.$router.push(this.selectedTag);
      this.$store
        .dispatch("tagsView/delOthersViews", this.selectedTag)
        .then(() => {
          this.moveToCurrentTag();
          // 确保首页标签始终在第一位
          this.ensureHomeTagFirst();
        });
    },

    closeAllTags(view) {
      this.$store.dispatch("tagsView/delAllViews").then(({ visitedViews }) => {
        if (this.affixTags.some((tag) => tag.path === view.path)) {
          return;
        }
        this.toLastView(visitedViews, view);
        // 确保首页标签始终在第一位
        this.ensureHomeTagFirst();
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

    // 获取当前平台的首页信息
    getCurrentPlatformHome() {
      const currentPlatform = this.$store.getters['permission/currentPlatform'];
      
      console.log('TagsView: getCurrentPlatformHome - 当前平台', currentPlatform);
      console.log('TagsView: getCurrentPlatformHome - 当前路由', this.$route.path);
      
      switch (currentPlatform) {
        case "console":
          return {
            path: "/console/dashboard",
            meta: { title: "首页", affix: true },
          };
        case "admin":
          return {
            path: "/admin/dashboard",
            meta: { title: "管理后台大屏", affix: true },
          };
        default:
          // 兜底逻辑：根据当前路径判断
          const currentPath = this.$route.path;
          if (currentPath.startsWith("/console")) {
            return {
              path: "/console/dashboard",
              meta: { title: "首页", affix: true },
            };
          } else if (currentPath.startsWith("/admin")) {
            return {
              path: "/admin/dashboard",
              meta: { title: "管理后台大屏", affix: true },
            };
          }
          return null;
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

  /* 标签标题 - 修复：确保文字显示 */
  .tag-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    min-width: 0;
    /* 修复：确保文字可见 */
    display: block;
    line-height: inherit;
    color: inherit;
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
</style>