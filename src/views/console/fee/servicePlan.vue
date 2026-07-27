<template>
  <div class="table-page-container service-plan-page">
    <template v-if="canView">
      <div class="content-box">
        <div class="content-toolbar sp-page-toolbar">
          <div class="toolbar-left">
            <span class="section-title">
              <span class="title-bar" />
              {{ $t('servicePlanPage.sectionTitle') }}
            </span>
          </div>
          <div class="toolbar-right">
            <el-button
              v-if="canOperate"
              type="primary"
              size="small"
              icon="el-icon-plus"
              @click="handleAdd"
            >
              {{ $t('servicePlanPage.btnAddPlan') }}
            </el-button>
          </div>
        </div>

        <div class="list-view sp-list-view">
          <el-table
            :data="tableData"
            v-loading="loading"
            border
            stripe
            class="plan-service-table light-border-table"
            style="width: 100%"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
            }"
          >
            <template slot="empty">
              <el-empty :description="$t('servicePlanPage.emptyTable')" />
            </template>

            <el-table-column prop="id" :label="$t('servicePlanPage.colPlanId')" width="100" align="left">
              <template slot-scope="scope">
                <span class="plan-id-cell">#{{ scope.row.id }}</span>
              </template>
            </el-table-column>

            <el-table-column
              prop="name"
              :label="$t('servicePlanPage.colPlanName')"
              min-width="160"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                <span>{{ $displayBizHybrid(scope.row.name || '') || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="$t('servicePlanPage.colPeak')" width="130" align="right">
              <template slot-scope="scope">
                <span class="price-cell price-peak">{{ formatPrice(scope.row.powerPeakPrice) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('servicePlanPage.colTop')" width="130" align="right">
              <template slot-scope="scope">
                <span class="price-cell price-top">{{ formatPrice(scope.row.powerTopPrice) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('servicePlanPage.colFlat')" width="130" align="right">
              <template slot-scope="scope">
                <span class="price-cell price-flat">{{ formatPrice(scope.row.powerFlatPrice) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('servicePlanPage.colValley')" width="130" align="right">
              <template slot-scope="scope">
                <span class="price-cell price-valley">{{ formatPrice(scope.row.powerValleyPrice) }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="$t('servicePlanPage.colUpdated')" width="170" align="left">
              <template slot-scope="scope">
                <span class="plan-time-cell">{{ formatTime(scope.row.updateTime) }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="$t('servicePlanPage.colAction')" min-width="268" width="268" fixed="right" align="center">
              <template slot-scope="scope">
                <div v-if="canOperate" class="plan-action-group">
                  <button type="button" class="action-link" @click="handleEdit(scope.row)">{{ $t('servicePlanPage.btnAdjust') }}</button>
                  <button type="button" class="action-link" @click="handleViewLog(scope.row)">{{ $t('servicePlanPage.btnLog') }}</button>
                  <button type="button" class="action-link" @click="handleBatchBind(scope.row)">{{ $t('servicePlanPage.btnBatchBind') }}</button>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

    <!-- 编辑弹窗 -->
    <div v-if="dialogVisible" class="modal-overlay" @click.self="closeDialog">
      <div class="modal-container">
        <div class="modal-header">
          <h2 class="modal-title">{{ isEdit ? $t('servicePlanPage.modalTitleEdit') : $t('servicePlanPage.modalTitleAdd') }}</h2>
          <button class="modal-close" @click="closeDialog">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">{{ $t('servicePlanPage.formPlanName') }}</label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              :placeholder="$t('servicePlanPage.phPlanName')"
              :disabled="isEdit"
            >
          </div>

          <div class="price-grid">
            <div class="form-group">
              <label class="form-label">
                <span class="price-dot peak"></span>
                {{ $t('servicePlanPage.labelPeak') }}
              </label>
              <div class="input-group">
                <input
                  v-model="formData.powerPeakPrice"
                  type="text"
                  class="form-input"
                  placeholder="0.00"
                  @input="limitInput($event.target.value, 'powerPeakPrice')"
                >
                <span class="input-suffix">{{ $t('servicePlanPage.unitPerKwh') }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="price-dot top"></span>
                {{ $t('servicePlanPage.labelTop') }}
              </label>
              <div class="input-group">
                <input
                  v-model="formData.powerTopPrice"
                  type="text"
                  class="form-input"
                  placeholder="0.00"
                  @input="limitInput($event.target.value, 'powerTopPrice')"
                >
                <span class="input-suffix">{{ $t('servicePlanPage.unitPerKwh') }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="price-dot flat"></span>
                {{ $t('servicePlanPage.labelFlat') }}
              </label>
              <div class="input-group">
                <input
                  v-model="formData.powerFlatPrice"
                  type="text"
                  class="form-input"
                  placeholder="0.00"
                  @input="limitInput($event.target.value, 'powerFlatPrice')"
                >
                <span class="input-suffix">{{ $t('servicePlanPage.unitPerKwh') }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="price-dot valley"></span>
                {{ $t('servicePlanPage.labelValley') }}
              </label>
              <div class="input-group">
                <input
                  v-model="formData.powerValleyPrice"
                  type="text"
                  class="form-input"
                  placeholder="0.00"
                  @input="limitInput($event.target.value, 'powerValleyPrice')"
                >
                <span class="input-suffix">{{ $t('servicePlanPage.unitPerKwh') }}</span>
              </div>
            </div>
          </div>

          <!-- 修改时需要验证码 -->
          <div v-if="isEdit" class="verification-section">
            <div class="warning-text">
              {{ $t('servicePlanPage.warnEditNote') }}
            </div>

            <div class="form-group">
              <label class="form-label">{{ $t('servicePlanPage.labelPhoneBound') }}</label>
              <div class="phone-display">{{ codePhone }}</div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ $t('servicePlanPage.labelVerifyCode') }}</label>
              <div class="input-group">
                <input
                  v-model="formData.code"
                  type="text"
                  class="form-input"
                  :placeholder="$t('servicePlanPage.phVerifyCode')"
                  maxlength="6"
                >
                <button
                  type="button"
                  class="code-btn"
                  :disabled="codeCountdown > 0"
                  @click="getAuthSendSmsCode"
                >
                  {{ codeCountdown > 0 ? $t('servicePlanPage.resendIn', { n: codeCountdown }) : $t('servicePlanPage.sendCode') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeDialog">{{ $t('servicePlanPage.btnCancel') }}</button>
          <button class="btn-confirm" @click="handleSubmit">{{ $t('servicePlanPage.btnConfirm') }}</button>
        </div>
      </div>
    </div>

    <!-- 批量绑定侧边栏 - 树形结构 -->
    <transition name="slide">
      <div v-if="bindDrawerVisible" class="drawer-overlay" @click.self="closeBind">
        <div class="drawer-container">
          <div class="drawer-header">
            <h2 class="drawer-title">{{ $t('servicePlanPage.drawerTitle') }}</h2>
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
              {{ $t('servicePlanPage.tabDedicated') }}
            </button>
            <button
              class="tab-item"
              :class="{ active: activeTab === 1 }"
              @click="switchTab(1)"
            >
              {{ $t('servicePlanPage.tabShare') }}
            </button>
          </div>

          <div class="drawer-body">
            <div class="tree-search">
              <input
                v-model="treeFilter"
                type="text"
                class="tree-search-input"
                :placeholder="$t('servicePlanPage.phSearchMeter')"
              >
            </div>

            <div class="tree-container">
              <!-- 全选节点 -->
              <div class="tree-node root">
                <label class="tree-checkbox">
                  <input
                    type="checkbox"
                    :checked="checkAllStatus"
                    @change="handleCheckAll"
                  >
                  <span class="checkbox-icon"></span>
                  <span class="tree-label">{{ $t('servicePlanPage.selectAll') }}</span>
                </label>
              </div>

              <!-- 树形结构 -->
              <div
                v-for="group in filteredTreeData"
                :key="group.id"
                class="tree-group"
              >
                <!-- 父级节点 -->
                <div class="tree-node parent-node">
                  <div class="parent-row">
                    <!-- 展开按钮（只有公摊组才显示） -->
                    <span
                      v-if="group.isGroup"
                      class="expand-btn"
                      @click="toggleExpand(group.id)"
                    >
                      {{ group.expanded ? '▼' : '▶' }}
                    </span>
                    <span v-else class="expand-placeholder"></span>

                    <!-- 复选框和标签 -->
                    <label class="tree-checkbox parent-checkbox">
                      <input
                        type="checkbox"
                        :checked="isGroupChecked(group)"
                        @change="handleGroupCheck(group, $event)"
                        :disabled="!group.isGroup && group.disabled"
                      >
                      <span class="checkbox-icon"></span>
                      <span class="tree-label parent-label">
                        {{ groupDisplayName(group) }}
                        <span v-if="group.isGroup" class="group-type">({{ $t('servicePlanPage.tagShareGroup') }})</span>
                        <span v-if="!group.isGroup && group.disabled" class="bound-tag">{{ $t('servicePlanPage.tagBound') }}</span>
                      </span>
                    </label>
                  </div>
                </div>

                <!-- 子级电表 - 只在公摊组展开时显示 -->
                <div v-if="group.isGroup && group.expanded" class="tree-children">
                  <div
                    v-for="meter in group.children"
                    :key="meter.meterId"
                    class="tree-node child-node"
                    v-show="!treeFilter || (meter.meterName || '').includes(treeFilter)"
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
                      <span v-if="meter.disabled" class="bound-tag">{{ $t('servicePlanPage.tagBound') }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-if="filteredTreeData.length === 0" class="empty-tree">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" stroke="#E5E7EB" stroke-width="2"/>
                </svg>
                <p>{{ treeFilter ? $t('servicePlanPage.emptyTreeNoMatch') : $t('servicePlanPage.emptyTreeNoData') }}</p>
              </div>
            </div>
          </div>

          <div class="drawer-footer">
            <div class="selected-info">
              {{ $t('servicePlanPage.selectedMeters', { count: selectedMeterIds.length }) }}
            </div>
            <button v-if="canOperate" class="btn-confirm" @click="handleBindSubmit">{{ $t('servicePlanPage.btnConfirmBind') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 调价日志弹窗 -->
    <div v-if="logDialogVisible" class="modal-overlay" @click.self="closeLogDialog">
      <div class="modal-container large">
        <div class="modal-header">
          <h2 class="modal-title">{{ $t('servicePlanPage.logTitle') }}</h2>
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
            <p>{{ $t('servicePlanPage.emptyLog') }}</p>
          </div>

          <div v-else class="log-list">
            <div v-for="(log, index) in logList" :key="index" class="log-item">
              <div class="log-time">{{ log.createTime }}</div>
              <div class="log-content">
                <div class="log-operator">{{ $t('servicePlanPage.logPlanNameLabel') }}{{ $displayBizHybrid(log.operator || '') }}</div>
                <div v-if="log.phone" class="log-phone">{{ $t('servicePlanPage.logPhoneLabel') }}{{ log.phone }}</div>
                <div class="log-changes">
                  <div class="change-item" v-if="log.peakChange">
                    <span class="change-label">{{ $t('servicePlanPage.logLabelPeak') }}</span>
                    <span class="change-value">¥{{ log.oldPeakPrice }}</span>
                  </div>
                  <div class="change-item" v-if="log.topChange">
                    <span class="change-label">{{ $t('servicePlanPage.logLabelTop') }}</span>
                    <span class="change-value">¥{{ log.oldTopPrice }}</span>
                  </div>
                  <div class="change-item" v-if="log.flatChange">
                    <span class="change-label">{{ $t('servicePlanPage.logLabelFlat') }}</span>
                    <span class="change-value">¥{{ log.oldFlatPrice }}</span>
                  </div>
                  <div class="change-item" v-if="log.valleyChange">
                    <span class="change-label">{{ $t('servicePlanPage.logLabelValley') }}</span>
                    <span class="change-value">¥{{ log.oldValleyPrice }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>
    <el-empty v-else :description="$t('servicePlanPage.emptyNoPermission')" />
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
  authSendSmsCode,
  queryPriceLog
} from '@/api/meterPrice'

export default {
  name: 'ServicePlanPage',
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
        priceType: 2
      },

      // 验证码相关
      codePhone: '',
      codeCountdown: 0,
      codeTimer: null,

      // 批量绑定 - 树形结构（修改）
      bindDrawerVisible: false,
      activeTab: 0,
      treeFilter: '',
      selectedMeterIds: [],
      currentPriceId: null,
      treeData: [], // 树形结构数据
      rawMeterData: null, // 原始数据

      // 调价日志
      logDialogVisible: false,
      logList: [],
      logLoading: false
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map(v => String(v)))
      return menuNo => allow.has(String(menuNo))
    },
    canOperate () {
      return this.hasKztPermission('660070')
    },
    canView () {
      return this.hasKztPermission('660071')
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

    // 过滤后的树形数据（新增）
    filteredTreeData () {
      if (!this.treeFilter) {
        return this.treeData
      }
      const f = this.treeFilter
      return this.treeData.map(group => ({
        ...group,
        children: group.isGroup ? group.children.filter(meter =>
          (meter.meterName || '').includes(f)
        ) : []
      })).filter(group => {
        if (group.isGroup) {
          const displayName = this.groupDisplayName(group)
          return displayName.includes(f) || group.children.length > 0
        } else {
          return (group.meterName || '').includes(f)
        }
      })
    },

    // 全选状态检查（修改）
    checkAllStatus () {
      const availableMeters = this.getAllAvailableMeters()
      if (availableMeters.length === 0) return false
      return availableMeters.every(m => this.selectedMeterIds.includes(m.meterId))
    }
  },

  watch: {
    currentManagerId: {
      handler (val) {
        if (val && this.canView) {
          this.initData()
        }
      },
      immediate: true
    },
    canView: {
      handler (val) {
        if (val && this.currentManagerId) {
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
      if (!group.name) return this.$t('servicePlanPage.groupUngrouped')
      return this.$displayBizHybrid(String(group.name), 200)
    },

    async loadData () {
      if (!this.canView) return
      this.loading = true
      try {
        const { data } = await meterPriceList({
          managerId: this.currentManagerId,
          priceType: 2
        })
        this.tableData = data || []
      } catch (error) {
        this.$apiError.notify(error, this.$t('servicePlanPage.msgLoadFail'))
      } finally {
        this.loading = false
      }
    },

    formatPrice (price) {
      return price ? `¥${Number(price).toFixed(2)}` : '-'
    },

    formatTime (time) {
      if (!time) return '-'
      return time.replace('T', ' ').substring(0, 16)
    },

    handleAdd () {
      if (!this.canOperate) {
        this.$message.warning(this.$t('servicePlanPage.msgNoOperate'))
        return
      }
      this.isEdit = false
      this.formData = {
        name: '',
        code: '',
        powerPeakPrice: '',
        powerTopPrice: '',
        powerFlatPrice: '',
        powerValleyPrice: '',
        managerId: this.currentManagerId,
        priceType: 2
      }
      this.dialogVisible = true
    },

    handleEdit (row) {
      if (!this.canOperate) {
        this.$message.warning(this.$t('servicePlanPage.msgNoOperate'))
        return
      }
      this.isEdit = true
      this.formData = {
        ...row,
        code: '',
        phone: this.userPhone
      }
      this.codePhone = this.maskedPhone
      this.dialogVisible = true
    },

    limitInput (val, field) {
      // 限制输入小数点后4位
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
        this.$message.success(msg || this.$t('servicePlanPage.msgSmsSent'))

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
        this.$apiError.notify(error, this.$t('servicePlanPage.msgSmsFail'))
      }
    },

    validateForm () {
      const { powerPeakPrice, powerTopPrice, powerFlatPrice, powerValleyPrice, name, code } = this.formData

      if (!name) {
        this.$message.warning(this.$t('servicePlanPage.msgNameRequired'))
        return false
      }

      if (!powerPeakPrice || !powerTopPrice || !powerFlatPrice || !powerValleyPrice) {
        this.$message.warning(this.$t('servicePlanPage.msgPriceIncomplete'))
        return false
      }

      if (Number(powerPeakPrice) === 0 || Number(powerTopPrice) === 0 ||
          Number(powerFlatPrice) === 0 || Number(powerValleyPrice) === 0) {
        this.$message.warning(this.$t('servicePlanPage.msgPriceZero'))
        return false
      }

      if (this.isEdit && !code) {
        this.$message.warning(this.$t('servicePlanPage.msgVerifyCode'))
        return false
      }

      return true
    },

    async handleSubmit () {
      if (!this.canOperate) {
        this.$message.warning(this.$t('servicePlanPage.msgNoOperate'))
        return
      }
      if (!this.validateForm()) return

      this.$confirm(
        this.isEdit ? this.$t('servicePlanPage.confirmModify') : this.$t('servicePlanPage.confirmAdd'),
        this.$t('servicePlanPage.titleTip'),
        {
          confirmButtonText: this.$t('servicePlanPage.btnOk'),
          cancelButtonText: this.$t('servicePlanPage.btnCancel'),
          type: 'warning'
        }
      ).then(async () => {
        try {
          const api = this.isEdit ? meterPriceUpdate : meterPriceAdd
          const { msg } = await api(this.formData)
          this.$message.success(msg || this.$t('servicePlanPage.msgOpOk'))
          this.closeDialog()
          this.loadData()
        } catch (error) {
          this.$message.error(error?.msg || error?.message || this.$t('servicePlanPage.msgOpFail'))
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
        priceType: 2
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
        this.$message.warning(this.$t('servicePlanPage.msgNoOperate'))
        return
      }
      try {
        const status = row.enableStatus === 1 ? 0 : 1
        const { msg } = await meterPriceChangeEnableStatus({
          id: row.id,
          enableStatus: status
        })
        this.$message.success(msg || this.$t('servicePlanPage.msgOpOk'))
        this.loadData()
      } catch (error) {
        this.$apiError.notify(error, this.$t('servicePlanPage.msgOpFail'))
      }
    },

    // ================ 树形结构批量绑定功能（新增/修改） ================

    async handleBatchBind (row) {
      if (!this.canOperate) {
        this.$message.warning(this.$t('servicePlanPage.msgNoOperate'))
        return
      }
      this.currentPriceId = row.id
      this.bindDrawerVisible = true
      this.activeTab = 0
      this.selectedMeterIds = []

      try {
        const { data } = await meterPriceQueryPriceMeterEdit({
          priceId: row.id
        })

        if (data) {
          this.rawMeterData = data
          this.buildTreeData(data)
        }
      } catch (error) {
        console.error('获取电表列表失败:', error)
        this.$apiError.notify(error, this.$t('servicePlanPage.msgMeterListFail'))
      }
    },

    // 构建树形数据结构（修正）
    buildTreeData (data) {
      const currentList = this.activeTab === 0
        ? (data.privateMeterList || [])
        : (data.shareMeterList || [])

      // 按bindName分组 - 专用电表和公摊电表都需要分组
      const groupMap = new Map()

      currentList.forEach(meter => {
        const groupName = meter.bindName || null
        const groupId = meter.bindId || 'unbound'

        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, {
            id: groupId,
            name: groupName,
            isGroup: true, // 所有分组都标记为 isGroup: true
            expanded: true, // 默认展开
            children: []
          })
        }

        // 处理电表状态
        const processedMeter = {
          ...meter,
          disabled: meter.serviceId === this.currentPriceId
        }

        groupMap.get(groupId).children.push(processedMeter)
      })

      // 转换为数组并排序
      this.treeData = Array.from(groupMap.values()).sort((a, b) => {
        const aDefault = !a.name
        const bDefault = !b.name
        if (aDefault && !bDefault) return 1
        if (!aDefault && bDefault) return -1
        return String(a.name || '').localeCompare(String(b.name || ''))
      })
    },

    // 切换展开/收起（新增）
    toggleExpand (groupId) {
      const group = this.treeData.find(g => g.id === groupId)
      if (group && group.isGroup) {
        this.$set(group, 'expanded', !group.expanded)
      }
    },

    // 检查分组是否全选（修改）
    isGroupChecked (group) {
      if (group.isGroup) {
        const availableChildren = group.children.filter(m => !m.disabled)
        return availableChildren.length > 0 &&
               availableChildren.every(m => this.selectedMeterIds.includes(m.meterId))
      } else {
        // 单个电表
        return !group.disabled && this.selectedMeterIds.includes(group.meterId)
      }
    },

    // 处理分组选择（修改）
    handleGroupCheck (group, event) {
      event.stopPropagation()
      const checked = event.target.checked

      if (group.isGroup) {
        // 公摊组
        const availableChildren = group.children.filter(m => !m.disabled)

        if (checked) {
          const newIds = availableChildren.map(m => m.meterId)
          const currentSet = new Set(this.selectedMeterIds)
          newIds.forEach(id => currentSet.add(id))
          this.selectedMeterIds = Array.from(currentSet)
        } else {
          const removeIds = availableChildren.map(m => m.meterId)
          this.selectedMeterIds = this.selectedMeterIds.filter(id => !removeIds.includes(id))
        }
      } else {
        // 单个电表
        if (group.disabled) return

        const index = this.selectedMeterIds.indexOf(group.meterId)
        if (checked && index === -1) {
          this.selectedMeterIds.push(group.meterId)
        } else if (!checked && index > -1) {
          this.selectedMeterIds.splice(index, 1)
        }
      }
    },

    // 处理单个电表选择（保持原有逻辑）
    handleMeterCheck (meter) {
      if (meter.disabled) return

      const index = this.selectedMeterIds.indexOf(meter.meterId)
      if (index > -1) {
        this.selectedMeterIds.splice(index, 1)
      } else {
        this.selectedMeterIds.push(meter.meterId)
      }
    },

    // 处理全选（修改）
    handleCheckAll (event) {
      const checked = event.target.checked

      if (checked) {
        const allAvailableIds = []
        this.treeData.forEach(group => {
          if (group.isGroup) {
            group.children.forEach(child => {
              if (!child.disabled) {
                allAvailableIds.push(child.meterId)
              }
            })
          } else if (!group.disabled) {
            allAvailableIds.push(group.meterId)
          }
        })
        this.selectedMeterIds = allAvailableIds
      } else {
        this.selectedMeterIds = []
      }
    },

    // 获取所有可用电表（新增）
    getAllAvailableMeters () {
      const availableMeters = []
      this.treeData.forEach(group => {
        if (group.isGroup) {
          availableMeters.push(...group.children.filter(m => !m.disabled))
        } else if (!group.disabled) {
          availableMeters.push(group)
        }
      })
      return availableMeters
    },

    // tab 切换（新增）
    switchTab (tabIndex) {
      this.activeTab = tabIndex
      this.treeFilter = ''
      this.selectedMeterIds = []

      if (this.rawMeterData) {
        this.buildTreeData(this.rawMeterData)
      }
    },

    // 确认绑定（修改逻辑）
    async handleBindSubmit () {
      if (!this.canOperate) {
        this.$message.warning(this.$t('servicePlanPage.msgNoOperate'))
        return
      }
      if (this.selectedMeterIds.length === 0) {
        this.$message.warning(this.$t('servicePlanPage.msgSelectMeters'))
        return
      }

      // 筛选出新增的电表（排除已经绑定的）
      const availableMeters = this.getAllAvailableMeters()
      const newMeterIds = this.selectedMeterIds.filter(id => {
        const meter = availableMeters.find(m => m.meterId === id)
        return meter && !meter.disabled
      })

      if (newMeterIds.length === 0) {
        this.$message.warning(this.$t('servicePlanPage.msgSelectNewMeters'))
        return
      }

      this.$confirm(
        this.$t('servicePlanPage.confirmBindMeters', { count: newMeterIds.length }),
        this.$t('servicePlanPage.titleTip'),
        {
          confirmButtonText: this.$t('servicePlanPage.btnOk'),
          cancelButtonText: this.$t('servicePlanPage.btnCancel'),
          type: 'warning'
        }
      ).then(async () => {
        try {
          const { msg } = await meterPriceBatchBindPriceMeter({
            priceId: this.currentPriceId,
            meterIdList: newMeterIds
          })
          this.$message.success(msg || this.$t('servicePlanPage.msgBindOk'))
          this.closeBind()
        } catch (error) {
          console.error('绑定失败:', error)
          this.$apiError.notify(error, this.$t('servicePlanPage.msgBindFail'))
        }
      }).catch(() => {})
    },

    // 关闭抽屉（修改）
    closeBind () {
      this.bindDrawerVisible = false
      this.selectedMeterIds = []
      this.treeFilter = ''
      this.treeData = []
      this.rawMeterData = null
    },

    async handleViewLog (row) {
      if (!this.canOperate) {
        this.$message.warning(this.$t('servicePlanPage.msgNoOperate'))
        return
      }
      this.logDialogVisible = true
      this.logLoading = true

      try {
        const { data } = await queryPriceLog({
          meterPriceId: row.id,
          managerId: row.managerId
        })

        // 处理分页日志数据 - 根据实际返回的数据结构
        if (data && data.dataList && data.dataList.length > 0) {
          this.logList = data.dataList.map(log => ({
            createTime: log.occurTime,
            operator: log.meterPriceName,
            peakChange: true,
            oldPeakPrice: log.powerPeakPrice,
            newPeakPrice: log.powerPeakPrice,
            topChange: true,
            oldTopPrice: log.powerTopPrice,
            newTopPrice: log.powerTopPrice,
            flatChange: true,
            oldFlatPrice: log.powerFlatPrice,
            newFlatPrice: log.powerFlatPrice,
            valleyChange: true,
            oldValleyPrice: log.powerValleyPrice,
            newValleyPrice: log.powerValleyPrice,
            phone: log.optUserPhone
          }))
        } else {
          this.logList = []
        }
      } catch (error) {
        console.error('获取日志失败:', error)
        this.$apiError.notify(error, this.$t('servicePlanPage.msgLogFail'))
        this.logList = []
      } finally {
        this.logLoading = false
      }
    },

    closeLogDialog () {
      this.logDialogVisible = false
      this.logList = []
    }
  }
}
</script>

<style lang="scss" scoped>
.table-page-container.service-plan-page {
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

.content-toolbar.sp-page-toolbar {
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

.list-view.sp-list-view {
  padding: 0;
}

.plan-service-table.light-border-table {
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

// 操作链接（表格内操作区见 .plan-action-group）
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
    max-width: 800px;
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

// 树形结构样式 - 优化版本（新增）
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

    .group-type {
      font-size: 12px;
      color: #999;
      font-weight: normal;
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

// 展开按钮样式 - 优化版本（新增）
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

// 空状态
.empty-tree {
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

.empty-log {
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
  .table-page-container.service-plan-page {
    padding: 12px;
  }

  .content-toolbar.sp-page-toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 0 4px 10px;
  }

  .plan-service-table.light-border-table {
    ::v-deep .el-table .cell {
      font-size: 12px;
      padding-left: 8px;
      padding-right: 8px;
    }
  }

  .plan-service-table.light-border-table .plan-action-group {
    column-gap: 14px;
    row-gap: 10px;
    padding: 6px 4px;
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
}
</style>
