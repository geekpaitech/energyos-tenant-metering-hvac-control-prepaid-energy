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
              <el-form-item label="组名称" prop="name" class="compact-form-item">
                <el-input
                  v-model="queryData.name"
                  placeholder="请输入公摊组名称"
                  clearable
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="公摊方式" prop="shareType" class="compact-form-item">
                <el-select
                  v-model="queryData.shareType"
                  clearable
                  placeholder="请选择公摊方式"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in shareTypeOptions"
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
          :data="tableData"
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
            min-width="180"
            align="center"
            show-overflow-tooltip
          />
          <el-table-column
            prop="shareType"
            label="公摊方式"
            width="120"
            align="center"
          >
            <template slot-scope="scope">
              {{ getShareTypeLabel(scope.row.shareType) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="tenantCount"
            label="公摊租户数"
            width="120"
            align="center"
          />
          <el-table-column
            prop="airCount"
            label="公摊设备数"
            width="120"
            align="center"
          />
          <el-table-column
            prop="updateTime"
            label="更新时间"
            width="180"
            align="center"
            show-overflow-tooltip
          />
          <!-- 操作列 -->
          <el-table-column
            label="操作"
            width="260"
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
                  icon="el-icon-edit"
                  @click="handleEdit(scope.row)"
                >
                  编辑
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
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空数据展示 -->
        <div v-if="!loading && tableData.length === 0" class="empty-data">
          <el-empty description="暂无数据"></el-empty>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="editDialog.isEdit ? '编辑空调公摊组' : '新增空调公摊组'"
      :visible.sync="editDialog.visible"
      width="450px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form
        ref="editForm"
        :model="editDialog"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="公摊组名" prop="name">
          <el-input
            v-model="editDialog.name"
            placeholder="请输入公摊组名"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="公摊方式" prop="shareType">
          <el-select
            v-model="editDialog.shareType"
            placeholder="请选择公摊方式"
            style="width: 100%"
          >
            <el-option
              v-for="item in shareTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialog.visible = false">取 消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleEditSubmit"
        >
          {{ submitting ? '提交中...' : '确 定' }}
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { airShareList, airShareAdd, airShareUpdate, airShareDelete } from '@/api/airGroup';

export default {
  name: 'ConditioningSharing',
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
        id: '',
        name: '',
        shareType: '',
        managerId: ''
      },
      // 表格数据
      tableData: [],
      // 加载状态
      loading: false,
      submitting: false,
      // 公摊方式选项
      shareTypeOptions: [
        { label: '面积占比', value: 'AREA' },
        { label: '能耗占比', value: 'ENERGY' }
      ],
      // 编辑弹窗
      editDialog: {
        visible: false,
        isEdit: false,
        id: '',
        name: '',
        shareType: ''
      },
      // 表单验证规则
      editRules: {
        name: [
          { required: true, message: '请输入公摊组名', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ],
        shareType: [
          { required: true, message: '请选择公摊方式', trigger: 'change' }
        ]
      }
    };
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    dataLength() {
      return this.tableData.length;
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
    }
  },
  watch: {
    currentManagerId: {
      handler(newVal) {
        if (newVal) {
          this.queryData.managerId = newVal;
          this.fetchTableData();
        }
      },
      immediate: true
    }
  },
  methods: {
    // 获取表格数据
    async fetchTableData() {
      this.loading = true;
      try {
        const params = {
          id: this.queryData.id || undefined,
          name: this.queryData.name || undefined,
          shareType: this.queryData.shareType || undefined,
          managerId: this.queryData.managerId
        };

        const response = await airShareList(params);

        if (response.code === 200 && response.data) {
          this.tableData = response.data || [];
        } else {
          this.$message.error(response.msg || '获取数据失败');
        }
      } catch (error) {
        this.$message.error('获取空调公摊组数据失败');
        console.error('获取空调公摊组数据失败:', error);
      } finally {
        this.loading = false;
      }
    },
    // 获取公摊方式标签
    getShareTypeLabel(type) {
      const item = this.shareTypeOptions.find(i => i.value === type);
      return item ? item.label : '-';
    },
    // 查询
    handleSearch() {
      this.fetchTableData();
    },
    // 重置
    handleReset() {
      this.queryData = {
        id: '',
        name: '',
        shareType: '',
        managerId: this.currentManagerId || ''
      };
      this.handleSearch();
    },
    // 处理下拉命令
    handleCommand(command) {
      switch (command) {
        case 'export':
          this.handleExport();
          break;
      }
    },
    // 导出数据
    handleExport() {
      if (this.tableData.length === 0) {
        this.$message.warning('暂无数据可导出');
        return;
      }
      this.$message.info('导出功能需要根据项目实际情况实现');
    },
    // 新增
    handleAdd() {
      this.editDialog = {
        visible: true,
        isEdit: false,
        id: '',
        name: '',
        shareType: ''
      };
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate();
      });
    },
    // 编辑
    handleEdit(row) {
      this.editDialog = {
        visible: true,
        isEdit: true,
        id: row.id,
        name: row.name,
        shareType: row.shareType
      };
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate();
      });
    },
    // 提交编辑
    async handleEditSubmit() {
      this.$refs.editForm.validate(async (valid) => {
        if (!valid) return;

        const tipText = this.editDialog.isEdit ? '编辑' : '新增';

        try {
          await this.$confirm(`确认${tipText}空调公摊组?`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          });

          this.submitting = true;

          const params = {
            managerId: this.queryData.managerId,
            name: this.editDialog.name,
            shareType: this.editDialog.shareType
          };

          let response;
          if (this.editDialog.isEdit) {
            params.id = this.editDialog.id;
            response = await airShareUpdate(params);
          } else {
            response = await airShareAdd(params);
          }

          if (response.code === 200) {
            this.$message.success(response.msg || `${tipText}成功`);
            this.editDialog.visible = false;
            this.fetchTableData();
          } else {
            this.$message.error(response.msg || `${tipText}失败`);
          }
        } catch (error) {
          if (error !== 'cancel') {
            this.$message.error(`${tipText}失败`);
            console.error('操作失败:', error);
          }
        } finally {
          this.submitting = false;
        }
      });
    },
    // 详情
    handleDetail(row) {
      this.$router.push({
        path: '/metering/fee/conditioningSharing/detail',
        query: { id: row.id }
      });
    },
    // 删除
    async handleDelete(row) {
      try {
        await this.$confirm(
          '删除公摊组将同时移除公摊组关联的租户和空调，确认删除吗?',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        const response = await airShareDelete({ id: row.id });

        if (response.code === 200) {
          this.$message.success(response.msg || '删除成功');
          this.fetchTableData();
        } else {
          this.$message.error(response.msg || '删除失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败');
          console.error('删除失败:', error);
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/table-page.scss";
</style>