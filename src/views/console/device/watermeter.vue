<template>
  <div class="table-page-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-card class="search-card" shadow="never">
        <el-form :model="queryData" ref="searchForm" class="search-form compact-form" label-position="left"
          label-width="80px">
          <!-- 基础筛选 -->
          <el-row :gutter="16" class="search-row">
            <el-col v-for="field in displayBasicFields" :key="field.prop" :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item :label="field.label" :prop="field.prop" class="compact-form-item">
                <!-- 输入框 -->
                <el-input v-if="field.type === 'input'" v-model="queryData[field.prop]" placeholder="请输入" clearable
                  size="small" />
                <!-- 选择框 -->
                <el-select v-else-if="field.type === 'select'" v-model="queryData[field.prop]" placeholder="请选择"
                  clearable size="small" style="width: 100%" @change="handleSearch">
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

          <!-- 高级筛选 -->
          <el-collapse-transition v-if="needAdvancedSearch">
            <el-row :gutter="16" v-show="showAdvanced" class="search-row">
              <el-col v-for="field in displayAdvancedFields" :key="field.prop" :xs="24" :sm="12" :md="8" :lg="6">
                <el-form-item :label="field.label" :prop="field.prop" class="compact-form-item">
                  <el-select v-model="queryData[field.prop]" placeholder="请选择" clearable size="small"
                    style="width: 100%">
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-transition>

          <!-- 操作按钮行 -->
          <div class="form-actions compact-actions">
            <div class="action-left">
              <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAdd">
                新增水表
              </el-button>
            </div>
            <div class="action-right">
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleSearch">
                查询
              </el-button>
              <el-button icon="el-icon-refresh" size="small" @click="handleReset">
                重置
              </el-button>
              <el-button v-if="needAdvancedSearch" type="text" size="small" @click="showAdvanced = !showAdvanced"
                style="padding: 7px 8px">
                <i class="el-icon-s-operation" style="margin-right: 4px"></i>
                高级筛选
                <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" style="margin-left: 2px"></i>
              </el-button>
              <el-divider v-if="needAdvancedSearch" direction="vertical" style="margin: 0 8px"></el-divider>
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
                  <el-dropdown-item command="batch" icon="el-icon-s-operation" divided>
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
          border
          :data="tableData" 
          :max-height="tableMaxHeight" 
          stripe 
          style="width: 100%"
          class="custom-table light-border-table" 
          @selection-change="handleSelectionChange" 
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }">
          <el-table-column type="selection" width="55" align="center" />

          <!-- 按照tableKey配置显示列 -->
          <el-table-column 
            v-for="col in displayColumns" 
            :key="col.key" 
            :prop="col.key" 
            :label="col.label"
            :width="col.width" 
            :min-width="col.minWidth" 
            :align="col.isTag ? 'center' : 'left'"
            :header-align="col.isTag ? 'center' : 'left'"
            :show-overflow-tooltip="true">
            <template slot-scope="scope">
              <!-- 设备号 - 点击复制 -->
                <template v-if="col.key === 'serial'">
                <el-tooltip content="点击可复制" placement="top" :open-delay="300">
                  <span class="serial-copy" @click="handleCopySerial(scope.row.serial)">
                    {{ scope.row.serial || "-" }}
                  </span>
                </el-tooltip>
              </template>

              <!-- 水表名称 - 点击查看详情 -->
              <template v-else-if="col.key === 'waterName'">
                <el-link type="primary" @click="handleDetail(scope.row)">
                  {{ scope.row.waterName || "-" }}
                </el-link>
              </template>

              <!-- 已绑信息 -->
              <template v-else-if="col.key === 'bindInfo'">
                <el-popover v-if="scope.row.waterBindDtoList && scope.row.waterBindDtoList.length > 1"
                  placement="top-start" width="300" trigger="hover">
                  <el-table :data="scope.row.waterBindDtoList">
                    <el-table-column property="bindId" label="绑定ID" />
                    <el-table-column property="bindName" label="绑定信息" />
                  </el-table>
                  <div slot="reference" class="bind-info-wrapper">
                    <el-link type="primary">
                      <i class="el-icon-user"></i>
                      {{ scope.row.waterBindDtoList[0] ?
                        `${scope.row.waterBindDtoList[0].bindId}(${scope.row.waterBindDtoList[0].bindName})` : "-" }}
                    </el-link>
                  </div>
                </el-popover>
                <el-link 
                  v-else-if="scope.row.waterBindDtoList && scope.row.waterBindDtoList.length === 1"
                  type="primary" 
                  @click="handleBindClick(scope.row)">
                  <i class="el-icon-user"></i>
                  {{ scope.row.waterBindDtoList[0] ?
                    `${scope.row.waterBindDtoList[0].bindId}(${scope.row.waterBindDtoList[0].bindName})` : "-" }}
                </el-link>
                <span v-else class="text-muted">未绑定</span>
              </template>

              <!-- 水表类型 -->
              <template v-else-if="col.key === 'bindTypeLabel'">
                <el-tag v-if="scope.row.bindType == 1" type="success" size="small" effect="plain">
                  专用表
                </el-tag>
                <el-tag v-else-if="scope.row.bindType == 2" type="warning" size="small" effect="plain">
                  公摊表
                </el-tag>
                <el-tag v-else-if="scope.row.bindType == 3" type="info" size="small" effect="plain">
                  公式表
                </el-tag>
                <span v-else>-</span>
              </template>

              <!-- 支持阀控 -->
              <template v-else-if="col.key === 'withSwitch'">
                <el-tag :type="scope.row.withSwitch ? 'success' : 'info'" size="small" effect="plain">
                  {{ scope.row.withSwitch ? "支持" : "不支持" }}
                </el-tag>
              </template>

              <!-- 付费模式 -->
              <template v-else-if="col.key === 'logicPayTypeLabel'">
                <el-tag v-if="scope.row.logicPayType == 0" type="success" size="small">
                  预付费
                </el-tag>
                <el-tag v-else-if="scope.row.logicPayType == 1" type="primary" size="small">
                  强控
                </el-tag>
                <span v-else>-</span>
              </template>

              <!-- 开关阀状态 -->
              <template v-else-if="col.key === 'switchStatusLabel'">
                <el-tag v-if="scope.row.switchStatus == 1" type="success" size="small" effect="plain">
                  开阀
                </el-tag>
                <el-tag v-else-if="scope.row.switchStatus == 0" type="info" size="small" effect="plain">
                  关阀
                </el-tag>
                <span v-else>-</span>
              </template>

              <!-- 最新数据时间 -->
              <template v-else-if="col.key === 'updateTime'">
                <span>{{ scope.row.updateTime || '-' }}</span>
              </template>

              <!-- 创建时间 -->
              <template v-else-if="col.key === 'createTime'">
                <span>{{ scope.row.createTime || '-' }}</span>
              </template>

              <!-- 默认显示 -->
              <template v-else>
                {{ scope.row[col.key] || "-" }}
              </template>
            </template>
          </el-table-column>

          <!-- 操作列 - 彻底修复缩放问题 -->
          <el-table-column label="操作"  align="center" :resizable="false">
            <template slot="header">
              <span>操作</span>
            </template>
            <template slot-scope="scope">
              <div class="operation-cell">
                <!-- 编辑按钮 -->
                <el-button 
                  type="text" 
                  size="mini"
                  @click="handleEdit(scope.row)" 
                  class="op-btn primary-btn">
                  编辑
                </el-button>

                <!-- <span class="op-divider">|</span> -->

                <!-- 详情按钮 -->
                <el-button 
                  type="text" 
                  size="mini"
                  @click="handleDetail(scope.row)" 
                  class="op-btn primary-btn">
                  详情
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container compact-pagination">
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
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog :title="editForm.id ? '编辑水表' : '新增水表'" :visible.sync="dialogVisible" width="680px"
      :close-on-click-modal="false" class="custom-dialog">
      <el-form ref="editForm" :model="editForm" :rules="rules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备号" prop="serial">
              <el-input v-model="editForm.serial" placeholder="请输入设备号" :disabled="!!editForm.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="水表名称" prop="waterName">
              <el-input v-model="editForm.waterName" placeholder="请输入水表名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="水表类型" prop="bindType">
              <el-select v-model="editForm.bindType" placeholder="请选择水表类型" style="width: 100%">
                <el-option v-for="item in MeterBindType" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="接入渠道">
              <el-select v-model="editForm.waterType" clearable placeholder="请选择接入渠道" style="width: 100%">
                <el-option v-for="item in waterType" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备型号" prop="waterModel">
              <el-input v-model="editForm.waterModel" :disabled="isWaterModel" placeholder="请输入设备型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否支持阀控">
              <el-select v-model="editForm.withSwitch" clearable placeholder="请选择" style="width: 100%">
                <el-option v-for="item in withSwitch" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12" v-if="editForm.waterType === 'YYWL_YY'">
            <el-form-item label="厂家号">
              <el-select v-model="editForm.mfrsNo" clearable :disabled="!!editForm.id" placeholder="请选择厂家号"
                style="width: 100%">
                <el-option v-for="item in mfrsNoType" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="editForm.withSwitch">
            <el-form-item label="付费模式">
              <el-select v-model="editForm.logicPayType" placeholder="请选择付费模式" style="width: 100%" clearable>
                <el-option v-for="item in MeterPayType" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="editForm.id">
          <el-col :span="12">
            <el-form-item label="计费方案">
              <el-select v-model="editForm.priceId" clearable placeholder="请选择计费方案" style="width: 100%">
                <el-option v-for="item in priceList" :key="item.id" :label="`${item.name} (¥${item.price}/吨)`"
                  :value="item.id" />
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

    <!-- 水表详情抽屉 -->
    <water-detail-drawer 
      :visible.sync="detailDrawer.visible" 
      :water-id="detailDrawer.waterId"
      :serial="detailDrawer.serial" 
      :row-data="detailDrawer.rowData" 
      @refresh="fetchTableData" 
    />
  </div>
</template>

<script>
// 导入API
import {
  waterPageWater,
  waterAddMeter,
  waterUpdateWater
} from "@/api/water";

import { waterPriceListPrice } from "@/api/waterPrice";
import WaterDetailDrawer from './watermeter/detail.vue';

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
  components: {
    WaterDetailDrawer
  },
  data() {
    return {
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 11,
        paginationHeight: 68,
      },
      // 查询参数
      queryData: {
        bindType: "",
        waterName: "",
        serial: "",
        managerId: "",
      },
      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: "serial", label: "设备号", type: "input" },
          { prop: "waterName", label: "水表名称", type: "input" },
          { prop: "bindType", label: "水表类型", type: "select" },
        ],
        advanced: [],
      },
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
        waterName: [{ required: true, message: "请输入水表名称", trigger: "blur" }],
        serial: [{ required: true, message: "请输入设备号", trigger: "blur" }],
        waterModel: [{ required: true, message: "请输入设备型号", trigger: "blur" }],
        bindType: [{ required: true, message: "请选择水表类型", trigger: "change" }],
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
      waterType: [
        { value: 'ZHWL_NS', label: '智慧物联-南硕' }
      ],
      // 价格方案列表
      priceList: [],
      // 设备型号是否可输入
      isWaterModel: false,
      // 详情抽屉
      detailDrawer: {
        visible: false,
        waterId: '',
        serial: '',
        rowData: null
      },
      // 表格列配置 - 添加 isTag 标识
      tableKey: [
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
          disabled: true,
        },
        {
          label: "已绑信息",
          key: "bindInfo",
          width: "300",
          checked: true,
        },
        {
          label: "类型",
          key: "bindTypeLabel",
          checked: true,
          width: "100",
          isTag: true, // 标记为标签类型
        },
        {
          label: "支持阀控",
          key: "withSwitch",
          width: "100",
          checked: true,
          isTag: true, // 标记为标签类型
        },
        {
          label: "付费模式",
          checked: true,
          key: "logicPayTypeLabel",
          width: "100",
          isTag: true, // 标记为标签类型
        },
        {
          label: "开关阀状态",
          checked: true,
          key: "switchStatusLabel",
          width: "120",
          isTag: true, // 标记为标签类型
        },
        {
          label: "最新数据时间",
          key: "updateTime",
          width: "160",
          checked: true,
        },
        {
          label: "创建时间",
          key: "createTime",
          width: "160",
          checked: true,
        },
      ],
    };
  },
  computed: {
    ...mapGetters("manager", ["currentManagerId"]),
    dataLength() {
      return this.tableData.length;
    },
    // 计算需要显示的列
    displayColumns() {
      return this.tableKey.filter((col) => col.checked !== false);
    },
    // 判断是否需要显示高级筛选按钮
    needAdvancedSearch() {
      const totalFields = this.searchFields.basic.length + this.searchFields.advanced.length;
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
          this.queryData.managerId = newVal;
          this.fetchTableData();
          this.getPriceList();
        }
      },
      immediate: true,
    },
  },

  methods: {
    // 获取水表列表数据
    async fetchTableData() {
      this.loading = true;
      try {
        this.queryData.serial = this.queryData.serial.trim();

        const params = {
          bindType: this.queryData.bindType,
          waterName: this.queryData.waterName,
          serial: this.queryData.serial,
          managerId: this.queryData.managerId,
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
          const payType = this.MeterPayType.find((p) => p.value == item.logicPayType);
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

    // 查询
    handleSearch() {
      this.pageData.current = 1;
      this.fetchTableData();
    },

    // 重置
    handleReset() {
      this.queryData = {
        bindType: "",
        waterName: "",
        serial: "",
        managerId: this.currentManagerId || "",
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

    // 查看详情
    handleDetail(row) {
      this.detailDrawer = {
        visible: true,
        waterId: row.id,
        serial: row.serial,
        rowData: row
      };
    },

    // 复制序列号
    handleCopySerial(serial) {
      if (!serial || serial === '-') {
        this.$message.warning('无可复制内容');
        return;
      }
      
      // 创建临时输入框
      const input = document.createElement('input');
      input.value = serial;
      document.body.appendChild(input);
      input.select();
      
      try {
        document.execCommand('copy');
        this.$message.success('设备号已复制');
      } catch (err) {
        this.$message.error('复制失败');
      }
      
      document.body.removeChild(input);
    },

    // 绑定信息点击 - 跳转到租户详情
    handleBindClick(row) {
      if (!row.waterBindDtoList || row.waterBindDtoList.length === 0) {
        this.$message.warning('该水表未绑定租户');
        return;
      }
      
      const bindId = row.waterBindDtoList[0].bindId;
      if (!bindId) {
        this.$message.warning('租户ID不存在');
        return;
      }
      
      // 如果是公摊表(bindType=2)，跳转到公摊详情页
      if (row.bindType == 2) {
        this.$router.push({
          path: '/metering/fee/watermeterSharing/detail',
          query: {
            id: bindId
          }
        });
        return;
      }

      // 跳转到租户详情页
      this.$router.push({
        path: `/metering/tenant/detail/${bindId}`
      });
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

// ==================== 弱化表格边框 ====================
.light-border-table {
  ::v-deep {
    border: 1px solid #f0f0f0 !important;
    
    .el-table__header-wrapper {
      th {
        border-right: 1px solid #f0f0f0 !important;
        border-bottom: 1px solid #f0f0f0 !important;
      }
    }
    
    td {
      border-right: 1px solid #f5f5f5 !important;
      border-bottom: 1px solid #f5f5f5 !important;
    }
    
    .el-table__fixed,
    .el-table__fixed-right {
      &::before {
        background-color: transparent !important;
      }
    }
    
    .el-table__fixed-right-patch {
      border-bottom: 1px solid #f0f0f0 !important;
      background-color: #f5f7fa !important;
    }
  }
}

// ==================== 序列号复制样式 ====================
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

// ==================== 操作列样式 - 彻底修复 ====================
.operation-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  
  .op-btn {
    padding: 0;
    margin: 0;
    font-size: 12px;
    line-height: 1;
    border: none;
    background: none;
    flex-shrink: 0;
    
    // 统一蓝色
    &.primary-btn {
      color: #409EFF;
      
      &:hover {
        color: #66b1ff;
      }
      
      &:active {
        color: #3a8ee6;
      }
    }
  }
  
  .op-divider {
    display: inline-block;
    margin: 0 8px;
    color: #DCDFE6;
    font-size: 12px;
    flex-shrink: 0;
  }
}

// ==================== 紧凑型分页样式 ====================
.compact-pagination {
  ::v-deep .el-pagination {
    font-size: 12px;
    
    // 总条数文字
    .el-pagination__total {
      font-size: 12px;
      line-height: 24px;
    }
    
    // 每页条数选择器
    .el-pagination__sizes {
      .el-input {
        width: 90px;
        
        .el-input__inner {
          height: 24px;
          line-height: 24px;
          font-size: 12px;
          padding: 0 8px;
        }
      }
    }
    
    // 上一页/下一页按钮
    .btn-prev,
    .btn-next {
      min-width: 24px;
      height: 24px;
      line-height: 24px;
      font-size: 12px;
      padding: 0 6px;
    }
    
    // 页码按钮
    .el-pager {
      li {
        min-width: 24px;
        height: 24px;
        line-height: 24px;
        font-size: 12px;
        padding: 0 6px;
        
        &.active {
          font-weight: 600;
        }
      }
    }
    
    // 跳转输入框
    .el-pagination__jump {
      font-size: 12px;
      line-height: 24px;
      
      .el-input {
        width: 40px;
        
        .el-input__inner {
          height: 24px;
          line-height: 24px;
          font-size: 12px;
          padding: 0 4px;
        }
      }
    }
  }
}
</style>