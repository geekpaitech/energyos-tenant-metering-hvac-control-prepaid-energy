<template>
  <div class="admin-water-page">
    <el-card class="panel-card filter-card" shadow="never">
      <el-form class="filter-form" label-position="top" @submit.native.prevent>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="设备号">
              <el-input v-model="queryData.serial" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="水表编号">
              <el-input v-model="queryData.id" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="水表名称">
              <el-input v-model="queryData.waterName" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="项目名称/编号">
              <el-select
                v-model="queryData.managerId"
                filterable
                clearable
                placeholder="请选择"
                style="width:100%"
              >
                <el-option v-for="item in managerNames" :key="item.id" :label="item.unite" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="接入渠道">
              <el-select v-model="queryData.waterType" clearable placeholder="请选择" style="width:100%">
                <el-option v-for="item in waterChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="filter-actions">
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="onReset(1)">重置</el-button>
          <el-button type="text" icon="el-icon-s-operation" @click="onFilter">高级筛选</el-button>
        </div>
      </el-form>
    </el-card>

    <el-card class="panel-card table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">
          <span class="title-bar" />
          <span>水表列表</span>
        </div>
        <div class="table-actions">
          <el-button type="primary" icon="el-icon-plus" @click="onEditWater(false)">新增</el-button>
          <el-button icon="el-icon-upload2" @click="batchDialog.show = true">批量导入</el-button>
          <el-button :disabled="!selectedRows.length" @click="openBind">切换项目</el-button>
          <el-button icon="el-icon-download" @click="onExport">导出数据</el-button>
          <el-button icon="el-icon-refresh" circle @click="onReset" />
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        class="water-table"
        :header-cell-style="tableHeaderStyle"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column prop="serial" label="设备号" min-width="150" show-overflow-tooltip />
        <el-table-column prop="materialCode" label="物料编码" min-width="140" show-overflow-tooltip />
        <el-table-column prop="id" label="设备编号" width="110" />
        <el-table-column prop="waterName" label="设备名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="waterTypeLabel" label="接入渠道" min-width="140" show-overflow-tooltip />
        <el-table-column prop="managerData" label="项目信息" min-width="180" show-overflow-tooltip />
        <el-table-column label="绑定信息" min-width="100">
          <template slot-scope="{ row }">
            <el-popover
              v-if="row.waterBindDtoList && row.waterBindDtoList.length"
              placement="right"
              width="360"
              trigger="hover"
            >
              <el-table :data="row.waterBindDtoList" size="mini" border>
                <el-table-column label="类型" width="80">
                  <template slot-scope="{ row: bind }">
                    {{ bind.bindType == 1 ? '租户' : '公摊组' }}
                  </template>
                </el-table-column>
                <el-table-column property="bindName" label="名称" min-width="120" show-overflow-tooltip />
                <el-table-column property="bindId" label="Id" width="90" />
              </el-table>
              <el-tag slot="reference" size="small" type="success" effect="plain" class="clickable-tag">已绑定</el-tag>
            </el-popover>
            <span v-else class="text-muted">未绑定</span>
          </template>
        </el-table-column>
        <el-table-column prop="withSwitchLabel" label="阀控" width="88" />
        <el-table-column prop="bindTypeLabel" label="水表类型" width="100" />
        <el-table-column prop="upTime" label="最新抄表时间" min-width="158" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" class="op-link" @click="onEditWater(true, row)">设置</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          :current-page="queryData.current"
          :page-sizes="[30, 60, 100]"
          :page-size="queryData.pageSize"
          :total="queryData.total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <Edit :edit-dialog="editDialog" @search="getTableData" />
    <Batch :batch-dialog="batchDialog" :manager-names="managerNames" @search="getTableData" />
    <BindProject :bind-dialog="bindDialog" @search="onSearch" />
    <HeighFilter
      :filter-drawer="filterDrawer"
      :manager-names="managerNames"
      @reset="onReset(1)"
      @filter="applyFilter"
    />
  </div>
</template>

<script>
import Edit from './comps/edit.vue'
import Batch from './comps/batch.vue'
import BindProject from './comps/bind-project.vue'
import HeighFilter from './comps/heighFilter.vue'
import {
  adminWaterPageWater,
  adminWaterOfflineWaterList,
  adminWaterWaterUnregisteredList,
  adminDbGetManagerListByUser
} from '@/api/adminWater'
import { WaterChannelType } from '@/utils/enums/water'
import {
  mapManagerOptions,
  formatBindTypeLabel,
  formatWaterTypeLabel,
  formatWithSwitchLabel
} from './utils'
import * as XLSX from 'xlsx'

export default {
  name: 'AdminDeviceWater',
  components: { Edit, Batch, BindProject, HeighFilter },
  data () {
    return {
      loading: false,
      tableData: [],
      selectedRows: [],
      managerNames: [],
      isExport: false,
      tableHeaderStyle: { background: '#f5f7fa', color: '#606266', fontWeight: '600' },
      queryData: {
        bindId: '',
        bindType: '',
        id: '',
        waterName: '',
        onlineStatus: '',
        waterType: '',
        serial: '',
        materialCode: '',
        managerId: '',
        abnormal: '',
        mfrsNo: '',
        current: 1,
        pageSize: 30,
        total: 0
      },
      editDialog: { show: false, type: false, data: {} },
      batchDialog: { show: false },
      bindDialog: { show: false, waterIdList: [], selects: [] },
      filterDrawer: { show: false, query: {} }
    }
  },
  computed: {
    waterChannelOptions () {
      return Object.values(WaterChannelType)
    }
  },
  created () {
    this.loadManagers()
    this.getTableData()
  },
  methods: {
    handleSelectionChange (rows) {
      this.selectedRows = rows || []
    },
    async loadManagers () {
      try {
        const { data } = await adminDbGetManagerListByUser()
        const list = Array.isArray(data) ? data : (data?.dataList || data?.list || [])
        this.managerNames = mapManagerOptions(list)
      } catch (e) {
        this.managerNames = []
      }
    },
    applyFilter (q) {
      this.queryData = { ...this.queryData, ...q }
      this.onSearch()
    },
    onFilter () {
      this.filterDrawer.query = { ...this.queryData }
      this.filterDrawer.show = true
    },
    openBind () {
      if (!this.selectedRows.length) {
        this.$message.warning('请先选择需要切换项目的水表')
        return
      }
      const arr = []
      const weight = []
      const ids = []
      let hasBound = false
      for (let i = 0; i < this.selectedRows.length; i++) {
        const item = this.selectedRows[i]
        if (item.waterBindDtoList && item.waterBindDtoList.length) {
          hasBound = true
          continue
        }
        if (weight.indexOf(item.managerId) === -1) {
          weight.push(item.managerId)
          arr.push({
            managerId: item.managerId,
            managerName: item.managerName,
            num: 1
          })
        } else {
          const index = weight.indexOf(item.managerId)
          arr[index].num += 1
        }
        ids.push(item.id)
      }
      if (!ids.length) {
        this.$message.warning('请选择未绑定的设备')
        return
      }
      const proceed = () => {
        this.bindDialog.selects = arr
        this.bindDialog.waterIdList = ids
        this.bindDialog.show = true
      }
      if (hasBound) {
        this.$confirm('选中数据中存在已绑定租户的设备，切换项目时将跳过此类设备。', '提示', { type: 'warning' })
          .then(proceed)
          .catch(() => {})
      } else {
        proceed()
      }
    },
    async getTableData () {
      this.loading = true
      try {
        if (this.queryData.abnormal === 1 || this.queryData.abnormal === 2) {
          await this.getAbnormalData()
          return
        }
        const query = {
          bindId: this.queryData.bindId,
          bindType: this.queryData.bindType,
          id: this.queryData.id,
          waterType: this.queryData.waterType,
          waterName: this.queryData.waterName,
          onlineStatus: this.queryData.onlineStatus,
          serial: (this.queryData.serial || '').trim(),
          materialCode: this.queryData.materialCode,
          mfrsNo: this.queryData.mfrsNo,
          managerId: this.queryData.managerId,
          page: {
            current: this.isExport ? 1 : this.queryData.current,
            size: this.isExport ? Math.min(this.queryData.total || 5000, 5000) : this.queryData.pageSize,
            orders: [{ asc: false, column: 'createTime' }]
          }
        }
        const { data: { total, dataList } } = await adminWaterPageWater(query)
        this.queryData.total = total
        const list = (dataList || []).map(item => this.mapRow(item))
        if (this.isExport) {
          this.exportExcel(list)
          this.isExport = false
        } else {
          this.tableData = list
        }
      } catch (e) {
        this.$message.error(e?.message || '加载失败')
      } finally {
        this.loading = false
      }
    },
    async getAbnormalData () {
      let tableData = []
      let tip = ''
      if (this.queryData.abnormal === 2) {
        const { data } = await adminWaterWaterUnregisteredList()
        tableData = data || []
        tip = '当前水表均已注册'
      } else {
        const { data } = await adminWaterOfflineWaterList()
        tableData = data || []
        tip = '当前没有离线时间较长的水表'
      }
      if (!tableData.length) this.$message.info(tip)
      this.queryData.total = tableData.length
      const list = tableData.map(item => this.mapRow(item))
      if (this.isExport) {
        this.exportExcel(list)
        this.isExport = false
      } else {
        this.tableData = list
      }
    },
    mapRow (item) {
      item.managerData = `(${item.managerId})${item.managerName || ''}`
      if (!item.waterBindDtoList) item.waterBindDtoList = []
      item.waterTypeLabel = formatWaterTypeLabel(item.waterType)
      item.bindTypeLabel = formatBindTypeLabel(item.bindType)
      item.withSwitchLabel = formatWithSwitchLabel(item.withSwitch)
      return item
    },
    exportExcel (rows) {
      const headers = ['设备号', '物料编码', '设备编号', '设备名称', '接入渠道', '项目信息', '阀控', '水表类型', '最新抄表时间']
      const data = rows.map(r => [
        r.serial, r.materialCode, r.id, r.waterName, r.waterTypeLabel, r.managerData,
        r.withSwitchLabel, r.bindTypeLabel, r.upTime || '-'
      ])
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '水表')
      XLSX.writeFile(wb, `水表管理_${Date.now()}.xlsx`)
    },
    onEditWater (is, data) {
      this.editDialog.data = is ? data : {}
      this.editDialog.type = is
      this.editDialog.show = true
    },
    handleSizeChange (size) {
      this.queryData.pageSize = size
      this.queryData.current = 1
      this.getTableData()
    },
    handleCurrentChange (page) {
      this.queryData.current = page
      this.getTableData()
    },
    onSearch () {
      this.queryData.current = 1
      this.selectedRows = []
      this.getTableData()
    },
    onReset (val) {
      if (val === 1) {
        this.queryData = {
          bindId: '',
          bindType: '',
          id: '',
          waterName: '',
          onlineStatus: '',
          waterType: '',
          serial: '',
          materialCode: '',
          managerId: '',
          abnormal: '',
          mfrsNo: '',
          current: 1,
          pageSize: 30,
          total: 0
        }
      }
      this.getTableData()
    },
    onExport () {
      this.isExport = true
      this.getTableData()
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-water-page {
  padding: 16px 20px 24px;
  min-height: calc(100vh - 100px);
  background: #f0f2f5;
}

.panel-card {
  border: none;
  border-radius: 8px;
  margin-bottom: 16px;

  ::v-deep .el-card__body {
    padding: 20px 24px;
  }
}

.filter-form {
  ::v-deep .el-form-item {
    margin-bottom: 0;
  }
  ::v-deep .el-form-item__label {
    padding-bottom: 6px;
    line-height: 1.4;
    font-size: 13px;
    color: #606266;
  }
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.title-bar {
  width: 4px;
  height: 18px;
  background: #409eff;
  border-radius: 2px;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.water-table {
  width: 100%;

  ::v-deep .el-table__cell {
    padding: 12px 0;
  }
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 4px;
}

.text-muted {
  color: #909399;
}

.clickable-tag {
  cursor: pointer;
}

.op-link {
  padding: 0 6px;
  font-size: 13px;
}
</style>
