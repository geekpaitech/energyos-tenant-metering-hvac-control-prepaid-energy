<template>
  <div class="admin-operation-page">
    <!-- 筛选区 -->
    <el-card class="panel-card filter-card" shadow="never">
      <el-form class="filter-form" label-position="top" @submit.native.prevent>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="标题">
              <el-input v-model="queryData.title" clearable placeholder="请输入标题" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="5">
            <el-form-item label="展示状态">
              <el-select v-model="queryData.showStatus" clearable placeholder="请选择展示状态" style="width: 100%">
                <el-option
                  v-for="item in showStatusOptions"
                  :key="String(item.value)"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="filter-actions">
          <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
          <el-button type="primary" plain icon="el-icon-plus" @click="onEdit(false)">新增推文</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 表格区 -->
    <el-card class="panel-card table-card" shadow="never" v-loading="loading">
      <el-table ref="table" :data="tableData" border stripe max-height="72vh">
        <el-table-column label="ID" width="90">
          <template slot-scope="{ row }">{{ row.id }}</template>
        </el-table-column>
        <el-table-column label="标题" min-width="340">
          <template slot-scope="{ row }">
            <span class="ellipsis-text">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column label="地址" width="220">
          <template slot-scope="{ row }">
            <el-popover placement="bottom-start" width="240" trigger="hover" :content="row.url">
              <div slot="reference" class="url">{{ row.url }}</div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="展示状态" width="120" align="center">
          <template slot-scope="{ row }">
            <el-switch
              :value="row.showStatus"
              :active-color="switchColor.active"
              :inactive-color="switchColor.inactive"
              @change="changeSwitch(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="170">
          <template slot-scope="{ row }">{{ row.publishTime }}</template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right" align="center">
          <template slot-scope="{ row }">
            <div class="operation-cell">
              <el-button type="text" @click="onEdit(row)">更改</el-button>
              <el-button type="text" @click="open(row)">查看文章</el-button>
              <el-button type="text" class="danger-text" @click="onDelete(row)">删除</el-button>
            </div>
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

    <Edit :edit-dialog="editDialog" @search="getTableData" />
  </div>
</template>

<script>
import {
  publishArticlePagePublishArticle,
  publishArticleUpdateShowStatus,
  publishArticleDeletePublishArticle
} from '@/api/adminPush'
import Pagination from '@/components/Pagination'
import Edit from './comps/edit.vue'

export default {
  name: 'AdminOperationPushText',
  components: { Pagination, Edit },
  data () {
    return {
      loading: false,
      tableData: [],
      queryData: {
        title: '',
        showStatus: '',
        pageSize: 30,
        total: 0,
        current: 1
      },
      showStatusOptions: [
        { label: '展示', value: true },
        { label: '不展示', value: false }
      ],
      switchColor: {
        active: '#47B881',
        inactive: '#C9CDD4'
      },
      editDialog: {
        show: false,
        type: false,
        data: {}
      }
    }
  },
  created () {
    this.getTableData()
  },
  methods: {
    onEdit (row) {
      if (row) {
        this.editDialog.data = row
        this.editDialog.type = true
      } else {
        this.editDialog.data = {}
        this.editDialog.type = false
      }
      this.editDialog.show = true
    },
    async changeSwitch (row) {
      try {
        await this.$confirm('确认修改状态？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const query = {
          id: row.id,
          showStatus: !row.showStatus
        }
        const { msg } = await publishArticleUpdateShowStatus(query)
        this.$message.success(msg)
        this.getTableData()
      } catch (e) { /* cancelled */ }
    },
    async onDelete (row) {
      try {
        await this.$confirm('确认删除？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        const { msg } = await publishArticleDeletePublishArticle({ id: row.id })
        this.$message.success(msg)
        this.getTableData()
      } catch (e) { /* cancelled */ }
    },
    open (row) {
      window.open(row.url, '_blank')
    },
    async getTableData () {
      this.loading = true
      try {
        const query = {
          title: this.queryData.title,
          showStatus: this.queryData.showStatus,
          page: {
            current: this.queryData.current,
            size: this.queryData.pageSize,
            orders: [
              { asc: false, column: 'publishTime' }
            ]
          }
        }
        const { data: { dataList, total } } = await publishArticlePagePublishArticle(query)
        this.tableData = dataList || []
        this.queryData.total = total
      } finally {
        this.loading = false
      }
    },
    onSearch () {
      this.queryData.current = 1
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

.url {
  width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.operation-cell {
  white-space: nowrap;
}

.danger-text {
  color: #f56c6c;
}
</style>
