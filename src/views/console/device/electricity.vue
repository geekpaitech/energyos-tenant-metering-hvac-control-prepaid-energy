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
                  @change="handleSearch"
                >
                  <!-- 电表类型选项 -->
                  <template v-if="field.prop === 'bindType'">
                    <el-option label="全部" value="" />
                    <el-option label="专用表" value="1" />
                    <el-option label="公摊表" value="2" />
                    <el-option label="公式表" value="3" />
                    <el-option label="空调表" value="4" />
                  </template>
                  <!-- 绑定租户选项 -->
                  <template v-else-if="field.prop === 'bindId'">
                    <el-option label="全部" value="" />
                    <el-option
                      v-for="tenant in tenantList"
                      :key="tenant.tenantId"
                      :label="`${tenant.tenantId}(${tenant.tenantName})`"
                      :value="tenant.tenantId"
                    >
                      <span style="font-size: 12px"
                        >{{ tenant.tenantId }}({{ tenant.tenantName }})</span
                      >
                    </el-option>
                  </template>
                  <!-- 在线状态选项 -->
                  <template v-else-if="field.prop === 'onlineStatus'">
                    <el-option label="全部" value="" />
                    <el-option label="在线" value="1">
                      <span class="option-with-dot">
                        <span class="status-dot online"></span>
                        在线
                      </span>
                    </el-option>
                    <el-option label="离线" value="0">
                      <span class="option-with-dot">
                        <span class="status-dot offline"></span>
                        离线
                      </span>
                    </el-option>
                  </template>
                  <!-- 分合闸状态选项 -->
                  <template v-else-if="field.prop === 'switchStatus'">
                    <el-option label="全部" value="" />
                    <el-option label="分闸" value="0" />
                    <el-option label="合闸" value="1" />
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
                  <!-- 选择框 -->
                  <el-select
                    v-model="queryData[field.prop]"
                    placeholder="请选择"
                    clearable
                    size="small"
                    style="width: 100%"
                    :filterable="field.prop === 'bindId'"
                    @change="handleSearch"
                  >
                    <!-- 绑定租户选项 -->
                    <template v-if="field.prop === 'bindId'">
                      <el-option label="全部" value="" />
                      <el-option
                        v-for="tenant in tenantList"
                        :key="tenant.tenantId"
                        :label="`${tenant.tenantId}(${tenant.tenantName})`"
                        :value="tenant.tenantId"
                      >
                        <span style="font-size: 12px"
                          >{{ tenant.tenantId }}({{ tenant.tenantName }})</span
                        >
                      </el-option>
                    </template>
                    <!-- 在线状态选项 -->
                    <template v-else-if="field.prop === 'onlineStatus'">
                      <el-option label="全部" value="" />
                      <el-option label="在线" value="1">
                        <span class="option-with-dot">
                          <span class="status-dot online"></span>
                          在线
                        </span>
                      </el-option>
                      <el-option label="离线" value="0">
                        <span class="option-with-dot">
                          <span class="status-dot offline"></span>
                          离线
                        </span>
                      </el-option>
                    </template>
                    <!-- 分合闸状态选项 -->
                    <template v-else-if="field.prop === 'switchStatus'">
                      <el-option label="全部" value="" />
                      <el-option label="分闸" value="0" />
                      <el-option label="合闸" value="1" />
                    </template>
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
                新增电表
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
            :align="col.isTag ? 'center' : 'left'"
            :header-align="col.isTag ? 'center' : 'left'"
            :show-overflow-tooltip="true"
          >
            <template slot-scope="scope">
              <!-- 序列号 - 点击复制 -->
              <template v-if="col.key === 'serial'">
                <el-tooltip
                  content="点击可复制"
                  placement="top"
                  :open-delay="300"
                >
                  <span
                    class="serial-copy"
                    @click="handleCopySerial(scope.row.serial)"
                  >
                    {{ scope.row.serial || "-" }}
                  </span>
                </el-tooltip>
              </template>

              <!-- 电费方案 -->
              <template v-else-if="col.key === 'meterPriceName'">
                <el-popover
                  v-if="scope.row.meterPriceDetail"
                  placement="top"
                  width="360"
                  trigger="hover"
                >
                  <div class="price-detail-popover">
                    <div class="price-row">
                      <div class="price-item peak">
                        <span class="price-label">尖电价</span>
                        <span class="price-value"
                          >¥{{
                            scope.row.meterPriceDetail.powerPeakPrice
                          }}</span
                        >
                      </div>
                      <div class="price-item top">
                        <span class="price-label">峰电价</span>
                        <span class="price-value"
                          >¥{{ scope.row.meterPriceDetail.powerTopPrice }}</span
                        >
                      </div>
                      <div class="price-item flat">
                        <span class="price-label">平电价</span>
                        <span class="price-value"
                          >¥{{
                            scope.row.meterPriceDetail.powerFlatPrice
                          }}</span
                        >
                      </div>
                      <div class="price-item valley">
                        <span class="price-label">谷电价</span>
                        <span class="price-value"
                          >¥{{
                            scope.row.meterPriceDetail.powerValleyPrice
                          }}</span
                        >
                      </div>
                    </div>
                  </div>
                  <span slot="reference" class="price-name-link">
                    {{ scope.row.meterPriceName }}
                    <i
                      class="el-icon-warning-outline"
                      style="margin-left: 4px; color: #000"
                    ></i>
                  </span>
                </el-popover>
                <span v-else class="text-muted">-</span>
              </template>

              <!-- 设备名称 - 点击查看详情 -->
              <template v-else-if="col.key === 'meterName'">
                <el-link type="primary" @click="handleMonitor(scope.row)">
                  {{ scope.row.meterName || "-" }}
                </el-link>
              </template>

              <!-- 电表类型 -->
              <template v-else-if="col.key === 'bindTypeLabel'">
                <el-tag
                  v-if="scope.row.bindType == 1"
                  type="success"
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
                <el-tag
                  v-else-if="scope.row.bindType == 4"
                  type="info"
                  size="small"
                  effect="plain"
                >
                  空调表
                </el-tag>
                <span v-else>-</span>
              </template>

              <!-- 已绑信息 -->
              <template v-else-if="col.key === 'bindName'">
                <el-link
                  v-if="scope.row.bindId"
                  type="primary"
                  @click="handleTenantClick(scope.row)"
                >
                  <i class="el-icon-user"></i>
                  {{ scope.row.bindName }}
                </el-link>
                <span v-else class="text-muted">未绑定</span>
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

              <!-- 分合闸状态 - 标签形式 -->
              <template v-else-if="col.key === 'switchStatusLabel'">
                <el-tag
                  v-if="scope.row.switchStatus == 1"
                  type="success"
                  size="small"
                  effect="plain"
                >
                  合闸
                </el-tag>
                <el-tag
                  v-else-if="scope.row.switchStatus == 0"
                  type="info"
                  size="small"
                  effect="plain"
                >
                  分闸
                </el-tag>
                <span v-else>-</span>
              </template>

              <!-- 电表规格（相位） -->
              <template v-else-if="col.key === 'phaseLabel'">
                <el-tag
                  v-if="scope.row.phase == 5"
                  type="primary"
                  size="small"
                  effect="plain"
                >
                  三相一次
                </el-tag>
                <el-tag
                  v-else-if="scope.row.phase == 6"
                  type="success"
                  size="small"
                  effect="plain"
                >
                  三相二次
                </el-tag>
                <el-tag
                  v-else-if="scope.row.phase == 7"
                  type="warning"
                  size="small"
                  effect="plain"
                >
                  单相一次
                </el-tag>
                <span v-else>-</span>
              </template>

              <!-- 在线状态 -->
              <template v-else-if="col.key === 'onlineStatusStatus'">
                <div class="status-wrapper">
                  <span
                    :class="[
                      'status-dot',
                      scope.row.onlineStatus == 1 ? 'online' : 'offline',
                    ]"
                  ></span>
                  <span>{{
                    scope.row.onlineStatus == 1 ? "在线" : "离线"
                  }}</span>
                </div>
              </template>

              <!-- 最新数据时间 -->
              <template v-else-if="col.key === 'syncTime'">
                <span>{{ scope.row.syncTime || "-" }}</span>
              </template>

              <!-- 创建时间 -->
              <template v-else-if="col.key === 'createTime'">
                <span>{{ scope.row.createTime || "-" }}</span>
              </template>

              <!-- 默认显示 -->
              <template v-else>
                {{ scope.row[col.key] || "-" }}
              </template>
            </template>
          </el-table-column>

          <!-- 操作列 - 彻底修复缩放问题 -->
          <!-- 操作列 - 简化布局 -->
          <el-table-column
            label="操作"
            width="190"
            fixed="right"
            align="center"
            :resizable="false"
          >
            <template slot="header">
              <span>操作</span>
            </template>
            <template slot-scope="scope">
              <div class="operation-cell">
                <!-- 分闸/合闸按钮 -->
                <el-button
                  v-if="scope.row.switchStatus == 1"
                  type="text"
                  size="mini"
                  @click="handleSwitch(scope.row, 0)"
                  class="op-btn primary-btn"
                >
                  <i class="el-icon-switch-button"></i>
                  分闸
                </el-button>

                <el-button
                  v-else
                  type="text"
                  size="mini"
                  @click="handleSwitch(scope.row, 1)"
                  class="op-btn primary-btn"
                >
                  <i class="el-icon-open"></i>
                  合闸
                </el-button>

                <!-- <span class="op-divider">|</span> -->

                <!-- 编辑按钮 -->
                <el-button
                  type="text"
                  size="mini"
                  @click="handleEdit(scope.row)"
                  class="op-btn primary-btn"
                >
                  编辑
                </el-button>

                <!-- <span class="op-divider">|</span> -->

                <!-- 详情按钮 -->
                <el-button
                  type="text"
                  size="mini"
                  @click="handleMonitor(scope.row)"
                  class="op-btn primary-btn"
                >
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
            :page-sizes="[15, 30, 60, 100, 200]"
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
    <el-dialog
      :title="editForm.id ? '编辑电表' : '新增电表'"
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
            <el-form-item label="序列号" prop="serial">
              <el-input
                v-model="editForm.serial"
                placeholder="请输入序列号"
                :disabled="!!editForm.id"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="IMEI" prop="imei">
              <el-input v-model="editForm.imei" placeholder="请输入IMEI" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电表名称" prop="meterName">
              <el-input
                v-model="editForm.meterName"
                placeholder="请输入电表名称"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电表类型" prop="bindType">
              <el-select
                v-model="editForm.bindType"
                placeholder="请选择电表类型"
                style="width: 100%"
              >
                <el-option
                  v-for="(item, key) in MeterBindType"
                  :key="key"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="付费模式" prop="logicPayType">
              <el-select
                v-model="editForm.logicPayType"
                placeholder="请选择付费模式"
                style="width: 100%"
              >
                <el-option
                  v-for="(item, key) in MeterPayType"
                  :key="key"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电表相位" prop="phase">
              <el-select
                v-model="editForm.phase"
                placeholder="请选择电表相位"
                style="width: 100%"
              >
                <el-option
                  v-for="(item, key) in MeterPhase"
                  :key="key"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="CT" prop="ct">
              <el-input-number
                v-model="editForm.ct"
                :min="1"
                placeholder="请输入CT值"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="PT" prop="pt">
              <el-input-number
                v-model="editForm.pt"
                :min="1"
                placeholder="请输入PT值"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 编辑时显示价格选择 -->
        <el-row :gutter="20" v-if="editForm.id">
          <el-col :span="12">
            <el-form-item label="电价方案" prop="priceId">
              <el-select
                v-model="editForm.priceId"
                placeholder="请选择电价方案"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="price in priceList"
                  :key="price.id"
                  :label="price.name"
                  :value="price.id"
                >
                  <div>
                    <div>{{ price.name }}</div>
                    <div style="font-size: 12px; color: #999">
                      峰:{{ price.powerPeakPrice }}元 平:{{
                        price.powerFlatPrice
                      }}元 谷:{{ price.powerValleyPrice }}元
                    </div>
                  </div>
                </el-option>
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

    <!-- 修改预付费模式弹窗 -->
    <el-dialog
      title="操作确认"
      :visible.sync="payTypeDialog.visible"
      width="420px"
      :close-on-click-modal="false"
      class="confirm-dialog"
    >
      <div class="confirm-content">
        <i class="el-icon-warning warning-icon"></i>
        <div class="confirm-text">
          <p>该电表为预付费模式，需要先修改为强控模式才能进行分合闸操作。</p>
          <p>是否立即修改？</p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="payTypeDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="handleUpdatePayType">确 定</el-button>
      </span>
    </el-dialog>

    <meter-detail-drawer
      :visible.sync="detailDrawer.visible"
      :meter-id="detailDrawer.meterId"
      :serial="detailDrawer.serial"
    />
  </div>
</template>

<script>
// 导入API
import {
  meterPageMeterInfoByAdmin,
  meterAddMeter,
  meterUpdateMeterBase,
  tenantDoMeterSwitchOffOn,
  meterUpdateLogicPayType,
} from "@/api/meter";

import { tenantPageTenant } from "@/api/tenant";
import { meterPriceList } from "@/api/meterPrice";
import MeterDetailDrawer from "../device/electricity/detail.vue";

// 导入枚举
import {
  MeterBindType,
  MeterPayType,
  MeterSwitchStatus,
  MeterOnlineStatus,
  MeterPhase,
  MeterMonitorType,
  getEnumLabel,
  getEnumItem,
} from "@/utils/enums/meter";

import { mapGetters } from "vuex";
import * as XLSX from "xlsx";

export default {
  name: "MeterManagement",
  components: {
    MeterDetailDrawer,
  },
  data() {
    return {
      isInitialLoad: true, // 添加标记
      detailDrawer: {
        visible: false,
        meterId: "",
        serial: "",
      },
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 11,
        paginationHeight: 68,
      },
      queryData: {
        bindId: "",
        bindType: "",
        id: "",
        managerId: "",
        meterName: "",
        onlineStatus: "",
        serial: "",
        switchStatus: "",
      },
      searchFields: {
        basic: [
          { prop: "serial", label: "序列号", type: "input" },
          { prop: "meterName", label: "电表名称", type: "input" },
          { prop: "bindType", label: "电表类型", type: "select" },
        ],
        advanced: [
          { prop: "onlineStatus", label: "在线状态", type: "select" },
          // { prop: "switchStatus", label: "分合闸", type: "select" },
        ],
      },
      tenantList: [],
      priceList: [],
      tableData: [],
      loading: false,
      submitting: false,
      showAdvanced: false,
      pageData: {
        current: 1,
        size: 15,
        total: 0,
      },
      selectedData: [],
      dialogVisible: false,
      editForm: {
        id: "",
        serial: "",
        imei: "",
        meterName: "",
        bindType: "",
        logicPayType: "",
        ct: 1,
        pt: 1,
        phase: "",
        managerId: "",
        priceId: "",
      },
      rules: {
        serial: [{ required: true, message: "请输入序列号", trigger: "blur" }],
        meterName: [
          { required: true, message: "请输入电表名称", trigger: "blur" },
        ],
        bindType: [
          { required: true, message: "请选择电表类型", trigger: "change" },
        ],
        logicPayType: [
          { required: true, message: "请选择付费模式", trigger: "change" },
        ],
        phase: [
          { required: true, message: "请选择电表相位", trigger: "change" },
        ],
      },
      payTypeDialog: {
        visible: false,
        row: null,
        switchType: null,
      },
      MeterBindType,
      MeterPayType,
      MeterSwitchStatus,
      MeterOnlineStatus,
      MeterPhase,
      MeterMonitorType,
      // 表格列配置 - 添加 isTag 标识
      tableKey: [
        {
          label: "序列号",
          key: "serial",
          width: "150",
          checked: true,
          disabled: true,
        },
        {
          label: "电表名称",
          key: "meterName",
          width: "200",
          checked: true,
          click: true,
          disabled: true,
        },
        {
          label: "类型",
          key: "bindTypeLabel",
          checked: true,
          width: "100",
          isTag: true, // 标记为标签类型
        },
        {
          label: "已绑信息",
          key: "bindName",
          click: true,
          checked: true,
          width: "300",
        },
        {
          label: "付费模式",
          checked: true,
          key: "logicPayTypeLabel",
          width: "100",
          isTag: true, // 标记为标签类型
        },
        {
          label: "电费方案",
          checked: true,
          key: "meterPriceName",
          width: "150",
        },
        {
          label: "电表规格",
          checked: true,
          key: "phaseLabel",
          width: "120",
          isTag: true, // 标记为标签类型
        },
        {
          label: "分合闸状态",
          checked: true,
          key: "switchStatusLabel",
          width: "120",
          isTag: true, // 标记为标签类型
        },
        {
          label: "在线状态",
          checked: true,
          key: "onlineStatusStatus",
          width: "100",
          type: "status",
          isTag: true, // 标记为标签类型
        },
        {
          label: "最新数据时间",
          key: "syncTime",
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
    displayColumns() {
      return this.tableKey.filter((col) => col.checked !== false);
    },
    needAdvancedSearch() {
      const totalFields =
        this.searchFields.basic.length + this.searchFields.advanced.length;
      return totalFields > 5;
    },
    displayBasicFields() {
      if (!this.needAdvancedSearch) {
        return [...this.searchFields.basic, ...this.searchFields.advanced];
      }
      return this.searchFields.basic;
    },
    displayAdvancedFields() {
      return this.searchFields.advanced;
    },
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
  watch: {
    currentManagerId: {
      handler(newVal) {
        if (newVal) {
          this.queryData.managerId = newVal;

          // 首次加载时检查路由参数
          if (this.isInitialLoad) {
            this.isInitialLoad = false;
            this.handleRouteQuery(); // 先处理路由参数
          } else {
            this.fetchTableData(); // 后续变化直接查询
          }

          this.getTenantPageTenant();
          this.getMeterPriceList();
        }
      },
      immediate: true,
    },
  },
  mounted() {
    // 检查路由参数，如果有serial参数则自动查询
    this.handleRouteQuery();
  },

  methods: {
    async getMeterPriceList() {
      try {
        const params = {
          managerId: this.queryData.managerId,
          priceType: 1,
        };
        const response = await meterPriceList(params);

        if (response.code === 200 && response.data) {
          this.priceList = response.data || [];
        } else {
          this.$message.error(response.msg || "获取价格方案失败");
          this.priceList = [];
        }
      } catch (error) {
        console.error("获取价格方案失败:", error);
        this.$message.error("获取价格方案失败");
        this.priceList = [];
      }
    },

    async getTenantPageTenant() {
      try {
        const params = {
          tenantStatus: 0,
          managerId: this.queryData.managerId,
        };
        const response = await tenantPageTenant(params);

        if (response.code === 200 && response.data) {
          this.tenantList = response.data || [];
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

    async fetchTableData() {
      this.loading = true;
      try {
        const params = {
          bindId: this.queryData.bindId,
          bindType: this.queryData.bindType,
          id: this.queryData.id,
          managerId: this.queryData.managerId,
          meterName: this.queryData.meterName,
          onlineStatus: this.queryData.onlineStatus,
          page: {
            current: this.pageData.current,
            size: this.pageData.size,
            orders: [{ asc: false, column: "createTime" }],
          },
          serial: this.queryData.serial,
          switchStatus: this.queryData.switchStatus,
        };

        const response = await meterPageMeterInfoByAdmin(params);

        if (response.code === 200 && response.data) {
          this.tableData = this.formatTableData(response.data.dataList || []);
          this.pageData.total = response.data.total || 0;
        } else {
          this.$message.error(response.msg || "获取数据失败");
        }
      } catch (error) {
        this.$message.error("获取电表数据失败");
        console.error("获取电表数据失败:", error);
      } finally {
        this.loading = false;
      }
    },

    formatTableData(data) {
      return data.map((item) => {
        const bindName = item.bindName
          ? `${item.bindId}(${item.bindName})`
          : "-";

        const bindTypeLabel = getEnumLabel(MeterBindType, item.bindType);
        const logicPayTypeLabel = getEnumLabel(MeterPayType, item.logicPayType);
        const switchStatusLabel = getEnumLabel(
          MeterSwitchStatus,
          item.switchStatus
        );

        const onlineStatusStatus = getEnumItem(
          MeterOnlineStatus,
          item.onlineStatus
        ) || {
          label: "-",
          class: "",
        };

        const phaseLabel = getEnumLabel(MeterPhase, item.phase) || "-";
        const meterPriceName = item.meterPriceDto?.name || "-";
        const meterPriceDetail = item.meterPriceDto || null;

        return {
          ...item,
          bindName,
          bindTypeLabel,
          logicPayTypeLabel,
          switchStatusLabel,
          onlineStatusStatus,
          phaseLabel,
          meterPriceName,
          meterPriceDetail,
        };
      });
    },

    handleSearch() {
      this.pageData.current = 1;
      this.fetchTableData();
    },

    handleReset() {
      this.queryData = {
        bindId: "",
        bindType: "",
        id: "",
        managerId: this.currentManagerId || "",
        meterName: "",
        onlineStatus: "",
        serial: "",
        switchStatus: "",
      };
      this.showAdvanced = false;
      this.handleSearch();
    },

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

    handleAdd() {
      this.editForm = {
        id: "",
        serial: "",
        imei: "",
        meterName: "",
        bindType: "",
        logicPayType: "",
        ct: 1,
        pt: 1,
        phase: "",
        managerId: this.currentManagerId || "",
        priceId: "",
      };
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate();
      });
    },

    handleEdit(row) {
      this.editForm = {
        id: row.id,
        serial: row.serial,
        imei: row.imei || "",
        meterName: row.meterName,
        bindType: row.bindType,
        logicPayType: row.logicPayType,
        ct: row.ct || 1,
        pt: row.pt || 1,
        phase: row.phase,
        managerId: row.managerId,
        priceId: row.priceId || "",
      };
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate();
      });
    },

    async handleSave() {
      this.$refs.editForm.validate(async (valid) => {
        if (valid) {
          this.submitting = true;
          try {
            let response;
            if (this.editForm.id) {
              response = await meterUpdateMeterBase(this.editForm);
            } else {
              response = await meterAddMeter(this.editForm);
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

    handleRouteQuery() {
      const { serial, autoSearch } = this.$route.query;

      if (serial && autoSearch === "true") {
        // 设置查询条件
        this.queryData.serial = serial;

        // 提示用户
        this.$message.info(`正在查询序列号为 ${serial} 的电表...`);

        // 滚动到顶部
        this.$nextTick(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });

          // 高亮显示序列号输入框
          const form = this.$refs.searchForm;
          if (form && form.$el) {
            const serialInput = form.$el.querySelector(
              'input[placeholder*="序列号"]'
            );
            if (serialInput) {
              serialInput.focus();
              serialInput.style.transition = "all 0.3s";
              serialInput.style.boxShadow = "0 0 0 2px #409EFF";
              setTimeout(() => {
                serialInput.style.boxShadow = "";
              }, 1500);
            }
          }

          // 执行搜索
          this.fetchTableData();
        });

        // 清除路由参数
        this.$router.replace({
          path: this.$route.path,
          query: {},
        });
      } else {
        // 没有路由参数时正常查询
        this.fetchTableData();
      }
    },
    async handleSwitch(row, type) {
      if (row.logicPayType === 0 || row.logicPayType === "0") {
        this.payTypeDialog = {
          visible: true,
          row: row,
          switchType: type,
        };
        return;
      }

      const typeText = type === 1 ? "合闸" : "分闸";

      try {
        await this.$confirm(
          `确定要对电表"${row.meterName}"执行${typeText}操作吗？`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
          }
        );

        const response = await tenantDoMeterSwitchOffOn({
          meterId: row.id,
          switchStatus: type,
          verifyCode: "",
          verifyPhone: "",
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

    async handleUpdatePayType() {
      try {
        const response = await meterUpdateLogicPayType({
          meterId: this.payTypeDialog.row.id,
          logicPayType: 1,
        });

        if (response.code === 200) {
          this.$message.success("付费模式修改成功");
          this.payTypeDialog.visible = false;

          setTimeout(() => {
            this.handleSwitch(
              this.payTypeDialog.row,
              this.payTypeDialog.switchType
            );
          }, 500);
        } else {
          this.$message.error(response.msg || "修改失败");
        }
      } catch (error) {
        this.$message.error("修改付费模式失败");
        console.error("修改失败:", error);
      }
    },

    handleMonitor(row) {
      this.detailDrawer = {
        visible: true,
        meterId: row.id,
        serial: row.serial,
      };
    },

    // 复制序列号
    handleCopySerial(serial) {
      if (!serial || serial === "-") {
        this.$message.warning("无可复制内容");
        return;
      }

      // 创建临时输入框
      const input = document.createElement("input");
      input.value = serial;
      document.body.appendChild(input);
      input.select();

      try {
        document.execCommand("copy");
        this.$message.success("序列号已复制");
      } catch (err) {
        this.$message.error("复制失败");
      }

      document.body.removeChild(input);
    },

    handleTenantClick(row) {
      if (!row.bindId) {
        this.$message.warning("该电表未绑定租户");
        return;
      }

      // 如果是公摊表(bindType=2)，跳转到公摊详情页
      if (row.bindType == 2) {
        this.$router.push({
          path: "/metering/fee/electricitySharing/detail",
          query: {
            id: row.bindId,
          },
        });
        return;
      }

      // 跳转到租户详情页
      this.$router.push({
        path: `/metering/tenant/detail/${row.bindId}`,
      });
    },

    handleExport() {
      if (this.tableData.length === 0) {
        this.$message.warning("暂无数据可导出");
        return;
      }

      try {
        const exportData =
          this.selectedData.length > 0 ? this.selectedData : this.tableData;

        // 获取表头和对应的key
        const headers = this.displayColumns.map((col) => col.label);
        const keys = this.displayColumns.map((col) => col.key);

        // 构建数据
        const data = exportData.map((row) => {
          return keys.map((key) => {
            // 特殊处理一些字段
            if (key === "bindTypeLabel") {
              // 如果是标签类型，可能在formatTableData中已经处理好了
              // 这里直接使用row中的值，因为formatTableData已经把 bindTypeLabel 放入 row 了
              return row[key] || "";
            }
            // 处理在线状态对象
            if (key === "onlineStatusStatus") {
              return row[key]?.label || "";
            }
            return row[key] || "";
          });
        });

        // 添加表头
        const wsData = [headers, ...data];

        // 创建工作表
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // 设置列宽
        const colWidths = headers.map((h) => ({ wch: Math.max(h.length * 2, 15) }));
        ws["!cols"] = colWidths;

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "电表数据");

        // 生成文件名
        const fileName = this.generateFileName();

        // 导出文件
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();

        // 清理
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.$message.success(
          `成功导出${exportData.length}条${
            this.selectedData.length > 0 ? "选中" : ""
          }数据`
        );
      } catch (error) {
        console.error("导出失败:", error);
        this.$message.error("导出失败");
      }
    },

    generateFileName() {
      const now = new Date();
      const timeStr =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        "_" +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0") +
        String(now.getSeconds()).padStart(2, "0");
      return `电表数据_${timeStr}.xlsx`;
    },

    handleTableSetting() {
      this.$message.info("表格设置功能开发中...");
    },

    handleSelectionChange(selection) {
      this.selectedData = selection;
    },

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
// ==================== 序列号复制样式 ====================
.serial-copy {
  color: #000;
  cursor: pointer;
  user-select: none;
  display: inline-block;
  transition: all 0.2s ease;

  &:hover {
    color: #409eff;
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
      color: #409eff;

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
    color: #dcdfe6;
    font-size: 12px;
    flex-shrink: 0;
  }

  .op-more {
    font-size: 12px;
    color: #409eff;
    cursor: pointer;
    user-select: none;
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;

    &:hover {
      color: #409eff;
    }

    i {
      margin-left: 2px;
      font-size: 12px;
    }
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

// ==================== 电费方案价格弹出框样式 ====================
.price-detail-popover {
  .price-row {
    display: flex;
    gap: 12px;

    .price-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px;
      border-radius: 6px;
      background: #f5f7fa;

      .price-label {
        font-size: 12px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 4px;

        &::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }
      }

      .price-value {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        font-family: "SF Mono", monospace;
      }

      &.peak {
        .price-label::before {
          background: #dc2626;
        }

        .price-value {
          color: #000;
        }
      }

      &.top {
        .price-label::before {
          background: #f59e0b;
        }

        .price-value {
          color: #000;
        }
      }

      &.flat {
        .price-label::before {
          background: #3b82f6;
        }

        .price-value {
          color: #000;
        }
      }

      &.valley {
        .price-label::before {
          background: #10b981;
        }

        .price-value {
          color: #000;
        }
      }
    }
  }
}

.price-name-link {
  color: #000;
  cursor: pointer;
  display: inline-flex;
  align-items: center;

  &:hover {
    color: #000;
  }
}
</style>
