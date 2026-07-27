<template>
  <div class="admin-operation-page">
    <!-- 筛选区 -->
    <el-card class="panel-card filter-card" shadow="never">
      <el-form class="filter-form" label-position="top" @submit.native.prevent>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item>
              <el-input
                v-model="queryData.id"
                autocomplete="on"
                clearable
                :placeholder="queryData.columnName === 'tenement' ? '请输入租户ID' : '请输入公摊组编号'"
              >
                <el-select
                  slot="prepend"
                  v-model="queryData.columnName"
                  style="width: 120px"
                  placeholder="请选择"
                  @change="onSwitch"
                >
                  <el-option label="租户ID" value="tenement" />
                  <el-option label="公摊组编号" value="share" />
                </el-select>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="5">
            <el-form-item label="">
              <el-date-picker
                v-model="queryData.timeRange"
                type="datetime"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="filter-actions">
          <el-button type="primary" icon="el-icon-search" @click="onSearch">提交查询</el-button>
          <el-button icon="el-icon-download" @click="onSubmit">获取结果</el-button>
          <el-button icon="el-icon-download" @click="btnExport">导出</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 加载动画 -->
    <div v-if="!clearOut" class="loading-bar">
      <span>{{ msg || '开始查询' }}</span>
      <span class="loading-spin" />
    </div>

    <!-- 租户信息展示 -->
    <el-card v-if="queryData.columnName === 'tenement'" class="panel-card" shadow="never">
      <el-form label-position="top" inline class="filter-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8">
            <el-form-item label="项目信息">
              <span>{{ managerInfoDto.managerId ? '(' + managerInfoDto.managerId + ')' + managerInfoDto.managerName : '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="租户信息">
              <span>{{ managerInfoDto.tenantId ? '(' + managerInfoDto.tenantId + ')' + managerInfoDto.tenantName : '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="查询日期">
              <span>{{ managerInfoDto.startDateTime || '-' }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 公摊组信息展示 -->
    <el-card v-else-if="queryData.columnName === 'share'" class="panel-card" shadow="never">
      <el-form label-position="top" inline class="filter-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8">
            <el-form-item label="项目信息">
              <span>{{ managerShareInfoDto.managerId ? '(' + managerShareInfoDto.managerId + ')' + managerShareInfoDto.managerName : '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="公摊组信息">
              <span>{{ managerShareInfoDto.shareId ? '(' + managerShareInfoDto.shareId + ')' + managerShareInfoDto.shareName : '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="查询日期">
              <span>{{ managerShareInfoDto.startDateTime || '-' }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 公摊组 Tab 切换 -->
    <div v-if="queryData.columnName === 'share'" class="share-tabs">
      <div :class="!queryData.share ? 'tab-on' : 'tab-off'" @click="queryData.share = false">抄表数据</div>
      <div :class="queryData.share ? 'tab-on' : 'tab-off'" @click="queryData.share = true">公摊数据</div>
    </div>

    <!-- 抄表数据表格 -->
    <el-card v-show="!queryData.share" class="panel-card table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">
          <span class="title-bar" />
          <span>抄表数据</span>
        </div>
      </div>
      <el-table
        v-if="tableData.length"
        ref="table"
        :data="tableData"
        border
        stripe
        :header-cell-style="tableHeaderStyle"
        style="width: 100%"
      >
        <el-table-column prop="meterName" label="电表名称" width="130" />
        <el-table-column prop="meterSerial" label="电表序列号" width="130" />
        <el-table-column label="首条数据" align="center">
          <el-table-column prop="firstRecordTime" label="时间" width="170" />
          <el-table-column prop="firstRecordPowerAll" label="总用电量" />
          <el-table-column prop="firstRecordPowerPeak" label="尖电量" />
          <el-table-column prop="firstRecordPowerTop" label="峰电量" />
          <el-table-column prop="firstRecordPowerFlat" label="平电量" />
          <el-table-column prop="firstRecordPowerValley" label="谷电量" />
        </el-table-column>
        <el-table-column label="最新结账数据" align="center">
          <el-table-column prop="lastSettleRecordTime" label="时间" width="170" />
          <el-table-column prop="lastSettleRecordPowerAll" label="总用电量" />
          <el-table-column prop="lastSettleRecordPowerPeak" label="尖电量" />
          <el-table-column prop="lastSettleRecordPowerTop" label="峰电量" />
          <el-table-column prop="lastSettleRecordPowerFlat" label="平电量" />
          <el-table-column prop="lastSettleRecordPowerValley" label="谷电量" />
        </el-table-column>
        <el-table-column label="抄表数据" align="center">
          <el-table-column prop="settleBalance" label="总费用" />
          <el-table-column prop="settlePowerAll" label="总用电量" />
          <el-table-column prop="settlePowerPeak" label="尖电量" />
          <el-table-column prop="settlePowerTop" label="峰电量" />
          <el-table-column prop="settlePowerFlat" label="平电量" />
          <el-table-column prop="settlePowerValley" label="谷电量" />
        </el-table-column>
        <el-table-column label="平台已累计" align="center">
          <el-table-column prop="yetSettleBalance" label="总费用" />
          <el-table-column prop="yetSettlePowerAll" label="总用电量" />
          <el-table-column prop="yetSettlePowerPeak" label="尖电量" />
          <el-table-column prop="yetSettlePowerTop" label="峰电量" />
          <el-table-column prop="yetSettlePowerFlat" label="平电量" />
          <el-table-column prop="yetSettlePowerValley" label="谷电量" />
        </el-table-column>
        <el-table-column label="补单数据" align="center">
          <el-table-column prop="repairBalance" label="总费用" />
          <el-table-column prop="repairPowerAll" label="总用电量" />
          <el-table-column prop="repairPowerPeak" label="尖电量" />
          <el-table-column prop="repairPowerTop" label="峰电量" />
          <el-table-column prop="repairPowerFlat" label="平电量" />
          <el-table-column prop="repairPowerValley" label="谷电量" />
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无数据" />
    </el-card>

    <!-- 公摊数据表格 -->
    <el-card v-show="queryData.share" class="panel-card table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">
          <span class="title-bar" />
          <span>公摊数据</span>
        </div>
      </div>
      <el-table
        v-if="shareCountDtoList.length"
        ref="share"
        :data="shareCountDtoList"
        border
        stripe
        :header-cell-style="tableHeaderStyle"
        style="width: 100%"
      >
        <el-table-column prop="tenantId" label="租户ID" />
        <el-table-column prop="tenantName" label="租户名" />
        <el-table-column label="实际公摊面积">
          <template slot-scope="{ row }">{{ row.shareArea }}㎡</template>
        </el-table-column>
        <el-table-column prop="shareRatio" label="公摊比例" />
        <el-table-column label="公摊金额(元)">
          <template slot-scope="{ row }">{{ fmtNum(row.shareBalance) }}</template>
        </el-table-column>
        <el-table-column label="总分摊用电量(kWh)" width="170">
          <template slot-scope="{ row }">{{ row.shareUseElec }}</template>
        </el-table-column>
        <el-table-column label="尖分摊用电量(kWh)" width="170">
          <template slot-scope="{ row }">{{ row.shareUseElecPeak }}</template>
        </el-table-column>
        <el-table-column label="峰分摊用电量(kWh)" width="170">
          <template slot-scope="{ row }">{{ row.shareUseElecTop }}</template>
        </el-table-column>
        <el-table-column label="平分摊用电量(kWh)" width="170">
          <template slot-scope="{ row }">{{ row.shareUseElecFlat }}</template>
        </el-table-column>
        <el-table-column label="谷分摊用电量(kWh)" width="170">
          <template slot-scope="{ row }">{{ row.shareUseElecValley }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无数据" />
    </el-card>
  </div>
</template>

<script>
import moment from 'moment'
import {
  settleToolsApplyQueryTenantPrivate,
  settleToolsQueryTenantPrivate,
  settleToolsApplyQueryTenantShare,
  settleToolsQueryTenantShare
} from '@/api/adminDb'
import * as XLSX from 'xlsx'

export default {
  name: 'OrderToolCalibration',
  data () {
    return {
      tableData: [],
      tableDataShare: [],
      tableDataTent: [],
      shareCountDtoList: [],
      managerInfoDto: {},
      managerShareInfoDto: {},
      tableHeaderStyle: {
        background: '#f5f7fa',
        color: '#606266',
        fontWeight: '600'
      },
      queryData: {
        columnName: 'tenement',
        id: '',
        share: false,
        timeRange: moment().format('YYYY-MM-DD') + ' 00:00:00'
      },
      clearOut: true,
      msg: '',
      timer: null
    }
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {
    fmtNum (v) {
      if (v == null || v === '') return '0.00'
      return Number(v).toFixed(2)
    },
    onSwitch () {
      this.managerShareInfoDto = {}
      this.managerInfoDto = {}
      this.queryData.id = ''
      this.clearOut = true
      this.msg = ''
      this.queryData.share = false
      clearInterval(this.timer)
      if (this.queryData.columnName === 'tenement') {
        this.tableData = JSON.parse(JSON.stringify(this.tableDataTent))
      } else {
        this.tableData = JSON.parse(JSON.stringify(this.tableDataShare))
      }
    },
    async onSearch () {
      if (!this.queryData.id) {
        this.$message.warning('请输入' + (this.queryData.columnName === 'tenement' ? '租户ID' : '公摊组编号'))
        return
      }
      if (this.queryData.columnName === 'tenement') {
        await this.getSearchDataTenant()
      } else {
        await this.getSearchDataShare()
      }
    },
    onSubmit () {
      this.clearOut = false
      this.msg = ''
      clearInterval(this.timer)
      const that = this
      if (this.queryData.columnName === 'tenement') {
        that.getTableDataTenant()
        that.timer = setInterval(function () {
          if (that.clearOut) {
            clearInterval(that.timer)
            return
          }
          that.getTableDataTenant()
        }, 5000)
      } else {
        that.getTableDataShare()
        that.timer = setInterval(function () {
          if (that.clearOut) {
            clearInterval(that.timer)
            return
          }
          that.getTableDataShare()
        }, 5000)
      }
    },
    async getSearchDataTenant () {
      const { msg } = await settleToolsApplyQueryTenantPrivate({
        tenantId: this.queryData.id,
        startDateTime: this.queryData.timeRange
      })
      this.$message.success(msg)
    },
    async getTableDataTenant () {
      const { data, code, msg } = await settleToolsQueryTenantPrivate()
      if (code === 210) return
      this.msg = msg
      this.clearOut = true
      const list = (data.meterDtoList || []).map(item => {
        const obj = {}
        Object.keys(item).forEach(key => {
          obj[key] = (item[key] == null || item[key] === '') ? '-' : item[key]
        })
        return obj
      })
      this.tableDataTent = list
      this.managerInfoDto = data.managerInfoDto || {}
      this.tableData = JSON.parse(JSON.stringify(this.tableDataTent))
    },
    async getSearchDataShare () {
      const { msg } = await settleToolsApplyQueryTenantShare({
        shareId: this.queryData.id,
        startDateTime: this.queryData.timeRange
      })
      this.$message.success(msg)
    },
    async getTableDataShare () {
      const { data, msg, code } = await settleToolsQueryTenantShare()
      if (code === 210) return
      this.msg = msg
      this.clearOut = true
      const list = (data.meterDtoList || []).map(item => {
        const obj = {}
        Object.keys(item).forEach(key => {
          obj[key] = (item[key] == null || item[key] === '') ? '-' : item[key]
        })
        return obj
      })
      this.tableDataShare = list
      this.managerShareInfoDto = data.managerShareInfoDto || {}
      this.shareCountDtoList = data.shareCountDtoList || []
      this.tableData = JSON.parse(JSON.stringify(this.tableDataShare))
    },
    btnExport () {
      if (this.queryData.share && this.$refs.share) {
        this.exportTable(this.$refs.share.$el, '公摊数据')
      }
      if (this.$refs.table) {
        this.exportTable(this.$refs.table.$el, '抄表数据')
      }
    },
    exportTable (ele, name) {
      const wb = XLSX.utils.table_to_book(ele, { raw: true })
      XLSX.writeFile(wb, name + '_' + Date.now() + '.xlsx')
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-operation-page {
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

.loading-bar {
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 20px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}

.loading-spin {
  display: inline-block;
  border: 3px solid #e4e7ed;
  border-left-color: #409eff;
  border-right-color: #409eff;
  border-radius: 50%;
  margin-left: 8px;
  width: 14px;
  height: 14px;
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.share-tabs {
  display: flex;
  align-items: center;
  width: 240px;
  border: 1px solid #409eff;
  border-radius: 4px;
  margin-bottom: 12px;
  overflow: hidden;
}

.tab-on,
.tab-off {
  width: 50%;
  height: 36px;
  line-height: 36px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.tab-on {
  color: #fff;
  background: #409eff;
}

.tab-off {
  color: #409eff;
  background: #fff;
}
</style>
