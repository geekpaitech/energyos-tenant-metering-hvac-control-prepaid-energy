<template>
  <div class="table-page-container electricity-plan-page">
    <template v-if="canView">
      <div class="content-box">
        <div class="content-toolbar ep-page-toolbar">
          <div class="toolbar-left">
            <span class="section-title">
              <span class="title-bar" />
              {{ $t('electricityPlanPage.sectionTitle') }}
            </span>
          </div>
          <div class="toolbar-right">
            <el-button
              v-if="canAdd"
              type="primary"
              size="small"
              icon="el-icon-plus"
              @click="handleAdd"
            >
              {{ $t('electricityPlanPage.btnAddPlan') }}
            </el-button>
          </div>
        </div>

        <div class="list-view ep-list-view">
          <el-table
            :data="tableData"
            v-loading="loading"
            border
            stripe
            class="plan-fee-table light-border-table"
            style="width: 100%"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
            }"
          >
            <template slot="empty">
              <el-empty :description="$t('electricityPlanPage.emptyTable')" />
            </template>

            <el-table-column prop="id" :label="$t('electricityPlanPage.colPlanId')" width="100" align="left">
              <template slot-scope="scope">
                <span class="plan-id-cell">#{{ scope.row.id }}</span>
              </template>
            </el-table-column>

            <el-table-column
              prop="name"
              :label="$t('electricityPlanPage.colPlanName')"
              min-width="160"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                {{ $displayBizHybrid(scope.row.name || '') || '-' }}
              </template>
            </el-table-column>

            <el-table-column :label="$t('electricityPlanPage.colPeak')" width="130" align="right">
              <template slot-scope="scope">
                <span class="price-cell price-peak">{{ formatPrice(scope.row.powerPeakPrice) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('electricityPlanPage.colTop')" width="130" align="right">
              <template slot-scope="scope">
                <span class="price-cell price-top">{{ formatPrice(scope.row.powerTopPrice) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('electricityPlanPage.colFlat')" width="130" align="right">
              <template slot-scope="scope">
                <span class="price-cell price-flat">{{ formatPrice(scope.row.powerFlatPrice) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('electricityPlanPage.colValley')" width="130" align="right">
              <template slot-scope="scope">
                <span class="price-cell price-valley">{{ formatPrice(scope.row.powerValleyPrice) }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="$t('electricityPlanPage.colUpdated')" width="170" align="left">
              <template slot-scope="scope">
                <span class="plan-time-cell">{{ formatTime(scope.row.updateTime) }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="$t('electricityPlanPage.colAction')" min-width="268" width="268" fixed="right" align="center">
              <template slot-scope="scope">
                <div v-if="canOperate" class="plan-action-group">
                  <button
                    v-if="canAdjust"
                    type="button"
                    class="action-link"
                    @click="handleEdit(scope.row)"
                  >
                    {{ $t('electricityPlanPage.btnAdjustPrice') }}
                  </button>
                  <button
                    v-if="canLog"
                    type="button"
                    class="action-link"
                    @click="handleViewLog(scope.row)"
                  >
                    {{ $t('electricityPlanPage.btnLog') }}
                  </button>
                  <button
                    v-if="canBatchBind"
                    type="button"
                    class="action-link"
                    @click="handleBatchBind(scope.row)"
                  >
                    {{ $t('electricityPlanPage.btnBatchBind') }}
                  </button>
                  <span v-if="!canAdjust && !canLog && !canBatchBind">-</span>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div v-if="dialogVisible" class="modal-overlay" @click.self="closeDialog">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">{{ isEdit ? $t('electricityPlanPage.modalTitleEdit') : $t('electricityPlanPage.modalTitleAdd') }}</h2>
            <button class="modal-close" @click="closeDialog">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">{{ $t('electricityPlanPage.formPlanName') }}</label>
              <input
                v-model="formData.name"
                type="text"
                class="form-input"
                :placeholder="$t('electricityPlanPage.phPlanName')"
                :disabled="isEdit"
              >
            </div>

            <div class="price-grid">
              <div class="form-group">
                <label class="form-label">
                  <span class="price-dot peak"></span>
                  {{ $t('electricityPlanPage.labelPeak') }}
                </label>
                <div class="input-group">
                  <input
                    v-model="formData.powerPeakPrice"
                    type="text"
                    class="form-input"
                    placeholder="0.00"
                    @input="limitInput($event.target.value, 'powerPeakPrice')"
                  >
                  <span class="input-suffix">{{ $t('electricityPlanPage.unitPerKwh') }}</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <span class="price-dot top"></span>
                  {{ $t('electricityPlanPage.labelTop') }}
                </label>
                <div class="input-group">
                  <input
                    v-model="formData.powerTopPrice"
                    type="text"
                    class="form-input"
                    placeholder="0.00"
                    @input="limitInput($event.target.value, 'powerTopPrice')"
                  >
                  <span class="input-suffix">{{ $t('electricityPlanPage.unitPerKwh') }}</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <span class="price-dot flat"></span>
                  {{ $t('electricityPlanPage.labelFlat') }}
                </label>
                <div class="input-group">
                  <input
                    v-model="formData.powerFlatPrice"
                    type="text"
                    class="form-input"
                    placeholder="0.00"
                    @input="limitInput($event.target.value, 'powerFlatPrice')"
                  >
                  <span class="input-suffix">{{ $t('electricityPlanPage.unitPerKwh') }}</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <span class="price-dot valley"></span>
                  {{ $t('electricityPlanPage.labelValley') }}
                </label>
                <div class="input-group">
                  <input
                    v-model="formData.powerValleyPrice"
                    type="text"
                    class="form-input"
                    placeholder="0.00"
                    @input="limitInput($event.target.value, 'powerValleyPrice')"
                  >
                  <span class="input-suffix">{{ $t('electricityPlanPage.unitPerKwh') }}</span>
                </div>
              </div>
            </div>

            <div v-if="isEdit" class="verification-section">
              <div class="warning-text">
                {{ $t('electricityPlanPage.warnEditAffectsMeters') }}
              </div>

              <div class="form-group">
                <label class="form-label">{{ $t('electricityPlanPage.labelEnableRule') }}</label>
                <select v-model="formData.enableMode" class="form-input">
                  <option v-for="opt in enableModeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <div v-if="Number(formData.enableMode) === 2" class="form-group">
                <label class="form-label">{{ $t('electricityPlanPage.labelActivationDate') }}</label>
                <el-date-picker
                  v-model="formData.activationDate"
                  type="date"
                  format="yyyy/MM/dd"
                  value-format="yyyy-MM-dd"
                  :placeholder="$t('electricityPlanPage.phActivationDate')"
                  class="activation-date-picker"
                />
              </div>

              <div class="form-group">
                <label class="form-label">{{ $t('electricityPlanPage.labelPhoneBound') }}</label>
                <div class="phone-display">{{ codePhone }}</div>
              </div>

              <div class="form-group">
                <label class="form-label">{{ $t('electricityPlanPage.labelVerifyCode') }}</label>
                <div class="input-group">
                  <input
                    v-model="formData.code"
                    type="text"
                    class="form-input"
                    :placeholder="$t('electricityPlanPage.phVerifyCode')"
                  >
                  <button
                    type="button"
                    class="code-btn"
                    :disabled="codeCountdown > 0"
                    @click="getAuthSendSmsCode"
                  >
                    {{ codeCountdown > 0 ? $t('electricityPlanPage.resendIn', { n: codeCountdown }) : $t('electricityPlanPage.sendCode') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeDialog">{{ $t('electricityPlanPage.btnCancel') }}</button>
            <button class="btn-confirm" @click="handleSubmit">{{ $t('electricityPlanPage.btnConfirm') }}</button>
          </div>
        </div>
      </div>

      <transition name="slide">
        <div v-if="bindDrawerVisible" class="drawer-overlay" @click.self="closeBind">
          <div class="drawer-container">
            <div class="drawer-header">
              <h2 class="drawer-title">{{ $t('electricityPlanPage.drawerBatchBindTitle') }}</h2>
              <button class="drawer-close" @click="closeBind">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <div class="drawer-tabs">
              <button
                class="tab-item"
                :class="{ active: activeTab === 0 }"
                @click="switchTab(0)"
              >
                {{ $t('electricityPlanPage.tabDedicated') }}
              </button>
              <button
                class="tab-item"
                :class="{ active: activeTab === 1 }"
                @click="switchTab(1)"
              >
                {{ $t('electricityPlanPage.tabShare') }}
              </button>
              <button
                class="tab-item"
                :class="{ active: activeTab === 2 }"
                @click="switchTab(2)"
              >
                {{ $t('electricityPlanPage.tabAir') }}
              </button>
            </div>

            <div class="drawer-body">
              <div class="tree-search">
                <input
                  v-model="treeFilter"
                  type="text"
                  class="tree-search-input"
                  :placeholder="$t('electricityPlanPage.phSearchMeter')"
                >
              </div>

              <div class="tree-container">
                <div class="tree-node root">
                  <label class="tree-checkbox">
                    <input
                      type="checkbox"
                      :checked="checkAllStatus"
                      @change="handleCheckAll"
                    >
                    <span class="checkbox-icon"></span>
                    <span class="tree-label">{{ $t('electricityPlanPage.selectAll') }}</span>
                  </label>
                </div>

                <div
                  v-for="group in filteredTreeData"
                  :key="group.id"
                  class="tree-group"
                >
                  <div class="tree-node parent-node">
                    <div class="parent-row">
                      <span
                        class="expand-btn"
                        @click="toggleExpand(group.id)"
                      >
                        {{ group.expanded ? '▼' : '▶' }}
                      </span>

                      <label class="tree-checkbox parent-checkbox">
                        <input
                          type="checkbox"
                          :checked="isGroupChecked(group)"
                          @change="handleGroupCheck(group, $event)"
                        >
                        <span class="checkbox-icon"></span>
                        <span class="tree-label parent-label">
                          {{ groupDisplayName(group) }}({{ tabGroupLabel }})
                        </span>
                      </label>
                    </div>
                  </div>

                  <div v-if="group.expanded" class="tree-children">
                    <div
                      v-for="meter in group.children"
                      :key="meter.meterId"
                      class="tree-node child-node"
                      v-show="!treeFilter || meter.meterName.includes(treeFilter)"
                    >
                      <label class="tree-checkbox child-checkbox">
                        <span class="expand-placeholder"></span>
                        <input
                          type="checkbox"
                          :checked="selectedMeterIds.includes(meter.meterId)"
                          :disabled="meter.disabled"
                          @change="handleMeterCheck(meter)"
                        >
                        <span class="checkbox-icon"></span>
                        <span class="tree-label">{{ $displayBizHybrid(meter.meterName || '') }}</span>
                        <span v-if="meter.disabled" class="bound-tag">{{ $t('electricityPlanPage.tagBound') }}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div v-if="filteredTreeData.length === 0" class="empty-tree">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" stroke="#E5E7EB" stroke-width="2"/>
                  </svg>
                  <p>{{ treeFilter ? $t('electricityPlanPage.emptyTreeNoMatch') : $t('electricityPlanPage.emptyTreeNoData') }}</p>
                </div>
              </div>
            </div>

            <div class="drawer-footer">
              <div class="selected-info">
                {{ $t('electricityPlanPage.selectedMeters', { count: selectedMeterIds.length }) }}
              </div>
              <button v-if="canBatchBind" class="btn-confirm" @click="handleBindSubmit">{{ $t('electricityPlanPage.btnConfirmBind') }}</button>
              <span v-else>-</span>
            </div>
          </div>
        </div>
      </transition>

      <div v-if="logDialogVisible" class="modal-overlay" @click.self="closeLogDialog">
        <div class="modal-container large">
          <div class="modal-header">
            <h2 class="modal-title">{{ $t('electricityPlanPage.logTitle') }}</h2>
            <button class="modal-close" @click="closeLogDialog">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body" v-loading="logLoading">
            <div v-if="logList.length === 0 && !logLoading" class="empty-log">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" stroke="#E5E7EB" stroke-width="2"/>
              </svg>
              <p>{{ $t('electricityPlanPage.emptyLog') }}</p>
            </div>

            <div v-else class="log-list">
              <el-table :data="logList" border height="50vh" style="width: 100%;">
                <el-table-column prop="meterPriceName" :label="$t('electricityPlanPage.logColPlanName')" min-width="180">
                  <template slot-scope="scope">
                    {{ $displayBizHybrid(scope.row.meterPriceName || '') || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="powerPeakPrice" :label="$t('electricityPlanPage.logColPeak')" width="140" />
                <el-table-column prop="powerTopPrice" :label="$t('electricityPlanPage.logColTop')" width="140" />
                <el-table-column prop="powerFlatPrice" :label="$t('electricityPlanPage.logColFlat')" width="140" />
                <el-table-column prop="powerValleyPrice" :label="$t('electricityPlanPage.logColValley')" width="140" />
                <el-table-column :label="$t('electricityPlanPage.logColEnableRule')" width="140">
                  <template slot-scope="scope">
                    {{ enableModeLabel(scope.row.enableMode) }}
                  </template>
                </el-table-column>
                <el-table-column :label="$t('electricityPlanPage.logColEnableStatus')" width="140">
                  <template slot-scope="scope">
                    {{ enableStatusLabel(scope.row.enableStatus) }}
                  </template>
                </el-table-column>
                <el-table-column :label="$t('electricityPlanPage.logColScheduledTime')" width="180">
                  <template slot-scope="scope">
                    {{ formatActivationDate(scope.row.activationDate) }}
                  </template>
                </el-table-column>
                <el-table-column prop="executeTime" :label="$t('electricityPlanPage.logColExecutedTime')" width="160" />
                <el-table-column prop="occurTime" :label="$t('electricityPlanPage.logColCreated')" width="180" />
                <el-table-column prop="optUserPhone" :label="$t('electricityPlanPage.logColOperator')" width="140" />
                <el-table-column :label="$t('electricityPlanPage.logColAction')" width="90" fixed="right">
                  <template slot-scope="scope">
                    <el-button
                      type="text"
                      size="mini"
                      :disabled="!canWithdraw(scope.row)"
                      @click="handleWithdrawLog(scope.row)"
                    >{{ $t('electricityPlanPage.btnWithdraw') }}</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </div>
    </template>
    <el-empty v-else :description="$t('electricityPlanPage.emptyNoPermission')" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  meterPriceAdd,
  meterPriceChangeEnableStatus,
  meterPriceList,
  meterPriceUpdate,
  meterPriceQueryPriceMeterEdit,
  meterPriceBatchBindPriceMeter,
  authSendSmsCode
} from '@/api/meterPrice'
import { meterPriceLogPageMeterPriceLog, meterPriceLogWithdraw } from '@/api/meterPriceLog'

export default {
  name: 'ElectricityPlan',
  data () {
    return {
      loading: false,
      tableData: [],

      // 编辑弹窗
      dialogVisible: false,
      isEdit: false,
      formData: {
        id: '',
        name: '',
        code: '',
        phone: '',
        managerId: '',
        powerPeakPrice: '',
        powerTopPrice: '',
        powerFlatPrice: '',
        powerValleyPrice: '',
        priceType: 1,
        enableMode: 1,
        activationDate: ''
      },

      codePhone: '',

      // 验证码倒计时（0 表示可点击发送）
      codeCountdown: 0,
      codeTimer: null,

      // 批量绑定 - 树形结构
      bindDrawerVisible: false,
      activeTab: 0,
      treeFilter: '',
      selectedMeterIds: [],
      privateMeterList: [],
      shareMeterList: [],
      airMeterList: [],
      currentPriceId: null,
      treeData: [], // 树形结构数据
      rawMeterData: null,

      // 调价日志
      logDialogVisible: false,
      logList: [],
      logLoading: false

    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    enableModeOptions () {
      return [
        { value: 1, label: this.$t('electricityPlanPage.enableModeImmediate') },
        { value: 2, label: this.$t('electricityPlanPage.enableModeScheduled') }
      ]
    },
    enableModeLabel () {
      const map = new Map(this.enableModeOptions.map(x => [Number(x.value), x.label]))
      return (val) => map.get(Number(val)) || '-'
    },
    enableStatusLabel () {
      const map = new Map([
        [1, this.$t('electricityPlanPage.enableStatusActive')],
        [2, this.$t('electricityPlanPage.enableStatusPending')],
        [9, this.$t('electricityPlanPage.enableStatusDiscarded')]
      ])
      return (val) => map.get(Number(val)) || '-'
    },
    canWithdraw () {
      return (row) => {
        if (!row) return false
        const enableMode = Number(row.enableMode)
        const enableStatus = Number(row.enableStatus)
        const executeTime = row.executeTime

        // 仅允许撤回：定时启动 + 待启用 + 尚未实际执行
        return enableMode === 2 && enableStatus === 2 && !executeTime
      }
    },
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    canView () {
      return this.hasKztPermission('660051')
    },
    canOperate () {
      return this.hasKztPermission('660050')
    },
    canAdd () {
      return this.canOperate
    },
    canAdjust () {
      return this.canOperate
    },
    canLog () {
      return this.canOperate
    },
    canBatchBind () {
      return this.canOperate
    },

    // 从 store 获取用户手机号
    userPhone () {
      return this.$store.state.user.phone || ''
    },

    // 手机号掩码显示
    maskedPhone () {
      if (!this.userPhone) return ''
      return this.userPhone.substr(0, 3) + '****' + this.userPhone.substr(7)
    },

    // 过滤后的树形数据
    filteredTreeData () {
      if (!this.treeFilter) {
        return this.treeData
      }

      return this.treeData.map(group => ({
        ...group,
        children: group.children.filter(meter =>
          meter.meterName.includes(this.treeFilter)
        )
      })).filter(group => group.children.length > 0)
    },

    // 全选状态检查
    checkAllStatus () {
      const availableMeters = this.getAllAvailableMeters()
      if (availableMeters.length === 0) return false
      return availableMeters.every(m => this.selectedMeterIds.includes(m.meterId))
    },
    tabGroupLabel () {
      if (this.activeTab === 0) return this.$t('electricityPlanPage.tabGroupTenant')
      if (this.activeTab === 1) return this.$t('electricityPlanPage.tabGroupShare')
      return this.$t('electricityPlanPage.tabGroupAir')
    }
  },

  watch: {
    canView: {
      handler (val) {
        if (val && this.currentManagerId) {
          this.initData()
        }
      },
      immediate: true
    },
    currentManagerId: {
      handler (val) {
        if (val && this.canView) {
          this.initData()
        }
      },
      immediate: true
    }
  },

  methods: {
    async initData () {
      this.loadData()
    },

    groupDisplayName (group) {
      if (!group) return ''
      if (!group.name) {
        return this.activeTab === 2
          ? this.$t('electricityPlanPage.groupAirDefault')
          : this.$t('electricityPlanPage.groupUngrouped')
      }
      return this.$displayBizHybrid(String(group.name), 200)
    },

    async loadData () {
      if (!this.canView) return
      this.loading = true
      try {
        const { data } = await meterPriceList({
          managerId: this.currentManagerId,
          priceType: 1
        })
        this.tableData = data || []
      } catch (error) {
        this.$apiError.notify(error, this.$t('electricityPlanPage.msgLoadFail'))
      } finally {
        this.loading = false
      }
    },

    formatPrice (price) {
      if (price === '' || price === null || price === undefined) return '-'
      const num = Number(price)
      return Number.isFinite(num) ? `¥${num}` : '-'
    },

    formatTime (time) {
      if (!time) return '-'
      return time.replace('T', ' ').substring(0, 16)
    },

    handleAdd () {
      if (!this.canAdd) {
        this.$message.warning(this.$t('electricityPlanPage.msgNoAdd'))
        return
      }
      this.isEdit = false
      this.formData = {
        name: '',
        powerPeakPrice: '',
        powerTopPrice: '',
        powerFlatPrice: '',
        powerValleyPrice: '',
        managerId: this.currentManagerId,
        priceType: 1,
        enableMode: 1,
        activationDate: '',
        code: ''
      }
      this.dialogVisible = true
    },

    handleEdit (row) {
      if (!this.canAdjust) {
        this.$message.warning(this.$t('electricityPlanPage.msgNoOperate'))
        return
      }
      this.isEdit = true
      this.formData = {
        ...row,
        code: '',
        phone: this.userPhone,
        enableMode: row.enableMode || 1,
        activationDate: row.activationDate || ''
      }
      this.codePhone = this.maskedPhone
      this.dialogVisible = true
    },

    limitInput (val, field) {
      const reg = /^\d+(\.\d{0,4})?$/
      if (val === '' || reg.test(val)) {
        this.formData[field] = val
      } else {
        const match = val.match(/^\d+(\.\d{0,4})?/)
        this.formData[field] = match ? match[0] : ''
      }
    },

    async getAuthSendSmsCode () {
      if (this.codeCountdown > 0) return

      try {
        const { msg } = await authSendSmsCode({
          phone: this.userPhone,
          eventType: 'METER_PRICE_MODIFY'
        })
        this.$message.success(msg || this.$t('electricityPlanPage.msgSmsSent'))

        if (this.codeTimer) {
          clearInterval(this.codeTimer)
          this.codeTimer = null
        }
        this.codeCountdown = 60
        this.codeTimer = setInterval(() => {
          this.codeCountdown--
          if (this.codeCountdown <= 0) {
            clearInterval(this.codeTimer)
            this.codeTimer = null
            this.codeCountdown = 0
          }
        }, 1000)
      } catch (error) {
        this.$apiError.notify(error, this.$t('electricityPlanPage.msgSmsFail'))
      }
    },

    validateForm () {
      const { powerPeakPrice, powerTopPrice, powerFlatPrice, powerValleyPrice, name, enableMode, activationDate, code } = this.formData

      if (!name) {
        this.$message.warning(this.$t('electricityPlanPage.msgNameRequired'))
        return false
      }

      // 电价不可为0（参照 anjineng-ui-ebc）
      const prices = [powerPeakPrice, powerTopPrice, powerFlatPrice, powerValleyPrice].map(v => Number(v))
      if (prices.some(v => Number.isFinite(v) && v === 0)) {
        this.$message.warning(this.$t('electricityPlanPage.msgPriceZero'))
        return false
      }

      if (
        powerPeakPrice === '' || powerPeakPrice === null || powerPeakPrice === undefined ||
        powerTopPrice === '' || powerTopPrice === null || powerTopPrice === undefined ||
        powerFlatPrice === '' || powerFlatPrice === null || powerFlatPrice === undefined ||
        powerValleyPrice === '' || powerValleyPrice === null || powerValleyPrice === undefined
      ) {
        this.$message.warning(this.$t('electricityPlanPage.msgPriceIncomplete'))
        return false
      }

      if (this.isEdit) {
        if (!enableMode) {
          this.$message.warning(this.$t('electricityPlanPage.msgEnableRule'))
          return false
        }
        if (Number(enableMode) === 2 && !activationDate) {
          this.$message.warning(this.$t('electricityPlanPage.msgActivationDate'))
          return false
        }
        if (!code) {
          this.$message.warning(this.$t('electricityPlanPage.msgVerifyCode'))
          return false
        }
      }

      return true
    },

    async handleSubmit () {
      if (!this.canOperate) {
        this.$message.warning(this.$t('electricityPlanPage.msgNoOperate'))
        return
      }
      if (!this.validateForm()) return

      this.$confirm(
        this.isEdit ? this.$t('electricityPlanPage.confirmModifyPlan') : this.$t('electricityPlanPage.confirmAddPlan'),
        this.$t('electricityPlanPage.titleTip'),
        {
          confirmButtonText: this.$t('electricityPlanPage.btnOk'),
          cancelButtonText: this.$t('electricityPlanPage.btnCancel'),
          type: 'warning'
        }
      ).then(async () => {
        try {
          const api = this.isEdit ? meterPriceUpdate : meterPriceAdd
          const { msg } = await api(this.formData)
          this.$message.success(msg || this.$t('electricityPlanPage.msgOpOk'))
          this.closeDialog()
          this.loadData()
        } catch (error) {
          this.$message.error(error?.msg || error?.message || this.$t('electricityPlanPage.msgOpFail'))
        }
      }).catch(() => {})
    },

    closeDialog () {
      this.dialogVisible = false
      this.formData = {
        id: '',
        name: '',
        code: '',
        phone: '',
        managerId: '',
        powerPeakPrice: '',
        powerTopPrice: '',
        powerFlatPrice: '',
        powerValleyPrice: '',
        priceType: 1,
        enableMode: 1,
        activationDate: ''
      }
      this.codePhone = ''
      if (this.codeTimer) {
        clearInterval(this.codeTimer)
        this.codeTimer = null
      }
      this.codeCountdown = 0
    },

    async handleStatusChange (row) {
      if (!this.canOperate) {
        this.$message.warning(this.$t('electricityPlanPage.msgNoOperate'))
        return
      }
      try {
        const status = row.enableStatus === 1 ? 0 : 1
        const { msg } = await meterPriceChangeEnableStatus({
          id: row.id,
          enableStatus: status
        })
        this.$message.success(msg || this.$t('electricityPlanPage.msgOpOk'))
        this.loadData()
      } catch (error) {
        this.$apiError.notify(error, this.$t('electricityPlanPage.msgOpFail'))
      }
    },

    // ================ 树形结构批量绑定功能 ================

    async handleBatchBind (row) {
      if (!this.canBatchBind) {
        this.$message.warning(this.$t('electricityPlanPage.msgNoOperate'))
        return
      }
      this.currentPriceId = row.id
      this.bindDrawerVisible = true
      this.activeTab = 0
      this.selectedMeterIds = [] // 完全清空，不选中任何电表

      try {
        const { data } = await meterPriceQueryPriceMeterEdit({
          priceId: row.id
        })

        if (data) {
          this.rawMeterData = data
          // 保留原有的处理逻辑（用于其他功能）
          this.privateMeterList = (data.privateMeterList || []).map(item => ({
            ...item,
            disabled: item.priceId && item.priceId === row.id
          }))
          this.shareMeterList = (data.shareMeterList || []).map(item => ({
            ...item,
            disabled: item.priceId && item.priceId === row.id
          }))
          this.airMeterList = (data.airMeterList || []).map(item => ({
            ...item,
            disabled: item.priceId && item.priceId === row.id
          }))

          // 构建树形数据，确保不会自动选中任何电表
          this.buildTreeData(data)
        }
      } catch (error) {
        console.error('获取电表列表失败:', error)
        this.$apiError.notify(error, this.$t('electricityPlanPage.msgMeterListFail'))
      }
    },

    // 构建树形数据结构
    buildTreeData (data) {
      const currentList = this.activeTab === 0
        ? (data.privateMeterList || [])
        : (this.activeTab === 1 ? (data.shareMeterList || []) : (data.airMeterList || []))

      // 根据bindName分组
      const groupMap = new Map()

      currentList.forEach(meter => {
        const groupName = meter.bindName || null
        const groupId = meter.bindId || (this.activeTab === 2 ? 'air-unbound' : 'unbound')

        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, {
            id: groupId,
            name: groupName,
            children: [],
            expanded: true // 改为默认展开
          })
        }

        // 处理电表状态 - 只标记disabled，不自动选中
        const processedMeter = {
          ...meter,
          disabled: meter.priceId === this.currentPriceId
        }

        groupMap.get(groupId).children.push(processedMeter)
      })

      // 转换为数组
      this.treeData = Array.from(groupMap.values()).sort((a, b) => {
        const aDef = !a.name
        const bDef = !b.name
        if (aDef && !bDef) return 1
        if (!aDef && bDef) return -1
        return String(a.name || '').localeCompare(String(b.name || ''))
      })

      // 所有分组都已经默认展开，不需要额外处理
    },

    // 切换展开/收起 - 确保只改变展开状态，不触发任何选择逻辑
    toggleExpand (groupId) {
      const group = this.treeData.find(g => g.id === groupId)
      if (group) {
        // 只改变展开状态，不做任何其他操作
        this.$set(group, 'expanded', !group.expanded)
      }
    },

    // 检查分组是否全选 - 修复：只考虑可用的电表
    isGroupChecked (group) {
      const availableMeters = group.children.filter(m => !m.disabled)
      if (availableMeters.length === 0) return false
      return availableMeters.every(m => this.selectedMeterIds.includes(m.meterId))
    },

    // 处理分组选择 - 确保只在用户主动点击时才改变选择状态
    handleGroupCheck (group, event) {
      // 阻止事件冒泡
      event.stopPropagation()

      const checked = event.target.checked
      const availableMeters = group.children.filter(m => !m.disabled)

      if (checked) {
        // 选中该分组下所有可用电表
        const newIds = availableMeters.map(m => m.meterId)
        // 使用Set确保不重复添加
        const currentSet = new Set(this.selectedMeterIds)
        newIds.forEach(id => currentSet.add(id))
        this.selectedMeterIds = Array.from(currentSet)
      } else {
        // 取消选中该分组下所有电表
        const removeIds = availableMeters.map(m => m.meterId)
        this.selectedMeterIds = this.selectedMeterIds.filter(id => !removeIds.includes(id))
      }
    },

    // 处理单个电表选择
    handleMeterCheck (meter) {
      if (meter.disabled) return

      const index = this.selectedMeterIds.indexOf(meter.meterId)
      if (index > -1) {
        this.selectedMeterIds.splice(index, 1)
      } else {
        this.selectedMeterIds.push(meter.meterId)
      }
    },

    // 处理全选 - 修复逻辑
    handleCheckAll (event) {
      const checked = event.target.checked

      if (checked) {
        // 全选：只选中所有可用的电表，不包括禁用的
        const allAvailableIds = []
        this.treeData.forEach(group => {
          group.children.forEach(meter => {
            if (!meter.disabled) {
              allAvailableIds.push(meter.meterId)
            }
          })
        })
        this.selectedMeterIds = allAvailableIds
      } else {
        // 取消全选：清空所有选择
        this.selectedMeterIds = []
      }
    },

    // 获取所有可用电表
    getAllAvailableMeters () {
      return this.treeData.reduce((acc, group) => {
        return acc.concat(group.children.filter(m => !m.disabled))
      }, [])
    },

    // tab 切换
    switchTab (tabIndex) {
      this.activeTab = tabIndex
      this.treeFilter = ''
      this.selectedMeterIds = [] // 切换标签时清空选择

      if (this.rawMeterData) {
        // 重新构建树形数据，不自动选中任何电表
        this.buildTreeData(this.rawMeterData)
      }
    },

    // 确认绑定
    async handleBindSubmit () {
      if (!this.canBatchBind) {
        this.$message.warning(this.$t('electricityPlanPage.msgNoOperate'))
        return
      }
      if (this.selectedMeterIds.length === 0) {
        this.$message.warning(this.$t('electricityPlanPage.msgSelectMeters'))
        return
      }

      // 筛选出新增的电表（排除已经绑定的）
      const newMeterIds = this.selectedMeterIds.filter(id => {
        const meter = [...this.privateMeterList, ...this.shareMeterList, ...this.airMeterList].find(m => m.meterId === id)
        return meter && !meter.disabled
      })

      if (newMeterIds.length === 0) {
        this.$message.warning(this.$t('electricityPlanPage.msgSelectNewMeters'))
        return
      }

      this.$confirm(
        this.$t('electricityPlanPage.confirmBindMeters', { count: newMeterIds.length }),
        this.$t('electricityPlanPage.titleTip'),
        {
          confirmButtonText: this.$t('electricityPlanPage.btnOk'),
          cancelButtonText: this.$t('electricityPlanPage.btnCancel'),
          type: 'warning'
        }
      ).then(async () => {
        try {
          const { msg } = await meterPriceBatchBindPriceMeter({
            priceId: this.currentPriceId,
            meterIdList: newMeterIds
          })
          this.$message.success(msg || this.$t('electricityPlanPage.msgBindOk'))
          this.closeBind()
        } catch (error) {
          console.error('绑定失败:', error)
          this.$apiError.notify(error, this.$t('electricityPlanPage.msgBindFail'))
        }
      }).catch(() => {})
    },

    // 关闭抽屉
    closeBind () {
      this.bindDrawerVisible = false
      this.selectedMeterIds = []
      this.privateMeterList = []
      this.shareMeterList = []
      this.airMeterList = []
      this.treeFilter = ''
      this.treeData = []
      this.rawMeterData = null
    },

    // ================ 调价日志功能 ================

    async handleViewLog (row) {
      if (!this.canLog) {
        this.$message.warning(this.$t('electricityPlanPage.msgNoOperate'))
        return
      }
      this.logDialogVisible = true
      this.logLoading = true

      try {
        const { data } = await meterPriceLogPageMeterPriceLog({
          managerId: row.managerId || this.currentManagerId,
          meterPriceId: row.id,
          page: {
            current: 1,
            size: 30,
            searchCount: true,
            orders: [{ asc: false, column: 'occurTime' }]
          }
        })
        const list = data?.dataList || []
        this.logList = Array.isArray(list) ? list : []
      } catch (error) {
        console.error('获取日志失败:', error)
        this.$apiError.notify(error, this.$t('electricityPlanPage.msgLogFail'))
        this.logList = []
      } finally {
        this.logLoading = false
      }
    },

    async handleWithdrawLog (logRow) {
      if (!this.canOperate) {
        this.$message.warning(this.$t('electricityPlanPage.msgNoOperate'))
        return
      }
      if (!logRow) return
      if (!this.canWithdraw(logRow)) return

      this.$confirm(this.$t('electricityPlanPage.confirmWithdraw'), this.$t('electricityPlanPage.titleTip'), {
        confirmButtonText: this.$t('electricityPlanPage.btnOk'),
        cancelButtonText: this.$t('electricityPlanPage.btnCancel'),
        type: 'warning'
      }).then(async () => {
        try {
          const { msg } = await meterPriceLogWithdraw({
            managerId: logRow.managerId,
            id: logRow.rid
          })
          this.$message.success(msg || this.$t('electricityPlanPage.msgWithdrawOk'))
          // 刷新当前日志（保持弹窗打开）
          const currentPriceId = logRow.meterPriceId || this.currentPriceId
          if (currentPriceId) {
            this.handleViewLog({ id: currentPriceId, managerId: logRow.managerId })
          }
        } catch (e) {
          this.$apiError.notify(e, this.$t('electricityPlanPage.msgWithdrawFail'))
        }
      }).catch(() => {})
    },

    formatActivationDate (value) {
      if (!value) return '-'
      const text = String(value).trim()
      if (!text) return '-'
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return `${text} 00:00`
      }
      return text.replace('T', ' ')
    },

    closeLogDialog () {
      this.logDialogVisible = false
      this.logList = []
    }
  }
}
</script>

<style lang="scss" scoped>
.table-page-container.electricity-plan-page {
  padding: 16px;
  background: #f0f2f5;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.content-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  flex: 1;
  padding: 16px 16px 10px;
}

.content-toolbar.ep-page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 12px;
  flex-wrap: wrap;
  gap: 12px;

  .toolbar-left {
    min-width: 0;
  }

  .toolbar-left .section-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #111827;

    .title-bar {
      width: 3px;
      height: 16px;
      background: #1677ff;
      border-radius: 2px;
      flex-shrink: 0;
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;

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
  }
}

.list-view.ep-list-view {
  padding: 0;
}

.plan-fee-table.light-border-table {
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

    .el-table__fixed-right-patch {
      border-bottom: 1px solid #f0f0f0 !important;
      background-color: #f5f7fa !important;
    }
  }

  .plan-id-cell {
    font-family: 'SF Mono', ui-monospace, monospace;
    color: #909399;
    font-size: 13px;
  }

  .plan-time-cell {
    color: #606266;
    font-size: 13px;
    white-space: nowrap;
  }

  .price-cell {
    font-family: 'SF Mono', ui-monospace, monospace;
    font-weight: 500;
    font-size: 14px;
    font-variant-numeric: tabular-nums;

    &.price-peak {
      color: #dc2626;
    }

    &.price-top {
      color: #f59e0b;
    }

    &.price-flat {
      color: #3b82f6;
    }

    &.price-valley {
      color: #10b981;
    }
  }

  .plan-action-group {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    column-gap: 20px;
    row-gap: 8px;
    padding: 4px 8px;
  }

  .plan-action-group .action-link {
    padding: 6px 4px;
    white-space: nowrap;
  }
}

// 状态开关
.status-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
    pointer-events: none;
  }

  .switch-track {
    width: 36px;
    height: 20px;
    background: #e5e7eb;
    border-radius: 10px;
    position: relative;
    transition: all 0.3s;

    &.active {
      background: #34d399;

      .switch-thumb {
        transform: translateX(16px);
      }
    }

    .switch-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      transition: transform 0.3s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }

  .status-text {
    font-size: 12px;
    color: #6b7280;
  }
}

// 操作链接（电费方案表格内布局见 .plan-action-group）
.action-link {
  font-size: 14px;
  color: #1677ff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  position: relative;
  transition: color 0.2s;

  &:hover {
    color: #4096ff;

    &::after {
      width: 100%;
    }
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 1px;
    background: currentColor;
    transition: width 0.2s;
  }
}

// 弹窗样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.large {
    width: 95%;
    max-width: 1200px;
  }
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .modal-title {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }

  .modal-close {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: #f3f4f6;
      color: #374151;
    }
  }
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  button {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn-cancel {
    background: #f3f4f6;
    color: #374151;

    &:hover {
      background: #e5e7eb;
    }
  }

  .btn-confirm {
    background: #2563eb;
    color: white;

    &:hover {
      background: #1d4ed8;
    }
  }
}

// 表单样式
.form-group {
  margin-bottom: 20px;

  .form-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-input {
    width: 100%;
    padding: 10px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    color: #1a1a1a;
    transition: all 0.2s;

    &:hover {
      border-color: #d1d5db;
    }

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    &:disabled {
      background: #f9fafb;
      color: #9ca3af;
      cursor: not-allowed;
    }
  }
}

.activation-date-picker {
  width: 100%;
}

::v-deep .activation-date-picker .el-input__inner {
  height: 44px;
  line-height: 44px;
  padding-left: 40px;
}

::v-deep .activation-date-picker .el-input__prefix {
  left: 12px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: auto;
  display: inline-flex;
  align-items: center;
}

::v-deep .activation-date-picker .el-input__prefix .el-input__icon {
  line-height: 1;
  transform: none;
}

.price-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.input-group {
  position: relative;

  .input-suffix {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: #9ca3af;
    pointer-events: none;
  }

  input {
    padding-right: 60px;
  }
}

.price-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;

  &.peak { background: #dc2626; }  // 红色 - 尖电价
  &.top { background: #f59e0b; }   // 橙色 - 峰电价
  &.flat { background: #3b82f6; }  // 蓝色 - 平电价
  &.valley { background: #10b981; } // 绿色 - 谷电价
}

// 验证码区域
.verification-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.warning-text {
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.phone-display {
  font-size: 14px;
  color: #1a1a1a;
  padding: 10px 0;
}

.code-btn {
  position: absolute;
  right: 1px;
  top: 1px;
  bottom: 1px;
  padding: 0 16px;
  background: #f3f4f6;
  border: none;
  border-radius: 0 7px 7px 0;
  color: #2563eb;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;

  &:hover:not(:disabled) {
    background: #e5e7eb;
    color: #1d4ed8;
  }

  &:disabled {
    color: #9ca3af;
    cursor: not-allowed;
  }
}

// 侧边栏样式
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.drawer-container {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 480px;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.drawer-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .drawer-title {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }

  .drawer-close {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: #6b7280;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: #f3f4f6;
      color: #374151;
    }
  }
}

.drawer-tabs {
  padding: 0 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 24px;
}

.tab-item {
  padding: 16px 0;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;

  &.active {
    color: #2563eb;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #2563eb;
    }
  }

  &:hover:not(.active) {
    color: #374151;
  }
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.tree-search {
  margin-bottom: 20px;

  .tree-search-input {
    width: 100%;
    padding: 10px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }
}

// 树形结构样式 - 优化版本
.tree-container {
  .tree-node {
    margin-bottom: 4px;

    &.root {
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 6px;
      font-weight: 600;
    }

    &.parent-node {
      border: 1px solid #e9ecef;
      border-radius: 6px;
      background: #f8f9fa;
      margin-bottom: 8px;

      .parent-row {
        display: flex;
        align-items: center;
        padding: 12px 16px;
      }
    }
  }

  .tree-checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    flex: 1;

    &.parent-checkbox {
      .tree-label {
        font-weight: 600;
        color: #1f2937;
        font-size: 15px;
      }
    }

    input[type="checkbox"] {
      display: none;

      &:checked + .checkbox-icon {
        background: #2563eb;
        border-color: #2563eb;

        &::after {
          opacity: 1;
        }
      }

      &:disabled + .checkbox-icon {
        background: #f3f4f6;
        border-color: #e5e7eb;
        cursor: not-allowed;
      }
    }

    .checkbox-icon {
      width: 18px;
      height: 18px;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      margin-right: 12px;
      position: relative;
      transition: all 0.2s;
      flex-shrink: 0;

      &::after {
        content: '';
        position: absolute;
        top: 1px;
        left: 4px;
        width: 5px;
        height: 9px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        opacity: 0;
        transition: opacity 0.2s;
      }
    }

    .tree-label {
      font-size: 14px;
      color: #374151;
      flex: 1;
    }

    .bound-tag {
      font-size: 12px;
      color: #9ca3af;
      padding: 2px 8px;
      background: #f3f4f6;
      border-radius: 4px;
      margin-left: 8px;
    }
  }

  // 子项样式 - 重要的层次区分
  .tree-children {
    padding-left: 24px;
    border-left: 2px solid #e5e7eb;
    margin-left: 32px;

    .child-node {
      padding: 8px 16px;
      margin: 4px 0;
      border-radius: 4px;
      transition: background 0.2s;

      &:hover {
        background: #f9fafb;
      }

      .tree-checkbox {
        .tree-label {
          font-size: 14px;
          color: #6b7280;
        }
      }
    }
  }
}

// 展开按钮样式 - 优化版本
.expand-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
  margin-right: 12px;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
}

.expand-placeholder {
  width: 32px;
  flex-shrink: 0;
}

.drawer-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .selected-info {
    font-size: 14px;
    color: #6b7280;
  }

  .btn-confirm {
    padding: 10px 24px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #1d4ed8;
    }
  }
}

// 日志样式
.log-list {
  .log-item {
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .log-time {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 12px;
  }

  .log-content {
    .log-operator {
      font-size: 14px;
      color: #374151;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .log-phone {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 12px;
    }

    .log-changes {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .change-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;

      .change-label {
        color: #6b7280;
      }

      .change-value {
        color: #374151;
        font-weight: 500;
      }
    }
  }
}

.empty-log, .empty-tree {
  padding: 80px 0;
  text-align: center;

  svg {
    margin-bottom: 16px;
  }

  p {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
  }
}

// 动画
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;

  .drawer-container {
    transition: transform 0.3s ease;
  }
}

.slide-enter,
.slide-leave-to {
  background: rgba(0, 0, 0, 0);

  .drawer-container {
    transform: translateX(100%);
  }
}

// 响应式
@media (max-width: 768px) {
  .table-page-container.electricity-plan-page {
    padding: 12px;
  }

  .content-toolbar.ep-page-toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 0 4px 10px;
  }

  .plan-fee-table.light-border-table {
    ::v-deep .el-table .cell {
      font-size: 12px;
      padding-left: 8px;
      padding-right: 8px;
    }
  }

  .modal-container {
    max-width: 95%;
  }

  .price-grid {
    grid-template-columns: 1fr;
  }

  .drawer-container {
    width: 90vw;
  }

  .plan-fee-table.light-border-table .plan-action-group {
    column-gap: 14px;
    row-gap: 10px;
    padding: 6px 4px;
  }
}
</style>
