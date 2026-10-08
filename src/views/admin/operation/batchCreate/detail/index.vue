<template>
  <div class="admin-batch-detail-page">
    <!-- 筛选区 -->
    <el-card class="panel-card filter-card" shadow="never">
      <el-form class="filter-form" label-position="top" @submit.native.prevent>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="租户名称/编号">
              <el-input
                v-model="queryData.tenantId"
                clearable
                placeholder="请输入"
                @keyup.enter.native="onSearch"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="filter-actions">
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button icon="el-icon-download" @click="onExport">导出</el-button>
          <el-button type="success" @click="onCreate">补单</el-button>
          <el-button @click="onBack">返回</el-button>
        </div>
        <el-row :gutter="20" style="margin-top:16px">
          <el-col :xs="24" :sm="8">
            <el-form-item label="项目信息">
              <span>
                {{ detailData.managerId ? '(' + detailData.managerId + ')' + detailData.managerName : '-' }}
              </span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="5">
            <el-form-item label="操作时间">
              <span>{{ detailData.createTime || '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="5">
            <el-form-item label="查询起始时间">
              <span>{{ detailData.queryStartTime || '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="5">
            <el-form-item label="设备类型">
              <span>{{ DeviceTypeRead[detailData.deviceType] ? DeviceTypeRead[detailData.deviceType].label : '-' }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 列表区 - 电表 -->
    <el-card v-show="detailData.deviceType == 1" class="panel-card table-card" shadow="never" v-loading="loading">
      <div class="table-header">
        <div class="table-title">
          <span class="title-bar" />
          <span>补单明细 - 电表</span>
        </div>
      </div>
      <el-table ref="table1" :data="tableData" border stripe>
        <el-table-column label="租户信息" width="260" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span v-if="row.tenantId">
              ({{ row.tenantId }}){{ row.tenantName }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="meterSerial" label="设备序列号" width="150" />
        <el-table-column label="设备名称" min-width="160" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span>{{ row.meterName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="首条读数">
          <el-table-column prop="firstRecordTime" label="时间" width="160" />
          <el-table-column prop="firstRecordPowerAll" label="总用量" width="90" />
          <el-table-column prop="firstRecordPowerPeak" label="尖用量" width="90" />
          <el-table-column prop="firstRecordPowerTop" label="峰用量" width="90" />
          <el-table-column prop="firstRecordPowerFlat" label="平用量" width="90" />
          <el-table-column prop="firstRecordPowerValley" label="谷用量" width="90" />
        </el-table-column>
        <el-table-column label="最新结账读数">
          <el-table-column prop="lastSettleRecordTime" label="时间" width="160" />
          <el-table-column prop="lastSettleRecordPowerAll" label="总用量" width="90" />
          <el-table-column prop="lastSettleRecordPowerPeak" label="尖用量" width="90" />
          <el-table-column prop="lastSettleRecordPowerTop" label="峰用量" width="90" />
          <el-table-column prop="lastSettleRecordPowerFlat" label="平用量" width="90" />
          <el-table-column prop="lastSettleRecordPowerValley" label="谷用量" width="90" />
        </el-table-column>
        <el-table-column label="抄表数据">
          <el-table-column prop="settleBalance" label="总费用" width="90" />
          <el-table-column prop="settlePowerAll" label="总用量" width="90" />
          <el-table-column prop="settlePowerPeak" label="尖用量" width="90" />
          <el-table-column prop="settlePowerTop" label="峰用量" width="90" />
          <el-table-column prop="settlePowerFlat" label="平用量" width="90" />
          <el-table-column prop="settlePowerValley" label="谷用量" width="90" />
        </el-table-column>
        <el-table-column label="平台已结算">
          <el-table-column prop="yetSettleBalance" label="总费用" width="90" />
          <el-table-column prop="yetSettlePowerAll" label="总用量" width="90" />
          <el-table-column prop="yetSettlePowerPeak" label="尖用量" width="90" />
          <el-table-column prop="yetSettlePowerTop" label="峰用量" width="90" />
          <el-table-column prop="yetSettlePowerFlat" label="平用量" width="90" />
          <el-table-column prop="yetSettlePowerValley" label="谷用量" width="90" />
        </el-table-column>
        <el-table-column label="补单数据">
          <el-table-column prop="repairBalance" label="总费用" width="90" />
          <el-table-column prop="repairPowerAll" label="总用量" width="90" />
          <el-table-column prop="repairPowerPeak" label="尖用量" width="90" />
          <el-table-column prop="repairPowerTop" label="峰用量" width="90" />
          <el-table-column prop="repairPowerFlat" label="平用量" width="90" />
          <el-table-column prop="repairPowerValley" label="谷用量" width="90" />
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" @click="onEditData(row)">修改数据</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <el-pagination
          :current-page="queryData.current"
          :page-sizes="[50, 100, 200, 500, 1000, 5000]"
          :page-size="queryData.pageSize"
          :total="queryData.total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="v => { queryData.pageSize = v; onSearch() }"
          @current-change="v => { queryData.current = v; getTableData() }"
        />
      </div>
    </el-card>

    <!-- 列表区 - 水表 -->
    <el-card v-show="detailData.deviceType == 2" class="panel-card table-card" shadow="never" v-loading="loading">
      <div class="table-header">
        <div class="table-title">
          <span class="title-bar" />
          <span>补单明细 - 水表</span>
        </div>
      </div>
      <el-table ref="table2" :data="tableData" border stripe>
        <el-table-column label="租户信息" width="260" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span v-if="row.tenantId">
              ({{ row.tenantId }}){{ row.tenantName }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="meterSerial" label="设备序列号" width="150" />
        <el-table-column label="设备名称" min-width="160" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span>{{ row.meterName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="首条读数">
          <el-table-column prop="firstRecordTime" label="时间" width="160" />
          <el-table-column prop="firstRecordPowerAll" label="累计用量" width="100" />
        </el-table-column>
        <el-table-column label="最新结账读数">
          <el-table-column prop="lastSettleRecordTime" label="时间" width="160" />
          <el-table-column prop="lastSettleRecordPowerAll" label="总用量" width="100" />
        </el-table-column>
        <el-table-column label="抄表数据">
          <el-table-column prop="settleBalance" label="总费用" width="100" />
          <el-table-column prop="settlePowerAll" label="总用量" width="100" />
        </el-table-column>
        <el-table-column label="平台已结算">
          <el-table-column prop="yetSettleBalance" label="总费用" width="100" />
          <el-table-column prop="yetSettlePowerAll" label="总用量" width="100" />
        </el-table-column>
        <el-table-column label="补单数据">
          <el-table-column prop="repairBalance" label="总费用" width="100" />
          <el-table-column prop="repairPowerAll" label="总用量" width="100" />
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" @click="onEditData(row)">修改数据</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <el-pagination
          :current-page="queryData.current"
          :page-sizes="[50, 100, 200, 500, 1000, 5000]"
          :page-size="queryData.pageSize"
          :total="queryData.total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="v => { queryData.pageSize = v; onSearch() }"
          @current-change="v => { queryData.current = v; getTableData() }"
        />
      </div>
    </el-card>

    <Edit :edit-dialog="editDialog" @search="onSearch" />
    <EditWater :edit-dialog="waterDialog" @search="onSearch" />

    <!-- 补单弹窗 -->
    <el-dialog
      :close-on-click-modal="false"
      :visible.sync="showCreate"
      width="500px"
      title="补单"
      @open="initCreateDialog"
    >
      <el-form label-width="auto">
        <div class="section-title">缩限条件</div>
        <el-form-item label="设备已绑定租户" label-width="150" />
        <el-form-item label="补单数据「总费用」&gt;">
          <el-input-number
            v-model="createForm.money"
            :precision="2"
            :min="0"
            style="width:100%"
          />
        </el-form-item>
        <div class="section-title">账单日期</div>
        <el-form-item label="起始日期" label-width="80">
          <el-date-picker
            v-model="createForm.settleDate"
            :picker-options="createForm.pickerOptions"
            placeholder="起始日期"
            type="date"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="备注内容" label-width="80">
          <el-input
            v-model="createForm.remark"
            show-word-limit
            maxlength="50"
            type="textarea"
            clearable
            placeholder="备注内容"
          />
          <div class="quick-notes">
            <el-tag
              v-for="(item, idx) in ['数据用能初始化']"
              :key="idx"
              class="quick-tag"
              size="small"
              type="info"
              @click="createForm.remark = item"
            >{{ item }}</el-tag>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showCreate = false">取 消</el-button>
        <el-button type="primary" @click="onCreateSubmit">确 认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  settleToolsGetSettleManagerRepairById,
  settleToolsPageSettleMeterRepair,
  settleToolsDoSettleManagerRepair
} from '@/api/adminDb'
import Edit from '../comps/edit.vue'
import EditWater from '../comps/edit-water.vue'
import * as XLSX from 'xlsx'

const DeviceTypeList = [
  { value: '1', label: '电表' },
  { value: '2', label: '水表' }
]
const DeviceTypeRead = {
  '1': { label: '电表', value: '1' },
  '2': { label: '水表', value: '2' }
}

export default {
  name: 'BatchCreateDetail',
  components: { Edit, EditWater },
  data () {
    return {
      loading: false,
      id: '',
      DeviceTypeRead,
      queryData: {
        tenantId: '',
        current: 1,
        pageSize: 50,
        total: 0
      },
      detailData: {},
      tableData: [],
      editDialog: {
        show: false,
        data: {}
      },
      waterDialog: {
        show: false,
        data: {}
      },
      showCreate: false,
      createForm: {
        money: 1,
        settleDate: '',
        remark: '',
        pickerOptions: {
          disabledDate (time) {
            return time.getTime() > Date.now() - 86400000
          }
        }
      }
    }
  },
  async created () {
    this.id = this.$route.query.id
    this.getTableData()
    this.getDetailData()
  },
  methods: {
    onSearch () {
      this.queryData.current = 1
      this.getDetailData()
      this.getTableData()
    },
    onBack () {
      this.$router.go(-1)
    },
    onCreate () {
      this.showCreate = true
    },
    initCreateDialog () {
      try {
        const cached = localStorage.getItem('batchCreate_remark')
        if (cached) this.createForm.remark = cached
      } catch (e) { /* ignore */ }
    },
    async onCreateSubmit () {
      try {
        await this.$confirm('确认保存补单数据?', '提示', { type: 'warning' })
        const query = {
          repairBalanceMin: this.createForm.money * 1,
          settleDate: this.createForm.settleDate,
          smrId: this.id,
          remark: this.createForm.remark
        }
        const { msg } = await settleToolsDoSettleManagerRepair(query)
        try { localStorage.setItem('batchCreate_remark', this.createForm.remark) } catch (e) { /* ignore */ }
        this.$message.success(msg)
        this.showCreate = false
        this.createForm.money = 1
        this.createForm.remark = ''
        this.onSearch()
      } catch (e) { /* cancelled */ }
    },
    async getDetailData () {
      try {
        const { data } = await settleToolsGetSettleManagerRepairById({ id: this.id })
        this.detailData = data || {}
      } catch (e) {
        this.$message.error(e?.message || '获取详情失败')
      }
    },
    async getTableData () {
      this.loading = true
      try {
        const query = {
          smrId: this.id,
          tenantId: this.queryData.tenantId,
          page: {
            current: this.queryData.current,
            size: this.queryData.pageSize,
            orders: [{ asc: false, column: 'id' }]
          }
        }
        const { data: { dataList, total } } = await settleToolsPageSettleMeterRepair(query)
        this.tableData = dataList || []
        this.queryData.total = total
      } catch (e) {
        this.$message.error(e?.message || '加载列表失败')
      } finally {
        this.loading = false
      }
    },
    onEditData (row) {
      if (this.detailData.deviceType == 1) {
        this.editDialog.data = row
        this.editDialog.show = true
      } else {
        this.waterDialog.data = row
        this.waterDialog.show = true
      }
    },
    onExport () {
      const refName = this.detailData.deviceType == 1 ? 'table1' : 'table2'
      const $table = this.$refs[refName]
      if (!$table) return
      const ws = XLSX.utils.table_to_sheet($table.$el.querySelector('table'))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '补单明细')
      XLSX.writeFile(wb, '补单详情_' + Date.now() + '.xlsx')
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-batch-detail-page {
  box-sizing: border-box;
  height: 100%;
  padding: 16px 20px 24px;
  overflow-x: hidden;
  overflow-y: auto;
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

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 4px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  padding: 8px 0 6px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 12px;
}

.quick-notes {
  margin-top: 8px;
}

.quick-tag {
  margin-right: 8px;
  cursor: pointer;
}
</style>
