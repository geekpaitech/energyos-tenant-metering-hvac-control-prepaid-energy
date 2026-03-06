<template>
  <div class="sub-metering-detail">
    <el-row :gutter="16">
      <!-- 左侧：分项树 -->
      <el-col :span="10">
        <div class="panel">
          <div class="panel-header">
            <h3 class="panel-title">分项设置</h3>
          </div>
          
          <!-- 工具栏 -->
          <div class="panel-toolbar">
            <el-input
              v-model="filterText"
              placeholder="输入关键字过滤"
              prefix-icon="el-icon-search"
              clearable
              size="small"
              style="width: 180px"
            />
            <div class="toolbar-right">
              <el-button type="primary" size="small" icon="el-icon-plus" @click="openAddDialog(null)">新增分项</el-button>
              <el-button 
                v-if="!isSortMode" 
                type="warning" 
                size="small" 
                icon="el-icon-sort" 
                @click="enterSortMode"
              >排序</el-button>
              <el-button 
                v-else 
                type="success" 
                size="small" 
                icon="el-icon-check" 
                @click="saveSortOrder"
                :loading="sortLoading"
              >保存排序</el-button>
              <el-button 
                v-if="isSortMode" 
                size="small" 
                @click="cancelSortMode"
              >取消</el-button>
            </div>
          </div>
          
          <!-- 分项树 -->
          <div class="tree-container" v-loading="treeLoading">
            <el-tree
              ref="treeRef"
              :data="treeData"
              :props="treeProps"
              node-key="id"
              highlight-current
              :expand-on-click-node="false"
              default-expand-all
              :filter-node-method="filterNode"
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <div class="tree-node">
                  <div class="node-content">
                    <i :class="getNodeIcon(data)" class="node-icon"></i>
                    <span class="node-label">{{ data.name }}</span>
                    <span class="node-count">
                      <el-tag size="mini" type="info">总{{ data.mainMeterCount || 0 }}</el-tag>
                      <el-tag size="mini" type="info">子{{ data.subMeterCount || 0 }}</el-tag>
                    </span>
                  </div>
                  
                  <!-- 普通模式：操作按钮 -->
                  <div class="node-actions" v-if="!isSortMode">
                    <el-button type="text" size="mini" icon="el-icon-plus" @click.stop="openAddDialog(data)" title="添加子项"></el-button>
                    <el-button type="text" size="mini" icon="el-icon-edit" @click.stop="openEditDialog(data)" title="修改"></el-button>
                    <el-button type="text" size="mini" icon="el-icon-delete" class="danger-btn" @click.stop="handleDelete(data)" title="删除"></el-button>
                  </div>
                  
                  <!-- 排序模式：上下移动按钮 -->
                  <div class="node-sort-actions" v-else>
                    <el-button 
                      type="text" 
                      size="mini"
                      :disabled="!canMoveUp(node)"
                      @click.stop="handleMoveUp(node)"
                      title="上移"
                    >
                      <i class="el-icon-top"></i>
                    </el-button>
                    <el-button 
                      type="text" 
                      size="mini"
                      :disabled="!canMoveDown(node)"
                      @click.stop="handleMoveDown(node)"
                      title="下移"
                    >
                      <i class="el-icon-bottom"></i>
                    </el-button>
                  </div>
                </div>
              </template>
            </el-tree>
            
            <el-empty v-if="!treeData.length && !treeLoading" description="暂无分项数据" :image-size="80" />
          </div>
        </div>
      </el-col>
      
      <!-- 右侧：已绑电表 -->
      <el-col :span="14">
        <div class="panel">
          <div class="panel-header">
            <div class="header-title">
              <i class="el-icon-connection header-icon"></i>
              <span>已绑电表</span>
              <span v-if="currentNode.name" class="current-name">（{{ currentNode.name }}）</span>
            </div>
          </div>
          
          <!-- 工具栏 -->
          <div class="panel-toolbar">
            <el-input
              v-model="meterFilterText"
              placeholder="输入关键字过滤"
              prefix-icon="el-icon-search"
              clearable
              size="small"
              style="width: 180px"
            />
            <div class="toolbar-right">
              <el-button type="success" size="small" icon="el-icon-plus" @click="openBindDialog('MAIN')">绑定总表</el-button>
              <el-button type="primary" size="small" icon="el-icon-plus" @click="openBindDialog('SUB')">绑定子表</el-button>
              <el-button type="danger" size="small" icon="el-icon-delete" :disabled="!selectedMeters.length" @click="handleUnbind">解绑</el-button>
            </div>
          </div>
          
          <!-- 已绑电表列表 -->
          <div class="table-container">
            <el-table
              v-if="filteredMeterList.length"
              ref="meterTableRef"
              :data="filteredMeterList"
              border
              size="small"
              height="calc(100vh - 300px)"
              @selection-change="handleMeterSelectionChange"
            >
              <el-table-column type="selection" width="45" :selectable="row => !!row.subId" />
              <el-table-column prop="serial" label="序列号" min-width="140" show-overflow-tooltip />
              <el-table-column prop="meterName" label="设备名称" min-width="100" show-overflow-tooltip />
              <el-table-column prop="subType" label="级别" width="70" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.subType === 'MAIN' ? 'warning' : ''" size="mini">
                    {{ row.subType === 'MAIN' ? '总表' : '子表' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="onlineStatus" label="状态" width="70" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.onlineStatus === 1 ? 'success' : 'info'" size="mini">
                    {{ row.onlineStatus === 1 ? '在线' : '离线' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无绑定电表" :image-size="80" />
          </div>
        </div>
      </el-col>
    </el-row>
    
    <!-- 新增/编辑分项弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="subDialog.visible"
      width="500px"
      :close-on-click-modal="false"
      append-to-body
      @closed="resetSubForm"
    >
      <el-form ref="subFormRef" :model="subForm" :rules="subRules" label-width="100px">
        <el-form-item label="上级分项" v-if="subDialog.showParent">
          <el-cascader
            v-model="subForm.parentIdArr"
            :options="parentTreeData"
            :props="{ checkStrictly: true, expandTrigger: 'hover', value: 'id', label: 'name', children: 'subTreeList' }"
            clearable
            filterable
            placeholder="不选则为顶级分项"
            style="width: 100%"
            @change="handleParentChange"
          />
        </el-form-item>
        <el-form-item :label="subDialog.isAdd && subDialog.parentData ? '子项名称' : '分项名称'" prop="name">
          <el-input v-model="subForm.name" placeholder="请输入名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="subForm.remark" type="textarea" :rows="3" placeholder="请输入备注" maxlength="200" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="subDialog.visible = false">取 消</el-button>
          <el-button type="primary" :loading="subDialog.loading" @click="handleSubSubmit">确 认</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 绑定电表弹窗 -->
    <el-dialog
      :title="bindDialog.subType === 'MAIN' ? '绑定总表' : '绑定子表'"
      :visible.sync="bindDialog.visible"
      width="700px"
      :close-on-click-modal="false"
      append-to-body
      @open="fetchUnbindMeterList"
      @closed="resetBindDialog"
    >
      <div class="bind-toolbar">
        <el-input
          v-model="unbindMeterQuery.queryWord"
          placeholder="输入关键字搜索"
          prefix-icon="el-icon-search"
          clearable
          size="small"
          style="width: 220px"
          @keyup.enter.native="fetchUnbindMeterList"
        />
        <el-button type="primary" size="small" icon="el-icon-search" @click="fetchUnbindMeterList">搜索</el-button>
      </div>
      
      <div class="bind-table" v-loading="bindDialog.loading">
        <el-table
          v-if="unbindMeterList.length"
          ref="unbindMeterTableRef"
          :data="unbindMeterList"
          border
          size="small"
          height="360px"
          @selection-change="handleUnbindMeterSelection"
        >
          <el-table-column type="selection" width="45" :selectable="row => !row.subId" />
          <el-table-column prop="serial" label="序列号" min-width="140" show-overflow-tooltip />
          <el-table-column prop="meterName" label="设备名称" min-width="100" show-overflow-tooltip />
          <el-table-column prop="onlineStatus" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.onlineStatus === 1 ? 'success' : 'info'" size="mini">
                {{ row.onlineStatus === 1 ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无可绑定电表" :image-size="60" />
      </div>
      
      <el-pagination
        v-if="unbindMeterQuery.total > 0"
        :current-page.sync="unbindMeterQuery.current"
        :page-size.sync="unbindMeterQuery.pageSize"
        :total="unbindMeterQuery.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 12px; text-align: right"
        @size-change="fetchUnbindMeterList"
        @current-change="fetchUnbindMeterList"
      />
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="bindDialog.visible = false">取 消</el-button>
          <el-button type="primary" :loading="bindDialog.submitLoading" @click="handleBindSubmit">确认绑定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getSubTree, addSub, updateSub, deleteSub, pageSubMeter, bindSubMeter, reSortSub } from '@/api/subMetering'

export default {
  name: 'SubMeteringDetail',
  
  data() {
    return {
      managerId: '',
      filterText: '',
      treeData: [],
      originalTreeData: [],
      treeLoading: false,
      treeProps: { label: 'name', children: 'subTreeList' },
      currentNode: {},
      
      // 排序模式
      isSortMode: false,
      sortLoading: false,
      sortedNodes: new Map(), // 记录排序变化的节点
      
      // 已绑电表
      meterFilterText: '',
      boundMeterList: [],
      selectedMeters: [],
      
      // 新增/编辑弹窗
      subDialog: { visible: false, isAdd: true, parentData: null, showParent: false, loading: false },
      subForm: { id: '', parentId: -1, parentIdArr: [], name: '', remark: '' },
      subRules: { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] },
      parentTreeData: [],
      
      
      // 绑定电表弹窗
      bindDialog: { visible: false, subType: '', loading: false, submitLoading: false },
      unbindMeterQuery: { queryWord: '', current: 1, pageSize: 20, total: 0 },
      unbindMeterList: [],
      selectedUnbindMeters: []
    }
  },
  
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    
    dialogTitle() {
      if (!this.subDialog.isAdd) return '编辑分项'
      return this.subDialog.parentData ? '新增子项' : '新增分项'
    },
    
    filteredMeterList() {
      if (!this.meterFilterText) return this.boundMeterList
      const kw = this.meterFilterText.toLowerCase()
      return this.boundMeterList.filter(m => 
        m.serial?.toLowerCase().includes(kw) || 
        m.meterName?.toLowerCase().includes(kw)
      )
    }
  },
  
  watch: {
    filterText(val) {
      this.$refs.treeRef?.filter(val)
    }
  },
  
  created() {
    this.managerId = this.$route.params.id || this.currentManagerId
    this.fetchTreeData()
  },
  
  methods: {
    // ========== 树相关 ==========
    async fetchTreeData() {
      this.treeLoading = true
      try {
        const { data } = await getSubTree({ managerId: this.managerId })
        this.treeData = data || []
        this.originalTreeData = JSON.parse(JSON.stringify(this.treeData))
        
        // 默认选中第一个
        if (this.treeData.length && !this.currentNode.id) {
          this.$nextTick(() => {
            this.currentNode = this.treeData[0]
            this.$refs.treeRef?.setCurrentKey(this.treeData[0].id)
            this.updateBoundMeterList()
          })
        } else if (this.currentNode.id) {
          // 刷新后保持选中
          const node = this.findNodeById(this.treeData, this.currentNode.id)
          if (node) {
            this.currentNode = node
            this.updateBoundMeterList()
          }
        }
      } catch (e) {
        this.$message.error('获取分项数据失败')
      } finally {
        this.treeLoading = false
      }
    },
    
    findNodeById(nodes, id) {
      for (const node of nodes) {
        if (node.id === id) return node
        if (node.subTreeList?.length) {
          const found = this.findNodeById(node.subTreeList, id)
          if (found) return found
        }
      }
      return null
    },
    
    filterNode(value, data) {
      if (!value) return true
      return data.name?.toLowerCase().includes(value.toLowerCase())
    },
    
    getNodeIcon(data) {
      if (data.subTreeList?.length) return 'el-icon-folder-opened'
      if (data.mainMeterCount || data.subMeterCount) return 'el-icon-folder'
      return 'el-icon-document'
    },
    
    handleNodeClick(data) {
      if (this.isSortMode) return // 排序模式下不切换选中
      this.currentNode = data
      this.$refs.treeRef?.setCurrentKey(data.id)
      this.updateBoundMeterList()
    },
    
    updateBoundMeterList() {
      const { mainMeterList = [], subMeterList = [] } = this.currentNode
      this.boundMeterList = [...mainMeterList, ...subMeterList]
      this.meterFilterText = ''
    },
    
    // ========== 排序相关 ==========
    enterSortMode() {
      this.isSortMode = true
      this.sortedNodes.clear()
      this.$message.info('已进入排序模式，使用上下按钮调整顺序')
    },
    
    cancelSortMode() {
      this.isSortMode = false
      this.sortedNodes.clear()
      // 恢复原始数据
      this.treeData = JSON.parse(JSON.stringify(this.originalTreeData))
    },
    
    canMoveUp(node) {
      const parent = node.parent
      const children = parent.data.subTreeList || parent.data
      const index = Array.isArray(children) ? children.findIndex(n => n.id === node.data.id) : -1
      return index > 0
    },
    
    canMoveDown(node) {
      const parent = node.parent
      const children = parent.data.subTreeList || parent.data
      const index = Array.isArray(children) ? children.findIndex(n => n.id === node.data.id) : -1
      return index >= 0 && index < children.length - 1
    },
    
    handleMoveUp(node) {
      this.moveNode(node, -1)
    },
    
    handleMoveDown(node) {
      this.moveNode(node, 1)
    },
    
    moveNode(node, direction) {
      const parent = node.parent
      const children = parent.data.subTreeList || parent.data
      if (!Array.isArray(children)) return
      
      const index = children.findIndex(n => n.id === node.data.id)
      const targetIndex = index + direction
      
      if (targetIndex < 0 || targetIndex >= children.length) return
      
      // 交换位置
      const temp = children[index]
      children[index] = children[targetIndex]
      children[targetIndex] = temp
      
      // 记录这组兄弟节点需要保存
      const parentId = parent.data.id || 'root'
      this.sortedNodes.set(parentId, children.map(n => n.id))
      
      // 强制刷新树
      this.treeData = [...this.treeData]
    },
    
    async saveSortOrder() {
      if (this.sortedNodes.size === 0) {
        this.$message.warning('没有排序变化')
        this.isSortMode = false
        return
      }
      
      this.sortLoading = true
      try {
        // 依次保存每组变化的排序
        for (const [, idList] of this.sortedNodes) {
          await reSortSub(idList)
        }
        this.$message.success('排序保存成功')
        this.isSortMode = false
        this.sortedNodes.clear()
        this.originalTreeData = JSON.parse(JSON.stringify(this.treeData))
      } catch (e) {
        this.$message.error('排序保存失败')
      } finally {
        this.sortLoading = false
      }
    },
    
    // ========== 新增/编辑分项 ==========
    openAddDialog(parentData) {
      this.subDialog.isAdd = true
      this.subDialog.parentData = parentData
      this.subDialog.showParent = !!parentData
      this.parentTreeData = JSON.parse(JSON.stringify(this.treeData))
      
      // 构建父级路径用于回显
      const parentPath = parentData ? this.getParentPath(parentData.id) : []
      this.subForm = {
        id: '',
        parentId: parentData?.id || -1,
        parentIdArr: parentPath,
        name: '',
        remark: ''
      }
      this.subDialog.visible = true
    },
    
    openEditDialog(data) {
      this.subDialog.isAdd = false
      this.subDialog.parentData = null
      this.subDialog.showParent = data.parentId && data.parentId !== -1
      this.parentTreeData = JSON.parse(JSON.stringify(this.treeData))
      
      // 构建父级路径用于回显
      const parentPath = (data.parentId && data.parentId !== -1) ? this.getParentPath(data.parentId) : []
      this.subForm = {
        id: data.id,
        parentId: data.parentId || -1,
        parentIdArr: parentPath,
        name: data.name,
        remark: data.remark || ''
      }
      this.subDialog.visible = true
    },
    
    // 获取节点的完整父级路径（用于 cascader 回显）
    getParentPath(targetId) {
      const path = []
      const findPath = (nodes, id, currentPath) => {
        for (const node of nodes) {
          const newPath = [...currentPath, node.id]
          if (node.id === id) {
            path.push(...newPath)
            return true
          }
          if (node.subTreeList?.length) {
            if (findPath(node.subTreeList, id, newPath)) return true
          }
        }
        return false
      }
      findPath(this.treeData, targetId, [])
      return path
    },
    
    // 上级分项选择变化
    handleParentChange(val) {
      this.subForm.parentId = val?.length ? val[val.length - 1] : -1
    },
    
    resetSubForm() {
      this.$refs.subFormRef?.resetFields()
      this.subForm = { id: '', parentId: -1, parentIdArr: [], name: '', remark: '' }
    },
    
    async handleSubSubmit() {
      try {
        await this.$refs.subFormRef.validate()
      } catch (e) {
        return
      }
      
      this.subDialog.loading = true
      try {
        const payload = {
          managerId: this.managerId,
          parentId: this.subForm.parentId,
          name: this.subForm.name,
          remark: this.subForm.remark
        }
        
        if (this.subDialog.isAdd) {
          await addSub(payload)
          this.$message.success('新增成功')
        } else {
          payload.id = this.subForm.id
          await updateSub(payload)
          this.$message.success('修改成功')
        }
        
        this.subDialog.visible = false
        this.fetchTreeData()
      } catch (e) {
        this.$message.error(this.subDialog.isAdd ? '新增失败' : '修改失败')
      } finally {
        this.subDialog.loading = false
      }
    },
    
    handleDelete(data) {
      const hasChildren = data.subTreeList?.length > 0
      const hasMeter = (data.mainMeterCount || 0) + (data.subMeterCount || 0) > 0
      
      let msg = '确定删除该分项吗？'
      if (hasChildren) msg = '该分项包含子项，确定删除吗？'
      if (hasMeter) msg = '该分项已绑定电表，确定删除吗？'
      
      this.$confirm(msg, '提示', { type: 'warning' }).then(async () => {
        try {
          await deleteSub({ id: data.id })
          this.$message.success('删除成功')
          
          if (this.currentNode.id === data.id) {
            this.currentNode = {}
            this.boundMeterList = []
          }
          this.fetchTreeData()
        } catch (e) {
          this.$message.error('删除失败')
        }
      }).catch(() => {})
    },
    
    // ========== 绑定电表 ==========
    openBindDialog(subType) {
      if (!this.currentNode.id) {
        this.$message.warning('请先选择分项')
        return
      }
      this.bindDialog.subType = subType
      this.bindDialog.visible = true
    },
    
    async fetchUnbindMeterList() {
      this.bindDialog.loading = true
      try {
        const { data } = await pageSubMeter({
          page: {
            current: this.unbindMeterQuery.current,
            size: this.unbindMeterQuery.pageSize,
            orders: [{ asc: true, column: 'subId' }]
          },
          managerId: this.managerId,
          queryWord: this.unbindMeterQuery.queryWord
        })
        this.unbindMeterList = data?.dataList || []
        this.unbindMeterQuery.total = data?.total || 0
      } catch (e) {
        this.$message.error('获取电表列表失败')
      } finally {
        this.bindDialog.loading = false
      }
    },
    
    handleUnbindMeterSelection(selection) {
      this.selectedUnbindMeters = selection
    },
    
    resetBindDialog() {
      this.unbindMeterQuery = { queryWord: '', current: 1, pageSize: 20, total: 0 }
      this.unbindMeterList = []
      this.selectedUnbindMeters = []
    },
    
    async handleBindSubmit() {
      if (!this.selectedUnbindMeters.length) {
        this.$message.warning('请选择要绑定的电表')
        return
      }
      
      this.bindDialog.submitLoading = true
      try {
        await bindSubMeter({
          managerId: this.managerId,
          opType: 'bind',
          subId: this.currentNode.id,
          subType: this.bindDialog.subType,
          meterIdList: this.selectedUnbindMeters.map(m => m.meterId)
        })
        this.$message.success('绑定成功')
        this.bindDialog.visible = false
        this.fetchTreeData()
      } catch (e) {
        this.$message.error('绑定失败')
      } finally {
        this.bindDialog.submitLoading = false
      }
    },
    
    // ========== 解绑电表 ==========
    handleMeterSelectionChange(selection) {
      this.selectedMeters = selection
    },
    
    handleUnbind() {
      if (!this.selectedMeters.length) {
        this.$message.warning('请选择要解绑的电表')
        return
      }
      
      this.$confirm(`确定解绑选中的 ${this.selectedMeters.length} 个电表吗？`, '提示', { type: 'warning' })
        .then(async () => {
          try {
            await bindSubMeter({
              managerId: this.managerId,
              opType: 'unbind',
              subId: this.currentNode.id,
              meterIdList: this.selectedMeters.map(m => m.meterId)
            })
            this.$message.success('解绑成功')
            this.fetchTreeData()
          } catch (e) {
            this.$message.error('解绑失败')
          }
        })
        .catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.sub-metering-detail {
  padding: 16px;
  background: #f5f6f8;
  min-height: calc(100vh - 120px);
}

.panel {
  background: #fff;
  border-radius: 4px;
  height: calc(100vh - 152px);
  display: flex;
  flex-direction: column;
  
  .panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
    
    .panel-title {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #1c1c1c;
    }
    
    .header-title {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 500;
      color: #1c1c1c;
      
      .header-icon {
        font-size: 20px;
        color: #409EFF;
        margin-right: 8px;
      }
      
      .current-name {
        color: #409EFF;
        font-weight: normal;
        margin-left: 4px;
      }
    }
  }
  
  .panel-toolbar {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
    
    .toolbar-right {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }
  }
  
  .tree-container {
    flex: 1;
    overflow: auto;
    padding: 12px 16px;
  }
  
  .table-container {
    flex: 1;
    overflow: hidden;
    padding: 0 16px 16px;
  }
}

// 树节点样式
.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
  
  .node-content {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
    
    .node-icon {
      font-size: 16px;
      color: #409EFF;
      margin-right: 6px;
      flex-shrink: 0;
    }
    
    .node-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 8px;
    }
    
    .node-count {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
      
      .el-tag {
        padding: 0 4px;
        height: 18px;
        line-height: 16px;
      }
    }
  }
  
  .node-actions {
    display: none;
    flex-shrink: 0;
    
    .el-button {
      padding: 4px;
      font-size: 14px;
    }
    
    .danger-btn {
      color: #f56c6c;
      &:hover { color: #f89898; }
    }
  }
  
  .node-sort-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    
    .el-button {
      padding: 4px 8px;
      font-size: 16px;
      
      &.is-disabled {
        color: #c0c4cc;
      }
      
      &:not(.is-disabled) {
        color: #409EFF;
        &:hover { color: #66b1ff; }
      }
    }
  }
  
  &:hover .node-actions {
    display: flex;
  }
  
  
}

// 绑定弹窗样式
.bind-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.bind-table {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

// 弹窗底部按钮居右
.dialog-footer {
  text-align: right;
}

// Element UI 覆盖
::v-deep {
  .el-tree {
    background: transparent;
    
    .el-tree-node__content {
      height: 36px;
      
      &:hover {
        background-color: #f5f7fa;
      }
    }
    
    .el-tree-node.is-current > .el-tree-node__content {
      background-color: #ecf5ff;
    }
  }
  
  .el-dialog__footer {
    padding: 15px 20px;
    border-top: 1px solid #f0f0f0;
  }
}
</style>