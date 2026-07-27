<template>
  <div class="tier-management-container">
    <el-empty v-if="!canView" description="暂无查看权限" />
    <template v-else>
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">层级管理</h1>
        <div class="page-tips">
          <el-tooltip effect="dark" placement="bottom-start">
            <div slot="content">
              <div class="tooltip-content">
                <div class="tip-title">操作说明</div>
                <div class="tip-item">• 左侧树形结构：展示组织层级关系</div>
                <div class="tip-item">• 右键菜单：创建子层级、修改、删除</div>
                <div class="tip-item">• 拖拽排序：调整层级结构</div>
                <div class="tip-item">• 绑定操作：关联租户到指定层级</div>
              </div>
            </div>
            <i class="el-icon-question help-icon"></i>
          </el-tooltip>
          <span class="tip-text">右键节点可进行层级操作，拖拽可调整结构</span>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- 左侧：层级管理 -->
      <div class="left-panel">
        <div class="panel-header">
          <div class="panel-title">层级结构</div>
          <div class="panel-tools">
            <el-input
              v-model="filterText"
              placeholder="搜索层级"
              size="small"
              prefix-icon="el-icon-search"
              class="search-input"
              clearable
            />
            <el-button
              v-if="canTierManage"
              type="primary"
              size="small"
              icon="el-icon-plus"
              @click="handleAddTier"
            >
              新增层级
            </el-button>
          </div>
        </div>

        <div class="panel-body">
          <div v-loading="leftLoading" class="tree-wrapper">
            <el-tree
              ref="leftTree"
              :data="tierTreeData"
              :props="tierTreeProps"
              node-key="id"
              show-checkbox
              :draggable="canTierManage"
              :indent="24"
              :filter-node-method="filterNode"
              @check-change="handleLeftCheckChange"
              @node-drop="handleNodeDrop"
              @node-contextmenu="handleNodeRightClick"
              class="hierarchy-tree"
              :render-after-expand="false"
              :expand-on-click-node="false"
            >
              <span slot-scope="{ node, data }" class="tree-node-content">
                <div class="node-info">
                  <span class="node-name">{{ node.label }}</span>
                </div>
                <div class="node-level">L{{ node.level }}</div>
              </span>
            </el-tree>
          </div>
        </div>
      </div>

      <!-- 中间：操作区域 -->
      <div class="operation-panel">
        <div class="operation-content">
          <div class="operation-title">操作</div>

          <div class="operation-buttons">
            <template v-if="!isOperating">
              <button
                class="operation-btn bind-btn"
                @click="startOperation('bind')"
                :disabled="leftLoading || rightLoading || !canBindManage"
              >
                <i class="el-icon-connection"></i>
                <span>绑定租户</span>
              </button>
              <button
                class="operation-btn unbind-btn"
                @click="startOperation('unbind')"
                :disabled="leftLoading || rightLoading || !canBindManage"
              >
                <i class="el-icon-remove"></i>
                <span>解绑租户</span>
              </button>
            </template>

            <template v-else>
              <button
                class="operation-btn confirm-btn"
                @click="confirmOperation"
                :disabled="submitting || !canBindManage"
              >
                <i class="el-icon-check"></i>
                <span>{{ submitting ? "处理中..." : "确认操作" }}</span>
              </button>
              <button
                class="operation-btn cancel-btn"
                @click="cancelOperation"
                :disabled="submitting"
              >
                <i class="el-icon-close"></i>
                <span>取消</span>
              </button>
            </template>
          </div>

          <!-- 操作提示 -->
          <div v-if="isOperating" class="operation-hint">
            <div class="hint-content">
              <i class="el-icon-info"></i>
              <span>{{
                operationType === "bind"
                  ? "请选择要绑定的层级和租户"
                  : "请选择要解绑的租户"
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：未绑定租户 -->
      <div class="right-panel">
        <div class="panel-header">
          <div class="panel-title">未绑定租户</div>
          <div class="panel-tools">
            <el-input
              v-model="tenantSearchName"
              placeholder="搜索租户"
              size="small"
              prefix-icon="el-icon-search"
              class="search-input"
              clearable
              @keyup.enter.native="searchUnboundTenants"
            />
            <el-button
              type="default"
              size="small"
              icon="el-icon-refresh"
              @click="searchUnboundTenants"
            >
              刷新
            </el-button>
          </div>
        </div>

        <div class="panel-body">
          <div v-loading="rightLoading" class="tree-wrapper">
            <el-tree
              ref="rightTree"
              :data="unboundTenantData"
              :props="tenantTreeProps"
              node-key="tenantId"
              show-checkbox
              :check-strictly="operationType === 'bind'"
              @check-change="handleRightCheckChange"
              class="tenant-tree"
            >
              <span slot-scope="{ node, data }" class="tree-node-content">
                <div class="node-info">
                  <i class="el-icon-office-building"></i>
                  <span class="node-name">{{ node.label }}</span>
                </div>
              </span>
            </el-tree>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增层级对话框 -->
    <TierDialog
      :visible.sync="tierDialog.visible"
      :type="tierDialog.type"
      :data="tierDialog.data"
      @success="handleTierSuccess"
    />

    <!-- 右键菜单 -->
    <div
      v-show="contextMenuVisible"
      :style="{ left: contextMenuLeft + 'px', top: contextMenuTop + 'px' }"
      class="context-menu"
      @click.stop
    >
      <div class="menu-item" @click="handleAddChildTier">
        <i class="el-icon-plus"></i>
        <span>创建子层级</span>
      </div>
      <div class="menu-item" @click="handleEditTier">
        <i class="el-icon-edit"></i>
        <span>修改层级</span>
      </div>
      <div class="menu-item danger" @click="handleDeleteTier">
        <i class="el-icon-delete"></i>
        <span>删除层级</span>
      </div>
    </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  tierSelectTenantTierList,
  tierNoBindTenantlist,
  tierBindTenantTier,
  tierUnbundleTenantTier,
  tierUpdateTenantTier,
  tierDeleteTenantTier
} from '@/api/tier'
import TierDialog from '@/components/TierDialog.vue'

export default {
  name: 'TierManagement',
  components: {
    TierDialog
  },
  data () {
    return {
      // 搜索过滤
      filterText: '',
      tenantSearchName: '',

      // 加载状态
      leftLoading: false,
      rightLoading: false,
      submitting: false,

      // 树形数据
      tierTreeData: [],
      unboundTenantData: [],

      // 树形配置
      tierTreeProps: {
        label: 'name',
        children: 'tenantTierDtoList'
      },
      tenantTreeProps: {
        label: 'tenantName'
      },

      // 操作状态
      isOperating: false,
      operationType: '', // 'bind' | 'unbind'

      // 选中数据
      selectedTierIds: [],
      selectedTenantIds: [],
      selectedParentId: '',

      // 对话框
      tierDialog: {
        visible: false,
        type: 'add',
        data: null
      },

      // 右键菜单
      contextMenuVisible: false,
      contextMenuLeft: 0,
      contextMenuTop: 0,
      currentRightClickNode: null
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map(v => String(v)))
      return menuNo => allow.has(String(menuNo))
    },
    canView () {
      return this.hasKztPermission('620012')
    },
    canTierManage () {
      return this.hasKztPermission('620010')
    },
    canBindManage () {
      return this.hasKztPermission('620011')
    }
  },
  watch: {
    filterText (val) {
      this.$refs.leftTree.filter(val)
    },
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          if (this.canView) this.initData()
        }
      },
      immediate: true
    },
    canView: {
      handler (val) {
        if (val && this.currentManagerId) this.initData()
      },
      immediate: true
    }
  },
  mounted () {
    if (this.canView) this.initData()
    // 添加全局点击事件，用于隐藏右键菜单
    document.addEventListener('click', this.hideContextMenu)
  },
  beforeDestroy () {
    // 移除全局点击事件
    document.removeEventListener('click', this.hideContextMenu)
  },
  methods: {
    _requireTierManage () {
      if (this.canTierManage) return true
      this.$message.warning('暂无新增权限')
      return false
    },
    _requireBindManage () {
      if (this.canBindManage) return true
      this.$message.warning('暂无绑定/解绑权限')
      return false
    },
    // 初始化数据
    async initData () {
      if (!this.canView) return
      if (!this.currentManagerId) return

      await Promise.all([this.loadTierData(), this.loadUnboundTenants()])
    },

    // 加载层级数据
    async loadTierData () {
      if (!this.canView) return
      if (!this.currentManagerId) return

      try {
        this.leftLoading = true
        const response = await tierSelectTenantTierList({
          managerId: this.currentManagerId
        })

        if (response.code === 200) {
          this.tierTreeData = response.data || []
        } else {
          this.$message.error(response.msg || '获取层级数据失败')
        }
      } catch (error) {
        console.error('加载层级数据失败:', error)
        this.$message.error('加载层级数据失败')
      } finally {
        this.leftLoading = false
      }
    },

    // 加载未绑定租户
    async loadUnboundTenants () {
      if (!this.canView) return
      if (!this.currentManagerId) return

      try {
        this.rightLoading = true
        const params = {
          managerId: this.currentManagerId,
          tenantName: this.tenantSearchName || ''
        }

        const response = await tierNoBindTenantlist(params)

        if (response.code === 200) {
          this.unboundTenantData = response.data || []
        } else {
          this.$message.error(response.msg || '获取未绑定租户失败')
        }
      } catch (error) {
        console.error('加载未绑定租户失败:', error)
        this.$message.error('加载未绑定租户失败')
      } finally {
        this.rightLoading = false
      }
    },

    // 搜索未绑定租户
    searchUnboundTenants () {
      if (!this.canView) return
      this.loadUnboundTenants()
    },

    // 树节点过滤
    filterNode (value, data) {
      if (!value) return true
      return data.name.indexOf(value) !== -1
    },

    // 左侧树选择变化
    handleLeftCheckChange (data, checked) {
      if (this.operationType === 'bind') {
        // 绑定模式：只能选择一个层级作为父级
        if (checked) {
          this.selectedParentId = data.id
          // 取消其他选中
          this.$refs.leftTree.setCheckedKeys([data.id])
        } else {
          this.selectedParentId = ''
        }
      } else if (this.operationType === 'unbind') {
        // 解绑模式：只能选择有租户的节点
        if (!data.tenantId) {
          this.$nextTick(() => {
            this.$refs.leftTree.setChecked(data.id, false)
          })
          this.$message.warning('请选择已绑定租户的层级')
          return
        }

        const index = this.selectedTierIds.indexOf(data.id)
        if (checked && index === -1) {
          this.selectedTierIds.push(data.id)
        } else if (!checked && index !== -1) {
          this.selectedTierIds.splice(index, 1)
        }
      }
    },

    // 右侧树选择变化
    handleRightCheckChange (data, checked) {
      if (this.operationType !== 'bind') return

      const index = this.selectedTenantIds.indexOf(data.tenantId)
      if (checked && index === -1) {
        this.selectedTenantIds.push(data.tenantId)
      } else if (!checked && index !== -1) {
        this.selectedTenantIds.splice(index, 1)
      }
    },

    // 节点拖拽
    async handleNodeDrop (dragNode, dropNode, dropType) {
      if (!this._requireTierManage()) return
      try {
        await this.$confirm('确认修改层级结构吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        this.leftLoading = true

        const params = {
          id: dragNode.data.id,
          name: dragNode.data.name,
          parentId: dropNode.data.parentId,
          level: dropNode.data.level
        }

        if (dropType === 'inner' && !dropNode.data.tenantId) {
          params.parentId = dropNode.data.id
          params.level = dropNode.data.level + 1
        }

        const response = await tierUpdateTenantTier(params)

        if (response.code === 200) {
          this.$message.success(response.msg || '层级结构修改成功')
          await this.loadTierData()
        } else {
          this.$message.error(response.msg || '层级结构修改失败')
          await this.loadTierData()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('修改层级结构失败:', error)
          this.$message.error('修改层级结构失败')
        }
        await this.loadTierData()
      } finally {
        this.leftLoading = false
      }
    },

    // 开始操作
    startOperation (type) {
      if (!this._requireBindManage()) return
      this.isOperating = true
      this.operationType = type
      this.selectedTierIds = []
      this.selectedTenantIds = []
      this.selectedParentId = ''

      // 清空选中状态
      this.$refs.leftTree.setCheckedKeys([])
      this.$refs.rightTree.setCheckedKeys([])
    },

    // 取消操作
    cancelOperation () {
      this.isOperating = false
      this.operationType = ''
      this.selectedTierIds = []
      this.selectedTenantIds = []
      this.selectedParentId = ''

      // 清空选中状态
      this.$refs.leftTree.setCheckedKeys([])
      this.$refs.rightTree.setCheckedKeys([])
    },

    // 确认操作
    async confirmOperation () {
      if (!this._requireBindManage()) return
      if (this.operationType === 'bind') {
        await this.bindTenants()
      } else if (this.operationType === 'unbind') {
        await this.unbindTenants()
      }
    },

    // 绑定租户
    async bindTenants () {
      if (!this.selectedParentId) {
        this.$message.warning('请选择要绑定的层级')
        return
      }

      if (this.selectedTenantIds.length === 0) {
        this.$message.warning('请选择要绑定的租户')
        return
      }

      try {
        await this.$confirm(
          `确认将 ${this.selectedTenantIds.length} 个租户绑定到选中层级吗？`,
          '确认绑定',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        this.submitting = true

        const params = {
          parentId: this.selectedParentId,
          tenantIdList: this.selectedTenantIds
        }

        const response = await tierBindTenantTier(params)

        if (response.code === 200) {
          this.$message.success(response.msg || '租户绑定成功')
          this.cancelOperation()
          await this.initData()
        } else {
          this.$message.error(response.msg || '租户绑定失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('绑定租户失败:', error)
          this.$message.error('绑定租户失败')
        }
      } finally {
        this.submitting = false
      }
    },

    // 解绑租户
    async unbindTenants () {
      if (this.selectedTierIds.length === 0) {
        this.$message.warning('请选择要解绑的租户')
        return
      }

      try {
        await this.$confirm(
          `确认解绑 ${this.selectedTierIds.length} 个租户吗？`,
          '确认解绑',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        this.submitting = true

        const params = {
          idList: this.selectedTierIds
        }

        const response = await tierUnbundleTenantTier(params)

        if (response.code === 200) {
          this.$message.success(response.msg || '租户解绑成功')
          this.cancelOperation()
          await this.initData()
        } else {
          this.$message.error(response.msg || '租户解绑失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('解绑租户失败:', error)
          this.$message.error('解绑租户失败')
        }
      } finally {
        this.submitting = false
      }
    },

    // 新增层级
    handleAddTier () {
      if (!this._requireTierManage()) return
      this.tierDialog = {
        visible: true,
        type: 'add',
        data: null
      }
    },

    // 右键点击节点
    handleNodeRightClick (event, data, node, element) {
      if (!this._requireTierManage()) return
      event.preventDefault()
      event.stopPropagation()

      this.currentRightClickNode = { data, node }

      // 获取鼠标在页面中的位置
      this.contextMenuLeft = event.pageX
      this.contextMenuTop = event.pageY
      this.contextMenuVisible = true

      // 防止菜单超出屏幕边界
      this.$nextTick(() => {
        const menu = document.querySelector('.context-menu')
        if (menu) {
          const menuRect = menu.getBoundingClientRect()
          const windowWidth = window.innerWidth
          const windowHeight = window.innerHeight

          if (event.clientX + menuRect.width > windowWidth) {
            this.contextMenuLeft = event.pageX - menuRect.width
          }

          if (event.clientY + menuRect.height > windowHeight) {
            this.contextMenuTop = event.pageY - menuRect.height
          }
        }
      })
    },

    // 隐藏右键菜单
    hideContextMenu (event) {
      // 如果点击的是菜单本身，不隐藏
      if (event && event.target.closest('.context-menu')) {
        return
      }
      this.contextMenuVisible = false
      // 延迟清空节点信息，避免菜单点击时节点信息丢失
      setTimeout(() => {
        this.currentRightClickNode = null
      }, 100)
    },

    // 创建子层级
    handleAddChildTier () {
      if (!this._requireTierManage()) return
      if (this.currentRightClickNode) {
        console.log('创建子层级，父级数据:', this.currentRightClickNode.data)
        this.tierDialog = {
          visible: true,
          type: 'addChild',
          data: this.currentRightClickNode.data
        }
      } else {
        this.$message.warning('请先选择父级层级')
      }
      this.contextMenuVisible = false
    },

    // 修改层级
    handleEditTier () {
      if (!this._requireTierManage()) return
      if (this.currentRightClickNode) {
        console.log('修改层级，数据:', this.currentRightClickNode.data)
        this.tierDialog = {
          visible: true,
          type: 'edit',
          data: this.currentRightClickNode.data
        }
      } else {
        this.$message.warning('请先选择要修改的层级')
      }
      this.contextMenuVisible = false
    },

    // 删除层级
    async handleDeleteTier () {
      if (!this._requireTierManage()) return
      if (!this.currentRightClickNode) {
        this.$message.warning('请先选择要删除的层级')
        return
      }

      try {
        await this.$confirm('确认删除该层级吗？删除后不可恢复！', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        this.leftLoading = true

        console.log('删除层级ID:', this.currentRightClickNode.data.id)

        const response = await tierDeleteTenantTier({
          id: this.currentRightClickNode.data.id
        })

        console.log('删除接口响应:', response)

        if (response.code === 200) {
          this.$message.success(response.msg || '删除成功')
          await this.loadTierData()
        } else {
          this.$message.error(response.msg || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除层级失败:', error)
          this.$message.error('删除层级失败')
        }
      } finally {
        this.leftLoading = false
        this.hideContextMenu()
      }
    },

    // 层级操作成功
    handleTierSuccess () {
      this.loadTierData()
    }
  }
}
</script>

<style lang="scss" scoped>
// 基础变量
$primary-color: #1890ff;
$text-color: #262626;
$text-color-secondary: #595959;
$text-color-disabled: #bfbfbf;
$border-color: #d9d9d9;
$border-color-light: #f0f0f0;
$bg-color: #fafafa;
$success-color: #52c41a;
$warning-color: #faad14;

.tier-management-container {
  padding: 16px;
  background: #fff;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid $border-color-light;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: $text-color;
    margin: 0;
    line-height: 28px;
  }

  .page-tips {
    display: flex;
    align-items: center;
    gap: 8px;

    .help-icon {
      font-size: 16px;
      color: $primary-color;
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: lighten($primary-color, 15%);
      }
    }

    .tip-text {
      font-size: 13px;
      color: $text-color-secondary;
      line-height: 1.4;
    }
  }
}

// Tooltip 样式
:deep(.el-tooltip__popper) {
  .tooltip-content {
    .tip-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .tip-item {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.6;
      margin-bottom: 4px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.main-content {
  display: flex;
  gap: 16px;
  height: calc(100vh - 120px);
}

.left-panel,
.right-panel {
  flex: 1;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.operation-panel {
  width: 200px;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 6px;
  display: flex;
  flex-direction: column;

  .operation-content {
    padding: 16px 12px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .operation-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-color;
    margin-bottom: 16px;
    text-align: center;
  }

  .operation-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    margin-bottom: 16px;
  }

  .operation-btn {
    width: 100%;
    height: 40px;
    border: 1px solid $border-color;
    border-radius: 6px;
    background: #fff;
    color: $text-color;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.3s;

    &:hover:not(:disabled) {
      border-color: $primary-color;
      color: $primary-color;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    i {
      font-size: 16px;
    }

    &.bind-btn:hover:not(:disabled) {
      border-color: $success-color;
      color: $success-color;
    }

    &.unbind-btn:hover:not(:disabled) {
      border-color: $warning-color;
      color: $warning-color;
    }

    &.confirm-btn {
      background: $primary-color;
      border-color: $primary-color;
      color: #fff;

      &:hover:not(:disabled) {
        background: lighten($primary-color, 10%);
        border-color: lighten($primary-color, 10%);
        color: #fff;
      }
    }

    &.cancel-btn:hover:not(:disabled) {
      border-color: $text-color-disabled;
      color: $text-color-disabled;
    }
  }

  .operation-hint {
    .hint-content {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12px;
      color: $text-color-secondary;
      line-height: 1.4;
      text-align: left;

      i {
        color: $primary-color;
        margin-top: 1px;
        flex-shrink: 0;
      }
    }
  }
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid $border-color-light;
  background: $bg-color;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .panel-title {
    font-size: 16px;
    font-weight: 600;
    color: $text-color;
  }

  .panel-tools {
    display: flex;
    gap: 8px;
    align-items: center;

    .search-input {
      width: 180px;
    }
  }
}

.panel-body {
  flex: 1;
  padding: 12px 16px;
  overflow: hidden;
}

.tree-wrapper {
  height: 100%;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: $bg-color;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: $border-color;
    border-radius: 3px;

    &:hover {
      background: darken($border-color, 15%);
    }
  }
}

.hierarchy-tree,
.tenant-tree {
  font-size: 14px;

  :deep(.el-tree-node) {
    position: relative;

    .el-tree-node__content {
      height: 36px;
      line-height: 36px;
      border-radius: 4px;
      transition: background-color 0.3s;

      &:hover {
        background-color: $bg-color;
      }
    }

    .el-tree-node__expand-icon {
      color: $text-color-secondary;
      font-size: 14px;

      &.expanded {
        color: $primary-color;
      }
    }

    .el-checkbox {
      margin-right: 8px;

      .el-checkbox__inner {
        border-radius: 3px;
      }
    }
  }

  // 层级线条
  :deep(.el-tree-node__children) {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 9px;
      top: -18px;
      bottom: 18px;
      width: 1px;
      background: $border-color-light;
    }

    .el-tree-node {
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 9px;
        top: 18px;
        width: 16px;
        height: 1px;
        background: $border-color-light;
      }

      &:last-child::after {
        content: '';
        position: absolute;
        left: 9px;
        top: 18px;
        bottom: -18px;
        width: 1px;
        background: #fff;
      }
    }
  }

  // 隐藏没有子节点的展开图标
  :deep(.el-tree-node) {
    .el-tree-node__expand-icon {
      &.is-leaf {
        display: none;
      }
    }
  }
}

.tree-node-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;

  .node-info {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;

    i {
      color: $primary-color;
      font-size: 16px;
    }

    .node-name {
      color: $text-color;
      font-weight: 500;
    }
  }

  .node-level {
    font-size: 11px;
    color: $text-color-disabled;
    background: $bg-color;
    padding: 2px 4px;
    border-radius: 2px;
    line-height: 1;
    min-width: 24px;
    text-align: center;
  }
}

// 右键菜单样式
.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  min-width: 120px;

  .menu-item {
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: $text-color;
    transition: background-color 0.3s;

    &:hover {
      background-color: $bg-color;
    }

    &:first-child {
      border-radius: 4px 4px 0 0;
    }

    &:last-child {
      border-radius: 0 0 4px 4px;
    }

    &.danger {
      color: #f56c6c;

      &:hover {
        background-color: #fef0f0;
      }
    }

    i {
      font-size: 14px;
    }
  }
}

// 响应式
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
    height: auto;
  }

  .operation-panel {
    width: 100%;

    .operation-content {
      padding: 16px;
    }

    .operation-buttons {
      flex-direction: row;
      justify-content: center;
    }
  }

  .left-panel,
  .right-panel {
    min-height: 400px;
  }
}
</style>
