<template>
  <div class="table-page-container">
    <!-- 查询区域 -->
    <div class="search-box">
      <el-form :model="queryData" ref="searchForm" class="search-form" @submit.native.prevent>
        <div class="search-main-grid">
          <div class="field-item field-keyword">
            <el-input
              v-model="queryData.serial"
              :placeholder="$t('deviceWater.searchPlaceholder')"
              clearable
              size="small"
              style="width: 100%"
              prefix-icon="el-icon-search"
              @clear="handleSearch"
              @keyup.enter.native="handleSearch"
            />
          </div>
          <div class="field-item field-type">
            <el-select
              v-model="queryData.bindType"
              :placeholder="$t('deviceWater.waterTypePlaceholder')"
              clearable
              size="small"
              style="width: 100%"
              @change="handleSearch"
            >
              <el-option :label="$t('deviceWater.bindTypeDedicated')" value="1" />
              <el-option :label="$t('deviceWater.bindTypePublic')" value="2" />
              <el-option :label="$t('deviceWater.bindTypeFormula')" value="3" />
            </el-select>
          </div>
          <div class="search-actions">
            <el-button type="primary" size="small" icon="el-icon-search" @click="handleSearch">{{ $t('deviceWater.search') }}</el-button>
            <el-button size="small" icon="el-icon-refresh" @click="handleReset">{{ $t('deviceWater.reset') }}</el-button>
            <el-button type="success" size="small" icon="el-icon-download" @click="handleExport">{{ $t('deviceWater.export') }}</el-button>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 内容区域 -->
    <div class="content-box">
      <div class="content-toolbar">
        <div class="toolbar-left">
          <span class="section-title">
            <span class="title-bar" />
            {{ viewMode === 'card' ? $t('deviceWater.sectionCard') : $t('deviceWater.sectionList') }}
          </span>
        </div>
        <div class="toolbar-right">
          <el-button v-if="canAdd" type="primary" size="small" icon="el-icon-plus" @click="handleAdd">
            {{ $t('deviceWater.add') }}
          </el-button>
          <el-select
            v-model="sortOrder"
            size="small"
            style="width: 100px"
          >
            <el-option :label="$t('deviceWater.sortDefault')" value="default" />
          </el-select>
          <div class="view-switch-group">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="list">
                <i class="el-icon-s-grid" /> {{ $t('deviceWater.viewList') }}
              </el-radio-button>
              <el-radio-button label="card">
                <i class="el-icon-menu" /> {{ $t('deviceWater.viewCard') }}
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="list-view">
        <!-- 表格工具栏 -->
        <div class="table-toolbar" v-if="selectedData.length > 0">
          <div class="toolbar-left">
            <span class="selection-info">
              {{ $t('deviceWater.selectedCount', { count: selectedData.length }) }}
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
                <el-tooltip :content="$t('deviceWater.copyDeviceNoTip')" placement="top" :open-delay="300">
                  <span class="serial-copy" @click="handleCopySerial(scope.row.serial)">
                    {{ scope.row.serial || "-" }}
                  </span>
                </el-tooltip>
              </template>

              <!-- 水表名称 - 点击查看详情 -->
              <template v-else-if="col.key === 'waterName'">
                <el-link v-if="canShowDetail" type="primary" :title="scope.row.waterName || ''" @click="handleDetail(scope.row)">
                  {{ $displayDynamicName(scope.row.waterName, 44) || '-' }}
                </el-link>
                <span v-else :title="scope.row.waterName || ''">{{ $displayDynamicName(scope.row.waterName, 44) || '-' }}</span>
              </template>

              <!-- 已绑信息 -->
              <template v-else-if="col.key === 'bindInfo'">
                <el-popover v-if="scope.row.waterBindDtoList && scope.row.waterBindDtoList.length > 1"
                  placement="top-start" width="300" trigger="hover">
                  <el-table :data="scope.row.waterBindDtoList">
                    <el-table-column property="bindId" :label="$t('deviceWater.popoverBindId')" />
                    <el-table-column property="bindName" :label="$t('deviceWater.popoverBindName')" />
                  </el-table>
                  <div slot="reference" class="bind-info-wrapper">
                    <el-link type="primary" :title="waterBindLineTitle(scope.row.waterBindDtoList[0])">
                      <i class="el-icon-user"></i>
                      {{ scope.row.waterBindDtoList[0] ? displayWaterBindLine(scope.row.waterBindDtoList[0]) : "-" }}
                    </el-link>
                  </div>
                </el-popover>
                <el-link
                  v-else-if="scope.row.waterBindDtoList && scope.row.waterBindDtoList.length === 1"
                  type="primary"
                  :title="waterBindLineTitle(scope.row.waterBindDtoList[0])"
                  @click="handleBindClick(scope.row)">
                  <i class="el-icon-user"></i>
                  {{ displayWaterBindLine(scope.row.waterBindDtoList[0]) }}
                </el-link>
                <span v-else class="text-muted">{{ $t('deviceWater.unbound') }}</span>
              </template>

              <!-- 水表类型 -->
              <template v-else-if="col.key === 'bindTypeLabel'">
                <el-tag v-if="scope.row.bindType == 1" type="success" size="small" effect="plain">
                  {{ $t('deviceWater.bindTypeDedicated') }}
                </el-tag>
                <el-tag v-else-if="scope.row.bindType == 2" type="warning" size="small" effect="plain">
                  {{ $t('deviceWater.bindTypePublic') }}
                </el-tag>
                <el-tag v-else-if="scope.row.bindType == 3" type="info" size="small" effect="plain">
                  {{ $t('deviceWater.bindTypeFormula') }}
                </el-tag>
                <span v-else>-</span>
              </template>

              <!-- 支持阀控 -->
              <template v-else-if="col.key === 'withSwitch'">
                <el-tag :type="scope.row.withSwitch ? 'success' : 'info'" size="small" effect="plain">
                  {{ scope.row.withSwitch ? $t('deviceWater.switchSupportYes') : $t('deviceWater.switchSupportNo') }}
                </el-tag>
              </template>

              <!-- 付费模式 -->
              <template v-else-if="col.key === 'logicPayTypeLabel'">
                <el-tag v-if="scope.row.logicPayType == 0" type="success" size="small">
                  {{ $t('deviceWater.prepaid') }}
                </el-tag>
                <el-tag v-else-if="scope.row.logicPayType == 1" type="primary" size="small">
                  {{ $t('deviceWater.prepaidStrong') }}
                </el-tag>
                <span v-else>-</span>
              </template>

              <!-- 开关阀状态 -->
              <template v-else-if="col.key === 'switchStatusLabel'">
                <el-tag v-if="scope.row.switchStatus == 1" type="success" size="small" effect="plain">
                  {{ $t('deviceWater.valveOpen') }}
                </el-tag>
                <el-tag v-else-if="scope.row.switchStatus == 0" type="info" size="small" effect="plain">
                  {{ $t('deviceWater.valveClose') }}
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
          <el-table-column v-if="canEdit || canView" :label="$t('deviceWater.opColumn')" width="140" min-width="140" fixed="right" align="center" :resizable="false">
            <template slot-scope="scope">
              <div class="operation-cell">
                <!-- 编辑按钮 -->
                <el-button
                  v-if="canEdit"
                  type="text"
                  size="mini"
                  @click="handleEdit(scope.row)"
                  class="op-btn primary-btn">
                  {{ $t('deviceWater.opEdit') }}
                </el-button>

                <!-- <span class="op-divider">|</span> -->

                <!-- 详情按钮 -->
                <el-button
                  v-if="canShowDetail"
                  type="text"
                  size="mini"
                  @click="handleDetail(scope.row)"
                  class="op-btn primary-btn">
                  {{ $t('deviceWater.opDetail') }}
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

      <div v-else class="card-view">
        <div v-loading="loading">
          <el-empty v-if="!loading && tableData.length === 0" :description="$t('deviceWater.emptyNoData')" :image-size="80" />
          <!-- 使用 CSS Grid 替代 el-row/el-col，避免 flex 换行 + 卡片高度不一时出现「格子里空缺」 -->
          <div v-else class="device-card-grid device-card-grid--css">
            <el-card
              v-for="(row, cardIndex) in tableData"
              :key="waterCardRowKey(row, cardIndex)"
              shadow="hover"
              class="device-card"
              :class="{ 'is-clickable': canShowDetail }"
              @click.native="handleCardClick(row)"
            >
                <div class="device-card-main">
                  <div class="device-card-left">
                    <div class="device-card-title">
                      <el-link v-if="canShowDetail" type="primary" :title="row.waterName || ''" @click.stop="handleDetail(row)">
                        {{ $displayDynamicName(row.waterName, 44) || '-' }}
                      </el-link>
                      <span v-else :title="row.waterName || ''">{{ $displayDynamicName(row.waterName, 44) || '-' }}</span>
                    </div>
                    <div class="device-card-tags">
                      <el-tag v-if="row.withSwitch" :type="row.switchStatus == 1 ? 'success' : 'info'" size="mini" effect="plain">
                        {{ row.switchStatus == 1 ? $t('deviceWater.valveOpen') : $t('deviceWater.valveClose') }}
                      </el-tag>
                      <el-tag :type="row.withSwitch ? 'success' : 'info'" size="mini" effect="plain">
                        {{ row.withSwitch ? $t('deviceWater.tagValveSupport') : $t('deviceWater.tagValveNotSupport') }}
                      </el-tag>
                      <el-tag v-if="row.bindType == 1" type="primary" size="mini" effect="plain">{{ $t('deviceWater.bindTagDedicated') }}</el-tag>
                      <el-tag v-else-if="row.bindType == 2" type="warning" size="mini" effect="plain">{{ $t('deviceWater.bindTagPublic') }}</el-tag>
                      <el-tag v-else-if="row.bindType == 3" type="info" size="mini" effect="plain">{{ $t('deviceWater.bindTagFormula') }}</el-tag>
                    </div>

                    <div class="device-card-body">
                      <div class="kv">
                        <span class="k">{{ $t('deviceWater.cardDeviceNo') }}</span>
                        <span class="v serial-copy" @click.stop="handleCopySerial(row.serial)">{{ row.serial || '-' }}</span>
                      </div>
                      <div class="kv">
                        <span class="k">{{ $t('deviceWater.cardBindInfo') }}</span>
                        <span class="v">
                          <el-popover
                            v-if="row.waterBindDtoList && row.waterBindDtoList.length > 1"
                            placement="top-start"
                            width="300"
                            trigger="hover"
                          >
                            <el-table :data="row.waterBindDtoList">
                              <el-table-column property="bindId" :label="$t('deviceWater.popoverBindId')" />
                              <el-table-column property="bindName" :label="$t('deviceWater.popoverBindName')" />
                            </el-table>
                            <span slot="reference" class="bind-info-wrapper">
                              <el-link type="primary" :title="waterBindLineTitle(row.waterBindDtoList[0])">
                                {{
                                  row.waterBindDtoList[0]
                                    ? displayWaterBindLine(row.waterBindDtoList[0])
                                    : '-'
                                }}
                              </el-link>
                            </span>
                          </el-popover>
                          <el-link
                            v-else-if="row.waterBindDtoList && row.waterBindDtoList.length === 1"
                            type="primary"
                            :title="waterBindLineTitle(row.waterBindDtoList[0])"
                            @click.stop="handleBindClick(row)"
                          >
                            {{ displayWaterBindLine(row.waterBindDtoList[0]) }}
                          </el-link>
                          <span v-else class="text-muted">{{ $t('deviceWater.unbound') }}</span>
                        </span>
                      </div>
                      <div class="kv">
                        <span class="k">{{ $t('deviceWater.cardPayMode') }}</span>
                        <span class="v">{{ row.logicPayTypeLabel || '-' }}</span>
                      </div>
                      <div class="kv">
                        <span class="k">{{ $t('deviceWater.cardLatest') }}</span>
                        <span class="v">{{ row.updateTime || '-' }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="device-card-right">
                    <img class="device-card-img" :src="meterCardImg" alt="" />
                  </div>
                </div>

                <div v-if="canEdit || canView" class="device-card-actions-bar">
                  <button v-if="canEdit" class="card-action" type="button" @click.stop="handleEdit(row)">
                    <i class="el-icon-edit-outline"></i>
                    <span>{{ $t('deviceWater.opEdit') }}</span>
                  </button>
                  <button v-if="canShowDetail" class="card-action" type="button" @click.stop="handleDetail(row)">
                    <i class="el-icon-document"></i>
                    <span>{{ $t('deviceWater.opDetail') }}</span>
                  </button>
                </div>
              </el-card>
          </div>
        </div>

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
    <el-dialog :title="editForm.id ? $t('deviceWater.dialogEditTitle') : $t('deviceWater.dialogAddTitle')" :visible.sync="dialogVisible" width="680px"
      :close-on-click-modal="false" class="custom-dialog">
      <el-form ref="editForm" :model="editForm" :rules="editFormRules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('deviceWater.labelDeviceNo')" prop="serial">
              <el-input v-model="editForm.serial" :placeholder="$t('deviceWater.placeholderDeviceNo')" :disabled="!!editForm.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('deviceWater.labelWaterName')" prop="waterName">
              <el-input v-model="editForm.waterName" :placeholder="$t('deviceWater.placeholderWaterName')" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('deviceWater.labelWaterType')" prop="bindType">
              <el-select v-model="editForm.bindType" :placeholder="$t('deviceWater.placeholderSelectWaterType')" style="width: 100%">
                <el-option v-for="item in meterBindTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('deviceWater.labelAccessChannel')">
              <el-select v-model="editForm.waterType" clearable :placeholder="$t('deviceWater.placeholderSelectChannel')" style="width: 100%">
                <el-option v-for="item in waterChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="$t('deviceWater.labelDeviceModel')" prop="waterModel">
              <el-input v-model="editForm.waterModel" :disabled="isWaterModel" :placeholder="$t('deviceWater.placeholderDeviceModel')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('deviceWater.labelValveSupport')">
              <el-select v-model="editForm.withSwitch" clearable :placeholder="$t('deviceWater.placeholderSelectValve')" style="width: 100%">
                <el-option v-for="item in withSwitchOptions" :key="String(item.value)" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12" v-if="editForm.waterType === 'YYWL_YY'">
            <el-form-item :label="$t('deviceWater.labelManufacturerNo')">
              <el-select v-model="editForm.mfrsNo" clearable :disabled="!!editForm.id" :placeholder="$t('deviceWater.placeholderManufacturer')"
                style="width: 100%">
                <el-option v-for="item in mfrsNoType" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="editForm.withSwitch">
            <el-form-item :label="$t('deviceWater.labelPayMode')">
              <el-select v-model="editForm.logicPayType" :placeholder="$t('deviceWater.placeholderSelectPayMode')" style="width: 100%" clearable>
                <el-option v-for="item in meterPayTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="editForm.id">
          <el-col :span="12">
            <el-form-item :label="$t('deviceWater.labelBillingPlan')">
              <el-select v-model="editForm.priceId" clearable :placeholder="$t('deviceWater.placeholderSelectBilling')" style="width: 100%">
                <el-option v-for="item in priceList" :key="item.id" :label="waterPriceOptionLabel(item)"
                  :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ $t('deviceWater.btnCancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave">
          {{ submitting ? $t('deviceWater.saving') : $t('deviceWater.btnConfirm') }}
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
} from '@/api/water'

import { waterPriceListPrice } from '@/api/waterPrice'
import WaterDetailDrawer from './watermeter/detail.vue'
import meterCardImg from '@/assets/images/sb.png'

import { mapGetters } from 'vuex'
import * as XLSX from 'xlsx'

export default {
  name: 'WaterManagement',
  components: {
    WaterDetailDrawer
  },
  data () {
    const getInitialViewMode = () => {
      try {
        const raw = window.localStorage.getItem('device.watermeter.viewMode')
        if (raw === 'list' || raw === 'card') return raw
      } catch (e) {}
      return 'card'
    }
    return {
      tableHeightConfig: {
        headerHeight: 48,
        rowHeight: 47,
        minHeight: 200,
        maxRows: 11,
        paginationHeight: 68
      },
      viewMode: getInitialViewMode(),
      sortOrder: 'default',
      meterCardImg,
      // 查询参数
      queryData: {
        bindType: null,
        waterName: '',
        serial: '',
        managerId: ''
      },
      // 搜索字段配置
      searchFields: {
        basic: [
          { prop: 'serial', label: '设备号', type: 'input' },
          { prop: 'waterName', label: '水表名称', type: 'input' },
          { prop: 'bindType', label: '水表类型', type: 'select' }
        ],
        advanced: []
      },
      // 表格数据
      rawTableRows: [],
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
        total: 0
      },
      // 选中的数据
      selectedData: [],
      // 编辑弹窗
      dialogVisible: false,
      // 编辑表单
      editForm: {
        id: '',
        serial: '',
        waterName: '',
        bindType: '',
        managerId: '',
        withSwitch: false,
        waterType: '',
        mfrsNo: '',
        logicPayType: '',
        waterModel: '',
        priceId: ''
      },
      // 厂家号选项
      mfrsNoType: [{ value: '4', label: '4' }],
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
      }
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    kztMenuNos () {
      const list = this.$store.getters.kztMenuNos
      return Array.isArray(list) ? list : []
    },
    hasKztPermission () {
      const allow = new Set(this.kztMenuNos.map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    canAdd () {
      return this.hasKztPermission('630020')
    },
    canEdit () {
      return this.hasKztPermission('630021')
    },
    canView () {
      return this.hasKztPermission('630022')
    },
    /** 有编辑或查看权限均可打开详情（与操作栏展示一致） */
    canShowDetail () {
      return this.canView || this.canEdit
    },
    tableKey () {
      const t = (k) => this.$t(`deviceWater.${k}`)
      return [
        { label: t('colDeviceNo'), key: 'serial', width: '150', checked: true, disabled: true },
        { label: t('colWaterName'), key: 'waterName', width: '200', checked: true, disabled: true },
        { label: t('colBindInfo'), key: 'bindInfo', width: '300', checked: true },
        { label: t('colType'), key: 'bindTypeLabel', checked: true, width: '100', isTag: true },
        { label: t('colValveSupport'), key: 'withSwitch', width: '100', checked: true, isTag: true },
        { label: t('colPayMode'), checked: true, key: 'logicPayTypeLabel', width: '100', isTag: true },
        { label: t('colValveStatus'), checked: true, key: 'switchStatusLabel', width: '120', isTag: true },
        { label: t('colUpdateTime'), key: 'updateTime', width: '160', checked: true },
        { label: t('colCreateTime'), key: 'createTime', width: '160', checked: true }
      ]
    },
    editFormRules () {
      return {
        waterName: [{ required: true, message: this.$t('deviceWater.ruleWaterName'), trigger: 'blur' }],
        serial: [{ required: true, message: this.$t('deviceWater.ruleSerial'), trigger: 'blur' }],
        waterModel: [{ required: true, message: this.$t('deviceWater.ruleModel'), trigger: 'blur' }],
        bindType: [{ required: true, message: this.$t('deviceWater.ruleBindType'), trigger: 'change' }]
      }
    },
    meterBindTypeOptions () {
      return [
        { value: 1, label: this.$t('deviceWater.bindTypeDedicated') },
        { value: 2, label: this.$t('deviceWater.bindTypePublic') },
        { value: 3, label: this.$t('deviceWater.bindTypeFormula') }
      ]
    },
    meterPayTypeOptions () {
      return [
        { value: 0, label: this.$t('deviceWater.prepaid') },
        { value: 1, label: this.$t('deviceWater.prepaidStrong') }
      ]
    },
    withSwitchOptions () {
      return [
        { value: true, label: this.$t('deviceWater.switchSupportYes') },
        { value: false, label: this.$t('deviceWater.switchSupportNo') }
      ]
    },
    waterChannelOptions () {
      return [{ value: 'ZHWL_NS', label: this.$t('deviceWater.channelNs') }]
    },
    dataLength () {
      return this.tableData.length
    },
    // 计算需要显示的列
    displayColumns () {
      return this.tableKey.filter((col) => col.checked !== false)
    },
    // 判断是否需要显示高级筛选按钮
    needAdvancedSearch () {
      const totalFields = this.searchFields.basic.length + this.searchFields.advanced.length
      return totalFields > 5
    },
    // 获取实际显示的基础搜索字段
    displayBasicFields () {
      if (!this.needAdvancedSearch) {
        return [...this.searchFields.basic, ...this.searchFields.advanced]
      }
      return this.searchFields.basic
    },
    // 获取高级搜索字段
    displayAdvancedFields () {
      return this.searchFields.advanced
    },
    tableMaxHeight () {
      return (
        this.tableHeightConfig.headerHeight +
        this.tableHeightConfig.maxRows * this.tableHeightConfig.rowHeight
      )
    }
  },
  watch: {
    currentManagerId: {
      handler (newVal) {
        if (newVal) {
          this.queryData.managerId = newVal
          this.fetchTableData()
          this.getPriceList()
        }
      },
      immediate: true
    },
    viewMode (val) {
      try {
        window.localStorage.setItem('device.watermeter.viewMode', val)
      } catch (e) {}
      if (val !== 'list') this.selectedData = []
    },
    '$i18n.locale' () {
      if (!this.rawTableRows) return
      this.tableData = this.formatTableData(this.rawTableRows)
    }
  },
  mounted () {
  },

  methods: {
    /** 卡片视图 v-for 的 key，避免 id/serial 重复或缺失导致 DOM 复用错位 */
    waterCardRowKey (row, index) {
      if (row && row.id != null && row.id !== '') return `id-${row.id}`
      if (row && row.serial != null && row.serial !== '') return `s-${row.serial}`
      return `i-${index}`
    },

    // 获取水表列表数据
    async fetchTableData () {
      if (!this.queryData.managerId) return
      this.loading = true
      try {
        const keyword = (this.queryData.serial || '').trim()
        const isSerialKeyword = /^\d+$/.test(keyword)
        const normalizeSelect = (v) => {
          if (v === null || v === undefined) return ''
          if (v === '__ALL__') return ''
          return v
        }

        const params = {
          bindType: normalizeSelect(this.queryData.bindType),
          waterName: keyword && !isSerialKeyword ? keyword : '',
          serial: keyword && isSerialKeyword ? keyword : '',
          managerId: this.queryData.managerId,
          page: {
            size: this.pageData.size,
            current: this.pageData.current
          }
        }

        const response = await waterPageWater(params)

        if (response.code === 200 && response.data) {
          this.rawTableRows = response.data.dataList || []
          this.tableData = this.formatTableData(this.rawTableRows)
          this.pageData.total = response.data.total || 0
          this.pageData.current = response.data.current || 1
        } else {
          this.$message.error(response.msg || this.$t('deviceWater.errFetchList'))
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('deviceWater.errFetchWater'))
        console.error('获取水表数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 格式化表格数据
    formatTableData (data) {
      return data.map((item) => {
        const bindTypeLabel = this.formatWaterBindTypeLabel(item.bindType)
        const logicPayTypeLabel = this.formatWaterPayTypeLabel(item.logicPayType)
        const switchStatusLabel = this.formatWaterValveStatusLabel(item.switchStatus)
        return {
          ...item,
          bindTypeLabel,
          logicPayTypeLabel,
          switchStatusLabel
        }
      })
    },

    formatWaterBindTypeLabel (v) {
      const m = { 1: 'bindTypeDedicated', 2: 'bindTypePublic', 3: 'bindTypeFormula' }
      const k = m[Number(v)]
      return k ? this.$t(`deviceWater.${k}`) : '-'
    },

    formatWaterPayTypeLabel (v) {
      if (v === 0 || v === '0') return this.$t('deviceWater.prepaid')
      if (v === 1 || v === '1') return this.$t('deviceWater.prepaidStrong')
      return '-'
    },

    formatWaterValveStatusLabel (v) {
      if (v === 1 || v === '1') return this.$t('deviceWater.valveOpen')
      if (v === 0 || v === '0') return this.$t('deviceWater.valveClose')
      return '-'
    },

    displayWaterBindLine (dto) {
      if (!dto || dto.bindId == null) return '-'
      const id = dto.bindId
      const name = dto.bindName || ''
      if (this.$i18n.locale === 'zh-CN') return `${id}(${name})`
      return `${id}(${this.$displayBizHybrid(name, 48)})`
    },

    waterBindLineTitle (dto) {
      if (!dto || dto.bindId == null) return ''
      return `${dto.bindId}(${dto.bindName || ''})`
    },

    waterPriceOptionLabel (item) {
      if (!item) return ''
      return this.$t('deviceWater.priceOptionLabel', { name: item.name, price: item.price })
    },

    formatExportCell (row, key) {
      if (key === 'withSwitch') {
        return row.withSwitch ? this.$t('deviceWater.supportShort') : this.$t('deviceWater.notSupportShort')
      }
      if (key === 'bindInfo') {
        const list = row.waterBindDtoList
        if (!list || !list[0]) return ''
        const b = list[0]
        if (this.$i18n.locale === 'zh-CN') return `${b.bindId}(${b.bindName || ''})`
        return `${b.bindId}(${this.$displayBizHybrid(b.bindName, 200)})`
      }
      if (key === 'waterName') {
        if (this.$i18n.locale === 'zh-CN') return row.waterName || ''
        return this.$displayDynamicName(row.waterName, 200)
      }
      return row[key] || ''
    },

    // 获取水价方案列表
    async getPriceList () {
      try {
        const response = await waterPriceListPrice({
          managerId: this.queryData.managerId
        })
        if (response.code === 200 && response.data) {
          this.priceList = response.data || []
        } else {
          this.$message.error(response.msg || this.$t('deviceWater.errPriceList'))
          this.priceList = []
        }
      } catch (error) {
        console.error('获取水价方案失败:', error)
        this.$apiError.notify(error, this.$t('deviceWater.errPriceList'))
        this.priceList = []
      }
    },

    // 查询
    handleSearch () {
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 重置
    handleReset () {
      this.queryData = {
        bindType: null,
        waterName: '',
        serial: '',
        managerId: this.currentManagerId || ''
      }
      this.showAdvanced = false
      this.handleSearch()
    },

    // 处理顶部下拉命令
    handleCommand (command) {
      switch (command) {
        case 'export':
          if (!this.canView) return
          this.handleExport()
          break
        case 'import':
          this.$message.info(this.$t('deviceWater.importTodo'))
          break
        case 'batch':
          this.$message.info(this.$t('deviceWater.batchTodo'))
          break
      }
    },

    // 新增水表
    handleAdd () {
      if (!this.canAdd) return
      this.editForm = {
        id: '',
        serial: '',
        waterName: '',
        bindType: '',
        managerId: this.currentManagerId || '',
        withSwitch: false,
        waterType: '',
        mfrsNo: '',
        logicPayType: '',
        waterModel: '',
        priceId: ''
      }
      this.isWaterModel = false
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate()
      })
    },

    // 编辑水表
    handleEdit (row) {
      if (!this.canEdit) return
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
        priceId: row.priceId
      }
      this.isWaterModel = !!(row.waterModel !== '' && row.waterModel !== null)
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate()
      })
    },

    // 保存
    async handleSave () {
      this.$refs.editForm.validate(async (valid) => {
        if (valid) {
          this.submitting = true
          try {
            let response
            if (this.editForm.id) {
              // 编辑
              response = await waterUpdateWater(this.editForm)
            } else {
              // 新增
              response = await waterAddMeter(this.editForm)
            }

            if (response.code === 200) {
              this.$message.success(this.editForm.id ? this.$t('deviceWater.successSaveUpdate') : this.$t('deviceWater.successSaveAdd'))
              this.dialogVisible = false
              this.fetchTableData()
            } else {
              this.$message.error(response.msg || this.$t('deviceWater.errOperation'))
            }
          } catch (error) {
            this.$apiError.notify(error, this.$t('deviceWater.errOperation'))
            console.error('保存失败:', error)
          } finally {
            this.submitting = false
          }
        }
      })
    },

    // 查看详情
    handleDetail (row) {
      if (!this.canShowDetail) return
      this.detailDrawer = {
        visible: true,
        waterId: row.id,
        serial: row.serial,
        rowData: row
      }
    },

    handleCardClick (row) {
      if (!this.canShowDetail) return
      this.handleDetail(row)
    },

    // 复制序列号
    handleCopySerial (serial) {
      if (!serial || serial === '-') {
        this.$message.warning(this.$t('deviceWater.warnNothingToCopy'))
        return
      }

      // 创建临时输入框
      const input = document.createElement('input')
      input.value = serial
      document.body.appendChild(input)
      input.select()

      try {
        document.execCommand('copy')
        this.$message.success(this.$t('deviceWater.successSerialCopied'))
      } catch (err) {
        this.$apiError.notify(err, this.$t('deviceWater.errCopy'))
      }

      document.body.removeChild(input)
    },

    // 绑定信息点击 - 跳转到租户详情
    handleBindClick (row) {
      if (!row.waterBindDtoList || row.waterBindDtoList.length === 0) {
        this.$message.warning(this.$t('deviceWater.warnNotBound'))
        return
      }

      const bindId = row.waterBindDtoList[0].bindId
      if (!bindId) {
        this.$message.warning(this.$t('deviceWater.warnTenantIdMissing'))
        return
      }

      // 如果是公摊表(bindType=2)，跳转到公摊详情页
      if (row.bindType == 2) {
        this.$router.push({
          path: '/metering/fee/watermeterSharing/detail',
          query: {
            id: bindId
          }
        })
        return
      }

      // 跳转到租户详情页
      this.$router.push({
        path: `/metering/tenant/detail/${bindId}`
      })
    },

    // 导出数据
    handleExport () {
      if (this.tableData.length === 0) {
        this.$message.warning(this.$t('deviceWater.warnNoExportData'))
        return
      }

      try {
        const exportData = this.selectedData.length > 0 ? this.selectedData : this.tableData

        // 获取表头和对应的key（只导出当前显示列）
        const headers = this.displayColumns.map(col => col.label)
        const keys = this.displayColumns.map(col => col.key)

        // 构建数据
        const data = exportData.map(row => {
          return keys.map(key => this.formatExportCell(row, key))
        })

        // 组合表头 + 数据
        const wsData = [headers, ...data]

        // 创建工作表
        const ws = XLSX.utils.aoa_to_sheet(wsData)

        // 列宽
        ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length * 2, 15) }))

        // 创建工作簿并追加
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, this.$t('deviceWater.exportSheetName'))

        // 文件名
        const fileName = this.generateFileName()

        // 导出
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([wbout], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        const msgKey = this.selectedData.length > 0 ? 'deviceWater.successExportedSelection' : 'deviceWater.successExported'
        this.$message.success(this.$t(msgKey, { count: exportData.length }))
      } catch (error) {
        console.error('导出失败:', error)
        this.$apiError.notify(error, this.$t('deviceWater.errExport'))
      }
    },

    generateFileName () {
      const now = new Date()
      const timeStr =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        '_' +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0')
      return `${this.$t('deviceWater.exportFilePrefix')}_${timeStr}.xlsx`
    },

    // 选择变化
    handleSelectionChange (selection) {
      this.selectedData = selection
    },

    // 分页大小变化
    handleSizeChange (val) {
      this.pageData.size = val
      this.pageData.current = 1
      this.fetchTableData()
    },

    // 当前页变化
    handleCurrentChange (val) {
      this.pageData.current = val
      this.fetchTableData()
    }
  }
}
</script>

<style lang="scss" scoped>
.table-page-container {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.search-box {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.search-form {
  margin: 0;

  .search-main-grid {
    width: 100%;
    display: grid;
    align-items: center;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto minmax(0, 1fr) minmax(0, 1fr);
    gap: 10px;
  }

  .field-item {
    width: 100%;
    min-width: 0;

    ::v-deep .el-input,
    ::v-deep .el-select {
      width: 100%;
      display: block;
    }

    ::v-deep .el-input__inner,
    ::v-deep .el-select .el-input__inner {
      height: 32px;
      line-height: 32px;
      border-radius: 6px;
      border-color: #e4e7ed;
      font-size: 13px;
    }
  }

  .field-keyword {
    grid-column: 1;
  }

  .field-type {
    grid-column: 2;
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
    grid-column: 3;
    justify-self: start;
    line-height: 1;

    ::v-deep .el-button + .el-button {
      margin-left: 0 !important;
    }

    ::v-deep .el-button {
      height: 32px;
      padding: 0 14px;
      font-size: 13px;
      border-radius: 6px;
    }

    ::v-deep .el-button--primary {
      background: #1677ff;
      border-color: #1677ff;
    }

    ::v-deep .el-button--success {
      background: #52c41a;
      border-color: #52c41a;
    }
  }

}

.content-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  flex: 1;
  padding: 16px 16px 10px;
}

.content-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 8px;

  .section-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #111827;
  }

  .title-bar {
    width: 3px;
    height: 16px;
    background: #1677ff;
    border-radius: 2px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 16px;

    ::v-deep .el-button--primary {
      background: #1677ff;
      border-color: #1677ff;
      height: 32px;
      padding: 0 14px;
      font-size: 13px;
      border-radius: 6px;

      &:hover {
        background: #4096ff;
        border-color: #4096ff;
      }
    }

    ::v-deep .el-select .el-input__inner {
      height: 32px;
      line-height: 32px;
      font-size: 13px;
      border-radius: 6px;
      border-color: #e4e7ed;
    }

    .view-switch-group {
      ::v-deep .el-radio-group {
        .el-radio-button__inner {
          height: 32px;
          line-height: 32px;
          padding: 0 12px;
          font-size: 13px;
        }
      }
    }
  }
}

.list-view {
  padding: 0;

  .table-toolbar {
    padding: 10px 0;
  }
}

.selection-info {
  font-size: 13px;
  color: #606266;

  .count {
    color: #1677ff;
    font-weight: 600;
  }
}

.card-view {
  padding: 0;

  /* 与列表区 .light-border-table { margin-top: 8px } 对齐：工具栏 pb 8px + 下方 8px = 16px，对齐 content-box 顶部 16px */
  > div {
    margin-top: 8px;
  }
}

.device-card-grid--css {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  align-content: start;
}

@media (max-width: 1199px) {
  .device-card-grid--css {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 991px) {
  .device-card-grid--css {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .device-card-grid--css {
    grid-template-columns: minmax(0, 1fr);
  }
}

.light-border-table {
  margin-top: 8px;

  ::v-deep {
    border: 1px solid #f0f0f0 !important;

    .el-table__header-wrapper th {
      border-right: 1px solid #f0f0f0 !important;
      border-bottom: 1px solid #f0f0f0 !important;
    }

    td {
      border-right: 1px solid #f5f5f5 !important;
      border-bottom: 1px solid #f5f5f5 !important;
    }

    .el-table__body tr.el-table__row--striped > td {
      background: #fcfdff !important;
    }

    .el-table--enable-row-hover .el-table__body tr:hover > td {
      background: #f2f8ff !important;
    }
  }
}

.operation-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  gap: 10px;

  .op-btn {
    padding: 0;
    margin: 0;
    font-size: 12px;
    line-height: 1;
    flex-shrink: 0;

    &.primary-btn {
      color: #1677ff;
    }
  }
}

.serial-copy {
  color: #374151;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;

  &:hover {
    color: #1677ff;
  }
}

.device-card {
  border-radius: 10px;
  border: 1px solid #e3eaf6;
  background: #fff;
  box-shadow: 0 10px 28px rgba(16, 24, 40, 0.08);
  transition: box-shadow 0.2s, border-color 0.2s;
  overflow: hidden;

  &:hover {
    border-color: #b9dbff;
    box-shadow: 0 10px 28px rgba(16, 24, 40, 0.08), inset 0 0 0 1px #b9dbff;
  }

  ::v-deep .el-card__body {
    padding: 14px;
  }

  &.is-clickable {
    cursor: pointer;
  }
}

.device-card-main {
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  gap: 12px;
}

.device-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  line-height: 22px;
  margin-bottom: 8px;

  ::v-deep .el-link--primary {
    color: #111827;
    font-weight: 700;
  }

  ::v-deep .el-link--primary:hover,
  ::v-deep .el-link--primary:focus {
    color: #111827;
  }
}

.device-card-tags {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.device-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kv {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.kv .k {
  color: #9ca3af;
  flex-shrink: 0;
  width: 62px;
}

.kv .v {
  color: #111827;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  // el-link 默认是行内元素，需强制参与省略号规则
  ::v-deep .el-link {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
  }
}

.device-card-left {
  flex: 0 1 auto;
  min-width: 0;
  max-width: calc(100% - 120px);
}

.device-card-right {
  width: 108px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: auto;
}

.device-card-img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  display: block;
}

.device-card-actions-bar {
  margin-top: 14px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: stretch;
}

.card-action {
  flex: 1;
  height: 40px;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
}

.card-action + .card-action {
  border-left: 1px solid #f1f5f9;
}

.text-muted {
  color: #c0c4cc;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 14px 0 4px;
}

.compact-pagination {
  ::v-deep .el-pagination {
    display: flex !important;
    align-items: center !important;
    font-size: 12px;

    // ← 就是这一行，单独把 total 的行高清掉
    .el-pagination__total {
      font-size: 12px;
      line-height: 1 !important;
      height: auto !important;
    }

    .el-pagination__sizes {
      line-height: 1 !important;
      height: auto !important;

      .el-input {
        width: 88px !important;
        min-width: 0 !important;
        vertical-align: middle;

        .el-input__inner {
          height: 24px;
          line-height: 24px;
          font-size: 12px;
          padding: 0 8px;
          box-sizing: border-box;
        }
      }
    }

    .btn-prev,
    .btn-next {
      min-width: 24px;
      height: 24px;
      line-height: 24px;
      font-size: 12px;
      padding: 0 6px;
    }

    .el-pager {
      line-height: 1 !important;
      height: auto !important;
      display: flex !important;
      align-items: center !important;

      li {
        min-width: 24px;
        height: 24px;
        line-height: 24px;
        font-size: 12px;
        padding: 0 6px;
      }
    }

    .el-pagination__jump {
      font-size: 12px;
      line-height: 1 !important;
      height: auto !important;

      .el-input .el-input__inner {
        height: 24px;
        line-height: 24px;
        font-size: 12px;
        padding: 0 4px;
        box-sizing: border-box;
      }
    }
  }
}
</style>
