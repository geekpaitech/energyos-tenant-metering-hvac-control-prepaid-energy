<template>
  <div class="admin-meter-page">
    <!-- 筛选区 -->
    <el-card class="panel-card filter-card" shadow="never">
      <el-form class="filter-form" label-position="top" @submit.native.prevent>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="电表序列号">
              <el-input v-model="queryData.serial" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="电表名称">
              <el-input v-model="queryData.meterName" placeholder="请输入" clearable @keyup.enter.native="onSearch" />
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
                @change="onManagerChange"
              >
                <el-option v-for="item in managerNames" :key="item.id" :label="item.unite" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="绑定信息">
              <el-select
                v-model="queryData.bindId"
                filterable
                clearable
                :disabled="!queryData.managerId"
                :loading="tenantLoading"
                :placeholder="queryData.managerId ? '租户名称或编号' : '请先选择项目'"
                style="width:100%"
              >
                <el-option v-for="item in tenantList" :key="item.id" :label="item.unite" :value="item.id" />
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

    <!-- 列表区 -->
    <el-card class="panel-card table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">
          <span class="title-bar" />
          <span>电表列表</span>
        </div>
        <div class="table-actions">
          <el-button type="primary" icon="el-icon-plus" @click="onEditMeter(false)">新增</el-button>
          <el-button icon="el-icon-upload2" @click="onExport(2)">导出数据</el-button>
          <el-button type="warning" icon="el-icon-sort" @click="openBind">切换项目</el-button>
          <el-button icon="el-icon-refresh" circle @click="onReset" />
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        class="meter-table"
        :header-cell-style="tableHeaderStyle"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="serial" label="序列号" min-width="150" show-overflow-tooltip />
        <el-table-column prop="materialCode" label="物料编码" min-width="140" show-overflow-tooltip />
        <el-table-column prop="id" label="设备编号" width="110" />
        <el-table-column prop="meterName" label="设备名称" min-width="160" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <el-link type="primary" :underline="false" @click="toMonitor(row)">{{ row.meterName || '-' }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="bindTypeLabel" label="电表类型" width="100" />
        <el-table-column prop="managerData" label="项目信息" min-width="180" show-overflow-tooltip />
        <el-table-column label="绑定信息" min-width="100">
          <template slot-scope="{ row }">
            <el-popover v-if="row.bindData && row.bindData.length" placement="right" width="360" trigger="hover">
              <el-table :data="row.bindData" size="mini" border>
                <el-table-column property="type" label="类型" width="80" />
                <el-table-column property="name" label="名称" min-width="120" show-overflow-tooltip />
                <el-table-column property="id" label="Id" width="90" />
              </el-table>
              <el-tag slot="reference" size="small" type="success" effect="plain" class="clickable-tag">已绑定</el-tag>
            </el-popover>
            <span v-else class="text-muted">未绑定</span>
          </template>
        </el-table-column>
        <el-table-column label="电费方案" min-width="120" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <el-popover v-if="row.meterPriceDto" placement="top" width="320" trigger="hover">
              <div class="price-pop">
                尖 {{ row.meterPriceDto.powerPeakPrice || 0 }} ·
                峰 {{ row.meterPriceDto.powerTopPrice || 0 }} ·
                平 {{ row.meterPriceDto.powerFlatPrice || 0 }} ·
                谷 {{ row.meterPriceDto.powerValleyPrice || 0 }}
              </div>
              <span slot="reference" class="link-text">{{ row.meterPriceLabel }}</span>
            </el-popover>
            <span v-else class="text-muted">未绑定</span>
          </template>
        </el-table-column>
        <el-table-column label="服务费方案" min-width="110" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span>{{ row.servicePriceLabel || '未绑定' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="logicPayTypeLabel" label="付费模式" width="90" />
        <el-table-column prop="switchStatusLabel" label="分合闸" width="88" />
        <el-table-column label="在线状态" width="96" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.onlineStatus == 1 ? 'success' : 'info'" size="small" effect="plain">
              {{ row.onlineStatus == 1 ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="syncTime" label="最新数据时间" min-width="158" show-overflow-tooltip />
        <el-table-column label="操作" width="168" fixed="right" align="center">
          <template slot-scope="{ row }">
            <div class="op-cell">
              <el-button type="text" class="op-link" @click="toMonitor(row)">电表监控</el-button>
              <el-dropdown trigger="click" @command="cmd => handleOp(cmd, row)">
                <el-button type="text" class="op-link">
                  操作<i class="el-icon-arrow-down el-icon--right" />
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="edit">设置</el-dropdown-item>
                  <el-dropdown-item command="switch">
                    {{ row.switchStatus == 1 ? '分闸' : '合闸' }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
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

    <Edit :edit-dialog="editMeterDialog" @search="getTableData" />
    <MeterVerify :verify-dialog="verifyDialog" @search="getTableData" />
    <LogicEdit :logic-dialog="logicDialog" @search="getTableData" />
    <HeighFilter
      :filter-drawer="filterDrawer"
      :manager-names="managerNames"
      :tenant-list="tenantList"
      @reset="onReset(1)"
      @filter="applyFilter"
      @manager-change="loadTenants"
    />
    <BindProject :bind-dialog="bindDialog" @search="onSearch" />
  </div>
</template>

<script>
import Edit from './comps/edit.vue'
import MeterVerify from './comps/verify.vue'
import LogicEdit from './comps/logicPayType.vue'
import HeighFilter from './comps/heighFilter.vue'
import BindProject from './comps/bind-project.vue'
import { meterPageMeterInfoByAdmin, adminDbGetManagerListByUser, adminDbGetSimpleTenantList } from '@/api/adminDb'
import {
  mapManagerOptions,
  mapTenantOptions,
  formatLogicPayTypeLabel,
  formatSwitchStatusLabel,
  formatBindTypeLabel
} from './utils'
import * as XLSX from 'xlsx'

export default {
  name: 'AdminDeviceMeter',
  components: { Edit, MeterVerify, LogicEdit, HeighFilter, BindProject },
  data () {
    return {
      loading: false,
      tableData: [],
      managerNames: [],
      tenantList: [],
      tenantLoading: false,
      isExport: false,
      tableHeaderStyle: { background: '#f5f7fa', color: '#606266', fontWeight: '600' },
      queryData: {
        bindId: '',
        bindType: '',
        id: '',
        meterName: '',
        onlineStatus: '',
        serial: '',
        switchStatus: '',
        managerId: '',
        materialCode: '',
        current: 1,
        pageSize: 30,
        total: 0
      },
      editMeterDialog: { show: false, type: false, data: {} },
      verifyDialog: { show: false, type: true, meterId: '', meterName: '' },
      logicDialog: { show: false, data: {} },
      filterDrawer: { show: false, query: {} },
      exportData: [],
      bindDialog: { show: false, meterIdList: [], selects: [] }
    }
  },
  created () {
    this.loadManagers()
    this.getTableData()
  },
  methods: {
    handleOp (cmd, row) {
      if (cmd === 'edit') this.onEditMeter(true, row)
      else if (cmd === 'switch') this.onMeterVerify(row, row.switchStatus == 1 ? 0 : 1)
    },
    onManagerChange (managerId) {
      this.queryData.bindId = ''
      this.loadTenants(managerId)
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
    async loadTenants (managerId) {
      const mid = managerId != null ? managerId : this.queryData.managerId
      if (!mid) {
        this.tenantList = []
        return
      }
      this.tenantLoading = true
      try {
        const { data } = await adminDbGetSimpleTenantList({
          managerId: mid,
          tenantStatus: 0
        })
        const list = Array.isArray(data) ? data : (data?.dataList || data?.list || [])
        this.tenantList = mapTenantOptions(list)
      } catch (e) {
        this.tenantList = []
      } finally {
        this.tenantLoading = false
      }
    },
    applyFilter (q) {
      this.queryData = { ...this.queryData, ...q }
      if (q.managerId) {
        this.loadTenants(q.managerId)
      } else if (!this.queryData.managerId) {
        this.tenantList = []
      }
      this.onSearch()
    },
    onFilter () {
      this.filterDrawer.query = { ...this.queryData }
      this.filterDrawer.show = true
      if (this.queryData.managerId) {
        this.loadTenants(this.queryData.managerId)
      }
    },
    toMonitor (row) {
      this.$router.push({ path: '/admin/device/meter/monitor', query: { id: row.serial, type: '1' } })
    },
    onMeterVerify (item, type) {
      if (item.logicPayType === 0 || item.logicPayType === '0') {
        this.logicDialog.show = true
        this.logicDialog.data = item
      } else {
        this.verifyDialog.show = true
        this.verifyDialog.type = type
        this.verifyDialog.meterId = item.id
        this.verifyDialog.meterName = item.meterName
      }
    },
    async getTableData () {
      this.loading = true
      try {
        const query = {
          bindId: this.queryData.bindId,
          bindType: this.queryData.bindType,
          id: this.queryData.id,
          meterName: this.queryData.meterName,
          onlineStatus: this.queryData.onlineStatus,
          serial: this.queryData.serial,
          switchStatus: this.queryData.switchStatus,
          managerId: this.queryData.managerId,
          materialCode: this.queryData.materialCode,
          page: {
            current: this.isExport ? 1 : this.queryData.current,
            size: this.isExport ? Math.min(this.queryData.total || 5000, 5000) : this.queryData.pageSize,
            orders: [
              { asc: false, column: 'id' },
              { asc: false, column: 'createTime' }
            ]
          }
        }
        const { data: { total, dataList } } = await meterPageMeterInfoByAdmin(query)
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
    mapRow (item) {
      item.managerData = `(${item.managerId})${item.managerName || ''}`
      item.bindData = []
      if (item.bindName) {
        item.bindData.push({
          name: item.bindName,
          id: item.bindId,
          type: item.bindType == 1 ? '租户' : '公摊组',
          bind: item.bindType
        })
      }
      item.meterPriceLabel = item.meterPriceDto ? item.meterPriceDto.name : ''
      item.servicePriceLabel = item.servicePriceDto ? item.servicePriceDto.name : '-'
      item.bindTypeLabel = formatBindTypeLabel(item.bindType)
      item.logicPayTypeLabel = formatLogicPayTypeLabel(item.logicPayType)
      item.switchStatusLabel = formatSwitchStatusLabel(item.switchStatus)
      return item
    },
    exportExcel (rows) {
      const headers = ['序列号', '物料编码', '设备编号', '设备名称', '电表类型', '项目信息', '付费模式', '分合闸', '在线状态']
      const data = rows.map(r => [
        r.serial, r.materialCode, r.id, r.meterName, r.bindTypeLabel, r.managerData,
        r.logicPayTypeLabel, r.switchStatusLabel, r.onlineStatus == 1 ? '在线' : '离线'
      ])
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '电表')
      XLSX.writeFile(wb, `电表管理_${Date.now()}.xlsx`)
    },
    onEditMeter (is, data) {
      this.editMeterDialog.data = is ? data : {}
      this.editMeterDialog.type = is
      this.editMeterDialog.show = true
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
      this.getTableData()
    },
    onReset (val) {
      if (val === 1) {
        this.queryData = {
          bindId: '',
          bindType: '',
          id: '',
          meterName: '',
          onlineStatus: '',
          serial: '',
          switchStatus: '',
          managerId: '',
          materialCode: '',
          current: 1,
          pageSize: 30,
          total: 0
        }
        this.tenantList = []
      }
      this.getTableData()
    },
    onExport () {
      this.isExport = true
      this.getTableData()
    },
    handleSelectionChange (select) {
      this.exportData = select
    },
    openBind () {
      if (!this.exportData.length) {
        this.$message.warning('请先选择需要更换的电表')
        return
      }
      const arr = []
      const weight = []
      const ids = []
      let isReturn = false
      for (let i = 0; i < this.exportData.length; i++) {
        const item = this.exportData[i]
        if (item.bindId) {
          isReturn = true
          break
        }
        if (weight.indexOf(item.managerId) === -1) {
          weight.push(item.managerId)
          arr.push({ managerId: item.managerId, managerName: item.managerName, num: 1 })
        } else {
          arr[weight.indexOf(item.managerId)].num += 1
        }
        ids.push(item.id)
      }
      if (isReturn) {
        this.$confirm('选中数据中存在已绑定租户的设备，切换项目时，将跳过此类设备。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.bindDialog.selects = arr
          this.bindDialog.meterIdList = ids
          this.bindDialog.show = true
        }).catch(() => {})
      } else {
        this.bindDialog.selects = arr
        this.bindDialog.meterIdList = ids
        this.bindDialog.show = true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-meter-page {
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

.meter-table {
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

.link-text {
  color: #409eff;
  cursor: pointer;
}

.text-muted {
  color: #909399;
}

.clickable-tag {
  cursor: pointer;
}

.op-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.op-link {
  padding: 0 6px;
  font-size: 13px;
}

.price-pop {
  font-size: 13px;
  line-height: 1.6;
}
</style>
