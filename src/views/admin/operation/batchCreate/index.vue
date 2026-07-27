<template>
  <div class="admin-meter-page">
    <!-- 筛选区 -->
    <el-card class="panel-card filter-card" shadow="never">
      <el-form class="filter-form" label-position="top" @submit.native.prevent>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="项目名称/编号">
              <el-select
                v-model="queryData.managerId"
                filterable
                clearable
                placeholder="项目名称或编号"
                style="width:100%"
              >
                <el-option
                  v-for="item in managerNames"
                  :key="item.id"
                  :label="item.unite"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="4">
            <el-form-item label="设备类型">
              <el-select
                v-model="queryData.deviceType"
                clearable
                placeholder="请选择"
                style="width:100%"
              >
                <el-option
                  v-for="item in DeviceTypeList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="filter-actions">
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-refresh" @click="onReset">重置</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 列表区 -->
    <el-card class="panel-card table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">
          <span class="title-bar" />
          <span>批量补单列表</span>
        </div>
        <div class="table-actions">
          <el-button type="primary" icon="el-icon-plus" @click="onAdd">新增</el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        class="meter-table"
        :header-cell-style="tableHeaderStyle"
      >
        <el-table-column prop="id" label="记录ID" width="100">
          <template slot-scope="{ row }">
            <el-link type="primary" :underline="false" @click="toDetail(row)">{{ row.id }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="项目信息" min-width="280" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span>{{ row.managerId ? '(' + row.managerId + ')' + (row.managerName || '') : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="操作时间" width="170" />
        <el-table-column prop="queryStartTime" label="查询起始时间" width="170" />
        <el-table-column label="设备数量" width="100" align="center">
          <template slot-scope="{ row }">
            {{ row.deviceCount != null ? row.deviceCount : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="查询状态" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag v-if="row.queryStatus == 1" type="success" size="small" effect="plain">已完成</el-tag>
            <el-tag v-else-if="row.queryStatus == 0" type="warning" size="small" effect="plain">未完成</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="补单状态" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag v-if="row.repairStatus == 1" type="success" size="small" effect="plain">已补单</el-tag>
            <el-tag v-else-if="row.repairStatus == 0" type="warning" size="small" effect="plain">未补单</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="设备类型" width="100" align="center">
          <template slot-scope="{ row }">
            {{ DeviceTypeRead[row.deviceType] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template slot-scope="{ row }">
            <div v-if="row.queryStatus == 1" class="op-cell">
              <el-dropdown trigger="click" @command="cmd => handleOp(cmd, row)">
                <el-button type="text" class="op-link">
                  操作<i class="el-icon-arrow-down el-icon--right" />
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="detail">详情</el-dropdown-item>
                  <el-dropdown-item command="delete">删除</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          :current-page="queryData.current"
          :page-sizes="[30, 50, 100, 200, 500, 1000]"
          :page-size="queryData.pageSize"
          :total="queryData.total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="v => { queryData.pageSize = v; onSearch() }"
          @current-change="v => { queryData.current = v; getTableData() }"
        />
      </div>
    </el-card>

    <Add :add-dialog="addDialog" :manager-names="managerNames" @search="onSearch" />
  </div>
</template>

<script>
import { settleToolsPageSettleManagerRepair, settleToolsDeleteSettleManagerRepair, adminDbGetManagerListByUser } from '@/api/adminDb'
import { mapManagerOptions } from '@/views/admin/device/meter/utils'
import Add from './comps/add.vue'

const DeviceTypeList = [
  { value: '1', label: '电表' },
  { value: '2', label: '水表' }
]
const DeviceTypeRead = { '1': '电表', '2': '水表' }

export default {
  name: 'BatchCreate',
  components: { Add },
  data () {
    return {
      loading: false,
      managerNames: [],
      DeviceTypeList,
      DeviceTypeRead,
      tableHeaderStyle: { background: '#f5f7fa', color: '#606266', fontWeight: '600' },
      queryData: {
        managerId: '',
        deviceType: '',
        pageSize: 30,
        total: 0,
        current: 1
      },
      tableData: [],
      addDialog: { show: false },
      timeout: null
    }
  },
  async created () {
    await this.loadManagers()
    this.getTableData()
  },
  beforeDestroy () {
    clearTimeout(this.timeout)
    this.timeout = null
  },
  methods: {
    handleOp (cmd, row) {
      if (cmd === 'detail') this.toDetail(row)
      else if (cmd === 'delete') this.onDelete(row)
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
    toDetail (row) {
      this.$router.push({ path: '/admin/operation/orderTool/detail', query: { id: row.id } })
    },
    onAdd () {
      this.addDialog.show = true
    },
    onSearch () {
      this.queryData.current = 1
      this.getTableData()
    },
    onReset () {
      this.queryData.managerId = ''
      this.queryData.deviceType = ''
      this.onSearch()
    },
    async getTableData () {
      this.loading = true
      try {
        const query = {
          managerId: this.queryData.managerId,
          managerName: this.queryData.managerName,
          deviceType: this.queryData.deviceType,
          page: {
            current: this.queryData.current,
            size: this.queryData.pageSize,
            orders: [{ asc: false, column: 'id' }]
          }
        }
        const { data: { dataList, total } } = await settleToolsPageSettleManagerRepair(query)
        const list = dataList || []
        // 有未完成记录时 5 秒轮询
        for (let i = 0; i < list.length; i++) {
          if (list[i].queryStatus == 0) {
            this.timeout = setTimeout(() => this.getTableData(), 5000)
            break
          }
        }
        this.tableData = list
        this.queryData.total = total
      } catch (e) {
        this.$message.error(e?.message || '加载失败')
      } finally {
        this.loading = false
      }
    },
    async onDelete (row) {
      try {
        await this.$confirm('确认删除记录?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const { msg } = await settleToolsDeleteSettleManagerRepair({ id: row.id })
        this.$message.success(msg)
        this.getTableData()
      } catch (e) { /* cancelled */ }
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
</style>
