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
                    placeholder="请输入"
                    clearable
                    size="small"
                  />
                  <!-- 选择框 -->
                  <el-select
                    v-else-if="field.type === 'select'"
                    v-model="queryData[field.prop]"
                    placeholder="请选择"
                    clearable
                    size="small"
                    style="width: 100%"
                  >
                    <!-- 交易类型选项 -->
                    <template v-if="field.prop === 'transactionType'">
                      <el-option label="全部" value="" />
                      <el-option label="充值" value="1" />
                      <el-option label="消费" value="2" />
                      <el-option label="退款" value="3" />
                    </template>
                    <!-- 充电卡选项 -->
                    <template v-else-if="field.prop === 'cardId'">
                      <el-option label="全部" value="" />
                      <el-option
                        v-for="card in chargingCardList"
                        :key="card.id"
                        :label="`${card.cardNo}(${card.cardName})`"
                        :value="card.id"
                      >
                        <span style="font-size: 12px"
                          >{{ card.cardNo }}({{ card.cardName }})</span
                        >
                      </el-option>
                    </template>
                  </el-select>
                  <!-- 日期选择器 -->
                  <el-date-picker
                    v-else-if="field.type === 'daterange'"
                    v-model="queryData[field.prop]"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    size="small"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
  
            <!-- 高级筛选 - 只在需要时显示 -->
            <el-collapse-transition v-if="needAdvancedSearch">
              <el-row :gutter="16" v-show="showAdvanced" class="search-row">
                <!-- 高级筛选内容为空 -->
              </el-row>
            </el-collapse-transition>
  
            <!-- 操作按钮行 - 更合理的布局 -->
            <div class="form-actions compact-actions">
              <div class="action-left">
         
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
                <el-button
                  v-if="needAdvancedSearch"
                  type="text"
                  size="small"
                  @click="showAdvanced = !showAdvanced"
                  style="padding: 7px 8px"
                >
                  <i class="el-icon-s-operation" style="margin-right: 4px"></i>
                  高级筛选
                  <i
                    :class="
                      showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'
                    "
                    style="margin-left: 2px"
                  ></i>
                </el-button>
                <el-divider
                  v-if="needAdvancedSearch"
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
                    <el-dropdown-item command="import" icon="el-icon-upload2">
                      导入数据
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="batch"
                      icon="el-icon-s-operation"
                      divided
                    >
                      批量操作
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
                <!-- 充电卡信息 -->
                <template v-if="col.key === 'cardInfo'">
                  <span style="color: #000;">
                    {{ scope.row.cardInfo || "-" }}
                  </span>
                </template>
  
                <!-- 交易类型 -->
                <template v-else-if="col.key === 'transactionTypeLabel'">
                  <span v-if="scope.row.transactionType == 1" style="color: #67C23A;">充值</span>
                  <span v-else-if="scope.row.transactionType == 2" style="color: #E6A23C;">消费</span>
                  <span v-else-if="scope.row.transactionType == 3" style="color: #409EFF;">退款</span>
                  <span v-else>-</span>
                </template>
  
                <!-- 金额显示 -->
                <template v-else-if="col.key === 'amount'">
                  <span class="amount-text" :style="{ color: getAmountColor(scope.row, col.key) }">
                    {{
                      scope.row[col.key] !== null &&
                      scope.row[col.key] !== undefined
                        ? (scope.row[col.key] >= 0 ? "+" : "") + "¥" + parseFloat(scope.row[col.key]).toFixed(2)
                        : "-"
                    }}
                  </span>
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
              fixed="right"
              align="center"
            >
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="mini"
                  icon="el-icon-view"
                  @click="handleTransactionDetail(scope.row)"
                  style="padding: 1px 2px; font-size: 11px; min-width: auto;"
                >
                  详情
                </el-button>
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
  
      <!-- 编辑弹窗 -->
      <el-dialog
        :title="editForm.id ? '编辑流水' : '新增流水'"
        :visible.sync="dialogVisible"
        width="680px"
        :close-on-click-modal="false"
        class="custom-dialog"
      >
        <el-form
          ref="editForm"
          :model="editForm"
          :rules="rules"
          label-width="100px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="充电卡" prop="cardId">
                <el-select
                  v-model="editForm.cardId"
                  placeholder="请选择充电卡"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="card in chargingCardList"
                    :key="card.id"
                    :label="card.cardNo"
                    :value="card.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="交易类型" prop="transactionType">
                <el-select
                  v-model="editForm.transactionType"
                  placeholder="请选择交易类型"
                  style="width: 100%"
                >
                  <el-option label="充值" value="1" />
                  <el-option label="消费" value="2" />
                  <el-option label="退款" value="3" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
  
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="交易金额" prop="amount">
                <el-input-number
                  v-model="editForm.amount"
                  :precision="2"
                  placeholder="请输入交易金额"
                  style="width: 100%"
                />
                <span style="margin-left: 8px; color: #909399;">元</span>
              </el-form-item>
            </el-col>
          </el-row>
                </el-select>
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
                  placeholder="请输入备注信息"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSave">
            {{ submitting ? "保存中..." : "确 定" }}
          </el-button>
        </span>
      </el-dialog>
    </div>
  </template>
  
  <script>
  // 模拟API方法
  const mockApi = {
    // 获取流水列表
    getBillingList: (params) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockData = [];
          for (let i = 1; i <= 15; i++) {
            const transactionType = Math.floor(Math.random() * 3) + 1; // 只保留1,2,3
            let amount;
            
            // 根据交易类型设置金额
            if (transactionType === 1) { // 充值
              amount = (Math.random() * 200 + 50).toFixed(2);
            } else if (transactionType === 2) { // 消费
              amount = -(Math.random() * 50 + 10).toFixed(2);
            } else { // 退款
              amount = (Math.random() * 100 + 20).toFixed(2);
            }
            
            mockData.push({
              id: i,
              transactionNo: `LS${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Date.now() + i).slice(-8)}`,
              cardId: Math.floor(Math.random() * 10) + 1,
              cardInfo: `CK${String(Math.floor(Math.random() * 10) + 1).padStart(6, '0')}`,
              transactionType: transactionType,
              amount: amount,
              createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }),
            });
          }
          resolve({
            code: 200,
            data: {
              dataList: mockData,
              total: 300
            }
          });
        }, 500);
      });
    },
  
    // 获取充电卡列表
    getChargingCardList: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockData = [];
          for (let i = 1; i <= 30; i++) {
            mockData.push({
              id: i,
              cardNo: `CK${String(i).padStart(6, '0')}`,
              cardName: `充电卡${i}`,
            });
          }
          resolve({
            code: 200,
            data: mockData
          });
        }, 300);
      });
    },
  
    // 获取租户列表
    getTenantList: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockData = [];
          for (let i = 1; i <= 50; i++) {
            mockData.push({
              tenantId: `T${String(i).padStart(3, '0')}`,
              tenantName: `${['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'][Math.floor(Math.random() * 8)]}${['科技', '贸易', '实业', '文化', '教育'][Math.floor(Math.random() * 5)]}公司`,
            });
          }
          resolve({
            code: 200,
            data: mockData
          });
        }, 300);
      });
    }
  };
  
  export default {
    name: "ChargingCardBilling",
    data() {
      return {
        tableHeightConfig: {
          headerHeight: 48,
          rowHeight: 47,
          minHeight: 200,
          maxRows: 10,
          paginationHeight: 68,
        },
        // 查询参数
        queryData: {
          transactionNo: "",
          cardId: "",
          transactionType: "",
          managerId: "",
        },
        // 搜索字段配置
        searchFields: {
          basic: [
            { prop: "transactionNo", label: "流水号", type: "input" },
            { prop: "cardId", label: "充电卡", type: "select" },
            { prop: "transactionType", label: "交易类型", type: "select" },
          ],
          advanced: [],
        },
        // 租户列表数据
        tenantList: [],
        // 充电卡列表数据
        chargingCardList: [],
        // 表格数据
        tableData: [],
        // 加载状态
        loading: false,
        submitting: false,
        // 是否显示高级筛选
        showAdvanced: false,
        // 分页数据
        pageData: {
          current: 1,
          size: 15,
          total: 0,
        },
        // 选中的数据
        selectedData: [],
        // 编辑弹窗
        dialogVisible: false,
        // 编辑表单
        editForm: {
          id: "",
          cardId: "",
          transactionType: "",
          amount: null,
          managerId: "",
        },
        // 表单验证规则
        rules: {
          cardId: [
            { required: true, message: "请选择充电卡", trigger: "change" },
          ],
          transactionType: [
            { required: true, message: "请选择交易类型", trigger: "change" },
          ],
          amount: [
            { required: true, message: "请输入交易金额", trigger: "blur" },
          ],
        },
        // 表格列配置
        tableKey: [
          {
            label: "卡ID",
            key: "cardInfo",
            checked: true,
            disabled: true,
          },
          {
            label: "流水号",
            key: "transactionNo",
            checked: true,
            disabled: true,
          },
          {
            label: "交易类型",
            key: "transactionTypeLabel",
            checked: true,
          },
          {
            label: "金额",
            key: "amount",
            checked: true,
          },
          {
            label: "变动时间",
            key: "createTime",
            checked: true,
          },
        ],
      };
    },
    computed: {
      dataLength() {
        return this.tableData.length;
      },
      // 计算需要显示的列
      displayColumns() {
        return this.tableKey.filter((col) => col.checked !== false);
      },
      // 判断是否需要显示高级筛选按钮
      needAdvancedSearch() {
        const totalFields =
          this.searchFields.basic.length + this.searchFields.advanced.length;
        return totalFields > 5;
      },
      // 获取实际显示的基础搜索字段
      displayBasicFields() {
        if (!this.needAdvancedSearch) {
          return [...this.searchFields.basic, ...this.searchFields.advanced];
        }
        return this.searchFields.basic;
      },
      // 获取高级搜索字段
      displayAdvancedFields() {
        return this.searchFields.advanced;
      },
      // 动态计算表格高度
      dynamicTableHeight() {
        const dataLength = this.tableData.length;
  
        if (dataLength === 0) {
          return this.tableHeightConfig.minHeight;
        }
  
        if (dataLength <= this.tableHeightConfig.maxRows) {
          return (
            this.tableHeightConfig.headerHeight +
            dataLength * this.tableHeightConfig.rowHeight
          );
        }
  
        return (
          this.tableHeightConfig.headerHeight +
          this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
        );
      },
      tableMaxHeight() {
        return (
          this.tableHeightConfig.headerHeight +
          this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
        );
      },
    },
        mounted() {
      this.queryData.managerId = "MANAGER001"; // 模拟管理员ID
      this.fetchTableData();
      this.getChargingCardList();
    },
  
    methods: {
      // 根据交易类型和字段获取金额颜色
      getAmountColor(row, key) {
        if (key === 'amount') {
          const amount = parseFloat(row.amount);
          if (amount > 0) {
            return '#67C23A'; // 绿色 - 收入
          } else if (amount < 0) {
            return '#F56C6C'; // 红色 - 支出
          }
          return '#909399'; // 灰色 - 零
        }
        return '#606266'; // 默认颜色
      },
  
      // 获取租户列表
      async getTenantList() {
        try {
          const response = await mockApi.getTenantList();
          if (response.code === 200) {
            this.tenantList = response.data || [];
          }
        } catch (error) {
          console.error("获取租户列表失败:", error);
          this.tenantList = [];
        }
      },
  
      // 获取充电卡列表
      async getChargingCardList() {
        try {
          const response = await mockApi.getChargingCardList();
          if (response.code === 200) {
            this.chargingCardList = response.data || [];
          }
        } catch (error) {
          console.error("获取充电卡列表失败:", error);
          this.chargingCardList = [];
        }
      },
  
      // 获取流水列表数据
      async fetchTableData() {
        this.loading = true;
        try {
          const params = {
            transactionNo: this.queryData.transactionNo,
            cardId: this.queryData.cardId,
            transactionType: this.queryData.transactionType,
            managerId: this.queryData.managerId,
            page: {
              current: this.pageData.current,
              size: this.pageData.size,
              orders: [{ asc: false, column: "createTime" }],
            },
          };
  
          const response = await mockApi.getBillingList(params);
  
          if (response.code === 200 && response.data) {
            this.tableData = response.data.dataList || [];
            this.pageData.total = response.data.total || 0;
          } else {
            this.$message.error(response.msg || "获取数据失败");
          }
        } catch (error) {
          this.$message.error("获取流水数据失败");
          console.error("获取流水数据失败:", error);
        } finally {
          this.loading = false;
        }
      },
  
      // 查询
      handleSearch() {
        this.pageData.current = 1;
        this.fetchTableData();
      },
  
      // 重置
      handleReset() {
        this.queryData = {
          transactionNo: "",
          cardId: "",
          transactionType: "",
          managerId: "MANAGER001",
        };
        this.showAdvanced = false;
        this.handleSearch();
      },
  
      // 处理顶部下拉命令
      handleCommand(command) {
        switch (command) {
          case "export":
            this.handleExport();
            break;
          case "import":
            this.$message.info("导入功能开发中...");
            break;
          case "batch":
            this.$message.info("批量操作功能开发中...");
            break;
        }
      },
  
      // 新增流水
      handleAdd() {
        this.editForm = {
          id: "",
          cardId: "",
          transactionType: "",
          amount: null,
          managerId: "MANAGER001",
        };
        this.dialogVisible = true;
        this.$nextTick(() => {
          this.$refs.editForm && this.$refs.editForm.clearValidate();
        });
      },
  
      // 保存
      async handleSave() {
        this.$refs.editForm.validate(async (valid) => {
          if (valid) {
            this.submitting = true;
            try {
              // 模拟API调用
              await new Promise(resolve => setTimeout(resolve, 1000));
              this.$message.success("操作成功");
              this.dialogVisible = false;
              this.fetchTableData();
            } catch (error) {
              this.$message.error("操作失败");
              console.error("保存失败:", error);
            } finally {
              this.submitting = false;
            }
          }
        });
      },
  
      // 流水详情
      handleTransactionDetail(row) {
        this.$message.info(`查看流水详情: ${row.transactionNo}`);
        // this.$router.push({
        //   path: `/application/charging-billing/billing/detail/${row.id}`,
        //   query: { transactionNo: row.transactionNo }
        // });
      },
  
      // 充电卡详情
      handleCardDetail(row) {
        this.$message.info(`查看充电卡详情: ${row.cardInfo}`);
        // this.$router.push({
        //   path: `/application/charging-billing/card/detail/${row.cardId}`,
        //   query: { cardInfo: row.cardInfo }
        // });
      },
  
      // 租户点击
      handleTenantClick(row) {
        this.$message.info(`查看租户详情: ${row.tenantInfo}`);
        // this.$router.push({
        //   path: "/application/tenant/detail",
        //   query: { id: row.tenantId }
        // });
      },
  
      // 关联订单点击
      handleOrderClick(row) {
        this.$message.info(`查看关联订单: ${row.relatedOrderNo}`);
        // this.$router.push({
        //   path: "/application/charging-management/order/detail",
        //   query: { orderNo: row.relatedOrderNo }
        // });
      },
  
      // 导出数据
      handleExport() {
        if (this.selectedData.length === 0) {
          this.$message.warning("请先选择要导出的数据");
          return;
        }
        this.$message.info("导出功能开发中...");
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
  
  // 额外样式
  .amount-text {
    font-weight: 500;
  }
  
  .text-muted {
    color: #909399;
  }
  </style>