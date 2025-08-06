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
          label-width="100px"
        >
          <!-- 基础筛选 -->
          <el-row :gutter="16" class="search-row">
            <el-col
              v-for="field in displayBasicFields"
              :key="field.prop"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="6"
            >
              <el-form-item
                :label="field.label"
                :prop="field.prop"
                class="compact-form-item"
              >
                <!-- 输入框 -->
                <el-input
                  v-if="field.type === 'input'"
                  v-model="queryData[field.prop]"
                  :placeholder="field.placeholder"
                  clearable
                  size="small"
                />
                <!-- 选择框 -->
                <el-select
                  v-else-if="field.type === 'select'"
                  v-model="queryData[field.prop]"
                  :placeholder="field.placeholder"
                  clearable
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in field.options"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <!-- 日期时间范围 -->
                <el-date-picker
                  v-else-if="field.type === 'datetimerange'"
                  v-model="queryData[field.prop]"
                  type="datetimerange"
                  range-separator="-"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  value-format="yyyy-MM-dd HH:mm:ss"
                  size="small"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 操作按钮行 -->
          <div class="form-actions compact-actions">
            <div class="action-left">
              <!-- 左侧操作按钮预留 -->
            </div>
            <div class="action-right">
              <el-button
                type="primary"
                icon="el-icon-search"
                size="small"
                @click="handleSearch"
              >
                查询
              </el-button>
              <el-button
                icon="el-icon-refresh"
                size="small"
                @click="handleReset"
              >
                重置
              </el-button>
              <el-divider direction="vertical" style="margin: 0 8px"></el-divider>
              <el-dropdown trigger="click" @command="handleCommand">
                <el-button size="small" type="text" style="padding: 7px 12px">
                  更多操作 <i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="export" icon="el-icon-download">
                    导出数据
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </div>
        </el-form>
      </el-card>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-container">
      <div class="table-card" shadow="never">
        <!-- 表格工具栏 -->
        <div class="table-toolbar" v-if="selectedData.length > 0">
          <div class="toolbar-left">
            <span class="selection-info">
              已选择 <span class="count">{{ selectedData.length }}</span> 条数据
            </span>
          </div>
        </div>

        <!-- 数据表格 -->
        <el-table
          v-loading="loading"
          :data="tableData"
          :max-height="tableMaxHeight"
          stripe
          style="width: 100%"
          class="custom-table"
          @selection-change="handleSelectionChange"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }"
        >
          <!-- 选择列 -->
          <el-table-column type="selection" width="55" align="center" />

          <!-- 流水号 -->
          <el-table-column
            label="流水号"
            prop="rid"
            width="100"
            align="center"
          />

          <!-- 电表(ID) -->
          <el-table-column
            label="电表(ID)"
            align="center"
            min-width="200"
          >
            <template slot-scope="scope">
              {{ scope.row.meterName }}({{ scope.row.meterId }})
            </template>
          </el-table-column>

          <!-- 电表序列号 -->
          <el-table-column
            label="电表序列号"
            prop="serial"
            align="center"
            width="150"
          />

          <!-- 计费方案(ID) -->
          <el-table-column
            label="计费方案(ID)"
            align="center"
            width="240"
          >
            <template slot-scope="scope">
              {{ scope.row.priceName }}({{ scope.row.priceId }})
            </template>
          </el-table-column>

          <!-- 电价(尖/峰/平/谷) -->
          <el-table-column
            label="电价(尖/峰/平/谷)"
            align="center"
            width="210"
          >
            <template slot-scope="scope">
              {{ scope.row.powerPeakPrice }}/{{ scope.row.powerTopPrice }}/{{
                scope.row.powerFlatPrice
              }}/{{ scope.row.powerValleyPrice }}
            </template>
          </el-table-column>

          <!-- 时间 -->
          <el-table-column
            label="时间"
            prop="occurTime"
            align="center"
            width="160"
          />

          <!-- 改价结果 -->
          <el-table-column
            label="改价结果"
            align="center"
            width="120"
          >
            <template slot-scope="scope">
              <el-tag
                v-if="scope.row.result === 'SUCCESS'"
                type="success"
                size="small"
              >
                调价成功
              </el-tag>
              <el-tag
                v-else-if="scope.row.result === 'FAIL'"
                type="danger"
                size="small"
              >
                调价失败
              </el-tag>
              <el-tag
                v-else
                type="info"
                size="small"
              >
                已失效
              </el-tag>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column
            label="操作"
            width="160"
            fixed="right"
            align="center"
          >
            <template slot-scope="scope">
              <template v-if="scope.row.result === 'FAIL'">
                <el-button type="text" size="mini" @click="handleDetail(scope.row)">详情</el-button>
                <span style="color: #dcdfe6; margin: 0 4px;">|</span>
                <el-button type="text" size="mini" @click="handleRetry(scope.row)" style="color: #E6A23C;">重试</el-button>
              </template>
              <template v-else>
                <el-button type="text" size="mini" @click="handleDetail(scope.row)">详情</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空数据提示 -->
        <div v-if="!loading && tableData.length === 0" style="text-align: center; padding: 40px 0;">
          <el-empty description="暂无数据" />
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="tableData.length > 0" class="pagination-container">
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

    <!-- 详情弹窗 -->
    <el-dialog
      title="调价详情"
      :visible.sync="dialogVisible"
      width="500px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <div slot="title">
        调价详情
      </div>
      <div class="dialog-content">
        <el-form label-width="100px">
          <el-form-item label="操作描述：">
            {{ detailData.message || '-' }}
          </el-form-item>
          <el-form-item label="备注：">
            {{ detailData.comment || '-' }}
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// 导入API
import {
  priceModifyRecordPageRecord,
  priceModifyRecordRetryModify
} from '@/api/priceModifyRecord'

import { mapGetters } from 'vuex'
import moment from 'moment'

export default {
  name: 'PriceModifyRecord',
  data() {
    return {
      // 表格高度配置
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 10,
        paginationHeight: 68,
      },
      
      // 查询参数
      queryData: {
        result: '',
        serial: '',
        timeRange: [
          moment().subtract(1, 'months').format('YYYY-MM-DD') + ' 00:00:00',
          moment().format('YYYY-MM-DD') + ' 23:59:59'
        ],
        managerId: ''
      },

      // 搜索字段配置
      searchFields: {
        basic: [
          {
            prop: 'result',
            label: '改价结果',
            type: 'select',
            placeholder: '请选择改价结果',
            options: [
              { value: '', label: '全部' },
              { value: 'SUCCESS', label: '成功' },
              { value: 'FAIL', label: '失败' }
            ]
          },
          {
            prop: 'serial',
            label: '电表序列号',
            type: 'input',
            placeholder: '请输入电表序列号'
          },
          {
            prop: 'timeRange',
            label: '日期',
            type: 'datetimerange',
            placeholder: '请选择时间范围'
          }
        ]
      },

      // 表格数据
      tableData: [],
      // 选中的数据
      selectedData: [],
      // 加载状态
      loading: false,
      
      // 分页数据
      pageData: {
        current: 1,
        size: 15,
        total: 0,
      },

      // 详情弹窗
      dialogVisible: false,
      detailData: {
        message: '',
        comment: ''
      }
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    
    // 数据长度
    dataLength() {
      return this.tableData.length
    },

    // 获取显示的基础搜索字段
    displayBasicFields() {
      return this.searchFields.basic
    },

    // 动态计算表格高度
    tableMaxHeight() {
      // 始终返回最大高度（9行 + 表头）
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      );
    },
  },

  watch: {
    currentManagerId: {
      handler(newVal) {
        if (newVal) {
          this.queryData.managerId = newVal
          this.fetchTableData()
        }
      },
      immediate: true,
    },
  },

  created() {
    // 埋点统计
    if (this.$store.dispatch) {
      this.$store.dispatch('methods/buriedPoint', '调价日志')
    }
  },

  methods: {
    // 获取表格数据
    async fetchTableData() {
      this.loading = true
      try {
        // 处理时间范围参数
        let startDateTime = ''
        let endDateTime = ''
        if (this.queryData.timeRange && this.queryData.timeRange.length === 2) {
          startDateTime = this.queryData.timeRange[0]
          endDateTime = this.queryData.timeRange[1]
        }

        const params = {
          managerId: this.queryData.managerId,
          serial: this.queryData.serial,
          startDateTime,
          endDateTime,
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
            searchCount: true,
            orders: [
              {
                asc: false,
                column: 'occurTime'
              }
            ]
          }
        }

        // 添加改价结果筛选
        if (this.queryData.result && this.queryData.result !== '') {
          params.result = this.queryData.result
        }

        const response = await priceModifyRecordPageRecord(params)

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || []
          this.pageData.total = response.data.total || 0
        } else {
          this.$message.error(response.msg || '获取数据失败')
          this.tableData = []
          this.pageData.total = 0
        }
      } catch (error) {
        this.$message.error('获取调价记录失败')
        console.error('获取调价记录失败:', error)
        this.tableData = []
        this.pageData.total = 0
      } finally {
        this.loading = false
      }
    },

    // 查询
    handleSearch() {
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 重置
    handleReset() {
      this.queryData = {
        result: '',
        serial: '',
        timeRange: [
          moment().subtract(1, 'months').format('YYYY-MM-DD') + ' 00:00:00',
          moment().format('YYYY-MM-DD') + ' 23:59:59'
        ],
        managerId: this.currentManagerId || ''
      }
      this.handleSearch()
    },

    // 处理顶部下拉命令
    handleCommand(command) {
      switch (command) {
        case 'export':
          this.handleExport()
          break
      }
    },

    // 查看详情
    handleDetail(row) {
      try {
        const resultDesc = row.resultDesc ? JSON.parse(row.resultDesc) : {}
        this.detailData = {
          message: resultDesc.msg || '无',
          comment: row.comment || '-'
        }
      } catch (error) {
        this.detailData = {
          message: '解析失败',
          comment: row.comment || '-'
        }
      }
      this.dialogVisible = true
    },

    // 重试改价
    async handleRetry(row) {
      try {
        await this.$confirm('确认重新修改?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await priceModifyRecordRetryModify({
          rid: row.rid
        })

        if (response.code === 200) {
          if (response.data && response.data.result === 'SUCCESS') {
            this.$message.success(response.msg || '重试成功')
          } else {
            this.$message.error('操作失败')
          }
        } else {
          this.$message.error(response.msg || '重试失败')
        }

        // 刷新数据
        this.fetchTableData()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('重试操作失败')
          console.error('重试失败:', error)
        }
      }
    },

    // 选择变化
    handleSelectionChange(selection) {
      this.selectedData = selection
    },

    // 导出数据
    handleExport() {
      const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData
      
      if (exportData.length === 0) {
        this.$message.warning('没有可导出的数据')
        return
      }
      
      // 这里实现导出功能
      if (this.$store.dispatch) {
        const params = {
          ele: this.$refs.table?.$el,
          name: '调价记录.xlsx',
          data: exportData
        }
        this.$store.dispatch('export/export', params)
      } else {
        this.$message.info('导出功能开发中...')
      }
    },

    // 分页大小变化
    handleSizeChange(val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 当前页变化
    handleCurrentChange(val) {
      this.pageData.current = val
      this.fetchTableData()
    },
  },
}
</script>

<style lang="scss" scoped>
// 引入表格页面公共样式
@import "@/assets/styles/table-page.scss";
</style>