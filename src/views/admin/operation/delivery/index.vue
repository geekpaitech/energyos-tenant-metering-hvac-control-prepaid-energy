<template>
  <div class="admin-delivery-page">
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
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="电表序列号">
              <el-input
                v-model="queryData.serial"
                clearable
                placeholder="请输入"
                @keyup.enter.native="onSearch"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="filter-actions">
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 结果区 -->
    <el-card class="panel-card table-card" shadow="never" v-loading="loading">
      <div class="table-header">
        <div class="table-title">
          <span class="title-bar" />
          <span>交付检测结果</span>
        </div>
      </div>
      <el-table :data="tableData" border stripe>
        <el-table-column label="检测标准" min-width="200">
          <template slot-scope="{ row }">
            {{ row.label }}
          </template>
        </el-table-column>
        <el-table-column label="检测结果" width="120" align="center">
          <template slot-scope="{ row }">
            <span
              :class="row.num === 0 ? 'color-green' : 'color-red'"
              :style="row.num !== 0 ? 'cursor:pointer;border-bottom:1px solid #ee3d3d' : ''"
              @click="openDetail(row)"
            >{{ row.num }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <Detail :detail-drawer="detailDrawer" />
  </div>
</template>

<script>
import { meterMeterRealDataVerify, adminDbGetManagerListByUser } from '@/api/adminDb'
import { mapManagerOptions } from '@/views/admin/device/meter/utils'
import Detail from './comps/detail.vue'

export default {
  name: 'AdminOperationDelivery',
  components: { Detail },
  data () {
    return {
      loading: false,
      managerNames: [],
      detailDrawer: {
        show: false,
        data: {}
      },
      tableData: [
        { label: '离线监测', num: 0, index: 0, data: [] },
        { label: '电表余额大于0', num: 0, index: 1, data: [] },
        { label: '电表功率总和不一致', num: 0, index: 2, data: [] },
        { label: '电压缺相', num: 0, index: 3, data: [] }
      ],
      queryData: {
        serial: '',
        managerId: ''
      }
    }
  },
  async created () {
    await this.loadManagers()
  },
  methods: {
    async loadManagers () {
      try {
        const { data } = await adminDbGetManagerListByUser()
        const list = Array.isArray(data) ? data : (data?.dataList || data?.list || [])
        this.managerNames = mapManagerOptions(list)
      } catch (e) {
        this.managerNames = []
      }
    },
    openDetail (data) {
      if (data.num === 0) return
      this.detailDrawer.data = data
      this.detailDrawer.show = true
    },
    async getTableData () {
      const { data } = await meterMeterRealDataVerify({
        serial: this.queryData.serial,
        managerId: this.queryData.managerId
      })
      this.tableData[0].num = data.offlineCount
      this.tableData[0].data = data.offlineList || []
      this.tableData[1].num = data.balanceCount
      this.tableData[1].data = data.balanceList || []
      this.tableData[2].num = data.pcount
      this.tableData[2].data = data.plist || []
      this.tableData[3].num = data.ucount
      this.tableData[3].data = data.ulist || []
    },
    async onSearch () {
      if (!this.queryData.serial && !this.queryData.managerId) {
        this.$message.warning('请输入电表序列号或选择项目')
        return
      }
      this.loading = true
      try {
        await this.getTableData()
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-delivery-page {
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

.color-green { color: #47b881; }
.color-red { color: #ee3d3d; }
</style>
