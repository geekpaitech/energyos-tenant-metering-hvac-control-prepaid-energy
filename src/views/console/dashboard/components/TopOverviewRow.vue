<template>
  <div class="top-overview" :class="[`variant-${variant}`]">
    <div class="row-container">

      <!-- 盒子1：租户今日用电 -->
      <div v-if="showToday" class="card box-1" :class="{ 'card-entered': cardEntered[0] }" @click="goTo('/energy/electricity-report')">
        <div class="card-shimmer"></div>
        <div class="box1-title">
          <span class="title-icon">⚡</span>
          {{ $t('dashboard.topOverview.tenantTodayElec') }}
        </div>
        <div class="box1-value-wrap">
          <div
            v-for="(char, i) in todayElecChars"
            :key="i"
            :class="['char-block', char === '.' || char === ',' ? 'char-dot' : 'char-digit']"
            :style="char !== '.' && char !== ',' ? { animationDelay: `${0.35 + i * 0.07}s` } : {}"
          >
            <span class="char-face">{{ char }}</span>
            <span class="char-glow">{{ char }}</span>
          </div>
          <span class="unit-label">kWh</span>
        </div>
        <div class="box1-sub">
          <span class="fee-dot"></span>
          {{ $t('dashboard.topOverview.elecFeePrefix') }}<span class="fee-value">¥{{ todayFeeText }}</span>
        </div>
      </div>

      <!-- 盒子2：租户数 -->
      <div v-if="showStats" class="card box-2" :class="{ 'card-entered': cardEntered[1] }" @click="goTo('/metering/tenant/list')">
        <div class="card-shimmer"></div>
        <div class="head-icon-wrap">
          <div class="head-icon">
            <i class="iconfont icon-zuhu-qiye"></i>
          </div>
          <div class="icon-ring"></div>
        </div>
        <div class="head-meta">
          <div class="head-title">{{ $t('dashboard.topOverview.tenantCount') }}</div>
          <div class="head-value rolling-value" :data-target="tenantCountRaw">
            <span class="val-display">{{ tenantCountText }}</span>
          </div>
          <div class="head-foot ok">
            <span class="trend-arrow">↑</span>
            {{ $t('dashboard.topOverview.monthNewTenants') }} +<rolling-number-text class="delta-val" :text="tenantDeltaText" />
          </div>
        </div>
      </div>

      <!-- 盒子3：其余5项 -->
      <div v-if="showStats" class="card box-3" :class="{ 'card-entered': cardEntered[2] }">
        <div class="card-shimmer"></div>

        <div v-for="(item, idx) in metaItems" :key="idx"
          :class="['box3-item', item.route ? 'is-clickable' : '']"
          :style="disableBottomAnimations ? {} : { animationDelay: `${0.5 + idx * 0.1}s` }"
          @click="handleMetaItemClick(item)"
        >
          <div class="head-icon-wrap">
            <div class="head-icon" :class="`icon-color-${idx}`">
              <i :class="item.icon"></i>
            </div>
            <div class="icon-ring" :class="`ring-color-${idx}`"></div>
          </div>
          <div class="head-meta">
            <div class="head-title">{{ $t(item.titleKey) }}</div>
            <div class="head-value" :class="`val-color-${idx}`">
              <template v-if="disableBottomAnimations">
                <span>{{ item.valueText }}</span>
              </template>
              <template v-else>
                <rolling-number-text :text="item.valueText" />
              </template>
            </div>
            <div class="head-foot bad">
              <span class="offline-dot"></span>
              <el-tooltip
                v-if="item.abnormalOfflineText !== undefined"
                :content="offlineTip(item)"
                placement="top"
                effect="dark"
              >
                <span class="offline-inline">
                  {{ $t('dashboard.topOverview.offline') }}
                  <template v-if="disableBottomAnimations">
                    <span class="offline-val">{{ item.offlineText }}</span>
                  </template>
                  <template v-else>
                    <rolling-number-text class="offline-val" :text="item.offlineText" />
                  </template>
                </span>
              </el-tooltip>
              <template v-else>
                {{ $t('dashboard.topOverview.offline') }}
                <template v-if="disableBottomAnimations">
                  <span class="offline-val">{{ item.offlineText }}</span>
                </template>
                <template v-else>
                  <rolling-number-text class="offline-val" :text="item.offlineText" />
                </template>
              </template>
            </div>
          </div>
        </div>

        <!-- 环形图（已修复 100% 不闭合 + 在线率计算范围） -->
        <div class="box3-item ring-item is-clickable" :style="disableBottomAnimations ? {} : { animationDelay: '0.9s' }" @click="goTo('/device/electricity')">
          <div class="ring-wrap">
            <svg class="ring-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" stroke-width="9"/>
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="url(#ringGrad)"
                stroke-width="9"
                stroke-linecap="round"
                :stroke-dasharray="dashArray"
                :stroke-dashoffset="dashOffset"
                class="ring-progress"
              />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#60A5FA"/>
                  <stop offset="100%" stop-color="#6366F1"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="ring-inner-text">
              <span class="ring-val">
                <template v-if="disableBottomAnimations">
                  <span>{{ onlineRatePct }}</span>
                </template>
                <template v-else>
                  <rolling-number-text :text="String(onlineRatePct)" />
                </template>
                <span class="ring-pct">%</span>
              </span>
              <span class="ring-lbl">{{ $t('dashboard.topOverview.onlineRate') }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import { getTenantTopStatistics, isDemoManager, queryCwTenantTodayUse } from '@/api/newDashboard'
import RollingNumberText from './RollingNumberText.vue'

export default {
  name: 'TopOverviewRow',
  components: { RollingNumberText },
  props: {
    variant: {
      type: String,
      default: 'full' // full | today-only | stats-only
    }
  },
  data () {
    return {
      loading: false,
      topDto: null,
      todayDto: null,
      cardEntered: [false, false, false],
      requestSeq: 0
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    showToday () {
      return this.variant === 'full' || this.variant === 'today-only'
    },
    showStats () {
      return this.variant === 'full' || this.variant === 'stats-only'
    },
    disableBottomAnimations () {
      return this.variant === 'stats-only'
    },
    todayElecText () {
      const n = Number(this.todayDto && this.todayDto.useElec)
      if (!Number.isFinite(n)) return '--'
      return n.toFixed(2)
    },
    todayFeeText () {
      const n = Number(this.todayDto && this.todayDto.useAmount)
      if (!Number.isFinite(n)) return '--'
      return Number(n.toFixed(2)).toLocaleString()
    },
    todayFeeValue () {
      const n = Number(this.todayDto && this.todayDto.useAmount)
      return Number.isFinite(n) ? n : null
    },
    tenantCountRaw () {
      if (!this.topDto) return null
      const n = Number(this.topDto && this.topDto.tenantCount)
      return Number.isFinite(n) ? Math.round(n) : null
    },
    tenantCountText () {
      if (!this.topDto) return '--'
      return this.tenantCountRaw.toLocaleString()
    },
    tenantDeltaRaw () {
      const n = Number(this.topDto && this.topDto.monthNewTenantCount)
      return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null
    },
    tenantDeltaText () {
      const n = Number(this.topDto && this.topDto.monthNewTenantCount)
      if (!Number.isFinite(n)) return '--'
      return Math.max(0, Math.round(n)).toLocaleString()
    },
    elecMeterCountText () {
      const n = Number(this.topDto && this.topDto.meterCount)
      if (!Number.isFinite(n)) return '--'
      return Math.max(0, Math.round(n)).toLocaleString()
    },
    elecOfflineText () {
      const n = Number(this.topDto && this.topDto.meterOfflineCount)
      if (!Number.isFinite(n)) return '--'
      return Math.max(0, Math.round(n)).toLocaleString()
    },
    elecAbnormalOfflineText () {
      const n = Number(this.topDto && this.topDto.meterAbnormalOfflineCount)
      if (!Number.isFinite(n)) return '--'
      return Math.max(0, Math.round(n)).toLocaleString()
    },
    waterCountText () {
      const n = Number(this.topDto && this.topDto.waterCount)
      if (!Number.isFinite(n)) return '--'
      return Math.max(0, Math.round(n)).toLocaleString()
    },
    waterOfflineText () {
      const n = Number(this.topDto && this.topDto.waterOfflineCount)
      if (!Number.isFinite(n)) return '--'
      return Math.max(0, Math.round(n)).toLocaleString()
    },
    airCountText () {
      const n = Number(this.topDto && this.topDto.airCount)
      if (!Number.isFinite(n)) return '--'
      return Math.max(0, Math.round(n)).toLocaleString()
    },
    airOfflineText () {
      const n = Number(this.topDto && this.topDto.airOfflineCount)
      if (!Number.isFinite(n)) return '--'
      return Math.max(0, Math.round(n)).toLocaleString()
    },

    // ✅ 修复：在线率 = (所有设备总数 - 所有设备离线总数) / 所有设备总数
    // 包含：电表 + 水表 + 空调内机 + 其他智能设备(固定为0)
    onlineRate () {
      if (!this.topDto) return null
      const meterCount = Math.max(0, Number(this.topDto.meterCount || 0))
      const waterCount = Math.max(0, Number(this.topDto.waterCount || 0))
      const airCount = Math.max(0, Number(this.topDto.airCount || 0))
      const meterOffline = Math.max(0, Number(this.topDto.meterOfflineCount || 0))
      const waterOffline = Math.max(0, Number(this.topDto.waterOfflineCount || 0))
      const airOffline = Math.max(0, Number(this.topDto.airOfflineCount || 0))

      const totalCount = meterCount + waterCount + airCount
      const totalOffline = meterOffline + waterOffline + airOffline

      if (totalCount <= 0) return 0

      const totalOnline = Math.max(0, totalCount - totalOffline)
      return Math.max(0, Math.min(1, totalOnline / totalCount))
    },

    onlineRatePct () {
      if (this.onlineRate === null) return 0
      const v = Math.round(this.onlineRate * 100)
      return Math.max(0, Math.min(100, v))
    },

    todayElecChars () {
      return this.todayElecText.split('')
    },

    metaItems () {
      return [
        {
          icon: 'iconfont icon-dianbiao5',
          titleKey: 'dashboard.topOverview.meterElecCount',
          valueRaw: this.safeInt(this.topDto && this.topDto.meterCount),
          valueText: this.elecMeterCountText,
          offlineRaw: this.safeInt(this.topDto && this.topDto.meterOfflineCount),
          offlineText: this.elecOfflineText,
          abnormalOfflineText: this.elecAbnormalOfflineText,
          abnormalOfflineRaw: this.safeInt(this.topDto && this.topDto.meterAbnormalOfflineCount),
          route: '/device/electricity'
        },
        {
          icon: 'iconfont icon-shuibiaoguohu-',
          titleKey: 'dashboard.topOverview.waterMeterCount',
          valueRaw: this.safeInt(this.topDto && this.topDto.waterCount),
          valueText: this.waterCountText,
          offlineRaw: this.safeInt(this.topDto && this.topDto.waterOfflineCount),
          offlineText: this.waterOfflineText,
          route: '/device/watermeter'
        },
        {
          icon: 'iconfont icon-kongtiao1',
          titleKey: 'dashboard.topOverview.acIndoorCount',
          valueRaw: this.safeInt(this.topDto && this.topDto.airCount),
          valueText: this.airCountText,
          offlineRaw: this.safeInt(this.topDto && this.topDto.airOfflineCount),
          offlineText: this.airOfflineText,
          route: { path: '/device/conditioning', query: { tab: 'indoor' } }
        },
        { icon: 'iconfont icon-diannao', titleKey: 'dashboard.topOverview.otherSmartDevices', valueRaw: 0, valueText: '0', offlineRaw: 0, offlineText: '0', route: null }
      ]
    },

    // 精确周长计算
    circumference () {
      return 2 * Math.PI * 42 // ≈ 263.8938
    },
    dashArray () {
      const progress = (this.onlineRatePct / 100) * this.circumference
      const rest = this.circumference - progress
      return `${progress} ${rest}`
    },
    dashOffset () {
      return 0
    }
  },
  watch: {
    currentManagerId: {
      handler (newVal, oldVal) {
        this.loadAll({ resetData: newVal !== oldVal })
      },
      immediate: true
    }
  },
  mounted () {
    if (this.disableBottomAnimations) {
      this.cardEntered = [true, true, true]
      return
    }
    [0, 1, 2].forEach((i) => {
      setTimeout(() => {
        this.$set(this.cardEntered, i, true)
      }, 80 + i * 160)
    })
  },
  methods: {
    goTo (route) {
      this.$router.push(route)
    },
    safeInt (v) {
      if (typeof v === 'boolean' || v === '' || v == null) return null
      const n = Number(v)
      return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null
    },
    handleMetaItemClick (item) {
      const route = item && item.route
      if (!route) return
      this.goTo(route)
    },
    offlineTip (item) {
      const abnormal = (item && item.abnormalOfflineRaw) || 0
      const total = (item && item.offlineRaw) || 0
      const normal = Math.max(0, total - abnormal)
      return `${this.$t('dashboard.topOverview.abnormalOffline')}：${abnormal.toLocaleString()}  ${this.$t('dashboard.topOverview.normalOffline')}：${normal.toLocaleString()}`
    },
    sanitizeTopDto (raw) {
      const dto = raw || {}
      const readCount = (key) => {
        const val = dto[key]
        if (typeof val === 'boolean' || val === '' || val == null) return null
        const n = Number(val)
        return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null
      }
      return {
        ...dto,
        tenantCount: readCount('tenantCount'),
        monthNewTenantCount: readCount('monthNewTenantCount'),
        meterCount: readCount('meterCount'),
        meterOfflineCount: readCount('meterOfflineCount'),
        meterAbnormalOfflineCount: readCount('meterAbnormalOfflineCount'),
        waterCount: readCount('waterCount'),
        waterOfflineCount: readCount('waterOfflineCount'),
        airCount: readCount('airCount'),
        airOfflineCount: readCount('airOfflineCount')
      }
    },
    async loadAll (options = {}) {
      const { resetData = false } = options
      const managerId = this.currentManagerId
      const seq = ++this.requestSeq

      if (!managerId) {
        this.topDto = null
        this.todayDto = null
        return
      }

      if (resetData) {
        this.topDto = null
        this.todayDto = null
      }

      this.loading = true
      try {
        if (isDemoManager(managerId)) {
          if (seq !== this.requestSeq || managerId !== this.currentManagerId) return
          this.todayDto = { useElec: 6452.76, useAmount: 34200.82 }
          this.topDto = {
            tenantCount: 1540,
            monthNewTenantCount: 10,
            meterCount: 8,
            meterOfflineCount: 0,
            meterAbnormalOfflineCount: 0,
            waterCount: 7,
            waterOfflineCount: 7, // 模拟水表全部离线
            airCount: 8,
            airOfflineCount: 0,
            airRunningCount: 0
          }
          return
        }
        const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD')
        const [topSettled, todaySettled] = await Promise.allSettled([
          getTenantTopStatistics({ managerId, beginTime: yesterday, endTime: yesterday }),
          queryCwTenantTodayUse({ managerId })
        ])

        // 只允许“当前最新请求”回写，避免管理方切换时旧请求串包覆盖
        if (seq !== this.requestSeq || managerId !== this.currentManagerId) return

        const topRes = topSettled.status === 'fulfilled' ? topSettled.value : null
        const todayRes = todaySettled.status === 'fulfilled' ? todaySettled.value : null
        const topOk = !!(topRes && (topRes.code === 200 || topRes.code === '200'))
        const todayOk = !!(todayRes && (todayRes.code === 200 || todayRes.code === '200'))

        // 刷新失败时保留旧值，避免底部模块被失败请求重置成 0/空
        if (topOk) this.topDto = this.sanitizeTopDto(topRes.data || {})
        if (todayOk) this.todayDto = todayRes.data || null
      } finally {
        // 仅最新请求结束时收敛 loading，避免并发请求互相干扰
        if (seq === this.requestSeq) {
          this.loading = false
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
$blue:        #3B82F6;
$blue-light:  #60A5FA;
$indigo:      #6366F1;
$green:       #10B981;
$red:         #EF4444;
$num-color:   #1E40AF;
$fee-color:   #334155;
$text-mid:    #475569;
$text-light:  #64748B;

%num-font {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

/* 顶栏高度：略收紧，减少「卡片很高但内容居中」的空白感 */
.top-overview {
  width: 100%;
  height: clamp(104px, 10vh, 126px);
}

.top-overview.variant-today-only .box-1 {
  flex: 1 1 auto;
  min-width: 0;
}

/* 今日用电单卡：顶对齐 + 略减内边距与标题间距，信息更「满」 */
.top-overview.variant-today-only .box-1.card {
  justify-content: flex-start;
  padding: 10px 12px;
}

.top-overview.variant-today-only .box1-title {
  margin-bottom: 8px;
}

.top-overview.variant-today-only .box1-value-wrap {
  margin-bottom: 6px;
}

/* 顶部 red 框互换后的底部 stats 模块：整体缩小字号与环形图尺寸 */
.top-overview.variant-stats-only {
  height: clamp(92px, 8.8vh, 112px);

  /* 底部模块切换管理方时禁用所有入场动画，避免数据展示被动画过程干扰 */
  .card,
  .card-entered,
  .box3-item,
  .head-value,
  .head-foot,
  .ring-progress,
  .ring-inner-text,
  .icon-ring,
  .head-icon,
  .card-shimmer {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .card-shimmer {
    display: none !important;
  }

  /* box-2：租户数 */
  .box-2 {
    gap: 8px;
  }

  .head-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .head-title {
    font-size: 10px;
    margin-bottom: 2px;
  }

  .head-value {
    font-size: 20px;
    margin-bottom: 3px;
  }

  .head-foot {
    font-size: 10px;
  }

  /* box-3：5项指标 + 环形图 */
  .box-3 {
    padding: 9px clamp(6px, 0.95vw, 12px);
    column-gap: clamp(6px, 0.9vw, 10px);
  }

  .box3-item {
    gap: 9px;
  }

  .ring-wrap {
    width: 70px;
    height: 70px;
  }

  .ring-svg {
    width: 70px;
    height: 70px;
  }

  .ring-val {
    font-size: 16px;
  }

  .ring-pct {
    font-size: 10px;
  }

  .ring-lbl {
    font-size: 8px;
    margin-top: 1px;
  }
}

.row-container {
  display: flex;
  gap: var(--dash-gap, clamp(10px, 1.1vw, 14px));
  width: 100%;
  height: 100%;
}

.card {
  position: relative;
  overflow: hidden;
  height: 100%;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 14px;
  padding: 16px;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.06),
    0 4px 16px rgba(59, 130, 246, 0.04);

  opacity: 0;
  transform: translateY(28px) rotateX(8deg) scale(0.97);
  transform-origin: top center;
  transition:
    opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.3s ease;

  &.card-entered {
    opacity: 1;
    transform: translateY(0) rotateX(0deg) scale(1);
    box-shadow:
      0 2px 8px rgba(15, 23, 42, 0.07),
      0 8px 32px rgba(59, 130, 246, 0.08);
  }

  &:hover {
    box-shadow:
      0 4px 20px rgba(15, 23, 42, 0.1),
      0 12px 40px rgba(59, 130, 246, 0.14);
    transform: translateY(-2px) scale(1.005);
    border-color: rgba(96, 165, 250, 0.4);
  }
}

.card-shimmer {
  position: absolute;
  top: 0; left: -120%;
  width: 60%; height: 100%;
  background: linear-gradient(105deg,
    transparent 30%,
    rgba(255,255,255,0.55) 50%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 10;

  .card-entered & {
    animation: shimmer-sweep 0.9s 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
}

@keyframes shimmer-sweep {
  0%   { left: -120%; }
  100% { left: 160%; }
}

/* ─── BOX-1 ─── */
.box-1 {
  flex: 0 1 clamp(260px, 18vw, 300px);
  display: flex;
  flex-direction: column;
  /* 默认居中；variant-today-only 内覆盖为 flex-start，避免上下大块留白 */
  justify-content: center;
  background: #ffffff;
  border-color: rgba(226, 232, 240, 0.85);
  cursor: pointer;

  &.card-entered {
    box-shadow:
      0 2px 8px rgba(15, 23, 42, 0.06),
      0 8px 24px rgba(15, 23, 42, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  &:hover {
    box-shadow:
      0 4px 16px rgba(15, 23, 42, 0.08),
      0 12px 32px rgba(15, 23, 42, 0.06);
    transform: translateY(-2px) scale(1.003);
    border-color: rgba(59, 130, 246, 0.25);
  }
}

.box1-title {
  font-size: 14.5px;
  color: $text-mid;
  font-weight: 600;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  letter-spacing: 0.02em;
}

.title-icon {
  font-size: 16px;
  animation: pulse-icon 2s 1.2s ease-in-out infinite;
}

@keyframes pulse-icon {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.2) rotate(-5deg); }
}

.box1-value-wrap {
  display: flex;
  gap: 3px;
  align-items: baseline;
  margin-bottom: 12px;
}

.char-digit {
  position: relative;
  width: 26px;
  height: 36px;
  background: linear-gradient(160deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%);
  border-radius: 5px;
  color: #fff;
  font-size: 20px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 3px 8px rgba(59,130,246,0.35),
    0 1px 2px rgba(59,130,246,0.2),
    inset 0 1px 0 rgba(255,255,255,0.25);
  overflow: hidden;

  .card-entered & {
    animation: digit-drop 0.6s both cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 45%;
    background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%);
    border-radius: 5px 5px 0 0;
    pointer-events: none;
  }
}

@keyframes digit-drop {
  0%   { opacity: 0; transform: translateY(-22px) scale(0.7); }
  60%  { opacity: 1; transform: translateY(4px) scale(1.05); }
  80%  { transform: translateY(-2px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.char-face {
  position: relative;
  z-index: 2;
}

.char-glow {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.5);
  filter: blur(4px);
  font-size: 20px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

.char-dot {
  width: 10px;
  color: $blue;
  font-size: 22px;
  font-weight: 500;
  display: flex;
  align-items: flex-end;
  padding-bottom: 3px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

.unit-label {
  font-size: 13px;
  color: $blue;
  font-weight: 500;
  margin-left: 2px;
  align-self: flex-end;
  padding-bottom: 3px;
  letter-spacing: 0.04em;
  opacity: 0;

  .card-entered & {
    animation: fade-up 0.5s 1.1s both ease-out;
  }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.box1-sub {
  font-size: 14px;
  color: $text-light;
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0;

  .card-entered & {
    animation: fade-up 0.5s 1.2s both ease-out;
  }
}

.fee-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: $green;
  box-shadow: 0 0 4px $green;
  flex-shrink: 0;
  animation: dot-breathe 2s 1.5s ease-in-out infinite;
}

@keyframes dot-breathe {
  0%, 100% { box-shadow: 0 0 3px $green; }
  50%       { box-shadow: 0 0 8px $green; }
}

.fee-value {
  color: $fee-color;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}

/* ─── BOX-2 ─── */
.box-2 {
  flex: 0 1 clamp(200px, 16vw, 260px);
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
}

.head-icon-wrap {
  position: relative;
  flex-shrink: 0;
}

.head-icon {
  width: 50px; height: 50px;
  border-radius: 50%;
  background: rgba(59,130,246,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563EB;
  font-size: 22px;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease, background 0.3s ease;

  i,
  .iconfont {
    font-size: inherit;
    line-height: 1;
  }

  .card-entered & {
    animation: icon-pop 0.7s 0.4s both cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .card:hover & {
    transform: scale(1.08) rotate(-4deg);
    background: rgba(59,130,246,0.16);
  }
}

@keyframes icon-pop {
  0%   { opacity: 0; transform: scale(0.4) rotate(-20deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

.icon-ring {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 1.5px solid rgba(59,130,246,0.25);
  opacity: 0;

  .card-entered & {
    animation: ring-expand 0.8s 0.55s both ease-out;
  }
}

@keyframes ring-expand {
  0%   { opacity: 0; transform: scale(0.6); }
  50%  { opacity: 1; }
  100% { opacity: 0.6; transform: scale(1); }
}

@each $i, $c in (0: #3B82F6, 1: #06B6D4, 2: #8B5CF6, 3: #F59E0B) {
  .icon-color-#{$i} { color: $c; background: rgba($c, 0.1); }
  .ring-color-#{$i} { border-color: rgba($c, 0.3); }
}

.head-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.head-title {
  font-size: 11.5px;
  color: $text-light;
  margin-bottom: 4px;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.head-value {
  @extend %num-font;
  font-size: 26px;
  line-height: 1;
  margin-bottom: 6px;
  opacity: 0;
  color: $num-color;
  background: none;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: unset;
  background-clip: unset;
  filter: none;
  text-decoration: none;

  .card-entered & {
    animation: count-in 0.6s 0.7s both cubic-bezier(0.22, 1, 0.36, 1);
  }
}

.val-color-0,
.val-color-1,
.val-color-2,
.val-color-3 {
  color: $num-color;
  background: none;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: unset;
  background-clip: unset;
  filter: none;
  text-decoration: none;
}

@keyframes count-in {
  0%   { opacity: 0; transform: translateX(-10px) scale(0.9); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}

.head-foot {
  font-size: 11px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;
  opacity: 0;

  .card-entered & {
    animation: fade-up 0.5s 0.9s both ease-out;
  }

  &.ok { color: $green; }
  &.bad { color: $red; }
}

.trend-arrow {
  font-size: 12px;
  animation: bounce-arrow 1.5s 1.5s ease-in-out infinite;
}

@keyframes bounce-arrow {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-3px); }
}

.offline-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: $red;
  flex-shrink: 0;
  opacity: 0.7;
}

.offline-inline {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

/* ─── BOX-3 ─── */
.box-3 {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  column-gap: clamp(10px, 1.2vw, 16px);
  padding: 16px clamp(10px, 1.1vw, 16px);
}

.box3-item {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-self: center;
  opacity: 0;

  .card-entered & {
    animation: item-slide 0.55s both cubic-bezier(0.22, 1, 0.36, 1);
  }
}

.box3-item.is-clickable {
  cursor: pointer;
}

@keyframes item-slide {
  0%   { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* ─── 环形图 ─── */
.ring-item { justify-self: center; }

.ring-wrap {
  position: relative;
  width: 92px;
  height: 92px;
}

.ring-svg {
  width: 92px;
  height: 92px;
  transform: rotate(-90deg);
  overflow: visible;
}

.ring-progress {
  transition:
    stroke-dasharray 1.2s cubic-bezier(0.22, 1, 0.36, 1),
    stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1);
  filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.55));

  .card-entered & {
    animation: ring-draw 1.4s 0.9s both cubic-bezier(0.22, 1, 0.36, 1);
  }
}

@keyframes ring-draw {
  from {
    stroke-dasharray: 0 263.9;
    stroke-dashoffset: 263.9;
    opacity: 0;
  }
}

.ring-inner-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;

  .card-entered & {
    animation: fade-up 0.5s 1.6s both ease-out;
  }
}

.ring-val {
  font-size: 21px;
  font-weight: 500;
  color: $num-color;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.ring-pct { font-size: 12px; font-weight: 500; }

.ring-lbl {
  font-size: 10px;
  color: $text-light;
  margin-top: 3px;
  letter-spacing: 0.02em;
}
</style>
