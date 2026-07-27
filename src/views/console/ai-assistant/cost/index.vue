<template>
  <div class="cost-page" v-loading="pageLoading" element-loading-text="正在加载成本管理...">
    <el-empty v-if="!canView" description="暂无查看权限" />
    <template v-else>
      <!-- 顶部统计区域 2:3:5 比例 -->
      <div class="page-header-section">
        <!-- 左侧：时间选择与账户信息 (2) -->
        <div class="header-left-section">
          <div class="year-control">
            <span class="section-label">统计年度</span>
            <div class="year-picker-wrapper">
              <el-date-picker
                v-model="currentYear"
                type="year"
                format="yyyy年"
                value-format="yyyy"
                placeholder="选择年份"
                :clearable="false"
                @change="handleYearChange"
                class="custom-year-picker"
                size="small"
              />
              <div class="year-steppers">
                <el-button type="text" size="mini" @click="stepYear(-1)">
                  <i class="el-icon-arrow-left"></i>
                </el-button>
                <el-button type="text" size="mini" @click="stepYear(1)">
                  <i class="el-icon-arrow-right"></i>
                </el-button>
              </div>
            </div>
          </div>

          <div class="account-info-card" v-if="accountInfo">
            <div class="info-row">
              <span class="info-label">户号</span>
              <span class="info-value">{{ accountInfo.accountNo || '暂未上传' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">户名</span>
              <span class="info-value account-name">{{ accountInfo.accountName || '暂未上传' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">售电容量</span>
              <el-tag v-if="accountInfo.capacity && accountInfo.capacity !== '-'" size="small" type="primary" effect="light" class="capacity-tag">
                {{ accountInfo.capacity }} kVA
              </el-tag>
              <span v-else class="info-value">暂未上传</span>
            </div>
          </div>
          <div v-else class="account-info-empty">
            <i class="el-icon-info"></i>
            <span>暂无账户信息</span>
          </div>
        </div>

        <!-- 中间：核心指标 (3) -->
        <div class="header-middle-section">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-icon icon-blue">
                <i class="el-icon-s-data"></i>
              </div>
              <div class="metric-content">
                <div class="metric-label">成本电费</div>
                <div class="metric-value">
                  <span class="currency">¥</span>
                  <span class="number">{{ formatCurrencyYuan(chartMetrics.systemTotalYuan || 0) }}</span>
                </div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon icon-green">
                <i class="el-icon-document-checked"></i>
              </div>
              <div class="metric-content">
                <div class="metric-label">应收电费</div>
                <div class="metric-value">
                  <span class="currency">¥</span>
                  <span class="number">{{ formatCurrencyYuan(chartMetrics.auditTotalYuan || 0) }}</span>
                </div>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-icon icon-orange">
                <i class="el-icon-warning-outline"></i>
              </div>
              <div class="metric-content">
                <div class="metric-label">差异电费</div>
                <div class="metric-value" :class="(chartMetrics.diffSystemMinusAuditYuan || 0) >= 0 ? 'text-danger' : 'text-success'">
                  <span class="currency">¥</span>
                  <span class="number">{{ formatCurrencyYuan(Math.abs(chartMetrics.diffSystemMinusAuditYuan || 0)) }}</span>
                </div>
              </div>
            </div>

            <div class="metric-card ai-card" @mouseenter="aiHover = true" @mouseleave="aiHover = false">
              <div class="ai-content">
                <div class="ai-icon">
                  <i class="el-icon-magic-stick"></i>
                </div>
                <div class="ai-text">AI 智能分析</div>
                <div class="ai-sub">差异原因诊断</div>
              </div>

              <!-- AI建议浮层 -->
              <div class="ai-popover" v-show="aiHover">
                <div class="popover-header">
                  <i class="el-icon-magic-stick"></i>
                  <span>AI 分析建议</span>
                </div>
                <div class="popover-body">
                  <div v-for="(item, idx) in aiSuggestionItems" :key="idx" class="suggestion-item">
                    <div class="suggestion-dot" :class="item.level"></div>
                    <div class="suggestion-text">{{ item.text }}</div>
                  </div>
                  <div v-if="!aiSuggestionItems.length" class="suggestion-empty">
                    <i class="el-icon-info"></i>
                    <span>暂无可分析建议：核查联对比数据未生成或当前年度无可对比月份</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：图表 (5) -->
        <div class="header-right-section">
          <div class="chart-wrapper">
            <div class="chart-header-mini">
              <span class="chart-title">真实电费 vs 核查联</span>
              <!-- <el-tooltip content="查看完整对比分析" placement="top">
                <i class="el-icon-full-screen chart-expand" @click="handleGoToChart"></i>
              </el-tooltip> -->
            </div>
            <RealVsAuditChart :compact="true" :emit-metrics="true" :year="currentYear" @chart-metrics="handleChartMetrics" />
          </div>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar-section">
        <div class="toolbar-left">
          <span class="toolbar-title">核查联明细</span>
          <span class="toolbar-count">共 {{ sessionList.length }} 条记录</span>
        </div>
        <div class="toolbar-right">
          <span class="view-label">视图切换</span>
          <el-radio-group v-model="cardCols" size="small">
            <el-radio-button :label="2">
              <i class="el-icon-s-grid"></i> 2列
            </el-radio-button>
            <el-radio-button :label="3">
              <i class="el-icon-menu"></i> 3列
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 账单卡片列表 -->
      <div class="cost-card-grid" :class="`cols-${cardCols}`">
        <!-- 新建核查联卡片 -->
        <div v-if="canControl" class="bill-card add-card" @click="goToCreate">
          <div class="add-content">
            <div class="add-icon">
              <i class="el-icon-plus"></i>
            </div>
            <div class="add-title">新建核查联</div>
            <div class="add-desc">上传新的电费核查联文件</div>
          </div>
        </div>

        <div v-for="(session, sIndex) in sessionList" :key="sIndex" class="bill-card">
          <div class="bill-card-header">
            <div class="header-main">
              <div class="month-badge">
                <span class="month-num">{{ formatMonth(session).replace('月', '') }}</span>
                <span class="month-unit">月</span>
              </div>
              <div class="date-range">
                <i class="el-icon-date"></i>
                {{ formatDateRange(session) }}
              </div>
            </div>
            <div class="header-summary">
              <div class="amount-block">
                <div class="amount-label">本期电费合计</div>
                <div class="amount-value">
                  <span class="currency">¥</span>
                  {{ formatNumber(calcSessionTotal(session)) }}
                </div>
              </div>
            </div>
          </div>

          <div class="bill-card-body">
            <div class="meter-table-wrapper">
              <table class="meter-compare-table">
                <thead>
                  <tr>
                    <th class="row-header">项目 / 计量点</th>
                    <th v-for="(point, pIndex) in getMeterPoints(session)" :key="pIndex">
                      计量点 {{ pIndex + 1 }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="row-header">功率因数</td>
                    <td v-for="(point, pIndex) in getMeterPoints(session)" :key="pIndex" class="cell-value">
                      {{ point.reactivePower ? point.reactivePower.powerFactor : '-' }}%
                    </td>
                  </tr>
                  <tr>
                    <td class="row-header">增减率</td>
                    <td v-for="(point, pIndex) in getMeterPoints(session)" :key="pIndex" class="cell-value">
                      <span :class="getChangeRateClass(point)">
                        {{ point.reactivePower ? point.reactivePower.changeRate : '-' }}%
                      </span>
                    </td>
                  </tr>
                  <tr class="divider-row">
                    <td colspan="100%"></td>
                  </tr>
                  <tr>
                    <td class="row-header">基本电费</td>
                    <td v-for="(point, pIndex) in getMeterPoints(session)" :key="pIndex" class="cell-value">
                      ¥{{ formatNumber(point.basicCharge ? point.basicCharge.amount : 0) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="row-header">无功力调金额</td>
                    <td v-for="(point, pIndex) in getMeterPoints(session)" :key="pIndex" class="cell-value">
                      ¥{{ formatNumber(point.reactivePower ? point.reactivePower.adjustAmount : 0) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="row-header">有功电量金额</td>
                    <td v-for="(point, pIndex) in getMeterPoints(session)" :key="pIndex" class="cell-value">
                      ¥{{ formatNumber(calcPointEnergyAmount(point), 4) }}
                    </td>
                  </tr>
                  <tr>
                    <td class="row-header">有功力调金额</td>
                    <td v-for="(point, pIndex) in getMeterPoints(session)" :key="pIndex" class="cell-value">
                      ¥{{ formatNumber(calcPointAdjustAmount(point)) }}
                    </td>
                  </tr>
                  <tr class="total-row">
                    <td class="row-header">小计金额</td>
                    <td v-for="(point, pIndex) in getMeterPoints(session)" :key="pIndex" class="cell-value">
                      <span class="total-highlight">¥{{ formatNumber(calcPointTotalAmount(point)) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="bill-card-footer">
            <el-button type="text" size="small" @click="openEdit(session)">
              <i class="el-icon-edit-outline"></i> {{ canControl ? '编辑详情' : '查看详情' }}
            </el-button>
            <el-button v-if="canControl" type="text" size="small" class="btn-reparse" @click="goToCreate">
              <i class="el-icon-refresh-right"></i> 重新解析
            </el-button>
          </div>
        </div>
      </div>

      <!-- 抽屉组件：编辑详情 - 恢复闭环样式 -->
      <el-drawer
        title="电费明细核查"
        :visible.sync="editVisible"
        size="60%"
        direction="rtl"
        custom-class="cost-drawer"
        :before-close="handleClose"
      >
        <div class="drawer-content" v-if="activeSession">
          <!-- 顶部信息 -->
          <div class="drawer-header-info">
            <div class="info-left">
              <!-- <div class="account-name">{{ activeSession.accountName || '暂未上传' }}</div> -->
              <div class="billing-period">
                <span class="label">所属账期：{{ activePoint.billingPeriod && activePoint.billingPeriod.startDate ? activePoint.billingPeriod.startDate : '暂未上传' }}
                  至
                  {{ activePoint.billingPeriod && activePoint.billingPeriod.endDate ? activePoint.billingPeriod.endDate : '暂未上传' }}</span>
                <!-- <span class="value">{{ activeSession.billingPeriod || '暂未上传' }}</span> -->
              </div>
            </div>
            <div class="info-right">
              <div class="total-amount-wrapper">
                <span class="label">本期电费合计</span>
                <span class="amount">
                  <span class="currency">¥</span>
                  {{ formatNumber(calcTotalAmount(activeSession)) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 计量点Tab切换 -->
          <el-tabs v-model="activePointIndexStr" type="card" class="point-tabs">
            <el-tab-pane
              v-for="(point, index) in getMeterPoints(activeSession)"
              :key="index"
              :label="`计量点 ${index + 1}`"
              :name="String(index)"
            >
            </el-tab-pane>
          </el-tabs>

          <div class="point-edit-area">
            <div class="info-card">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="户号">{{ activePoint.accountNo || '暂未上传' }}</el-descriptions-item>
                <el-descriptions-item label="计费周期">
                  {{ activePoint.billingPeriod && activePoint.billingPeriod.startDate ? activePoint.billingPeriod.startDate : '暂未上传' }}
                  至
                  {{ activePoint.billingPeriod && activePoint.billingPeriod.endDate ? activePoint.billingPeriod.endDate : '暂未上传' }}
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="section-block">
              <div class="section-header">
                <span class="title">基本电费</span>
              </div>
              <div class="form-grid">
                <div class="form-item">
                  <span class="label">受电容量</span>
                  <el-input v-model="activePoint.basicCharge.receivingCapacity" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item">
                  <span class="label">需量示数</span>
                  <el-input v-model="activePoint.basicCharge.demandReading" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item">
                  <span class="label">乘率</span>
                  <el-input v-model="activePoint.basicCharge.multiplier" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item">
                  <span class="label">实际需量</span>
                  <el-input v-model="activePoint.basicCharge.actualDemand" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item">
                  <span class="label">核定需量</span>
                  <el-input v-model="activePoint.basicCharge.approvedDemand" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item">
                  <span class="label">超容量</span>
                  <el-input v-model="activePoint.basicCharge.exceedDemand" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item">
                  <span class="label">计费容量</span>
                  <el-input v-model="activePoint.basicCharge.billingCapacity" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item">
                  <span class="label">单价</span>
                  <el-input v-model="activePoint.basicCharge.unitPrice" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item">
                  <span class="label">金额</span>
                  <el-input v-model="activePoint.basicCharge.amount" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item full-width">
                  <span class="label">核对公式</span>
                  <div class="formula-display">{{ activePoint.basicCharge.verification || '暂未上传' }}</div>
                </div>
              </div>
            </div>

            <div class="section-block">
              <div class="section-header">
                <span class="title">无功电量</span>
              </div>
              <div class="form-grid">
                <div class="form-item">
                  <span class="label">总无功</span>
                  <el-input v-model="activePoint.reactivePower.totalReactive" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item">
                  <span class="label">总有功</span>
                  <el-input v-model="activePoint.reactivePower.totalActive" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item">
                  <span class="label">功率因数</span>
                  <el-input v-model="activePoint.reactivePower.powerFactor" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item">
                  <span class="label">增减率</span>
                  <el-input v-model="activePoint.reactivePower.changeRate" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
                <div class="form-item full-width">
                  <span class="label">力调金额</span>
                  <el-input v-model="activePoint.reactivePower.adjustAmount" size="small" :disabled="!canControl" placeholder="暂未上传" />
                </div>
              </div>
            </div>

            <div class="section-block" v-if="activePoint.meterReadings && activePoint.meterReadings.length">
              <div class="section-header">
                <span class="title">有功电量分时明细</span>
              </div>

              <div v-for="(reading, rIndex) in activePoint.meterReadings" :key="rIndex" class="reading-sub-card">
                <div class="reading-header">
                  <span class="badge">计量表 {{ rIndex + 1 }}</span>
                  <span class="summary">
                    乘率: {{ reading.multiplier }} |
                    合计电量: {{ formatNumber(calcReadingUsageTotal(reading)) }} kWh |
                    金额: ¥{{ formatNumber(calcReadingAmountTotal(reading)) }}
                  </span>
                </div>

                <table class="simple-table">
                  <thead>
                    <tr>
                      <th>时段</th>
                      <th width="80">乘率</th>
                      <th>电量(kWh)</th>
                      <th>电价(元/kWh)</th>
                      <th>金额(元)</th>
                      <th>力调金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="segmentKey in segmentOrder" :key="segmentKey" v-if="reading.segments && reading.segments[segmentKey]">
                      <td>{{ getSegmentLabel(segmentKey) }}</td>
                      <td><el-input v-model="reading.segments[segmentKey].multiplier" size="mini" :disabled="!canControl" placeholder="暂未上传" /></td>
                      <td><el-input v-model="reading.segments[segmentKey].usage" size="mini" :disabled="!canControl" placeholder="暂未上传" /></td>
                      <td><el-input v-model="reading.segments[segmentKey].price" size="mini" :disabled="!canControl" placeholder="暂未上传" /></td>
                      <td><el-input v-model="reading.segments[segmentKey].amount" size="mini" :disabled="!canControl" placeholder="暂未上传" /></td>
                      <td><el-input v-model="reading.segments[segmentKey].adjustAmount" size="mini" :disabled="!canControl" placeholder="暂未上传" /></td>
                    </tr>
                    <tr class="total-row">
                      <td>小计</td>
                      <td></td>
                      <td>{{ formatNumber(calcReadingUsageTotal(reading)) }}</td>
                      <td></td>
                      <td>¥{{ formatNumber(calcReadingAmountTotal(reading)) }}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="drawer-footer">
            <el-button @click="editVisible = false">取消</el-button>
            <el-button v-if="canControl" type="primary" :loading="saving" @click="handleSave">
              <i class="el-icon-check"></i> 保存修改
            </el-button>
          </div>
        </div>
      </el-drawer>
    </template>
  </div>
</template>

<script>
import RealVsAuditChart from '@/views/console/dashboard/components/charts/RealVsAuditChart.vue'
import { getEbvRecordList, editEbvRecord } from '@/api/ebvRecord'
import { mapGetters } from 'vuex'

export default {
  name: 'AIAssistantCostPage',
  components: {
    RealVsAuditChart
  },
  data () {
    return {
      currentYear: '2026',
      sessionList: [],
      editVisible: false,
      activeSession: null,
      activePointIndexStr: '0',
      segmentOrder: ['tip', 'peak', 'flat', 'valley', 'deep'],
      saving: false,
      loading: false,
      pageLoading: true,
      cardCols: 2,
      aiHover: false,
      chartMetrics: {}
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    ...mapGetters(['kztMenuNos']),
    hasKztPermission () {
      const allow = new Set((this.kztMenuNos || []).map(v => String(v)))
      return menuNo => allow.has(String(menuNo))
    },
    canControl () {
      return this.hasKztPermission('670050')
    },
    canView () {
      return this.hasKztPermission('670051')
    },
    accountInfo () {
      if (!this.sessionList.length) return null
      const firstPoint = this.getMeterPoints(this.sessionList[0])[0]
      if (!firstPoint) return null
      return {
        accountNo: firstPoint.accountNo,
        accountName: firstPoint.accountName,
        capacity: firstPoint.basicCharge ? firstPoint.basicCharge.receivingCapacity : '-'
      }
    },
    activePoint () {
      if (!this.activeSession) return null
      const points = this.getMeterPoints(this.activeSession)
      const index = parseInt(this.activePointIndexStr)
      return points[index] || points[0] || null
    },
    aiSuggestionItems () {
      const hasData = !!(this.chartMetrics && this.chartMetrics.hasData)
      if (!hasData) return []

      const expectedMonthCount = Number(this.chartMetrics.expectedMonthCount || 0)
      const missing = Array.isArray(this.chartMetrics.missingAuditMonths)
        ? this.chartMetrics.missingAuditMonths.filter(Boolean)
        : []

      if (this.chartMetrics.hasMissingAudit) {
        const yearText = this.currentYear ? `${this.currentYear}年` : '当前统计区间'
        const missText = missing.length ? missing.join('、') : '部分月份'
        const allMissing = expectedMonthCount > 0 && missing.length >= expectedMonthCount
        if (allMissing) {
          return [
            { level: 'danger', text: `${yearText}电费核查联尚未上传（应收电费为 0），AI 未能形成差异原因分析。` },
            { level: 'info', text: '建议先上传任意月份核查联后再查看；或切换到核查联已上传的年度。' }
          ]
        }
        return [
          { level: 'danger', text: `${yearText}核查联上传不完整（缺失：${missText}），AI 未能形成差异原因分析。` },
          { level: 'info', text: '建议补齐缺失月份后再进行差异诊断，避免因缺数导致误判。' }
        ]
      }

      const diff = Number(this.chartMetrics.diffSystemMinusAuditWan || 0)
      const matchRate = Number(this.chartMetrics.matchRate || 0)
      const absDiff = Math.abs(diff)

      const diffHint = diff >= 0 ? '系统成本电费偏高' : '核查应收电费偏高'
      const diffLevel = absDiff >= 10 ? 'warning' : 'info'
      const matchLevel = matchRate >= 90 ? 'info' : 'danger'

      return [
        { level: 'warning', text: `${diffHint}。建议优先核查差异在各月份的形成原因。` },
        { level: matchLevel, text: `一致率为 ${matchRate.toFixed(1)}%。${matchRate >= 90 ? '当前对比结果较稳定' : '对比波动较大，建议复核关键计量点数据完整性/一致性'}。` },
        { level: diffLevel, text: `${absDiff >= 10 ? '差异幅度较明显' : '差异幅度相对可控'}，建议结合高影响月份做重点审查（功率因数、无功力调、分时电量等维度）。` },
        { level: 'info', text: '若仍无法解释差异，可继续查看明细/对比，定位到计量点与分项电费构成。' }
      ]
    }
  },
  watch: {
    currentManagerId: {
      handler (val) {
        if (val) {
          if (this.canView) this.fetchData()
        }
      },
      immediate: true
    },
    canView: {
      handler (val) {
        if (val && this.currentManagerId) this.fetchData()
      },
      immediate: true
    }
  },
  methods: {
    makeYearRange (year) {
      const y = parseInt(year)
      const now = new Date()
      const pad2 = (n) => String(n).padStart(2, '0')
      const safeYear = (!y || Number.isNaN(y)) ? now.getFullYear() : y
      const beginTime = `${safeYear}-01-01`
      let endDate = null
      if (safeYear === now.getFullYear()) {
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
      } else {
        endDate = new Date(safeYear, 11, 31)
      }
      if (endDate.getFullYear() < safeYear) endDate = new Date(safeYear, 0, 1)
      const endTime = `${safeYear}-${pad2(endDate.getMonth() + 1)}-${pad2(endDate.getDate())}`
      return { beginTime, endTime }
    },
    stepYear (delta) {
      const y = parseInt(this.currentYear)
      const next = isNaN(y) ? (new Date().getFullYear()) : (y + Number(delta || 0))
      this.currentYear = String(next)
      this.handleYearChange()
    },
    handleChartMetrics (payload) {
      this.chartMetrics = payload || {}
    },
    handleGoToChart () {
      this.aiHover = false
      this.$router.push({ path: '/metering/finance/cost-management' })
    },
    _requireControl () {
      if (this.canControl) return true
      this.$message.warning('暂无控制权限')
      return false
    },
    handleClose (done) {
      this.activeSession = null
      this.activePointIndexStr = '0'
      done()
    },
    handleYearChange () {
      if (!this.canView) return
      this.fetchData()
    },
    goToCreate () {
      if (!this._requireControl()) return
      this.$router.push('/ai/verification')
    },
    async fetchData () {
      this.pageLoading = true
      if (!this.canView) {
        this.pageLoading = false
        return
      }
      if (!this.currentManagerId) {
        this.pageLoading = false
        return
      }
      this.loading = true
      try {
        const { beginTime, endTime } = this.makeYearRange(this.currentYear)
        const res = await getEbvRecordList({
          managerId: this.currentManagerId,
          beginTime,
          endTime
        })
        if (res.code === 200) {
          this.sessionList = (res.data || []).map(record => this.transformRecordToSession(record))
        } else {
          this.sessionList = []
        }
      } catch (error) {
        console.error(error)
        this.$message.error('获取数据失败')
      } finally {
        this.loading = false
        this.pageLoading = false
      }
    },
    transformRecordToSession (record) {
      const date = new Date(record.occurDate)
      const month = date.getMonth() + 1
      return {
        sessionId: record.id,
        fileName: `${date.getFullYear()}.${month}月核查联.pdf`,
        balance: record.balance,
        keyData: {
          data: (record.billsList || []).map(bill => this.transformBillToPoint(bill))
        },
        originalRecord: record
      }
    },
    transformBillToPoint (bill) {
      return {
        ...bill,
        billingPeriod: {
          startDate: bill.startDate,
          endDate: bill.endDate
        },
        basicCharge: {
          receivingCapacity: bill.receivingCapacity,
          demandReading: bill.demandReading,
          multiplier: bill.multiplier,
          actualDemand: bill.actualDemand,
          approvedDemand: bill.approvedDemand,
          exceedDemand: bill.exceedDemand,
          billingCapacity: bill.billingCapacity,
          unitPrice: bill.unitPrice,
          amount: bill.amount,
          verification: `${bill.billingCapacity} × ${bill.unitPrice} = ${bill.amount} ✅`
        },
        reactivePower: {
          powerFactor: bill.powerFactor,
          changeRate: bill.changeRate,
          adjustAmount: bill.adjustAmount,
          totalReactive: bill.totalReactive,
          totalActive: bill.totalActive
        },
        pfAdjustAmount: bill.pfAdjustAmount,
        meterReadings: (bill.periodsDtos || []).flat().map(period => this.transformPeriodToReading(period))
      }
    },
    transformPeriodToReading (period) {
      return {
        multiplier: period.peakMultiplier,
        segments: {
          tip: { multiplier: period.tipMultiplier, usage: period.tipKwh, price: period.tipPrice, amount: period.tipAmount, adjustAmount: period.tipAdjust },
          peak: { multiplier: period.peakMultiplier, usage: period.peakKwh, price: period.peakPrice, amount: period.peakAmount, adjustAmount: period.peakAdjust },
          flat: { multiplier: period.flatMultiplier, usage: period.flatKwh, price: period.flatPrice, amount: period.flatAmount, adjustAmount: period.flatAdjust },
          valley: { multiplier: period.valleyMultiplier, usage: period.valleyKwh, price: period.valleyPrice, amount: period.valleyAmount, adjustAmount: period.valleyAdjust },
          deep: { multiplier: period.deepMultiplier, usage: period.deepKwh, price: period.deepPrice, amount: period.deepAmount, adjustAmount: period.deepAdjust }
        },
        originalPeriod: period
      }
    },
    transformSessionToRecord (session) {
      const record = JSON.parse(JSON.stringify(session.originalRecord))
      record.billsList = session.keyData.data.map(point => this.transformPointToBill(point))
      return record
    },
    transformPointToBill (point) {
      const bill = { ...point }

      if (point.basicCharge) {
        Object.assign(bill, {
          receivingCapacity: point.basicCharge.receivingCapacity,
          demandReading: point.basicCharge.demandReading,
          multiplier: point.basicCharge.multiplier,
          actualDemand: point.basicCharge.actualDemand,
          approvedDemand: point.basicCharge.approvedDemand,
          exceedDemand: point.basicCharge.exceedDemand,
          billingCapacity: point.basicCharge.billingCapacity,
          unitPrice: point.basicCharge.unitPrice,
          amount: point.basicCharge.amount
        })
      }

      if (point.reactivePower) {
        Object.assign(bill, {
          powerFactor: point.reactivePower.powerFactor,
          changeRate: point.reactivePower.changeRate,
          adjustAmount: point.reactivePower.adjustAmount,
          totalReactive: point.reactivePower.totalReactive,
          totalActive: point.reactivePower.totalActive
        })
      }

      if (point.pfAdjustAmount !== undefined) {
        bill.pfAdjustAmount = point.pfAdjustAmount
      }

      if (point.meterReadings) {
        bill.periodsDtos = [point.meterReadings.map(reading => this.transformReadingToPeriod(reading))]
      }

      return bill
    },
    transformReadingToPeriod (reading) {
      const period = { ...reading.originalPeriod }
      const seg = reading.segments;

      ['tip', 'peak', 'flat', 'valley', 'deep'].forEach(key => {
        if (seg[key]) {
          period[`${key}Multiplier`] = seg[key].multiplier
          period[`${key}Kwh`] = seg[key].usage
          period[`${key}Price`] = seg[key].price
          period[`${key}Amount`] = seg[key].amount
          period[`${key}Adjust`] = seg[key].adjustAmount
        }
      })

      return period
    },
    getMeterPoints (session) {
      if (!session || !session.keyData || !session.keyData.data) return []
      return session.keyData.data
    },
    formatMonth (session) {
      const points = this.getMeterPoints(session)
      if (!points.length) return ''
      const dateStr = points[0].billingPeriod.startDate
      const month = new Date(dateStr).getMonth() + 1
      return `${month}月`
    },
    formatDateRange (session) {
      const points = this.getMeterPoints(session)
      if (!points.length) return ''
      const p = points[0].billingPeriod
      return `${p.startDate.replace(/-/g, '/')} - ${p.endDate.replace(/-/g, '/')}`
    },
    calcTotalAmount (session) {
      return this.calcSessionTotal(session)
    },
    calcSessionTotal (session) {
      if (session && session.balance !== undefined && session.balance !== null) {
        return Number(session.balance)
      }
      const points = this.getMeterPoints(session)
      return points.reduce((sum, p) => sum + this.calcPointTotalAmount(p), 0)
    },
    calcPointTotalAmount (point) {
      const basic = point.basicCharge ? Number(point.basicCharge.amount) : 0
      const adjust = point.reactivePower ? Number(point.reactivePower.adjustAmount) : 0
      const energy = this.calcPointEnergyAmount(point)
      const activeAdjust = this.calcPointAdjustAmount(point)
      return basic + adjust + energy + activeAdjust
    },
    calcPointEnergyAmount (point) {
      if (!point.meterReadings) return 0
      return point.meterReadings.reduce((sum, r) => sum + this.calcReadingAmountTotal(r), 0)
    },
    calcPointAdjustAmount (point) {
      return point.pfAdjustAmount !== undefined ? Number(point.pfAdjustAmount) : 0
    },
    getSegmentLabel (key) {
      const map = {
        tip: '尖峰',
        peak: '峰',
        flat: '平',
        valley: '谷',
        deep: '深谷'
      }
      return map[key] || key
    },
    formatNumber (value, digits = 2) {
      const n = parseFloat(value)
      if (Number.isNaN(n)) {
        return ''
      }
      return n.toFixed(digits)
    },
    formatCurrencyYuan (value) {
      const raw = (value === null || value === undefined) ? '0' : String(value)
      const s0 = raw.trim()
      if (!s0) return '0.00'
      const sign = s0[0] === '-' ? '-' : ''
      const s = sign ? s0.slice(1) : s0
      const parts = s.split('.')
      const intPart = (parts[0] || '0') === '' ? '0' : (parts[0] || '0')
      const decRaw = parts.length > 1 ? (parts[1] || '') : ''
      const decPart = decRaw.padEnd(2, '0').slice(0, 2)
      return sign + intPart + '.' + decPart
    },
    calcReadingUsageTotal (reading) {
      if (!reading || !reading.segments) {
        return 0
      }
      let sum = 0
      this.segmentOrder.forEach((key) => {
        const seg = reading.segments[key]
        if (seg && seg.usage !== undefined && seg.usage !== null) {
          sum += Number(seg.usage) || 0
        }
      })
      return sum
    },
    calcReadingAmountTotal (reading) {
      if (!reading || !reading.segments) {
        return 0
      }
      let sum = 0
      this.segmentOrder.forEach((key) => {
        const seg = reading.segments[key]
        if (seg && seg.amount !== undefined && seg.amount !== null) {
          sum += Number(seg.amount) || 0
        }
      })
      return sum
    },
    openEdit (session) {
      this.activeSession = session
      this.activePointIndexStr = '0'
      this.editVisible = true
    },
    async handleSave () {
      if (!this._requireControl()) return
      this.saving = true
      try {
        const dto = this.transformSessionToRecord(this.activeSession)
        const res = await editEbvRecord(dto)
        if (res.code === 200) {
          this.$message.success('保存成功')
          this.editVisible = false
          this.fetchData()
        } else {
          this.$message.error(res.msg || '保存失败')
        }
      } catch (e) {
        console.error(e)
        this.$message.error('保存失败')
      } finally {
        this.saving = false
      }
    },
    getChangeRateClass (point) {
      if (!point.reactivePower) return ''
      const rate = parseFloat(point.reactivePower.changeRate)
      if (rate > 0) return 'text-danger'
      if (rate < 0) return 'text-success'
      return ''
    }
  }
}
</script>

<style lang="scss" scoped>
// 设计系统变量 - 蓝绿色调
$primary: #1890ff;
$success: #52c41a;
$warning: #faad14;
$danger: #f5222d;
$cyan: #13c2c2;
$blue-light: #36cfc9;
$text-primary: #1f2937;
$text-secondary: #4b5563;
$text-tertiary: #9ca3af;
$border-color: #e5e7eb;
$bg-primary: #f9fafb;
$bg-secondary: #f3f4f6;
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

.cost-page {
  padding: 20px;
  background-color: $bg-primary;
  min-height: 100vh;
  box-sizing: border-box;
}

// 顶部区域布局 2:3:5
.page-header-section {
  display: grid;
  grid-template-columns: 2fr 3fr 5fr;
  gap: 16px;
  margin-bottom: 20px;
  min-height: 240px;
}

// 左侧：年份与账户信息 (2)
.header-left-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: $shadow-sm;
  border: 1px solid $border-color;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.year-control {
  .section-label {
    display: block;
    font-size: 12px;
    color: $text-tertiary;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.year-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;

  ::v-deep .el-date-editor {
    width: 110px;

    .el-input__inner {
      font-size: 26px;
      font-weight: 700;
      color: $text-primary;
      border: none;
      background: transparent;
      padding: 0;
      height: 40px;
      line-height: 40px;
      cursor: pointer;

      &:hover {
        color: $primary;
      }
    }

    .el-input__prefix,
    .el-input__suffix {
      display: none;
    }
  }
}

.year-steppers {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;

  .el-button {
    padding: 6px;
    color: $text-tertiary;
    font-size: 14px;

    &:hover {
      color: $primary;
      background: $bg-secondary;
      border-radius: 4px;
    }

    i {
      font-size: 14px;
      font-weight: bold;
    }
  }
}

.account-info-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid $border-color;
}

.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.info-label {
  font-size: 13px;
  color: $text-secondary;
  flex-shrink: 0;
  font-weight: 500;
  padding-top: 4px;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  text-align: right;
  word-break: break-all;
  line-height: 1.5;

  &.account-name {
    font-size: 15px;
    font-weight: 600;
    color: $primary;
    max-width: 200px;
  }
}

.capacity-tag {
  font-weight: 600;
}

.account-info-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: $text-tertiary;
  font-size: 13px;

  i {
    font-size: 16px;
  }
}

// 中间：核心指标 (3)
.header-middle-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: $shadow-sm;
  border: 1px solid $border-color;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  height: 100%;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: $bg-primary;
  border-radius: 10px;
  border: 1px solid transparent;
  transition: all 0.3s;

  &:hover {
    border-color: $primary;
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }

  &.ai-card {
    background: linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%);
    border: 1px solid #87e8de;
    color: $text-primary;
    cursor: pointer;
    position: relative;
    overflow: visible;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(19, 194, 194, 0.25);
      border-color: #36cfc9;
    }

    .ai-content {
      text-align: center;
      width: 100%;
    }

    .ai-icon {
      font-size: 22px;
      margin-bottom: 4px;
      color: #08979c;
    }

    .ai-text {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 2px;
      color: #006d75;
    }

    .ai-sub {
      font-size: 11px;
      color: #08979c;
    }
  }
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;

  &.icon-blue {
    background: rgba(24, 144, 255, 0.1);
    color: #1890ff;
  }

  &.icon-green {
    background: rgba(82, 196, 26, 0.1);
    color: #52c41a;
  }

  &.icon-orange {
    background: rgba(250, 173, 20, 0.1);
    color: #faad14;
  }
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-label {
  font-size: 12px;
  color: $text-secondary;
  margin-bottom: 6px;
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
  min-width: 0;

  .currency {
    font-size: 13px;
    font-weight: 600;
    color: inherit;
    flex: 0 0 auto;
  }

  .number {
    font-size: clamp(16px, 2.2vw, 22px);
    font-weight: 700;
    color: $text-primary;
    font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif;
    line-height: 1;
    flex: 1 1 auto;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .unit {
    font-size: 12px;
    color: $text-tertiary;
    margin-left: 2px;
    flex: 0 0 auto;
  }

  &.text-danger {
    .number {
      color: $danger;
    }
  }

  &.text-success {
    .number {
      color: $success;
    }
  }
}

// AI 浮层
.ai-popover {
  position: absolute;
  left: 50%;
  top: calc(100% + 12px);
  transform: translateX(-50%);
  width: 380px;
  background: #fff;
  border-radius: 12px;
  box-shadow: $shadow-lg;
  border: 1px solid #87e8de;
  z-index: 100;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background: #e6fffb;
    border-left: 1px solid #87e8de;
    border-top: 1px solid #87e8de;
  }
}

.popover-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%);
  color: #006d75;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid #87e8de;
}

.popover-body {
  padding: 14px 18px;
  max-height: 280px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid $border-color;

  &:last-child {
    border-bottom: none;
  }
}

.suggestion-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;

  &.info { background: #1890ff; }
  &.warning { background: #faad14; }
  &.danger { background: #f5222d; }
}

.suggestion-text {
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.6;
}

.suggestion-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: $text-tertiary;
  font-size: 13px;
  justify-content: center;
}

.popover-footer {
  padding: 12px 18px;
  border-top: 1px solid $border-color;
  display: flex;
  justify-content: flex-end;
}

// 右侧：图表 (5)
.header-right-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: $shadow-sm;
  border: 1px solid $border-color;
  display: flex;
  flex-direction: column;
  min-height: 240px;
}

.chart-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chart-header-mini {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid $border-color;

  .chart-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
  }

  .chart-expand {
    color: $text-tertiary;
    cursor: pointer;
    font-size: 16px;

    &:hover {
      color: $primary;
    }
  }
}

// 工具栏
.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.toolbar-title {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
}

.toolbar-count {
  font-size: 13px;
  color: $text-tertiary;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-label {
  font-size: 13px;
  color: $text-secondary;
}

// 卡片网格
.cost-card-grid {
  display: grid;
  gap: 16px;

  &.cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  &.cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

// 账单卡片
.bill-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: $shadow-sm;
  border: 1px solid $border-color;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &:hover {
    box-shadow: $shadow-lg;
    transform: translateY(-2px);
  }
}

.bill-card-header {
  padding: 20px;
  background: linear-gradient(to right, #fafafa, #fff);
  border-bottom: 1px solid $border-color;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-main {
  .month-badge {
    display: flex;
    align-items: baseline;
    gap: 2px;
    margin-bottom: 8px;

    .month-num {
      font-size: 32px;
      font-weight: 800;
      color: $primary;
      line-height: 1;
      font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif;
    }

    .month-unit {
      font-size: 14px;
      color: $text-secondary;
      font-weight: 500;
    }
  }

  .date-range {
    font-size: 13px;
    color: $text-tertiary;
    display: flex;
    align-items: center;
    gap: 6px;

    i {
      font-size: 14px;
    }
  }
}

.header-summary {
  text-align: right;

  .amount-block {
    .amount-label {
      font-size: 12px;
      color: $text-tertiary;
      margin-bottom: 6px;
    }

    .amount-value {
      font-size: 24px;
      font-weight: 700;
      color: $danger;
      font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif;

      .currency {
        font-size: 14px;
        margin-right: 2px;
      }
    }
  }
}

.bill-card-body {
  padding: 16px;
  flex: 1;
}

.meter-table-wrapper {
  border: 1px solid $border-color;
  border-radius: 8px;
  overflow: hidden;
}

.meter-compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th, td {
    padding: 12px 16px;
    text-align: right;
    border-bottom: 1px solid $border-color;
    color: $text-secondary;

    &:first-child {
      text-align: left;
      font-weight: 500;
      color: $text-tertiary;
      background: #fafafa;
      width: 120px;
    }
  }

  th {
    background: #f5f7fa;
    color: $text-primary;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  .divider-row td {
    padding: 4px 0;
    background: $bg-secondary;
    border-bottom: 1px solid $border-color;
  }

  .cell-value {
    font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif;
    font-weight: 500;
  }

  .total-row {
    td {
      background: #fff8f0;
      font-weight: 600;

      &:first-child {
        background: #fff8f0;
        color: $text-primary;
      }
    }

    .total-highlight {
      color: $danger;
      font-size: 15px;
      font-weight: 700;
    }
  }
}

.bill-card-footer {
  padding: 12px 20px;
  border-top: 1px solid $border-color;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  background: #fafafa;

  .el-button {
    font-size: 13px;

    i {
      margin-right: 4px;
    }
  }

  .btn-reparse {
    color: $text-tertiary;

    &:hover {
      color: $primary;
    }
  }
}

// 新建卡片
.add-card {
  border: 2px dashed #d9d9d9;
  background: transparent;
  cursor: pointer;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: $primary;
    background: rgba(24, 144, 255, 0.02);

    .add-icon {
      background: $primary;
      color: #fff;
      transform: scale(1.1);
    }

    .add-title {
      color: $primary;
    }
  }
}

.add-content {
  text-align: center;
}

.add-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  transition: all 0.3s;

  i {
    font-size: 28px;
  }
}

.add-title {
  font-size: 16px;
  font-weight: 600;
  color: $text-secondary;
  margin-bottom: 8px;
  transition: color 0.3s;
}

.add-desc {
  font-size: 13px;
  color: $text-tertiary;
}

// ==================== 抽屉样式 - 恢复闭环设计 ====================

::v-deep .cost-drawer {
  .el-drawer__header {
    padding: 20px 24px;
    margin-bottom: 0;
    border-bottom: 1px solid #e8e8e8;

    span {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }

  .el-drawer__body {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
}

.drawer-content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.drawer-header-info {
  background: #f8f9fc;
  border-radius: 8px;
  padding: 20px 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #ebeef5;

  .info-left {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .account-name {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      word-break: break-all;
      max-width: 400px;
      line-height: 1.4;
    }

    .billing-period {
      font-size: 14px;
      color: #606266;

      .label {
        color: #909399;
      }
    }
  }

  .info-right {
    .total-amount-wrapper {
      text-align: right;

      .label {
        display: block;
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
      }

      .amount {
        font-size: 32px;
        font-weight: bold;
        color: #f56c6c;
        line-height: 1;
        font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif;

        .currency {
          font-size: 18px;
          margin-right: 4px;
        }
      }
    }
  }
}

.point-tabs {
  margin-bottom: 24px;

  ::v-deep .el-tabs__header {
    margin-bottom: 0;
  }
}

.point-edit-area {
  flex: 1;
}

.info-card {
  margin-bottom: 24px;
}

.section-block {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 24px;

  .section-header {
    margin-bottom: 16px;
    padding-left: 10px;
    border-left: 4px solid $primary;

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px 24px;

    .form-item {
      display: flex;
      align-items: center;

      &.full-width {
        grid-column: span 2;
      }

      .label {
        width: 80px;
        color: #606266;
        font-size: 13px;
        flex-shrink: 0;
      }

      .el-input {
        flex: 1;
      }

      .formula-display {
        background: #f5f7fa;
        padding: 8px 12px;
        border-radius: 4px;
        color: #67c23a;
        font-size: 13px;
        flex: 1;
      }
    }
  }
}

.reading-sub-card {
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;

  .reading-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .badge {
      background: #ecf5ff;
      color: $primary;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .summary {
      font-size: 12px;
      color: #909399;
    }
  }

  .simple-table {
    width: 100%;
    border-collapse: collapse;

    th {
      text-align: left;
      color: #909399;
      font-size: 12px;
      padding: 8px;
      border-bottom: 1px solid #ebeef5;
    }

    td {
      padding: 8px;
      font-size: 13px;
      border-bottom: 1px solid #ebeef5;
    }

    .total-row td {
      font-weight: bold;
      border-bottom: none;
    }
  }
}

.drawer-footer {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 工具类
.text-danger { color: #f5222d !important; }
.text-success { color: #52c41a !important; }

// 响应式
@media (max-width: 1400px) {
  .page-header-section {
    grid-template-columns: 2fr 3fr 5fr;
  }
}

@media (max-width: 1200px) {
  .page-header-section {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .header-right-section {
    min-height: 300px;
  }

  .cost-card-grid.cols-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .cost-card-grid.cols-2,
  .cost-card-grid.cols-3 {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
