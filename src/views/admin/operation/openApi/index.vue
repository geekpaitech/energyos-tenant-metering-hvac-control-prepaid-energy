<template>
  <div class="admin-openapi-page">
    <div class="table-header-bar">
      <el-button type="primary" icon="el-icon-plus" @click="onEdit(null)">新增</el-button>
      <el-button icon="el-icon-refresh" @click="onRefresh">刷新缓存</el-button>
    </div>

    <el-card class="panel-card table-card" shadow="never" v-loading="loading">
      <el-table ref="table" :data="tableData" border stripe max-height="75vh">
        <el-table-column label="ID" width="90">
          <template slot-scope="{ row }">{{ row.id }}</template>
        </el-table-column>
        <el-table-column label="权限名" min-width="220">
          <template slot-scope="{ row }">{{ row.name }}</template>
        </el-table-column>
        <el-table-column label="appKey" min-width="280">
          <template slot-scope="{ row }">{{ row.appKey }}</template>
        </el-table-column>
        <el-table-column label="appSecret" min-width="280">
          <template slot-scope="{ row }">
            <div v-if="row.isClose" class="secret-cell" @click="row.isClose = false">
              <span>******</span><i class="el-icon-view secret-eye" />
            </div>
            <span v-else class="secret-text" @click="row.isClose = true">{{ row.appSecret }}</span>
          </template>
        </el-table-column>
        <el-table-column label="权限类型" min-width="280">
          <template slot-scope="{ row }">{{ row.permissionListLabel }}</template>
        </el-table-column>
        <el-table-column label="项目权限" width="100" align="center">
          <template slot-scope="{ row }">
            <el-popover
              v-if="row.managerList && row.managerList.length"
              width="400"
              trigger="hover"
            >
              <el-table :data="row.managerList" size="mini" border>
                <el-table-column property="managerId" width="100" label="项目ID" />
                <el-table-column property="managerName" label="项目名称" />
              </el-table>
              <el-button slot="reference" type="text">{{ row.managerList.length }}</el-button>
            </el-popover>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column label="租户权限" width="100" align="center">
          <template slot-scope="{ row }">
            <el-popover
              v-if="row.tenantList && row.tenantList.length"
              width="400"
              trigger="hover"
            >
              <el-table :data="row.tenantList" size="mini" border>
                <el-table-column property="tenantId" width="100" label="租户ID" />
                <el-table-column property="tenantName" label="租户名称" />
              </el-table>
              <el-button slot="reference" type="text">{{ row.tenantList.length }}</el-button>
            </el-popover>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template slot-scope="{ row }">{{ row.createTime }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" @click="onEdit(row)">修改</el-button>
            <el-button type="text" style="color:#f56c6c" @click="onDelete(row)">删除</el-button>
            <el-button type="text" @click="onCopy(row)">复制</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <Edit :edit-dialog="editDialog" @search="getTableData" />
  </div>
</template>

<script>
import { webauthList, webRemoveAuth } from '@/api/adminDb'
import Edit from './comps/edit.vue'

export default {
  name: 'AdminOperationOpenApi',
  components: { Edit },
  data () {
    return {
      loading: false,
      refresh: false,
      tableData: [],
      editDialog: { show: false, data: {}, type: false },
      permissionTypeRead: {}
    }
  },
  async created () {
    this.permissionTypeRead = {
      '1': { label: '读取', value: '1' },
      '2': { label: '写入', value: '2' },
      '3': { label: '管理', value: '3' }
    }
    this.getTableData()
  },
  methods: {
    onRefresh () {
      this.refresh = true
      this.getTableData()
    },
    onEdit (row) {
      if (row) {
        this.editDialog.type = true
        this.editDialog.data = { ...row }
      } else {
        this.editDialog.type = false
        this.editDialog.data = {}
      }
      this.editDialog.show = true
    },
    async onDelete (row) {
      try {
        await this.$confirm('确认删除权限?', '提示', { type: 'warning' })
        const { msg } = await webRemoveAuth({ id: row.id })
        this.$message.success(msg)
        this.getTableData()
      } catch (e) { /* cancelled */ }
    },
    async onCopy (row) {
      try {
        let text = '权限名：' + row.name +
          '\nappKey：' + row.appKey +
          '\nappSecret：' + row.appSecret +
          '\n权限类型：' + row.permissionListLabel +
          '\n绑定权限：'
        ;(row.managerList || []).forEach((item, i) => {
          text += '\n' + (i + 1) + '、(' + item.managerId + ')' + item.managerName
          ;(row.tenantList || []).forEach(itm => {
            if (itm.managerId === item.managerId) {
              text += '\n     租户：(' + itm.tenantId + ')' + itm.tenantName
            }
          })
        })
        await navigator.clipboard.writeText(text)
        this.$message.success('复制成功')
      } catch (err) {
        this.$message.error('复制失败')
      }
    },
    async getTableData () {
      this.loading = true
      try {
        const { data } = await webauthList({ refresh: this.refresh })
        const list = (data || []).map(item => {
          item.permissionListLabel = (item.permissionList && item.permissionList.length)
            ? item.permissionList.map(v => {
              const m = this.permissionTypeRead[v]
              return m ? m.label : 'null'
            }).join(',')
            : '-'
          item.isClose = true
          item.tenantList = item.tenantList || []
          return item
        })
        this.tableData = list
        this.refresh = false
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-openapi-page {
  padding: 16px 20px 24px;
  min-height: calc(100vh - 100px);
  background: #f0f2f5;
}

.table-header-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.panel-card {
  border: none;
  border-radius: 8px;

  ::v-deep .el-card__body {
    padding: 20px 24px;
  }
}

.secret-cell {
  display: flex;
  align-items: center;
  cursor: pointer;

  .secret-eye {
    margin-left: 8px;
    display: none;
  }

  &:hover .secret-eye {
    display: inline;
  }
}

.secret-text {
  cursor: pointer;
}
</style>
