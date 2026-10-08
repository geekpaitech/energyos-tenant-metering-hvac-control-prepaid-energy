<template>
  <el-drawer
    title="消息明细"
    :visible.sync="codeDrawer.show"
    size="80%"
    @close="closeDialog"
    @open="openDialod"
  >
    <div class="code-body">
      <div class="toolbar">
        <el-button icon="el-icon-download" @click="btnExport('table')">导出</el-button>
      </div>
      <el-table ref="table" :data="tableData" border max-height="76vh">
        <el-table-column label="ID">
          <template slot-scope="{ row }">{{ row.rid }}</template>
        </el-table-column>
        <el-table-column label="时间" width="160">
          <template slot-scope="{ row }">{{ row.occurTime }}</template>
        </el-table-column>
        <el-table-column label="管理方ID">
          <template slot-scope="{ row }">{{ row.managerId }}</template>
        </el-table-column>
        <el-table-column label="管理方" width="300">
          <template slot-scope="{ row }">{{ row.managerName }}</template>
        </el-table-column>
        <el-table-column label="序列号" width="160">
          <template slot-scope="{ row }">{{ row.serial }}</template>
        </el-table-column>
        <el-table-column label="总有功率p">
          <template slot-scope="{ row }">{{ row.p }}</template>
        </el-table-column>
        <el-table-column label="Pa">
          <template slot-scope="{ row }">{{ row.pa }}</template>
        </el-table-column>
        <el-table-column label="Pb">
          <template slot-scope="{ row }">{{ row.pb }}</template>
        </el-table-column>
        <el-table-column label="Pc">
          <template slot-scope="{ row }">{{ row.pc }}</template>
        </el-table-column>
        <el-table-column label="三相功率">
          <template slot-scope="{ row }">{{ row.sumPaPbPc }}</template>
        </el-table-column>
        <el-table-column label="功率差值">
          <template slot-scope="{ row }">{{ row.diffP }}</template>
        </el-table-column>
        <el-table-column label="差值占比">
          <template slot-scope="{ row }">{{ (row.diffPercent * 100).toFixed(2) }}%</template>
        </el-table-column>
        <el-table-column label="异常相位">
          <template slot-scope="{ row }">{{ row.errorPhase }}</template>
        </el-table-column>
      </el-table>
      <Pagination
        :total="queryData.total"
        :page="queryData.current"
        :limit="queryData.pageSize"
        :page-sizes="[100, 200, 500, 1000]"
        @pagination="handPageChange"
      />
    </div>
  </el-drawer>
</template>

<script>
import { msgDetailSumUnequalDetail } from '@/api/adminPush'
import Pagination from '@/components/Pagination'

export default {
  name: 'AdminOperationPushMessageCode111',
  components: { Pagination },
  props: {
    codeDrawer: {
      type: Object,
      default () {
        return { show: false, id: '' }
      }
    }
  },
  data () {
    return {
      tableData: [],
      queryData: {
        current: 1,
        pageSize: 100,
        total: 0
      }
    }
  },
  methods: {
    openDialod () {
      this.getTableData()
    },
    closeDialog () {
      this.codeDrawer.show = false
    },
    async getTableData () {
      const { data: { dataList, total } } = await msgDetailSumUnequalDetail({
        outEventId: this.codeDrawer.id,
        page: {
          current: this.queryData.current,
          size: this.queryData.pageSize,
          orders: [{ asc: false, column: 'tenantBalance' }]
        }
      })
      this.tableData = dataList || []
      this.queryData.total = total
    },
    btnExport (eid) {
      const ele = this.$refs[eid].$el
      const params = {
        ele,
        name: '明细导出.xlsx',
        data: this.tableData
      }
      this.$store.dispatch('export/export', params)
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
.code-body {
  padding: 0 20px;
}

.toolbar {
  margin-bottom: 12px;
}
</style>
