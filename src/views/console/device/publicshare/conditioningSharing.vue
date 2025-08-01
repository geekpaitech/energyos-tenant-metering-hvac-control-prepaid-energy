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
              <el-form-item label="组编号" prop="id" class="compact-form-item">
                <el-input
                  v-model="queryData.id"
                  placeholder="请输入公摊组编号"
                  clearable
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item
                label="组名称"
                prop="name"
                class="compact-form-item"
              >
                <el-input
                  v-model="queryData.name"
                  placeholder="请输入公摊组名称"
                  clearable
                  size="small"
                />
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
              >
                新增空调公摊组
              </el-button>
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
        <!-- 数据表格 -->
        <el-table
          :height="dataLength > 9 ? dynamicTableHeight : null"
          v-loading="loading"
          :data="filteredData"
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
            prop="id"
            label="公摊组编号"
            width="150"
            align="center"
            show-overflow-tooltip
          />

          <el-table-column
            prop="name"
            label="公摊组名"
            min-width="200"
            align="center"
            show-overflow-tooltip
          />

          <!-- 操作列 -->
          <el-table-column
            label="操作"
            width="280"
            fixed="right"
            align="center"
          >
            <template slot-scope="scope">
              <div class="table-actions-group">
                <el-button
                  type="text"
                  size="small"
                  icon="el-icon-view"
                  @click="handleDetail(scope.row)"
                >
                  详情
                </el-button>
                <el-divider direction="vertical"></el-divider>
                <el-button
                  type="text"
                  size="small"
                  icon="el-icon-delete"
                  @click="handleDelete(scope.row)"
                >
                  删除
                </el-button>
                <el-divider direction="vertical"></el-divider>
                <el-button
                  type="text"
                  size="small"
                  icon="el-icon-coin"
                  @click="handleDebit(scope.row)"
                >
                  手动扣款
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空数据展示 -->
        <div v-if="!loading && filteredData.length === 0" class="empty-data">
          <el-empty description="暂无数据"></el-empty>
        </div>
      </div>
    </div>

    <!-- 新增/修改弹窗 -->
    <el-dialog
      :title="shareDialog.type ? '新增空调公摊组' : '修改空调公摊组'"
      :visible.sync="shareDialog.visible"
      width="450px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form
        ref="shareForm"
        :model="shareDialog"
        :rules="shareRules"
        label-width="100px"
      >
        <el-form-item label="公摊组名" prop="name">
          <el-input
            v-model="shareDialog.name"
            placeholder="请输入公摊组名"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="shareDialog.visible = false">取 消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleShareSubmit"
        >
          {{ submitting ? "提交中..." : "确 定" }}
        </el-button>
      </span>
    </el-dialog>

    <!-- 手动扣款弹窗 -->
    <el-dialog
      title="空调公摊组扣款"
      :visible.sync="debitDialog.visible"
      width="500px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form
        ref="debitForm"
        :model="debitForm"
        :rules="debitRules"
        label-width="100px"
      >
        <el-form-item label="公摊组名">
          <div class="info-text">{{ debitDialog.name }}</div>
        </el-form-item>

        <el-form-item label="公摊组ID">
          <div class="info-text">{{ debitDialog.id }}</div>
        </el-form-item>

        <el-form-item label="扣款金额" prop="balance">
          <el-input
            v-model="debitForm.balance"
            placeholder="请输入扣款金额"
            @input="handleAmountInput"
          >
            <template slot="append">元</template>
          </el-input>
        </el-form-item>

        <el-form-item label="备注内容" prop="remark">
          <el-input
            v-model="debitForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注内容"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="handleDebitCancel">取 消</el-button>
        <el-button
          type="primary"
          :loading="debitSubmitting"
          @click="handleDebitSubmit"
        >
          {{ debitSubmitting ? "扣款中..." : "确认扣款" }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "ConditioningSharing",
  data() {
    return {
      // 表格高度配置
      tableHeightConfig: {
        headerHeight: 48, // 表头高度
        rowHeight: 47, // 每行高度
        minHeight: 200, // 最小高度
        maxRows: 10, // 最大显示行数（超过9行显示滚动条）
        paginationHeight: 68, // 分页高度
      },
      // 查询参数
      queryData: {
        id: "",
        name: "",
        managerId: "",
      },
      // 模拟数据
      mockData: [
        {
          id: "AC001",
          name: "一楼中央空调公摊组",
          managerId: "",
          createTime: "2024-01-15 10:30:00",
        },
        {
          id: "AC002",
          name: "二楼办公区空调公摊组",
          managerId: "",
          createTime: "2024-02-20 14:45:00",
        },
      ],
      // 表格数据
      tableData: [],
      // 加载状态
      loading: false,
      submitting: false,
      debitSubmitting: false,
      // 公摊组弹窗
      shareDialog: {
        visible: false,
        type: true, // true: 新增, false: 修改
        name: "",
        id: "",
      },
      // 公摊组表单验证
      shareRules: {
        name: [
          { required: true, message: "请输入公摊组名", trigger: "blur" },
          {
            min: 1,
            max: 50,
            message: "长度在 1 到 50 个字符",
            trigger: "blur",
          },
        ],
      },
      // 扣款弹窗
      debitDialog: {
        visible: false,
        name: "",
        id: "",
      },
      // 扣款表单
      debitForm: {
        balance: "",
        remark: "",
      },
      // 扣款表单验证
      debitRules: {
        balance: [
          { required: true, message: "请输入扣款金额", trigger: "blur" },
          { validator: this.validateAmount, trigger: "blur" },
        ],
      },
    };
  },
  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    dataLength() {
      return this.tableData.length;
    },
    // 动态计算表格高度
    dynamicTableHeight() {
      const dataLength = this.filteredData.length;

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
    // 过滤后的数据
    filteredData() {
      let data = [...this.tableData];

      // 根据查询条件过滤
      if (this.queryData.id) {
        data = data.filter((item) =>
          item.id.toLowerCase().includes(this.queryData.id.toLowerCase())
        );
      }

      if (this.queryData.name) {
        data = data.filter((item) => item.name.includes(this.queryData.name));
      }

      return data;
    },
  },
  watch: {
    currentManagerId: {
      handler(newVal) {
        if (newVal) {
          this.queryData.managerId = newVal;
          // 更新模拟数据的managerId
          this.mockData.forEach((item) => {
            item.managerId = newVal;
          });
          this.fetchTableData();
        }
      },
      immediate: true,
    },
  },
  mounted() {
    // 初始化加载数据
    this.fetchTableData();
  },
  methods: {
    // 模拟获取表格数据
    async fetchTableData() {
      this.loading = true;
      try {
        // 模拟API延迟
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 设置表格数据为模拟数据
        this.tableData = [...this.mockData];
      } catch (error) {
        this.$message.error("获取公摊组数据失败");
        console.error("获取公摊组数据失败:", error);
      } finally {
        this.loading = false;
      }
    },

    // 查询
    handleSearch() {
      // 过滤由computed属性自动处理
      this.$message.success("查询成功");
    },

    // 重置
    handleReset() {
      this.queryData = {
        id: "",
        name: "",
        managerId: this.currentManagerId || "",
      };
      this.$message.success("重置成功");
    },

    // 处理下拉命令
    handleCommand(command) {
      switch (command) {
        case "export":
          this.handleExport();
          break;
      }
    },

    // 导出数据
    handleExport() {
      if (this.filteredData.length === 0) {
        this.$message.warning("暂无数据可导出");
        return;
      }

      // 导出Excel功能
      const exportData = this.filteredData.map((item) => ({
        公摊组编号: item.id,
        公摊组名: item.name,
      }));

      this.$message.success("导出成功（模拟）");
      console.log("导出数据:", exportData);
    },

    // 新增公摊组
    handleAdd() {
      this.shareDialog = {
        visible: true,
        type: true,
        name: "",
        id: "",
      };
      this.$nextTick(() => {
        this.$refs.shareForm && this.$refs.shareForm.clearValidate();
      });
    },

    // 查看详情
    handleDetail(row) {
      this.$message.info(`查看详情：${row.name}`);
      // 实际项目中跳转到详情页
      // this.$router.push({
      //   path: '/conditioning-detail',
      //   query: { id: row.id }
      // });
    },

    // 删除公摊组
    async handleDelete(row) {
      try {
        await this.$confirm(
          "删除公摊组将同时移除公摊组关联的租户和空调设备，确认删除吗?",
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        // 模拟删除
        const index = this.tableData.findIndex((item) => item.id === row.id);
        if (index > -1) {
          this.tableData.splice(index, 1);
          this.$message.success("删除成功");
        }
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error("删除失败");
          console.error("删除失败:", error);
        }
      }
    },

    // 手动扣款
    handleDebit(row) {
      this.debitDialog = {
        visible: true,
        name: row.name,
        id: row.id,
      };
      this.debitForm = {
        balance: "",
        remark: "",
      };
      this.$nextTick(() => {
        this.$refs.debitForm && this.$refs.debitForm.clearValidate();
      });
    },

    // 提交公摊组表单
    async handleShareSubmit() {
      this.$refs.shareForm.validate(async (valid) => {
        if (valid) {
          const tipText = this.shareDialog.type ? "新增" : "修改";

          try {
            await this.$confirm(`确认${tipText}分组?`, "提示", {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning",
            });

            this.submitting = true;

            // 模拟API延迟
            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (this.shareDialog.type) {
              // 新增 - 生成新的ID
              const newId =
                "AC" + String(this.tableData.length + 1).padStart(3, "0");
              const newItem = {
                id: newId,
                name: this.shareDialog.name,
                managerId: this.queryData.managerId,
                createTime: new Date().toLocaleString(),
              };
              this.tableData.push(newItem);
              this.mockData.push(newItem);
            } else {
              // 修改
              const item = this.tableData.find(
                (item) => item.id === this.shareDialog.id
              );
              if (item) {
                item.name = this.shareDialog.name;
              }
            }

            this.$message.success(`${tipText}成功`);
            this.shareDialog.visible = false;
          } catch (error) {
            if (error !== "cancel") {
              this.$message.error(`${tipText}失败`);
              console.error("操作失败:", error);
            }
          } finally {
            this.submitting = false;
          }
        }
      });
    },

    // 取消扣款
    handleDebitCancel() {
      this.debitDialog.visible = false;
      this.debitForm = {
        balance: "",
        remark: "",
      };
    },

    // 提交扣款
    async handleDebitSubmit() {
      this.$refs.debitForm.validate(async (valid) => {
        if (valid) {
          try {
            await this.$confirm("确认扣款?", "提示", {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning",
            });

            this.debitSubmitting = true;

            // 模拟API延迟
            await new Promise((resolve) => setTimeout(resolve, 1000));

            this.$message.success("扣款成功");
            this.handleDebitCancel();
          } catch (error) {
            if (error !== "cancel") {
              this.$message.error("扣款失败");
              console.error("扣款失败:", error);
            }
          } finally {
            this.debitSubmitting = false;
          }
        }
      });
    },

    // 处理金额输入
    handleAmountInput(val) {
      // 限制输入格式：只允许数字和小数点，最多两位小数
      const reg = /^\d*\.?\d{0,2}$/;
      if (!reg.test(val)) {
        this.$nextTick(() => {
          this.debitForm.balance = val.match(/^\d*\.?\d{0,2}/)[0] || "";
        });
      }
    },

    // 验证金额
    validateAmount(rule, value, callback) {
      if (!value) {
        callback(new Error("请输入扣款金额"));
      } else if (isNaN(value)) {
        callback(new Error("请输入有效的金额"));
      } else if (parseFloat(value) <= 0) {
        callback(new Error("扣款金额必须大于0"));
      } else if (parseFloat(value) > 999999.99) {
        callback(new Error("扣款金额不能超过999999.99"));
      } else {
        callback();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
// 表格页面公共样式
@import "@/assets/styles/table-page.scss";
</style>
