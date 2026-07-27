<template>
  <div class="tenant-detail-wrapper">
    <!-- 左侧租户信息 -->
    <div class="left-sidebar">
      <!-- 返回按钮 -->
      <!-- <div class="back-button-wrapper">
        <el-button icon="el-icon-arrow-left" @click="handleBack" type="text" size="medium">
          返回
        </el-button>
      </div> -->

      <!-- 租户标题 -->
      <div class="tenant-header">
        <h2 class="tenant-name">{{ displayTenantName }}</h2>
        <div class="tenant-meta">
          <el-tag
            :type="isTenantActive ? 'success' : 'info'"
            size="mini"
            effect="plain"
          >
            {{ isTenantActive ? $t('tenantListPage.optStatusNormal') : $t('tenantListPage.optStatusCancelled') }}
          </el-tag>
          <span class="tenant-id">{{ tenantInfo.id || "--" }}</span>
          <el-button type="text" size="mini" @click="handleCopyId">
            {{ $t('tenantDetailPage.btnCopy') }}
          </el-button>
        </div>
      </div>

      <!-- 资产区块（灰色背景统一容器） -->
      <div class="asset-block">
        <!-- 总资产 -->
        <div class="total-asset-row">
          <span class="asset-label">{{ $t('tenantDetailPage.totalAssets') }}</span>
          <span class="asset-amount" :class="getBalanceClass(totalBalance)">
            {{ formatBalance(totalBalance) }}
          </span>
        </div>

        <!-- 电费专户（蓝色卡片）-->
        <div
          class="account-card electric-account"
          :class="{ 'account-disabled': !hasElectricAccount }"
        >
          <div class="account-header">
            <span class="account-title">{{ $t('tenantDetailPage.electricAccount') }}</span>
            <span
              class="account-total"
              :class="getBalanceClass(electricBalance)"
            >
              {{ formatBalance(electricBalance) }}
            </span>
          </div>
          <div class="account-details">
            <span class="detail-item"
              >{{ $t('tenantDetailPage.detailCash') }} {{ formatBalance(electricCash) }}</span
            >
            <span class="detail-item"
              >{{ $t('tenantDetailPage.detailDeduction') }} {{ formatBalance(electricDeduction) }}</span
            >
          </div>
          <!-- 欠费标签 -->
          <!-- <div v-if="hasElectricAccount && electricBalance < 0" class="status-tag danger">
            欠费
          </div> -->
          <!-- 未开户水印 -->
          <div v-if="!hasElectricAccount" class="watermark">{{ $t('tenantDetailPage.watermarkNoAccount') }}</div>
        </div>

        <!-- 水费专户（绿色卡片）-->
        <div
          class="account-card water-account"
          :class="{ 'account-disabled': !hasWaterAccount }"
        >
          <div class="account-header">
            <span class="account-title">{{ $t('tenantDetailPage.waterAccount') }}</span>
            <span class="account-total" :class="getBalanceClass(waterBalance)">
              {{ formatBalance(waterBalance) }}
            </span>
          </div>
          <div class="account-details">
            <span class="detail-item">{{ $t('tenantDetailPage.detailCash') }} {{ formatBalance(waterCash) }}</span>
            <span class="detail-item"
              >{{ $t('tenantDetailPage.detailDeduction') }} {{ formatBalance(waterDeduction) }}</span
            >
          </div>
          <!-- 未开户水印 -->
          <div v-if="!hasWaterAccount" class="watermark">{{ $t('tenantDetailPage.watermarkNoAccount') }}</div>
        </div>
      </div>

      <!-- 详细信息列表 -->
      <div class="info-list">
        <div class="info-item">
          <label>{{ $t('tenantDetailPage.labelPublicArea') }}</label>
          <span>{{ tenantInfo.publicArea || "--" }}m²</span>
        </div>

        <!-- 电费相关信息 -->
        <!-- <div class="info-item">
          <label>电费方案：</label>
          <span class="link-text">{{ tenantInfo.electricPlan || "--" }}</span>
        </div> -->
        <div v-if="hasElectricAccount" class="info-item">
          <label>{{ $t('tenantDetailPage.labelElectricAlarm1') }}</label>
          <span>{{
            formatBalance(tenantInfo.meterAccountDto?.alarmBalance1)
          }}</span>
        </div>
        <div v-if="hasElectricAccount" class="info-item">
          <label>{{ $t('tenantDetailPage.labelElectricAlarm2') }}</label>
          <span>{{
            formatBalance(tenantInfo.meterAccountDto?.alarmBalance2)
          }}</span>
        </div>
        <div v-if="hasElectricAccount" class="info-item">
          <label>{{ $t('tenantDetailPage.labelElectricOverdraw') }}</label>
          <span>{{ formatBalance(tenantInfo.meterAccountDto?.overdraw) }}</span>
        </div>

        <!-- 水费相关信息 -->
        <!-- <div class="info-item">
          <label>水费方案：</label>
          <span class="link-text">{{ tenantInfo.waterPlan || "--" }}</span>
        </div> -->
        <div v-if="hasWaterAccount" class="info-item">
          <label>{{ $t('tenantDetailPage.labelWaterAlarm1') }}</label>
          <span>{{
            formatBalance(tenantInfo.waterAccountDto?.alarmBalance1)
          }}</span>
        </div>
        <div v-if="hasWaterAccount" class="info-item">
          <label>{{ $t('tenantDetailPage.labelWaterAlarm2') }}</label>
          <span>{{
            formatBalance(tenantInfo.waterAccountDto?.alarmBalance2)
          }}</span>
        </div>
        <div v-if="hasWaterAccount" class="info-item">
          <label>{{ $t('tenantDetailPage.labelWaterOverdraw') }}</label>
          <span>{{ formatBalance(tenantInfo.waterAccountDto?.overdraw) }}</span>
        </div>

        <div class="info-item">
          <label>{{ $t('tenantDetailPage.labelCreateTime') }}</label>
          <span>{{ formatDate(tenantInfo.createTime) }}</span>
        </div>
        <template v-if="tenantInfo.phoneList && tenantInfo.phoneList.length">
          <div
            v-for="(phone, index) in tenantInfo.phoneList"
            :key="`${phone}-${index}`"
            class="info-item"
          >
            <label>{{ $t('tenantDetailPage.labelPhoneN', { n: index + 1 }) }}</label>
            <span>{{ phone || '--' }}</span>
          </div>
        </template>
        <div v-else class="info-item">
          <label>{{ $t('tenantDetailPage.labelPhone') }}</label>
          <span>--</span>
        </div>

        <!-- 权限开关 -->
        <!-- <div class="info-item switch-item">
          <label>
            流水权限
            <el-tooltip content="是否允许查看流水" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </label>
          <el-switch
            v-model="tenantInfo.flowPermission"
            disabled
            size="small"
          ></el-switch>
        </div>
        <div class="info-item switch-item">
          <label>
            用能报表
            <el-tooltip content="是否允许查看用能报表" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </label>
          <el-switch
            v-model="tenantInfo.energyReportPermission"
            disabled
            size="small"
          ></el-switch>
        </div>
        <div class="info-item switch-item">
          <label>
            开票权限
            <el-tooltip content="是否允许开票" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </label>
          <el-switch
            v-model="tenantInfo.invoicePermission"
            disabled
            size="small"
          ></el-switch>
        </div>
        <div class="info-item switch-item">
          <label>
            缴费单开票
            <el-tooltip content="是否允许缴费单开票" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </label>
          <el-switch
            v-model="tenantInfo.paymentInvoicePermission"
            disabled
            size="small"
          ></el-switch>
        </div> -->
      </div>

      <!-- 底部操作按钮（一行四个）-->
      <div class="action-buttons">
        <el-button v-if="canCloseAccount" size="small" plain @click="handleCloseAccount"
          >{{ $t('tenantDetailPage.btnCloseAccount') }}</el-button
        >
        <el-button v-if="canRecharge" size="small" plain @click="handleRecharge">{{ $t('tenantDetailPage.btnRecharge') }}</el-button>
        <el-button v-if="canDeduct" size="small" plain @click="handleDeduct">{{ $t('tenantDetailPage.btnDeduct') }}</el-button>
        <el-button v-if="canEdit" size="small" type="primary" @click="handleEdit"
          >{{ $t('tenantDetailPage.btnEdit') }}</el-button
        >
        <span v-if="!canCloseAccount && !canRecharge && !canDeduct && !canEdit">-</span>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="right-content">
      <!-- 主要Tab导航 -->
      <el-tabs
        v-model="activeMainTab"
        @tab-click="handleMainTabChange"
        class="main-tabs"
      >
        <!-- 设备Tab -->
        <el-tab-pane :label="$t('tenantDetailPage.tabDevice')" name="device">
          <TenantDevices
            v-if="tenantInfo.id"
            :tenant-id="tenantInfo.id"
            :manager-id="$store.getters['manager/currentManagerId'] || ''"
          />
        </el-tab-pane>

        <!-- 用能报表 -->
        <el-tab-pane :label="$t('tenantDetailPage.tabStatistics')" name="statistics">
          <div class="statistics-wrapper">
            <EnergyStatistics
              v-if="tenantInfo.id"
              :tenant-id="tenantInfo.id"
              :key="statisticsKey"
            />
          </div>
        </el-tab-pane>

        <!-- 账单 -->
        <el-tab-pane :label="$t('tenantDetailPage.tabBill')" name="bill">
          <TenantBills
            v-if="tenantInfo.id && activeMainTab === 'bill'"
            :tenant-id="tenantInfo.id"
            :manager-id="$store.getters['manager/currentManagerId'] || ''"
          />
        </el-tab-pane>

        <!-- 资金流水 -->
        <el-tab-pane :label="$t('tenantDetailPage.tabTurnover')" name="turnover">
          <TenantTurnover
            v-if="tenantInfo.id && activeMainTab === 'turnover'"
            :tenant-id="tenantInfo.id"
            :manager-id="$store.getters['manager/currentManagerId'] || ''"
          />
        </el-tab-pane>

        <!-- 退款记录 -->
        <el-tab-pane :label="$t('tenantDetailPage.tabRefund')" name="refund">
          <div class="empty-wrapper">
            <el-empty :description="$t('tenantDetailPage.emptyNotOpen')" :image-size="100" />
          </div>
        </el-tab-pane>

        <!-- 开票记录 -->
        <el-tab-pane :label="$t('tenantDetailPage.tabInvoice')" name="invoice">
          <div class="empty-wrapper">
            <el-empty :description="$t('tenantDetailPage.emptyNotOpen')" :image-size="100" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 新增/编辑租户弹窗 -->
    <AddTenantDialog
      :visible.sync="editDialogVisible"
      :tenant-data="editForm"
      :label-list="labelList"
      :manager-id="currentManagerId"
      @success="handleEditSuccess"
    />

    <!-- 手动充值弹窗 -->
    <RechargeDialog
      :visible.sync="rechargeVisible"
      :tenant-data="currentTenant"
      @success="handleRechargeSuccess"
    />

    <!-- 手动扣款弹窗 -->
    <DeductDialog
      :visible.sync="deductVisible"
      :tenant-data="currentTenant"
      @success="handleDeductSuccess"
    />
  </div>
</template>

<script>
import { tenantPageTenant } from '@/api/tenant'
import { labelList } from '@/api/label'
import { mapGetters } from 'vuex'
import EnergyStatistics from './components/EnergyStatistics.vue'
import TenantDevices from './components/TenantDevices.vue'
import TenantBills from './components/TenantBills.vue'
import TenantTurnover from './components/TenantTurnover.vue'
import AddTenantDialog from './components/AddTenantDialog.vue'
import RechargeDialog from './components/RechargeDialog.vue'
import DeductDialog from './components/DeductDialog.vue'

export default {
  name: 'TenantDetail',
  components: {
    EnergyStatistics,
    TenantDevices,
    TenantBills,
    TenantTurnover,
    AddTenantDialog,
    RechargeDialog,
    DeductDialog
  },
  data () {
    return {
      tenantInfo: {},
      loading: false,

      // 主标签页
      activeMainTab: 'device',

      // 用能报表key，用于强制刷新
      statisticsKey: 0,

      // 弹窗状态
      editDialogVisible: false,
      rechargeVisible: false,
      deductVisible: false,

      // 当前操作的租户
      currentTenant: {},
      editForm: {},

      // 标签列表
      labelList: []
    }
  },

  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map((v) => String(v)))
      return (menuNo) => allow.has(String(menuNo))
    },
    canView () {
      return this.hasKztPermission('660011')
    },
    canEdit () {
      return this.hasKztPermission('660014')
    },
    canDeduct () {
      return this.hasKztPermission('660012')
    },
    canRecharge () {
      return this.hasKztPermission('660016')
    },
    canCloseAccount () {
      return this.hasKztPermission('660015')
    },

    // 是否有电费专户
    hasElectricAccount () {
      return (
        this.tenantInfo.meterStatus === 1 && this.tenantInfo.meterAccountDto
      )
    },

    // 是否有水费专户
    hasWaterAccount () {
      return (
        this.tenantInfo.waterStatus === 1 && this.tenantInfo.waterAccountDto
      )
    },

    // 电费余额
    electricBalance () {
      return this.tenantInfo.meterAccountDto?.balance || 0
    },

    // 电费现金
    electricCash () {
      return this.tenantInfo.meterAccountDto?.realAmt || 0
    },

    // 电费抵扣金
    electricDeduction () {
      return this.tenantInfo.meterAccountDto?.discountAmt || 0
    },

    // 水费余额
    waterBalance () {
      return this.tenantInfo.waterAccountDto?.balance || 0
    },

    // 水费现金
    waterCash () {
      return this.tenantInfo.waterAccountDto?.realAmt || 0
    },

    // 水费抵扣金
    waterDeduction () {
      return this.tenantInfo.waterAccountDto?.discountAmt || 0
    },

    // 总资产（电费 + 水费）
    totalBalance () {
      return this.electricBalance + this.waterBalance
    },

    /** 租户状态：未返回时按「正常」展示，与列表页 0/1 语义一致 */
    isTenantActive () {
      const s = this.tenantInfo.tenantStatus
      if (s === undefined || s === null) return true
      return s === 0
    },

    /** 英文界面：租户名词典+拼音；中文原样 */
    displayTenantName () {
      const raw = (this.tenantInfo.name || '').trim()
      if (!raw) return '--'
      return this.$displayBizHybrid(raw)
    }
  },

  mounted () {
    if (!this.canView) {
      this.$message.warning(this.$t('tenantDetailPage.msgNoViewPerm'))
      this.$router.replace({ name: 'TenantList' })
      return
    }
    this.initPageData()
  },

  methods: {
    // ==================== 初始化相关方法 ====================

    // 初始化页面数据
    async initPageData () {
      const tenantId = this.$route.params.id
      if (!tenantId) {
        this.$message.error(this.$t('tenantDetailPage.msgTenantIdEmpty'))
        this.handleBack()
        return
      }

      await this.fetchTenantDetail(tenantId)
      await this.fetchLabelList()
    },

    // 获取标签列表
    async fetchLabelList () {
      try {
        const response = await labelList({
          managerId: this.currentManagerId,
          type: 1
        })
        if (response.code === 200) {
          this.labelList = response.data || []
        }
      } catch (error) {
        console.error('获取标签列表失败:', error)
      }
    },

    // 获取租户详情
    async fetchTenantDetail (id) {
      this.loading = true
      try {
        const params = {
          id: id,
          managerId: this.currentManagerId,
          labelIds: '',
          balanceStatus: null,
          tenantStatus: 0,
          idList: [],
          page: {
            current: 1,
            size: 1,
            orders: [{ asc: true, column: 'id' }]
          }
        }

        const response = await tenantPageTenant(params)
        if (
          response.code === 200 &&
          response.data &&
          response.data.dataList &&
          response.data.dataList.length > 0
        ) {
          this.tenantInfo = response.data.dataList[0]
          console.log('租户详情:', this.tenantInfo)
        } else {
          this.$message.error(this.$t('tenantDetailPage.msgTenantNotFound'))
          this.handleBack()
        }
      } catch (error) {
        this.$apiError.notify(error, this.$t('tenantDetailPage.msgFetchFail'))
        console.error('获取租户详情失败:', error)
        this.handleBack()
      } finally {
        this.loading = false
      }
    },

    // ==================== 复制ID ====================
    handleCopyId () {
      const id = this.tenantInfo.id
      if (!id) {
        this.$message.warning(this.$t('tenantDetailPage.msgIdEmpty'))
        return
      }

      // 创建临时input元素
      const input = document.createElement('input')
      input.value = id
      document.body.appendChild(input)
      input.select()

      try {
        document.execCommand('copy')
        this.$message.success(this.$t('tenantDetailPage.msgCopyOk'))
      } catch (err) {
        this.$apiError.notify(err, this.$t('tenantDetailPage.msgCopyFail'))
      } finally {
        document.body.removeChild(input)
      }
    },

    // ==================== 操作按钮相关方法 ====================

    // 销户
    handleCloseAccount () {
      if (!this.canCloseAccount) {
        this.$message.warning(this.$t('tenantDetailPage.msgNoClosePerm'))
        return
      }
      this.$message.warning(this.$t('tenantDetailPage.msgCloseNotSupported'))
    },

    // 充值
    handleRecharge () {
      if (!this.canRecharge) {
        this.$message.warning(this.$t('tenantDetailPage.msgNoRechargePerm'))
        return
      }
      this.currentTenant = this.tenantInfo
      this.rechargeVisible = true
    },

    // 扣款
    handleDeduct () {
      if (!this.canDeduct) {
        this.$message.warning(this.$t('tenantDetailPage.msgNoDeductPerm'))
        return
      }
      this.currentTenant = this.tenantInfo
      this.deductVisible = true
    },

    // 编辑
    handleEdit () {
      if (!this.canEdit) {
        this.$message.warning(this.$t('tenantDetailPage.msgNoEditPerm'))
        return
      }
      this.editForm = { ...this.tenantInfo }
      this.editDialogVisible = true
    },

    // 充值成功
    handleRechargeSuccess () {
      this.rechargeVisible = false
      this.fetchTenantDetail(this.tenantInfo.id)
    },

    // 扣款成功
    handleDeductSuccess () {
      this.deductVisible = false
      this.fetchTenantDetail(this.tenantInfo.id)
    },

    // 编辑成功
    handleEditSuccess () {
      this.editDialogVisible = false
      this.fetchTenantDetail(this.tenantInfo.id)
    },

    // ==================== 标签页切换相关方法 ====================

    // 主标签页切换
    handleMainTabChange (tab) {
      this.activeMainTab = tab.name

      if (tab.name === 'statistics') {
        // 强制刷新用能报表组件
        this.statisticsKey++
      }
    },

    // ==================== 通用工具方法 ====================

    // 返回
    handleBack () {
      this.$router.go(-1)
    },

    // 格式化余额
    formatBalance (balance) {
      if (balance === null || balance === undefined) return '0.00'
      return Number(balance).toFixed(2)
    },

    // 格式化日期
    formatDate (date) {
      if (!date) return '--'
      const d = new Date(date)
      if (isNaN(d.getTime())) return '--'
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(d.getDate()).padStart(2, '0')} ${String(
        d.getHours()
      ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },

    // 获取余额样式类
    getBalanceClass (balance) {
      const num = Number(balance)
      if (num < 0) return 'balance-danger'
      if (num < 100) return 'balance-warning'
      return 'balance-success'
    }
  }
}
</script>

<style lang="scss" scoped>
// ==================== 变量定义 ====================
$primary-color: #409eff;
$primary-light: #66b1ff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$info-color: #909399;
$text-primary: #303133;
$text-regular: #606266;
$text-secondary: #909399;
$border-color: #dcdfe6;
$border-light: #e4e7ed;
$bg-color: #f5f7fa;

// 左侧栏宽度
$sidebar-width: 380px;

// ==================== 主容器布局 ====================
.tenant-detail-wrapper {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: $bg-color;
  height: 100%;
  overflow: hidden;

  // ==================== 左侧租户信息 ====================
  .left-sidebar {
    width: $sidebar-width;
    flex-shrink: 0;
    height: 100%;
    overflow: hidden;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    padding: 20px;
    display: flex;
    flex-direction: column;

    // 返回按钮
    .back-button-wrapper {
      margin-bottom: 16px;
      flex-shrink: 0;

      .el-button {
        padding: 8px 12px;
        font-size: 14px;
        color: $text-regular;

        &:hover {
          color: $primary-color;
        }
      }
    }

    // 租户标题区
    .tenant-header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid $border-light;
      flex-shrink: 0;

      .tenant-name {
        font-size: 20px;
        font-weight: 600;
        color: $text-primary;
        margin: 0 0 8px 0;
        word-break: break-all;
      }

      .tenant-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .tenant-id {
          color: $text-secondary;
          font-size: 13px;
        }

        .el-button {
          padding: 0;
          font-size: 12px;
          margin-left: 4px;
        }
      }
    }

    // ==================== 资产区块 ====================
    .asset-block {
      margin-bottom: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      flex-shrink: 0;

      // 总资产行
      .total-asset-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);

        .asset-label {
          font-size: 14px;
          color: $text-secondary;
          font-weight: 500;
        }

        .asset-amount {
          font-size: 28px;
          font-weight: 700;
          color: $text-primary;
          font-family: "DIN Alternate", "Helvetica Neue", Arial, sans-serif;

          &.balance-success {
            color: $success-color;
          }

          &.balance-warning {
            color: $warning-color;
          }

          &.balance-danger {
            color: $danger-color;
          }
        }
      }

      // 账户卡片
      .account-card {
        margin-bottom: 12px;
        padding: 16px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        position: relative;
        overflow: hidden;
        min-height: 88px; // 固定最小高度，保持盒子大小一致

        &:last-child {
          margin-bottom: 0;
        }

        // 电费专户
        &.electric-account {
          background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
          color: white;

          .account-header {
            border-bottom-color: rgba(255, 255, 255, 0.2);
          }

          // 未开户时的置灰样式（相对于蓝色系的饱和度降低）
          &.account-disabled {
            background: linear-gradient(135deg, #a0c8f5 0%, #b8d8ff 100%);
            filter: saturate(0.5) brightness(1.1);
          }
        }

        // 水费专户
        &.water-account {
          background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
          color: white;

          .account-header {
            border-bottom-color: rgba(255, 255, 255, 0.2);
          }

          // 未开户时的置灰样式（相对于绿色系的饱和度降低）
          &.account-disabled {
            background: linear-gradient(135deg, #a8d68d 0%, #c0e0a8 100%);
            filter: saturate(0.5) brightness(1.1);
          }
        }

        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);

          .account-title {
            font-size: 14px;
            font-weight: 600;
            opacity: 0.95;
          }

          .account-total {
            font-size: 22px;
            font-weight: 700;
            font-family: "DIN Alternate", "Helvetica Neue", Arial, sans-serif;

            &.balance-danger {
              color: #fff;
            }
          }
        }

        .account-details {
          display: flex;
          justify-content: space-between;
          gap: 16px;

          .detail-item {
            font-size: 13px;
            opacity: 0.9;
            white-space: nowrap;
          }
        }

        .status-tag {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;

          &.danger {
            background: rgba(255, 255, 255, 0.25);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.4);
          }
        }

        // 未开户水印
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-15deg);
          font-size: 32px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
          pointer-events: none;
          user-select: none;
          white-space: nowrap;
          letter-spacing: 4px;
        }
      }
    }

    // ==================== 详细信息列表 ====================
   // ==================== 详细信息列表 ====================
.info-list {
  flex: 1;
  margin-bottom: 20px;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;

  .info-item {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f5f7fa;
    font-size: 13px;
    min-height: 40px;

    &:last-child {
      border-bottom: none;
    }

    label {
      color: $text-secondary;
      flex-shrink: 0;
      margin-right: 8px;
      display: flex;
      align-items: center;
      gap: 4px;

      .el-icon-question {
        font-size: 14px;
        color: $info-color;
        cursor: help;
      }
    }

    span {
      color: $text-primary;
      text-align: left;
      font-weight: 500;
      word-break: break-all;

      &.link-text {
        color: $primary-color;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .info-item.switch-item {
    // justify-content: space-between !important;
  }
}

    // ==================== 底部操作按钮 ====================
    .action-buttons {
      margin-top: auto;
      padding-top: 20px;
      border-top: 1px solid $border-light;
      flex-shrink: 0;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: white;
      position: relative;
      z-index: 1;

      .el-button {
        margin: 0;
        padding: 9px 8px;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  // ==================== 右侧内容区 ====================
  .right-content {
    flex: 1;
    min-width: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;

    // 主Tab导航
    .main-tabs {
      height: 100%;
      display: flex;
      flex-direction: column;

      ::v-deep .el-tabs__header {
        margin: 0;
        padding: 0 24px;
        background: #fafbfc;
        border-bottom: 2px solid $border-light;
        flex-shrink: 0;
      }

      ::v-deep .el-tabs__nav-wrap {
        &::after {
          display: none;
        }
      }

      ::v-deep .el-tabs__item {
        height: 56px;
        line-height: 56px;
        font-size: 15px;
        font-weight: 500;
        color: $text-regular;
        padding: 0 20px;

        &:hover {
          color: $primary-color;
        }

        &.is-active {
          color: $primary-color;
        }
      }

      ::v-deep .el-tabs__active-bar {
        height: 3px;
        background: $primary-color;
      }

      ::v-deep .el-tabs__content {
        flex: 1;
        padding: 24px;
        overflow: hidden;
        min-height: 0;
      }

      ::v-deep .el-tab-pane {
        height: 100%;
        padding: 0 !important;
        margin: 0 !important;
      }

      // ==================== 用能报表包装器 ====================
      .statistics-wrapper {
        height: 100%;
        display: flex;
        flex-direction: column;

        ::v-deep .energy-statistics {
          flex: 1;
          display: flex;
          flex-direction: column;

          .chart-container {
            flex: 1;
            min-height: 0;
            display: flex;
            align-items: center;
            justify-content: center;

            .echarts {
              width: 100% !important;
              height: 100% !important;
            }
          }
        }
      }

      // ==================== 空状态容器 ====================
      .empty-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 0;
      }
    }
  }
}

// ==================== 滚动条样式统一 ====================
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c4cd;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a6a9b0;
}
</style>
