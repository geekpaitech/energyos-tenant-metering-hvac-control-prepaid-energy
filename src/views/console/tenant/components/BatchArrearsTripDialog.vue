<template>
  <el-drawer
    class="drawer"
    :visible.sync="drawerVisible"
    size="1200px"
    title="批量设置欠费跳闸/关阀"
    @close="handleClose"
    @open="handleOpen"
  >
    <div class="drawer_content">
      <div class="form">
        <el-form label-width="auto">
          <div class="search-row">
            <el-form-item label="租户层级" class="search-item search-item-tier">
              <el-cascader
                v-model="queryData.tierIds"
                :key="tierListKey"
                collapse-tags
                class="class-select"
                clearable
                :options="tierList"
                :props="{
                  label: 'name',
                  value: 'id',
                  children: 'tenantTierDtoList',
                  checkStrictly: true
                }"
                @change="handleChangeTier"
              />
            </el-form-item>
            <el-form-item label="租户/编号" class="search-item search-item-tenant">
              <el-select
                v-model="queryData.idList"
                class="class-select"
                clearable
                collapse-tags
                filterable
                :multiple="true"
                placeholder="租户名称或编号"
              >
                <el-option
                  v-for="item in tenantOptions"
                  :key="item.id"
                  :label="item.unite"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="付费模式" class="search-item search-item-pay">
              <el-select
                v-model="queryData.logicPayType"
                class="class-select"
                clearable
                placeholder="请选择"
              >
                <el-option
                  v-for="item in meterPayTypeList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <div class="search-actions">
              <el-button type="primary" size="small" @click="onSearch">查询</el-button>
              <el-button type="warning" size="small" @click="openEditDialog">更改付费模式</el-button>
            </div>
          </div>
        </el-form>
      </div>
      <div
        v-if="tableData.length > 0"
        v-loading="loading"
        class="class-newTable"
        style="margin-top: 20px"
      >
        <el-table
          ref="table"
          :data="tableData"
          row-key="deviceId"
          height="65vh"
          @select="handleSelect"
          @select-all="handleSelectAll"
        >
          <el-table-column type="selection" width="55" :reserve-selection="true" />
          <el-table-column label="绑定编号">
            <template slot-scope="scope">
              {{ scope.row.id || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="绑定名称">
            <template slot-scope="scope">
              {{ scope.row.name || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="设备编号">
            <template slot-scope="scope">
              {{ scope.row.deviceId }}
            </template>
          </el-table-column>
          <el-table-column label="设备名称">
            <template slot-scope="scope">
              {{ scope.row.deviceName }}
            </template>
          </el-table-column>
          <el-table-column label="付费模式">
            <template slot-scope="scope">
              <span
                v-if="scope.row.logicPayType !== undefined && scope.row.logicPayType !== null"
                :style="getPayTypeStyle(scope.row.logicPayType)"
              >
                {{ getPayTypeLabel(scope.row.logicPayType) }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="queryData.total > 0" style="margin-top: 12px; text-align: right;">
          <el-pagination
            :current-page.sync="queryData.current"
            :page-sizes="[100, 200, 300, 500]"
            :page-size.sync="queryData.pageSize"
            :total="queryData.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
      <el-empty
        v-else-if="!loading"
        description="暂无数据"
        style="margin-top: 60px"
      />
    </div>

    <!-- 更改付费模式弹窗 -->
    <el-dialog
      title="批量更改付费模式"
      :close-on-click-modal="false"
      :visible.sync="editDialog.show"
      width="520px"
      :append-to-body="true"
      @close="handleEditClose"
    >
      <div class="dialog-content">
        <div class="selected-info" v-if="editDialog.selectedDevices.length">
          <p class="selected-label">当前选择（{{ editDialog.selectedDevices.length }} 个设备）：</p>
          <div class="selected-list">
            <el-tag
              v-for="(item, idx) in editDialog.selectedDevices"
              :key="idx"
              size="small"
              type="info"
            >
              {{ item.deviceName || item.name }}
            </el-tag>
          </div>
        </div>
        <el-form style="margin-top: 16px;">
          <el-form-item label="目标付费模式">
            <el-select
              v-model="editDialog.logicPayType"
              placeholder="请选择"
              class="class-select"
              clearable
            >
              <el-option
                v-for="item in meterPayTypeList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="handleEditClose">取 消</el-button>
          <el-button type="primary" @click="onSubmit">确 认</el-button>
        </div>
      </div>
    </el-dialog>
  </el-drawer>
</template>

<script>
import { mapGetters } from 'vuex'
import { meterTenantMeter, meterBatchSetPayType } from '@/api/meter'
import { tierSelectTenantTierList, tierGetTenantIdListByTierId } from '@/api/tier'
import { getSimpleTenantList } from '@/api/useReport'

export default {
  name: 'BatchArrearsTripDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      drawerVisible: false,
      tableData: [],
      loading: false,

      queryData: {
        tierIds: [],
        tierId: '',
        idList: [],
        logicPayType: null,
        pageSize: 100,
        total: 0,
        current: 1
      },

      // 层级
      tierList: [],
      tierListKey: 0,
      // 租户下拉选项
      tenantOptions: [],
      tenantIdList: [],

      // 跨页勾选追踪（deviceId → { deviceName, name }）
      selectedDeviceIds: new Map(),

      // 更改弹窗
      editDialog: {
        show: false,
        logicPayType: '',
        selectedDevices: []
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    meterPayTypeList () {
      const enumState = this.$store.state.enumData
      return (enumState && enumState.MeterPayType) || [
        { value: 0, label: '预付费（欠费跳闸）' },
        { value: 1, label: '强控（欠费不跳闸）' }
      ]
    }
  },
  watch: {
    visible (val) {
      this.drawerVisible = val
    },
    drawerVisible (val) {
      this.$emit('update:visible', val)
    }
  },
  methods: {
    getPayTypeLabel (val) {
      const item = this.meterPayTypeList.find(v => v.value === val || v.label === val)
      return item ? item.label : (val != null ? String(val) : '-')
    },
    getPayTypeStyle (val) {
      const isPrepaid = val === 0 || (typeof val === 'string' && val.includes('预付费'))
      return isPrepaid
        ? { color: '#67c23a', background: '#f0f9eb', border: '1px solid #c2e7b0', padding: '2px 10px', borderRadius: '4px', fontSize: '12px' }
        : { color: '#f56c6c', background: '#fef0f0', border: '1px solid #fbc4c4', padding: '2px 10px', borderRadius: '4px', fontSize: '12px' }
    },
    handleOpen () {
      this.loadTenantOptions()
      this.getTierData()
      this.onSearch()
    },
    handleClose () {
      this.$emit('update:visible', false)
      this.resetQuery()
    },
    resetQuery () {
      this.queryData = {
        tierIds: [],
        tierId: '',
        idList: [],
        logicPayType: null,
        pageSize: 100,
        total: 0,
        current: 1
      }
      this.tenantIdList = []
      this.selectedDeviceIds = new Map()
      this.tableData = []
      this.tierListKey++
    },
    handleEditClose () {
      this.editDialog.show = false
      this.editDialog.logicPayType = ''
    },
    // 获取租户下拉数据
    async loadTenantOptions () {
      try {
        const response = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0
        })
        if (response.code === 200 && response.data) {
          this.tenantOptions = (response.data || []).map(t => ({
            id: t.tenantId,
            unite: `(${t.tenantId})${t.name}`
          }))
        }
      } catch (e) {
        console.error('获取租户列表失败', e)
      }
    },
    // 层级数据
    async getTierData () {
      try {
        const { data } = await tierSelectTenantTierList({
          managerId: this.currentManagerId
        })
        this.queryData.tierIds = []
        this.queryData.tierId = ''
        this.tierList = this.sanitizeTierTree(data || [])
        this.tierListKey++
      } catch (e) {
        console.error('获取层级失败', e)
      }
    },
    // 递归清洗层级树：过滤租户节点，只保留纯层级结构；移除 null children 防止 cascader 报错
    sanitizeTierTree (nodes) {
      if (!Array.isArray(nodes)) return []
      return nodes
        .filter(node => node.tenantId == null)
        .map(node => {
          const item = { ...node }
          if (item.tenantTierDtoList && item.tenantTierDtoList.length) {
            const children = this.sanitizeTierTree(item.tenantTierDtoList)
            if (children.length) {
              item.tenantTierDtoList = children
            } else {
              delete item.tenantTierDtoList
            }
          } else {
            delete item.tenantTierDtoList
          }
          return item
        })
    },
    async handleChangeTier (val) {
      this.queryData.idList = []
      if (!val || !val.length) {
        this.tenantOptions = []
        await this.loadTenantOptions()
        this.queryData.tierId = ''
        this.tenantIdList = []
        return
      }
      this.queryData.tierId = val[val.length - 1]
      try {
        const { data } = await tierGetTenantIdListByTierId({
          id: this.queryData.tierId
        })
        this.tenantIdList = []
        this.tenantOptions = (data || []).map(item => {
          this.tenantIdList.push(item.tenantId)
          return {
            id: item.tenantId,
            unite: `(${item.tenantId})${item.tenantName}`
          }
        })
      } catch (e) {
        console.error('获取层级租户失败', e)
      }
    },
    onSearch () {
      this.queryData.current = 1
      if (this.queryData.tierId && this.tenantIdList.length === 0) {
        this.$message.warning('层级下无绑定租户')
        return
      }
      this.fetchTableData()
    },
    async fetchTableData () {
      this.loading = true
      try {
        const idList = this.queryData.idList.length
          ? this.queryData.idList
          : this.tenantIdList

        const query = {
          managerId: this.currentManagerId,
          bindType: 1,
          idList,
          logicPayType: this.queryData.logicPayType !== null && this.queryData.logicPayType !== ''
            ? this.queryData.logicPayType
            : undefined,
          page: {
            current: this.queryData.current,
            size: this.queryData.pageSize
          }
        }
        const { data } = await meterTenantMeter(query)
        this.tableData = (data && data.records) || []
        this.queryData.total = (data && data.total) || 0

        // 跨页勾选：数据加载后恢复选中状态
        this.$nextTick(() => {
          this.restoreSelection()
        })
      } catch (e) {
        console.error('查询设备失败', e)
        this.$message.error('查询设备失败')
      } finally {
        this.loading = false
      }
    },
    // ============ 跨页勾选 ============
    handleSelect (selection, row) {
      const id = row.deviceId
      if (selection.includes(row)) {
        this.selectedDeviceIds.set(id, { deviceName: row.deviceName, name: row.name })
      } else {
        this.selectedDeviceIds.delete(id)
      }
    },
    handleSelectAll (selection) {
      if (selection.length > 0) {
        this.tableData.forEach(r => {
          this.selectedDeviceIds.set(r.deviceId, { deviceName: r.deviceName, name: r.name })
        })
      } else {
        this.tableData.forEach(r => {
          this.selectedDeviceIds.delete(r.deviceId)
        })
      }
    },
    restoreSelection () {
      if (!this.$refs.table) return
      this.tableData.forEach(row => {
        const isSelected = this.selectedDeviceIds.has(row.deviceId)
        this.$refs.table.toggleRowSelection(row, isSelected)
      })
    },
    getSelectedDeviceIds () {
      return Array.from(this.selectedDeviceIds.keys())
    },
    // ============ 更改付费模式 ============
    openEditDialog () {
      if (this.selectedDeviceIds.size === 0) {
        this.$message.warning('请选择需要更改的设备')
        return
      }
      this.editDialog.selectedDevices = Array.from(this.selectedDeviceIds.values())
      this.editDialog.show = true
    },
    async onSubmit () {
      if (this.editDialog.logicPayType === '' || this.editDialog.logicPayType === null || this.editDialog.logicPayType === undefined) {
        this.$message.warning('请选择付费模式')
        return
      }
      const selectedIds = this.getSelectedDeviceIds()
      if (selectedIds.length === 0) {
        this.$message.warning('请选择需要更改的设备')
        return
      }

      this.loading = true
      try {
        const { msg } = await meterBatchSetPayType({
          logicPayType: this.editDialog.logicPayType,
          managerId: this.currentManagerId,
          idList: selectedIds
        })
        this.$message.success(msg || '操作成功')
        this.handleEditClose()
        this.selectedDeviceIds = new Map()
        await this.fetchTableData()
      } catch (e) {
        console.error('批量更改付费模式失败', e)
        this.$message.error('操作失败')
      } finally {
        this.loading = false
      }
    },
    // ============ 分页 ============
    handleSizeChange (val) {
      this.queryData.pageSize = val
      this.queryData.current = 1
      this.fetchTableData()
    },
    handleCurrentChange (val) {
      this.queryData.current = val
      this.fetchTableData()
    }
  }
}
</script>

<style lang="scss" scoped>
.drawer {
  ::v-deep .el-drawer__body {
    padding: 20px;
    overflow-y: auto;
  }
}
.drawer_content {
  height: 100%;
}
.form {
  margin-top: 12px;
  ::v-deep .el-form-item {
    margin-bottom: 0;
  }
  ::v-deep .el-select,
  ::v-deep .el-cascader {
    width: 100%;
  }
}
.search-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}
.search-item {
  &.search-item-tier {
    flex: 0 0 220px;
  }
  &.search-item-tenant {
    flex: 1 1 280px;
    min-width: 200px;
  }
  &.search-item-pay {
    flex: 0 0 190px;
  }
}
.search-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
  margin-bottom: 6px;
}
.class-newTable {
  ::v-deep .el-table {
    th {
      background: #f5f7fa;
    }
  }
}
.btnrft {
  width: 100%;
}
.dialog-content {
  .dialog-footer {
    text-align: right;
    margin-top: 20px;
    .el-button + .el-button {
      margin-left: 10px;
    }
  }
}
.selected-info {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  .selected-label {
    margin: 0 0 8px;
    font-size: 13px;
    color: #606266;
    font-weight: 500;
  }
  .selected-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-height: 160px;
    overflow-y: auto;
  }
}
</style>
