<template>
  <div class="admin-operation-page">
    <el-card class="panel-card table-card" shadow="never" v-loading="loading">
      <el-table ref="table" :data="tableData" border stripe max-height="78vh">
        <el-table-column label="code" width="90">
          <template slot-scope="{ row }">{{ row.code }}</template>
        </el-table-column>
        <el-table-column label="事件名称" width="200">
          <template slot-scope="{ row }">
            <span class="ellipsis-text">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="事件类型" width="100" align="center">
          <template slot-scope="{ row }">
            {{ msgTypeRead[row.type] ? msgTypeRead[row.type].label : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="推送开关" align="center">
          <el-table-column label="总开关" width="90" align="center">
            <template slot-scope="{ row }">
              <el-switch
                v-model="row.enableSwitch"
                :active-color="switchColor.active"
                :inactive-color="switchColor.inactive"
                :active-value="true"
                :inactive-value="false"
                @change="changeSwitch(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="公众号推送" width="100" align="center">
            <template slot-scope="{ row }">
              <el-switch
                v-model="row.wxPushSwitch"
                :active-color="switchColor.active"
                :inactive-color="switchColor.inactive"
                :active-value="true"
                :inactive-value="false"
                @change="changeSwitch(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="短信推送" width="90" align="center">
            <template slot-scope="{ row }">
              <el-switch
                v-model="row.smsPushSwitch"
                :active-color="switchColor.active"
                :inactive-color="switchColor.inactive"
                :active-value="true"
                :inactive-value="false"
                @change="changeSwitch(row)"
              />
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="推送对象" align="center">
          <el-table-column label="系统管理员" width="100" align="center">
            <template slot-scope="{ row }">
              <el-switch
                v-model="row.sysAdminSwitch"
                :active-color="switchColor.active"
                :inactive-color="switchColor.inactive"
                :active-value="true"
                :inactive-value="false"
                @change="changeSwitch(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="系统财务" width="90" align="center">
            <template slot-scope="{ row }">
              <el-switch
                v-model="row.sysFinanceSwitch"
                :active-color="switchColor.active"
                :inactive-color="switchColor.inactive"
                :active-value="true"
                :inactive-value="false"
                @change="changeSwitch(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="项目绑定列表" width="110" align="center">
            <template slot-scope="{ row }">
              <el-switch
                v-model="row.managerSwitch"
                :active-color="switchColor.active"
                :inactive-color="switchColor.inactive"
                :active-value="true"
                :inactive-value="false"
                @change="changeSwitch(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="租户绑定列表" width="110" align="center">
            <template slot-scope="{ row }">
              <el-switch
                v-model="row.tenantSwitch"
                :active-color="switchColor.active"
                :inactive-color="switchColor.inactive"
                :active-value="true"
                :inactive-value="false"
                @change="changeSwitch(row)"
              />
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template slot-scope="{ row }">
            <div class="operation-cell">
              <el-button type="text" @click="onUpData(row)">修改</el-button>
              <el-button type="text" @click="onShield(row)">屏蔽名单</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <Updata :dialog-data="updataDialog" @search="getTableData" />
    <Shield :shield-dialog="shieldDialog" />
  </div>
</template>

<script>
import { msgListMsgConfig, msgUpdateMsgConfig } from '@/api/adminPush'
import Updata from './comps/updata.vue'
import Shield from './comps/shield.vue'

export default {
  name: 'AdminOperationConfigMessage',
  components: { Updata, Shield },
  data () {
    return {
      loading: false,
      tableData: [],
      updataDialog: {
        show: false,
        data: {}
      },
      shieldDialog: {
        show: false,
        code: ''
      },
      msgTypeRead: {
        '1': { label: '通知', value: '1' },
        '2': { label: '审核', value: '2' },
        '3': { label: '报警', value: '3' }
      },
      switchColor: {
        active: '#47B881',
        inactive: '#C9CDD4'
      }
    }
  },
  created () {
    this.getTableData()
  },
  methods: {
    async getTableData () {
      this.loading = true
      try {
        const { data } = await msgListMsgConfig()
        this.tableData = data || []
      } finally {
        this.loading = false
      }
    },
    async changeSwitch (data) {
      try {
        await this.$confirm('是否更改权限？', '提示', { type: 'warning' })
        const { msg } = await msgUpdateMsgConfig(data)
        this.$message.success(msg)
        this.getTableData()
      } catch (e) {
        this.getTableData()
      }
    },
    onUpData (data) {
      this.updataDialog.data = data
      this.updataDialog.show = true
    },
    onShield (data) {
      this.shieldDialog.code = data.code
      this.shieldDialog.show = true
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

  ::v-deep .el-card__body {
    padding: 20px 24px;
  }
}

.ellipsis-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.operation-cell {
  white-space: nowrap;
}
</style>
