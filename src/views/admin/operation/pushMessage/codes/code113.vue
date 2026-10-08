<template>
  <el-drawer
    title="消息明细"
    :visible.sync="codeDrawer.show"
    size="95%"
    @close="closeDialog"
    @open="openDialod"
  >
    <div class="code-body">
      <el-table ref="table" :data="tableData" border max-height="78vh">
        <el-table-column label="ID" width="80">
          <template slot-scope="{ row }">{{ row.rid }}</template>
        </el-table-column>
        <el-table-column label="时间" width="155">
          <template slot-scope="{ row }">{{ row.occurTime }}</template>
        </el-table-column>
        <el-table-column label="管理方ID" width="80">
          <template slot-scope="{ row }">{{ row.managerId }}</template>
        </el-table-column>
        <el-table-column label="管理方">
          <template slot-scope="{ row }">{{ row.managerName }}</template>
        </el-table-column>
        <el-table-column label="序列号" width="140">
          <template slot-scope="{ row }">{{ row.serial }}</template>
        </el-table-column>
        <el-table-column label="电表名称">
          <template slot-scope="{ row }">{{ row.meterName }}</template>
        </el-table-column>
        <el-table-column label="结算记录id">
          <template slot-scope="{ row }">{{ row.settleMeterId }}</template>
        </el-table-column>
        <el-table-column label="电表结算金额(元)">
          <template slot-scope="{ row }">{{ formatMoney(row.balance) }}</template>
        </el-table-column>
        <el-table-column label="校验结算金额(元)">
          <template slot-scope="{ row }">{{ formatMoney(row.calcBalance) }}</template>
        </el-table-column>
        <el-table-column label="金额差值(元)">
          <template slot-scope="{ row }">{{ formatMoney(row.subBalance) }}</template>
        </el-table-column>
        <el-table-column label="电量(尖/峰/平/谷)" width="200">
          <template slot-scope="{ row }">
            {{ row.useElecPeak }}/{{ row.useElecTop }}/{{ row.useElecFlat }}/{{ row.useElecValley }}
          </template>
        </el-table-column>
        <el-table-column label="电价(尖/峰/平/谷)" width="210">
          <template slot-scope="{ row }">
            {{ row.powerPeakPrice }}/{{ row.powerTopPrice }}/{{ row.powerFlatPrice }}/{{ row.powerValleyPrice }}
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
    </div>
  </el-drawer>
</template>

<script>
import { msgDetailElecBalanceUnequalDetail } from '@/api/adminPush'
import Pagination from '@/components/Pagination'

export default {
  name: 'AdminOperationPushMessageCode113',
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
        pageSize: 30,
        total: 0
      }
    }
  },
  methods: {
    formatMoney (v) {
      if (v === null || v === undefined || v === '') return '-'
      const n = Number(v)
      if (isNaN(n)) return v
      return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    openDialod () {
      this.getTableData()
    },
    closeDialog () {
      this.codeDrawer.show = false
    },
    async getTableData () {
      const { data: { dataList, total } } = await msgDetailElecBalanceUnequalDetail({
        outEventId: this.codeDrawer.id,
        page: {
          current: this.queryData.current,
          size: this.queryData.pageSize,
          orders: [{ asc: false, column: 'occurTime' }]
        }
      })
      this.tableData = dataList || []
      this.queryData.total = total
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
</style>
