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
        </el-row>
        <div class="filter-actions">
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查 询</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 租户补单信息 -->
    <el-card v-if="queryData.columnName === 'tenement'" class="panel-card" shadow="never">
      <el-form class="filter-form" label-position="top" @submit.native.prevent>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="7">
            <el-form-item label="项目信息">
              <span>{{ managerInfoDto.managerId ? '(' + managerInfoDto.managerId + ')' + managerInfoDto.managerName : '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="7">
            <el-form-item label="租户信息">
              <span>{{ managerInfoDto.tenantId ? '(' + managerInfoDto.tenantId + ')' + managerInfoDto.tenantName : '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="4">
            <el-form-item label="补单日期">
              <el-date-picker
                v-model="queryData.timeRange"
                type="date"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                :picker-options="expireTimeOPtion"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="3">
            <el-form-item label="">
              <el-button type="warning" @click="openDialog">补 单</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 公摊补单信息 -->
    <el-card v-if="queryData.columnName === 'share'" class="panel-card" shadow="never">
      <el-form class="filter-form" label-position="top" @submit.native.prevent>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="4">
            <el-form-item label="项目编号">
              <span>{{ managerShareInfoDto.managerId || '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="4">
            <el-form-item label="项目名称">
              <span>{{ managerShareInfoDto.managerName || '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="4">
            <el-form-item label="公摊组ID">
              <span>{{ managerShareInfoDto.shareId || '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="4">
            <el-form-item label="公摊组名">
              <span>{{ managerShareInfoDto.shareName || '-' }}</span>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="4">
            <el-form-item label="补单日期">
              <el-date-picker
                v-model="queryData.timeRange"
                type="date"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                :picker-options="expireTimeOPtion"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="3">
            <el-form-item label="">
              <el-button type="warning" @click="openDialog">补 单</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 公摊组 Tab -->
    <div v-if="queryData.columnName === 'share'" class="share-tabs">
      <div :class="!queryData.share ? 'tab-on' : 'tab-off'" @click="queryData.share = false">抄表数据</div>
      <div :class="queryData.share ? 'tab-on' : 'tab-off'" @click="queryData.share = true">公摊数据</div>
    </div>

    <!-- 抄表数据表格 -->
    <el-card v-show="!queryData.share" class="panel-card table-card" shadow="never" v-loading="loading">
      <div class="table-header">
        <div class="table-title">
          <span class="title-bar" />
          <span>电表列表</span>
        </div>
      </div>
      <el-table
        v-if="tableData.length"
        ref="table"
        :data="tableData"
        border
        stripe
        highlight-current-row
        :header-cell-style="tableHeaderStyle"
        style="width: 100%"
      >
        <el-table-column prop="meterId" label="电表ID" />
        <el-table-column prop="meterName" label="电表名称" />
        <el-table-column prop="meterSerial" label="电表序列号" />
        <el-table-column label="总费用">
          <template slot-scope="{ row }">
            <el-input v-model="row.balance" type="number" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="总用能">
          <template slot-scope="{ row }">
            <el-input v-model="row.powerAll" type="number" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="尖">
          <template slot-scope="{ row }">
            <el-input v-model="row.powerPeak" type="number" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="峰">
          <template slot-scope="{ row }">
            <el-input v-model="row.powerTop" type="number" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="平">
          <template slot-scope="{ row }">
            <el-input v-model="row.powerFlat" type="number" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="谷">
          <template slot-scope="{ row }">
            <el-input v-model="row.powerValley" type="number" size="small" />
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!loading" description="暂无数据" />
    </el-card>

    <!-- 公摊数据表格 -->
    <el-card v-show="queryData.share" class="panel-card table-card" shadow="never" v-loading="loading">
      <div class="table-header">
        <div class="table-title">
          <span class="title-bar" />
          <span>公摊数据</span>
        </div>
      </div>
      <el-table
        v-if="tenantShareList.length"
        :data="tenantShareList"
        border
        stripe
        :header-cell-style="tableHeaderStyle"
        style="width: 100%"
      >
        <el-table-column prop="tenantId" label="租户ID" />
        <el-table-column prop="tenantName" label="租户名" />
        <el-table-column label="实际公摊面积">
          <template slot-scope="{ row }">{{ row.shareArea }}平方米</template>
        </el-table-column>
        <el-table-column prop="shareRatio" label="公摊比例" />
        <el-table-column label="公摊金额">
          <template slot-scope="{ row }">
            <el-input v-model="row.shareBalance" type="number" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="总分摊用电量(kWh)" width="170">
          <template slot-scope="{ row }">
            <el-input v-model="row.shareUseElec" type="number" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="尖分摊用电量(kWh)" width="170">
          <template slot-scope="{ row }">
            <el-input v-model="row.shareUseElecPeak" type="number" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="峰分摊用电量(kWh)" width="170">
          <template slot-scope="{ row }">
            <el-input v-model="row.shareUseElecTop" type="number" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="平分摊用电量(kWh)" width="170">
          <template slot-scope="{ row }">
            <el-input v-model="row.shareUseElecFlat" type="number" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="谷分摊用电量(kWh)" width="170">
          <template slot-scope="{ row }">
            <el-input v-model="row.shareUseElecValley" type="number" size="small" />
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!loading" description="暂无数据" />
    </el-card>

    <!-- 备注弹窗 -->
    <el-dialog
      title="填写备注信息"
      :close-on-click-modal="false"
      :visible.sync="remarkDialog"
      width="450px"
      @close="closeDialog"
    >
      <el-form>
        <el-form-item label="备注内容">
          <el-input
            v-model="queryData.remark"
            show-word-limit
            maxlength="50"
            type="textarea"
            clearable
            placeholder="请输入"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="closeDialog">取 消</el-button>
        <el-button type="primary" @click="onSubmit">确 认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import moment from 'moment'
import {
  settleToolsListTenantPrivateMeter,
  settleToolsAddSettleTenantPrivate,
  settleToolsListShareRelate,
  settleToolsAddSettleShare
} from '@/api/adminDb'

export default {
  name: 'OrderToolCreatebill',
  data () {
    return {
      remarkDialog: false,
      tableData: [],
      tenantShareList: [],
      loading: false,
      managerInfoDto: {
        managerName: '',
        tenantName: ''
      },
      managerShareInfoDto: {
        managerName: '',
        shareName: ''
      },
      tableHeaderStyle: {
        background: '#f5f7fa',
        color: '#606266',
        fontWeight: '600'
      },
      queryData: {
        columnName: 'tenement',
        id: '',
        remark: '',
        share: false,
        timeRange: moment().subtract(1, 'days').format('YYYY-MM-DD')
      },
      expireTimeOPtion: {
        disabledDate (time) {
          return time.getTime() > Date.now() - 8.64e7
        }
      }
    }
  },
  methods: {
    onSwitch () {
      this.queryData.id = ''
      this.queryData.remark = ''
      this.tableData = []
      this.tenantShareList = []
    },
    closeDialog () {
      this.remarkDialog = false
    },
    openDialog () {
      if (!this.queryData.id) {
        this.$message.warning(this.queryData.columnName === 'tenement' ? '请输入租户Id' : '请输入公摊组编号')
        return
      }
      this.queryData.remark = ''
      this.remarkDialog = true
    },
    async onSearch () {
      if (!this.queryData.id) {
        this.$message.warning('请输入' + (this.queryData.columnName === 'tenement' ? '租户' : '公摊组') + '号')
        return
      }
      this.loading = true
      try {
        if (this.queryData.columnName === 'tenement') {
          await this.getTableDataTenant()
        } else {
          await this.getTableDataShare()
        }
      } finally {
        this.loading = false
      }
    },
    async getTableDataTenant () {
      const query = { tenantId: this.queryData.id }
      const {
        data: { managerInfoDto, meterBaseInfoDtoList }
      } = await settleToolsListTenantPrivateMeter(query);
      (meterBaseInfoDtoList || []).forEach(item => {
        item.balance = 0
        item.powerAll = 0
        item.powerFlat = 0
        item.powerPeak = 0
        item.powerTop = 0
        item.powerValley = 0
      })
      this.managerInfoDto = managerInfoDto || {}
      this.tableData = meterBaseInfoDtoList || []
    },
    async getTableDataShare () {
      const query = { shareId: this.queryData.id }
      const {
        data: { managerShareInfoDto, meterBaseInfoDtoList, tenantInfoDtoList }
      } = await settleToolsListShareRelate(query);
      (meterBaseInfoDtoList || []).forEach(item => {
        item.balance = 0
        item.powerAll = 0
        item.powerFlat = 0
        item.powerPeak = 0
        item.powerTop = 0
        item.powerValley = 0
      });
      (tenantInfoDtoList || []).forEach(item => {
        item.shareBalance = 0
        item.shareUseElec = 0
        item.shareUseElecPeak = 0
        item.shareUseElecTop = 0
        item.shareUseElecFlat = 0
        item.shareUseElecValley = 0
      })
      this.tableData = meterBaseInfoDtoList || []
      this.managerShareInfoDto = managerShareInfoDto || {}
      this.tenantShareList = tenantInfoDtoList || []
    },
    onSubmit () {
      if (this.queryData.columnName === 'tenement') {
        this.addTableDataTenant()
      } else {
        this.addTableDataShare()
      }
    },
    async addTableDataTenant () {
      const query = {
        tenantId: this.managerInfoDto.tenantId,
        settleDate: this.queryData.timeRange,
        remark: this.queryData.remark,
        settleMeterList: this.tableData.map(item => {
          const obj = { ...item }
          delete obj.meterName
          delete obj.meterSerial
          Object.keys(obj).forEach(k => {
            if (!obj[k]) obj[k] = 0
          })
          return obj
        })
      }
      const { msg } = await settleToolsAddSettleTenantPrivate(query)
      this.$message.success(msg)
      this.remarkDialog = false
    },
    async addTableDataShare () {
      const query = {
        settleDate: this.queryData.timeRange,
        shareId: this.managerShareInfoDto.shareId,
        remark: this.queryData.remark,
        settleMeterList: this.tableData.map(item => {
          const obj = { ...item }
          delete obj.meterName
          delete obj.meterSerial
          Object.keys(obj).forEach(k => {
            if (!obj[k]) obj[k] = 0
          })
          return obj
        }),
        tenantShareList: this.tenantShareList.map(item => {
          const obj = { ...item }
          delete obj.shareRatio
          delete obj.tenantName
          Object.keys(obj).forEach(k => {
            if (!obj[k]) obj[k] = 0
          })
          return obj
        })
      }
      const { msg } = await settleToolsAddSettleShare(query)
      this.$message.success(msg)
      this.remarkDialog = false
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

.filter-card ::v-deep .el-card__body {
  padding: 20px 24px;
}

.table-card ::v-deep .el-card__body {
  padding: 20px 24px;
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
