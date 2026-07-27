<template>
  <div class="table-page-container water-plan-page">
    <template v-if="canView">
      <div class="content-box">
        <div class="content-toolbar wp-page-toolbar">
          <div class="toolbar-left">
            <span class="section-title">
              <span class="title-bar" />
              {{ $t('waterPlanPage.sectionTitle') }}
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
              {{ $t('waterPlanPage.btnAddPlan') }}
            </el-button>
          </div>
        </div>

        <div class="list-view wp-list-view">
          <el-table
            :data="tableData"
            v-loading="loading"
            border
            stripe
            class="plan-water-table light-border-table"
            style="width: 100%"
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#606266',
              fontWeight: '600',
            }"
          >
            <template slot="empty">
              <el-empty :description="$t('waterPlanPage.emptyTable')" />
            </template>

            <el-table-column prop="id" :label="$t('waterPlanPage.colPlanId')" width="100" align="left">
              <template slot-scope="scope">
                <span class="plan-id-cell">#{{ scope.row.id }}</span>
              </template>
            </el-table-column>

            <el-table-column
              prop="name"
              :label="$t('waterPlanPage.colPlanName')"
              min-width="200"
              show-overflow-tooltip
            >
              <template slot-scope="scope">
                {{ $displayBizHybrid(scope.row.name || '') || '-' }}
              </template>
            </el-table-column>

            <el-table-column :label="$t('waterPlanPage.colPrice')" width="140" align="right">
              <template slot-scope="scope">
                <span class="water-price-cell">{{ formatPrice(scope.row.price) }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="$t('waterPlanPage.colUpdated')" width="180" align="left">
              <template slot-scope="scope">
                <span class="plan-time-cell">{{ formatTime(scope.row.updateTime) }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="$t('waterPlanPage.colAction')" min-width="220" width="240" fixed="right" align="center">
              <template slot-scope="scope">
                <div v-if="canOperate" class="plan-action-group">
                  <button type="button" class="action-link" @click="handleEdit(scope.row)">{{ $t('waterPlanPage.btnAdjust') }}</button>
                  <button type="button" class="action-link" @click="handleBatchBind(scope.row)">{{ $t('waterPlanPage.btnBatchBind') }}</button>
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
          <h2 class="modal-title">{{ isEdit ? $t('waterPlanPage.modalTitleEdit') : $t('waterPlanPage.modalTitleAdd') }}</h2>
          <button class="modal-close" @click="closeDialog">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">{{ $t('waterPlanPage.formPlanName') }}</label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              :placeholder="$t('waterPlanPage.phPlanName')"
              :disabled="isEdit"
            >
          </div>

          <div class="form-group">
            <label class="form-label">
              {{ $t('waterPlanPage.labelWaterPrice') }}
            </label>
            <div class="input-group">
              <input
                v-model="formData.price"
                type="text"
                class="form-input"
                placeholder="0.00"
                @input="limitInput($event.target.value, 'price')"
              >
              <span class="input-suffix">{{ $t('waterPlanPage.unitPerTon') }}</span>
            </div>
          </div>

          <!-- 修改时需要验证码 -->
          <div v-if="isEdit" class="verification-section">
            <div class="warning-text">
              {{ $t('waterPlanPage.warnEditNote') }}
            </div>

            <div class="form-group">
              <label class="form-label">{{ $t('waterPlanPage.labelPhoneBound') }}</label>
              <div class="phone-display">{{ codePhone }}</div>
            </div>

            <!-- <div class="form-group">
              <label class="form-label">{{ $t('waterPlanPage.labelVerifyCode') }}</label>
              <div class="input-group">
                <input
                  v-model="formData.code"
                  type="text"
                  class="form-input"
                  :placeholder="$t('waterPlanPage.phVerifyCode')"
                  maxlength="6"
                >
                <button
                  class="code-btn"
                  :disabled="codeCountdown > 0"
                  @click="getAuthSendSmsCode"
                >
                  {{ codeCountdown > 0 ? $t('waterPlanPage.resendIn', { n: codeCountdown }) : $t('waterPlanPage.sendCode') }}
                </button>
              </div>
            </div> -->
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeDialog">{{ $t('waterPlanPage.btnCancel') }}</button>
          <button class="btn-confirm" @click="handleSubmit">{{ $t('waterPlanPage.btnConfirm') }}</button>
        </div>
      </div>
    </div>

    <!-- 批量绑定侧边栏 - 树形结构 -->
    <transition name="slide">
      <div v-if="bindDrawerVisible" class="drawer-overlay" @click.self="closeBind">
        <div class="drawer-container">
          <div class="drawer-header">
            <h2 class="drawer-title">{{ $t('waterPlanPage.drawerTitle') }}</h2>
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
              {{ $t('waterPlanPage.tabPrivate') }}
            </button>
            <button
              class="tab-item"
              :class="{ active: activeTab === 1 }"
              @click="switchTab(1)"
            >
              {{ $t('waterPlanPage.tabShare') }}
            </button>
            <button
              class="tab-item"
              :class="{ active: activeTab === 2 }"
              @click="switchTab(2)"
            >
              {{ $t('waterPlanPage.tabFormula') }}
            </button>
          </div>

          <div class="drawer-body">
            <div class="tree-search">
              <input
                v-model="treeFilter"
                type="text"
                class="tree-search-input"
                :placeholder="$t('waterPlanPage.phSearchMeter')"
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
                  <span class="tree-label">{{ $t('waterPlanPage.selectAll') }}</span>
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
                        {{ $displayBizHybrid(group.name || '') }}
                        <span v-if="group.isGroup" class="group-type">({{ $t('waterPlanPage.tagShareGroup') }})</span>
                        <span v-if="!group.isGroup && group.disabled" class="bound-tag">{{ $t('waterPlanPage.tagBound') }}</span>
                      </span>
                    </label>
                  </div>
                </div>

                <!-- 子级水表 - 只在公摊组展开时显示 -->
                <div v-if="group.isGroup && group.expanded" class="tree-children">
                  <div
                    v-for="meter in group.children"
                    :key="meter.waterId"
                    class="tree-node child-node"
                    v-show="!treeFilter || meter.waterName.includes(treeFilter)"
                  >
                    <label class="tree-checkbox child-checkbox">
                      <span class="expand-placeholder"></span>
                      <input
                        type="checkbox"
                        :checked="selectedMeterIds.includes(meter.waterId)"
                        :disabled="meter.disabled"
                        @change="handleMeterCheck(meter)"
                      >
                      <span class="checkbox-icon"></span>
                      <span class="tree-label">{{ $displayBizHybrid(meter.waterName || '') }}</span>
                      <span v-if="meter.disabled" class="bound-tag">{{ $t('waterPlanPage.tagBound') }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-if="filteredTreeData.length === 0" class="empty-tree">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L6 14V34L24 44L42 34V14L24 4Z" stroke="#E5E7EB" stroke-width="2"/>
                </svg>
                <p>{{ treeFilter ? $t('waterPlanPage.emptyTreeNoMatch') : $t('waterPlanPage.emptyTreeNoData') }}</p>
              </div>
            </div>
          </div>

          <div class="drawer-footer">
            <div class="selected-info">
              {{ $t('waterPlanPage.selectedWaters', { count: selectedMeterIds.length }) }}
            </div>
            <button v-if="canOperate" class="btn-confirm" @click="handleBindSubmit">{{ $t('waterPlanPage.btnConfirmBind') }}</button>
          </div>
        </div>
      </div>
    </transition>
    </template>
    <el-empty v-else :description="$t('waterPlanPage.emptyNoPermission')" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import {
  waterPriceAddPrice,
  waterPriceChangeEnableStatus,
  waterPriceListPrice,
  waterPriceUpdatePrice,
  waterPriceQueryWaterPriceBind,
  waterPriceBatchBindWater
} from '@/api/waterPrice'
import { authSendSmsCode } from '@/api/user'

export default {
  name: 'WaterPricePlan',
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
        price: '',
        code: '1',
        phone: '',
        managerId: ''
      },

      // 验证码倒计时（0 可发送）
      codeCountdown: 0,
      codeTimer: null,

      // 批量绑定 - 树形结构（新增）
      bindDrawerVisible: false,
      activeTab: 0,
      treeFilter: '',
      selectedMeterIds: [],
      currentPriceId: null,
      treeData: [], // 树形结构数据
      rawMeterData: null // 原始数据

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
      return this.hasKztPermission('660060')
    },
    canView () {
      return this.hasKztPermission('660061')
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

      return this.treeData.map(group => ({
        ...group,
        children: group.isGroup ? group.children.filter(meter =>
          meter.waterName.includes(this.treeFilter)
        ) : []
      })).filter(group => {
        if (group.isGroup) {
          return group.name.includes(this.treeFilter) || group.children.length > 0
        } else {
          return group.waterName.includes(this.treeFilter)
        }
      })
    },

    // 全选状态检查（新增）
    checkAllStatus () {
      const availableMeters = this.getAllAvailableMeters()
      if (availableMeters.length === 0) return false
      return availableMeters.every(m => this.selectedMeterIds.includes(m.waterId))
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

    async loadData () {
      if (!this.canView) return
      this.loading = true
      try {
        const { data } = await waterPriceListPrice({
          managerId: this.currentManagerId
        })
        this.tableData = data || []
      } catch (error) {
        this.$apiError.notify(error, this.$t('waterPlanPage.msgLoadFail'))
      } finally {
        this.loading = false
      }
    },

    formatPrice (price) {
      return price ? `¥${Number(price)}` : '-'
    },

    formatTime (time) {
      if (!time) return '-'
      return time.replace('T', ' ').substring(0, 16)
    },

    handleAdd () {
      if (!this.canOperate) {
        this.$message.warning(this.$t('waterPlanPage.msgNoOperate'))
        return
      }
      this.isEdit = false
      this.formData = {
        name: '',
        price: '',
        managerId: this.currentManagerId
      }
      this.dialogVisible = true
    },

    handleEdit (row) {
      if (!this.canOperate) {
        this.$message.warning(this.$t('waterPlanPage.msgNoOperate'))
        return
      }
      this.isEdit = true
      this.formData = {
        ...row,
        code: '1',
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
          eventType: 'WATER_PRICE_MODIFY'
        })
        this.$message.success(msg || this.$t('waterPlanPage.msgSmsSent'))

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
        this.$apiError.notify(error, this.$t('waterPlanPage.msgSmsFail'))
      }
    },

    validateForm () {
      const { name, price } = this.formData

      if (!name) {
        this.$message.warning(this.$t('waterPlanPage.msgNameRequired'))
        return false
      }

      if (!price) {
        this.$message.warning(this.$t('waterPlanPage.msgPriceRequired'))
        return false
      }

      if (Number(price) === 0) {
        this.$message.warning(this.$t('waterPlanPage.msgPriceZero'))
        return false
      }

      return true
    },

    async handleSubmit () {
      if (!this.canOperate) {
        this.$message.warning(this.$t('waterPlanPage.msgNoOperate'))
        return
      }
      if (!this.validateForm()) return

      this.$confirm(
        this.isEdit ? this.$t('waterPlanPage.confirmModify') : this.$t('waterPlanPage.confirmAdd'),
        this.$t('waterPlanPage.titleTip'),
        {
          confirmButtonText: this.$t('waterPlanPage.btnOk'),
          cancelButtonText: this.$t('waterPlanPage.btnCancel'),
          type: 'warning'
        }
      ).then(async () => {
        try {
          const api = this.isEdit ? waterPriceUpdatePrice : waterPriceAddPrice
          const { msg } = await api(this.formData)
          this.$message.success(msg || this.$t('waterPlanPage.msgOpOk'))
          this.closeDialog()
          this.loadData()
        } catch (error) {
          this.$apiError.notify(error, this.$t('waterPlanPage.msgOpFail'))
        }
      }).catch(() => {})
    },

    closeDialog () {
      this.dialogVisible = false
      this.formData = {
        id: '',
        name: '',
        price: '',
        code: '1',
        phone: '',
        managerId: ''
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
        this.$message.warning(this.$t('waterPlanPage.msgNoOperate'))
        return
      }
      try {
        const status = row.enableStatus === 1 ? 0 : 1
        const { msg } = await waterPriceChangeEnableStatus({
          id: row.id,
          enableStatus: status
        })
        this.$message.success(msg || this.$t('waterPlanPage.msgOpOk'))
        this.loadData()
      } catch (error) {
        this.$apiError.notify(error, this.$t('waterPlanPage.msgOpFail'))
      }
    },

    // ================ 树形结构批量绑定功能（新增/修改） ================

    async handleBatchBind (row) {
      if (!this.canOperate) {
        this.$message.warning(this.$t('waterPlanPage.msgNoOperate'))
        return
      }
      this.currentPriceId = row.id
      this.bindDrawerVisible = true
      this.activeTab = 0
      this.selectedMeterIds = []

      try {
        const { data } = await waterPriceQueryWaterPriceBind({
          managerId: this.currentManagerId
        })

        if (data) {
          this.rawMeterData = data
          this.buildTreeData(data)
        }
      } catch (error) {
        console.error('获取水表列表失败:', error)
        this.$apiError.notify(error, this.$t('waterPlanPage.msgMeterListFail'))
      }
    },

    // 构建树形数据结构（新增）
    buildTreeData (data) {
      let treeData = []

      if (this.activeTab === 0) {
        // 专用水表 - 扁平结构
        treeData = (data.privateWaterList || []).map(meter => ({
          id: meter.waterId,
          name: meter.waterName,
          waterId: meter.waterId,
          waterName: meter.waterName,
          disabled: meter.priceId === this.currentPriceId,
          isGroup: false,
          expanded: false,
          children: []
        }))
      } else if (this.activeTab === 1) {
        // 公摊水表 - 包含公摊组和未分组水表

        // 处理公摊组
        if (data.publicWaterList) {
          data.publicWaterList.forEach(group => {
            if (group.waterList && group.waterList.length > 0) {
              treeData.push({
                id: group.id,
                name: group.name,
                isGroup: true,
                expanded: true, // 默认展开
                children: group.waterList.map(water => ({
                  ...water,
                  disabled: water.priceId === this.currentPriceId
                }))
              })
            }
          })
        }

        // 处理未分组的公摊水表
        if (data.noPublicWaterList) {
          data.noPublicWaterList.forEach(water => {
            treeData.push({
              id: water.waterId,
              name: water.waterName,
              waterId: water.waterId,
              waterName: water.waterName,
              disabled: water.priceId === this.currentPriceId,
              isGroup: false,
              expanded: false,
              children: []
            })
          })
        }
      } else {
        // 公式水表 - 扁平结构
        treeData = (data.formulaWaterList || []).map(meter => ({
          id: meter.waterId,
          name: meter.waterName,
          waterId: meter.waterId,
          waterName: meter.waterName,
          disabled: meter.priceId === this.currentPriceId,
          isGroup: false,
          expanded: false,
          children: []
        }))
      }

      this.treeData = treeData
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
               availableChildren.every(m => this.selectedMeterIds.includes(m.waterId))
      } else {
        // 单个水表
        return !group.disabled && this.selectedMeterIds.includes(group.waterId)
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
          const newIds = availableChildren.map(m => m.waterId)
          const currentSet = new Set(this.selectedMeterIds)
          newIds.forEach(id => currentSet.add(id))
          this.selectedMeterIds = Array.from(currentSet)
        } else {
          const removeIds = availableChildren.map(m => m.waterId)
          this.selectedMeterIds = this.selectedMeterIds.filter(id => !removeIds.includes(id))
        }
      } else {
        // 单个水表
        if (group.disabled) return

        const index = this.selectedMeterIds.indexOf(group.waterId)
        if (checked && index === -1) {
          this.selectedMeterIds.push(group.waterId)
        } else if (!checked && index > -1) {
          this.selectedMeterIds.splice(index, 1)
        }
      }
    },

    // 处理单个水表选择（原有逻辑保持）
    handleMeterCheck (meter) {
      if (meter.disabled) return

      const index = this.selectedMeterIds.indexOf(meter.waterId)
      if (index > -1) {
        this.selectedMeterIds.splice(index, 1)
      } else {
        this.selectedMeterIds.push(meter.waterId)
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
                allAvailableIds.push(child.waterId)
              }
            })
          } else if (!group.disabled) {
            allAvailableIds.push(group.waterId)
          }
        })
        this.selectedMeterIds = allAvailableIds
      } else {
        this.selectedMeterIds = []
      }
    },

    // 获取所有可用水表（新增）
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
        this.$message.warning(this.$t('waterPlanPage.msgNoOperate'))
        return
      }
      if (this.selectedMeterIds.length === 0) {
        this.$message.warning(this.$t('waterPlanPage.msgSelectWaters'))
        return
      }

      // 筛选出新增的水表（排除已经绑定的）
      const availableMeters = this.getAllAvailableMeters()
      const newMeterIds = this.selectedMeterIds.filter(id => {
        const meter = availableMeters.find(m => m.waterId === id)
        return meter && !meter.disabled
      })

      if (newMeterIds.length === 0) {
        this.$message.warning(this.$t('waterPlanPage.msgSelectNewWaters'))
        return
      }

      this.$confirm(
        this.$t('waterPlanPage.confirmBindWaters', { count: newMeterIds.length }),
        this.$t('waterPlanPage.titleTip'),
        {
          confirmButtonText: this.$t('waterPlanPage.btnOk'),
          cancelButtonText: this.$t('waterPlanPage.btnCancel'),
          type: 'warning'
        }
      ).then(async () => {
        try {
          const { msg } = await waterPriceBatchBindWater({
            priceId: this.currentPriceId,
            waterIdList: newMeterIds
          })
          this.$message.success(msg || this.$t('waterPlanPage.msgBindOk'))
          this.closeBind()
        } catch (error) {
          console.error('绑定失败:', error)
          this.$apiError.notify(error, this.$t('waterPlanPage.msgBindFail'))
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
    }
  }
}
</script>

<style lang="scss" scoped>
.table-page-container.water-plan-page {
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

.content-toolbar.wp-page-toolbar {
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

.list-view.wp-list-view {
  padding: 0;
}

.plan-water-table.light-border-table {
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

  .water-price-cell {
    font-family: 'SF Mono', ui-monospace, monospace;
    font-weight: 600;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    color: #1677ff;
  }

  .plan-action-group {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    column-gap: 24px;
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

  .form-textarea {
    width: 100%;
    padding: 10px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    color: #1a1a1a;
    transition: all 0.2s;
    resize: vertical;
    min-height: 80px;

    &:hover {
      border-color: #d1d5db;
    }

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }
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

.water-icon {
  font-size: 16px;
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
  .table-page-container.water-plan-page {
    padding: 12px;
  }

  .content-toolbar.wp-page-toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 0 4px 10px;
  }

  .plan-water-table.light-border-table {
    ::v-deep .el-table .cell {
      font-size: 12px;
      padding-left: 8px;
      padding-right: 8px;
    }
  }

  .plan-water-table.light-border-table .plan-action-group {
    column-gap: 18px;
    row-gap: 10px;
    padding: 6px 4px;
  }

  .modal-container {
    max-width: 95%;
  }

  .drawer-container {
    width: 90vw;
  }
}
</style>
