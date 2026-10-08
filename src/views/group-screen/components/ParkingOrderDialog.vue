<template>
  <transition name="parking-order-fade">
    <section
      v-if="visible"
      class="parking-order-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="parking-order-title"
      @click.self="handleClose"
    >
      <div class="parking-order-panel">
        <header class="parking-order-head">
          <div class="parking-order-head__title">
            <span class="parking-order-head__icon" aria-hidden="true">
              <i class="el-icon-tickets" />
            </span>
            <div>
              <h2 id="parking-order-title">车辆详情</h2>
              <p>停车场进出场统计与收入明细</p>
            </div>
          </div>

          <div class="parking-order-head__actions">
            <button
              type="button"
              class="parking-order-close"
              aria-label="关闭"
              @click="handleClose"
            >
              <i class="el-icon-close" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div class="parking-order-body">
          <div class="parking-chart-section">
            <div ref="vehicleChart" class="parking-chart" />
          </div>
          <div class="parking-order-table">
            <div v-if="isApartmentScope" class="parking-order-empty">当前业态暂无停车数据</div>
            <template v-else>
            <div class="parking-order-table__head">
              <span class="col-lot">停车场</span>
              <span class="col-money col-money--total">总收入</span>
              <span class="col-count">总车位</span>
              <span class="col-money">临停收入</span>
              <span class="col-count">月租车位</span>
              <span class="col-money">月租车续费</span>
              <span class="col-action">操作</span>
            </div>
            <div
              v-for="(row, idx) in filteredLots"
              :key="idx"
              class="parking-order-table__row"
            >
              <button class="col-lot col-lot--link" @click="openOrderWindow(row)">{{ row.name }}</button>
              <div class="col-money col-money--total">{{ row.total }}</div>
              <div class="col-count">{{ row.totalSpaces }}</div>
              <button class="col-money col-money--link" @click="openOrderWindow(row, 'temp')">{{ row.temp }}</button>
              <div class="col-count">{{ row.monthSpaces }}</div>
              <button class="col-money col-money--link" @click="openOrderWindow(row, 'month')">{{ row.month }}</button>
              <div class="col-action">
                <button
                  type="button"
                  class="parking-order-view-btn"
                  @click="openOrderWindow(row)"
                >查看</button>
              </div>
            </div>
            </template>
          </div>
        </div>
      </div>
    </section>
  </transition>
</template>

<script>
import Cookies from 'js-cookie'
import { buildParkingOrderSsoUrl } from '../utils/parkingOrderSso'
import { fetchDailyVehicleCount } from '@/api/parkingVehicle'
import { getGroupEnergyDateRange } from '@/api/groupEnergyOverview'

// 停车场名称 → parkingLotId 映射
const PARKING_LOT_ID_MAP = {
  旺山航空航天产业园: '17781443693486371487',
  OPC人工智能产业园: '17784783829495808593',
  南都商业广场: '17798463450148815447',
  吴中机器人产业园: '17847945135409733580'
}

// 停车场名称 → 业态映射（名称可能因 API 不同而异，优先用 parkingLotId）
const PARKING_LOT_NAME_BIZ_TYPE_MAP = {
  吴中机器人产业园: '产业园',
  OPC人工智能产业园: '产业园',
  旺山航空航天产业园: '产业园',
  南都商业广场: '商办'
}

const PARKING_LOT_ID_BIZ_TYPE_MAP = {
  '17781443693486371487': '产业园', // 旺山航空航天产业园
  '17784783829495808593': '产业园', // OPC人工智能产业园
  '17847945135409733580': '产业园', // 吴中机器人产业园
  '17798463450148815447': '商办' // 南都商业广场
}

function getBizTypeForParkingLot (item) {
  if (!item) return null
  // 优先按 parkingLotId 匹配
  const id = item.parkingLotId ? String(item.parkingLotId).trim() : ''
  if (id && PARKING_LOT_ID_BIZ_TYPE_MAP[id]) return PARKING_LOT_ID_BIZ_TYPE_MAP[id]
  // 兜底：按名称匹配（营收 API 的 parkingLotId 可能与进出 API 不同）
  const name = (item.parkingLotName || item.name || '').trim()
  if (name && PARKING_LOT_NAME_BIZ_TYPE_MAP[name]) return PARKING_LOT_NAME_BIZ_TYPE_MAP[name]
  return null
}

function filterByBizScope (list, scope) {
  if (scope === '全部') return list
  if (scope === '公寓') return []
  return list.filter(item => getBizTypeForParkingLot(item) === scope)
}

// 收入类型 → ai2park redirect 路径
const REVENUE_REDIRECT_MAP = {
  temp: 'park-data_report_temporary-charge',
  month: 'park-finance_report_vehicle-payment',
  operation: 'park-operation_record_parking'
}

// 二次刷新 dedup：整个会话只刷新一次（全局，不再按 parkingLotId 细分）
const REFRESH_FLAG_KEY = 'groupParkingOrder:refreshed'
const FALLBACK_WINDOW_FLAG = '__groupParkingOrderRefreshed__'

function resolveLotId (row) {
  if (row.parkingLotId) return String(row.parkingLotId).trim()
  const key = (row.name || '').trim()
  if (key && PARKING_LOT_ID_MAP[key]) return PARKING_LOT_ID_MAP[key]
  return ''
}

function isRefreshDone () {
  try {
    if (window && window[FALLBACK_WINDOW_FLAG]) return true
    return !!sessionStorage.getItem(REFRESH_FLAG_KEY)
  } catch (e) {
    return !!(window && window[FALLBACK_WINDOW_FLAG])
  }
}

function markRefreshDone () {
  try {
    sessionStorage.setItem(REFRESH_FLAG_KEY, '1')
  } catch (e) {
    // sessionStorage 不可用时用 window 变量兜底
  }
  if (window) {
    window[FALLBACK_WINDOW_FLAG] = true
  }
}

export default {
  name: 'ParkingOrderDialog',
  props: {
    visible: { type: Boolean, default: false },
    parkingLots: { type: Array, default: () => [] },
    activeTime: { type: String, default: '本月' },
    activeScope: { type: String, default: '全部' }
  },
  data () {
    return {
      vehicleFlowData: [],
      vehicleFlowLoading: false
    }
  },
  computed: {
    isApartmentScope () {
      return this.activeScope === '公寓'
    },
    projectCountText () {
      const list = filterByBizScope(
        this.vehicleFlowData.length ? this.vehicleFlowData : this.parkingLots,
        this.activeScope
      )
      const count = list.length
      const map = { 1: '一个', 2: '两个', 3: '三个', 4: '四个' }
      return map[count] || `${count}个`
    },
    filteredVehicleFlowData () {
      return filterByBizScope(this.vehicleFlowData, this.activeScope)
    },
    filteredLots () {
      return filterByBizScope(this.parkingLots.filter(r => !r.empty), this.activeScope)
    },
    validLots () {
      return this.parkingLots.filter(r => !r.empty)
    }
  },
  watch: {
    visible (val) {
      if (val) {
        this.fetchVehicleFlow()
      }
    },
    activeScope () {
      if (this.visible) this.fetchVehicleFlow()
    }
  },
  mounted () {
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.onResize)
    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer)
      this._refreshTimer = null
    }
    if (this._vehicleChart) {
      this._vehicleChart.dispose()
      this._vehicleChart = null
    }
  },
  methods: {
    async fetchVehicleFlow () {
      this.vehicleFlowLoading = true
      try {
        const { startDate, endDate } = getGroupEnergyDateRange(this.activeTime)
        const data = await fetchDailyVehicleCount({ fromDate: startDate, toDate: endDate })
        this.vehicleFlowData = Array.isArray(data) ? data : []
      } catch (e) {
        this.vehicleFlowData = []
        console.error('获取车辆进出场数据失败:', e)
      } finally {
        this.vehicleFlowLoading = false
        // transition 动画 0.24s，延迟等 DOM 稳定后再初始化 chart
        this.$nextTick(() => {
          setTimeout(() => this.initVehicleChart(), 300)
        })
      }
    },
    initVehicleChart () {
      const el = this.$refs.vehicleChart
      if (!el) return
      if (this._vehicleChart) {
        this._vehicleChart.dispose()
        this._vehicleChart = null
      }
      const chart = this.$echarts.init(el)
      this._vehicleChart = chart

      if (!this.filteredVehicleFlowData.length) {
        chart.setOption({
          title: {
            text: '暂无进出场数据',
            left: 'center',
            top: 'center',
            textStyle: { color: 'rgba(186, 207, 232, 0.6)', fontSize: 14, fontWeight: 400 }
          }
        })
        return
      }

      const names = this.filteredVehicleFlowData.map(d => d.parkingLotName)
      chart.setOption({
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(6, 20, 42, 0.92)',
          borderColor: 'rgba(83, 181, 226, 0.52)',
          textStyle: { color: '#e4f0f8', fontSize: 12 }
        },
        legend: {
          bottom: 0,
          textStyle: { color: 'rgba(186, 207, 232, 0.88)', fontSize: 12 },
          data: ['车场总量', '进场', '退场']
        },
        grid: { top: 12, right: 24, bottom: 44, left: 48 },
        xAxis: {
          type: 'category',
          data: names,
          axisLine: { lineStyle: { color: 'rgba(109, 193, 192, 0.28)' } },
          axisTick: { show: false },
          axisLabel: { color: 'rgba(186, 207, 232, 0.84)', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: 'rgba(109, 193, 192, 0.12)' } },
          axisLabel: { color: 'rgba(186, 207, 232, 0.7)', fontSize: 11 }
        },
        series: [
          {
            name: '车场总量',
            type: 'bar',
            barWidth: 18,
            itemStyle: { color: '#00d4aa' },
            data: this.filteredVehicleFlowData.map(d => d.totalCount)
          },
          {
            name: '进场',
            type: 'bar',
            barWidth: 18,
            itemStyle: { color: '#38bdf8' },
            data: this.filteredVehicleFlowData.map(d => d.enterCount)
          },
          {
            name: '退场',
            type: 'bar',
            barWidth: 18,
            itemStyle: { color: '#f59e0b' },
            data: this.filteredVehicleFlowData.map(d => d.exitCount)
          }
        ]
      })
      chart.off('click')
      chart.on('click', (params) => {
        if (!params || params.dataIndex == null) return
        const lot = this.filteredVehicleFlowData[params.dataIndex]
        if (!lot || !lot.parkingLotId) return
        this.openOrderWindow(lot, 'operation')
      })
    },
    onResize () {
      if (this._vehicleChart) {
        this._vehicleChart.resize()
      }
    },
    token () {
      return Cookies.get('Admin-Token') || this.$store.getters.token || ''
    },
    openOrderWindow (row, revenueType) {
      const lotId = resolveLotId(row)
      if (!lotId) return
      const t = this.token()
      if (!t) {
        this.$message.warning('登录信息已失效，请重新登录后再查看停车订单')
        return
      }

      const redirect = revenueType ? REVENUE_REDIRECT_MAP[revenueType] : undefined
      const url = buildParkingOrderSsoUrl({ token: t, parkId: lotId, redirect })
      if (!url) return

      const orderWindow = window.open(url, 'group-parking-orders')
      if (!orderWindow) {
        this.$message.warning('浏览器已拦截停车订单窗口，请允许弹出窗口后重试')
        return
      }
      orderWindow.focus()
      this.scheduleRefresh({ token: t, parkId: lotId, redirect })
    },
    scheduleRefresh ({ token, parkId, redirect }) {
      // 整个会话只刷新一次，避免不必要的二次刷新干扰
      if (isRefreshDone()) return
      markRefreshDone()

      // 延迟后重新导航同一窗口，解决 SSO 后停留在登录页的问题
      this._refreshTimer = setTimeout(() => {
        this._refreshTimer = null
        const url = buildParkingOrderSsoUrl({ token, parkId, redirect })
        if (!url) return
        window.open(url, 'group-parking-orders')
      }, 2000)
    },
    handleClose () {
      if (this._refreshTimer) {
        clearTimeout(this._refreshTimer)
        this._refreshTimer = null
      }
      this.$emit('close')
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

// 全屏遮罩 — 与 EnergyDrilldownPanel 完全一致
.parking-order-layer {
  position: absolute !important;
  z-index: 80 !important;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 170px 80px;
  background: rgba(2, 11, 27, 0.68);
  backdrop-filter: blur(2px) saturate(0.9);
  -webkit-backdrop-filter: blur(2px) saturate(0.9);
}

.parking-order-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 1160px;
  height: 680px;
  min-width: 0;
  min-height: 0;
  padding: 20px 22px;
  border: 1px solid rgba(83, 181, 226, 0.82);
  border-radius: 12px;
  background:
    radial-gradient(circle at 50% 0%, rgba(39, 126, 182, 0.2), transparent 44%),
    linear-gradient(180deg, #0b2a4a 0%, #071b35 100%);
  box-shadow:
    0 26px 76px rgba(0, 5, 18, 0.64),
    0 0 0 5px rgba(19, 95, 148, 0.22),
    inset 0 1px 0 rgba(205, 239, 255, 0.12);
  overflow: hidden;
  box-sizing: border-box;
}

.parking-order-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 58px;
  padding: 0 0 16px;
  border-bottom: 1px solid rgba(101, 190, 229, 0.34);

  &__title {
    display: flex;
    align-items: center;
    gap: 13px;
    min-width: 0;
  }

  &__icon {
    display: grid;
    place-items: center;
    flex: 0 0 42px;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(104, 202, 234, 0.58);
    border-radius: 9px;
    background: #0d385a;
    color: #8ee5f2;
    box-shadow: inset 0 0 18px rgba(66, 184, 222, 0.12);
    font-size: 23px;
  }

  h2 {
    margin: 0;
    color: #f4fbff;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.3px;
  }

  p {
    margin: 4px 0 0;
    color: rgba(211, 231, 244, 0.76);
    font-size: 12px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.parking-order-close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid rgba(78, 157, 205, 0.46);
  border-radius: 7px;
  background: #071f3a;
  color: rgba(235, 244, 250, 0.88);
  font-size: 17px;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(111, 210, 239, 0.78);
    background: #123d5f;
    color: #fff;
    outline: none;
  }
}

.parking-order-body {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

// 车辆进出场柱状图
.parking-chart-section {
  position: absolute;
  top: 4px;
  left: 0;
  right: 0;
  height: 260px;
  overflow: hidden;
}

.parking-chart {
  width: 100%;
  height: 100%;
}

.parking-order-table {
  position: absolute;
  top: 322px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  border-top: 1px solid rgba(109, 193, 192, 0.18);
  padding: 14px 0 0;

  .parking-order-empty {
    display: grid;
    place-items: center;
    flex: 1;
    min-height: 260px;
    color: rgba(184, 213, 228, 0.72);
    font-size: 16px;
    letter-spacing: 0.5px;
  }

  &__head,
  &__row {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) repeat(5, minmax(0, 0.82fr)) 52px;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__head {
    padding: 0 6px 10px;
    border-bottom: 1px solid rgba(109, 193, 192, 0.1);
    flex-shrink: 0;

    span {
      font-size: 13px;
      font-weight: 600;
      color: rgba(186, 207, 232, 0.92);
    }

    .col-money--total {
      color: rgba(132, 222, 220, 0.92);
    }
  }

  &__row {
    padding: 12px 6px;
    border-radius: 10px;
    background: rgba(8, 32, 60, 0.24);
    border: 1px solid rgba(109, 193, 192, 0.06);
    flex-shrink: 0;

    .col-lot {
      font-size: 13px;
      font-weight: 600;
      color: rgba(220, 236, 252, 0.96);
    }

    .col-money,
    .col-count {
      font-size: 13px;
      font-weight: 700;
      color: rgba(236, 245, 255, 0.96);
    }

    .col-money--total {
      color: $ds-cyan-bright;
    }

    .col-money--link {
      border: none;
      background: transparent;
      padding: 0;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
      font-family: $ds-font-num;
      font-variant-numeric: tabular-nums;
      font-size: 13px;
      font-weight: 700;
      color: rgba(236, 245, 255, 0.96);

      &:hover {
        color: $ds-cyan-bright;
      }

      &.col-money--total {
        color: $ds-cyan-bright;

        &:hover {
          color: lighten($ds-cyan-bright, 10%);
        }
      }
    }
  }
}

.col-lot {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &--link {
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    text-align: left;
    color: rgba(220, 236, 252, 0.96);
    font-family: inherit;
    font-size: inherit;
    font-weight: 600;

    &:hover {
      color: $ds-cyan-bright;
      text-decoration: underline;
    }
  }
}

.col-money {
  min-width: 0;
  font-family: $ds-font-num;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.col-count {
  min-width: 0;
  font-family: $ds-font-num;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.col-action {
  text-align: center;
}

.parking-order-view-btn {
  padding: 3px 10px;
  border: 1px solid rgba(78, 157, 205, 0.38);
  border-radius: 4px;
  background: rgba(7, 31, 58, 0.64);
  color: rgba(235, 244, 250, 0.88);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    border-color: rgba(111, 210, 239, 0.68);
    background: #123d5f;
    color: #fff;
  }
}

// 过渡动画
.parking-order-fade-enter-active,
.parking-order-fade-leave-active {
  transition: opacity 0.24s ease;

  .parking-order-panel {
    transition: transform 0.24s ease, opacity 0.24s ease;
  }
}

.parking-order-fade-enter,
.parking-order-fade-leave-to {
  opacity: 0;

  .parking-order-panel {
    transform: scale(0.96) translateY(10px);
    opacity: 0;
  }
}
</style>
