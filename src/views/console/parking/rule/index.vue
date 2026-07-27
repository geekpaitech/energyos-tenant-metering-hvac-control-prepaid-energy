<template>
  <div class="table-page-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-card class="search-card" shadow="never">
        <el-form
          :model="queryData"
          ref="searchForm"
          class="search-form compact-form"
          label-position="left"
          label-width="80px"
        >
          <el-row :gutter="16" class="search-row">
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="车牌号" prop="plateNumber" class="compact-form-item">
                <el-input
                  v-model="queryData.plateNumber"
                  placeholder="请输入车牌号"
                  clearable
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="租户" prop="tenantId" class="compact-form-item">
                <el-select
                  v-model="queryData.tenantId"
                  placeholder="请选择租户"
                  clearable
                  filterable
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in tenantList"
                    :key="item.tenantId"
                    :label="formatTenantOptionLabel(item)"
                    :value="item.tenantId"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <div class="form-actions compact-actions">
            <div class="action-left">
              <el-button
                type="primary"
                icon="el-icon-plus"
                size="small"
                :disabled="!currentManagerId"
                @click="handleAdd"
              >
                新增车辆
              </el-button>
            </div>
            <div class="action-right">
              <el-button
                type="primary"
                icon="el-icon-search"
                size="small"
                :disabled="!currentManagerId"
                @click="handleSearch"
              >
                查询
              </el-button>
              <el-button icon="el-icon-refresh" size="small" @click="handleReset">
                重置
              </el-button>
            </div>
          </div>
        </el-form>
      </el-card>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <div class="table-card" shadow="never">
        <el-table
          v-loading="loading"
          :data="tableData"
          :max-height="tableMaxHeight"
          stripe
          style="width: 100%"
          class="custom-table"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }"
        >
          <el-table-column
            prop="plateNumber"
            label="车牌号"
            min-width="120"
            align="center"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              <span
                style="color: #409eff; cursor: pointer; font-weight: 500"
                @click="handleDetail(scope.row)"
              >
                {{ scope.row.plateNumber || '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            prop="phone"
            label="联系手机号"
            min-width="120"
            align="center"
            show-overflow-tooltip
          />
          <el-table-column label="租户" min-width="160" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ formatTenantName(scope.row.tenantId) }}
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="开始日期" width="120" align="center" />
          <el-table-column prop="expireDate" label="到期日期" width="120" align="center" />
          <el-table-column label="审核状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="getAuditStatusTagType(scope.row.auditStatus)" size="small">
                {{ getAuditStatusLabel(scope.row.auditStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="启用状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="数据来源" width="110" align="center">
            <template slot-scope="scope">
              <el-tag :type="getSourceTagType(scope.row.source)" size="small" effect="plain">
                {{ getSourceLabel(scope.row.source) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="remark"
            label="备注"
            min-width="140"
            align="center"
            show-overflow-tooltip
          />
          <el-table-column prop="createTime" label="创建时间" width="168" align="center" />
          <el-table-column prop="updateTime" label="更新时间" width="168" align="center" />
          <el-table-column label="操作" width="120" fixed="right" align="center">
            <template slot-scope="scope">
              <div class="table-actions-group table-actions-nowrap">
                <el-button type="text" size="small" @click="handleDetail(scope.row)">
                  详情
                </el-button>
                <!-- 暂时关闭修改，需要时放开 -->
                <!-- <el-button type="text" size="small" @click="handleEdit(scope.row)">
                  修改
                </el-button> -->
                <el-button type="text" size="small" class="text-danger" @click="handleDelete(scope.row)">
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        :current-page="pageData.current"
        :page-sizes="[15, 30, 60, 100]"
        :page-size="pageData.size"
        :total="pageData.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增弹窗（编辑能力暂时关闭，见 handleEdit / handleSave 内注释） -->
    <el-dialog
      title="新增车辆"
      :visible.sync="dialogVisible"
      width="640px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form ref="editForm" :model="editForm" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车牌号" prop="plateNumber">
              <el-input
                v-model="editForm.plateNumber"
                placeholder="请输入车牌号"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系手机号" prop="phone">
              <el-input v-model="editForm.phone" placeholder="请输入手机号" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="租户" prop="tenantId">
              <el-select
                v-model="editForm.tenantId"
                placeholder="请选择租户"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="item in tenantList"
                  :key="item.tenantId"
                  :label="formatTenantOptionLabel(item)"
                  :value="item.tenantId"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker
                v-model="editForm.startDate"
                type="date"
                placeholder="选择开始日期"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到期日期" prop="expireDate">
              <el-date-picker
                v-model="editForm.expireDate"
                type="date"
                placeholder="选择到期日期"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="editForm.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog
      title="车辆详情"
      :visible.sync="detailDialogVisible"
      width="720px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <div class="detail-content" v-if="detailData">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>车牌号：</label>
              <span>{{ detailData.plateNumber || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>联系手机号：</label>
              <span>{{ detailData.phone || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>租户：</label>
              <span>{{ formatTenantName(detailData.tenantId) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>管理方ID：</label>
              <span>{{ detailData.managerId || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>开始日期：</label>
              <span>{{ detailData.startDate || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>到期日期：</label>
              <span>{{ detailData.expireDate || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <label>审核状态：</label>
              <span>{{ getAuditStatusLabel(detailData.auditStatus) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>启用状态：</label>
              <span>{{ getStatusLabel(detailData.status) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>数据来源：</label>
              <span>{{ getSourceLabel(detailData.source) }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>创建时间：</label>
              <span>{{ detailData.createTime || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>更新时间：</label>
              <span>{{ detailData.updateTime || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <div class="detail-item">
              <label>备注：</label>
              <span>{{ detailData.remark || '无' }}</span>
            </div>
          </el-col>
        </el-row>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  tenantVehiclePage,
  tenantVehicleCreate,
  // tenantVehicleUpdate, // 暂时关闭修改，需要时放开
  tenantVehicleDelete
} from '@/api/parking'
import { getSimpleTenantList } from '@/api/useReport'

export default {
  name: 'ParkingFee',
  data () {
    return {
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68
      },
      queryData: {
        plateNumber: '',
        tenantId: null
      },
      tenantList: [],
      tableData: [],
      loading: false,
      submitting: false,
      pageData: {
        current: 1,
        size: 15,
        total: 0
      },
      dialogVisible: false,
      detailDialogVisible: false,
      editForm: {
        id: null,
        plateNumber: '',
        phone: '',
        tenantId: null,
        startDate: '',
        expireDate: '',
        remark: '',
        auditStatus: 1,
        managerId: null,
        source: 2,
        status: 0
      },
      detailData: null,
      rules: {
        plateNumber: [
          { required: true, message: '请输入车牌号', trigger: 'blur' },
          {
            pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4,5}[A-Z0-9挂学警港澳]{0,1}$/,
            message: '请输入正确的车牌号格式',
            trigger: 'blur'
          }
        ],
        tenantId: [{ required: true, message: '请选择租户', trigger: 'change' }],
        phone: [
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    tableMaxHeight () {
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      )
    },
    tenantNameMap () {
      const map = {}
      this.tenantList.forEach((item) => {
        if (item.tenantId != null) {
          map[item.tenantId] = item.name || item.tenantName || ''
        }
      })
      return map
    }
  },
  watch: {
    currentManagerId: {
      handler (val) {
        if (val) {
          this.fetchTenantList()
          this.handleSearch()
        } else {
          this.tenantList = []
          this.tableData = []
          this.pageData.total = 0
        }
      },
      immediate: true
    }
  },
  methods: {
    getAuditStatusLabel (val) {
      const map = { 0: '待审核', 1: '已审核', 2: '已驳回' }
      return map[val] != null ? map[val] : '-'
    },
    getAuditStatusTagType (val) {
      const map = { 0: 'warning', 1: 'success', 2: 'danger' }
      return map[val] || 'info'
    },
    getStatusLabel (val) {
      const map = { 0: '停用', 1: '启用' }
      return map[val] != null ? map[val] : '-'
    },
    getStatusTagType (val) {
      const map = { 0: 'info', 1: 'success' }
      return map[val] || 'info'
    },
    getSourceLabel (val) {
      const map = { 1: '租户添加', 2: '物业添加' }
      return map[val] != null ? map[val] : '-'
    },
    getSourceTagType (val) {
      const map = { 1: 'primary', 2: 'success' }
      return map[val] || 'info'
    },
    formatTenantOptionLabel (item) {
      if (!item) return ''
      const name =
        item.name != null && item.name !== ''
          ? this.$displayBizHybrid
            ? this.$displayBizHybrid(item.name)
            : item.name
          : item.tenantName || ''
      const id = item.tenantId != null ? String(item.tenantId) : ''
      if (!id && !name) return '-'
      return name ? `${id} - ${name}` : id
    },
    formatTenantName (tenantId) {
      if (tenantId == null || tenantId === '') return '-'
      const name = this.tenantNameMap[tenantId]
      return name ? `${tenantId} - ${name}` : String(tenantId)
    },
    async fetchTenantList () {
      if (!this.currentManagerId) {
        this.tenantList = []
        return
      }
      try {
        const res = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0
        })
        if (res.code === 200) {
          this.tenantList = res.data || []
        } else {
          this.tenantList = []
        }
      } catch (e) {
        this.tenantList = []
        console.error('获取租户列表失败:', e)
      }
    },
    async fetchTableData () {
      if (!this.currentManagerId) {
        this.tableData = []
        this.pageData.total = 0
        return
      }
      this.loading = true
      try {
        const params = {
          managerId: this.currentManagerId,
          plateNumber: this.queryData.plateNumber || undefined,
          tenantId: this.queryData.tenantId || undefined,
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
            orders: [{ asc: false, column: 'createTime' }]
          }
        }
        const res = await tenantVehiclePage(params)
        if (res.code === 200 && res.data) {
          this.tableData = res.data.dataList || []
          this.pageData.total = res.data.total || 0
        } else {
          this.$message.error(res.msg || '获取数据失败')
        }
      } catch (e) {
        this.$message.error(e.msg || '获取车辆列表失败')
        console.error('获取车辆列表失败:', e)
      } finally {
        this.loading = false
      }
    },
    handleSearch () {
      if (!this.currentManagerId) {
        this.$message.warning('请先选择管理方')
        return
      }
      this.pageData.current = 1
      this.fetchTableData()
    },
    handleReset () {
      this.queryData = { plateNumber: '', tenantId: null }
      this.handleSearch()
    },
    handleAdd () {
      if (!this.currentManagerId) {
        this.$message.warning('请先选择管理方')
        return
      }
      this.editForm = {
        id: null,
        plateNumber: '',
        phone: '',
        tenantId: null,
        startDate: '',
        expireDate: '',
        remark: '',
        auditStatus: 1,
        managerId: this.currentManagerId,
        source: 2,
        status: 0
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate()
      })
    },
    // 暂时关闭修改，需要时放开（并恢复操作列按钮、tenantVehicleUpdate 引用及 handleSave 内编辑分支）
    // handleEdit (row) {
    //   if (!this.currentManagerId) {
    //     this.$message.warning('请先选择管理方')
    //     return
    //   }
    //   this.editForm = {
    //     id: row.id,
    //     plateNumber: row.plateNumber,
    //     phone: row.phone || '',
    //     tenantId: row.tenantId,
    //     startDate: row.startDate || '',
    //     expireDate: row.expireDate || '',
    //     remark: row.remark || '',
    //     auditStatus: row.auditStatus != null ? row.auditStatus : 1,
    //     managerId: row.managerId || this.currentManagerId,
    //     source: row.source != null ? row.source : 2,
    //     status: row.status != null ? row.status : 0
    //   }
    //   this.dialogVisible = true
    //   this.$nextTick(() => {
    //     this.$refs.editForm && this.$refs.editForm.clearValidate()
    //   })
    // },
    handleDelete (row) {
      this.$confirm(`确定要删除车牌号「${row.plateNumber}」的车辆记录吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          try {
            const res = await tenantVehicleDelete({ id: row.id })
            if (res.code === 200) {
              this.$message.success('删除成功')
              this.fetchTableData()
            } else {
              this.$message.error(res.msg || '删除失败')
            }
          } catch (e) {
            this.$message.error(e.msg || '删除失败')
            console.error('删除车辆失败:', e)
          }
        })
        .catch(() => {})
    },
    async handleSave () {
      this.$refs.editForm.validate(async (valid) => {
        if (!valid) return
        this.submitting = true
        try {
          const payload = {
            plateNumber: this.editForm.plateNumber,
            phone: this.editForm.phone || undefined,
            tenantId: this.editForm.tenantId,
            startDate: this.editForm.startDate || undefined,
            expireDate: this.editForm.expireDate || undefined,
            remark: this.editForm.remark || undefined,
            auditStatus: 1,
            managerId: this.currentManagerId,
            source: 2,
            status: 0
          }
          const res = await tenantVehicleCreate(payload)
          // 暂时关闭修改，需要时放开：
          // const isEdit = !!this.editForm.id
          // if (isEdit) { payload.id = this.editForm.id; ... }
          // const res = isEdit ? await tenantVehicleUpdate(payload) : await tenantVehicleCreate(payload)
          if (res.code === 200) {
            this.$message.success('新增成功')
            this.dialogVisible = false
            this.fetchTableData()
          } else {
            this.$message.error(res.msg || '新增失败')
          }
        } catch (e) {
          this.$message.error(e.msg || '新增失败')
          console.error('新增车辆失败:', e)
        } finally {
          this.submitting = false
        }
      })
    },
    handleDetail (row) {
      this.detailData = row
      this.detailDialogVisible = true
    },
    handleSizeChange (val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },
    handleCurrentChange (val) {
      this.pageData.current = val
      this.fetchTableData()
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/table-page.scss";

.detail-content {
  .detail-item {
    margin-bottom: 16px;
    line-height: 32px;

    label {
      font-weight: 600;
      color: #606266;
      display: inline-block;
      width: 100px;
    }

    span {
      color: #303133;
    }
  }
}

.text-danger {
  color: #f56c6c !important;
}

.table-actions-nowrap {
  flex-wrap: nowrap;
  white-space: nowrap;

  .el-button--text {
    padding: 0 6px;
    margin: 0;
  }
}
</style>
