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
          <!-- 基础筛选 - 动态渲染 -->
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
                  :placeholder="`请输入${field.label}`"
                  clearable
                  size="small"
                />
                <!-- 选择框 - 租户选择 -->
                <el-select
                  v-else-if="
                    field.type === 'select' && field.prop === 'tenantId'
                  "
                  v-model="queryData[field.prop]"
                  placeholder="请选择租户"
                  clearable
                  size="small"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="tenant in tenantList"
                    :key="tenant.id"
                    :label="`${tenant.id}(${tenant.name})`"
                    :value="tenant.id"
                  >
                    <span style="font-size: 12px">
                      {{ tenant.id }}({{ tenant.name }})
                    </span>
                  </el-option>
                </el-select>
                <!-- 日期范围选择器 -->
                <el-date-picker
                  v-else-if="field.type === 'daterange'"
                  v-model="queryData[field.prop]"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="yyyy-MM-dd"
                  size="small"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 操作按钮行 -->
          <div class="form-actions compact-actions">
            <div class="action-left">
              <!-- 预留左侧按钮区域 -->
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
              <el-divider
                direction="vertical"
                style="margin: 0 8px"
              ></el-divider>
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
          <el-table-column type="selection" width="55" align="center" />

          <!-- 按照tableKey配置显示列 -->
          <el-table-column
            v-for="col in displayColumns"
            :key="col.key"
            :prop="col.key"
            :label="col.label"
            :width="col.width"
            :min-width="col.minWidth"
            :align="col.align || 'center'"
            :show-overflow-tooltip="true"
          >
            <template slot-scope="scope">
              <!-- 租户ID -->
              <template v-if="col.key === 'tenantId'">
                <span class="text-primary">{{
                  scope.row.tenantId || "-"
                }}</span>
              </template>

              <!-- 租户名称 -->
              <template v-else-if="col.key === 'tenantName'">
                <el-link type="primary" @click="handleTenantDetail(scope.row)">
                  <i class="el-icon-user"></i>
                  {{ scope.row.tenantName || "-" }}
                </el-link>
              </template>

              <!-- 金额类字段 -->
              <template v-else-if="col.type === 'money'">
                <span
                  :class="{
                    'amount-text': true,
                    'text-danger': col.key.includes('NoPay'),
                  }"
                >
                  {{ formatMoney(scope.row[col.key]) }}
                </span>
              </template>

              <!-- 默认显示 -->
              <template v-else>
                {{ scope.row[col.key] || "-" }}
              </template>
            </template>
          </el-table-column>

          <!-- 操作列 -->
        </el-table>

        <!-- 空数据提示 -->
        <div v-if="!loading && tableData.length === 0" class="empty-data">
          <i
            class="el-icon-data-analysis"
            style="font-size: 48px; color: #909399"
          ></i>
          <p style="color: #909399; margin-top: 16px">暂无数据</p>
        </div>
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
  </div>
</template>
<script>
// 导入API
import { settleTenantSettleStatistics } from "@/api/settle";

import { tenantPageTenant } from "@/api/tenant";

import { mapGetters } from "vuex";
import moment from "moment";
import * as XLSX from 'xlsx';
export default {
  name: "TenantBillStatistics",
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
        tenantId: "",
        timeRange: [
          moment().subtract(1, "months").format("YYYY-MM-DD"),
          moment().format("YYYY-MM-DD"),
        ],
      },

      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: "tenantId", label: "租户", type: "select" },
          { prop: "timeRange", label: "日期范围", type: "daterange" },
        ],
        advanced: [],
      },

      // 租户列表
      tenantList: [],

      // 表格数据
      tableData: [],

      // 加载状态
      loading: false,

      // 分页数据
      pageData: {
        current: 1,
        size: 15,
        total: 0,
      },

      // 选中的数据
      selectedData: [],

      // 表格列配置
      tableKey: [
        {
          label: "租户ID",
          key: "tenantId",
          width: "150",
          checked: true,
          disabled: true,
        },
        {
          label: "租户名",
          key: "tenantName",
          minWidth: "200",
          checked: true,
          disabled: true,
        },
        {
          label: "电费账单",
          key: "elecAmt",
          width: "150",
          checked: true,
          type: "money",
        },
        {
          label: "电费账单(已缴费)",
          key: "elecPayAmt",
          width: "160",
          checked: true,
          type: "money",
        },
        {
          label: "电费账单(未缴费)",
          key: "elecNoPayAmt",
          width: "160",
          checked: true,
          type: "money",
        },
        {
          label: "水费账单",
          key: "waterAmt",
          width: "150",
          checked: true,
          type: "money",
        },
        {
          label: "水费账单(已缴费)",
          key: "waterPayAmt",
          width: "160",
          checked: true,
          type: "money",
        },
        {
          label: "水费账单(未缴费)",
          key: "waterNoPayAmt",
          width: "160",
          checked: true,
          type: "money",
        },
        {
          label: "服务费账单",
          key: "serviceAmt",
          width: "150",
          checked: true,
          type: "money",
        },
        {
          label: "服务费账单(已缴费)",
          key: "servicePayAmt",
          width: "180",
          checked: true,
          type: "money",
        },
        {
          label: "服务费账单(未缴费)",
          key: "serviceNoPayAmt",
          width: "180",
          checked: true,
          type: "money",
        },
      ],
    };
  },

  computed: {
    ...mapGetters("manager", ["currentManagerId"]),

    // 数据长度
    dataLength() {
      return this.tableData.length;
    },

    // 显示的列
    displayColumns() {
      return this.tableKey.filter((col) => col.checked !== false);
    },

    // 显示的基础搜索字段
    displayBasicFields() {
      return this.searchFields.basic;
    },
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
          this.getTenantList();
          this.fetchTableData();
        }
      },
      immediate: true,
    },
  },

  created() {
    // 如果路由带有租户ID参数
    if (this.$route.query.id) {
      this.queryData.tenantId = this.$route.query.id;
    }
  },

  methods: {
    // 获取租户列表
    async getTenantList() {
      try {
        const params = {
          tenantStatus: 0,
          managerId: this.currentManagerId,
        };
        const response = await tenantPageTenant(params);
        console.log(response, "response");

        if (response.code === 200 && response.data.dataList) {
          this.tenantList = response.data.dataList || [];
        } else {
          this.$message.error(response.msg || "获取租户列表失败");
          this.tenantList = [];
        }
      } catch (error) {
        console.error("获取租户列表失败:", error);
        this.$message.error("获取租户列表失败");
        this.tenantList = [];
      }
    },

    // 获取表格数据
    async fetchTableData() {
      this.loading = true;
      try {
        const params = {
          managerId: this.currentManagerId,
          tenantId: this.queryData.tenantId,
          startDate: this.queryData.timeRange
            ? this.queryData.timeRange[0]
            : "",
          endDate: this.queryData.timeRange ? this.queryData.timeRange[1] : "",
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
          },
        };

        const response = await settleTenantSettleStatistics(params);

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || [];
          this.pageData.total = response.data.total || 0;
        } else {
          this.$message.error(response.msg || "获取数据失败");
          this.tableData = [];
        }
      } catch (error) {
        this.$message.error("获取账单统计数据失败");
        console.error("获取账单统计数据失败:", error);
        this.tableData = [];
      } finally {
        this.loading = false;
      }
    },

    // 格式化金额
    formatMoney(value) {
      if (value === null || value === undefined || value === "") {
        return "-";
      }
      return `¥${parseFloat(value).toFixed(2)}`;
    },

    // 查询
    handleSearch() {
      this.pageData.current = 1;
      this.fetchTableData();
    },

    // 重置
    handleReset() {
      this.queryData = {
        tenantId: "",
        timeRange: [
          moment().subtract(1, "months").format("YYYY-MM-DD"),
          moment().format("YYYY-MM-DD"),
        ],
      };
      this.handleSearch();
    },

    // 处理下拉命令
    handleCommand(command) {
      switch (command) {
        case "export":
          this.handleExport();
          break;
      }
    },

    // 查看租户详情
    handleTenantDetail(row) {
      this.$router.push({
        name: "TenantDetail", // 使用路由名称
        params: { id: row.tenantId }, // 使用 params 传递动态路由参数
        query: {
          // 可选：传递额外的查询参数
          name: row.name,
          from: "list",
        },
      });
    },

    // 查看详情
    handleView(row) {
      this.handleTenantDetail(row);
    },

    // 导出数据
    handleExport() {
  if (this.tableData.length === 0) {
    this.$message.warning("暂无数据可导出");
    return;
  }

  try {
    // 确定要导出的数据
    const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData;
    
    // 构建导出的表头和数据
    const headers = this.displayColumns.map(col => col.label);
    const data = exportData.map(row => {
      return this.displayColumns.map(col => {
        const value = row[col.key];
        
        // 处理金额类型的字段
        if (col.type === 'money') {
          if (value === null || value === undefined || value === '') {
            return '0.00';
          }
          return parseFloat(value).toFixed(2);
        }
        
        // 处理其他字段
        return value || '';
      });
    });

    // 创建工作表数据
    const wsData = [headers, ...data];
    
    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 设置列宽
    const colWidths = this.displayColumns.map(col => {
      if (col.width) {
        return { wch: Math.max(parseInt(col.width) / 8, col.label.length + 2) };
      } else if (col.minWidth) {
        return { wch: Math.max(parseInt(col.minWidth) / 8, col.label.length + 2) };
      }
      return { wch: Math.max(15, col.label.length + 2) };
    });
    ws['!cols'] = colWidths;

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "租户账单统计");

    // 生成文件名
    const fileName = this.generateFileName();
    
    // 导出文件（使用原生方法）
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    this.$message.success('导出成功！');
  } catch (error) {
    console.error('导出失败:', error);
    this.$message.error('导出失败，请重试');
  }
},
generateFileName() {
  const now = moment();
  const timeStr = now.format('YYYYMMDD_HHmmss');
  
  // 如果选择了特定租户，包含租户信息
  if (this.queryData.tenantId) {
    const tenant = this.tenantList.find(t => t.id === this.queryData.tenantId);
    const tenantName = tenant ? tenant.name : this.queryData.tenantId;
    return `租户账单统计_${tenantName}_${timeStr}.xlsx`;
  }
  
  // 如果选择了时间范围，包含时间信息
  if (this.queryData.timeRange && this.queryData.timeRange.length === 2) {
    const startDate = this.queryData.timeRange[0].replace(/-/g, '');
    const endDate = this.queryData.timeRange[1].replace(/-/g, '');
    return `租户账单统计_${startDate}-${endDate}_${timeStr}.xlsx`;
  }
  
  return `租户账单统计_${timeStr}.xlsx`;
},

    // 选择变化
    handleSelectionChange(selection) {
      this.selectedData = selection;
    },

    // 分页大小变化
    handleSizeChange(val) {
      this.pageData.size = val;
      this.pageData.current = 1;
      this.fetchTableData();
    },

    // 当前页变化
    handleCurrentChange(val) {
      this.pageData.current = val;
      this.fetchTableData();
    },
  },
};
</script>
<style lang="scss" scoped>
// 引入表格页面公共样式
@import "@/assets/styles/table-page.scss";

// 自定义样式补充
.amount-text {
  font-weight: 500;
  color: #303133;

  &.text-danger {
    color: #f56c6c;
  }
}

.text-primary {
  color: #409eff;
}

.empty-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}
</style>
