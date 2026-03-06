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
          <!-- 第一行:筛选条件 -->
          <el-row :gutter="16" class="search-row" type="flex" align="middle">
            <!-- 租户名称/编号 -->
            <el-col :span="6">
              <el-form-item
                label="租户名称/编号"
                prop="tenantId"
                class="compact-form-item"
              >
                <el-select
                  v-model="queryData.tenantId"
                  filterable
                  clearable
                  placeholder="请选择租户"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in tenantList"
                    :key="item.tenantId"
                    :label="`${item.tenantId} - ${item.name}`"
                    :value="item.tenantId"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 操作时间 -->
            <el-col :span="7">
              <el-form-item
                label="操作时间"
                prop="timeRange"
                class="compact-form-item"
              >
                <el-date-picker
                  v-model="queryData.timeRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  value-format="yyyy-MM-dd"
                  size="small"
                  style="width: 100%"
                  :picker-options="pickerOptions"
                  :default-time="['00:00:00', '23:59:59']"
                  popper-class="elegant-date-picker"
                  @change="handleDateChange"
                />
              </el-form-item>
            </el-col>

            <!-- 操作按钮 -->
            <el-col :span="11" style="text-align: right">
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
            </el-col>
          </el-row>

          <!-- 第二行：对公充值按钮 -->
          <el-row :gutter="16" style="margin-top: 12px">
            <el-col :span="24">
              <el-button
                type="primary"
                icon="el-icon-plus"
                size="small"
                @click="handleRecharge"
              >
                对公充值
              </el-button>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-container" style="height: 475px">
      <div class="table-card" shadow="never">
        <!-- 数据表格 -->
        <el-table
          v-loading="loading"
          :data="tableData"
          :max-height="tableMaxHeight"
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
        >
          <!-- 租户ID -->
          <el-table-column
            prop="tenantId"
            label="租户ID"
            width="100"
            align="center"
          />

          <!-- 租户名 -->
          <el-table-column
            prop="tenantName"
            label="租户名"
            min-width="200"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              <span class="tenant-name">{{ scope.row.tenantName || "-" }}</span>
            </template>
          </el-table-column>

          <!-- 项目名称 -->
          <el-table-column
            prop="managerName"
            label="项目名称"
            min-width="220"
            show-overflow-tooltip
          />

          <!-- 充值金额 -->
          <el-table-column
            prop="amount"
            label="充值金额(元)"
            width="130"
            align="center"
          >
            <template slot-scope="scope">
              <span class="amount-text">
                ¥{{ formatMoney(scope.row.amount) }}
              </span>
            </template>
          </el-table-column>

          <!-- 银行类型 -->
          <el-table-column
            prop="bankType"
            label="银行类型"
            width="160"
            align="center"
          >
            <template slot-scope="scope">
              <el-tag size="small" type="primary">
                {{ getBankTypeLabel(scope.row.bankType) }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 交易单号 -->
          <el-table-column
            prop="seqNo"
            label="交易单号"
            width="180"
            align="center"
            show-overflow-tooltip
          />

          <!-- 汇款账户 -->
          <el-table-column
            prop="payeeName"
            label="汇款账户"
            width="180"
            show-overflow-tooltip
          />

          <!-- 汇款账号 -->
          <el-table-column
            prop="bankNumber"
            label="汇款账号"
            width="180"
            show-overflow-tooltip
          />

          <!-- 开户行 -->
          <el-table-column
            prop="openingBank"
            label="开户行"
            width="180"
            show-overflow-tooltip
          />

          <!-- 操作时间 -->
          <el-table-column
            prop="occurTime"
            label="操作时间"
            width="160"
            align="center"
          />

          <!-- 收款单 -->
          <el-table-column label="收款单" width="100" align="center">
            <template slot-scope="scope">
              <el-button
                v-if="scope.row.imageList && scope.row.imageList.length > 0"
                type="text"
                size="small"
                icon="el-icon-picture"
                @click="handleViewImages(scope.row.imageList)"
              >
                查看
              </el-button>
              <span v-else class="no-data">-</span>
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

    <!-- 对公充值弹窗 -->
    <el-dialog
      title="对公充值"
      :visible.sync="rechargeDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      @close="handleRechargeDialogClose"
    >
      <el-form
        ref="rechargeForm"
        :model="rechargeFormData"
        :rules="rechargeFormRules"
        label-width="100px"
        label-position="right"
      >
        <!-- 项目名称 -->
        <el-form-item label="项目名称" prop="managerId">
          <el-select
            v-model="rechargeFormData.managerId"
            placeholder="请选择项目"
            style="width: 100%"
            @change="handleManagerChange"
          >
            <el-option
              v-for="item in managerList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <!-- 租户名 -->
        <el-form-item
          v-if="rechargeFormData.managerId"
          label="租户名"
          prop="tenantId"
        >
          <el-select
            v-model="rechargeFormData.tenantId"
            placeholder="请选择租户"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in rechargeTenantList"
              :key="item.tenantId"
              :label="`${item.tenantId} - ${item.name}`"
              :value="item.tenantId"
            />
          </el-select>
        </el-form-item>

        <!-- 交易类型 -->
        <el-form-item label="交易类型" prop="tradeType">
          <el-select
            v-model="rechargeFormData.tradeType"
            placeholder="请选择交易类型"
            style="width: 100%"
          >
            <el-option label="租户充值" value="TENANT_CHARGE" />
          </el-select>
        </el-form-item>

        <!-- 充值金额 -->
        <el-form-item label="充值金额" prop="amount">
          <el-input
            v-model="rechargeFormData.amount"
            placeholder="请输入充值金额"
            @input="handleAmountInput"
          >
            <template slot="suffix">元</template>
          </el-input>
        </el-form-item>

        <!-- 银行类型 -->
        <el-form-item label="银行类型" prop="bankType">
          <el-select
            v-model="rechargeFormData.bankType"
            placeholder="请选择银行类型"
            style="width: 100%"
          >
            <el-option
              v-for="item in bankTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <!-- 备注 -->
        <el-form-item label="备注">
          <el-input
            v-model="rechargeFormData.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <!-- 收款单上传 -->
        <el-form-item label="收款单">
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :file-list="fileList"
            list-type="picture-card"
            accept="image/*"
            :limit="5"
          >
            <i class="el-icon-plus"></i>
            <div slot="tip" class="el-upload__tip">
              支持jpg/png格式，单个文件不超过2MB，最多上传5张
            </div>
          </el-upload>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="handleRechargeDialogClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleRechargeSubmit"
          :loading="submitting"
        >
          {{ submitting ? "提交中..." : "确定充值" }}
        </el-button>
      </div>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog
      title="收款单"
      :visible.sync="imageDialogVisible"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="image-preview">
        <el-image
          v-for="(url, index) in currentImages"
          :key="index"
          :src="url"
          :preview-src-list="currentImages"
          fit="contain"
          class="preview-image"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  capitalManagePageTenantRecord,
  payPublicTransfers,
  getManagerById,
  getSimpleTenantList,
} from "@/api/publicRecharge";
import { mapGetters } from "vuex";

export default {
  name: "PublicRecharge",
  data() {
    return {
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 9,
        paginationHeight: 68,
      },

      // ========== 查询相关 ==========
      queryData: {
        tenantId: "",
        timeRange: [],
      },

      // 日期选择器快捷选项 - 精简版
      pickerOptions: {
        shortcuts: [
          // {
          //   text: "今天",
          //   onClick(picker) {
          //     const start = new Date();
          //     start.setHours(0, 0, 0, 0);
          //     const end = new Date();
          //     end.setHours(23, 59, 59, 999);
          //     picker.$emit("pick", [start, end]);
          //   },
          // },
          {
            text: "昨天",
            onClick(picker) {
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setTime(end.getTime() - 3600 * 1000 * 24);
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "本周",
            onClick(picker) {
              const now = new Date();
              const dayOfWeek = now.getDay();
              const start = new Date(now);
              // 本周一（如果今天是周日，则为上周一）
              const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
              start.setDate(now.getDate() + diff);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "上周",
            onClick(picker) {
              const now = new Date();
              const dayOfWeek = now.getDay();
              const start = new Date(now);
              // 上周一
              const diff = dayOfWeek === 0 ? -13 : -6 - dayOfWeek;
              start.setDate(now.getDate() + diff);
              start.setHours(0, 0, 0, 0);
              const end = new Date(start);
              // 上周日
              end.setDate(start.getDate() + 6);
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "本月",
            onClick(picker) {
              const start = new Date();
              start.setDate(1);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "上月",
            onClick(picker) {
              const start = new Date();
              start.setMonth(start.getMonth() - 1);
              start.setDate(1);
              start.setHours(0, 0, 0, 0);
              const end = new Date();
              end.setDate(0);
              end.setHours(23, 59, 59, 999);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "近三个月",
            onClick(picker) {
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              const start = new Date();
              start.setMonth(start.getMonth() - 3);
              start.setHours(0, 0, 0, 0);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "近一年",
            onClick(picker) {
              const end = new Date();
              end.setHours(23, 59, 59, 999);
              const start = new Date();
              start.setFullYear(start.getFullYear() - 1);
              start.setHours(0, 0, 0, 0);
              picker.$emit("pick", [start, end]);
            },
          },
        ],
      },

      // 租户列表（用于查询条件）
      tenantList: [],

      // 银行类型枚举
      bankTypeOptions: [
        { label: "中国银行（互联）", value: "ZGYH" },
        { label: "浦发银行（互联）", value: "PFYH" },
        { label: "中国银行（数字）", value: "ZGYHSZ" },
        { label: "招商银行（互联）", value: "ZHSHYH" },
        { label: "中信银行（互联）", value: "ZXYH" },
      ],

      // ========== 表格相关 ==========
      tableData: [],
      loading: false,

      // 分页数据
      pageData: {
        current: 1,
        size: 15,
        total: 0,
      },

      // ========== 充值弹窗相关 ==========
      rechargeDialogVisible: false,
      submitting: false,

      // 充值表单数据
      rechargeFormData: {
        managerId: "",
        tenantId: "",
        tradeType: "TENANT_CHARGE",
        amount: "",
        bankType: "",
        comment: "",
        payChannel: "PUBLIC_TRANSFERS",
        imageList: [],
      },

      // 充值表单验证规则
      rechargeFormRules: {
        managerId: [
          { required: true, message: "请选择项目", trigger: "change" },
        ],
        tenantId: [
          { required: true, message: "请选择租户", trigger: "change" },
        ],
        tradeType: [
          { required: true, message: "请选择交易类型", trigger: "change" },
        ],
        amount: [
          { required: true, message: "请输入充值金额", trigger: "blur" },
          {
            validator: this.validateAmount,
            trigger: "blur",
          },
        ],
        bankType: [
          { required: true, message: "请选择银行类型", trigger: "change" },
        ],
      },

      // 项目列表
      managerList: [],

      // 租户列表（用于充值弹窗）
      rechargeTenantList: [],

      // 文件上传
      uploadUrl: process.env.VUE_APP_BASE_API + "/api/ebc-content/file/upload",
      uploadHeaders: {
        userDeviceType: "PC",
      },
      fileList: [],

      // 权限标识
      hasRechargePermission: false,

      // ========== 图片预览相关 ==========
      imageDialogVisible: false,
      currentImages: [],
    };
  },

  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    ...mapGetters("user", ["userId"]),
    tableMaxHeight() {
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
          this.fetchTenantList();
          this.setDefaultTimeRange();
          this.fetchTableData();
        }
      },
      immediate: true,
    },
  },

  mounted() {
    this.fetchManagerList();
  },

  methods: {
    // ==================== 工具方法 ====================

    // 设置默认时间范围（最近30天）
    setDefaultTimeRange() {
      const endDate = new Date();
      const startDate = new Date();
      // ⭐ 修改：减去30天，使得包含今天在内正好是30天
      startDate.setTime(startDate.getTime() - 3600 * 1000 * 24 * 30);

      this.queryData.timeRange = [
        this.formatDate(startDate),
        this.formatDate(endDate),
      ];
    },

    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },

    // 格式化金额
    formatMoney(amount) {
      if (amount === null || amount === undefined) return "0.00";
      return Number(amount).toFixed(2);
    },

    // 获取银行类型标签
    getBankTypeLabel(bankType) {
      const bank = this.bankTypeOptions.find((b) => b.value === bankType);
      return bank ? bank.label : bankType || "-";
    },

    // ==================== 查询相关方法 ====================

    // 日期变化时自动触发查询
    handleDateChange(value) {
      // 只有当选择了完整的日期范围时才自动查询
      if (value && value.length === 2 && value[0] && value[1]) {
        this.handleSearch();
      }
    },

    // 获取租户列表（用于查询条件）- 使用正确的接口
    async fetchTenantList() {
      try {
        const params = {
          managerId: this.currentManagerId,
          tenantStatus: 0,
        };

        const response = await getSimpleTenantList(params);
        if (response.code === 200) {
          this.tenantList = response.data || [];
        }
      } catch (error) {
        console.error("获取租户列表失败:", error);
        this.$message.error("获取租户列表失败");
      }
    },

    // 获取表格数据
    async fetchTableData() {
      this.loading = true;
      try {
        const params = {
          managerId: this.currentManagerId,
          tenantId: this.queryData.tenantId || null,
          startDate:
            this.queryData.timeRange && this.queryData.timeRange[0]
              ? `${this.queryData.timeRange[0]} 00:00:00`
              : "",
          endDate:
            this.queryData.timeRange && this.queryData.timeRange[1]
              ? `${this.queryData.timeRange[1]} 23:59:59`
              : "",
          channels: ["PUBLIC_TRANSFERS"], // 写死只查对公充值
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
            orders: [{ asc: false, column: "occurTime" }],
          },
        };

        const response = await capitalManagePageTenantRecord(params);

        if (response.code === 200 && response.data) {
          this.tableData = response.data.dataList || [];
          this.pageData.total = response.data.total || 0;
        } else {
          this.$message.error(response.msg || "获取数据失败");
        }
      } catch (error) {
        this.$message.error("获取充值记录失败");
        console.error("获取充值记录失败:", error);
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
        tenantId: "",
        timeRange: [],
      };
      this.setDefaultTimeRange();
      this.handleSearch();
    },

    // 查看收款单图片
    handleViewImages(imageList) {
      this.currentImages = imageList;
      this.imageDialogVisible = true;
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

    // ==================== 充值弹窗相关方法 ====================

    // 打开充值弹窗
    handleRecharge() {
      this.rechargeDialogVisible = true;
      this.rechargeFormData.managerId = this.currentManagerId || "";
      if (this.rechargeFormData.managerId) {
        this.checkRechargePermission();
        this.fetchRechargeTenantList();
      }
    },

    // 获取项目列表
    async fetchManagerList() {
      try {
        this.managerList = this.$store.state.user.managerNames || [];
      } catch (error) {
        console.error("获取项目列表失败:", error);
      }
    },

    // 项目切换
    async handleManagerChange(managerId) {
      this.rechargeFormData.tenantId = "";
      this.rechargeTenantList = [];
      if (managerId) {
        await this.checkRechargePermission();
        await this.fetchRechargeTenantList();
      }
    },

    // 检查充值权限
    async checkRechargePermission() {
      try {
        const response = await getManagerById({
          id: this.rechargeFormData.managerId,
        });
        if (response.code === 200 && response.data) {
          const rechargeRole = response.data.rechargeRole || [];
          this.hasRechargePermission = rechargeRole.includes(
            "PUBLIC_TRANSFERS"
          );
          if (!this.hasRechargePermission) {
            this.$message.warning("该项目暂无对公充值权限");
          }
        }
      } catch (error) {
        console.error("检查充值权限失败:", error);
      }
    },

    // 获取租户列表（用于充值弹窗）- 使用正确的接口
    async fetchRechargeTenantList() {
      try {
        const params = {
          managerId: this.rechargeFormData.managerId,
          tenantStatus: 0,
        };

        const response = await getSimpleTenantList(params);
        if (response.code === 200) {
          this.rechargeTenantList = response.data || [];
        }
      } catch (error) {
        console.error("获取租户列表失败:", error);
        this.$message.error("获取租户列表失败");
      }
    },

    // 金额输入处理
    handleAmountInput(value) {
      // 只允许输入数字和小数点
      let val = value.replace(/[^\d.]/g, "");
      // 只保留第一个小数点
      val = val.replace(/\.{2,}/g, ".");
      val = val.replace(".", "$#$").replace(/\./g, "").replace("$#$", ".");
      // 只保留两位小数
      const arr = val.split(".");
      if (arr.length > 1) {
        val = arr[0] + "." + arr[1].substring(0, 2);
      }
      this.rechargeFormData.amount = val;
    },

    // 金额验证
    validateAmount(rule, value, callback) {
      if (!value) {
        callback(new Error("请输入充值金额"));
        return;
      }
      const amount = Number(value);
      if (isNaN(amount)) {
        callback(new Error("请输入有效的金额"));
        return;
      }
      if (amount <= 0) {
        callback(new Error("充值金额必须大于0"));
        return;
      }
      if (amount > 999999.99) {
        callback(new Error("充值金额不能超过999999.99元"));
        return;
      }
      callback();
    },

    // 文件上传成功
    handleUploadSuccess(response, file, fileList) {
      if (response.code === 200) {
        this.rechargeFormData.imageList.push(response.data.url);
        this.$message.success("上传成功");
      } else {
        this.$message.error(response.msg || "上传失败");
        // 移除失败的文件
        this.fileList = fileList.filter((f) => f.uid !== file.uid);
      }
    },

    // 移除文件
    handleRemove(file, fileList) {
      if (file.response && file.response.data) {
        const index = this.rechargeFormData.imageList.indexOf(
          file.response.data.url
        );
        if (index > -1) {
          this.rechargeFormData.imageList.splice(index, 1);
        }
      }
      this.fileList = fileList;
    },

    // 提交充值表单
    async handleRechargeSubmit() {
      if (!this.hasRechargePermission) {
        this.$message.warning("该项目暂无对公充值权限");
        return;
      }

      try {
        await this.$refs.rechargeForm.validate();

        await this.$confirm("确认提交充值申请？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });

        this.submitting = true;

        const params = {
          ...this.rechargeFormData,
          userId: this.userId,
        };

        const response = await payPublicTransfers(params);

        if (response.code === 200) {
          this.$message.success("充值申请提交成功");
          this.handleRechargeDialogClose();
          this.fetchTableData();
        } else {
          this.$message.error(response.msg || "充值失败");
        }
      } catch (error) {
        if (error !== "cancel") {
          console.error("充值失败:", error);
          this.$message.error("充值失败");
        }
      } finally {
        this.submitting = false;
      }
    },

    // 关闭充值弹窗
    handleRechargeDialogClose() {
      this.rechargeDialogVisible = false;
      this.$refs.rechargeForm && this.$refs.rechargeForm.resetFields();
      this.rechargeFormData = {
        managerId: "",
        tenantId: "",
        tradeType: "TENANT_CHARGE",
        amount: "",
        bankType: "",
        comment: "",
        payChannel: "PUBLIC_TRANSFERS",
        imageList: [],
      };
      this.fileList = [];
      this.rechargeTenantList = [];
      this.hasRechargePermission = false;
    },
  },
};
</script>

<style lang="scss" scoped>
// 引入表格页面公共样式
@import "@/assets/styles/table-page.scss";

.amount-text {
  color: #67c23a;
  font-weight: 600;
  font-size: 14px;
}

.tenant-name {
  color: #303133;
  font-weight: 500;
}

.no-data {
  color: #909399;
  font-size: 13px;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;

  .preview-image {
    width: 200px;
    height: 200px;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}

.dialog-footer {
  text-align: right;

  .el-button {
    min-width: 80px;
  }
}

.upload-demo {
  ::v-deep .el-upload-list--picture-card {
    .el-upload-list__item {
      width: 100px;
      height: 100px;
    }
  }

  ::v-deep .el-upload--picture-card {
    width: 100px;
    height: 100px;
    line-height: 100px;
  }

  .el-upload__tip {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
  }
}
</style>

<style lang="scss">
// ========== 全局样式：自定义日期选择器（简洁层次版）==========
.elegant-date-picker {
  // 快捷选项容器
  .el-picker-panel__sidebar {
    width: 115px !important;
    padding: 12px 8px !important;
    background: #fafafa !important;
    border: none !important;
    border-right: 1px solid #e8e8e8 !important;
  }

  // 快捷选项按钮 - 简洁层次感
  .el-picker-panel__shortcut {
    display: block !important;
    width: 100% !important;
    padding: 9px 8px !important;
    margin-bottom: 6px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #606266 !important;
    text-align: center !important;
    line-height: 1.4 !important;
    background: #ffffff !important;
    border: none !important;
    border-radius: 6px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
    outline: none !important;

    // 悬停效果 - 微妙的层次感
    &:hover {
      color: #409eff !important;
      background: #f0f7ff !important;
      box-shadow: 0 2px 6px rgba(64, 158, 255, 0.15) !important;
      transform: translateY(-1px) !important;
      border: none !important;
    }

    // 激活效果
    &:active {
      transform: translateY(0) !important;
      box-shadow: 0 1px 3px rgba(64, 158, 255, 0.1) !important;
      border: none !important;
    }

    // 获得焦点时
    &:focus {
      border: none !important;
      outline: none !important;
    }

    // 最后一个按钮
    &:last-child {
      margin-bottom: 0 !important;
    }
  }

  // 日历主体
  .el-picker-panel__body {
    padding-left: 12px !important;
  }

  // ⭐ 强制去除所有可能的边框
  .el-picker-panel__shortcut,
  button.el-picker-panel__shortcut {
    border: none !important;
    border-top: none !important;
    border-right: none !important;
    border-bottom: none !important;
    border-left: none !important;
    box-sizing: border-box !important;
  }

  // 日期表格优化
  .el-date-table {
    td {
      padding: 5px 0 !important;

      &.available:hover {
        color: #409eff !important;
        background: #f0f7ff !important;
        border-radius: 4px !important;
      }

      &.in-range {
        background: #f5f9ff !important;
      }

      &.start-date,
      &.end-date {
        span {
          background: #409eff !important;
          color: #ffffff !important;
          border-radius: 4px !important;
        }
      }

      &.today span {
        color: #409eff !important;
        font-weight: 600 !important;
        position: relative !important;

        &::after {
          content: "" !important;
          position: absolute !important;
          bottom: 2px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 4px !important;
          height: 4px !important;
          background: #409eff !important;
          border-radius: 50% !important;
        }
      }

      // ⭐ 修复：当今天是开始或结束日期时，保持白色文字
      &.today.start-date span,
      &.today.end-date span {
        color: #ffffff !important;
        
        &::after {
          background: #ffffff !important;
        }
      }
    }
  }

  // 月份选择器
  .el-month-table td {
    &.current:not(.disabled) .cell {
      color: #409eff !important;
      font-weight: 600 !important;
    }

    .cell:hover {
      color: #409eff !important;
      background: #f0f7ff !important;
      border-radius: 4px !important;
    }
  }

  // 年份选择器
  .el-year-table td {
    &.current:not(.disabled) .cell {
      color: #409eff !important;
      font-weight: 600 !important;
    }

    .cell:hover {
      color: #409eff !important;
      background: #f0f7ff !important;
      border-radius: 4px !important;
    }
  }

  // 底部按钮区域
  .el-picker-panel__footer {
    padding: 10px 12px !important;
    background: #fafafa !important;
    border-top: 1px solid #e8e8e8 !important;

    .el-button {
      border-radius: 4px !important;
      font-weight: 500 !important;
      padding: 7px 15px !important;
      transition: all 0.2s !important;

      &.el-button--text {
        &:hover {
          background: #f0f7ff !important;
          color: #409eff !important;
        }
      }

      &.el-button--primary {
        background: #409eff !important;

        &:hover {
          background: #66b1ff !important;
        }
      }
    }
  }

  // 头部按钮优化
  .el-picker-panel__icon-btn {
    color: #606266 !important;
    transition: all 0.2s !important;

    &:hover {
      color: #409eff !important;
    }
  }
}
</style>