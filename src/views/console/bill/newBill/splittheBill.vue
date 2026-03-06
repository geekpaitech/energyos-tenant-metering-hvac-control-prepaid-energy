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
                <!-- 公摊组选择 -->
                <el-select
                  v-if="field.type === 'select' && field.prop === 'shareId'"
                  v-model="queryData[field.prop]"
                  placeholder="请选择公摊组"
                  clearable
                  size="small"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="item in shareList"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
                
                <!-- 公摊类型选择 -->
                <el-select
                  v-else-if="field.type === 'select' && field.prop === 'shareType'"
                  v-model="queryData[field.prop]"
                  placeholder="请选择公摊类型"
                  clearable
                  size="small"
                  style="width: 100%"
                  @change="handleShareTypeChange"
                >
                  <el-option
                    v-for="item in shareTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
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
              <!-- 结算ID -->
              <template v-if="col.key === 'rid'">
                <span class="text-primary">{{ scope.row.rid || "-" }}</span>
              </template>

              <!-- 公摊组名 -->
              <template v-else-if="col.key === 'shareName'">
                <el-link type="primary">
                  {{ scope.row.shareName || "-" }}
                </el-link>
              </template>

              <!-- 公摊类型 -->
              <template v-else-if="col.key === 'shareTypeLabel'">
                <el-tag type="info" size="small" effect="plain">
                  {{ scope.row.shareTypeLabel || "-" }}
                </el-tag>
              </template>

              <!-- 金额类字段 -->
              <template v-else-if="col.type === 'money'">
                <span class="amount-text">
                  {{ formatMoney(scope.row[col.key]) }}
                </span>
              </template>

              <!-- 面积字段 -->
              <template v-else-if="col.type === 'area'">
                <span>
                  {{ formatArea(scope.row[col.key]) }}
                </span>
              </template>

              <!-- 结算状态 -->
              <template v-else-if="col.key === 'settleStatus'">
                <el-tag
                  :type="getStatusType(scope.row.settleStatus)"
                  size="small"
                  effect="plain"
                >
                  {{ getStatusLabel(scope.row.settleStatus) }}
                </el-tag>
              </template>

              <!-- 默认显示 -->
              <template v-else>
                {{ scope.row[col.key] || "-" }}
              </template>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column
            label="操作"
            width="120"
            align="center"
            fixed="right"
          >
            <template slot-scope="scope">
              <el-button
                type="text"
                size="small"
                @click="handleView(scope.row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空数据提示 -->
        <div v-if="!loading && tableData.length === 0" class="empty-data">
          <i class="el-icon-data-analysis" style="font-size: 48px; color: #909399;"></i>
          <p style="color: #909399; margin-top: 16px;">暂无数据</p>
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

    <!-- 详情抽屉组件 -->
    <el-drawer
      :title="drawerTitle"
      :visible.sync="detailDrawer.show"
      :size="'50%'"
      :before-close="handleDrawerClose"
    >
      <div class="drawer-content" v-if="detailDrawer.data">
        <!-- 这里可以根据公摊类型显示不同的详情内容 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="结算ID">
            {{ detailDrawer.data.rid }}
          </el-descriptions-item>
          <el-descriptions-item label="结算日期">
            {{ detailDrawer.data.occurDate }}
          </el-descriptions-item>
          <el-descriptions-item label="公摊组ID">
            {{ detailDrawer.data.shareId }}
          </el-descriptions-item>
          <el-descriptions-item label="公摊组名">
            {{ detailDrawer.data.shareName }}
          </el-descriptions-item>
          <el-descriptions-item label="总结算金额">
            {{ formatMoney(detailDrawer.data.balance) }}
          </el-descriptions-item>
          <el-descriptions-item label="总公摊面积">
            {{ formatArea(detailDrawer.data.totalArea) }}
          </el-descriptions-item>
          <el-descriptions-item label="结算状态">
            <el-tag
              :type="getStatusType(detailDrawer.data.settleStatus)"
              size="small"
            >
              {{ getStatusLabel(detailDrawer.data.settleStatus) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>
<script>
// 导入API
import {
  shareList,
  sharePageSettleShare,
  shareGetSettleShareDetail,
} from "@/api/share";

import {
  waterShareList,
  waterSharePageWaterSettleShare,
  waterShareGetSettleShareDetail,
} from "@/api/waterShare";

import { mapGetters } from "vuex";
import moment from 'moment';
import * as XLSX from 'xlsx';
export default {
  name: "ShareManagement",
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
        shareId: "",
        shareType: "", // 默认全部
        timeRange: [
        
        ],
      },
      
      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: "shareId", label: "公摊组名", type: "select" },
          { prop: "timeRange", label: "日期范围", type: "daterange" },
          { prop: "shareType", label: "公摊类型", type: "select" },
        ],
        advanced: [],
      },
      
      // 公摊组列表
      shareList: [],
      
      // 公摊类型选项
      shareTypeOptions: [
        { label: "全部", value: "" },
        { label: "用电公摊", value: 1 },
        { label: "用水公摊", value: 2 },
      ],
      
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
      
      // 详情抽屉
      detailDrawer: {
        show: false,
        data: null,
      },
      
      // 结算状态枚举
      settleStatusMap: {
        0: { label: "未结算", type: "info" },
        1: { label: "已结算", type: "success" },
        2: { label: "结算中", type: "warning" },
        3: { label: "结算失败", type: "danger" },
      },
      
      // 表格列配置
      tableKey: [
        {
          label: "结算ID",
          key: "rid",
          width: "150",
          checked: true,
          disabled: true,
        },
        {
          label: "结算日期",
          key: "occurDate",
          width: "150",
          checked: true,
        },
        {
          label: "公摊组ID",
          key: "shareId",
          width: "120",
          checked: true,
        },
        {
          label: "公摊组名",
          key: "shareName",
          minWidth: "180",
          checked: true,
          disabled: true,
        },
        {
          label: "公摊类型",
          key: "shareTypeLabel",
          width: "120",
          checked: true,
        },
        {
          label: "总结算金额",
          key: "balance",
          width: "150",
          checked: true,
          type: "money",
        },
        {
          label: "总公摊面积",
          key: "totalArea",
          width: "150",
          checked: true,
          type: "area",
        },
        {
          label: "结算状态",
          key: "settleStatus",
          width: "120",
          checked: true,
        },
      ],
    };
  },
  
  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    
    // 显示的列
    displayColumns() {
      return this.tableKey.filter((col) => col.checked !== false);
    },
    
    // 显示的基础搜索字段
    displayBasicFields() {
      return this.searchFields.basic;
    },
    
    // 表格最大高度
    tableMaxHeight() {
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      );
    },
    
    // 抽屉标题
    drawerTitle() {
      let typeText = "公摊";
      if (this.queryData.shareType === 1) {
        typeText = "用电公摊";
      } else if (this.queryData.shareType === 2) {
        typeText = "用水公摊";
      }
      return `${typeText}结算详情`;
    },
  },
  
  watch: {
    currentManagerId: {
      handler(newVal) {
        if (newVal) {
          this.getShareList();
          this.fetchTableData();
        }
      },
      immediate: true,
    },
  },
  
  created() {
    // 如果路由带有managerId参数（从管理后台跳转）
    if (this.$route.query.managerId) {
      // 这里可以根据需要处理managerId
      console.log('Route managerId:', this.$route.query.managerId);
    }
  },
  
  methods: {
    // 获取公摊组列表
    async getShareList() {
      try {
        const params = {
          managerId: this.currentManagerId,
        };
        
        // 当选择全部时，获取用电公摊列表（或者你可以同时获取两种）
        if (!this.queryData.shareType || this.queryData.shareType === "") {
          // 获取用电公摊列表作为默认
          const response = await shareList(params);
          if (response.code === 200 && response.data) {
            this.shareList = response.data || [];
          } else {
            this.shareList = [];
          }
        } else if (this.queryData.shareType === 1) {
          // 用电公摊
          const response = await shareList(params);
          if (response.code === 200 && response.data) {
            this.shareList = response.data || [];
          } else {
            this.shareList = [];
          }
        } else if (this.queryData.shareType === 2) {
          // 用水公摊
          const response = await waterShareList(params);
          if (response.code === 200 && response.data) {
            this.shareList = response.data || [];
          } else {
            this.shareList = [];
          }
        }
      } catch (error) {
        console.error("获取公摊组列表失败:", error);
        this.$message.error("获取公摊组列表失败");
        this.shareList = [];
      }
    },
    
    // 获取表格数据
    async fetchTableData() {
      this.loading = true;
      try {
        const params = {
          managerId: this.currentManagerId,
          shareId: this.queryData.shareId,
          startDate: this.queryData.timeRange ? this.queryData.timeRange[0] : '',
          endDate: this.queryData.timeRange ? this.queryData.timeRange[1] : '',
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
            searchCount: true,
            orders: [
              {
                asc: false,
                column: 'occurDate'
              }
            ]
          }
        };
        
        // 当选择全部时，需要合并两种数据
        if (!this.queryData.shareType || this.queryData.shareType === "") {
          // 同时请求两种数据
          const [elecResponse, waterResponse] = await Promise.all([
            sharePageSettleShare(params),
            waterSharePageWaterSettleShare(params)
          ]);
          
          let elecData = [];
          let waterData = [];
          let totalCount = 0;
          
          if (elecResponse.code === 200 && elecResponse.data) {
            elecData = (elecResponse.data.dataList || []).map(item => ({
              ...item,
              shareTypeLabel: '用电公摊'
            }));
            totalCount += elecResponse.data.total || 0;
          }
          
          if (waterResponse.code === 200 && waterResponse.data) {
            waterData = (waterResponse.data.dataList || []).map(item => ({
              ...item,
              shareTypeLabel: '用水公摊'
            }));
            totalCount += waterResponse.data.total || 0;
          }
          
          // 合并数据并按日期排序
          this.tableData = [...elecData, ...waterData].sort((a, b) => {
            return new Date(b.occurDate) - new Date(a.occurDate);
          });
          
          // 处理分页（这里简单处理，实际可能需要后端支持）
          const startIndex = (this.pageData.current - 1) * this.pageData.size;
          const endIndex = startIndex + this.pageData.size;
          this.tableData = this.tableData.slice(startIndex, endIndex);
          this.pageData.total = totalCount;
          
        } else if (this.queryData.shareType === 1) {
          // 用电公摊
          const response = await sharePageSettleShare(params);
          if (response.code === 200 && response.data) {
            this.tableData = (response.data.dataList || []).map(item => ({
              ...item,
              shareTypeLabel: '用电公摊'
            }));
            this.pageData.total = response.data.total || 0;
          } else {
            this.tableData = [];
            this.pageData.total = 0;
          }
        } else if (this.queryData.shareType === 2) {
          // 用水公摊
          const response = await waterSharePageWaterSettleShare(params);
          if (response.code === 200 && response.data) {
            this.tableData = (response.data.dataList || []).map(item => ({
              ...item,
              shareTypeLabel: '用水公摊'
            }));
            this.pageData.total = response.data.total || 0;
          } else {
            this.tableData = [];
            this.pageData.total = 0;
          }
        }
      } catch (error) {
        this.$message.error("获取公摊账单数据失败");
        console.error("获取公摊账单数据失败:", error);
        this.tableData = [];
        this.pageData.total = 0;
      } finally {
        this.loading = false;
      }
    },
    
    // 格式化金额
    formatMoney(value) {
      if (value === null || value === undefined || value === '') {
        return '-';
      }
      return `¥${parseFloat(value).toFixed(2)}`;
    },
    
    // 格式化面积
    formatArea(value) {
      if (value === null || value === undefined || value === '') {
        return '-';
      }
      return `${value}㎡`;
    },
    
    // 获取状态标签类型
    getStatusType(status) {
      return this.settleStatusMap[status]?.type || 'info';
    },
    
    // 获取状态标签文本
    getStatusLabel(status) {
      return this.settleStatusMap[status]?.label || '未知';
    },
    
    // 公摊类型变化
    handleShareTypeChange(val) {
      // 切换类型时重新获取公摊组列表
      this.queryData.shareId = "";
      this.getShareList();
      this.handleSearch();
    },
    
    // 查询
    handleSearch() {
      this.pageData.current = 1;
      this.fetchTableData();
    },
    
    // 重置
    handleReset() {
      this.queryData = {
        shareId: "",
        shareType: "", // 重置为全部
        timeRange: [
          moment().subtract(1, 'months').format('YYYY-MM-DD'),
          moment().format('YYYY-MM-DD')
        ],
      };
      this.getShareList();
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
    
    // 查看详情
    async handleView(row) {
      try {
        this.detailDrawer.data = row;
        this.detailDrawer.show = true;
        
        // 可以在这里调用详情接口获取更多信息
        const params = {
          rid: row.rid,
          managerId: this.currentManagerId,
        };
        
        let response;
        if (this.queryData.shareType === 1) {
          response = await shareGetSettleShareDetail(params);
        } else {
          response = await waterShareGetSettleShareDetail(params);
        }
        
        if (response.code === 200 && response.data) {
          // 更新详情数据
          this.detailDrawer.data = {
            ...row,
            ...response.data
          };
        }
      } catch (error) {
        console.error("获取详情失败:", error);
        this.$message.error("获取详情失败");
      }
    },
    
    // 关闭抽屉
    handleDrawerClose(done) {
      this.detailDrawer.show = false;
      this.detailDrawer.data = null;
      done();
    },
    
    // 导出数据
    handleExport() {
  if (this.tableData.length === 0) {
    this.$message.warning("暂无数据可导出");
    return;
  }

  try {
    // 确定要导出的数据：优先导出选中数据，无选中则导出当前页
    const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData;
    
    // 构建导出的表头和数据
    const headers = this.displayColumns.map(col => col.label);
    const data = exportData.map(row => {
      return this.displayColumns.map(col => {
        const value = row[col.key];
        
        // 处理特殊字段的显示格式
        switch (col.key) {
          case 'shareTypeLabel':
            return value || '公摊';
          case 'settleStatus':
            return this.getStatusLabel(value);
          default:
            if (col.type === 'money') {
              return value ? parseFloat(value).toFixed(2) : '0.00';
            } else if (col.type === 'area') {
              return value ? `${value}` : '0';
            }
            return value || '';
        }
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

    // 设置表头样式
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "606266" } },
        fill: { fgColor: { rgb: "F5F7FA" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "公摊组账单");

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
    
    // 显示导出信息
    const exportCount = exportData.length;
    const isSelectedExport = this.selectedData.length > 0;
    this.$message.success(`成功导出${exportCount}条${isSelectedExport ? '选中' : ''}数据！`);
  } catch (error) {
    console.error('导出失败:', error);
    this.$message.error('导出失败，请重试');
  }
},

// 3. 添加生成文件名的方法
generateFileName() {
  const now = new Date();
  const timeStr = now.getFullYear() + 
    String(now.getMonth() + 1).padStart(2, '0') + 
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') + 
    String(now.getMinutes()).padStart(2, '0') + 
    String(now.getSeconds()).padStart(2, '0');
  
  // 根据公摊类型生成不同的文件名
  let typePrefix = "公摊账单";
  if (this.queryData.shareType === 1) {
    typePrefix = "用电公账单";
  } else if (this.queryData.shareType === 2) {
    typePrefix = "用水公账单";
  }
  
  // 如果选择了特定公摊组，包含公摊组信息
  if (this.queryData.shareId) {
    const shareItem = this.shareList.find(item => item.id === this.queryData.shareId);
    const shareName = shareItem ? shareItem.name : this.queryData.shareId;
    return `${typePrefix}_${shareName}_${timeStr}.xlsx`;
  }
  
  // 如果选择了时间范围，包含时间信息
  if (this.queryData.timeRange && this.queryData.timeRange.length === 2) {
    const startDate = this.queryData.timeRange[0].replace(/-/g, '');
    const endDate = this.queryData.timeRange[1].replace(/-/g, '');
    return `${typePrefix}_${startDate}-${endDate}_${timeStr}.xlsx`;
  }
  
  return `${typePrefix}_${timeStr}.xlsx`;
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
      color: #F56C6C;
    }
  }
  
  .text-primary {
    color: #409EFF;
  }
  
  .empty-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
  }
  
  // 抽屉内容样式
  .drawer-content {
    padding: 20px;
    
    .el-descriptions {
      margin-top: 20px;
    }
  }
  
  // 状态标签样式（如果需要自定义）
  .el-tag {
    &.el-tag--plain {
      border-width: 1px;
    }
  }
  </style>