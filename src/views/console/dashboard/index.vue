<template>
  <div :class="['energy-dashboard', `mode-${mode}`]">
    <!-- 主内容区域 -->
    <div class="dashboard-content">
      <!-- 顶部：保留「租户今日用电」在原位；红框区域换成底部两张卡（留存/应收实收） -->
      <div class="top-row-swap">
        <top-overview-row variant="today-only" @open-remote="showRemote = true" />

        <div class="top-row-swap__cards">
          <div class="quick-card quick-card--retention" @click="goToNewFundFlow">
            <div class="retention-icon">
              <i class="iconfont icon-zijinguanli"></i>
            </div>
            <div class="retention-main">
              <div class="retention-label">{{ $t('dashboard.index.retentionAmountYuan') }}</div>
              <div class="retention-value">
                {{ tenantElecRemainText }}
              </div>
            </div>
          </div>

          <div class="quick-card quick-card--summary" @click="goToFloatingPriceTenant">
            <div class="summary-main">
              <div class="summary-block">
                <div class="summary-block-icon" aria-hidden="true">
                  <i class="iconfont icon-yingshou"></i>
                </div>
                <div class="summary-block-inner">
                  <div class="summary-title">{{ $t('dashboard.index.receivableMonthlyTitle') }}</div>
                  <div class="summary-row">
                    <div class="summary-value">
                      {{ tenantElecBillText }}
                    </div>
                    <div class="summary-meta">
                      <span class="meta-item">
                        <i class="iconfont icon-dianfei"></i>
                        <span>{{ $t('dashboard.index.receivableElec', { n: tenantElecBillElecText }) }}</span>
                      </span>
                      <span class="meta-item meta-item--spaced">
                        <i class="iconfont icon-shuifei"></i>
                        <span>{{ $t('dashboard.index.receivableWater', { n: tenantWaterBillText }) }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-block">
                <div class="summary-block-icon summary-block-icon--received" aria-hidden="true">
                  <i class="iconfont icon-round_rmb1"></i>
                </div>
                <div class="summary-block-inner">
                  <div class="summary-title">{{ $t('dashboard.index.receivedMonthlyTitle') }}</div>
                  <div class="summary-row">
                    <div class="summary-value">
                      {{ tenantElecPayText }}
                    </div>
                    <div class="summary-meta">
                      <span class="meta-item">
                        <i class="iconfont icon-dianfei"></i>
                        <span>{{ $t('dashboard.index.receivedElec', { n: tenantElecPayElecText }) }}</span>
                      </span>
                      <span class="meta-item meta-item--spaced">
                        <i class="iconfont icon-shuifei"></i>
                        <span>{{ $t('dashboard.index.receivedWater', { n: tenantWaterPayText }) }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="summary-rate">
              <div class="rate-circle" :style="rateCircleStyle">
                <div class="rate-inner">
                  <div class="rate-percent">
                    {{ tenantElecRateText }}
                  </div>
                  <div class="rate-unit">%</div>
                </div>
              </div>
              <div class="rate-label">{{ $t('dashboard.index.collectionRate') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 常规模式 -->
      <template v-if="mode === 'normal'">
        <div class="first-screen">
          <div class="first-screen-body">
            <div class="dashboard-grid first-row">
              <div class="span-9">
                <div class="dashboard-card dashboard-card--fill">
                  <trend-chart />
                </div>
              </div>
              <div class="span-3">
                <div class="dashboard-card dashboard-card--fill">
                  <tenant-arrears-panel />
                </div>
              </div>
            </div>

            <div class="dashboard-grid second-row">
              <div class="span-8">
                <div class="dashboard-card dashboard-card--fill">
                  <sankey-chart />
                </div>
              </div>
              <div class="span-4">
                <div class="dashboard-card dashboard-card--fill">
                  <sub-metering-chart />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="quick-actions scroll-three">
          <!-- 底部：红框区域换成「租户数 + 电表/水表/空调/在线率」 -->
          <div class="quick-stats-slot" @click.stop>
            <top-overview-row variant="stats-only" />
          </div>

          <!-- 3. 电费核查联解析（2 份宽度） -->
          <div class="quick-card quick-card--plain" @click="goTo('/ai/verification')">
            <div class="plain-main">
              <div class="plain-title">{{ $t('dashboard.index.verificationTitle') }}</div>
              <div class="plain-sub">{{ $t('dashboard.index.verificationSub') }}</div>
              <button class="plain-btn plain-btn--orange" type="button">{{ $t('dashboard.index.btnAnalyze') }}</button>
            </div>
          </div>

          <!-- 4. 空调系统拓扑图（2 份宽度） -->
          <div class="quick-card quick-card--plain" @click="goTo({ path: '/device/conditioning', query: { tab: 'outdoor' } })">
            <div class="plain-main">
              <div class="plain-title">{{ $t('dashboard.index.acTopologyTitle') }}</div>
              <div class="plain-sub">{{ $t('dashboard.index.acTopologySub') }}</div>
              <button class="plain-btn plain-btn--purple" type="button">{{ $t('dashboard.index.btnView') }}</button>
            </div>
          </div>
        </div>
      </template>

      <!-- AI 模式 -->
      <ai-mode v-else />
    </div>

    <!-- 遥控弹窗 -->
    <remote-modal :visible.sync="showRemote" />

    <!-- 暂时隐藏：进入/退出 AI 悬浮球，恢复时取消本段注释即可 -->
    <!--
    <div class="ai-orb" :class="{ 'is-ai': mode === 'ai', dragging: floatDragging }" :style="floatStyle"
      @pointerdown="onFloatPointerDown" @pointermove="onFloatPointerMove" @pointerup="onFloatPointerUp"
      @pointercancel="onFloatPointerUp" @click="onFloatClick" @mouseenter="onFloatHoverEnter"
      @mousemove="onFloatHoverMove" @mouseleave="onFloatHoverLeave">
      <div class="ai-orb-core">
        <div class="core-sphere">
          <div class="ai-visual ai-visual--sm" :style="{ '--wave-level': waveLevel }">
            <div class="ai-visual-ring ai-visual-ring-outer"></div>
            <div class="ai-visual-ring ai-visual-ring-mid"></div>
            <div class="ai-visual-ring ai-visual-ring-inner"></div>
            <div class="ai-visual-core"></div>
            <svg class="ai-visual-wave ai-visual-wave-left" viewBox="0 0 140 60" aria-hidden="true">
              <path class="wave-glow"
                d="M0 30 C 10 10 20 50 30 30 S 50 50 60 30 S 80 10 90 30 S 110 50 120 30 S 130 10 140 30" />
              <path class="wave-core"
                d="M0 30 C 10 10 20 50 30 30 S 50 50 60 30 S 80 10 90 30 S 110 50 120 30 S 130 10 140 30" />
            </svg>
            <svg class="ai-visual-wave ai-visual-wave-right" viewBox="0 0 140 60" aria-hidden="true">
              <path class="wave-glow"
                d="M0 30 C 10 10 20 50 30 30 S 50 50 60 30 S 80 10 90 30 S 110 50 120 30 S 130 10 140 30" />
              <path class="wave-core"
                d="M0 30 C 10 10 20 50 30 30 S 50 50 60 30 S 80 10 90 30 S 110 50 120 30 S 130 10 140 30" />
            </svg>
          </div>
        </div>
      </div>
      <div class="ai-orb-label">{{ mode === 'ai' ? '退出 AI' : '进入 AI' }}</div>
    </div>
    -->

  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import TopOverviewRow from './components/TopOverviewRow.vue'
import TrendChart from './components/charts/TrendChart.vue'
import SubMeteringChart from './components/charts/SubMeteringChart.vue'
import SankeyChart from './components/charts/SankeyChart.vue'
import RemoteModal from './components/RemoteModal.vue'
import AiMode from './components/AIMode.vue'
import TenantArrearsPanel from './components/TenantArrearsPanel.vue'
import { tenantRetainStatis, tenantSettleStatis } from '@/api/newDashboard'
import '@/assets/styles/dashboard-locale-en.scss'

export default {
  name: 'EnergyDashboard',
  components: {
    TopOverviewRow,
    TrendChart,
    SubMeteringChart,
    SankeyChart,
    RemoteModal,
    AiMode,
    TenantArrearsPanel
  },
  data () {
    return {
      mode: 'normal',
      showRemote: false,
      waveTimer: null,
      _dashboardRO: null,
      _dashboardResizeTimer: null,
      floatPos: { x: null, y: null },
      floatDragging: false,
      floatPointerId: null,
      floatDragOffset: { x: 0, y: 0 },
      floatMoved: false,
      tilt: { x: 0, y: 0 },
      floatHovering: false,
      panelPlacement: 'left',
      panelPos: { x: 0, y: 0 },
      waveLevel: 0.65,
      tenantElecBillTotalAmt: null,
      tenantElecBillElecAmt: null,
      tenantWaterBillAmt: null,
      tenantElecPayTotalAmt: null,
      tenantElecPayElecAmt: null,
      tenantWaterPayAmt: null,
      tenantElecRemainAmt: null,
      tenantElecRate: null,
      tenantElecFeeLoading: false
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    floatStyle () {
      if (this.floatPos.x == null || this.floatPos.y == null) return {}
      return {
        left: `${this.floatPos.x}px`,
        top: `${this.floatPos.y}px`,
        '--tilt-x': `${this.tilt.x}deg`,
        '--tilt-y': `${this.tilt.y}deg`
      }
    },
    floatPanelStyle () {
      return {
        left: `${this.panelPos.x}px`,
        top: `${this.panelPos.y}px`,
        '--wave-level': this.waveLevel
      }
    },
    tenantElecBillText () {
      return this.formatMoney(this.tenantElecBillTotalAmt)
    },
    tenantElecPayText () {
      return this.formatMoney(this.tenantElecPayTotalAmt)
    },
    tenantElecRemainText () {
      return this.formatMoney(this.tenantElecRemainAmt)
    },
    tenantElecBillElecText () {
      return this.formatMoney(this.tenantElecBillElecAmt)
    },
    tenantWaterBillText () {
      return this.formatMoney(this.tenantWaterBillAmt)
    },
    tenantElecPayElecText () {
      return this.formatMoney(this.tenantElecPayElecAmt)
    },
    tenantWaterPayText () {
      return this.formatMoney(this.tenantWaterPayAmt)
    },
    tenantElecRateText () {
      const n = Number(this.tenantElecRate)
      if (!Number.isFinite(n)) return '--'
      return this.formatNumber(n, 0)
    },
    tenantElecRatePct () {
      const n = Number(this.tenantElecRate)
      if (!Number.isFinite(n)) return 0
      return Math.max(0, Math.min(100, Math.round(n)))
    },
    rateCircleStyle () {
      return {
        '--rate': this.tenantElecRatePct
      }
    }
  },
  watch: {
    currentManagerId: {
      handler () {
        this.fetchTenantElecMonthFee()
        this.fetchTenantRetainAmt()
        this.$nextTick(() => {
          window.dispatchEvent(new Event('resize'))
        })
      },
      immediate: true
    }
  },
  mounted () {
    this.initFloatPos()
    this.initDashboardResizeObserver()
    this.waveTimer = setInterval(() => {
      const base = this.mode === 'ai' ? 0.55 : 0.4
      this.waveLevel = Math.min(0.98, Math.max(0.25, base + Math.random() * 0.5))
    }, 700)
  },
  beforeDestroy () {
    if (this.waveTimer) {
      clearInterval(this.waveTimer)
    }
    if (this._dashboardResizeTimer) {
      clearTimeout(this._dashboardResizeTimer)
      this._dashboardResizeTimer = null
    }
    if (this._dashboardRO) {
      this._dashboardRO.disconnect()
      this._dashboardRO = null
    }
  },
  methods: {
    initDashboardResizeObserver () {
      if (this._dashboardRO || typeof ResizeObserver === 'undefined') return
      this._dashboardRO = new ResizeObserver(() => {
        if (this._dashboardResizeTimer) clearTimeout(this._dashboardResizeTimer)
        this._dashboardResizeTimer = setTimeout(() => {
          this._dashboardResizeTimer = null
          window.dispatchEvent(new Event('resize'))
        }, 60)
      })
      this._dashboardRO.observe(this.$el)
    },
    formatNumber (value, digits = 0) {
      const n = Number(value)
      if (!Number.isFinite(n)) return '0'
      const fixed = digits > 0 ? Number(n.toFixed(digits)) : Math.round(n)
      return fixed.toLocaleString()
    },
    formatMoney (value) {
      const n = Number(value)
      if (!Number.isFinite(n)) return '--'
      return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    normalizeTenantSettleStatis (res) {
      if (!res || res.code !== 200) {
        return {
          billTotalAmt: null,
          payTotalAmt: null,
          elecBillTotalAmt: null,
          waterBillTotalAmt: null,
          elecPayTotalAmt: null,
          waterPayTotalAmt: null,
          retainTotalAmt: null
        }
      }
      const dto = res.data || {}
      const billTotalAmt = Number(dto.billTotalAmt)
      const payTotalAmt = Number(dto.payTotalAmt)
      const elecBillTotalAmt = Number(dto.elecBillTotalAmt)
      const waterBillTotalAmt = Number(dto.waterBillTotalAmt)
      const elecPayTotalAmt = Number(dto.elecPayTotalAmt)
      const waterPayTotalAmt = Number(dto.waterPayTotalAmt)
      const retainTotalAmt = Number(dto.retainTotalAmt)
      return {
        billTotalAmt: Number.isFinite(billTotalAmt) ? billTotalAmt : null,
        payTotalAmt: Number.isFinite(payTotalAmt) ? payTotalAmt : null,
        elecBillTotalAmt: Number.isFinite(elecBillTotalAmt) ? elecBillTotalAmt : null,
        waterBillTotalAmt: Number.isFinite(waterBillTotalAmt) ? waterBillTotalAmt : null,
        elecPayTotalAmt: Number.isFinite(elecPayTotalAmt) ? elecPayTotalAmt : null,
        waterPayTotalAmt: Number.isFinite(waterPayTotalAmt) ? waterPayTotalAmt : null,
        retainTotalAmt: Number.isFinite(retainTotalAmt) ? retainTotalAmt : null
      }
    },
    async fetchTenantElecMonthFee () {
      if (!this.currentManagerId) {
        this.tenantElecBillTotalAmt = null
        this.tenantElecPayTotalAmt = null
        this.tenantElecBillElecAmt = null
        this.tenantWaterBillAmt = null
        this.tenantElecPayElecAmt = null
        this.tenantWaterPayAmt = null
        this.tenantElecRate = null
        return
      }

      this.tenantElecFeeLoading = true
      try {
        const startDate = moment().startOf('month').format('YYYY-MM-DD')
        const endDate = moment().format('YYYY-MM-DD')
        const payload = {
          managerId: this.currentManagerId,
          tenantId: '',
          startDate,
          endDate,
          tenantStatus: '0'
        }
        const res = await tenantSettleStatis(payload).catch(() => null)
        const dto = this.normalizeTenantSettleStatis(res)
        this.tenantElecBillTotalAmt = dto.billTotalAmt
        this.tenantElecPayTotalAmt = dto.payTotalAmt
        this.tenantElecBillElecAmt = dto.elecBillTotalAmt
        this.tenantWaterBillAmt = dto.waterBillTotalAmt
        this.tenantElecPayElecAmt = dto.elecPayTotalAmt
        this.tenantWaterPayAmt = dto.waterPayTotalAmt
        this.tenantElecRate = (dto.billTotalAmt != null && dto.billTotalAmt > 0 && dto.payTotalAmt != null)
          ? (dto.payTotalAmt / dto.billTotalAmt) * 100
          : null
      } finally {
        this.tenantElecFeeLoading = false
      }
    },
    async fetchTenantRetainAmt () {
      if (!this.currentManagerId) {
        this.tenantElecRemainAmt = null
        return
      }
      const res = await tenantRetainStatis({
        managerId: this.currentManagerId
      }).catch(() => null)
      if (!res || res.code !== 200) {
        this.tenantElecRemainAmt = null
        return
      }
      const totalRetainAmt = Number((res.data || {}).totalRetainAmt)
      this.tenantElecRemainAmt = Number.isFinite(totalRetainAmt) ? totalRetainAmt : null
    },
    goTo (path) {
      this.$router.push(path)
    },
    /** 账单统计页：大屏跳转带本月日期区间，与卡片「本月」口径一致 */
    goToFloatingPriceTenant () {
      this.$router.push({
        path: '/metering/bill/floating-price-tenant',
        query: {
          fromDashboard: '1',
          startDate: moment().startOf('month').format('YYYY-MM-DD'),
          endDate: moment().format('YYYY-MM-DD')
        }
      })
    },
    goToNewFundFlow () {
      this.$router.push('/metering/finance/new-fundFlow')
    },
    initFloatPos () {
      try {
        const raw = window.localStorage.getItem('energyDashboard.aiFloatPos')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            this.floatPos = this.clampFloatPos({ x: parsed.x, y: parsed.y })
            return
          }
        }
      } catch (e) { }

      const fallback = {
        x: Math.max(16, window.innerWidth - 104),
        y: Math.max(16, window.innerHeight - 148)
      }
      this.floatPos = this.clampFloatPos(fallback)
    },
    clampFloatPos (pos) {
      const width = 88
      const height = 56
      const maxX = Math.max(16, window.innerWidth - width - 16)
      const maxY = Math.max(16, window.innerHeight - height - 16)
      return {
        x: Math.min(Math.max(16, pos.x), maxX),
        y: Math.min(Math.max(16, pos.y), maxY)
      }
    },
    persistFloatPos () {
      try {
        window.localStorage.setItem('energyDashboard.aiFloatPos', JSON.stringify(this.floatPos))
      } catch (e) { }
    },
    onFloatPointerDown (e) {
      if (!e || e.button === 2) return
      if (this.floatPos.x == null || this.floatPos.y == null) this.initFloatPos()

      this.floatDragging = true
      this.floatPointerId = e.pointerId
      this.floatMoved = false
      this.floatDragOffset = {
        x: e.clientX - this.floatPos.x,
        y: e.clientY - this.floatPos.y
      }

      if (e.currentTarget && e.currentTarget.setPointerCapture) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch (err) { }
      }
    },
    onFloatPointerMove (e) {
      if (!this.floatDragging || this.floatPointerId !== e.pointerId) return
      const next = {
        x: e.clientX - this.floatDragOffset.x,
        y: e.clientY - this.floatDragOffset.y
      }

      const dx = Math.abs(next.x - this.floatPos.x)
      const dy = Math.abs(next.y - this.floatPos.y)
      if (dx > 2 || dy > 2) this.floatMoved = true

      this.floatPos = this.clampFloatPos(next)
    },
    onFloatPointerUp (e) {
      if (this.floatPointerId != null && e && this.floatPointerId !== e.pointerId) return
      this.floatDragging = false
      this.floatPointerId = null
      this.persistFloatPos()
    },
    onFloatClick () {
      if (this.floatMoved) {
        this.floatMoved = false
        return
      }
      this.toggleMode()
    },
    onFloatHoverMove (e) {
      if (this.floatDragging) return
      this.floatHovering = true
      this.updatePanelPlacement(e.currentTarget.getBoundingClientRect())
      const rect = e.currentTarget.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const maxTilt = 4
      this.tilt = {
        x: Math.max(-maxTilt, Math.min(maxTilt, (dx / (rect.width / 2)) * maxTilt)),
        y: Math.max(-maxTilt, Math.min(maxTilt, (-dy / (rect.height / 2)) * maxTilt))
      }
    },
    onFloatHoverEnter (e) {
      if (this.floatDragging) return
      this.floatHovering = true
      if (e && e.currentTarget) {
        this.updatePanelPlacement(e.currentTarget.getBoundingClientRect())
      }
    },
    onFloatHoverLeave () {
      if (this.floatDragging) return
      this.tilt = { x: 0, y: 0 }
      this.floatHovering = false
    },
    updatePanelPlacement (rect) {
      if (!rect) return
      const preferLeft = rect.left > window.innerWidth * 0.55
      this.panelPlacement = preferLeft ? 'left' : 'right'
      const panelWidth = 560
      const panelHeight = 340
      const gap = 14
      const nextX = preferLeft ? rect.left - gap - panelWidth : rect.right + gap
      const centerY = rect.top + rect.height / 2
      const nextY = centerY - panelHeight / 2
      this.panelPos = {
        x: Math.min(Math.max(16, nextX), Math.max(16, window.innerWidth - panelWidth - 16)),
        y: Math.min(Math.max(16, nextY), Math.max(16, window.innerHeight - panelHeight - 16))
      }
    },
    toggleMode () {
      this.mode = this.mode === 'normal' ? 'ai' : 'normal'
    }
  }
}
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@500;600;700&display=swap');

.energy-dashboard {
  background: #F5F7FB;
  --dash-gap: clamp(10px, 0.9vw, 14px);
  --dash-padding: clamp(10px, 0.9vw, 14px);
  padding: var(--dash-padding);
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100%;
  height: 100%;
  box-sizing: border-box;

  overflow-x: hidden;
  overflow-y: visible;
}

.energy-dashboard.mode-ai .dashboard-content {
  overflow: visible;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-box {
  position: relative;
  width: 40px;
  height: 40px;
  background: transparent;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10px;
}

.ai-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #8B5CF6;
  border-radius: 4px;
  font-size: 8px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.title-box {
  h1 {
    font-size: 18px;
    font-weight: 700;
    color: #1E293B;
    margin: 0;
    letter-spacing: -0.5px;
  }

  .subtitle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #64748B;
    margin-top: 4px;

    .dot {
      width: 4px;
      height: 4px;
      background: #CBD5E1;
      border-radius: 50%;
    }

    .highlight {
      color: #0EA5E9;
      font-weight: 500;
    }
  }
}

.header-metrics {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.metric-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(226, 232, 240, 0.9);

  i {
    font-size: 14px;
    color: #334155;
  }

  .metric-img {
    width: 16px;
    height: 16px;
    object-fit: contain;
    display: block;
  }

  &.bg-green {
    background: rgba(226, 232, 240, 0.20);
    i { color: #475569; }
  }

  &.bg-orange {
    background: rgba(226, 232, 240, 0.20);
    i { color: #475569; }
  }

  &.bg-blue {
    background: rgba(226, 232, 240, 0.20);
    i { color: #475569; }
  }

  &.bg-cyan {
    background: rgba(226, 232, 240, 0.20);
    i { color: #475569; }
  }
}

.metric-info {
  .metric-label {
    font-size: 10px;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .metric-value {
    display: flex;
    align-items: baseline;
    gap: 4px;

    .number {
      font-size: 14px;
      font-weight: 700;
      color: #1E293B;
      font-family: 'JetBrains Mono', monospace;
    }

    .unit {
      font-size: 10px;
      color: #94A3B8;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(241, 245, 249, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 999px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);

  i {
    font-size: 14px;
    color: #94A3B8;
  }

  .time-text {
    font-size: 13px;
    font-weight: 500;
    color: #475569;
    font-family: 'JetBrains Mono', monospace;
  }
}

.action-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  background: #FFFFFF;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
  color: #0F172A;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;

  .action-icon-img {
    width: 16px;
    height: 16px;
    object-fit: contain;
    display: block;
  }

  i {
    font-size: 16px;
    color: #334155;
  }

  span {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.2px;
  }

  &:hover {
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.10);
    transform: translateY(-1px);
  }

  &.active {
    background: rgba(14, 165, 233, 0.10);
    border-color: rgba(14, 165, 233, 0.35);

    i { color: #0369A1; }
    span { color: #0369A1; }
  }
}

.dashboard-content {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--dash-gap);
}

/* 顶部红框互换：左侧仍为 box1，右侧放两张 quick-card */
.top-row-swap {
  display: grid;
  grid-template-columns: 2fr 8fr;
  gap: var(--dash-gap);
  min-width: 0;
  align-items: stretch;
}

.top-row-swap__cards {
  display: grid;
  grid-template-columns: 2fr 6fr;
  gap: var(--dash-gap);
  min-width: 0;
  /* 与 TopOverviewRow .top-overview 同口径：略矮、减少上下留白 */
  height: clamp(104px, 10vh, 126px);
  align-self: stretch;

  > .quick-card {
    height: 100%;
    min-height: 0;
    padding: clamp(6px, 0.75vw, 10px) clamp(12px, 1.2vw, 16px);
    gap: clamp(6px, 0.75vw, 10px);
  }

  /* 应收/实收卡：左侧内边距略减，整块内容更靠左（箭头所指方向） */
  > .quick-card--summary {
    padding-left: clamp(6px, 0.65vw, 10px);
  }
}

/* 顶行留存卡：行距略紧，与变矮后的卡片高度匹配 */
.top-row-swap__cards .quick-card--retention .retention-main {
  gap: 4px;
}

/* 底部红框互换：占位容器横跨前两列，不额外画“外框模块” */
.quick-stats-slot {
  grid-column: span 2;
  padding: 0;
  overflow: visible;
  align-self: stretch;
}

.quick-stats-slot ::v-deep .top-overview {
  height: 100%;
}

.quick-stats-slot ::v-deep .row-container {
  padding: 0;
  height: 100%;
}

.energy-dashboard.mode-normal .dashboard-content {
  overflow: visible;
}

.first-screen {
  display: flex;
  flex-direction: column;
  gap: var(--dash-gap);
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: visible;
  box-sizing: border-box;
}

.first-screen-body {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-rows: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: var(--dash-gap);
}

/* Grid 默认 min-height:auto 会吃子元素「异常撑高」，锁死为 0 让子项在格子里裁剪 */
.first-screen-body > .dashboard-grid {
  min-height: 0;
}

.first-screen-body > .dashboard-grid > [class*='span-'] {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.first-row {
  height: 100%;
  min-height: 0;
}

.second-row {
  height: 100%;
  min-height: 0;
}

.dashboard-grid.first-row {
  grid-template-columns: 8fr 2fr;
}

.dashboard-grid.first-row > .span-9,
.dashboard-grid.first-row > .span-3 {
  grid-column: span 1;
}

.dashboard-card--fill {
  height: 100%;
  min-height: 0;
}

.dashboard-card--fill > * {
  height: 100%;
  min-height: 0;
}

/* =====================
   Quick Actions 区域
   ===================== */
.quick-actions {
  display: grid;
  grid-template-columns: 1.5fr 5.5fr 1.5fr 1.5fr;
  gap: var(--dash-gap);
  flex-shrink: 0;
}

.quick-card {
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.75);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  cursor: pointer;
  user-select: none;
  min-height: 72px;
  transition: box-shadow 0.18s ease, transform 0.18s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
    transform: translateY(-1px);
  }
}

/* 租户留存金额卡片样式 */
.quick-card--retention {
  align-items: center;
}

.retention-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.retention-label {
  font-size: clamp(11px, 0.62vw + 0.42rem, 14px);
  color: #64748B;
  text-align: left;
}

.retention-value {
  font-size: clamp(18px, 1.15vw + 0.65rem, 25px);
  font-weight: 900;
  color: #0F172A;
  font-family: 'Oxanium', 'DIN Alternate', 'DIN', 'Barlow', 'JetBrains Mono', 'Roboto Mono', monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
  white-space: nowrap;
  line-height: 1.2;
  text-align: left;
}

.retention-icon {
  width: clamp(38px, 3.2vw + 22px, 44px);
  height: clamp(38px, 3.2vw + 22px, 44px);
  border-radius: 50%;
  /* 避免与「本月应收」图标蓝底撞色 */
  background: rgba(245, 158, 11, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: clamp(4px, 0.5vw, 8px);
  flex-shrink: 0;

  i {
    font-size: clamp(18px, 1.1vw + 0.55rem, 22px);
    color: #D97706;
  }
}

/* 本月应收/实收汇总模块（整体略小 + 响应式；布局仍为原 7 列等距） */
.quick-card--summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(12px, 1.4vw, 20px);
  padding-right: clamp(14px, 1.5vw, 28px);
  font-size: clamp(12px, 0.55vw + 0.42rem, 14px);
}

.summary-main {
  flex: 1;
  min-width: 0;
  display: grid;
  /* 左侧用较小 fr，避免「左侧一大块白」；右侧仍 1fr 保持与圆环的平衡 */
  grid-template-columns: 0.38fr auto clamp(56px, 5vw, 108px) 1px clamp(56px, 5vw, 108px) auto 1fr;
  column-gap: 0;
  align-items: center;
  padding-left: clamp(2px, 0.45vw, 10px);
  padding-right: clamp(8px, 1.2vw, 20px);
}

.summary-block {
  display: flex;
  flex-direction: row;
  align-items: center;
  /* 与留存卡一致：图标与文案间距用 icon 的 margin-right，不用 gap */
  gap: 0;
  min-width: 0;
  padding: 0;
}

.summary-block-inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

/* 与 .retention-icon 同尺寸、正圆、同色底；右侧留白略大于留存（双行标题+数字，避免贴太紧） */
.summary-block-icon {
  width: clamp(38px, 3.2vw + 22px, 44px);
  height: clamp(38px, 3.2vw + 22px, 44px);
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: clamp(12px, 1.15vw, 18px);
  flex-shrink: 0;

  i {
    font-size: clamp(18px, 1.1vw + 0.55rem, 22px);
    color: #2563eb;
  }
}

.summary-block-icon--received {
  background: rgba(16, 185, 129, 0.12);

  i {
    color: #059669;
  }
}

/* 左右内容固定在两侧，分割线由中间 1fr/1fr 保证等距 */
.summary-block:first-child {
  grid-column: 2;
  padding-right: 0;
}

.summary-block:last-child {
  grid-column: 6;
  padding-left: 0;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: clamp(16px, 2.2vw, 26px);
}

.summary-title {
  font-size: clamp(11px, 0.62vw + 0.42rem, 14px);
  color: #9CA3AF;
}

.summary-value {
  font-size: clamp(18px, 1.15vw + 0.65rem, 25px);
  font-weight: 900;
  color: #0F172A;
  font-family: 'Oxanium', 'DIN Alternate', 'DIN', 'Barlow', 'JetBrains Mono', 'Roboto Mono', monospace;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  min-width: clamp(96px, 10vw, 128px);
  margin-top: 2px;
}

.summary-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  font-size: clamp(11px, 0.55vw + 0.38rem, 13px);
  color: #6B7280;
  white-space: nowrap;
  line-height: 1.3;
  margin-top: clamp(-26px, -1.65vw - 0.5rem, -20px);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  i {
    font-size: clamp(12px, 0.65vw + 0.35rem, 14px);
    color: #60A5FA;
  }

  i.icon-dianfei {
    color: #10B981;
  }
}

.meta-item--spaced {
  margin-top: clamp(4px, 0.45vw, 7px);
}

.summary-divider {
  background: #E2E8F0;
  height: clamp(42px, 4.5vh, 50px);
  grid-column: 4;
  justify-self: stretch;
}

.summary-rate {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: auto;
  margin-right: clamp(6px, 0.8vw, 12px);
  gap: clamp(4px, 0.5vw, 6px);
  flex-shrink: 0;
}

.rate-circle {
  --rate: 0;
  width: clamp(50px, 4.5vw + 28px, 58px);
  height: clamp(50px, 4.5vw + 28px, 58px);
  position: relative;
  border-radius: 50%;
  background: conic-gradient(#4F46E5 calc(var(--rate) * 1%), #E5EDFF 0);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rate-circle::before {
  content: '';
  position: absolute;
  inset: clamp(4px, 0.35vw, 5px);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
}

.rate-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.rate-percent {
  font-size: clamp(15px, 0.9vw + 0.45rem, 19px);
  font-weight: 800;
  color: #111827;
}

.rate-unit {
  font-size: clamp(10px, 0.5vw + 0.35rem, 12px);
  color: #6B7280;
}

.rate-label {
  font-size: clamp(10px, 0.55vw + 0.38rem, 13px);
  color: #6B7280;
}

/* 右侧两个简版卡片 */
.quick-card--plain {
  padding-top: 12px;
  padding-bottom: 12px;
  min-height: 66px;
}

.plain-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plain-title {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.plain-sub {
  font-size: 11px;
  color: #6B7280;
}

.plain-btn {
  align-self: flex-start;
  margin-top: 2px;
  padding: 3px 9px;
  border-radius: 6px;
  border: none;
  font-size: 9px;
  font-weight: 600;
  cursor: pointer;
}

.plain-btn--orange {
  background: #F97316;
  color: #fff;
}

.plain-btn--purple {
  background: #6366F1;
  color: #fff;
}

.quick-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

/* 本月 圆形徽章 */
.quick-badge-month {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1677ff;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.30);
}

/* 两列水平排列的指标 */
.quick-metrics {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.quick-metrics--row {
  flex-direction: row;
  gap: 28px;
  align-items: flex-start;
}

.quick-metric {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

/* 纵向排列：标题在上，数值在下 */
.quick-metric--col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.quick-metric--col .metric-title {
  font-size: 11px;
  color: #64748B;
  white-space: nowrap;
  font-weight: 400;
}

.quick-metric--col .metric-value {
  font-size: 18px;
  font-weight: 900;
  color: #0F172A;
  font-family: 'Oxanium', 'DIN Alternate', 'DIN', 'Barlow', 'JetBrains Mono', 'Roboto Mono', monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
  white-space: nowrap;
  line-height: 1.2;
}

/* 普通 metric（非 col 布局） */
.metric-title {
  font-size: 10px;
  color: rgba(71, 85, 105, 0.92);
  white-space: nowrap;
}

.metric-value {
  font-size: 13px;
  font-weight: 800;
  color: #0F172A;
  font-family: 'Oxanium', 'DIN Alternate', 'DIN', 'Barlow', 'JetBrains Mono', 'Roboto Mono', monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.2px;
  white-space: nowrap;
}

/* 图标圆形 */
.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i {
    font-size: 20px;
    color: #fff;
  }
}

.quick-icon--orange {
  background: #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.30);
}

.quick-icon--purple {
  background: #8B5CF6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.30);
}

.quick-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.quick-title {
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-sub {
  font-size: 11px;
  color: rgba(100, 116, 139, 0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 按钮基础 */
.quick-btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 600;
  color: #0F172A;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:focus { outline: none; }
}

/* 按钮颜色变体 */
.quick-btn--outline-blue {
  border-color: rgba(22, 119, 255, 0.55);
  color: #1677ff;
  background: rgba(22, 119, 255, 0.05);

  &:hover {
    background: rgba(22, 119, 255, 0.10);
    border-color: #1677ff;
  }
}

.quick-btn--outline-orange {
  border-color: rgba(245, 158, 11, 0.55);
  color: #d97706;
  background: rgba(245, 158, 11, 0.06);

  &:hover {
    background: rgba(245, 158, 11, 0.12);
    border-color: #f59e0b;
  }
}

.quick-btn--outline-purple {
  border-color: rgba(139, 92, 246, 0.55);
  color: #7c3aed;
  background: rgba(139, 92, 246, 0.06);

  &:hover {
    background: rgba(139, 92, 246, 0.12);
    border-color: #8B5CF6;
  }
}

.scroll-card {
  min-height: 420px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--dash-gap);
  min-width: 0;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.flex-1 {
  flex: 1;
  min-height: 0;
}

.span-3  { grid-column: span 3; }
.span-4  { grid-column: span 4; }
.span-5  { grid-column: span 5; }
.span-6  { grid-column: span 6; }
.span-7  { grid-column: span 7; }
.span-8  { grid-column: span 8; }
.span-9  { grid-column: span 9; }
.span-2  { grid-column: span 2; }

.row-grid {
  display: grid;
  gap: 14px;

  &.col-2 { grid-template-columns: repeat(2, 1fr); }
  &.col-3 { grid-template-columns: repeat(3, 1fr); }
  &.col-4 { grid-template-columns: repeat(4, 1fr); }

  .col-span-2 { grid-column: span 2; }
  .col-span-3 { grid-column: span 3; }
}

.dashboard-card {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(226, 232, 240, 0.75);
  border-radius: 14px;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.05),
    0 18px 36px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  backdrop-filter: blur(14px);
  transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}

.dashboard-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10px;
  right: 10px;
  height: 2px;
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.9), rgba(139, 92, 246, 0.85), rgba(16, 185, 129, 0.85));
  opacity: 0.25;
  border-radius: 999px;
  pointer-events: none;
}

.dashboard-card:hover {
  transform: translateY(-1px);
  border-color: rgba(148, 163, 184, 0.55);
  box-shadow:
    0 2px 6px rgba(15, 23, 42, 0.08),
    0 26px 58px rgba(15, 23, 42, 0.10);
}

.dashboard-card:hover::before {
  opacity: 0.45;
}

/* AI 悬浮球 */
.ai-orb {
  position: fixed;
  z-index: 999;
  width: 88px;
  height: 88px;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  --lift: 0px;
  --scale: 1;
  --tilt-x: 0deg;
  --tilt-y: 0deg;
  transform-style: preserve-3d;
  perspective: 400px;
  transform:
    translateY(var(--lift)) scale(var(--scale)) rotateX(var(--tilt-y)) rotateY(var(--tilt-x));
  transition: transform 0.16s ease, filter 0.16s ease;
}

.ai-orb:hover {
  --lift: -2px;
  --scale: 1.04;
}

.ai-orb.dragging {
  --lift: 0px;
  --scale: 1.02;
  cursor: grabbing;
}

.ai-orb-core {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  filter:
    drop-shadow(0 10px 16px rgba(15, 23, 42, 0.45)) drop-shadow(0 0 16px rgba(37, 99, 235, 0.55));
}

.core-sphere {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-visual {
  --size: 184px;
  --ring-outer: 7px;
  --ring-mid: 6px;
  --ring-inner: 4px;
  --core-size: 74px;
  --wave-stroke: 4;
  --wave-level: 0.65;
  position: relative;
  width: var(--size);
  height: var(--size);
  border-radius: 999px;
  filter:
    drop-shadow(0 12px 18px rgba(15, 23, 42, 0.28)) drop-shadow(0 0 18px rgba(56, 189, 248, 0.18));
}

.ai-visual--sm {
  --size: 80px;
  --ring-outer: 4px;
  --ring-mid: 3px;
  --ring-inner: 2.5px;
  --core-size: 36px;
  --wave-stroke: 3.2;
}

.ai-visual--lg {
  --size: 260px;
  --ring-outer: 8px;
  --ring-mid: 7px;
  --ring-inner: 5px;
  --core-size: 112px;
  --wave-stroke: 5;
}

.ai-visual-ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  pointer-events: none;
  opacity: 0.9;
  mix-blend-mode: screen;
}

.ai-visual-ring-outer {
  background:
    conic-gradient(from 0deg,
      rgba(45, 212, 191, 0) 0deg,
      rgba(45, 212, 191, 0.95) 18deg,
      rgba(45, 212, 191, 0) 44deg,
      rgba(56, 189, 248, 0.95) 66deg,
      rgba(56, 189, 248, 0) 92deg,
      rgba(45, 212, 191, 0.92) 132deg,
      rgba(45, 212, 191, 0) 162deg,
      rgba(56, 189, 248, 0.85) 210deg,
      rgba(56, 189, 248, 0) 248deg,
      rgba(45, 212, 191, 0.9) 300deg,
      rgba(45, 212, 191, 0) 340deg,
      rgba(45, 212, 191, 0) 360deg);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - var(--ring-outer)), black calc(100% - (var(--ring-outer) - 2px)));
  mask: radial-gradient(farthest-side, transparent calc(100% - var(--ring-outer)), black calc(100% - (var(--ring-outer) - 2px)));
  opacity: 0.85;
  animation: orbRingRotate 22s linear infinite;
}

.ai-visual-ring-mid {
  inset: 9%;
  background:
    conic-gradient(from 180deg,
      rgba(45, 212, 191, 0) 0deg,
      rgba(45, 212, 191, 0.95) 34deg,
      rgba(45, 212, 191, 0) 62deg,
      rgba(56, 189, 248, 0.95) 92deg,
      rgba(56, 189, 248, 0) 122deg,
      rgba(45, 212, 191, 0.85) 160deg,
      rgba(45, 212, 191, 0) 210deg,
      rgba(56, 189, 248, 0.9) 250deg,
      rgba(56, 189, 248, 0) 292deg,
      rgba(45, 212, 191, 0) 360deg);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - var(--ring-mid)), black calc(100% - (var(--ring-mid) - 2px)));
  mask: radial-gradient(farthest-side, transparent calc(100% - var(--ring-mid)), black calc(100% - (var(--ring-mid) - 2px)));
  opacity: 0.95;
  animation: orbRingRotate 14s linear infinite reverse;
}

.ai-visual-ring-inner {
  inset: 18%;
  background:
    conic-gradient(from 20deg,
      rgba(56, 189, 248, 0) 0deg,
      rgba(56, 189, 248, 0.95) 58deg,
      rgba(56, 189, 248, 0) 92deg,
      rgba(45, 212, 191, 0.95) 126deg,
      rgba(45, 212, 191, 0) 160deg,
      rgba(56, 189, 248, 0.9) 212deg,
      rgba(56, 189, 248, 0) 250deg,
      rgba(45, 212, 191, 0) 360deg);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - var(--ring-inner)), black calc(100% - (var(--ring-inner) - 1px)));
  mask: radial-gradient(farthest-side, transparent calc(100% - var(--ring-inner)), black calc(100% - (var(--ring-inner) - 1px)));
  opacity: 0.75;
  animation: orbRingRotate 18s linear infinite;
}

.ai-visual-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--core-size);
  height: var(--core-size);
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background:
    radial-gradient(circle at 40% 36%, rgba(255, 255, 255, 0.70), rgba(255, 255, 255, 0) 40%),
    radial-gradient(circle at 70% 70%, rgba(52, 211, 153, 0.52), rgba(3, 48, 36, 0.90) 62%),
    radial-gradient(circle at 35% 75%, rgba(16, 185, 129, 0.62), rgba(3, 48, 36, 0.94) 68%),
    linear-gradient(135deg, rgba(3, 48, 36, 0.90), rgba(2, 42, 32, 1));
  box-shadow:
    inset 0 0 18px rgba(2, 42, 32, 0.70),
    0 0 18px rgba(16, 185, 129, 0.46),
    0 0 22px rgba(45, 212, 191, 0.20);
  overflow: hidden;
}

.ai-visual-core::after {
  content: '';
  position: absolute;
  inset: 16%;
  border-radius: inherit;
  background: radial-gradient(circle at 28% 18%, rgba(255, 255, 255, 0.35), transparent 60%);
  mix-blend-mode: soft-light;
  opacity: 0.9;
}

.ai-visual-wave {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(var(--size) * 1.7);
  height: calc(var(--size) * 0.34);
  transform: translate(-50%, -50%) scaleY(var(--wave-level));
  transform-origin: center;
  overflow: visible;
  opacity: 0.95;
  pointer-events: none;
  filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.55));
}

.ai-visual-wave .wave-core,
.ai-visual-wave .wave-glow {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ai-visual-wave .wave-glow {
  stroke: rgba(56, 189, 248, 0.7);
  stroke-width: calc(var(--wave-stroke) + 2px);
  stroke-dasharray: 26 16;
  animation: panelWaveDash 2.6s linear infinite;
  filter: blur(1.4px);
  opacity: 0.9;
}

.ai-visual-wave .wave-core {
  stroke: rgba(125, 211, 252, 0.98);
  stroke-width: var(--wave-stroke);
  stroke-dasharray: 16 10;
  animation: panelWaveDash 1.9s linear infinite;
}

.ai-visual-wave-left {
  transform: translate(-50%, -50%) scaleY(var(--wave-level)) translateX(-3%);
}

.ai-visual-wave-right {
  transform: translate(-50%, -50%) scaleY(var(--wave-level)) scaleX(-1) translateX(-3%);
}

.ai-orb-ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  pointer-events: none;
}

.ai-orb-ring-outer {
  background:
    conic-gradient(from 0deg,
      rgba(59, 130, 246, 0) 0deg,
      rgba(59, 130, 246, 0.9) 40deg,
      rgba(20, 184, 166, 0.9) 80deg,
      rgba(59, 130, 246, 0.9) 120deg,
      rgba(20, 184, 166, 0.0) 180deg,
      rgba(20, 184, 166, 0.0) 360deg);
  -webkit-mask:
    radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 1px));
  mask:
    radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 1px));
  opacity: 0.7;
  animation: orbRingRotate 18s linear infinite;
}

.ai-orb-ring-inner {
  inset: 7px;
  background:
    conic-gradient(from 180deg,
      rgba(45, 212, 191, 0) 0deg,
      rgba(45, 212, 191, 0.9) 60deg,
      rgba(56, 189, 248, 0.9) 110deg,
      rgba(45, 212, 191, 0.9) 150deg,
      rgba(45, 212, 191, 0.0) 210deg,
      rgba(45, 212, 191, 0.0) 360deg);
  -webkit-mask:
    radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 0.5px));
  mask:
    radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 0.5px));
  opacity: 0.9;
  animation: orbRingRotate 10s linear infinite reverse;
}

.ai-orb.is-ai .ai-visual-core {
  box-shadow:
    inset -6px -8px 22px rgba(0, 0, 0, 0.96),
    0 0 40px rgba(252, 211, 77, 0.78),
    0 0 56px rgba(129, 178, 255, 0.85);
}

.ai-orb-label {
  position: absolute;
  left: 96px;
  top: 50%;
  transform: translateY(-50%) translateX(-6px);
  padding: 7px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: rgba(241, 245, 249, 0.95);
  background:
    radial-gradient(120% 140% at 10% 30%, rgba(56, 189, 248, 0.18), rgba(0, 0, 0, 0) 62%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 1));
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-shadow: 0 14px 30px rgba(2, 6, 23, 0.48);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease;
  white-space: nowrap;
}

.ai-orb:hover .ai-orb-label {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

/* Animations */
@keyframes orbRingRotate {
  0%   { transform: rotateZ(0deg); }
  100% { transform: rotateZ(360deg); }
}

@keyframes panelWaveDash {
  0%   { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -56; }
}

/* Responsive */
@media (max-width: 1366px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .span-2, .span-3, .span-4, .span-5,
  .span-6, .span-7, .span-8, .span-9 {
    grid-column: span 1;
  }

  .row-grid {
    &.col-3, &.col-4 {
      grid-template-columns: repeat(2, 1fr);
    }
    .col-span-2, .col-span-3 {
      grid-column: span 2;
    }
  }

  .header-metrics {
    display: none;
  }

  .quick-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-height: 900px) {
  .dashboard-content { gap: var(--dash-gap); }
  .first-screen { gap: var(--dash-gap); }
  .first-screen-body {
    gap: var(--dash-gap);
    grid-template-rows: minmax(0, 1.12fr) minmax(0, 1fr);
  }
  .quick-actions { gap: var(--dash-gap); }
  .quick-card {
    min-height: 66px;
    padding: 10px 14px;
  }
  .quick-badge-month,
  .quick-icon {
    width: 40px;
    height: 40px;
    font-size: 12px;
  }
  .quick-metric--col .metric-value {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .span-2, .span-3, .span-4, .span-5,
  .span-6, .span-7, .span-8, .span-9 {
    grid-column: span 1;
  }
  .row-grid {
    &.col-2, &.col-3, &.col-4 {
      grid-template-columns: 1fr;
    }
    .col-span-2, .col-span-3 {
      grid-column: span 1;
    }
  }
  .quick-actions {
    grid-template-columns: 1fr;
  }
  .quick-metrics--row {
    gap: 16px;
  }
}
</style>
