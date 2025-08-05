<template>
  <div class="tags-view-container">
    <div class="tags-view-wrapper">
      <!-- 左侧标签滚动区域 -->
      <div class="tags-view-scroll" ref="scrollContainer">
        <router-link
          v-for="tag in visibleTags"
          ref="tag"
          :key="tag.path"
          :class="{ active: isActive(tag) }"
          :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
          tag="span"
          class="tags-view-item"
          @click.middle.native="!isAffix(tag) ? closeSelectedTag(tag) : ''"
          @contextmenu.prevent.native="openMenu(tag, $event)"
        >
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
      
      <!-- 右侧功能区：当标签过多时显示 -->
      <div v-if="showOverflowMenu" class="tags-overflow-container">
        <!-- 隐藏标签数量 -->
        <div class="hidden-count-badge">
          +{{ hiddenTagsCount }}
        </div>
        
        <!-- 更多标签按钮 -->
        <div class="more-tags-trigger" @click="toggleMoreTags">
          <i class="el-icon-more-outline"></i>
          <span class="trigger-text">更多</span>
        </div>
        
        <!-- 快捷操作按钮组 -->
        <div class="quick-actions-group">
          <el-tooltip content="刷新当前页" placement="bottom">
            <div class="action-button refresh-btn" @click="refreshCurrentPage">
              <i class="el-icon-refresh"></i>
            </div>
          </el-tooltip>
          
          <el-tooltip content="关闭其他" placement="bottom">
            <div class="action-button close-others-btn" @click="closeOthersTags">
              <i class="el-icon-circle-close"></i>
            </div>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 更多标签弹窗 -->
    <div v-if="showMoreTags" class="more-tags-overlay" @click="closeMoreTags">
      <div class="more-tags-panel" @click.stop>
        <!-- 头部 -->
        <div class="panel-header">
          <div class="header-title">
            <i class="el-icon-collection-tag"></i>
            标签管理
          </div>
          <div class="header-actions">
            <span class="total-count">共 {{ visitedViews.length }} 个标签</span>
            <i class="el-icon-close close-panel" @click="closeMoreTags"></i>
          </div>
        </div>
        
        <!-- 搜索区域 -->
        <div class="search-section">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索标签名称..."
            prefix-icon="el-icon-search"
            size="small"
            clearable
            @input="handleSearch"
          />
        </div>
        
        <!-- 当前显示的标签 -->
        <div class="tags-section visible-section">
          <div class="section-header">
            <span class="section-title">当前显示</span>
            <span class="section-count">{{ visibleTags.length }}</span>
          </div>
          <div class="tags-grid">
            <div
              v-for="tag in visibleTags"
              :key="'visible-' + tag.path"
              :class="['tag-card', { 
                'is-active': isActive(tag), 
                'is-affix': isAffix(tag) 
              }]"
              @click="navigateToTag(tag)"
            >
              <div class="tag-content">
                <div class="tag-icon">
                  <i v-if="isAffix(tag)" class="el-icon-star-on"></i>
                  <i v-else-if="isActive(tag)" class="el-icon-check"></i>
                  <i v-else class="el-icon-document"></i>
                </div>
                <div class="tag-info">
                  <div class="tag-name" :title="getTagTitle(tag)">
                    {{ getTagTitle(tag) }}
                  </div>
                  <div class="tag-path">{{ tag.path }}</div>
                </div>
                <div v-if="!isAffix(tag)" class="tag-close" @click.stop="closeSelectedTag(tag)">
                  <i class="el-icon-close"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 隐藏的标签 -->
        <div v-if="filteredHiddenTags.length > 0" class="tags-section hidden-section">
          <div class="section-header">
            <span class="section-title">更多标签</span>
            <span class="section-count">{{ filteredHiddenTags.length }}</span>
          </div>
          <div class="tags-grid">
            <div
              v-for="tag in filteredHiddenTags"
              :key="'hidden-' + tag.path"
              :class="['tag-card', { 
                'is-active': isActive(tag), 
                'is-affix': isAffix(tag) 
              }]"
              @click="navigateToTag(tag)"
            >
              <div class="tag-content">
                <div class="tag-icon">
                  <i v-if="isAffix(tag)" class="el-icon-star-on"></i>
                  <i v-else-if="isActive(tag)" class="el-icon-check"></i>
                  <i v-else class="el-icon-document"></i>
                </div>
                <div class="tag-info">
                  <div class="tag-name" :title="getTagTitle(tag)">
                    {{ getTagTitle(tag) }}
                  </div>
                  <div class="tag-path">{{ tag.path }}</div>
                </div>
                <div v-if="!isAffix(tag)" class="tag-close" @click.stop="closeSelectedTag(tag)">
                  <i class="el-icon-close"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
   
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
      isInitialized: false,
      
      // 标签显示逻辑相关
      maxVisibleTags: 12,
      maxTotalTags: 15,
      searchKeyword: '',
      filteredHiddenTags: [],
      showMoreTags: false, // 控制更多标签弹窗显示
    };
  },
  computed: {
    visitedViews() {
      return this.$store.state.tagsView.visitedViews;
    },
    routes() {
      return this.$store.state.permission.routes;
    },
    currentPlatform() {
      return this.$store.getters['permission/currentPlatform'];
    },
    currentManagerId() {
      return this.$store.getters['manager/currentManagerId'];
    },
    
    // 是否显示右侧功能区
    showOverflowMenu() {
      return this.visitedViews.length > this.maxTotalTags;
    },
    
    // 计算可见的标签
    visibleTags() {
      if (!this.showOverflowMenu) {
        return this.visitedViews;
      }
      
      const currentIndex = this.visitedViews.findIndex(tag => this.isActive(tag));
      const affixTags = this.visitedViews.filter(tag => this.isAffix(tag));
      
      if (currentIndex === -1) {
        return this.visitedViews.slice(0, this.maxVisibleTags);
      }
      
      let visibleTags = [...affixTags];
      const currentTag = this.visitedViews[currentIndex];
      
      if (!this.isAffix(currentTag)) {
        visibleTags.push(currentTag);
      }
      
      const otherTags = this.visitedViews.filter(tag => 
        !this.isAffix(tag) && !this.isActive(tag)
      );
      
      const remainingSlots = this.maxVisibleTags - visibleTags.length;
      visibleTags.push(...otherTags.slice(0, remainingSlots));
      
      return visibleTags.sort((a, b) => {
        return this.visitedViews.indexOf(a) - this.visitedViews.indexOf(b);
      });
    },
    
    // 计算隐藏的标签
    hiddenTags() {
      if (!this.showOverflowMenu) {
        return [];
      }
      
      const visiblePaths = this.visibleTags.map(tag => tag.path);
      return this.visitedViews.filter(tag => !visiblePaths.includes(tag.path));
    },
    
    // 隐藏标签的数量
    hiddenTagsCount() {
      return this.hiddenTags.length;
    }
  },
  watch: {
    $route(route) {
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
    currentPlatform: {
      handler(newPlatform, oldPlatform) {
        console.log('TagsView: 平台变化检测', { 
          oldPlatform, 
          newPlatform, 
          cache: this.currentPlatformCache,
          isInitialized: this.isInitialized,
          timestamp: new Date().toISOString()
        });
        
        if (this.isInitialized && 
            this.currentPlatformCache && 
            this.currentPlatformCache !== newPlatform &&
            this.isPlatformSwitch(this.currentPlatformCache, newPlatform)) {
          
          console.log('TagsView: 检测到真正的平台切换，执行清空操作');
          this.handlePlatformSwitch(newPlatform);
        }
        
        this.currentPlatformCache = newPlatform;
      },
      immediate: false
    },
    currentManagerId: {
      handler(newManagerId, oldManagerId) {
        console.log('TagsView: 管理方ID变化检测', { 
          oldManagerId, 
          newManagerId,
          isInitialized: this.isInitialized,
          timestamp: new Date().toISOString()
        });
        
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
    },
    
    // 监听隐藏标签变化，更新过滤结果
    hiddenTags: {
      handler() {
        this.filterHiddenTags();
      },
      immediate: true
    }
  },
  mounted() {
    console.log('TagsView: 组件挂载');
    
    this.currentPlatformCache = this.$store.getters['permission/currentPlatform'];
    console.log('TagsView: 初始平台缓存', this.currentPlatformCache);
    
    this.initTags();
    this.addTags();

    this.$bus && this.$bus.$on('platform-switched', this.handlePlatformSwitchEvent);
    this.$bus && this.$bus.$on('manager-switched', this.handleManagerSwitchEvent);
    
    // ESC键关闭弹窗
    document.addEventListener('keydown', this.handleKeydown);
    
    this.$nextTick(() => {
      this.isInitialized = true;
      console.log('TagsView: 初始化完成');
      
      this.filterHiddenTags();
    });
  },
  beforeDestroy() {
    this.$bus && this.$bus.$off('platform-switched', this.handlePlatformSwitchEvent);
    this.$bus && this.$bus.$off('manager-switched', this.handleManagerSwitchEvent);
    document.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    getTagTitle(tag) {
      const title = tag.title || 
                   (tag.meta && tag.meta.title) || 
                   tag.name || 
                   (tag.path && tag.path.split('/').pop()) || 
                   '未命名页面'
      
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
    
    // 处理键盘事件
    handleKeydown(e) {
      if (e.key === 'Escape' && this.showMoreTags) {
        this.closeMoreTags();
      }
    },
    
    // 切换更多标签弹窗
    toggleMoreTags() {
      this.showMoreTags = !this.showMoreTags;
      if (this.showMoreTags) {
        this.searchKeyword = '';
        this.filterHiddenTags();
      }
    },
    
    // 关闭更多标签弹窗
    closeMoreTags() {
      this.showMoreTags = false;
      this.searchKeyword = '';
    },
    
    // 导航到指定标签
    navigateToTag(tag) {
      this.$router.push(tag);
      this.closeMoreTags();
    },
    
    // 过滤隐藏标签
    filterHiddenTags() {
      if (!this.searchKeyword.trim()) {
        this.filteredHiddenTags = [...this.hiddenTags];
      } else {
        const keyword = this.searchKeyword.toLowerCase();
        this.filteredHiddenTags = this.hiddenTags.filter(tag => {
          const title = this.getTagTitle(tag).toLowerCase();
          const path = tag.path.toLowerCase();
          return title.includes(keyword) || path.includes(keyword);
        });
      }
    },
    
    // 搜索处理
    handleSearch() {
      this.filterHiddenTags();
    },
    
    // 刷新当前页面
    refreshCurrentPage() {
      const currentTag = this.visitedViews.find(tag => this.isActive(tag));
      if (currentTag) {
        this.refreshSelectedTag(currentTag);
      }
    },

    shouldAddToTagsView(route) {
      if (route.path.startsWith('/redirect/')) {
        return false;
      }
      
      const systemPaths = ['/login', '/404', '/401', '/switching'];
      if (systemPaths.includes(route.path)) {
        return false;
      }
      
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
          const title = route.meta.title || route.name || '首页'
          tags.push({
            fullPath: tagPath,
            path: tagPath,
            name: route.name,
            title: title,
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
        if (tag.name) {
          this.$store.dispatch("tagsView/addVisitedView", tag);
        }
      }
      
      this.ensureHomeTagFirst();
    },

    addTags() {
      const { name } = this.$route;
      if (name) {
        const routeInfo = {
          ...this.$route,
          title: this.$route.meta?.title || this.$route.name
        }
        this.$store.dispatch("tagsView/addView", routeInfo);
        this.ensureHomeTagFirst();
      }
      return false;
    },

    // 处理平台切换事件
    handlePlatformSwitchEvent(eventData) {
      console.log('=== TagsView: 接收到平台切换事件 ===');
      console.log('事件数据:', eventData);
      
      if (eventData.type !== 'platform-switch' || !eventData.clearTagsView) {
        console.warn('TagsView: 接收到的不是平台切换事件或不需要清空TagsView');
        return;
      }
      
      this.handlePlatformSwitch(eventData.to, eventData);
    },

    // 处理企业切换事件
    handleManagerSwitchEvent(eventData) {
      console.log('=== TagsView: 接收到企业切换事件 ===');
      console.log('事件数据:', eventData);
      
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
      
      if (!this.$store.hasModule('tagsView')) {
        console.error('TagsView: store模块不存在');
        return;
      }
      
      const beforeState = {
        visitedViews: this.visitedViews.length,
        cachedViews: this.$store.state.tagsView.cachedViews.length,
        currentPlatformCache: this.currentPlatformCache
      };
      console.log('切换前状态:', beforeState);
      
      this.$store.dispatch('tagsView/clearAllForPlatformSwitch').then(() => {
        console.log('TagsView: 平台切换 - 完全清空完成');
        
        this.currentPlatformCache = newPlatform;
        
        const afterState = {
          visitedViews: this.visitedViews.length,
          cachedViews: this.$store.state.tagsView.cachedViews.length,
          currentPlatformCache: this.currentPlatformCache
        };
        console.log('切换后状态:', afterState);
        
        if (afterState.visitedViews === 0 && afterState.cachedViews === 0) {
          console.log('✅ TagsView: 平台切换清空成功');
        } else {
          console.error('❌ TagsView: 平台切换清空失败', afterState);
        }
        
        this.$nextTick(() => {
          setTimeout(() => {
            this.reinitializeForNewPlatform(newPlatform);
          }, 300);
        });
        
      }).catch(error => {
        console.error('TagsView: 平台切换清空失败', error);
      });
    },

    // 为新平台重新初始化TagsView
    reinitializeForNewPlatform(platform) {
      console.log('=== TagsView: 为新平台重新初始化 ===');
      console.log('新平台:', platform);
      console.log('当前路由:', this.$route);
      
      try {
        this.$store.dispatch('tagsView/ensureHomeTagFirst').then(() => {
          console.log('首页标签已确保在第一位');
          
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

    // 处理企业切换的具体逻辑
    handleManagerSwitch(eventData = {}) {
      console.log('=== TagsView: 开始处理企业切换 ===');
      console.log('事件数据:', eventData);
      
      if (!this.$store.hasModule('tagsView')) {
        console.error('TagsView: store模块不存在');
        return;
      }
      
      const beforeState = {
        visitedViews: this.visitedViews.length,
        cachedViews: this.$store.state.tagsView.cachedViews.length
      };
      console.log('企业切换前状态:', beforeState);
      
      this.$store.dispatch('tagsView/clearCacheForManagerSwitch').then(() => {
        console.log('TagsView: 企业切换 - 缓存已清空，TagsView保留');
        
        const afterState = {
          visitedViews: this.visitedViews.length,
          cachedViews: this.$store.state.tagsView.cachedViews.length
        };
        console.log('企业切换后状态:', afterState);
        
        if (afterState.visitedViews === beforeState.visitedViews && afterState.cachedViews === 0) {
          console.log('✅ TagsView: 企业切换处理成功 - TagsView保留，缓存已清空');
        } else {
          console.warn('⚠️ TagsView: 企业切换处理异常', { beforeState, afterState });
        }
        
        this.ensureHomeTagFirst();
        this.refreshCurrentPageContent();
        
      }).catch(error => {
        console.error('TagsView: 企业切换处理失败', error);
      });
    },

    // 刷新当前页面内容
    refreshCurrentPageContent() {
      console.log('TagsView: 刷新当前页面内容');
      
      if (this.$route.meta && this.$route.meta.refreshOnManagerSwitch !== false) {
        const newQuery = { 
          ...this.$route.query, 
          _t: Date.now(),
          _m: this.currentManagerId
        };
        
        this.$router.replace({
          path: this.$route.path,
          query: newQuery
        }).catch(err => {
          console.log('路由更新完成或无需更新');
        });
      }
      
      this.ensureHomeTagFirst();
    },

    // 重新初始化
    reinitialize() {
      console.log('TagsView: 重新初始化开始');
      console.log('TagsView: 当前路由', this.$route);
      console.log('TagsView: 当前平台', this.currentPlatform);
      console.log('TagsView: 当前管理方ID', this.currentManagerId);
      
      try {
        this.initTags();
        
        if (this.$route.name && this.shouldAddToTagsView(this.$route)) {
          this.addTags();
        }
        
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
      
      this.$store.dispatch('tagsView/ensureHomeTagFirst').then(() => {
        console.log('TagsView: 首页标签位置已确保');
      }).catch(error => {
        console.error('TagsView: 确保首页标签位置失败', error);
      });
    },

    // 判断是否为平台切换
    isPlatformSwitch(fromPlatform, toPlatform) {
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

    // 判断是否为企业切换
    isManagerSwitch(fromManagerId, toManagerId, currentPlatform) {
      const isValid = currentPlatform === 'console' && 
             fromManagerId !== toManagerId && 
             fromManagerId && toManagerId;
             
      console.log('isManagerSwitch检查:', { fromManagerId, toManagerId, currentPlatform, isValid });
      return isValid;
    },

    moveToCurrentTag() {
      const tags = this.$refs.tag;
      this.$nextTick(() => {
        for (const tag of tags) {
          if (tag.to.path === this.$route.path) {
            this.moveToTarget(tag);
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
        const currentIndex = tagList.findIndex((item) => item === currentTag);
        const prevTag = tagList[currentIndex - 1];
        const nextTag = tagList[currentIndex + 1];

        const afterNextTagOffsetLeft =
          nextTag.$el.offsetLeft + nextTag.$el.offsetWidth + 4;

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
          this.ensureHomeTagFirst();
        });
    },

    closeRightTags() {
      const currentTag = this.visitedViews.find(view => this.isActive(view)) || this.$route;
      this.$store
        .dispatch("tagsView/delRightTags", currentTag)
        .then((visitedViews) => {
          if (!visitedViews.find((i) => i.fullPath === this.$route.fullPath)) {
            this.toLastView(visitedViews);
          }
          this.ensureHomeTagFirst();
        });
    },

    closeLeftTags() {
      const currentTag = this.visitedViews.find(view => this.isActive(view)) || this.$route;
      this.$store
        .dispatch("tagsView/delLeftTags", currentTag)
        .then((visitedViews) => {
          if (!visitedViews.find((i) => i.fullPath === this.$route.fullPath)) {
            this.toLastView(visitedViews);
          }
          this.ensureHomeTagFirst();
        });
    },

    closeOthersTags() {
      const currentTag = this.visitedViews.find(view => this.isActive(view)) || this.$route;
      
      if (!this.isActive(currentTag)) {
        this.$router.push(currentTag);
      }
      
      this.$store
        .dispatch("tagsView/delOthersViews", currentTag)
        .then(() => {
          this.moveToCurrentTag();
          this.ensureHomeTagFirst();
        });
    },

    closeAllTags(view) {
      this.$store.dispatch("tagsView/delAllViews").then(({ visitedViews }) => {
        if (this.affixTags.some((tag) => tag.path === (view && view.path))) {
          return;
        }
        this.toLastView(visitedViews, view);
        this.ensureHomeTagFirst();
      });
    },

    toLastView(visitedViews, view) {
      const latestView = visitedViews.slice(-1)[0];
      if (latestView) {
        this.$router.push(latestView.fullPath);
      } else {
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
      const offsetLeft = this.$el.getBoundingClientRect().left;
      const offsetWidth = this.$el.offsetWidth;
      const maxLeft = offsetWidth - menuMinWidth;
      const left = e.clientX - offsetLeft + 15;

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
/* TagsView 容器样式 */
.tags-view-container {
  height: 40px;
  width: 100%;
  background: #ffffff;
  position: relative;

  .tags-view-wrapper {
    height: 100%;
    display: flex;
    align-items: center;
    position: relative;
    
    .tags-view-scroll {
      flex: 1;
      height: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
      display: flex;
      align-items: center;
      padding: 0 12px;
      min-width: 0;

      /* 隐藏滚动条但保持滚动功能 */
      &::-webkit-scrollbar {
        height: 0;
      }

      &:hover {
        &::-webkit-scrollbar {
          height: 3px;
        }
        &::-webkit-scrollbar-thumb {
          background: #dcdfe6;
          border-radius: 2px;
        }
        &::-webkit-scrollbar-track {
          background: #f5f5f5;
        }
      }
    }
    
    /* 右侧功能区 - 重新设计 */
    .tags-overflow-container {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      border-left: 1px solid #e4e7ed;
      height: 100%;
      background: #ffffff;
      flex-shrink: 0;
      min-width: 160px;
      
      .hidden-count-badge {
        background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
        color: #ffffff;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 12px;
        min-width: 28px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(255, 149, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      .more-tags-trigger {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #606266;
        font-size: 12px;
        font-weight: 500;
        
        &:hover {
          background: #f5f7fa;
          color: #409eff;
          transform: translateY(-1px);
        }
        
        i {
          font-size: 14px;
        }
      }
      
      .quick-actions-group {
        display: flex;
        align-items: center;
        gap: 4px;
        
        .action-button {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #606266;
          
          &:hover {
            background: #f5f7fa;
            color: #409eff;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          i {
            font-size: 13px;
          }
          
          &.refresh-btn:hover {
            color: #67c23a;
          }
          
          &.close-others-btn:hover {
            color: #f56c6c;
          }
        }
      }
    }
  }
}

/* 更多标签弹窗 - 全新设计 */
.more-tags-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
  
  .more-tags-panel {
    background: #ffffff;
    border-radius: 12px;
    width: 80%;
    max-width: 900px;
    max-height: 85vh;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    
    /* 头部 */
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #f0f0f0;
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      
      .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        
        i {
          font-size: 18px;
          color: #409eff;
        }
      }
      
      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .total-count {
          font-size: 12px;
          color: #909399;
          background: #f5f7fa;
          padding: 4px 12px;
          border-radius: 12px;
          border: 1px solid #e4e7ed;
        }
        
        .close-panel {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #909399;
          transition: all 0.2s ease;
          
          &:hover {
            background: #f56c6c;
            color: #ffffff;
          }
        }
      }
    }
    
    /* 搜索区域 */
    .search-section {
      padding: 16px 24px;
      border-bottom: 1px solid #f0f0f0;
      background: #fafbfc;
      
      ::v-deep .el-input {
        .el-input__inner {
          border-radius: 8px;
          border: 1px solid #e4e7ed;
          height: 36px;
          
          &:focus {
            border-color: #409eff;
            box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
          }
        }
      }
    }
    
    /* 内容区域 */
    .tags-section {
      flex: 1;
      overflow-y: auto;
      
      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-track {
        background: #f5f5f5;
      }
      &::-webkit-scrollbar-thumb {
        background: #c0c4cc;
        border-radius: 3px;
      }
      
      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 24px 12px;
        background: #f8f9fa;
        border-bottom: 1px solid #f0f0f0;
        position: sticky;
        top: 0;
        z-index: 10;
        
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
        }
        
        .section-count {
          font-size: 12px;
          color: #909399;
          background: #ffffff;
          padding: 2px 8px;
          border-radius: 10px;
          border: 1px solid #e4e7ed;
        }
      }
      
      .tags-grid {
        padding: 16px 24px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 12px;
        
        .tag-card {
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          transition: all 0.2s ease;
          cursor: pointer;
          background: #ffffff;
          
          &:hover {
            border-color: #409eff;
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
            transform: translateY(-2px);
          }
          
          &.is-active {
            border-color: #409eff;
            background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
          }
          
          &.is-affix {
            border-color: #e6a23c;
            background: linear-gradient(135deg, #fdf6ec 0%, #fef7e6 100%);
          }
          
          .tag-content {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            gap: 12px;
            
            .tag-icon {
              width: 32px;
              height: 32px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f5f7fa;
              flex-shrink: 0;
              
              i {
                font-size: 16px;
                color: #909399;
              }
            }
            
            .tag-info {
              flex: 1;
              min-width: 0;
              
              .tag-name {
                font-size: 14px;
                font-weight: 500;
                color: #303133;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-bottom: 4px;
              }
              
              .tag-path {
                font-size: 12px;
                color: #909399;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
            
            .tag-close {
              width: 24px;
              height: 24px;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #c0c4cc;
              transition: all 0.2s ease;
              opacity: 0;
              
              &:hover {
                background: #f56c6c;
                color: #ffffff;
              }
              
              i {
                font-size: 12px;
              }
            }
          }
          
          &:hover .tag-close {
            opacity: 1;
          }
          
          &.is-active {
            .tag-icon {
              background: rgba(64, 158, 255, 0.1);
              
              i {
                color: #409eff;
              }
            }
            
            .tag-name {
              color: #409eff;
            }
          }
          
          &.is-affix {
            .tag-icon {
              background: rgba(230, 162, 60, 0.1);
              
              i {
                color: #e6a23c;
              }
            }
          }
        }
      }
    }

  }
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.tags-view-item {
  display: inline-flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  height: 28px;
  line-height: 28px;
  border: 1px solid #dcdfe6;
  color: #606266;
  background: #ffffff;
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
    background: #f5f7fa;
    border-color: #c0c4cc;
    color: #303133;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .tag-close-icon {
      opacity: 1;
      background: rgba(0, 0, 0, 0.05);
    }
  }

  .tag-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    min-width: 0;
    display: block;
    line-height: inherit;
    color: inherit;
  }

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
    color: #909399;
    flex-shrink: 0;
    cursor: pointer;
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

  &:hover .tag-close-icon {
    transform: scale(1);
    opacity: 1;
  }
}

/* 固定标签特殊样式 */
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

/* 右键菜单样式 */
.contextmenu {
  margin: 0;
  background: #ffffff;
  z-index: 3000;
  position: absolute;
  list-style-type: none;
  padding: 8px 0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid #e4e7ed;
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
      background: #f5f7fa;
      color: #409eff;
    }

    &:active {
      background: #ecf5ff;
    }

    i {
      margin-right: 10px;
      font-size: 14px;
      width: 16px;
      text-align: center;
      opacity: 0.8;
    }

    &:not(:last-child)::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 16px;
      right: 16px;
      height: 1px;
      background: #f0f0f0;
    }
  }
}
</style>