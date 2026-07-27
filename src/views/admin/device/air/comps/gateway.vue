<template>
  <el-dialog title="网关配置" :visible.sync="gatewayDialog.show" width="1300px" :close-on-click-modal="false" append-to-body @open="initDialog">
    <el-form inline>
      <el-form-item label="网关名称/编号">
        <el-select v-model="query.addr" filterable clearable style="width: 240px" @change="onSearch">
          <el-option v-for="item in gatewayOptions" :key="item.addr" :label="item.unite" :value="item.addr" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-plus" @click="onAdd">新增</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="tableData" v-loading="loading" border height="60vh">
      <el-table-column prop="id" label="网关编号" width="90" />
      <el-table-column prop="addr" label="网关MAC" width="120" />
      <el-table-column label="网关状态" width="110"><template slot-scope="scope">{{ airStatus[scope.row.onlineStatus] ? airStatus[scope.row.onlineStatus].label : '-' }}</template></el-table-column>
      <el-table-column prop="name" label="网关名称" width="220" />
      <el-table-column label="网关品牌" width="110"><template slot-scope="scope">{{ channelLabel(scope.row.mfrsNo) }}</template></el-table-column>
      <el-table-column label="项目信息" min-width="220"><template slot-scope="scope">({{ scope.row.managerId }}){{ scope.row.managerName }}</template></el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="140">
        <template slot-scope="scope">
          <div class="gateway-table-actions">
            <el-button type="text" @click="onEdit(scope.row)">编辑</el-button>
            <el-button type="text" @click="onDelete(scope.row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <div style="margin-top: 12px; text-align: right">
      <el-pagination :current-page="query.current" :page-size="query.pageSize" :total="query.total" layout="total, prev, pager, next, sizes" :page-sizes="[30,50,100]" @current-change="onPageChange" @size-change="onSizeChange" />
    </div>
    <GatewayEdit :edit-dialog="editDialog" @search="onSearch" />
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import { airGatewayPageAirGateWay, airGatewayDelete, airGatewayAirGateWayList } from '@/api/adminapi'
import GatewayEdit from './gatewayEdit.vue'

export default {
  components: { GatewayEdit },
  props: { gatewayDialog: { type: Object, required: true } },
  data () {
    return {
      loading: false,
      query: { addr: '', managerId: '', current: 1, pageSize: 30, total: 0 },
      tableData: [],
      gatewayOptions: [],
      editDialog: { show: false, type: false, data: {} }
    }
  },
  computed: {
    ...mapState({
      airStatus: state => state.adminAirEnum.airStatus
    })
  },
  methods: {
    channelLabel (val) {
      if (val === 'DMR' || val === 1 || val === '1') return '德姆瑞'
      if (val === 'FY' || val === 2 || val === '2') return '飞奕'
      return '-'
    },
    async initDialog () {
      // admin 后台看全量，不带 managerId 过滤
      this.query.managerId = ''
      await this.loadGatewayOptions()
      await this.onSearch()
    },
    async loadGatewayOptions () {
      const res = await airGatewayAirGateWayList({ addr: '', managerId: '' })
      this.gatewayOptions = (res.data || []).map(item => ({ ...item, unite: item.name ? `(${item.id})${item.name}` : String(item.id) }))
    },
    async onSearch () {
      this.query.current = 1
      await this.fetchTable()
    },
    async fetchTable () {
      this.loading = true
      try {
        const res = await airGatewayPageAirGateWay({
          addr: this.query.addr,
          managerId: this.query.managerId,
          page: { current: this.query.current, size: this.query.pageSize }
        })
        const body = res.data || {}
        this.query.total = body.total || 0
        this.tableData = body.dataList || []
      } finally {
        this.loading = false
      }
    },
    onAdd () { this.editDialog = { show: true, type: false, data: {} } },
    onEdit (row) { this.editDialog = { show: true, type: true, data: row } },
    async onDelete (row) {
      await this.$confirm('确认删除网关?', '提示', { type: 'warning' })
      const res = await airGatewayDelete({ id: row.id })
      this.$message.success(res.msg || '删除成功')
      await this.fetchTable()
    },
    onPageChange (page) { this.query.current = page; this.fetchTable() },
    onSizeChange (size) { this.query.pageSize = size; this.query.current = 1; this.fetchTable() }
  }
}
</script>

<style scoped>
.gateway-table-actions {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.gateway-table-actions .el-button + .el-button {
  margin-left: 12px;
}
</style>
