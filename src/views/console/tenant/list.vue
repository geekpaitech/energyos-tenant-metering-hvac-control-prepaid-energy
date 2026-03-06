<template>
  <div class="table-page-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-card class="search-card" shadow="never">
        <el-form
          :model="queryData"
          ref="searchForm"
          class="search-form"
          inline
          size="small"
        >
          <!-- 筛选条件 -->
          <el-form-item label="租户名称">
            <el-select
              v-model="queryData.id"
              filterable
              placeholder="请选择或搜索租户"
              clearable
              style="width: 200px"
              :loading="tenantLoading"
              @change="handleSearch"
            >
              <el-option
                v-for="tenant in tenantList"
                :key="tenant.tenantId"
                :label="tenant.name"
                :value="tenant.tenantId"
              />
            </el-select>
          </el-form-item>

          <!-- <el-form-item label="余额状态">
            <el-select
              v-model="queryData.balanceStatus"
              placeholder="余额状态"
              clearable
              style="width: 150px"
              @change="handleSearch"
            >
              <el-option
                v-for="item in balanceStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item> -->

          <el-form-item label="租户状态">
            <el-select
              v-model="queryData.tenantStatus"
              placeholder="租户状态"
              clearable
              style="width: 150px"
              @change="handleSearch"
            >
              <el-option label="正常" :value="0" />
              <el-option label="已注销" :value="1" />
            </el-select>
          </el-form-item>

          <!-- 查询/重置按钮 -->
          <el-form-item>
            <el-button icon="el-icon-refresh-left" @click="handleReset">
              重置
            </el-button>
          </el-form-item>

          <!-- 导出按钮 -->
          <el-form-item style="float: right">
            <el-button icon="el-icon-download" @click="handleExport">
              导出
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 操作按钮行 -->
        <div class="action-bar">
          <div class="action-left">
            <el-button
              type="primary"
              icon="el-icon-plus"
              size="small"
              @click="handleAdd"
            >
              新增
            </el-button>

            <!-- 批量设置下拉菜单 -->
            <el-dropdown trigger="click" @command="handleBatchCommand">
              <el-button size="small">
                批量设置<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="urge" disabled
                  >催缴</el-dropdown-item
                >
                <el-dropdown-item command="payMode" disabled
                  >付费模式</el-dropdown-item
                >
                <el-dropdown-item command="warnQuota" disabled
                  >预警额度</el-dropdown-item
                >
                <el-dropdown-item command="billingPlan" disabled
                  >计费方案</el-dropdown-item
                >
                <el-dropdown-item command="downloadAll">
                  下载租户码
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>

          <div class="action-right">
            <!-- 视图切换 - 表格在前，卡片在后 -->
            <el-radio-group
              v-model="viewType"
              size="mini"
              class="view-switcher-compact"
            >
              <el-radio-button label="table">表格</el-radio-button>
              <el-radio-button label="card">卡片</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 数据展示区域 -->
    <div class="data-container">
      <!-- 表格视图 -->
      <div v-show="viewType === 'table'" class="table-container">
        <el-card class="table-card" shadow="never">
          <el-table
            ref="multipleTable"
            :data="tableData"
            v-loading="loading"
            border
            stripe
            @selection-change="handleSelectionChange"
            style="width: 100%"
          >
            <!-- 勾选列 -->
            <el-table-column type="selection" align="center" />

            <!-- 租户ID -->
            <el-table-column prop="id" label="租户ID" width="80" align="left">
              <template slot-scope="scope">
                <el-tooltip content="点击可复制" placement="top" :open-delay="300">
                  <span class="serial-copy" @click="handleCopySerial(scope.row.id)">
                    {{ scope.row.id || "-" }}
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>

            <!-- 租户名称 -->
            <el-table-column
              prop="name"
              label="租户名称"
              min-width="150"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                <div class="tenant-name-cell">
                  <img
                    v-if="scope.row.logoUrl"
                    :src="scope.row.logoUrl"
                    class="tenant-logo-small"
                    @error="handleImageError($event)"
                  />
                  <div v-else class="logo-placeholder-small">
                    {{ (scope.row.name || "租")[0] }}
                  </div>
                  <el-link type="primary" @click="handleDetail(scope.row)">
                    {{ scope.row.name }}
                  </el-link>
                </div>
              </template>
            </el-table-column>

            <!-- 租户二维码 -->
            <el-table-column label="租户二维码" width="100" align="center">
              <template slot-scope="scope">
                <el-button
                  type="text"
                  icon="el-icon-s-grid"
                  @click="handleQrcode(scope.row)"
                />
              </template>
            </el-table-column>

            <!-- 专用设备 -->
            <el-table-column prop="deviceCount" label="专用设备" align="center">
              <template slot-scope="scope">
                {{ scope.row.deviceCount || 0 }}
              </template>
            </el-table-column>

            <el-table-column label="电费专户(元)" align="right">
              <template slot-scope="scope">
                <span>{{
                  formatBalance(scope.row.meterAccountDto?.balance)
                }}</span>
              </template>
            </el-table-column>

            <el-table-column label="水费专户(元)" align="right">
              <template slot-scope="scope">
                <span>{{
                  formatBalance(scope.row.waterAccountDto?.balance)
                }}</span>
              </template>
            </el-table-column>

            <!-- 租户状态 -->
            <el-table-column label="租户状态" width="100" align="center">
              <template slot-scope="scope">
                <el-tag
                  :type="scope.row.tenantStatus === 0 ? 'success' : 'info'"
                  size="small"
                >
                  {{ scope.row.tenantStatus === 0 ? "正常" : "已注销" }}
                </el-tag>
              </template>
            </el-table-column>

            <!-- 创建时间 -->
            <el-table-column
              prop="createTime"
              min-width="100"
              label="创建时间"
              align="left"
            >
              <template slot-scope="scope">
                {{ formatDateTime(scope.row.createTime) }}
              </template>
            </el-table-column>

            <!-- 操作列 -->
            <el-table-column
              label="操作"
              align="center"
              width="220"
              fixed="right"
            >
              <template slot-scope="scope">
                <div class="action-buttons">
                  <el-button
                    type="text"
                    size="small"
                    @click="handleDeduct(scope.row)"
                  >
                    手动扣款
                  </el-button>
                  <el-button
                    type="text"
                    size="small"
                    @click="handleUrge(scope.row)"
                  >
                    催缴
                  </el-button>
                  <el-dropdown
                    trigger="click"
                    @command="handleRowCommand($event, scope.row)"
                  >
                    <el-button type="text" size="small">
                      更多<i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="edit" icon="el-icon-edit">
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item
                        command="detail"
                        icon="el-icon-document"
                      >
                        详情
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 空数据 -->
          <el-empty
            v-if="!loading && tableData.length === 0"
            description="暂无数据"
          />
        </el-card>
      </div>

      <!-- 卡片视图 -->
      <div v-show="viewType === 'card'" class="card-view-container">
        <div v-loading="loading" class="card-grid">
          <div
            v-for="item in tableData"
            :key="item.id"
            class="tenant-card-modern"
          >
            <!-- 卡片头部 - 添加二维码按钮 -->
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
              <!-- 新增：二维码按钮 -->
              <el-button
                type="text"
                icon="el-icon-s-grid"
                class="qr-button"
                @click.stop="handleQrcode(item)"
              />
            </div>

            <!-- 信息展示 -->
            <div class="card-content">
              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">专用设备：</span>
                  <span class="info-value">{{ item.deviceCount || 0 }}台</span>
                </div>
                <div class="info-item">
                  <span class="info-label">租户余额：</span>
                  <span
                    class="info-value"
                    :class="getBalanceClass(getTotalBalance(item))"
                  >
                    ¥{{ formatBalance(getTotalBalance(item)) }}
                  </span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">电费专户：</span>
                  <span class="info-value">
                    ¥{{ formatBalance(item.meterAccountDto?.balance) }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">水费专户：</span>
                  <span class="info-value">
                    ¥{{ formatBalance(item.waterAccountDto?.balance) }}
                  </span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">租户状态：</span>
                  <el-tag
                    :type="item.tenantStatus === 0 ? 'success' : 'info'"
                    size="mini"
                    effect="dark"
                  >
                    {{ item.tenantStatus === 0 ? "正常" : "已注销" }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <span class="info-label">创建时间：</span>
                  <span class="info-value">{{
                    formatDate(item.createTime)
                  }}</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 - 4个按钮无icon -->
            <div class="card-actions">
              <el-button size="mini" @click.stop="handleDetail(item)">
                详情
              </el-button>
              <el-button size="mini" @click.stop="handleUrge(item)">
                催缴
              </el-button>
              <el-button size="mini" @click.stop="handleRecharge(item)">
                手动充值
              </el-button>
              <el-button size="mini" @click.stop="handleDeduct(item)">
                手动扣款
              </el-button>
            </div>
          </div>
        </div>

        <!-- 空数据提示 -->
        <el-empty
          v-if="!loading && tableData.length === 0"
          description="暂无数据"
        />
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="pageData.total > 0">
      <el-pagination
        :current-page="pageData.current"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageData.size"
        :total="pageData.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
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
import { tenantPageTenant, queryTenantDeviceCount } from "@/api/tenant";
import { getSimpleTenantList } from "@/api/useReport";
import { labelList } from "@/api/label";
import { balancePush } from "@/api/pay";
import { mapGetters } from "vuex";
import QRCode from "qrcodejs2";
import * as XLSX from 'xlsx';

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
      // 视图类型：默认表格
      viewType: "table",

      // 查询参数
      queryData: {
        id: "",
        balanceStatus: "",
        tenantStatus: 0,
        managerId: "",
        labelIds: [],
      },

      // 余额状态选项
      balanceStatusOptions: [
        { value: 1, label: "正常" },
        { value: 2, label: "余额不足" },
        { value: 3, label: "欠费" },
      ],

      // 标签列表
      labelList: [],

      // 租户下拉列表
      tenantList: [],
      tenantLoading: false,

      // 表格数据
      tableData: [],
      loading: false,

      // 多选
      multipleSelection: [],

      // 分页数据
      pageData: {
        current: 1,
        size: 20,
        total: 0,
      },

      // 弹窗状态
      addDialogVisible: false,
      rechargeVisible: false,
      deductVisible: false,
      qrcodeVisible: false,

      // 当前操作的租户
      currentTenant: {},
      editForm: {},
    };
  },

  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
  },

  watch: {
    currentManagerId: {
      handler(newVal) {
        if (newVal) {
          this.queryData.managerId = newVal;
          this.fetchLabelList();
          this.fetchAllTenants();
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
          type: 1,
        });
        if (response.code === 200) {
          this.labelList = response.data || [];
        }
      } catch (error) {
        console.error("获取标签列表失败:", error);
      }
    },

    // 获取所有租户列表
    async fetchAllTenants() {
      this.tenantLoading = true;
      try {
        const response = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0,
        });
        if (response.code === 200) {
          this.tenantList = response.data || [];
        }
      } catch (error) {
        console.error("获取租户列表失败:", error);
      } finally {
        this.tenantLoading = false;
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
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
            orders: [{ asc: false, column: "createTime" }],
          },
        };

        const response = await tenantPageTenant(params);

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || [];
          this.pageData.total = response.data.total || 0;

          // 查询设备数量
          await this.fetchDeviceCount();
        }
      } catch (error) {
        this.$message.error("获取租户数据失败");
      } finally {
        this.loading = false;
      }
    },

    // 查询设备数量
    async fetchDeviceCount() {
      if (this.tableData.length === 0) return;

      try {
        const ids = this.tableData.map((item) => item.id).join(",");
        const response = await queryTenantDeviceCount({ ids });

        if (response.code === 200 && response.data) {
          const deviceCountMap = response.data;
          this.tableData = this.tableData.map((tenant) => ({
            ...tenant,
            deviceCount: deviceCountMap[tenant.id] || 0,
          }));
        }
      } catch (error) {
        console.error("获取设备数量失败:", error);
      }
    },

    // 计算租户总余额（电费专户 + 水费专户）
    getTotalBalance(item) {
      const meterBalance = item.meterAccountDto?.balance || 0;
      const waterBalance = item.waterAccountDto?.balance || 0;
      return meterBalance + waterBalance;
    },

    // 格式化余额
    formatBalance(balance) {
      return (balance || 0).toFixed(2);
    },

    // 格式化日期时间
    formatDateTime(date) {
      if (!date) return "-";
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")} ${String(
        d.getHours()
      ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(
        d.getSeconds()
      ).padStart(2, "0")}`;
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

    // 获取余额样式类
    getBalanceClass(balance) {
      if (balance < 0) return "balance-danger";
      if (balance < 50) return "balance-warning";
      return "balance-success";
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
        3: "danger",
      };
      return typeMap[status] || "info";
    },

    // 处理图片错误
    handleImageError(event) {
      event.target.style.display = "none";
    },

    // 表格多选
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },

    // 复制租户ID
    handleCopySerial(id) {
      if (!id || id === '-') {
        this.$message.warning('无可复制内容');
        return;
      }

      // 创建临时输入框
      const input = document.createElement('input');
      input.value = id;
      document.body.appendChild(input);
      input.select();

      try {
        document.execCommand('copy');
        this.$message.success('租户id已复制');
      } catch (err) {
        this.$message.error('复制失败');
      }

      document.body.removeChild(input);
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
        balanceStatus: "",
        tenantStatus: 0,
        managerId: this.currentManagerId,
        labelIds: [],
      };
      this.handleSearch();
    },

    // 导出
    handleExport() {
      if (this.tableData.length === 0) {
        this.$message.warning("暂无数据可导出");
        return;
      }

      try {
        // 确定要导出的数据：优先导出选中数据，无选中则导出当前页
        const exportData = this.multipleSelection.length > 0 ? this.multipleSelection : this.tableData;

        // 构建导出的表头和数据
        const headers = [
          '租户ID', '租户名称', '专用设备(台)', '电费专户余额(元)', '水费专户余额(元)', '租户状态', '创建时间'
        ];

        const data = exportData.map(row => {
          return [
            row.id || '',
            row.name || '',
            row.deviceCount || 0,
            this.formatBalance(row.meterAccountDto?.balance),
            this.formatBalance(row.waterAccountDto?.balance),
            row.tenantStatus === 0 ? '正常' : '已注销',
            this.formatDateTime(row.createTime)
          ];
        });

        // 创建工作表数据
        const wsData = [headers, ...data];

        // 创建工作表
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // 设置列宽
        const colWidths = [
          { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 }
        ];
        ws['!cols'] = colWidths;

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "租户列表");

        // 生成文件名
        const now = new Date();
        const timeStr = now.getFullYear() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0') + '_' +
          String(now.getHours()).padStart(2, '0') +
          String(now.getMinutes()).padStart(2, '0') +
          String(now.getSeconds()).padStart(2, '0');
        const fileName = `租户列表_${timeStr}.xlsx`;

        // 导出文件
        XLSX.writeFile(wb, fileName);

        this.$message.success(`成功导出 ${exportData.length} 条数据`);
      } catch (error) {
        console.error('导出失败:', error);
        this.$message.error('导出失败');
      }
    },

    // 新增
    handleAdd() {
      this.editForm = {};
      this.addDialogVisible = true;
    },

    // 批量操作
    handleBatchCommand(command) {
      switch (command) {
        case "downloadSelected":
          this.handleDownloadSelected();
          break;
        case "downloadAll":
          this.handleDownloadAll();
          break;
      }
    },

    // 下载勾选的租户码
    async handleDownloadSelected() {
      if (this.multipleSelection.length === 0) {
        this.$message.warning("请先勾选要下载的租户");
        return;
      }

      const loading = this.$loading({
        lock: true,
        text: `正在生成 ${this.multipleSelection.length} 个租户二维码...`,
      });

      try {
        for (let i = 0; i < this.multipleSelection.length; i++) {
          const tenant = this.multipleSelection[i];
          const canvas = await this.generateTenantQrcodeCanvas(tenant);

          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `租户二维码-${tenant.id}-${
              tenant.name || "未命名"
            }.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          });

          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        this.$message.success(
          `成功下载 ${this.multipleSelection.length} 个租户二维码`
        );
      } catch (error) {
        this.$message.error("下载失败");
      } finally {
        loading.close();
      }
    },

    // 全部导出租户码
    async handleDownloadAll() {
      if (this.tableData.length === 0) {
        this.$message.warning("当前页暂无数据");
        return;
      }

      await this.$confirm(
        `确定要导出当前页所有 ${this.tableData.length} 个租户二维码吗？`,
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      );

      const loading = this.$loading({
        lock: true,
        text: `正在生成 ${this.tableData.length} 个租户二维码...`,
      });

      try {
        for (let i = 0; i < this.tableData.length; i++) {
          const tenant = this.tableData[i];
          const canvas = await this.generateTenantQrcodeCanvas(tenant);

          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `租户二维码-${tenant.id}-${
              tenant.name || "未命名"
            }.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          });

          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        this.$message.success(`成功导出 ${this.tableData.length} 个租户二维码`);
      } catch (error) {
        this.$message.error("导出失败");
      } finally {
        loading.close();
      }
    },

    // 生成租户二维码Canvas
    async generateTenantQrcodeCanvas(tenant) {
      return new Promise((resolve, reject) => {
        try {
          const tempDiv = document.createElement("div");
          tempDiv.style.position = "absolute";
          tempDiv.style.left = "-9999px";
          document.body.appendChild(tempDiv);

          const qrcodeValue = `https://geekpartytech.com/wx/ebc/?tenantId=${tenant.id}`;
          const qrcode = new QRCode(tempDiv, {
            text: qrcodeValue,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H,
          });

          setTimeout(() => {
            const qrCanvas = tempDiv.querySelector("canvas");
            if (!qrCanvas) {
              document.body.removeChild(tempDiv);
              reject(new Error("二维码生成失败"));
              return;
            }

            const newCanvas = document.createElement("canvas");
            const ctx = newCanvas.getContext("2d");
            const padding = 30;
            const qrSize = 200;
            const topHeight = 80;
            const bottomHeight = 40;

            newCanvas.width = qrSize + padding * 2;
            newCanvas.height = qrSize + topHeight + bottomHeight + padding * 2;

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

            const topY = padding;
            ctx.fillStyle = "#f6f8fb";
            ctx.fillRect(padding, topY, qrSize, topHeight);
            ctx.strokeStyle = "#e4e7ed";
            ctx.lineWidth = 1;
            ctx.strokeRect(padding, topY, qrSize, topHeight);

            ctx.fillStyle = "#606266";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "left";
            ctx.fillText("租户ID:", padding + 15, topY + 25);
            ctx.fillStyle = "#303133";
            ctx.font = "bold 16px Arial";
            ctx.fillText(String(tenant.id), padding + 80, topY + 25);
            ctx.fillStyle = "#606266";
            ctx.font = "bold 14px Arial";
            ctx.fillText("租户名:", padding + 15, topY + 55);
            ctx.fillStyle = "#303133";
            ctx.font = "bold 16px Arial";

            let tenantName = tenant.name || "未命名";
            const maxNameWidth = qrSize - 95;
            let nameWidth = ctx.measureText(tenantName).width;
            if (nameWidth > maxNameWidth) {
              while (nameWidth > maxNameWidth && tenantName.length > 0) {
                tenantName = tenantName.slice(0, -1);
                nameWidth = ctx.measureText(tenantName + "...").width;
              }
              tenantName += "...";
            }
            ctx.fillText(tenantName, padding + 80, topY + 55);

            const qrY = topY + topHeight + 15;
            ctx.drawImage(qrCanvas, padding, qrY);
            ctx.strokeStyle = "#e4e7ed";
            ctx.lineWidth = 2;
            ctx.strokeRect(padding - 1, qrY - 1, qrSize + 2, qrSize + 2);

            const bottomY = qrY + qrSize + 20;
            ctx.fillStyle = "#909399";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText("请扫码绑定", newCanvas.width / 2, bottomY);

            document.body.removeChild(tempDiv);
            resolve(newCanvas);
          }, 300);
        } catch (error) {
          reject(error);
        }
      });
    },

    // 详情
    handleDetail(row) {
      this.$router.push({
        name: "TenantDetail",
        params: { id: row.id },
      });
    },

    // 编辑
    handleEdit(row) {
      this.editForm = { ...row };
      this.addDialogVisible = true;
    },

    // 催缴
    async handleUrge(row) {
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
        }
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error("催缴失败");
        }
      }
    },

    // 充值
    handleRecharge(row) {
      this.currentTenant = row;
      this.rechargeVisible = true;
    },

    // 扣款
    handleDeduct(row) {
      this.currentTenant = row;
      this.deductVisible = true;
    },

    // 二维码
    handleQrcode(row) {
      this.currentTenant = row;
      this.qrcodeVisible = true;
    },

    // 行操作
    handleRowCommand(command, row) {
      if (command === "edit") {
        this.handleEdit(row);
      } else if (command === "detail") {
        this.handleDetail(row);
      }
    },

    // 新增成功
    handleAddSuccess() {
      this.addDialogVisible = false;
      this.fetchTableData();
    },

    // 充值成功
    handleRechargeSuccess() {
      this.rechargeVisible = false;
      this.fetchTableData();
    },

    // 扣款成功
    handleDeductSuccess() {
      this.deductVisible = false;
      this.fetchTableData();
    },

    // 分页
    handleSizeChange(val) {
      this.pageData.size = val;
      this.pageData.current = 1;
      this.fetchTableData();
    },

    handleCurrentChange(val) {
      this.pageData.current = val;
      this.fetchTableData();
    },
  },
};
</script>
<style lang="scss" scoped>
// 全局变量
$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;

.table-page-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 100px);
}

// 搜索区域
.search-card {
  margin-bottom: 16px;
  border-radius: 8px;

  .search-form {
    ::v-deep .el-form-item {
      margin-bottom: 12px;
    }
  }
}

// 操作栏
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;

  .action-left {
    display: flex;
    gap: 8px;
  }

  .action-right {
    display: flex;
    align-items: center;
  }
}

// 紧凑型视图切换
.view-switcher-compact {
  ::v-deep .el-radio-button__inner {
    padding: 5px 12px;
    font-size: 12px;
  }
}

// 表格容器
.table-card {
  border-radius: 8px;

  ::v-deep .el-table {
    .tenant-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .tenant-logo-small {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        object-fit: cover;
      }

      .logo-placeholder-small {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: 600;
      }
    }
  }

  // 操作按钮样式
  .action-buttons {
    display: flex;

    .el-button {
      padding: 5px 8px;
    }
  }
}

// 卡片视图容器
.card-view-container {
  min-height: 400px;

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
    padding: 4px;
  }
}

// 卡片样式 - 完全保留第一个版本
.tenant-card-modern {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }

  .card-header-modern {
    display: flex;
    align-items: center;
    padding: 16px;
    background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
    border-bottom: 1px solid #eee;

    .tenant-avatar {
      width: 48px;
      height: 48px;
      margin-right: 12px;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        object-fit: cover;
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        font-weight: 600;
      }
    }

    .tenant-info {
      flex: 1;
      min-width: 0;

      .tenant-name {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1f2329;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tenant-code {
        font-size: 12px;
        color: #8e92a0;
        display: inline-block;
        margin-top: 4px;
      }
    }

    // 二维码按钮
    .qr-button {
      color: #409eff;
      padding: 8px;
      font-size: 20px;
      margin-left: 8px;

      &:hover {
        background: rgba(64, 158, 255, 0.1);
        border-radius: 8px;
      }
    }
  }

  .card-content {
    padding: 16px;

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .info-item {
        flex: 1;
        display: flex;
        align-items: center;
        font-size: 13px;

        .info-label {
          color: #8e92a0;
          margin-right: 4px;
        }

        .info-value {
          color: #1f2329;
          font-weight: 500;

          &.no-data {
            color: #bfbfbf;
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
    }
  }

  .card-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid #eee;
    background: #fafbfc;

    .el-button {
      margin: 0;
      padding: 8px 12px;
      font-size: 13px;

      &:hover {
        transform: translateY(-2px);
      }
    }
  }
}

// 分页
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

// 响应式设计
@media (max-width: 1400px) {
  .card-view-container {
    .card-grid {
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }
  }
}

@media (max-width: 768px) {
  .card-view-container {
    .card-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  .card-actions {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
.serial-copy {
  color: #000;
  cursor: pointer;
  user-select: none;
  display: inline-block;
  transition: all 0.2s ease;

  &:hover {
    color: #409EFF;
  }

  &:active {
    color: #3a8ee6;
  }
}
</style>
