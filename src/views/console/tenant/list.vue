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
          <!-- 基础筛选 -->
          <el-row :gutter="20" class="search-row">
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="租户ID" class="compact-form-item">
                <el-input
                  v-model="queryData.id"
                  placeholder="请输入租户ID"
                  clearable
                  size="small"
                />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="标签" class="compact-form-item">
                <el-select
                  v-model="queryData.labelIds"
                  multiple
                  placeholder="请选择标签"
                  clearable
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in labelList"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="余额状态" class="compact-form-item">
                <el-select
                  v-model="queryData.balanceStatus"
                  placeholder="请选择余额状态"
                  clearable
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in balanceStatusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 操作按钮行 -->
          <div class="form-actions compact-actions">
            <div class="action-left">
              <el-button
                type="primary"
                icon="el-icon-plus"
                size="small"
                @click="handleAdd"
                class="gradient-button"
              >
                新增租户
              </el-button>
            </div>

            <div class="action-center">
              <!-- 视图切换 -->
              <el-radio-group
                v-model="viewType"
                size="small"
                class="view-switcher"
              >
                <el-radio-button label="card">
                  <i class="el-icon-menu"></i> 卡片视图
                </el-radio-button>
                <el-radio-button label="table">
                  <i class="el-icon-s-grid"></i> 表格视图
                </el-radio-button>
              </el-radio-group>
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
            </div>
          </div>
        </el-form>
      </el-card>
    </div>

    <!-- 数据展示区域 - 使用 v-show 替代 v-if 避免闪烁 -->
    <div class="data-container">
      <!-- 卡片视图 -->
      <div v-show="viewType === 'card'" class="card-view-container">
        <div v-loading="loading" class="card-grid">
          <div
            v-for="item in tableData"
            :key="item.id"
            class="tenant-card-modern"
            @click="handleDetail(item)"
          >
            <!-- 卡片头部 - 重新设计 -->
            <div
            v-if="item.balanceStatus !== 1"
              class="card-ribbon"
              :class="'ribbon-' + getBalanceStatusClass(item.balanceStatus)"
            >
              {{ getBalanceStatusLabel(item.balanceStatus) }}
            </div>

            <div class="card-header-modern">
              <div class="tenant-avatar">
                <img
                  v-if="item.logoUrl"
                  :src="item.logoUrl"
                  alt=""
                  @error="handleImageError($event)"
                />
                <div v-else class="avatar-placeholder">
                  {{ (item.name || "租户")[0] }}
                </div>
              </div>
              <div class="tenant-info">
                <h3 class="tenant-name" :title="item.name">
                  {{ item.name || "-" }}
                </h3>
                <span class="tenant-code">ID: {{ item.id }}</span>
              </div>
              <el-button
                type="text"
                size="mini"
                icon="el-icon-s-grid"
                class="qr-button"
                @click.stop="handleQrcode(item)"
              >
              </el-button>
            </div>

            <!-- 标签展示 - 多彩设计 -->
            <div class="card-tags">
              <el-tag
                v-for="(tag, index) in (item.labelList || []).slice(0, 3)"
                :key="tag.id"
                size="mini"
                :class="'custom-tag tag-color-' + (index % 5)"
              >
                {{ tag.name }}
              </el-tag>
              <el-tag
                v-if="item.labelList && item.labelList.length > 3"
                size="mini"
                type="info"
              >
                +{{ item.labelList.length - 3 }}
              </el-tag>
              <span
                v-if="!item.labelList || item.labelList.length === 0"
                class="no-tags"
                >暂无标签</span
              >
            </div>

            <!-- 关键信息展示 -->
            <div class="card-metrics">
              <div class="metric-item">
                <span class="metric-label">公摊面积</span>
                <span class="metric-value">{{ item.publicArea || 0 }}㎡</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">创建时间</span>
                <span class="metric-value">{{
                  formatDate(item.createTime)
                }}</span>
              </div>
            </div>

            <!-- 余额展示 - 突出设计 -->
            <div class="balance-section">
              <div class="balance-main">
                <span class="balance-label">账户余额</span>
                <span
                  class="balance-amount"
                  :class="getBalanceClass(item.balance)"
                >
                  <span class="currency">¥</span>
                  <span class="amount">{{ formatBalance(item.balance) }}</span>
                </span>
              </div>
              <div class="balance-actions">
                <el-button
                type="primary"
                  size="mini"
                  @click.stop="handleDetail(item)"
                >
                  详情
                </el-button>
                <el-button size="mini"  @click.stop="handleRecharge(item)">
                  充值
                </el-button>
                <el-button size="mini"  @click.stop="handleDeduct(item)">
                  扣款
                </el-button>
                <el-button
                  v-if="item.balanceStatus !== 1"
                  size="mini"
                  type="warning"
                  plain
                  @click.stop="handleUrge(item)"
                >
                  催缴
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空数据提示 -->
        <el-empty
          v-if="!loading && tableData.length === 0"
          description="暂无数据"
        />
      </div>

      <!-- 表格视图 -->
      <div v-show="viewType === 'table'" class="table-container">
        <div class="table-card" shadow="never">
          <!-- 数据表格 -->
          <el-table
            :height="dataLength > 9 ? dynamicTableHeight : null"
            v-loading="loading"
            :data="tableData"
            stripe
            style="width: 100%"
            class="custom-table"
            :header-cell-style="{
              background: 'linear-gradient(180deg, #f8f9fc 0%, #f0f2f5 100%)',
              color: '#1f2329',
              fontWeight: '600',
              fontSize: '13px',
              borderBottom: '2px solid #e8e8e8',
            }"
            :row-class-name="tableRowClassName"
          >
            <!-- 租户ID -->
            <el-table-column
              prop="id"
              label="租户ID"
              width="100"
              align="center"
              fixed="left"
            />

            <!-- 租户名 - 优化对齐 -->
            <el-table-column
              prop="name"
              label="租户名"
              min-width="200"
              fixed="left"
            >
              <template slot-scope="scope">
                <div class="tenant-cell">
                  <img
                    v-if="scope.row.logoUrl"
                    :src="scope.row.logoUrl"
                    alt=""
                    class="tenant-logo"
                    @error="handleImageError($event)"
                  />
                  <div v-else class="logo-placeholder">
                    {{ (scope.row.name || "租")[0] }}
                  </div>
                  <el-link
                    type="primary"
                    @click="handleDetail(scope.row)"
                    class="tenant-link"
                  >
                    {{ scope.row.name }}
                  </el-link>
                </div>
              </template>
            </el-table-column>

            <!-- 标签 - 多彩展示 -->
            <el-table-column
              prop="labelList"
              label="标签"
              width="220"
              align="center"
            >
              <template slot-scope="scope">
                <div
                  v-if="scope.row.labelList && scope.row.labelList.length"
                  class="table-tags"
                >
                  <el-tag
                    v-for="(tag, index) in scope.row.labelList.slice(0, 3)"
                    :key="tag.id"
                    size="mini"
                    :class="'custom-tag tag-color-' + (index % 5)"
                  >
                    {{ tag.name }}
                  </el-tag>
                  <el-tag
                    v-if="scope.row.labelList.length > 3"
                    size="mini"
                    type="info"
                  >
                    +{{ scope.row.labelList.length - 3 }}
                  </el-tag>
                </div>
                <span v-else class="no-data">-</span>
              </template>
            </el-table-column>

            <!-- 租户余额 -->
            <el-table-column
              prop="balance"
              label="租户余额"
              width="130"
              align="center"
              sortable
            >
              <template slot-scope="scope">
                <span
                  :class="getBalanceClass(scope.row.balance)"
                  class="balance-cell"
                >
                  ¥{{ formatBalance(scope.row.balance) }}
                </span>
              </template>
            </el-table-column>

            <!-- 余额状态 -->
            <el-table-column
              prop="balanceStatus"
              label="余额状态"
              width="110"
              align="center"
            >
              <template slot-scope="scope">
                <el-tag
                  :type="getBalanceStatusType(scope.row.balanceStatus)"
                  size="small"
                  effect="dark"
                >
                  {{ getBalanceStatusLabel(scope.row.balanceStatus) }}
                </el-tag>
              </template>
            </el-table-column>

            <!-- 线上充值金额 -->
            <el-table-column
              prop="onlineRechargeAmt"
              label="线上充值"
              width="130"
              align="center"
            >
              <template slot-scope="scope">
                <span class="amount-cell">
                  {{
                    scope.row.onlineRechargeAmt ||
                    scope.row.onlineRechargeAmt === 0
                      ? "¥" + formatNumber(scope.row.onlineRechargeAmt)
                      : "-"
                  }}
                </span>
              </template>
            </el-table-column>

            <!-- 开票总金额 -->
            <el-table-column
              prop="onBillAmt"
              label="开票金额"
              width="130"
              align="center"
            >
              <template slot-scope="scope">
                <span class="amount-cell">
                  {{
                    scope.row.onBillAmt || scope.row.onBillAmt === 0
                      ? "¥" + formatNumber(scope.row.onBillAmt)
                      : "-"
                  }}
                </span>
              </template>
            </el-table-column>

            <!-- 二维码 -->
            <el-table-column label="二维码" width="90" align="center">
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="small"
                  icon="el-icon-s-grid"
                  @click="handleQrcode(scope.row)"
                  class="icon-button"
                >
                </el-button>
              </template>
            </el-table-column>

            <!-- 操作列 - 固定右侧 -->
            <el-table-column
              label="操作"
              width="200"
              fixed="right"
              align="center"
              class-name="table-actions-column"
            >
              <template slot-scope="scope">
                <div class="table-actions-group">
                  <el-button
                    type="text"
                    size="small"
                    @click="handleDetail(scope.row)"
                    class="action-btn primary"
                  >
                    详情
                  </el-button>
                  <el-button
                    v-if="scope.row.balanceStatus !== 1"
                    type="text"
                    size="small"
                    @click="handleUrge(scope.row)"
                    class="action-btn warning"
                  >
                    催缴
                  </el-button>
                  <el-dropdown
                    trigger="click"
                    @command="handleTableCommand($event, scope.row)"
                  >
                    <el-button type="text" size="small" class="action-btn">
                      更多<i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="recharge" icon="el-icon-plus">
                        手动充值
                      </el-dropdown-item>
                      <el-dropdown-item command="deduct" icon="el-icon-minus">
                        手动扣款
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 空数据提示 -->
          <el-empty
            v-if="!loading && tableData.length === 0"
            description="暂无数据"
          />
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="pageData.total > 0">
      <el-pagination
        :current-page="pageData.current"
        :page-sizes="[6, 12, 30, 60]"
        :page-size="pageData.size"
        :total="pageData.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="modern-pagination"
      />
    </div>

    <!-- 新增/编辑租户弹窗 -->
    <AddTenantDialog
      :visible.sync="addDialogVisible"
      :tenant-data="editForm"
      :label-list="labelList"
      :manager-id="currentManagerId"
      @success="handleAddSuccess"
    />

    <!-- 手动充值弹窗 -->
    <RechargeDialog
      :visible.sync="rechargeVisible"
      :tenant-data="currentTenant"
      @success="handleRechargeSuccess"
    />

    <!-- 手动扣款弹窗 -->
    <DeductDialog
      :visible.sync="deductVisible"
      :tenant-data="currentTenant"
      @success="handleDeductSuccess"
    />

    <!-- 二维码查看弹窗 -->
    <QrcodeDialog :visible.sync="qrcodeVisible" :tenant-data="currentTenant" />
  </div>
</template>

<script>
// 导入API
import {
  tenantPageTenant,
  tenantAdd,
  tenantUpdate,
  tenantGetById,
} from "@/api/tenant";
import { labelList } from "@/api/label";
import { balancePush } from "@/api/pay";
import { mapGetters } from "vuex";

// 导入子组件
import AddTenantDialog from "./components/AddTenantDialog.vue";
import RechargeDialog from "./components/RechargeDialog.vue";
import DeductDialog from "./components/DeductDialog.vue";
import QrcodeDialog from "./components/QrcodeDialog.vue";

export default {
  name: "TenantManagement",
  components: {
    AddTenantDialog,
    RechargeDialog,
    DeductDialog,
    QrcodeDialog,
  },
  data() {
    return {
      tableHeightConfig: {
        headerHeight: 48, // 表头高度
        rowHeight: 47, // 每行高度
        minHeight: 200, // 最小高度
        maxRows: 10, // 最大显示行数（超过9行显示滚动条）
        paginationHeight: 68, // 分页高度
      },
      // 视图类型：默认卡片视图
      viewType: "card",

      // 查询参数
      queryData: {
        id: "",
        name: "",
        labelIds: [],
        balanceStatus: "",
        managerId: "",
        tenantStatus: 0, // 0-正常，1-注销
      },

      // 余额状态选项
      balanceStatusOptions: [
        { value: 1, label: "正常" },
        { value: 2, label: "余额不足" },
        { value: 3, label: "欠费" },
      ],

      // 标签列表
      labelList: [],

      // 表格数据
      tableData: [],
      loading: false,
      submitting: false,

      // 分页数据
      pageData: {
        current: 1,
        size: 6,
        total: 0,
      },

      // 弹窗状态
      addDialogVisible: false,
      rechargeVisible: false,
      deductVisible: false,
      qrcodeVisible: false,

      // 当前操作的租户
      currentTenant: {},

      // 编辑表单
      editForm: {},
    };
  },

  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    dataLength() {
      return this.tableData.length;
    },
    dynamicTableHeight() {
      const dataLength = this.tableData.length;

      if (dataLength === 0) {
        return this.tableHeightConfig.minHeight;
      }

      // 数据 <= 9条：显示实际行数高度
      if (dataLength <= this.tableHeightConfig.maxRows) {
        return (
          this.tableHeightConfig.headerHeight +
          dataLength * this.tableHeightConfig.rowHeight
        );
      }

      // 数据 > 9条：固定显示9行高度 + 内部滚动
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
          this.queryData.managerId = newVal;
          this.fetchLabelList();
          this.fetchTableData();
        }
      },
      immediate: true,
    },
  },

  methods: {
    // 获取标签列表
    async fetchLabelList() {
      try {
        const response = await labelList({
          managerId: this.queryData.managerId,
          type: 1, // 租户标签类型
        });
        if (response.code === 200) {
          this.labelList = response.data || [];
        }
      } catch (error) {
        console.error("获取标签列表失败:", error);
      }
    },

    // 获取表格数据
    async fetchTableData() {
      this.loading = true;
      try {
        const params = {
          id: this.queryData.id,
          managerId: this.queryData.managerId,
          labelIds: this.queryData.labelIds.join(","),
          balanceStatus: this.queryData.balanceStatus || null,
          tenantStatus: this.queryData.tenantStatus,
          idList: [],
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
            orders: [
              { asc: true, column: "id" },
              { asc: true, column: "tenantStatus" },
            ],
          },
        };

        const response = await tenantPageTenant(params);

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || [];
          this.pageData.total = response.data.total || 0;
        } else {
          this.$message.error(response.msg || "获取数据失败");
        }
      } catch (error) {
        this.$message.error("获取租户数据失败");
        console.error("获取租户数据失败:", error);
      } finally {
        this.loading = false;
      }
    },

    // 格式化余额
    formatBalance(balance) {
      return (balance || 0).toFixed(2);
    },

    // 格式化数字（千分位）
    formatNumber(num) {
      return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return "-";
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
    },

    // 格式化电话列表
    formatPhoneList(phoneList) {
      if (!phoneList || phoneList.length === 0) return "-";
      return phoneList.filter((phone) => phone).join("、") || "-";
    },

    // 获取余额样式类
    getBalanceClass(balance) {
      if (balance < 0) return "balance-danger";
      if (balance < 50) return "balance-warning";
      return "balance-success";
    },

    // 获取余额状态类
    getBalanceStatusClass(status) {
      const classMap = {
        1: "success",
        2: "warning",
        3: "info",
        4: "danger",
      };
      return classMap[status] || "info";
    },

    // 获取余额状态标签
    getBalanceStatusLabel(status) {
      const statusMap = {
        1: "正常",
        2: "余额不足",
        3: "欠费",
      };
      return statusMap[status] || "未知";
    },

    // 获取余额状态类型
    getBalanceStatusType(status) {
      const typeMap = {
        1: "success",
        2: "warning",
        3: "info",
        4: "danger",
      };
      return typeMap[status] || "info";
    },

    // 表格行样式
    tableRowClassName({ row, rowIndex }) {
      return rowIndex % 2 === 0 ? "even-row" : "odd-row";
    },

    // 处理图片加载错误
    handleImageError(event) {
      event.target.style.display = "none";
    },

    // 查询
    handleSearch() {
      this.pageData.current = 1;
      this.fetchTableData();
    },

    // 重置
    handleReset() {
      this.queryData = {
        id: "",
        name: "",
        labelIds: [],
        balanceStatus: "",
        managerId: this.currentManagerId,
        tenantStatus: 0,
      };
      this.handleSearch();
    },

    // 新增租户
    handleAdd() {
      this.editForm = {};
      this.addDialogVisible = true;
    },

    // 新增成功
    handleAddSuccess() {
      this.addDialogVisible = false;
      this.fetchTableData();
    },

    // 查看详情
    handleDetail(row) {
      // this.$router.push({
      //   path: "/tenant-detail",
      //   query: { id: row.id },
      // });
    },

    // 催缴
    async handleUrge(row) {
      if (row.balanceStatus === 1) {
        this.$message.warning("该租户暂不需要催缴");
        return;
      }

      try {
        await this.$confirm(
          `确定要向租户 ${row.name} 发送催缴通知吗？`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        const response = await balancePush(row.id);
        if (response.code === 200) {
          this.$message.success("催缴通知发送成功");
          this.fetchTableData();
        } else {
          this.$message.error(response.msg || "催缴失败");
        }
      } catch (error) {
        if (error !== "cancel") {
          console.error("催缴失败:", error);
        }
      }
    },

    // 手动充值
    handleRecharge(row) {
      this.currentTenant = row;
      this.rechargeVisible = true;
    },

    // 充值成功
    handleRechargeSuccess() {
      this.rechargeVisible = false;
      this.fetchTableData();
    },

    // 手动扣款
    handleDeduct(row) {
      this.currentTenant = row;
      this.deductVisible = true;
    },

    // 扣款成功
    handleDeductSuccess() {
      this.deductVisible = false;
      this.fetchTableData();
    },

    // 查看二维码
    handleQrcode(row) {
      this.currentTenant = row;
      this.qrcodeVisible = true;
    },

    // 处理表格下拉命令
    handleTableCommand(command, row) {
      switch (command) {
        case "recharge":
          this.handleRecharge(row);
          break;
        case "deduct":
          this.handleDeduct(row);
          break;
      }
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

// 全局变量
$primary-color: #409eff;
$primary-light: #66b1ff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$info-color: #909399;

// 视图切换样式 - 改为蓝色
.view-switcher {
  margin: 0 24px;

  ::v-deep .el-radio-button__inner {
    padding: 8px 16px;
    font-size: 13px;
    border-radius: 20px;
    transition: all 0.3s;

    &:hover {
      background: rgba(64, 158, 255, 0.05);
    }
  }

  ::v-deep .el-radio-button__orig-radio:checked + .el-radio-button__inner {
    background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  }
}

// 操作栏布局
.form-actions {
  .action-center {
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: center;
  }
}

// 渐变按钮 - 保持原有紫色渐变
.gradient-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white !important;

  &:hover {
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
}

// 卡片视图容器
.card-view-container {
  min-height: 400px;

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); // 改小到340px
    gap: 16px; // 减小间距
    padding: 4px;
  }
}

// 现代化卡片设计 - 保持原有样式，稍微缩小
.tenant-card-modern {
  background: white;
  border-radius: 16px;
  padding: 0;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);

    .card-header-modern {
      background: linear-gradient(135deg, #f6f8fb 0%, #fff 100%);
    }
  }

  // 状态标签
  .card-ribbon {
    position: absolute;
    top: 12px;
    right: -30px;
    transform: rotate(45deg);
    width: 120px;
    text-align: center;
    font-size: 11px;
    padding: 4px 0;
    color: white;
    font-weight: 500;
    z-index: 1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &.ribbon-success {
      background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
    }

    &.ribbon-warning {
      background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
    }

    &.ribbon-danger {
      background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
    }

    &.ribbon-info {
      // background: linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%);
      background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
    }
  }

  // 卡片头部 - 稍微缩小尺寸
  .card-header-modern {
    display: flex;
    align-items: center;
    padding: 16px; // 从20px改为16px
    background: linear-gradient(135deg, #fff 0%, #f6f8fb 100%);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    transition: background 0.3s;

    .tenant-avatar {
      width: 42px; // 从48px改为42px
      height: 42px;
      margin-right: 14px; // 从16px改为14px
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        border-radius: 12px;
        object-fit: cover;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px; // 从20px改为18px
        font-weight: 600;
        text-transform: uppercase;
      }
    }

    .tenant-info {
      flex: 1;
      min-width: 0;

      .tenant-name {
        margin: 0;
        font-size: 15px; // 从16px改为15px
        font-weight: 600;
        color: #1f2329;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tenant-code {
        font-size: 12px;
        color: #8e92a0;
        margin-top: 2px;
        display: inline-block;
      }
    }

    .qr-button {
      color: #8e92a0;
      padding: 8px;
      font-size: 20px;

      &:hover {
        color: $primary-color;
        background: rgba(64, 158, 255, 0.1);
        border-radius: 8px;
      }
    }
  }

  // 标签区域 - 保持原有彩色设计
  .card-tags {
    padding: 10px 16px; // 从12px改为10px
    min-height: 32px; // 从36px改为32px
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;

    .custom-tag {
      border: none;
      padding: 3px 8px; // 从4px改为3px
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;

      &.tag-color-0 {
        background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
        color: #d63031;
      }

      &.tag-color-1 {
        background: linear-gradient(135deg, #a8e6cf 0%, #81c784 100%);
        color: #2e7d32;
      }

      &.tag-color-2 {
        background: linear-gradient(135deg, #c3cfe2 0%, #a1c4fd 100%);
        color: #1565c0;
      }

      &.tag-color-3 {
        background: linear-gradient(135deg, #fccb90 0%, #d57eeb 100%);
        color: #6a1b9a;
      }

      &.tag-color-4 {
        background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
        color: #512da8;
      }
    }

    .no-tags {
      color: #bfbfbf;
      font-size: 12px;
    }
  }

  // 指标展示
  .card-metrics {
    display: flex;
    padding: 14px 16px; // 从16px改为14px
    gap: 24px;
    background: #fafbfc;

    .metric-item {
      flex: 1;

      .metric-label {
        display: block;
        font-size: 11px;
        color: #8e92a0;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .metric-value {
        font-size: 14px;
        color: #1f2329;
        font-weight: 600;
      }
    }
  }

  // 余额展示区域
  .balance-section {
    padding: 14px; // 从16px改为14px
    background: white;
    border-top: 1px solid rgba(0, 0, 0, 0.06);

    .balance-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      .balance-label {
        font-size: 11px;
        color: #8e92a0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .balance-amount {
        display: flex;
        align-items: baseline;

        .currency {
          font-size: 13px;
          margin-right: 2px;
        }

        .amount {
          font-size: 20px;
          font-weight: 700;
        }

        &.balance-success {
          color: $success-color;
        }

        &.balance-warning {
          color: $warning-color;
        }

        &.balance-danger {
          color: $danger-color;
        }
      }
    }

    // 新的操作按钮设计 - 使用蓝色系
    .balance-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
      gap: 4px;

      .el-button {
        padding: 0;
        height: 28px;
        border-radius: 6px;
        font-size: 12px;

        &--mini {
          padding: 0 8px;
        }

        // 详情按钮 - 蓝色
        &--primary:not(.is-plain) {
          background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
          border-color: transparent;
          color: white;

          &:hover {
            background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
          }
        }

        // 普通操作按钮
        &.is-plain {
          background: #f4f5f7;
          border: 1px solid #e4e7ed;
          color: #606266;

          &:hover {
            background: #ecf5ff;
            border-color: #409eff;
            color: #409eff;
          }
        }

        // 警告按钮 - 催缴
        &--warning.is-plain {
          background: #fef5ec;
          border-color: #f6d5a5;
          color: #e6a23c;

          &:hover {
            background: #fdf0e0;
            border-color: #e6a23c;
            color: #d48806;
          }
        }
      }
    }
  }
}

// 表格视图样式优化 - 保持原有样式
.table-container {
  .table-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .custom-table {
    ::v-deep .el-table__row {
      &.even-row {
        background: #fafbfc;
      }

      &:hover > td {
        background: #f0f5ff !important;
      }
    }

    // 租户信息单元格
    .tenant-cell {
      display: flex;
      align-items: center;
      padding: 8px 0;

      .tenant-logo {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        object-fit: cover;
        margin-right: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .logo-placeholder {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: 600;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .tenant-link {
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    // 表格中的标签 - 保持原有彩色设计
    .table-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      justify-content: center;
    }

    // 余额单元格
    .balance-cell {
      font-weight: 600;
      font-size: 14px;
    }

    // 金额单元格
    .amount-cell {
      font-weight: 500;
      color: #1f2329;
    }

    // 操作按钮组 - 增加更多操作按钮
    .table-actions-group {
      display: flex;
      gap: 8px;
      justify-content: center;
      align-items: center;

      .action-btn {
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;

        &:hover {
          background: rgba(64, 158, 255, 0.1);
        }

        &.primary {
          color: $primary-color;
        }

        &.warning {
          color: $warning-color;
        }
      }
    }

    // 图标按钮
    .icon-button {
      font-size: 18px;
      color: #8e92a0;

      &:hover {
        color: $primary-color;
      }
    }
  }
}

// 分页样式 - 使用蓝色
.modern-pagination {
  ::v-deep {
    .el-pagination__total {
      font-weight: 500;
      color: #606266;
    }

    .el-pager li {
      border-radius: 8px;
      margin: 0 2px;

      &.active {
        background: linear-gradient(
          135deg,
          $primary-color 0%,
          $primary-light 100%
        );
        color: white;
      }
    }

    .el-pagination__jump {
      .el-input__inner {
        border-radius: 8px;
      }
    }
  }
}

// 防止页面切换闪烁
.data-container {
  min-height: 500px;
  position: relative;
}

// 响应式设计
@media (max-width: 1400px) {
  .card-view-container {
    .card-grid {
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    }
  }
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
    gap: 12px;

    .action-left,
    .action-center,
    .action-right {
      width: 100%;
      justify-content: center;
    }

    .view-switcher {
      margin: 0;
    }
  }

  .card-view-container {
    .card-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
}
</style>
