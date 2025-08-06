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
                  <!-- 水表类型选项 -->
                  <template v-if="field.prop === 'bindType'">
                    <el-option label="全部" value="" />
                    <el-option label="专用表" value="1" />
                    <el-option label="公摊表" value="2" />
                    <el-option label="公式表" value="3" />
                  </template>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 高级筛选 - 只在需要时显示 -->
          <el-collapse-transition v-if="needAdvancedSearch">
            <el-row :gutter="16" v-show="showAdvanced" class="search-row">
              <el-col
                v-for="field in displayAdvancedFields"
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
                    :filterable="field.prop === 'bindId'"
                  >
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-transition>

          <!-- 操作按钮行 - 更合理的布局 -->
          <div class="form-actions compact-actions">
            <div class="action-left">
              <el-button
                type="primary"
                icon="el-icon-plus"
                size="small"
                @click="handleAdd"
              >
                新增水表
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
        :max-height="tableMaxHeight"
          v-loading="loading"
          :data="tableData"
          stripe
          style="width: 100%"
          class="custom-table"
          @selection-change="handleSelectionChange"
          :header-cell-style="{
              background: 'linear-gradient(180deg, #f8f9fc 0%, #f0f2f5 100%)',
              color: '#1f2329',
              fontWeight: '600',
              fontSize: '13px',
              borderBottom: '2px solid #e8e8e8'
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
              <!-- 水表名称 -->
              <template v-if="col.key === 'waterName'">
                <el-link type="primary" @click="handleMonitor(scope.row)">
                  <i class="el-icon-view"></i>
                  {{ scope.row.waterName || "-" }}
                </el-link>
              </template>

              <!-- 水表类型 -->
              <template v-else-if="col.key === 'bindTypeLabel'">
                <el-tag
                  v-if="scope.row.bindType == 1"
                  type="primary"
                  size="small"
                  effect="plain"
                >
                  专用表
                </el-tag>
                <el-tag
                  v-else-if="scope.row.bindType == 2"
                  type="warning"
                  size="small"
                  effect="plain"
                >
                  公摊表
                </el-tag>
                <el-tag
                  v-else-if="scope.row.bindType == 3"
                  type="info"
                  size="small"
                  effect="plain"
                >
                  公式表
                </el-tag>
                <span v-else>-</span>
              </template>

              <!-- 绑定信息 -->
              <template v-else-if="col.key === 'bindInfo'">
                <el-popover
                  v-if="
                    scope.row.waterBindDtoList &&
                    scope.row.waterBindDtoList.length > 1
                  "
                  placement="top-start"
                  width="300"
                  trigger="hover"
                >
                  <el-table :data="scope.row.waterBindDtoList">
                    <el-table-column property="bindId" label="绑定ID" />
                    <el-table-column property="bindName" label="绑定信息" />
                  </el-table>
                  <div slot="reference" class="bind-info-wrapper">
                    <el-link type="primary">
                      <i class="el-icon-user"></i>
                      {{
                        scope.row.waterBindDtoList[0]
                          ? `${scope.row.waterBindDtoList[0].bindId}(${scope.row.waterBindDtoList[0].bindName})`
                          : "-"
                      }}
                    </el-link>
                  </div>
                </el-popover>
                <el-link
                  v-else-if="
                    scope.row.waterBindDtoList &&
                    scope.row.waterBindDtoList.length === 1
                  "
                  type="primary"
                  @click="handleBindClick(scope.row)"
                >
                  <i class="el-icon-user"></i>
                  {{
                    scope.row.waterBindDtoList[0]
                      ? `${scope.row.waterBindDtoList[0].bindId}(${scope.row.waterBindDtoList[0].bindName})`
                      : "-"
                  }}
                </el-link>
                <span v-else class="text-muted">未绑定</span>
              </template>

              <!-- 水价方案 -->
              <template v-else-if="col.key === 'waterPriceName'">
                {{
                  scope.row.waterPriceDto ? scope.row.waterPriceDto.name : "-"
                }}
              </template>

              <!-- 阀控 -->
              <template v-else-if="col.key === 'withSwitch'">
                <el-tag
                  :type="scope.row.withSwitch ? 'success' : 'info'"
                  size="small"
                  effect="plain"
                >
                  {{ scope.row.withSwitch ? "支持" : "不支持" }}
                </el-tag>
              </template>

              <!-- 付费模式 -->
              <template v-else-if="col.key === 'logicPayTypeLabel'">
                <el-tag
                  v-if="scope.row.logicPayType == 0"
                  type="success"
                  size="small"
                >
                  预付费
                </el-tag>
                <el-tag
                  v-else-if="scope.row.logicPayType == 1"
                  type="primary"
                  size="small"
                >
                  强控
                </el-tag>
                <span v-else>-</span>
              </template>

              <!-- 开关阀状态 -->
              <template v-else-if="col.key === 'switchStatusLabel'">
                <div class="switch-status">
                  <i
                    :class="
                      scope.row.switchStatus == 1
                        ? 'el-icon-open'
                        : 'el-icon-turn-off'
                    "
                    :style="{
                      color:
                        scope.row.switchStatus == 1 ? '#67C23A' : '#909399',
                    }"
                  ></i>
                  {{ scope.row.switchStatus == 1 ? "开阀" : "关阀" }}
                </div>
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
            width="200"
            fixed="right"
            align="center"
          >
            <template slot-scope="scope">
              <div class="table-actions-group">
                <el-button
                  type="text"
                  size="small"
                  icon="el-icon-setting"
                  @click="handleEdit(scope.row)"
                >
                  设置
                </el-button>
                <el-divider direction="vertical"></el-divider>
                <el-dropdown
                  trigger="click"
                  @command="handleTableCommand($event, scope.row)"
                >
                  <el-button type="text" size="small">
                    更多
                    <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item
                      v-if="scope.row.withSwitch"
                      :command="
                        scope.row.switchStatus == 1 ? 'switch-off' : 'switch-on'
                      "
                      :icon="
                        scope.row.switchStatus == 1
                          ? 'el-icon-turn-off'
                          : 'el-icon-open'
                      "
                    >
                      {{ scope.row.switchStatus == 1 ? "关阀" : "开阀" }}
                    </el-dropdown-item>
                    <el-dropdown-item command="record" icon="el-icon-document">
                      抄表记录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
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

    <!-- 编辑弹窗 -->
    <el-dialog
      :title="editForm.id ? '设置水表' : '新增水表'"
      :visible.sync="dialogVisible"
      width="680px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form
        ref="editForm"
        :model="editForm"
        :rules="rules"
        label-width="110px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备号" prop="serial">
              <el-input
                v-model="editForm.serial"
                :disabled="!!editForm.id"
                placeholder="请输入设备号"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="!editForm.id">
            <el-form-item label="接入渠道">
              <el-select
                v-model="editForm.waterType"
                clearable
                placeholder="请选择接入渠道"
                style="width: 100%"
              >
                <el-option
                  v-for="item in waterType"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-else>
            <el-form-item label="水表编号">
              <el-input v-model="editForm.id" disabled placeholder="水表编号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="水表名称" prop="waterName">
              <el-input
                v-model="editForm.waterName"
                placeholder="请输入水表名称"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="水表类型" prop="bindType">
              <el-select
                v-model="editForm.bindType"
                placeholder="请选择水表类型"
                style="width: 100%"
              >
                <el-option
                  v-for="item in MeterBindType"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12" v-if="editForm.waterType === 'YYWL_YY'">
            <el-form-item label="厂家号">
              <el-select
                v-model="editForm.mfrsNo"
                clearable
                :disabled="!!editForm.id"
                placeholder="请选择厂家号"
                style="width: 100%"
              >
                <el-option
                  v-for="item in mfrsNoType"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否支持阀控">
              <el-select
                v-model="editForm.withSwitch"
                clearable
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option
                  v-for="item in withSwitch"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12" v-if="editForm.withSwitch">
            <el-form-item label="付费模式">
              <el-select
                v-model="editForm.logicPayType"
                placeholder="请选择付费模式"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="item in MeterPayType"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备型号" prop="waterModel">
              <el-input
                v-model="editForm.waterModel"
                :disabled="isWaterModel"
                placeholder="请输入设备型号"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="routerAuth">
          <el-col :span="12">
            <el-form-item label="计费方案">
              <el-select
                v-model="editForm.priceId"
                clearable
                placeholder="请选择计费方案"
                style="width: 100%"
              >
                <el-option
                  v-for="item in priceList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
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
// 导入API
import {
  waterPageWater,
  waterAddMeter,
  waterUpdateWater,
  waterDeleteMeter,
  waterDoWaterSwitch,
} from "@/api/water";

import { waterPriceListPrice } from "@/api/waterPrice";

import { tenantPageTenant } from "@/api/tenant";

import { mapGetters } from "vuex";

// 水表类型枚举
const MeterBindType = [
  { value: 1, label: "专用表" },
  { value: 2, label: "公摊表" },
  { value: 3, label: "公式表" },
];

// 付费模式枚举
const MeterPayType = [
  { value: 0, label: "预付费" },
  { value: 1, label: "强控" },
];

export default {
  name: "WaterManagement",
  data() {
    return {
      tableHeightConfig: {
        headerHeight: 48, // 表头高度
        rowHeight: 47, // 每行高度
        minHeight: 200, // 最小高度
        maxRows: 10, // 最大显示行数（超过9行显示滚动条）
        paginationHeight: 68, // 分页高度
      },
      // 查询参数
      queryData: {
        bindId: "",
        bindType: "",
        id: "",
        waterName: "",
        serial: "",
        mfrsNo: "",
        managerId: "",
        switchStatus: "",
      },
      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: "serial", label: "设备号", type: "input" },
          { prop: "waterName", label: "水表名称", type: "input" },
          { prop: "id", label: "水表编号", type: "input" },
          { prop: "bindType", label: "水表类型", type: "select" },
        ],
        advanced: [{ prop: "mfrsNo", label: "厂家号", type: "input" }],
      },
      // 租户列表数据
      tenantList: [],
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
        serial: "",
        waterName: "",
        bindType: "",
        managerId: "",
        withSwitch: false,
        waterType: "",
        mfrsNo: "",
        logicPayType: "",
        waterModel: "",
        priceId: "",
      },
      // 表单验证规则
      rules: {
        waterName: [
          { required: true, message: "请输入水表名称", trigger: "blur" },
        ],
        serial: [{ required: true, message: "请输入设备号", trigger: "blur" }],
        waterModel: [
          { required: true, message: "请输入设备型号", trigger: "blur" },
        ],
        bindType: [
          { required: true, message: "请选择水表类型", trigger: "change" },
        ],
      },
      // 枚举数据
      MeterBindType,
      MeterPayType,
      // 是否支持阀控选项
      withSwitch: [
        { value: true, label: "支持" },
        { value: false, label: "不支持" },
      ],
      // 厂家号选项
      mfrsNoType: [{ value: "4", label: "4" }],
      // 水表接入渠道
      waterType: [{ value: "YYWL_YY", label: "云易物联" }],
      // 价格方案列表
      priceList: [],
      // 管理方列表
      managerNames: [],
      // 设备型号是否可输入
      isWaterModel: false,
      // 路由权限
      routerAuth: false,
      // 表格列配置
      tableKey: [
        {
          label: "水表编号",
          key: "id",
          width: "120",
          checked: true,
        },
        {
          label: "设备号",
          key: "serial",
          width: "150",
          checked: true,
          disabled: true,
        },
        {
          label: "水表名称",
          key: "waterName",
          width: "200",
          checked: true,
          click: true,
          disabled: true,
        },
        {
          label: "水表类型",
          key: "bindTypeLabel",
          checked: true,
          width: "120",
        },
        {
          label: "绑定信息",
          key: "bindInfo",
          width: "280",
          checked: true,
        },
        {
          label: "水价方案",
          key: "waterPriceName",
          width: "150",
          checked: true,
        },
        {
          label: "阀控",
          key: "withSwitch",
          width: "100",
          checked: true,
        },
        {
          label: "付费模式",
          checked: true,
          key: "logicPayTypeLabel",
          width: "120",
        },
        {
          label: "开关阀状态",
          checked: true,
          key: "switchStatusLabel",
          width: "140",
        },
        {
          label: "厂家号",
          key: "mfrsNo",
          width: "120",
        },
        {
          label: "设备型号",
          key: "waterModel",
          width: "150",
        },
        {
          label: "创建时间",
          key: "createTime",
          width: "180",
        },
      ],
    };
  },
  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    treeSelectedIds() {
      const ids = this.$store.state.treeSelection?.selectedIds || [];
      console.log("实时获取树形选中ID:", ids);
      return ids;
    },
    hasTreeSelection() {
      return this.treeSelectedIds.length > 0;
    },
    // 计算需要显示的列
    displayColumns() {
      return this.tableKey.filter((col) => col.checked !== false);
    },
    dataLength() {
      return this.tableData.length;
    },
    // 判断是否需要显示高级筛选按钮
    needAdvancedSearch() {
      // 当总搜索字段数量大于4个时显示高级筛选
      const totalFields =
        this.searchFields.basic.length + this.searchFields.advanced.length;
      return totalFields > 4;
    },
    // 获取实际显示的基础搜索字段
    displayBasicFields() {
      // 如果不需要高级筛选，显示所有字段
      if (!this.needAdvancedSearch) {
        return [...this.searchFields.basic, ...this.searchFields.advanced];
      }
      // 否则只显示基础字段
      return this.searchFields.basic;
    },
    // 获取高级搜索字段
    displayAdvancedFields() {
      return this.searchFields.advanced;
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
          this.queryData.managerId = newVal;
          this.fetchTableData();
          if (this.routerAuth) {
            this.getPriceList();
          }
        }
      },
      immediate: true,
    },
    // 移除了对 treeSelectedIds 的监听，不再自动调用接口
  },
  methods: {
    // 获取水表列表数据
    async fetchTableData() {
      this.loading = true;
      try {
        // 去除空格
        this.queryData.serial = this.queryData.serial.trim();

        const params = {
          bindId: this.queryData.bindId,
          bindType: this.queryData.bindType,
          id: this.queryData.id,
          waterName: this.queryData.waterName,
          serial: this.queryData.serial,
          managerId: this.queryData.managerId,
          mfrsNo: this.queryData.mfrsNo,
          switchStatus: this.queryData.switchStatus,
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
          },
        };

        const response = await waterPageWater(params);

        if (response.code === 200 && response.data) {
          this.tableData = this.formatTableData(response.data.dataList || []);
          this.pageData.total = response.data.total || 0;
          this.pageData.current = response.data.current || 1;
        } else {
          this.$message.error(response.msg || "获取数据失败");
        }
      } catch (error) {
        this.$message.error("获取水表数据失败");
        console.error("获取水表数据失败:", error);
      } finally {
        this.loading = false;
      }
    },

    // 格式化表格数据
    formatTableData(data) {
      return data.map((item) => {
        // 水表类型标签
        const bindTypeLabel = this.getMeterBindTypeLabel(item.bindType);

        // 付费模式标签
        let logicPayTypeLabel = "-";
        if (item.logicPayType !== null && item.logicPayType !== undefined) {
          const payType = this.MeterPayType.find(
            (p) => p.value == item.logicPayType
          );
          logicPayTypeLabel = payType ? payType.label : "-";
        }

        // 开关阀状态标签
        let switchStatusLabel = "-";
        if (item.switchStatus !== null && item.switchStatus !== undefined) {
          switchStatusLabel = item.switchStatus == 1 ? "开阀" : "关阀";
        }

        return {
          ...item,
          bindTypeLabel,
          logicPayTypeLabel,
          switchStatusLabel,
        };
      });
    },

    // 获取水价方案列表
    async getPriceList() {
      try {
        const response = await waterPriceListPrice({
          managerId: this.queryData.managerId,
        });
        if (response.code === 200 && response.data) {
          this.priceList = response.data || [];
        }
      } catch (error) {
        console.error("获取水价方案失败:", error);
      }
    },

    // 获取水表类型标签
    getMeterBindTypeLabel(value) {
      const item = this.MeterBindType.find((i) => i.value == value);
      return item ? item.label : "-";
    },

    // 查询 - 修改这个方法来支持树形选择参数
    handleSearch() {
      this.pageData.current = 1;
      this.fetchTableDataWithTreeSelection();
    },

    // 新增方法：带树形选择参数的数据获取
    async fetchTableDataWithTreeSelection() {
      this.loading = true;
      try {
        // 去除空格
        this.queryData.serial = this.queryData.serial.trim();

        const params = {
          bindId: this.queryData.bindId,
          bindType: this.queryData.bindType,
          id: this.queryData.id,
          waterName: this.queryData.waterName,
          serial: this.queryData.serial,
          managerId: this.queryData.managerId,
          mfrsNo: this.queryData.mfrsNo,
          switchStatus: this.queryData.switchStatus,
          page: {
            size: this.pageData.size,
            current: this.pageData.current,
          },
        };

        // 只有在点击搜索时才添加树形选择参数
        // if (this.hasTreeSelection) {
        //   params.tierIds = this.treeSelectedIds;
        //   console.log("搜索时使用树形选中查询:", this.treeSelectedIds);
        // }

        const response = await waterPageWater(params);

        if (response.code === 200 && response.data) {
          this.tableData = this.formatTableData(response.data.dataList || []);
          this.pageData.total = response.data.total || 0;
          this.pageData.current = response.data.current || 1;
        } else {
          this.$message.error(response.msg || "获取数据失败");
        }
      } catch (error) {
        this.$message.error("获取水表数据失败");
        console.error("获取水表数据失败:", error);
      } finally {
        this.loading = false;
      }
    },

    // 重置
    handleReset() {
      this.queryData = {
        bindId: "",
        bindType: "",
        id: "",
        waterName: "",
        serial: "",
        mfrsNo: "",
        managerId: this.currentManagerId || "",
        switchStatus: "",
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

    // 处理表格下拉命令
    handleTableCommand(command, row) {
      switch (command) {
        case "switch-on":
          this.handleSwitch(row, 1);
          break;
        case "switch-off":
          this.handleSwitch(row, 0);
          break;
        case "record":
          this.handleRecord(row);
          break;
      }
    },

    // 新增水表
    handleAdd() {
      this.editForm = {
        id: "",
        serial: "",
        waterName: "",
        bindType: "",
        managerId: this.currentManagerId || "",
        withSwitch: false,
        waterType: "",
        mfrsNo: "",
        logicPayType: "",
        waterModel: "",
        priceId: "",
      };
      this.isWaterModel = false;
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate();
      });
    },

    // 编辑水表
    handleEdit(row) {
      this.editForm = {
        id: row.id,
        serial: row.serial,
        waterName: row.waterName,
        bindType: row.bindType,
        managerId: row.managerId,
        withSwitch: row.withSwitch,
        waterType: row.waterType,
        mfrsNo: row.mfrsNo,
        logicPayType: row.logicPayType,
        waterModel: row.waterModel,
        priceId: row.priceId,
      };
      // 如果有值则不可修改
      this.isWaterModel = !!(row.waterModel !== "" && row.waterModel !== null);
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
            let response;
            if (this.editForm.id) {
              // 编辑
              response = await waterUpdateWater(this.editForm);
            } else {
              // 新增
              response = await waterAddMeter(this.editForm);
            }

            if (response.code === 200) {
              this.$message.success(this.editForm.id ? "修改成功" : "新增成功");
              this.dialogVisible = false;
              this.fetchTableData();
            } else {
              this.$message.error(response.msg || "操作失败");
            }
          } catch (error) {
            this.$message.error("操作失败");
            console.error("保存失败:", error);
          } finally {
            this.submitting = false;
          }
        }
      });
    },

    // 开关阀门操作
    async handleSwitch(row, type) {
      // 如果不支持阀控
      if (!row.withSwitch) {
        this.$message.warning("该水表不支持阀控操作");
        return;
      }

      const typeText = type === 1 ? "开阀" : "关阀";

      try {
        await this.$confirm(
          `确定要对水表"${row.waterName}"执行${typeText}操作吗？`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        const response = await waterDoWaterSwitch({
          waterId: row.id,
          type: type,
        });

        if (response.code === 200) {
          this.$message.success(`${typeText}操作成功`);
          this.fetchTableData();
        } else {
          this.$message.error(response.msg || `${typeText}操作失败`);
        }
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error(`${typeText}操作失败`);
          console.error("操作失败:", error);
        }
      }
    },

    // 查看抄表记录
    handleRecord(row) {
      this.$router.push({
        path: "/water-meter-record",
        query: {
          id: row.id,
          name: row.waterName,
        },
      });
    },

    // 水表监控
    handleMonitor(row) {
      this.$router.push({
        path: "/water-monitor",
        query: {
          id: row.serial,
          type: 2,
        },
      });
    },

    // 绑定信息点击
    handleBindClick(row) {
      if (row.waterBindDtoList && row.waterBindDtoList.length > 0) {
        const bindInfo = row.waterBindDtoList[0];
        this.$router.push({
          path: "/tenant-detail",
          query: {
            id: bindInfo.bindId,
            managerId: row.managerId,
          },
        });
      }
    },

    // 导出数据
    handleExport() {
      if (this.selectedData.length === 0) {
        this.$message.warning("请先选择要导出的数据");
        return;
      }
      this.$message.info("导出功能开发中...");
    },

    // 表格设置
    handleTableSetting() {
      this.$message.info("表格设置功能开发中...");
    },

    // 选择变化
    handleSelectionChange(selection) {
      this.selectedData = selection;
    },

    // 分页大小变化
    handleSizeChange(val) {
      this.pageData.size = val;
      this.pageData.current = 1;
      // 分页变化时不传递树形选择参数，使用普通的 fetchTableData
      this.fetchTableData();
    },

    // 当前页变化
    handleCurrentChange(val) {
      this.pageData.current = val;
      // 分页变化时不传递树形选择参数，使用普通的 fetchTableData
      this.fetchTableData();
    },
  },
};
</script>

<style lang="scss" scoped>
// 引入表格页面公共样式
@import "@/assets/styles/table-page.scss";
</style>