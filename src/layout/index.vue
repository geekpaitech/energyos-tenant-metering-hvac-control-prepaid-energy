<template>
  <div class="app-wrapper" :class="classObj">
    <!-- 左侧菜单栏 -->
    <div class="sidebar-container">
      <!-- Logo区域 - 只保留logo，移除标题 -->
      <div
        class="sidebar-logo-container"
        :class="{ collapse: !sidebar.opened }"
      >
        <router-link class="sidebar-logo-link" to="/dashboard">
          <div class="logo-placeholder">物</div>
        </router-link>
      </div>

      <!-- 菜单区域 -->
      <el-scrollbar wrap-class="scrollbar-wrapper">
        <div class="menu-container">
          <!-- 动态渲染菜单 -->
          <sidebar-item
            v-for="route in permission_routes"
            :key="route.path"
            :item="route"
            :base-path="route.path"
            ref="sidebarItems"
          />
        </div>
      </el-scrollbar>
    </div>

    <!-- 右侧子菜单面板 - 支持下拉展开 -->
    <transition name="submenu-slide">
      <div v-if="currentSubmenu && sidebar.opened" class="submenu-panel">
        <div class="submenu-header">
          <div class="submenu-title">
            <i v-if="currentSubmenu.meta && currentSubmenu.meta.icon"
   :class="['iconfont', currentSubmenu.meta.icon]"
   class="submenu-icon" />
            <span>{{
              currentSubmenu.meta ? currentSubmenu.meta.title : ""
            }}</span>
          </div>
          <!-- 收起按钮 -->
          <div
            class="submenu-collapse-btn"
            @click="handleCollapseSubmenu"
            title="收起子菜单"
          >
            <i class="el-icon-close"></i>
          </div>
        </div>

        <div class="submenu-content">
          <!-- 渲染子菜单项 -->
          <template v-for="(child, index) in visibleSubmenuChildren">
            <!-- 检查是否是第一个有 parentGroup 的项，如果是则渲染可折叠的分组标题 -->
            <template
              v-if="
                child.meta &&
                child.meta.parentGroup &&
                isFirstOfGroup(child, index)
              "
            >
              <!-- 可折叠的分组标题 -->
              <div
                :key="`group-${child.meta.parentGroup}`"
                class="submenu-group-header clickable"
                @click="toggleGroup(child.meta.parentGroup)"
              >
                <div class="group-header-content">
                  <i class="group-icon el-icon-s-data"></i>
                  <span class="group-title">{{ child.meta.parentGroup }}</span>
                  <i
                    class="group-toggle-icon el-icon-arrow-down"
                    :class="{
                      'is-collapsed': collapsedGroups[child.meta.parentGroup],
                    }"
                  ></i>
                </div>
              </div>
            </template>

            <!-- 根据分组折叠状态决定是否显示菜单项 -->
            <template v-if="!isGroupCollapsed(child)">
              <!-- 如果是分隔线 -->
              <div
                v-if="child.meta && child.meta.isDivider"
                :key="child.path"
                class="submenu-divider"
                :class="{ 'with-label': child.meta.dividerLabel }"
              >
                <span v-if="child.meta.dividerLabel" class="divider-label">
                  {{ child.meta.dividerLabel }}
                </span>
              </div>

              <!-- 有子菜单的项目（可展开） -->
              <div
                v-else-if="child.children && child.children.length > 0"
                :key="child.path"
                class="submenu-expandable"
              >
                <div
                  class="submenu-item expandable-header"
                  :class="{
                    'is-expanded': expandedSubmenuItems[child.path],
                    'has-active-child': hasActiveChild(child),
                  }"
                  @click="toggleSubmenuItem(child.path)"
                >
                <i v-if="child.meta && child.meta.icon"
   :class="['iconfont', child.meta.icon]"
   class="submenu-item-icon" />
                  <span class="submenu-item-title">{{
                    child.meta ? child.meta.title : ""
                  }}</span>
                  <i class="expand-icon el-icon-arrow-right"></i>
                </div>

                <!-- 展开的子项 -->
                <transition name="submenu-expand">
                  <div
                    v-if="expandedSubmenuItems[child.path]"
                    class="submenu-children"
                  >
                    <template v-for="subChild in getVisibleChildren(child)">
                      <!-- 子项分隔线 -->
                      <div
                        v-if="subChild.meta && subChild.meta.isDivider"
                        :key="subChild.path"
                        class="submenu-child-divider"
                        :class="{ 'with-label': subChild.meta.dividerLabel }"
                      >
                        <span
                          v-if="subChild.meta.dividerLabel"
                          class="divider-label"
                        >
                          {{ subChild.meta.dividerLabel }}
                        </span>
                      </div>

                      <!-- 子项链接 -->
                      <router-link
                        v-else
                        :key="resolvePath(child.path, subChild.path)"
                        :to="resolvePath(child.path, subChild.path)"
                        class="submenu-child-link"
                        @click.native="
                          handleSubmenuClick(
                            resolvePath(child.path, subChild.path)
                          )
                        "
                      >
                        <div
                          class="submenu-child-item"
                          :class="{
                            'is-active': isSubmenuItemActive(
                              child.path,
                              subChild.path
                            ),
                          }"
                        >
                        <i
  v-if="subChild.meta && subChild.meta.icon"
  :class="['iconfont', subChild.meta.icon]"
  class="submenu-child-icon"
/>
                          <span class="submenu-child-title">{{
                            subChild.meta ? subChild.meta.title : ""
                          }}</span>
                        </div>
                      </router-link>
                    </template>
                  </div>
                </transition>
              </div>

              <!-- 普通的子菜单项（无子级） -->
              <router-link
                v-else
                :key="resolvePath(child.path)"
                :to="resolvePath(child.path)"
                class="submenu-item-link"
                @click.native="handleSubmenuClick(child.path)"
              >
                <div
                  class="submenu-item"
                  :class="{ 'is-active': isSubmenuItemActive(child.path) }"
                >
                <i v-if="child.meta && child.meta.icon"
   :class="['iconfont', child.meta.icon]"
   class="submenu-item-icon" />
                  <span class="submenu-item-title">{{
                    child.meta ? child.meta.title : ""
                  }}</span>
                </div>
              </router-link>
            </template>
          </template>
        </div>
      </div>
    </transition>

    <!-- 右侧主内容区 -->
    <div class="main-container">
      <!-- 顶部导航栏 - 包含管理方切换和用户信息 -->
      <div class="navbar">
        <!-- 左侧管理方切换区域 - 只在控制台显示 -->
        <div class="navbar-left">
          <!-- 管理方切换器 - 只在控制台且有多个管理方时显示 -->
          <div class="manager-switcher" v-if="shouldShowManagerSwitcher">
            <div class="switcher-label">管理方</div>
            <el-dropdown
              @command="handleManagerSwitch"
              trigger="click"
              :disabled="platformSwitching"
            >
              <div class="current-manager">
                <div class="manager-avatar">
                  {{ currentManagerDisplayName.charAt(0) }}
                </div>
                <div class="manager-info">
                  <span class="manager-name">{{
                    currentManagerDisplayName
                  }}</span>
                  <span
                    v-if="currentManager && currentManager.isDefault === 1"
                    class="default-badge"
                    >默认</span
                  >
                </div>
                <i class="el-icon-arrow-down manager-arrow"></i>
              </div>
              <el-dropdown-menu slot="dropdown" class="manager-dropdown">
                <div class="dropdown-header">
                  <span class="header-title">选择管理方</span>
                </div>
                <el-dropdown-item
                  v-for="manager in managerList"
                  :key="manager.managerId"
                  :command="manager.managerId"
                  :disabled="manager.managerId === currentManagerId"
                  class="manager-option"
                >
                  <div class="option-avatar">
                    {{ manager.managerName.charAt(0) }}
                  </div>
                  <div class="option-info">
                    <div class="option-name">{{ manager.managerName }}</div>
                    <div class="option-address">{{ manager.address }}</div>
                  </div>
                  <div class="option-badges">
                    <span v-if="manager.isDefault === 1" class="default-badge"
                      >默认</span
                    >
                    <span
                      v-if="
                        manager.managerId === currentManagerId &&
                        manager.isDefault !== 1
                      "
                      class="current-badge"
                      >当前</span
                    >
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>

        <!-- 右侧用户区域 -->
        <div class="navbar-right">
          <!-- 角色显示 -->
          <div class="role-container">
            <el-tag
              v-for="role in roles"
              :key="role"
              size="small"
              type="info"
              style="margin-right: 8px"
            >
              {{ role }}
            </el-tag>
          </div>

          <!-- 平台切换器 - 只有多个平台权限时显示 -->
          <div class="platform-switcher" v-if="canSwitchPlatform">
            <div class="switcher-label">切换至</div>
            <el-dropdown @command="handlePlatformSwitch" trigger="click">
              <div class="current-platform">
                <i :class="currentPlatform.icon" class="platform-icon"></i>
                <span class="platform-name">{{ currentPlatform.name }}</span>
                <i class="el-icon-arrow-down platform-arrow"></i>
              </div>
              <el-dropdown-menu slot="dropdown" class="platform-dropdown">
                <el-dropdown-item
                  v-for="platform in availablePlatforms"
                  :key="platform.key"
                  :command="platform.key"
                  :disabled="platform.key === currentPlatform.key"
                  class="platform-option"
                >
                  <i :class="platform.icon" class="option-icon"></i>
                  <span class="option-name">{{ platform.name }}</span>
                  <span
                    v-if="platform.key === currentPlatform.key"
                    class="current-badge"
                    >当前</span
                  >
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>

          <!-- 单一平台显示 - 只有一个平台权限时显示 -->
          <div v-else-if="hasSinglePlatform" class="single-platform">
            <div class="platform-label">当前平台</div>
            <div class="platform-info">
              <i :class="currentPlatform.icon" class="platform-icon"></i>
              <span class="platform-name">{{ currentPlatform.name }}</span>
            </div>
          </div>

          <!-- 全屏切换按钮 -->
          <div
            class="fullscreen-container"
            @click="toggleFullscreen"
            :title="isFullscreen ? '退出全屏' : '进入全屏'"
          >
            <i
              :class="
                isFullscreen ? 'el-icon-copy-document' : 'el-icon-full-screen'
              "
            ></i>
          </div>

          <!-- 用户下拉菜单 -->
          <el-dropdown class="avatar-container" trigger="click">
            <div class="avatar-wrapper">
              <img
                :src="userAvatar"
                class="user-avatar"
                @error="handleAvatarError"
              />
              <span class="user-name">{{ userName }}</span>
              <i class="el-icon-caret-bottom" />
            </div>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item>个人中心</el-dropdown-item>
              <el-dropdown-item divided @click.native="logout">
                <span style="display: block">退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>

      <!-- 面包屑工具栏 - 折叠按钮和面包屑在同一行 -->
      <div class="breadcrumb-toolbar">
        <div class="toolbar-left">
          <!-- 折叠按钮 -->
          <div class="hamburger-container" @click="toggleSideBar">
            <i
              :class="sidebar.opened ? 'el-icon-s-fold' : 'el-icon-s-unfold'"
            ></i>
          </div>
          <!-- 面包屑 -->
          <div class="breadcrumb-container">
            <TagsView />
          </div>
        </div>
      </div>

      <!-- 内容区域容器 -->
      <div class="content-wrapper">
        <!-- 树形面板 - 修改了宽度和文本溢出处理 -->
        <transition name="tree-slide">
          <div v-if="finalShowTreePanel" class="tree-panel">
            <div class="tree-header">
              <div class="tree-title">
                <i class="el-icon-folder tree-icon"></i>
                <span>区域层级</span>
              </div>
              <div class="tree-actions">
                <!-- 刷新按钮 -->
                <div
                  class="tree-action-btn"
                  @click="refreshTreeData"
                  title="刷新"
                >
                  <i class="el-icon-refresh"></i>
                </div>
                <!-- 收起按钮 -->
                <div
                  class="tree-collapse-btn"
                  @click="toggleTreePanel"
                  title="收起树形面板"
                >
                  <i class="el-icon-d-arrow-left"></i>
                </div>
              </div>
            </div>

            <!-- 搜索框 -->
            <div class="tree-search">
              <el-input
                v-model="treeFilterText"
                placeholder="搜索节点..."
                size="small"
                prefix-icon="el-icon-search"
                clearable
              />
            </div>

            <!-- 树形结构 -->
            <div class="tree-content">
              <el-tree
                ref="tree"
                :data="treeData"
                :filter-node-method="filterNode"
                :props="treeProps"
                :default-expand-all="false"
                :expand-on-click-node="false"
                :check-on-click-node="false"
                show-checkbox
                node-key="id"
                class="custom-tree"
                @node-click="handleNodeClick"
                @check-change="handleCheckChange"
              >
                <div class="custom-tree-node" slot-scope="{ node, data }">
                  <div class="node-content">
                    <i
                      :class="getNodeIcon(data)"
                      class="node-icon"
                      :style="{ color: getNodeColor(data) }"
                    ></i>
                    <span class="node-label" :title="node.label">{{
                      node.label
                    }}</span>
                  </div>
                </div>
              </el-tree>
            </div>
          </div>
        </transition>

        <!-- 树形面板收起时的展开按钮 -->
        <div
          v-if="!finalShowTreePanel && shouldShowTreeByRoute"
          class="tree-toggle-btn"
          @click="toggleTreePanel"
          title="展开树形面板"
        >
          <i class="el-icon-d-arrow-right"></i>
        </div>

        <!-- 页面内容区域 -->
        <div class="app-main" :class="{ 'with-tree': finalShowTreePanel }">
          <router-view />
        </div>
      </div>
    </div>
    <SettingsPanel />
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import TagsView from "@/components/TagsView";
import SidebarItem from "./components/Sidebar/SidebarItem";
import SettingsPanel from "@/components/SettingsPanel";
import path from "path";

export default {
  name: "Layout",
  components: {
    TagsView,
    SidebarItem,
    SettingsPanel,
  },
  data() {
    return {
      originalSelectedItem: null, // 记录打开子菜单前的选中项
      currentRouteItem: null, // 记录当前路由对应的菜单项
      platformSwitching: false, // 平台切换状态
      isFullscreen: false, // 全屏状态
      currentSubmenu: null, // 当前展开的子菜单
      expandedItem: null, // 当前展开的菜单路径
      selectedItem: null, // 当前选中的菜单项
      basePath: "", // 当前菜单的基础路径
      previousSelectedItem: null, // 之前选中的菜单项
      expandedSubmenuItems: {}, // 记录展开的子菜单项
      collapsedGroups: {}, // 新增：记录分组的折叠状态
      // 当前管理平台
      currentPlatformKey: "console", // 默认控制台
      // 平台配置
      platformConfig: {
        console: {
          key: "console",
          name: "控制台",
          icon: "el-icon-monitor",
          description: "数据监控与分析",
        },
        admin: {
          key: "admin",
          name: "管理后台",
          icon: "el-icon-setting",
          description: "系统管理与配置",
        },
      },

      // ========== 树形面板相关数据 ==========
      showTreePanel: false, // 是否显示树形面板
      treeFilterText: "", // 树形搜索文本
      treeProps: {
        children: "tenantTierDtoList",
        label: "name",
      },

      // ========== 树形面板路由控制相关数据 ==========
      // 需要显示树形面板的路由列表
      treeVisibleRoutes: [
        "/device/electricity",
        "/device/watermeter",
        "/device/electricitySharing",
        "/device/watermeterSharing",
        "/device/conditioningSharing",
        "/application/energy/electricity-report",
        "/application/energy/electricity-sankey",
        "/application/energy/water-report",
        "/application/energy/water-sankey",
        "/application/fee/electricity-plan",
        "/application/fee/water-plan",
        "/application/fee/service-plan",
        "/application/fee/electricity-adjustment",
        "/application/tenant/list",
        "/application/bill/energy-bill",
        "/application/bill/floating-price",
        "/application/bill/manual-bill",
        "/application/finance/withdrawal",
        "/application/finance/fund-flow",
        "/application/finance/tenant-refund",
        "/device/conditioning",
        "/device/lighting",
        "/device/doorlock",
        "/application/invoice/tenant-invoice",
        "/application/invoice/invoice-quota",
        "/application/invoice/quota-flow",
        "/device/parking",
        "/device/charging"
        // 可以根据需要添加更多路由
      ],

      // 强制隐藏树形面板的标志（用于用户手动关闭）
      forceHideTreePanel: false,

      // 真实树形数据
      treeData: [],

      // 树形数据加载状态
      treeLoading: false,

      // 折叠的节点
      defaultExpandedKeys: [],

      // 动态导入的API
      tierSelectTenantTierListApi: null,
    };
  },

  computed: {
    ...mapGetters([
      "name",
      "avatar",
      "sidebar",
      "permission_routes",
      "roles",
      "managerList",
      "currentManagerId",
      "currentManager",
    ]),
    ...mapGetters("treeSelection", [
      "selectedIds",
      "selectedCount",
      "selectedNodes",
      "selectedTenantIds",
      "selectedTierIds",
    ]),
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
      };
    },

    activeMenu() {
      const route = this.$route;
      const { meta, path } = route;
      if (meta.activeMenu) {
        return meta.activeMenu;
      }
      return path;
    },

    userName() {
      return this.name || "管理员";
    },

    userAvatar() {
      return (
        this.avatar ||
        "https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif"
      );
    },

    // 获取可见的子菜单项
    visibleSubmenuChildren() {
      if (!this.currentSubmenu || !this.currentSubmenu.children) return [];
      return this.currentSubmenu.children.filter((child) => !child.hidden);
    },

    // 当前平台信息
    currentPlatform() {
      return (
        this.platformConfig[this.currentPlatformKey] ||
        this.platformConfig.console
      );
    },

    // 用户可用的平台列表（基于权限）
    availablePlatforms() {
      const userPermissions = this.getUserPlatformPermissions();
      const platforms = Object.values(this.platformConfig).filter((platform) =>
        userPermissions.includes(platform.key)
      );

      console.log("用户可用平台列表:", platforms);
      return platforms;
    },

    // 是否可以切换平台（有多个平台权限时才显示切换器）
    canSwitchPlatform() {
      return this.availablePlatforms.length > 1;
    },

    // 是否只有单一平台权限
    hasSinglePlatform() {
      return this.availablePlatforms.length === 1;
    },

    // 是否为控制台平台
    isConsolePlatform() {
      return this.currentPlatformKey === "console";
    },

    // 是否应该显示管理方切换器（只在控制台且有多个管理方时显示）
    shouldShowManagerSwitcher() {
      return this.isConsolePlatform && this.managerList.length > 1;
    },

    // 当前管理方显示名称
    currentManagerDisplayName() {
      return this.currentManager
        ? this.currentManager.managerName
        : "未选择管理方";
    },

    // ========== 新增：树形面板显示控制 ==========

    // 判断当前路由是否应该显示树形面板
    shouldShowTreeByRoute() {
      const currentPath = this.$route.path;
        // ========== 新增：排除所有详情页 ==========
    // 如果路径包含 /detail/ 或以 /detail 结尾，不显示树形面板
    if (currentPath.includes('/detail/') || currentPath.endsWith('/detail')) {
      return false;
    }

      // 精确匹配
      if (this.treeVisibleRoutes.includes(currentPath)) {
        return true;
      }

      // 前缀匹配（支持子路由）
      return this.treeVisibleRoutes.some((route) => {
        return currentPath.startsWith(route);
      });
    },

    // 最终的树形面板显示状态
    finalShowTreePanel() {
      // 如果路由不匹配，则不显示
      if (!this.shouldShowTreeByRoute) {
        return false;
      }

      // 如果用户强制隐藏，则不显示
      if (this.forceHideTreePanel) {
        return false;
      }

      // 否则使用原来的showTreePanel状态
      return this.showTreePanel;
    },

    processedTreeData() {
      return this.processTreeData(this.treeData);
    },
  },

  watch: {
    // 监听路由变化
    $route: {
      handler(newRoute, oldRoute) {
        // 如果新路由需要显示树形面板，且之前没有显示，则自动显示
        if (this.shouldShowTreeByRoute && !this.showTreePanel) {
          this.showTreePanel = true;
          this.forceHideTreePanel = false; // 重置强制隐藏状态
          console.log("自动显示树形面板");
        }

        // 如果新路由不需要显示树形面板，则自动隐藏
        if (!this.shouldShowTreeByRoute && this.showTreePanel) {
          this.showTreePanel = false;
          console.log("自动隐藏树形面板");
        }

        // 更新选中状态
        this.updateSelectionFromRoute(newRoute.path);
      },
      immediate: true,
    },

    // 监听管理方ID变化
    currentManagerId: {
      handler(newVal, oldVal) {
        if (newVal && newVal !== oldVal) {
          this.handleManagerChange();
        }
      },
    },

    // 监听路由变化，判断是否需要初始化树形数据
    shouldShowTreeByRoute: {
      handler(newVal) {
        if (newVal && !this.treeData.length) {
          this.initTreeData();
        }
      },
      immediate: true,
    },

    // 监听侧边栏状态变化
    "sidebar.opened"(val) {
      if (!val) {
        this.closeSubmenu();
      }
    },

    // 监听当前平台变化，决定是否需要加载管理方列表
    currentPlatformKey: {
      handler(newPlatform) {
        if (newPlatform === "console") {
          // 切换到控制台时加载管理方列表
          this.loadManagerList();
        }
      },
      immediate: true,
    },

    // 监听树形搜索文本变化
    treeFilterText(val) {
      this.$refs.tree && this.$refs.tree.filter(val);
    },

    // 监听树形面板显示状态变化
    finalShowTreePanel: {
      handler(newVal, oldVal) {
        console.log("树形面板显示状态变化:", oldVal, "->", newVal);

        // 保存状态到localStorage（只有在路由支持时才保存）
        if (this.shouldShowTreeByRoute) {
          this.saveTreePanelState();
        }
      },
    },
  },

  async mounted() {
    console.log("Layout组件已挂载");
    console.log("当前路由:", this.$route.path);
    console.log("权限路由:", this.permission_routes);
    console.log("用户角色:", this.roles);
    console.log("侧边栏状态:", this.sidebar);

    try {
      const { tierSelectTenantTierList } = await import("@/api/tier");
      this.tierSelectTenantTierListApi = tierSelectTenantTierList;
      console.log("动态导入 tier API 成功:", tierSelectTenantTierList);
    } catch (error) {
      console.warn("动态导入 tier API 失败:", error);
    }

    // 初始化选中状态
    this.updateSelectionFromRoute(this.$route.path);

    // 监听全屏状态变化
    this.addFullscreenListeners();

    // 初始化平台权限
    this.initializePlatform();

    // 如果是控制台平台，初始化管理方数据
    if (this.isConsolePlatform) {
      await this.loadManagerList();
    }

    if (this.$store.hasModule("tagsView")) {
      const routes = this.permission_routes || [];
      await this.$store.dispatch("tagsView/initAffixTags", routes);
    }

    if (this.shouldShowTreeByRoute) {
      await this.initTreeData();
    }

    // 恢复分组折叠状态
    this.restoreCollapsedState();

    // 恢复树形面板状态
    // this.restoreTreePanelState();
    if (this.shouldShowTreeByRoute && this.showTreePanel) {
      await this.initTreeData();
    }
  },

  beforeDestroy() {
    // 清理全屏监听器
    this.removeFullscreenListeners();

    // 保存树形面板状态
    this.saveTreePanelState();
  },

  methods: {
    ...mapActions("manager", ["getManagerList", "switchManager"]),
    ...mapActions("treeSelection", [
      "updateTreeSelection",
      "clearSelection",
      "saveSelection",
      "restoreSelection",
    ]),

    earlyRestoreTreePanelState() {
      const saved = localStorage.getItem("tree-panel-state");
      if (saved) {
        try {
          const state = JSON.parse(saved);
          const isRecent = Date.now() - state.timestamp < 24 * 60 * 60 * 1000;

          // 先判断路由是否支持显示树形面板
          const currentPath = this.$route.path;
          const shouldShow = this.treeVisibleRoutes.some(
            (route) =>
              currentPath.includes(route) || currentPath.startsWith(route)
          );

          if (isRecent && shouldShow) {
            // 直接设置状态，不等待
            this.showTreePanel =
              state.showTreePanel !== undefined ? state.showTreePanel : false;
            this.forceHideTreePanel = state.forceHideTreePanel || false;
          } else {
            // 默认不显示
            this.showTreePanel = false;
            this.forceHideTreePanel = false;
          }
        } catch (e) {
          // 出错时默认不显示
          this.showTreePanel = false;
          this.forceHideTreePanel = false;
        }
      } else {
        // 没有保存的状态时默认不显示
        this.showTreePanel = false;
        this.forceHideTreePanel = false;
      }
    },

    // ========== 树形面板相关方法 ==========
    async initTreeData() {
      try {
        await this.loadTreeData();
      } catch (error) {
        console.error("初始化树形数据失败:", error);
        this.$message.error("加载树形数据失败");
      }
    },

    // 加载树形数据
    async loadTreeData() {
      if (!this.tierSelectTenantTierListApi || !this.currentManagerId) {
        return;
      }

      try {
        this.treeLoading = true;

        const response = await this.tierSelectTenantTierListApi({
          managerId: this.currentManagerId,
        });

        if (response.code === 200) {
          this.treeData = response.data || [];

          // 默认展开第一层
          this.$nextTick(() => {
            if (this.treeData.length > 0) {
              this.defaultExpandedKeys = this.treeData.map((item) => item.id);
            }
          });
        } else {
          this.$message.error(response.msg || "获取层级数据失败");
        }
      } catch (error) {
        console.error("加载树形数据失败:", error);
        this.$message.error("加载树形数据失败");
      } finally {
        this.treeLoading = false;
      }
    },

    // 处理树形数据，添加层级信息
    processTreeData(data, level = 1) {
      return data.map((item) => {
        const processedItem = {
          ...item,
          level: level,
        };

        if (item.tenantTierDtoList && item.tenantTierDtoList.length > 0) {
          processedItem.tenantTierDtoList = this.processTreeData(
            item.tenantTierDtoList,
            level + 1
          );
        }

        return processedItem;
      });
    },

    // 切换树形面板显示/隐藏
    toggleTreePanel() {
      if (!this.shouldShowTreeByRoute) {
        this.$message.warning("当前页面不支持显示树形面板");
        return;
      }

      if (this.finalShowTreePanel) {
        // 如果当前显示，则手动隐藏
        this.forceHideTreePanel = true;
        console.log("用户手动隐藏树形面板");
      } else {
        // 如果当前隐藏，则显示
        this.forceHideTreePanel = false;
        this.showTreePanel = true;
        console.log("用户手动显示树形面板");
      }

      this.saveTreePanelState();
    },

    // 保存树形面板状态 - 修复：保持正确的显示状态
    saveTreePanelState() {
      const state = {
        showTreePanel: this.showTreePanel,
        forceHideTreePanel: this.forceHideTreePanel,
        lastRoute: this.$route.path,
        timestamp: Date.now(),
      };

      localStorage.setItem("tree-panel-state", JSON.stringify(state));
      console.log("树形面板状态已保存:", state);
    },

    // 恢复树形面板状态 - 修复：正确恢复状态
    // 修改原有的 restoreTreePanelState 方法
    restoreTreePanelState() {
      // 这个方法现在主要用于 mounted 时的二次校验
      // 实际恢复已经在 created 中完成
      const saved = localStorage.getItem("tree-panel-state");
      if (saved) {
        try {
          const state = JSON.parse(saved);
          console.log("树形面板状态已在created中恢复:", state);
        } catch (e) {
          console.error("恢复树形面板状态失败:", e);
        }
      }
    },

    // 树形搜索过滤方法
    filterNode(value, data) {
      if (!value) return true;
      return data.name && data.name.indexOf(value) !== -1;
    },

    // 新增：判断节点是否有子节点
    hasChildren(data) {
      return data.tenantTierDtoList && data.tenantTierDtoList.length > 0;
    },

    // 新增：获取节点展开图标
    getNodeExpandIcon(node) {
      return node.expanded ? "el-icon-arrow-down" : "el-icon-arrow-right";
    },

    // 新增：切换节点展开状态
    toggleNodeExpand(node) {
      node.expanded = !node.expanded;
    },

    // 获取节点图标
    getNodeIcon(data) {
      // 根据层级显示不同图标
      const iconMap = {
        1: "el-icon-office-building", // 第一层级
        2: "el-icon-menu", // 第二层级
        3: "el-icon-folder", // 第三层级
        4: "el-icon-document", // 第四层级及以下
      };

      // 如果有租户ID，说明是租户节点
      if (data.tenantId) {
        return "el-icon-user";
      }

      return iconMap[data.level] || "el-icon-document";
    },

    getNodeColor(data) {
      // 根据层级设置颜色
      const colorMap = {
        1: "#409eff", // 第一层级 - 蓝色
        2: "#67c23a", // 第二层级 - 绿色
        3: "#e6a23c", // 第三层级 - 橙色
        4: "#909399", // 第四层级及以下 - 灰色
      };

      // 如果是租户节点，使用特殊颜色
      if (data.tenantId) {
        return "#f56c6c";
      }

      return colorMap[data.level] || "#909399";
    },

    // 处理节点点击
    handleNodeClick(data, node) {
      console.log("节点点击:", data);

      // 如果是租户节点
      if (data.tenantId) {
        this.$message.info(`租户: ${data.name || data.tenantName}`);
        // 可以触发相关事件或执行其他操作
        this.$emit("tree-node-click", {
          type: "tenant",
          data: data,
        });
      } else {
        // 层级节点
        this.$message.info(`层级: ${data.name} (L${data.level})`);
        this.$emit("tree-node-click", {
          type: "tier",
          data: data,
        });
      }
    },

    // 处理复选框变化
    handleCheckChange(data, checked, indeterminate) {
      if (!this.$refs.tree) return;

      // 获取选中的ID集合
      const checkedKeys = this.$refs.tree.getCheckedKeys();

      // 存到 Vuex
      this.$store.commit("treeSelection/SET_SELECTED_IDS", checkedKeys);

      console.log("已选中ID:", checkedKeys);
    },

    // 刷新树形数据
    async refreshTreeData() {
      this.$message.info("正在刷新层级数据...");
      await this.loadTreeData();
      this.$message.success("层级数据已刷新");
    },

    // 展开/折叠所有节点
    toggleAllNodes(expand = true) {
      if (expand) {
        // 展开所有节点
        this.getAllNodeKeys(this.treeData).forEach((key) => {
          this.$refs.tree.store.nodesMap[key].expanded = true;
        });
      } else {
        // 折叠所有节点
        this.getAllNodeKeys(this.treeData).forEach((key) => {
          this.$refs.tree.store.nodesMap[key].expanded = false;
        });
      }
    },

    async handleManagerChange() {
      if (this.shouldShowTreeByRoute && this.currentManagerId) {
        await this.initTreeData();
      }
    },

    // 获取所有节点的key
    getAllNodeKeys(data, keys = []) {
      data.forEach((item) => {
        keys.push(item.id);
        if (item.tenantTierDtoList && item.tenantTierDtoList.length > 0) {
          this.getAllNodeKeys(item.tenantTierDtoList, keys);
        }
      });
      return keys;
    },

    // ========== 路由相关辅助方法 ==========

    // 检查指定路由是否需要显示树形面板
    isTreeVisibleRoute(routePath) {
      if (!routePath) return false;

      // 精确匹配
      if (this.treeVisibleRoutes.includes(routePath)) {
        return true;
      }

      // 前缀匹配
      return this.treeVisibleRoutes.some((route) => {
        return routePath.startsWith(route);
      });
    },

    // 添加需要显示树形面板的路由
    addTreeVisibleRoute(route) {
      if (!this.treeVisibleRoutes.includes(route)) {
        this.treeVisibleRoutes.push(route);
        console.log("添加树形面板路由:", route);
      }
    },

    // 移除不需要显示树形面板的路由
    removeTreeVisibleRoute(route) {
      const index = this.treeVisibleRoutes.indexOf(route);
      if (index > -1) {
        this.treeVisibleRoutes.splice(index, 1);
        console.log("移除树形面板路由:", route);
      }
    },

    // 批量设置树形面板路由
    setTreeVisibleRoutes(routes) {
      this.treeVisibleRoutes = [...routes];
      console.log("批量设置树形面板路由:", routes);

      // 重新检查当前路由
      if (!this.shouldShowTreeByRoute && this.showTreePanel) {
        this.showTreePanel = false;
      }
    },

    // 重置树形面板状态
    resetTreePanelState() {
      this.showTreePanel = true;
      this.forceHideTreePanel = false;
      localStorage.removeItem("tree-panel-state");
      console.log("树形面板状态已重置");
    },

    // ========== 调试辅助方法 ==========

    // 获取树形面板调试信息
    getTreePanelDebugInfo() {
      return {
        currentRoute: this.$route.path,
        shouldShowTreeByRoute: this.shouldShowTreeByRoute,
        showTreePanel: this.showTreePanel,
        forceHideTreePanel: this.forceHideTreePanel,
        finalShowTreePanel: this.finalShowTreePanel,
        treeVisibleRoutes: this.treeVisibleRoutes,
        savedState: JSON.parse(
          localStorage.getItem("tree-panel-state") || "{}"
        ),
      };
    },

    // ========== 原有方法保持不变 ==========

    // 判断是否是分组中的第一个项
    isFirstOfGroup(child, index) {
      if (!child.meta || !child.meta.parentGroup) {
        return false;
      }

      // 如果是第一个项，直接返回 true
      if (index === 0) {
        return true;
      }

      // 检查前一个项是否属于同一个分组
      const prevChild = this.visibleSubmenuChildren[index - 1];
      return (
        !prevChild.meta ||
        !prevChild.meta.parentGroup ||
        prevChild.meta.parentGroup !== child.meta.parentGroup
      );
    },

    // 切换分组的折叠状态
    toggleGroup(groupName) {
      this.$set(
        this.collapsedGroups,
        groupName,
        !this.collapsedGroups[groupName]
      );

      // 保存到 localStorage
      this.saveCollapsedState();
    },

    // 判断菜单项是否属于已折叠的分组
    isGroupCollapsed(menuItem) {
      if (!menuItem.meta || !menuItem.meta.parentGroup) {
        return false;
      }
      return this.collapsedGroups[menuItem.meta.parentGroup] || false;
    },

    // 保存折叠状态到 localStorage
    saveCollapsedState() {
      localStorage.setItem(
        "submenu-collapsed-groups",
        JSON.stringify(this.collapsedGroups)
      );
    },

    // 从 localStorage 恢复折叠状态
    restoreCollapsedState() {
      const saved = localStorage.getItem("submenu-collapsed-groups");
      if (saved) {
        try {
          this.collapsedGroups = JSON.parse(saved);
        } catch (e) {
          console.error("恢复折叠状态失败:", e);
        }
      }
    },

    toggleSideBar() {
      console.log("=== toggleSideBar 被调用 ===");
      console.log("调用前 - expandedItem:", this.expandedItem);

      // 只关闭子菜单，不改变侧边栏展开/收缩状态
      if (this.expandedItem) {
        this.handleCollapseSubmenu();
        console.log("子菜单已关闭");
      } else {
        console.log("没有展开的子菜单需要关闭");
      }

      console.log("=== toggleSideBar 结束 ===");
    },

    handleAvatarError(e) {
      e.target.src =
        "https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif";
    },

    // 在 Layout.vue 的 methods 中，替换 logout 方法为以下代码：

    async logout() {
      try {
        // 显示加载状态
        const loading = this.$loading({
          lock: true,
          text: "正在退出...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        // 步骤1: 重置管理方状态
        if (this.$store.hasModule("manager")) {
          await this.$store.dispatch("manager/resetManager");
          console.log("管理方状态已重置");
        }

        // 步骤2: 清空 TagsView
        if (this.$store.hasModule("tagsView")) {
          await this.$store.dispatch("tagsView/clearAllForPlatformSwitch");
          console.log("TagsView 已清空");
        }

        // 步骤3: 调用用户退出（这会自动重置路由）
        await this.$store.dispatch("user/logout");
        console.log("用户退出成功，路由已重置");

        // 步骤4: 清除本地存储的额外数据
        localStorage.removeItem("selectedPlatform");
        localStorage.removeItem("tree-panel-state");
        localStorage.removeItem("submenu-collapsed-groups");
        console.log("本地存储已清理");

        loading.close();

        // 步骤5: 显示成功消息
        this.$message({
          type: "success",
          message: "退出登录成功",
          duration: 1500,
        });

        // 步骤6: 强制跳转到登录页（避免路由问题）
        setTimeout(() => {
          console.log("强制跳转到登录页");
          window.location.href = "/login";
        }, 1000);
      } catch (error) {
        console.error("退出登录失败:", error);

        // 关闭加载状态
        const loadingInstance = this.$loading.service();
        if (loadingInstance) {
          loadingInstance.close();
        }

        // 显示错误消息
        this.$message.error(`退出登录失败：${error.message || "请稍后重试"}`);

        // 即使失败也尝试清理
        try {
          await this.$store.dispatch("user/resetToken");
          localStorage.clear(); // 强制清除所有本地存储
          window.location.href = "/login"; // 强制跳转到登录页
        } catch (resetError) {
          console.error("强制重置失败:", resetError);
          window.location.reload(); // 最后手段：刷新页面
        }
      }
    },

    // 处理子菜单关闭
    handleCollapseSubmenu() {
      console.log("=== 手动收起子菜单 ===");
      console.log("收起前状态 - expandedItem:", this.expandedItem);
      console.log(
        "收起前状态 - originalSelectedItem:",
        this.originalSelectedItem
      );

      // 恢复到基于当前路由的选中状态
      if (this.originalSelectedItem) {
        this.selectedItem = this.originalSelectedItem;
      } else if (this.currentRouteItem) {
        this.selectedItem = this.currentRouteItem;
      }

      // 清空子菜单相关状态
      this.expandedItem = null;
      this.currentSubmenu = null;
      this.basePath = "";
      this.originalSelectedItem = null;

      // 清空展开的子菜单项
      this.expandedSubmenuItems = {};

      // 清空分组折叠状态
      this.collapsedGroups = {};

      console.log("收起后状态 - selectedItem:", this.selectedItem);
      console.log("=== 收起子菜单完成 ===");
    },

    // 切换子菜单项的展开状态
    toggleSubmenuItem(path) {
      this.$set(
        this.expandedSubmenuItems,
        path,
        !this.expandedSubmenuItems[path]
      );
    },

    // 获取可见的子项（过滤隐藏项）
    getVisibleChildren(item) {
      if (!item.children) return [];
      return item.children.filter((child) => !child.hidden);
    },

    // 判断子菜单项是否激活（支持嵌套）
    isSubmenuItemActive(parentPath, childPath) {
      const fullPath = childPath
        ? this.resolvePath(parentPath, childPath)
        : this.resolvePath(parentPath);
      return this.$route.path === fullPath;
    },

    // 解析路径（支持多级）
    resolvePath(parentPath, childPath) {
      const { isExternal } = require("@/utils/validate");
      const path = require("path");

      if (!childPath) {
        // 处理单级路径
        if (isExternal(parentPath)) {
          return parentPath;
        }
        if (isExternal(this.basePath || "")) {
          return this.basePath || "";
        }
        return path.resolve(this.basePath || "/", parentPath);
      } else {
        // 处理嵌套路径
        const parentFullPath = this.resolvePath(parentPath);
        if (isExternal(childPath)) {
          return childPath;
        }
        return path.resolve(parentFullPath, childPath);
      }
    },

    // 检查是否有激活的子项
    hasActiveChild(item) {
      if (!item.children) return false;

      return item.children.some((child) => {
        if (child.hidden) return false;
        const childPath = this.resolvePath(item.path, child.path);
        return this.$route.path === childPath;
      });
    },

    // 加载管理方列表
    async loadManagerList() {
      try {
        console.log("开始加载管理方列表...");
        await this.getManagerList();
        console.log("管理方列表加载完成:", this.managerList);
      } catch (error) {
        console.error("加载管理方列表失败:", error);
        this.$message.error("获取管理方列表失败");
      }
    },

    // 企业切换（控制台内切换企业）
    async handleManagerSwitch(managerId) {
      if (managerId === this.currentManagerId) {
        return;
      }

      const targetManager = this.managerList.find(
        (m) => m.managerId === managerId
      );
      if (!targetManager) {
        return;
      }

      try {
        const loading = this.$loading({
          lock: true,
          text: `正在切换到${targetManager.managerName}...`,
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        const currentRoute = {
          path: this.$route.path,
          query: { ...this.$route.query },
          params: { ...this.$route.params },
          name: this.$route.name,
          fullPath: this.$route.fullPath,
        };

        console.log("=== 企业切换开始（控制台内切换，保留TagsView）===");
        console.log("当前企业ID:", this.currentManagerId);
        console.log("目标企业ID:", managerId);
        console.log("当前路由信息:", currentRoute);

        // 重要：企业切换时只清空页面缓存，保留TagsView标签页
        if (this.$store.hasModule("tagsView")) {
          console.log("企业切换 - 只清空页面缓存，保留TagsView标签");
          await this.$store.dispatch("tagsView/clearCacheForManagerSwitch");
        }

        // 调用store中的切换方法
        await this.switchManager(managerId);
        console.log("企业切换完成");

        // 触发企业切换事件，通知TagsView组件
        this.$bus &&
          this.$bus.$emit("manager-switched", {
            managerId: managerId,
            managerInfo: targetManager,
            previousManagerId: this.currentManagerId,
            currentRoute: currentRoute,
            type: "manager-switch",
            clearTagsView: false,
            timestamp: new Date().toISOString(),
          });

        loading.close();

        this.$message({
          type: "success",
          message: `已切换到${targetManager.managerName}`,
          duration: 2000,
        });

        // 企业切换使用温和的页面更新方式
        this.$nextTick(() => {
          console.log("企业切换完成，温和刷新当前页面内容");

          const newQuery = {
            ...currentRoute.query,
            _t: Date.now(),
            _m: managerId,
          };

          this.$router
            .replace({
              path: currentRoute.path,
              query: newQuery,
            })
            .then(() => {
              console.log("企业切换 - 路由查询参数已更新");
            })
            .catch((err) => {
              console.log("企业切换 - 路由更新完成或无需更新");
            });
        });

        console.log("=== 企业切换流程完成 ===");
      } catch (error) {
        console.error("企业切换失败:", error);
        this.$message.error(`企业切换失败：${error.message || "请稍后重试"}`);

        const loadingInstance = this.$loading.service();
        if (loadingInstance) {
          loadingInstance.close();
        }
      }
    },

    // 设置选中项
    setSelectedItem(path) {
      // 如果当前没有展开的子菜单，记录原始选中项
      if (!this.expandedItem) {
        this.originalSelectedItem = this.selectedItem;
      }

      this.previousSelectedItem = this.selectedItem;
      this.selectedItem = path;
      console.log("设置选中项:", path);
    },

    // 根据路由更新选中状态 - 增强版
    updateSelectionFromRoute(routePath) {
      console.log("=== updateSelectionFromRoute 开始 ===");
      console.log("目标路由:", routePath);
      console.log("当前展开的子菜单:", this.currentSubmenu);

      // 检查是否为首页路由（不显示子菜单的路由）
      const isHomePage = this.isHomePageRoute(routePath);
      console.log("是否为首页路由:", isHomePage);

      if (isHomePage) {
        // 如果是首页路由，直接关闭所有子菜单
        console.log("检测到首页路由，关闭所有子菜单");
        this.handleCollapseSubmenu();

        // 查找匹配的菜单项并设置选中状态
        const matchingResult = this.findMatchingMenu(
          this.permission_routes,
          routePath
        );
        if (matchingResult) {
          this.currentRouteItem = matchingResult.path;
          this.setSelectedItem(matchingResult.path);
        }

        console.log("=== updateSelectionFromRoute 结束（首页路由） ===");
        return;
      }

      // 查找匹配的菜单项
      const matchingResult = this.findMatchingMenu(
        this.permission_routes,
        routePath
      );
      console.log("匹配结果:", matchingResult);

      if (matchingResult) {
        // 记录当前路由对应的菜单项
        this.currentRouteItem = matchingResult.path;

        // 如果是子路由，需要展开对应的父菜单
        if (matchingResult.isChildRoute && matchingResult.parentItem) {
          console.log("检测到子路由，父菜单:", matchingResult.parentItem);

          // 如果当前没有展开任何子菜单，或者展开的不是正确的父菜单
          if (
            !this.expandedItem ||
            this.expandedItem !== matchingResult.parentItem.path
          ) {
            console.log("需要展开父菜单:", matchingResult.parentItem.path);

            // 记录原始选中项（如果还没有记录的话）
            if (!this.expandedItem) {
              this.originalSelectedItem = this.selectedItem;
            }

            // 展开正确的父菜单
            this.expandedItem = matchingResult.parentItem.path;
            this.currentSubmenu = matchingResult.parentItem;
            this.basePath = matchingResult.parentItem.path;

            // 设置父菜单为选中状态
            this.selectedItem = matchingResult.parentItem.path;

            console.log("父菜单已展开，设置状态:");
            console.log("expandedItem:", this.expandedItem);
            console.log("selectedItem:", this.selectedItem);
          }

          // 无论如何都要更新当前路由项
          this.currentRouteItem = matchingResult.path;

          // 处理深层嵌套的情况
          if (matchingResult.isDeepChild) {
            console.log("检测到深层嵌套路由");
            console.log("需要展开的中间层:", matchingResult.expandablePath);

            // 确保中间层也展开
            this.$nextTick(() => {
              if (
                matchingResult.immediateParent &&
                matchingResult.expandablePath
              ) {
                const expandPath = path.resolve(
                  matchingResult.parentItem.path,
                  matchingResult.expandablePath
                );
                this.$set(this.expandedSubmenuItems, expandPath, true);
                console.log("自动展开中间层:", expandPath);
              }
            });
          } else {
            // 自动展开包含当前路由的菜单项
            if (this.currentSubmenu && this.currentSubmenu.children) {
              this.$nextTick(() => {
                this.currentSubmenu.children.forEach((child) => {
                  if (child.children && !child.hidden) {
                    const hasActiveChild = child.children.some((subChild) => {
                      if (subChild.hidden) return false;
                      const fullPath = this.resolvePath(
                        child.path,
                        subChild.path
                      );
                      return routePath === fullPath;
                    });

                    if (hasActiveChild) {
                      const childPath = this.resolvePath(child.path);
                      this.$set(this.expandedSubmenuItems, childPath, true);
                      console.log("自动展开子菜单:", childPath);
                    }
                  }
                });
              });
            }
          }
        } else {
          // 如果不是子路由，检查是否需要关闭当前展开的子菜单
          if (this.expandedItem) {
            console.log("当前路由不是子路由，检查是否需要关闭子菜单");

            // 检查当前路由是否就是展开的父菜单本身
            if (matchingResult.path === this.expandedItem) {
              console.log("当前路由就是展开的父菜单，保持子菜单展开");
              this.selectedItem = matchingResult.path;
            } else {
              console.log("当前路由不属于展开的子菜单，关闭子菜单");
              this.handleCollapseSubmenu();
              this.setSelectedItem(matchingResult.path);
            }
          } else {
            // 没有展开的子菜单，正常设置选中项
            console.log("没有展开的子菜单，正常设置选中项");
            this.setSelectedItem(matchingResult.path);
          }
        }
      }

      console.log("=== updateSelectionFromRoute 结束 ===");
      console.log("最终状态 - selectedItem:", this.selectedItem);
      console.log("最终状态 - expandedItem:", this.expandedItem);
      console.log("最终状态 - currentRouteItem:", this.currentRouteItem);
      console.log(
        "最终状态 - expandedSubmenuItems:",
        this.expandedSubmenuItems
      );
    },

    // 判断是否为首页路由的方法
    isHomePageRoute(routePath) {
      // 定义不需要显示子菜单的首页路由
      const homePageRoutes = [
        "/dashboard",
        "/console/dashboard",
        "/admin/dashboard",
        "/",
        "/home",
      ];

      return homePageRoutes.includes(routePath);
    },

    // 提取查找匹配菜单的逻辑 - 增强版，支持多级嵌套
    findMatchingMenu(routes, targetPath, parentRoute = null) {
      for (const route of routes) {
        const currentPath = parentRoute
          ? path.resolve(parentRoute.path, route.path)
          : route.path;

        // 检查当前路由
        if (currentPath === targetPath) {
          return {
            path: currentPath,
            isParent: false,
            parentItem: parentRoute,
            matchedRoute: route,
            isChildRoute: !!parentRoute,
          };
        }

        // 递归检查子路由
        if (route.children) {
          for (const child of route.children) {
            if (!child.hidden) {
              // 递归检查更深层的嵌套
              if (child.children && child.children.length > 0) {
                const deepResult = this.findMatchingMenuDeep(
                  child.children,
                  targetPath,
                  route,
                  child
                );
                if (deepResult) {
                  return deepResult;
                }
              }

              // 检查直接子路由
              const childPath = path.resolve(currentPath, child.path);
              if (childPath === targetPath) {
                return {
                  path: childPath,
                  isParent: false,
                  parentItem: route,
                  matchedRoute: child,
                  isChildRoute: true,
                  // 如果是嵌套路由，记录需要展开的中间层
                  expandableParent: child.children ? child : null,
                };
              }
            }
          }
        }
      }
      return null;
    },

    // 新增：深度查找嵌套菜单
    findMatchingMenuDeep(routes, targetPath, topParent, immediateParent) {
      for (const route of routes) {
        const routePath = path.resolve(
          path.resolve(topParent.path, immediateParent.path),
          route.path
        );

        if (routePath === targetPath) {
          return {
            path: routePath,
            isParent: false,
            parentItem: topParent,
            matchedRoute: route,
            isChildRoute: true,
            isDeepChild: true,
            immediateParent: immediateParent,
            // 需要展开的中间层路径
            expandablePath: immediateParent.path,
          };
        }
      }
      return null;
    },

    // 切换子菜单显示
    toggleSubmenu(item) {
      console.log("=== toggleSubmenu 被调用 ===");
      console.log("点击的菜单项:", item);
      console.log("当前展开项:", this.expandedItem);

      if (this.expandedItem === item.path) {
        // 如果点击的是当前展开的菜单，不做任何操作（需要手动收起）
        console.log("点击已展开的菜单，不执行收起操作");
        return;
      } else {
        // 展开新的子菜单
        console.log("展开新的子菜单");

        // 记录展开前的原始选中项（基于当前路由）
        if (!this.expandedItem) {
          this.originalSelectedItem =
            this.currentRouteItem || this.selectedItem;
        }

        this.expandedItem = item.path;
        this.currentSubmenu = item;
        this.basePath = item.path;

        // 立即高亮父菜单
        this.selectedItem = item.path;

        console.log("设置后的状态:");
        console.log("expandedItem:", this.expandedItem);
        console.log("selectedItem:", this.selectedItem);
        console.log("originalSelectedItem:", this.originalSelectedItem);
      }
      console.log("=== toggleSubmenu 结束 ===");
    },

    // 关闭子菜单
    closeSubmenu() {
      // 只在侧边栏收起时自动关闭，其他情况需要手动收起
      if (!this.sidebar.opened) {
        this.expandedItem = null;
        this.currentSubmenu = null;
        this.basePath = "";

        // 恢复原始选中状态
        if (this.originalSelectedItem) {
          this.selectedItem = this.originalSelectedItem;
          this.originalSelectedItem = null;
        }
      }
    },

    // 处理子菜单点击
    handleSubmenuClick(childPath) {
      const fullPath = this.resolvePath(childPath);
      this.setSelectedItem(fullPath);
      // 更新当前路由项
      this.currentRouteItem = fullPath;
      console.log("子菜单项被点击:", fullPath);
    },

    // 全屏切换功能
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        // 进入全屏
        this.requestFullscreen();
      } else {
        // 退出全屏
        this.exitFullscreen();
      }
    },

    // 请求全屏
    requestFullscreen() {
      const element = document.documentElement;

      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        // Firefox
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        // Chrome, Safari and Opera
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        // IE/Edge
        element.msRequestFullscreen();
      }
    },

    // 退出全屏
    exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        // Firefox
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        // Chrome, Safari and Opera
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        // IE/Edge
        document.msExitFullscreen();
      }
    },

    // 添加全屏事件监听器
    addFullscreenListeners() {
      document.addEventListener(
        "fullscreenchange",
        this.handleFullscreenChange
      );
      document.addEventListener(
        "mozfullscreenchange",
        this.handleFullscreenChange
      );
      document.addEventListener(
        "webkitfullscreenchange",
        this.handleFullscreenChange
      );
      document.addEventListener(
        "msfullscreenchange",
        this.handleFullscreenChange
      );
    },

    // 移除全屏事件监听器
    removeFullscreenListeners() {
      document.removeEventListener(
        "fullscreenchange",
        this.handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        this.handleFullscreenChange
      );
      document.removeEventListener(
        "webkitfullscreenchange",
        this.handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        this.handleFullscreenChange
      );
    },

    // 处理全屏状态变化
    handleFullscreenChange() {
      this.isFullscreen = !!(
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );

      // 全屏状态变化处理
      if (this.isFullscreen) {
        this.$message.success("已进入全屏模式");
        document.body.classList.add("fullscreen-mode");
      } else {
        this.$message.info("已退出全屏模式");
        document.body.classList.remove("fullscreen-mode");
      }
    },

    // ========== 平台切换相关方法 ==========

    // 获取用户平台权限
    getUserPlatformPermissions() {
      const { getAvailablePlatforms } = require("@/utils/routeConfig");
      const userRole =
        this.$store.state.user.role ||
        (this.$store.state.user.roles && this.$store.state.user.roles[0]);

      if (!userRole) {
        console.warn("Layout: 无法获取用户角色");
        return [];
      }

      const permissions = getAvailablePlatforms(userRole);
      console.log("Layout: 用户平台权限:", permissions);

      return permissions;
    },

    // 初始化平台设置
    initializePlatform() {
      // 获取用户可用平台
      const userPermissions = this.getUserPlatformPermissions();

      if (userPermissions.length === 0) {
        console.warn("用户没有任何平台权限");
        return;
      }

      // 从store获取当前平台信息
      const currentStorePlatform =
        this.$store.getters["permission/currentPlatform"];

      console.log("Store中的当前平台:", currentStorePlatform);
      console.log("用户可用平台:", userPermissions);

      // 如果store中有平台信息且用户有权限，使用store中的
      if (
        currentStorePlatform &&
        userPermissions.includes(currentStorePlatform)
      ) {
        this.currentPlatformKey = currentStorePlatform;
        console.log("使用Store中的平台设置:", currentStorePlatform);
        return;
      }

      // 否则从localStorage读取
      const savedPlatform = localStorage.getItem("selectedPlatform");

      // 如果localStorage中的平台有效且用户有权限
      if (savedPlatform && userPermissions.includes(savedPlatform)) {
        this.currentPlatformKey = savedPlatform;
        console.log("使用localStorage中的平台:", savedPlatform);
      } else {
        // 使用用户有权限的第一个平台
        this.currentPlatformKey = userPermissions[0];
        console.log("使用默认平台:", userPermissions[0]);
      }

      console.log("最终初始化平台:", this.currentPlatform.name);
      console.log("是否可以切换平台:", this.canSwitchPlatform);
    },

    // 平台切换（管理系统 ↔ 控制台）
    async handlePlatformSwitch(platformKey) {
      if (platformKey === this.currentPlatformKey || this.platformSwitching) {
        return;
      }

      this.platformSwitching = true;

      try {
        // 保存当前状态信息
        const beforeSwitchInfo = {
          fromPlatform: this.currentPlatformKey,
          toPlatform: platformKey,
          currentRoute: this.$route.path,
          visitedViewsCount:
            this.$store.state.tagsView?.visitedViews?.length || 0,
          cachedViewsCount:
            this.$store.state.tagsView?.cachedViews?.length || 0,
        };

        console.log("=== 平台切换开始 ===");
        console.log("切换信息:", beforeSwitchInfo);

        // 先跳转到切换页面，避免在当前页面显示404
        if (this.$route.path !== "/switching") {
          await this.$router.push("/switching").catch(() => {});
        }

        const loading = this.$loading({
          lock: true,
          text: `正在切换到${this.platformConfig[platformKey].name}...`,
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.7)",
        });

        // 步骤1: 完全清空TagsView
        console.log("步骤1: 完全清空TagsView");
        if (this.$store.hasModule("tagsView")) {
          await this.$store.dispatch("tagsView/clearAllForPlatformSwitch");
          console.log("TagsView已完全清空");
        } else {
          console.warn("TagsView模块不存在");
        }

        // 步骤2: 重置权限路由
        console.log("步骤2: 重置权限路由");
        await this.$store.dispatch("permission/resetRoutes");
        console.log("权限路由已重置");

        // 步骤3: 处理企业状态
        console.log("步骤3: 处理企业状态");
        if (platformKey === "admin") {
          // 切换到管理系统时重置企业状态
          await this.$store.dispatch("manager/resetManager");
          console.log("已重置企业状态（切换到管理系统）");
        } else if (platformKey === "console") {
          // 切换到控制台时重置企业状态，后续会重新加载
          await this.$store.dispatch("manager/resetManager");
          console.log("已重置企业状态（准备切换到控制台）");
        }

        // 步骤4: 等待状态稳定
        await new Promise((resolve) => setTimeout(resolve, 200));

        // 步骤5: 切换平台路由
        console.log("步骤5: 切换平台路由");
        await this.$store.dispatch("permission/switchPlatform", platformKey);
        console.log("平台路由切换完成");

        // 步骤6: 如果切换到控制台，重新加载企业列表
        if (platformKey === "console") {
          console.log("步骤6: 重新加载企业列表");
          await this.loadManagerList();
          console.log("企业列表已重新加载");
        }

        // 步骤7: 更新当前平台状态
        this.currentPlatformKey = platformKey;
        localStorage.setItem("selectedPlatform", platformKey);
        console.log("平台状态已更新:", platformKey);

        // 步骤8: 等待所有状态更新完成
        await new Promise((resolve) => setTimeout(resolve, 100));

        loading.close();

        // 步骤9: 触发平台切换事件通知TagsView组件
        console.log("步骤9: 触发平台切换事件");
        this.$bus &&
          this.$bus.$emit("platform-switched", {
            from: beforeSwitchInfo.fromPlatform,
            to: platformKey,
            type: "platform-switch",
            clearTagsView: true,
            timestamp: new Date().toISOString(),
          });

        this.$message({
          type: "success",
          message: `已切换到${this.platformConfig[platformKey].name}`,
          duration: 2000,
        });

        // 步骤10: 跳转到新平台的首页
        let redirectPath = "/";
        if (platformKey === "console") {
          redirectPath = "/console/dashboard";
        } else if (platformKey === "admin") {
          redirectPath = "/admin/dashboard";
        }

        console.log("步骤10: 跳转到新平台首页:", redirectPath);

        // 使用replace跳转到新平台首页
        await this.$router.replace(redirectPath).catch((err) => {
          console.error("路由跳转失败，使用强制跳转:", err);
          window.location.href = redirectPath;
        });

        // 步骤11: 验证切换结果
        console.log("步骤11: 验证切换结果");
        this.$nextTick(() => {
          const afterSwitchInfo = {
            currentPlatform: this.currentPlatformKey,
            currentRoute: this.$route.path,
            visitedViewsCount:
              this.$store.state.tagsView?.visitedViews?.length || 0,
            cachedViewsCount:
              this.$store.state.tagsView?.cachedViews?.length || 0,
          };
          console.log("切换后状态:", afterSwitchInfo);

          // 验证TagsView是否确实被清空
          if (
            afterSwitchInfo.visitedViewsCount === 0 &&
            afterSwitchInfo.cachedViewsCount === 0
          ) {
            console.log("✅ 平台切换成功：TagsView已完全清空");
          } else {
            console.warn(
              "⚠️ 平台切换警告：TagsView未完全清空",
              afterSwitchInfo
            );
          }
        });

        console.log("=== 平台切换完成 ===");
      } catch (error) {
        console.error("平台切换失败:", error);
        this.$message.error(`平台切换失败: ${error.message || "请稍后重试"}`);

        // 出错时的恢复逻辑
        const loadingInstance = this.$loading.service();
        if (loadingInstance) {
          loadingInstance.close();
        }

        // 如果切换失败，尝试回到之前的页面
        this.$router.go(-1);
      } finally {
        this.platformSwitching = false;
      }
    },

    // 判断当前操作是否为平台切换
    isPlatformSwitch(fromPlatform, toPlatform) {
      // 判断是否为不同平台之间的切换
      const platformMap = {
        admin: "管理系统",
        console: "控制台",
      };

      return (
        fromPlatform !== toPlatform &&
        platformMap[fromPlatform] &&
        platformMap[toPlatform]
      );
    },

    // 判断当前操作是否为企业切换
    isManagerSwitch(fromManagerId, toManagerId, currentPlatform) {
      // 只有在控制台平台内，且企业ID不同时，才是企业切换
      return (
        currentPlatform === "console" &&
        fromManagerId !== toManagerId &&
        fromManagerId &&
        toManagerId
      );
    },
  },
};
</script>
<style lang="scss" scoped>
/* 基础布局 */
.app-wrapper {
  display: flex;
  height: 100vh;
  width: 100%;
  background: var(--main-bg);
  overflow: hidden;
}

.app-wrapper.hideSidebar .sidebar-container {
  width: 60px !important;
}

.app-wrapper.openSidebar .sidebar-container {
  width: 70px !important;
}

/* 左侧菜单栏 - 使用主题色变量 */
.sidebar-container {
  width: 70px;
  background: var(--menu-bg);
  height: 100vh;
  position: relative;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  flex-shrink: 0;
  z-index: 1001;

  .sidebar-logo-container {
    height: 50px;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--menu-border);

    .sidebar-logo-link {
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;

      .logo-placeholder {
        width: 28px;
        height: 28px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 600;
        font-size: 12px;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }
      }
    }
  }

  .scrollbar-wrapper {
    height: calc(100% - 50px);
    overflow: hidden;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .menu-container {
    padding: 8px 0;
  }
}

/* 右侧子菜单面板增强样式 */
.submenu-panel {
  width: 200px;
  background: var(--submenu-bg);
  border-right: 1px solid var(--border-color);
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: relative;

  .submenu-header {
    height: 50px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--search-bg);
    border-bottom: 1px solid var(--border-color);

    .submenu-title {
      display: flex;
      align-items: center;
      color: var(--text-primary);
      font-weight: 600;
      font-size: 14px;
      flex: 1;

      .submenu-icon {
        font-size: 16px;
        margin-right: 8px;
        color: var(--primary-color);
      }
    }

    .submenu-collapse-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 6px;
      background: transparent;
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;
      color: var(--text-muted);
      flex-shrink: 0;

      &:hover {
        background: var(--hover-bg);
        border-color: var(--primary-color);
        color: var(--primary-color);
        transform: scale(1.05);
      }

      &:active {
        transform: scale(0.95);
      }

      i {
        font-size: 12px;
        transition: transform 0.3s ease;
      }

      &:hover i {
        transform: rotate(90deg);
      }
    }
  }

  .submenu-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;

    /* 分组标题样式 */
    .submenu-group-header {
      padding: 12px 16px 8px;
      margin-bottom: 4px;
      border-bottom: 1px solid var(--border-color);

      .group-title {
        font-size: 12px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
        margin-left: 3px;
        margin-right: 3px;
      }
    }

    /* 可展开的菜单项 */
    .submenu-expandable {
      margin: 2px 0;

      .expandable-header {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        color: var(--submenu-text);
        transition: all 0.15s ease;
        cursor: pointer;
        margin: 2px 8px;
        border-radius: 4px;
        font-size: 14px;
        position: relative;

        .submenu-item-icon {
          font-size: 14px;
          margin-right: 10px;
          color: var(--text-secondary);
          width: 16px;
          text-align: center;
        }

        .submenu-item-title {
          font-size: 14px;
          font-weight: 400;
          line-height: 1.4;
          flex: 1;
        }

        .expand-icon {
          font-size: 12px;
          color: var(--text-muted);
          transition: transform 0.3s ease;
          margin-left: 8px;
        }

        &:hover {
          background: var(--submenu-hover-bg);
          color: var(--primary-color);

          .submenu-item-icon {
            color: var(--primary-color);
          }
        }

        &.is-expanded {
          background: var(--submenu-hover-bg);
          color: var(--primary-color);

          .expand-icon {
            transform: rotate(90deg);
          }
        }

        &.has-active-child {
          color: var(--primary-color);
          font-weight: 500;

          .submenu-item-icon {
            color: var(--primary-color);
          }
        }
      }

      /* 子菜单容器 */
      .submenu-children {
        overflow: hidden;
        background: var(--search-bg);
        margin: 0 8px;
        border-radius: 4px;
        padding: 4px 0;

        /* 子项分隔线 */
        .submenu-child-divider {
          height: 1px;
          background: var(--border-color);
          margin: 8px 16px;
          position: relative;

          &.with-label {
            height: auto;
            background: none;
            margin: 12px 16px 8px;

            .divider-label {
              display: block;
              font-size: 10px;
              color: var(--text-muted);
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 600;
            }
          }
        }

        .submenu-child-link {
          text-decoration: none;
          display: block;

          .submenu-child-item {
            display: flex;
            align-items: center;
            padding: 10px 16px 10px 32px;
            color: var(--submenu-text);
            transition: all 0.15s ease;
            cursor: pointer;
            font-size: 13px;

            .submenu-child-icon {
              font-size: 12px;
              margin-right: 10px;
              color: var(--text-secondary);
              width: 14px;
              text-align: center;
            }

            .submenu-child-title {
              font-size: 13px;
              font-weight: 400;
              line-height: 1.4;
            }

            &:hover {
              background: var(--hover-bg);
              color: var(--primary-color);

              .submenu-child-icon {
                color: var(--primary-color);
              }
            }

            &.is-active {
              background: var(--submenu-active-bg);
              color: var(--submenu-active-text);
              font-weight: 500;
              position: relative;

              &::before {
                content: "";
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 4px;
                background: var(--primary-color);
                border-radius: 50%;
              }

              .submenu-child-icon {
                color: var(--submenu-active-text);
              }
            }
          }
        }
      }
    }

    /* 普通菜单项样式保持不变 */
    .submenu-item-link {
      text-decoration: none;
      display: block;

      .submenu-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        color: var(--submenu-text);
        transition: all 0.15s ease;
        cursor: pointer;
        margin: 2px 8px;
        border-radius: 4px;
        font-size: 14px;

        .submenu-item-icon {
          font-size: 14px;
          margin-right: 10px;
          color: var(--text-secondary);
          width: 16px;
          text-align: center;
        }

        .submenu-item-title {
          font-size: 14px;
          font-weight: 400;
          line-height: 1.4;
        }

        &:hover {
          background: var(--submenu-hover-bg);
          color: var(--primary-color);

          .submenu-item-icon {
            color: var(--primary-color);
          }
        }

        &.is-active {
          background: var(--submenu-active-bg);
          color: var(--submenu-active-text);
          font-weight: 500;

          .submenu-item-icon {
            color: var(--submenu-active-text);
          }
        }
      }
    }

    /* 分隔线样式 */
    .submenu-divider {
      height: 1px;
      background: var(--border-color);
      margin: 12px 16px;
      position: relative;

      &.with-label {
        height: auto;
        background: none;
        margin: 20px 16px 12px;

        .divider-label {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-bottom: 8px;
          padding: 0 4px;
          position: relative;
        }
      }
    }

    /* 滚动条样式 */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: var(--card-bg);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 3px;

      &:hover {
        background: var(--border-secondary);
      }
    }
  }
}

/* 子菜单展开动画 */
.submenu-expand-enter-active,
.submenu-expand-leave-active {
  transition: all 0.3s ease;
}

.submenu-expand-enter,
.submenu-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.submenu-expand-enter-to,
.submenu-expand-leave {
  opacity: 1;
  max-height: 500px;
}

/* 子菜单面板过渡动画 */
.submenu-slide-enter-active,
.submenu-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.submenu-slide-enter {
  opacity: 0;
  transform: translateX(-10px);
}

.submenu-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 主内容区 */
.main-container {
  flex: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
  min-width: 0;
  background: none;
}

/* 顶部导航栏样式 - 管理方切换功能 */
.navbar {
  height: 56px;
  background: var(--navbar-bg);
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  transition: all 0.3s ease;

  .navbar-left {
    display: flex;
    align-items: center;
    gap: 16px;

    /* 管理方切换器样式 */
    .manager-switcher {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 20px;
      background: var(--card-bg);
      border-radius: 10px;
      transition: all 0.3s ease;
      min-width: 280px;
      max-height: 70vh !important;
      &:hover {
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .switcher-label {
        font-size: 12px;
        color: var(--text-muted);
        font-weight: 500;
        flex-shrink: 0;
      }

      .current-manager {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        padding: 4px 12px;
        border-radius: 6px;
        transition: all 0.3s ease;
        flex: 1;

        &:hover {
          background: var(--hover-bg);
        }

        .manager-avatar {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, var(--primary-color), #667eea);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .manager-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;

          .manager-name {
            font-size: 14px;
            color: var(--text-primary);
            font-weight: 600;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .default-badge {
            font-size: 10px;
            color: var(--primary-color);
            font-weight: 500;
            line-height: 1;
            margin-top: 2px;
          }
        }

        .manager-arrow {
          font-size: 12px;
          color: var(--text-muted);
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        &:hover .manager-arrow {
          transform: rotate(180deg);
        }
      }
    }
  }

  .navbar-right {
    display: flex;
    align-items: center;
    gap: 20px;

    /* 平台切换器样式 */
    .platform-switcher {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .switcher-label {
        font-size: 12px;
        color: var(--text-muted);
        font-weight: 500;
      }

      .current-platform {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.3s ease;

        &:hover {
          background: var(--hover-bg);
        }

        .platform-icon {
          font-size: 16px;
          color: var(--primary-color);
        }

        .platform-name {
          font-size: 14px;
          color: var(--text-primary);
          font-weight: 600;
        }

        .platform-arrow {
          font-size: 12px;
          color: var(--text-muted);
          transition: transform 0.3s ease;
        }

        &:hover .platform-arrow {
          transform: rotate(180deg);
        }
      }
    }

    /* 单一平台显示样式 */
    .single-platform {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      position: relative;

      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background: var(--primary-color);
        border-radius: 0 2px 2px 0;
      }

      .platform-label {
        font-size: 12px;
        color: var(--text-muted);
        font-weight: 500;
        margin-left: 4px;
      }

      .platform-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .platform-icon {
          font-size: 16px;
          color: var(--primary-color);
        }

        .platform-name {
          font-size: 14px;
          color: var(--text-primary);
          font-weight: 600;
        }
      }
    }

    /* 角色显示样式 */
    .role-container {
      .el-tag {
        background: var(--hover-bg);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        font-weight: 500;
        font-size: 12px;
        padding: 4px 8px;
        height: auto;
        line-height: 1.2;
      }
    }

    /* 全屏按钮样式 */
    .fullscreen-container {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 8px;
      background: var(--hover-bg);
      border: 1px solid var(--border-color);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: var(--primary-color);
        border-color: var(--primary-color);
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);

        i {
          color: #fff;
        }
      }

      &:active {
        transform: translateY(0);
      }

      i {
        font-size: 16px;
        color: var(--text-secondary);
        transition: color 0.3s ease;
      }
    }

    .avatar-container {
      .avatar-wrapper {
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 8px 16px;
        border-radius: 10px;
        background: var(--hover-bg);
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;

        &:hover {
          background: var(--card-bg);
          border-color: var(--primary-color);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          margin-right: 10px;
          border: 1px solid var(--border-color);
          transition: all 0.3s ease;
        }

        .user-name {
          font-size: 14px;
          color: var(--text-primary);
          margin-right: 6px;
          font-weight: 600;
        }

        .el-icon-caret-bottom {
          font-size: 12px;
          color: var(--text-muted);
          transition: transform 0.3s ease;
        }

        &:hover .el-icon-caret-bottom {
          transform: rotate(180deg);
        }
      }
    }
  }
}

/* 面包屑工具栏样式 */
.breadcrumb-toolbar {
  height: 48px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;

    .hamburger-container {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 8px;
      background: var(--hover-bg);
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;
      flex-shrink: 0;

      &:hover {
        background: var(--primary-color);
        border-color: var(--primary-color);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);

        i {
          color: #fff;
        }
      }

      &:active {
        transform: translateY(0);
      }

      i {
        font-size: 16px;
        color: var(--text-secondary);
        transition: all 0.3s ease;
      }
    }

    .breadcrumb-container {
      font-size: 14px;
      color: var(--text-secondary);
      font-weight: 500;
      flex: 1;
    }
  }
}

/* ========== 新增：内容区域容器样式 ========== */
.content-wrapper {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* ========== 新增：树形面板样式 ========== */
.tree-panel {
  width: 240px;
  background: var(--card-bg);
  border-right: 1px solid var(--border-color);
  // height: calc(100vh - 104px); /* 减去navbar和breadcrumb的高度 */
  height: 80vh;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  margin-left: 20px;
  margin-top: 16px;

  .tree-header {
    height: 50px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--hover-bg);
    border-bottom: 1px solid var(--border-color);

    .tree-title {
      display: flex;
      align-items: center;
      color: var(--text-primary);
      font-weight: 600;
      font-size: 14px;
      flex: 1;

      .tree-icon {
        font-size: 16px;
        margin-right: 8px;
        color: var(--primary-color);
      }
    }

    .tree-actions {
      display: flex;
      align-items: center;
      gap: 8px;

      .tree-action-btn {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 6px;
        background: transparent;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
        color: var(--text-muted);

        &:hover {
          background: var(--hover-bg);
          border-color: var(--primary-color);
          color: var(--primary-color);
          transform: scale(1.05);
        }

        i {
          font-size: 12px;
        }
      }

      .tree-collapse-btn {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 6px;
        background: transparent;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
        color: var(--text-muted);

        &:hover {
          background: var(--hover-bg);
          border-color: var(--primary-color);
          color: var(--primary-color);
          transform: scale(1.05);
        }

        i {
          font-size: 12px;
        }
      }
    }
  }

  .tree-search {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .tree-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    .custom-tree {
      background: transparent;
      ::v-deep .el-tree-node__expand-icon.is-leaf {
        visibility: hidden; // 或者用 display: none;
      }

      /* 树节点样式 */
      ::v-deep .el-tree-node {
        .el-tree-node__content {
          height: 36px;
          padding: 0 8px;
          border-radius: 6px;
          margin: 2px 0;
          transition: all 0.3s ease;

          &:hover {
            background: var(--hover-bg);
          }

          .el-tree-node__expand-icon {
            color: var(--text-muted);
            font-size: 12px;

            &.expanded {
              transform: rotate(90deg);
            }
          }

          .el-checkbox {
            margin-right: 8px;
          }
        }

        /* 选中状态 */
        &.is-current > .el-tree-node__content {
          background: var(--primary-color);
          color: #fff;

          .node-icon {
            color: #fff !important;
          }

          .node-label {
            color: #fff;
          }
        }
      }

      .custom-tree-node {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 14px;
        padding-right: 8px;

        .node-content {
          display: flex;
          align-items: center;
          flex: 1;

          .node-icon {
            font-size: 16px;
            margin-right: 8px;
            transition: color 0.3s ease;
          }

          .node-label {
            font-weight: 400;
            color: var(--text-primary);
            line-height: 1.4;
          }
        }

        .node-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.3s ease;

          .action-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            color: var(--text-muted);
            transition: all 0.3s ease;

            &:hover {
              background: var(--hover-bg);
              color: var(--primary-color);
            }

            &.delete-icon:hover {
              color: #f56c6c;
              background: rgba(245, 108, 108, 0.1);
            }
          }
        }

        /* 鼠标悬停时显示操作按钮 */
        &:hover .node-actions {
          opacity: 1;
        }
      }
    }

    /* 滚动条样式 */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: var(--card-bg);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 3px;

      &:hover {
        background: var(--border-secondary);
      }
    }
  }
}

/* 树形面板收起时的展开按钮 */
.tree-toggle-btn {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 48px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-left: none;
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
    transform: translateY(-50%) translateX(2px);

    i {
      color: #fff;
    }
  }

  i {
    font-size: 14px;
    color: var(--text-muted);
    transition: color 0.3s ease;
  }
}

/* 树形面板过渡动画 */
.tree-slide-enter-active,
.tree-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tree-slide-enter {
  opacity: 0;
  transform: translateX(-100%);
}

.tree-slide-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

/* 主内容区样式 */
.app-main {
  flex: 1;
  background: transparent;
  overflow-y: auto;
  position: relative;
  transition: all 0.3s ease;

  /* 有树形面板时的样式 */
  &.with-tree {
    margin-left: 0;
  }
}

/* 响应式处理 */
@media (max-width: 768px) {
  .submenu-panel {
    display: none;
  }

  .tree-panel {
    width: 250px;
  }

  .sidebar-container {
    width: 150px;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1001;
    transform: translateX(-100%);
    transition: transform 0.3s ease;

    &.mobile-open {
      transform: translateX(0);
    }
  }

  .app-wrapper.hideSidebar .sidebar-container,
  .app-wrapper.openSidebar .sidebar-container {
    width: 70px;
  }

  .main-container {
    width: 100%;
  }

  .navbar {
    padding: 0 16px;
    height: 50px;

    .navbar-left {
      .manager-switcher {
        padding: 6px 12px;
        gap: 8px;
        min-width: unset;

        .manager-name {
          font-size: 13px;
        }

        .switcher-label {
          display: none;
        }

        .manager-info {
          .default-badge {
            display: none;
          }
        }
      }
    }

    .navbar-right {
      gap: 12px;

      .platform-switcher {
        padding: 6px 12px;
        gap: 8px;

        .platform-name {
          font-size: 13px;
        }

        .switcher-label {
          display: none;
        }
      }

      .single-platform {
        padding: 6px 12px;
        gap: 8px;

        .platform-label {
          display: none;
        }

        .platform-info {
          .platform-name {
            font-size: 13px;
          }
        }
      }

      .fullscreen-container {
        width: 32px;
        height: 32px;

        i {
          font-size: 14px;
        }
      }

      .avatar-container .avatar-wrapper {
        padding: 6px 12px;

        .user-avatar {
          width: 24px;
          height: 24px;
        }

        .user-name {
          font-size: 13px;
        }
      }
    }
  }

  .breadcrumb-toolbar {
    padding: 0 16px;
    height: 44px;

    .toolbar-left {
      gap: 12px;

      .hamburger-container {
        width: 32px;
        height: 32px;

        i {
          font-size: 14px;
        }
      }
    }
  }

  .app-main {
    padding: 16px;
  }

  .tree-toggle-btn {
    width: 28px;
    height: 40px;

    i {
      font-size: 12px;
    }
  }
}

/* 管理方切换下拉菜单样式 */
.manager-dropdown {
  background: var(--card-bg) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 10px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  padding: 0 !important;
  min-width: 360px !important;
  max-height: 70vh !important;

  .dropdown-header {
    padding: 14px 20px;
    background: var(--hover-bg);
    border-bottom: 1px solid var(--border-color);
    border-radius: 10px 10px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .manager-option {
    color: var(--text-secondary) !important;
    font-weight: 500;
    padding: 16px 20px !important;
    font-size: 14px !important;
    transition: all 0.3s ease;
    display: flex !important;
    align-items: flex-start;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
    position: relative;
    min-height: 80px;

    &:last-child {
      border-bottom: none !important;
      border-radius: 0 0 10px 10px;
    }

    &:hover:not(.is-disabled) {
      background: var(--hover-bg) !important;
      color: var(--text-primary) !important;

      .option-avatar {
        background: linear-gradient(
          135deg,
          var(--primary-color),
          #667eea
        ) !important;
        transform: scale(1.05);
      }
    }

    &.is-disabled {
      opacity: 0.6;
      cursor: not-allowed !important;
      background: rgba(0, 0, 0, 0.02) !important;
    }

    .option-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #a8a8a8, #d3d3d3);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      font-size: 16px;
      text-transform: uppercase;
      margin-right: 16px;
      transition: all 0.3s ease;
      flex-shrink: 0;
    }

    .option-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;

      .option-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.3;
        margin-bottom: 4px;
      }

      .option-address {
        font-size: 13px;
        color: var(--text-muted);
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }

    .option-badges {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: flex-end;
      flex-shrink: 0;
      margin-left: 12px;

      .default-badge {
        background: #f0f9ff;
        color: var(--primary-color);
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: 1px solid rgba(59, 130, 246, 0.2);
      }

      .current-badge {
        background: var(--primary-color);
        color: #fff;
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
  }
}

/* 平台切换下拉菜单样式 */
.platform-dropdown {
  background: var(--card-bg) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 10px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  padding: 8px 0 !important;
  min-width: 200px !important;

  .platform-option {
    color: var(--text-secondary) !important;
    font-weight: 500;
    padding: 12px 16px !important;
    font-size: 14px !important;
    transition: all 0.3s ease;
    display: flex !important;
    align-items: center;
    justify-content: space-between;

    &:hover:not(.is-disabled) {
      background: var(--hover-bg) !important;
      color: var(--text-primary) !important;

      .option-icon {
        color: var(--primary-color) !important;
      }
    }

    &.is-disabled {
      opacity: 0.6;
      cursor: not-allowed !important;
    }

    .option-icon {
      font-size: 16px;
      margin-right: 10px;
      color: var(--text-muted);
      transition: color 0.3s ease;
    }

    .option-name {
      flex: 1;
      font-weight: 500;
    }

    .current-badge {
      background: var(--primary-color);
      color: #fff;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
}

/* 用户下拉菜单样式 */
.el-dropdown-menu {
  overflow: auto;
  min-height: 50px;
  overflow-x: hidden;
  .el-dropdown-menu__item--divided {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid var(--border-color);

    &:before {
      display: none !important; // 直接隐藏原有的伪元素
    }
  }
}

/* 全屏模式下的全局样式 */
.fullscreen-mode {
  .app-wrapper {
    .navbar {
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
    }
  }

  /* 全屏模式下隐藏浏览器滚动条 */
  body {
    overflow: hidden;
  }
}

/* 滚动条完全隐藏 */
.scrollbar-wrapper {
  .el-scrollbar__bar {
    display: none !important;
  }

  .el-scrollbar__wrap {
    overflow-x: hidden !important;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none !important;
    }
  }
}

/* Loading 组件样式优化 */
.el-loading-mask {
  background-color: rgba(0, 0, 0, 0.8) !important;

  .el-loading-spinner {
    .el-loading-text {
      color: #fff !important;
      font-weight: 500;
      font-size: 14px;
    }
  }
}

/* 消息提示样式优化 */
.el-message {
  min-width: 300px !important;
  border-radius: 8px !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;

  &.el-message--success {
    background-color: var(--card-bg) !important;
    border-color: #67c23a !important;

    .el-message__content {
      color: #67c23a !important;
      font-weight: 500;
    }
  }

  &.el-message--error {
    background-color: var(--card-bg) !important;
    border-color: #f56c6c !important;

    .el-message__content {
      color: #f56c6c !important;
      font-weight: 500;
    }
  }

  &.el-message--info {
    background-color: var(--card-bg) !important;
    border-color: var(--primary-color) !important;

    .el-message__content {
      color: var(--primary-color) !important;
      font-weight: 500;
    }
  }
}
</style>
