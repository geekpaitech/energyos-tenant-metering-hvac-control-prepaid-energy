<template>
  <div class="admin-operation-page">
    <!-- 消息类型 Tab -->
    <div class="msg-tabs">
      <div
        v-for="item in MsgType"
        :key="item.value"
        :class="queryData.type === item.value ? 'msg-tab-on' : 'msg-tab-off'"
        @click="changeBar(item.value)"
      >
        {{ item.label }}({{ msgNum[item.value] }})
      </div>
    </div>

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
                style="width: 100%"
                @change="onManagerChange"
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
            <el-form-item label="租户名称/编号">
              <el-select
                v-model="queryData.tenantId"
                filterable
                clearable
                placeholder="租户名称或编号"
                style="width: 100%"
              >
                <el-option
                  v-for="item in tenantList"
                  :key="item.id"
                  :label="item.unite"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="7">
            <el-form-item label="日期">
              <el-date-picker
                v-model="queryData.timeRange"
                type="daterange"
                value-format="yyyy-MM-dd"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="4">
            <el-form-item label="消息类型">
              <el-select
                v-model="queryData.code"
                clearable
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option
                  v-for="item in dataType"
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
        </div>
      </el-form>
    </el-card>

    <!-- 表格区 -->
    <el-card class="panel-card table-card" shadow="never" v-loading="loading">
      <el-table ref="table" :data="tableData" border stripe max-height="66vh">
        <el-table-column label="消息ID" width="100">
          <template slot-scope="{ row }">{{ row.rid }}</template>
        </el-table-column>
        <el-table-column label="消息类型" width="220">
          <template slot-scope="{ row }">
            <span class="ellipsis-text">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="租户信息" min-width="340">
          <template slot-scope="{ row }">
            <span class="ellipsis-text">{{ row.tenantId ? `(${row.tenantId})${row.tenantName}` : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="项目信息" min-width="340">
          <template slot-scope="{ row }">
            <span class="ellipsis-text">{{ row.managerId ? `(${row.managerId})${row.managerName}` : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="200">
          <template slot-scope="{ row }">{{ row.occurTime }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" @click="onDetail(row)">详情</el-button>
            <el-button v-if="code.indexOf(row.code) !== -1" type="text" @click="onCode(row)">明细</el-button>
          </template>
        </el-table-column>
      </el-table>
      <Pagination
        :total="queryData.total"
        :page="queryData.current"
        :limit="queryData.pageSize"
        :page-sizes="[10, 20, 30, 50]"
        @pagination="handPageChange"
      />
    </el-card>

    <Detail :detail-drawer="detailDrawer" />
    <Code111 :code-drawer="codeDrawer[111]" />
    <Code113 :code-drawer="codeDrawer[113]" />
    <Code114 :code-drawer="codeDrawer[114]" />
    <Code116 :code-drawer="codeDrawer[116]" />
    <Code110 :code-drawer="codeDrawer[110]" />
    <Code107 :code-drawer="codeDrawer[107]" />
    <Code140 :code-drawer="codeDrawer[140]" />
  </div>
</template>

<script>
import moment from 'moment'
import { msgPageMsg, msgQueryMsgCodeName, msgQueryMsgTypeCount } from '@/api/adminPush'
import { adminDbGetManagerListByUser, adminDbGetSimpleTenantList } from '@/api/adminDb'
import { mapManagerOptions, mapTenantOptions } from '@/views/admin/device/meter/utils'
import Pagination from '@/components/Pagination'
import Detail from './comps/detail.vue'
import Code111 from './codes/code111.vue'
import Code113 from './codes/code113.vue'
import Code114 from './codes/code114.vue'
import Code116 from './codes/code116.vue'
import Code110 from './codes/code110.vue'
import Code107 from './codes/code107.vue'
import Code140 from './codes/code140.vue'

export default {
  name: 'AdminOperationPushMessage',
  components: {
    Pagination,
    Detail,
    Code111,
    Code113,
    Code114,
    Code116,
    Code110,
    Code107,
    Code140
  },
  data () {
    return {
      loading: false,
      tableData: [],
      managerNames: [],
      tenantList: [],
      MsgType: [
        { label: '通知', value: '1' },
        { label: '审核', value: '2' },
        { label: '报警', value: '3' }
      ],
      msgNum: {
        '1': 0,
        '2': 0,
        '3': 0
      },
      dataType: [],
      code: [111, 113, 114, 116, 110, 107, 140],
      detailDrawer: {
        show: false,
        data: {},
        type: true
      },
      codeDrawer: {
        111: { id: '', show: false },
        113: { id: '', show: false },
        114: { id: '', show: false },
        116: { id: '', show: false },
        110: { id: '', show: false },
        107: { id: '', show: false },
        140: { id: '', show: false }
      },
      queryData: {
        id: '',
        type: '1',
        managerId: '',
        code: '',
        tenantId: '',
        timeRange: [
          moment().subtract(7, 'days').format('YYYY-MM-DD'),
          moment().format('YYYY-MM-DD')
        ],
        current: 1,
        pageSize: 30,
        total: 0
      }
    }
  },
  created () {
    if (this.$route.query.type) {
      this.queryData.type = this.$route.query.type
      this.queryData.code = (this.$route.query.code || '') + ''
    }
    this.loadManagers()
    this.getMsgNum()
    this.getDataType()
    this.getTableData()
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
    async loadTenants (managerId) {
      if (!managerId) {
        this.tenantList = []
        return
      }
      try {
        const { data } = await adminDbGetSimpleTenantList({ managerId, tenantStatus: 0 })
        const list = Array.isArray(data) ? data : (data?.dataList || data?.list || [])
        this.tenantList = mapTenantOptions(list)
      } catch (e) {
        this.tenantList = []
      }
    },
    onManagerChange (managerId) {
      this.queryData.tenantId = ''
      this.loadTenants(managerId)
    },
    async getMsgNum () {
      try {
        const { data } = await msgQueryMsgTypeCount({})
        this.msgNum = {
          '1': data?.noticeCount || 0,
          '2': data?.auditCount || 0,
          '3': data?.alarmCount || 0
        }
      } catch (e) {
        this.msgNum = { '1': 0, '2': 0, '3': 0 }
      }
    },
    async getDataType () {
      try {
        const { data } = await msgQueryMsgCodeName({ type: this.queryData.type })
        this.dataType = []
        for (var key in data) {
          this.dataType.push({ label: data[key], value: key })
        }
      } catch (e) {
        this.dataType = []
      }
    },
    onCode (row) {
      if (this.codeDrawer[row.code]) {
        this.codeDrawer[row.code].show = true
        this.codeDrawer[row.code].id = row.outEventId
      } else {
        this.$message.error('服务器繁忙，请稍后再试')
      }
    },
    changeBar (val) {
      if (val !== this.queryData.type) {
        this.queryData.type = val
        this.queryData.code = ''
        this.queryData.tenantId = ''
        this.queryData.managerId = ''
        this.tenantList = []
        this.onSearch()
      }
    },
    async getTableData () {
      this.loading = true
      try {
        const queryData = {
          startTime: this.queryData.timeRange ? this.queryData.timeRange[0] + ' 00:00:00' : '',
          endTime: this.queryData.timeRange ? this.queryData.timeRange[1] + ' 23:59:59' : '',
          type: this.queryData.type,
          code: this.queryData.code,
          tenantId: this.queryData.tenantId,
          managerId: this.queryData.managerId,
          page: {
            current: this.queryData.current,
            size: this.queryData.pageSize,
            orders: [
              { asc: false, column: 'rid' }
            ]
          }
        }
        const { data: { dataList, total } } = await msgPageMsg(queryData)
        this.tableData = dataList || []
        this.queryData.total = total
      } finally {
        this.loading = false
      }
    },
    onDetail (data) {
      this.detailDrawer.show = true
      this.detailDrawer.data = data
    },
    async onSearch () {
      this.queryData.current = 1
      this.getMsgNum()
      this.getDataType()
      this.getTableData()
    },
    handPageChange ({ page, limit }) {
      this.queryData.current = page
      this.queryData.pageSize = limit
      this.getTableData()
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

.msg-tabs {
  display: flex;
  width: 480px;
  border: 1px solid #409eff;
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: hidden;
}

.msg-tab-on,
.msg-tab-off {
  flex: 1;
  height: 40px;
  line-height: 40px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.msg-tab-on {
  color: #fff;
  background: #409eff;
}

.msg-tab-off {
  color: #409eff;
  background: #fff;
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

.ellipsis-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
