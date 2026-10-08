<template>
  <screen-scale @scale-change="onScaleChange">
    <div class="energy-screen">
      <energy-header
        class="energy-screen__header"
        :managers="screenManagerList"
        :current-manager-id="currentManagerId"
        :business="business"
        :period="period"
        :loading="screenLoading"
        @manager-change="handleManagerChange"
        @business-change="handleBusinessChange"
        @period-change="handlePeriodChange"
      />
      <kpi-strip class="energy-screen__kpis" :items="screenData.kpis" />

      <main class="energy-screen__main">
        <left-column
          ref="leftColumn"
          :trend="screenData.left.trend"
          :structure="screenData.left.structure"
          :costs="screenData.left.costs"
          :period="period"
        />
        <energy-flow :data="screenData.flow" :period="period" :loading="screenLoading" />
        <right-column
          :investment-return="photovoltaicReturnModel"
          :investment-return-drillable="isNanduManager"
          :show-investment-return="showPhotovoltaicReturn"
          :power-safety="screenData.right.powerSafety"
          :alarm="screenData.right.alarm"
        />
      </main>

      <footer-strip class="energy-screen__footer" :data="screenData.footer" />
    </div>
  </screen-scale>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'
import ScreenScale from './components/ScreenScale.vue'
import EnergyHeader from './components/EnergyHeader.vue'
import KpiStrip from './components/KpiStrip.vue'
import LeftColumn from './components/modules/LeftColumn.vue'
import EnergyFlow from './components/modules/EnergyFlow.vue'
import RightColumn from './components/modules/RightColumn.vue'
import FooterStrip from './components/FooterStrip.vue'
import { createEnergyScreenSkeleton, getEnergyScreenOverview } from './api/energyScreenApi'
import { queryEnergyScreenManagers } from './api/energyScreen'
import {
  ENERGY_SCREEN_MANAGER_IDS,
  MANAGER_TO_BUSINESS,
  NANDU_MANAGER_ID,
  PHOTOVOLTAIC_RETURN_MODEL,
  isPhotovoltaicReturnAvailable
} from './config'

const DRILLDOWN_TARGETS = {
  'electricity-report': { path: '/energy/electricity-report', needsDate: true },
  'consumption-bill': { path: '/metering/bill/consumption-bill', needsDate: true },
  'tenant-list': { path: '/metering/tenant/list', needsDate: false, extraQuery: { fromDashboard: '1' } },
  dashboard: { path: '/metering/dashboard', needsDate: false },
  photovoltaic: { path: '/energy/photovoltaic', needsDate: false, runtimeType: true }
}

export default {
  name: 'GroupEnergyScreen',
  components: { ScreenScale, EnergyHeader, KpiStrip, LeftColumn, EnergyFlow, RightColumn, FooterStrip },
  provide () {
    return {
      energyScreenDrilldown: this.drilldownTo
    }
  },
  data () {
    return {
      screenData: createEnergyScreenSkeleton(),
      screenRequestId: 0,
      screenLoading: false,
      photovoltaicReturnModel: PHOTOVOLTAIC_RETURN_MODEL,
      business: 'all',
      period: 'month'
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId', 'managerList']),
    canDrilldown () {
      return this.currentManagerId != null
    },
    showPhotovoltaicReturn () {
      return isPhotovoltaicReturnAvailable(this.currentManagerId, this.business)
    },
    isNanduManager () {
      return String(this.currentManagerId) === NANDU_MANAGER_ID
    },
    dateRange () {
      const end = moment().format('YYYY-MM-DD')
      let start
      switch (this.period) {
        case 'month': start = moment().startOf('month').format('YYYY-MM-DD'); break
        case 'year': start = moment().startOf('year').format('YYYY-MM-DD'); break
        default: start = end
      }
      return { startDate: start, endDate: end }
    },
    /** 大屏仅展示配置的管理方 */
    screenManagerList () {
      return this.managerList.filter(item =>
        ENERGY_SCREEN_MANAGER_IDS.includes(String(item.managerId))
      )
    }
  },
  watch: {
    currentManagerId: {
      handler () {
        this.syncBusinessFromManager()
        this.loadData()
      },
      immediate: true
    }
  },
  created () {
    this.ensureManagerContext()
  },
  mounted () {
    document.documentElement.classList.add('energy-screen-page')
    document.body.classList.add('energy-screen-page')
    const app = document.getElementById('app')
    if (app) app.classList.add('energy-screen-page')
  },
  beforeDestroy () {
    document.documentElement.classList.remove('energy-screen-page')
    document.body.classList.remove('energy-screen-page')
    const app = document.getElementById('app')
    if (app) app.classList.remove('energy-screen-page')
  },
  methods: {
    async ensureManagerContext () {
      // 大屏进入时强制切到集团模式
      this.$store.commit('manager/SET_CURRENT_MANAGER_ID', null)
      this.$store.commit('manager/SET_CURRENT_MANAGER', null)
      if (this.managerList.length) return
      try {
        const response = await queryEnergyScreenManagers()
        if (!response || String(response.code) !== '200' || !Array.isArray(response.data)) return
        this.$store.commit('manager/SET_MANAGER_LIST', response.data)
      } catch (error) {
        console.error('[energy-screen] manager context init failed', error)
      }
    },
    async loadData () {
      const requestId = ++this.screenRequestId
      const managerId = this.currentManagerId
      this.screenLoading = true
      this.screenData = createEnergyScreenSkeleton()
      try {
        const overview = await getEnergyScreenOverview(managerId, { business: this.business, period: this.period })
        if (requestId !== this.screenRequestId || managerId !== this.currentManagerId) return
        this.screenData = overview
      } catch (error) {
        if (requestId !== this.screenRequestId) return
        console.error('[energy-screen] overview load failed', error)
        this.screenData = createEnergyScreenSkeleton()
      } finally {
        if (requestId === this.screenRequestId) this.screenLoading = false
      }
    },
    /** 管理方变更时，根据映射自动联动业态按钮 */
    syncBusinessFromManager () {
      const id = this.currentManagerId
      if (id == null) return
      const target = MANAGER_TO_BUSINESS[String(id)]
      if (target && target !== this.business) {
        this.business = target
      }
    },
    handleManagerChange (managerId) {
      // 切回集团模式
      if (managerId == null) {
        this.$store.commit('manager/SET_CURRENT_MANAGER_ID', null)
        this.$store.commit('manager/SET_CURRENT_MANAGER', null)
        return
      }
      if (String(managerId) === String(this.currentManagerId)) return
      const manager = this.managerList.find(item => String(item.managerId) === String(managerId))
      if (!manager) return
      this.$store.commit('manager/SET_CURRENT_MANAGER_ID', manager.managerId)
      this.$store.commit('manager/SET_CURRENT_MANAGER', manager)
    },
    handleBusinessChange (business) {
      if (business === this.business) return
      this.business = business
      this.loadData()
    },
    handlePeriodChange (period) {
      this.period = period
      this.loadData()
    },
    onScaleChange () {
      this.$nextTick(() => {
        const left = this.$refs.leftColumn
        if (left && left.resizeCharts) left.resizeCharts()
      })
    },
    /** 大屏下钻：集团模式不跳转，选中管理方后新窗口打开目标页面 */
    drilldownTo (target) {
      if (!this.canDrilldown) return
      const cfg = DRILLDOWN_TARGETS[target]
      if (!cfg) return
      let query
      if (cfg.noParams) {
        query = {}
      } else {
        query = { source: 'group-energy-screen', managerId: String(this.currentManagerId) }
        if (cfg.needsDate) {
          query.startDate = this.dateRange.startDate
          query.endDate = this.dateRange.endDate
        }
        if (cfg.runtimeType) {
          query.runtimeType = this.period
        }
        if (cfg.extraQuery) {
          Object.assign(query, cfg.extraQuery)
        }
      }
      const route = this.$router.resolve({ path: cfg.path, query })
      const win = window.open(route.href, 'energy-screen-drilldown')
      if (win) {
        win.focus()
      } else if (this.$message) {
        this.$message.warning('浏览器已拦截弹出窗口，请允许弹出窗口后重试')
      }
    }
  }
}
</script>

<style lang="scss">
@import './styles/screen.scss';
</style>
