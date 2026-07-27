<template>
  <screen-scale mode="stretch" @scale-change="onScaleChange">
    <div class="group-screen">
      <cockpit-backdrop />
      <div class="group-screen__top">
        <screen-header
          :active-scope.sync="activeScope"
          :active-time.sync="activeTime"
        />
        <kpi-bar
          class="group-screen__refresh-target"
          :class="{ 'is-scope-switching': scopeSwitching }"
          :list="kpiList"
        />
      </div>

      <main
        class="group-screen__main group-screen__refresh-target"
        :class="{ 'is-scope-switching': scopeSwitching }"
        :aria-busy="scopeSwitching ? 'true' : 'false'"
      >
        <div v-if="scopeSwitching" class="group-screen__switch-status" aria-live="polite">
          <i aria-hidden="true" />
          <span>正在更新 {{ activeScope }} · {{ activeTime }} 数据…</span>
        </div>
        <section class="group-screen__col">
          <left-column ref="leftCol" :active-scope="activeScope" :active-time="activeTime" />
        </section>
        <section class="group-screen__col">
          <center-column
            ref="centerCol"
            :active-scope="activeScope"
            :active-time="activeTime"
            :energy-management="energyManagement"
            :parking-management="parkingManagement"
            :work-order-management="workOrderManagement"
          />
        </section>
        <section class="group-screen__col">
          <right-column
            ref="rightCol"
            :active-scope="activeScope"
            :active-time="activeTime"
            :energy-management="energyManagement"
            :parking-management="parkingManagement"
            :work-order-management="workOrderManagement"
          />
        </section>
      </main>
    </div>

    <!-- 首屏加载遮罩：置于 .group-screen 外，避免被 .group-screen>* 规则重置定位 -->
    <screen-loading :visible="initialLoading" />
  </screen-scale>
</template>

<script>
import ScreenScale from './components/ScreenScale.vue'
import CockpitBackdrop from './components/CockpitBackdrop.vue'
import ScreenHeader from './components/ScreenHeader.vue'
import ScreenLoading from './components/ScreenLoading.vue'
import KpiBar from './components/KpiBar.vue'
import LeftColumn from './components/modules/LeftColumn.vue'
import CenterColumn from './components/modules/CenterColumn.vue'
import RightColumn from './components/modules/RightColumn.vue'
import { cloneKpiListTemplate } from './mock'
import { getEnergyManagement, getParkingManagement, getFireManagement, getWorkOrderManagement } from '@/api/groupScreen'
import { buildPropertyScreenDto, buildParkingScreenDto } from './utils/screenQuery'
import { applyScreenTopKpi } from './utils/kpiEnergy'

export default {
  name: 'GroupPropertyScreen',
  components: {
    ScreenScale,
    CockpitBackdrop,
    ScreenHeader,
    ScreenLoading,
    KpiBar,
    LeftColumn,
    CenterColumn,
    RightColumn
  },
  data () {
    return {
      kpiList: cloneKpiListTemplate(),
      energyManagement: null,
      parkingManagement: null,
      fireManagement: null,
      workOrderManagement: null,
      activeScope: '全部',
      activeTime: '本月',
      screenRequestId: 0,
      initialLoading: true,
      scopeSwitching: false,
      scopeSwitchTimer: null
    }
  },
  watch: {
    activeScope () {
      this.fetchScreenData()
    },
    activeTime () {
      this.fetchScreenData()
    }
  },
  mounted () {
    document.documentElement.classList.add('group-screen-page')
    document.body.classList.add('group-screen-page')
    const app = document.getElementById('app')
    if (app) app.classList.add('group-screen-page')
    this.fetchScreenData()
  },
  beforeDestroy () {
    clearTimeout(this.scopeSwitchTimer)
    document.documentElement.classList.remove('group-screen-page')
    document.body.classList.remove('group-screen-page')
    const app = document.getElementById('app')
    if (app) app.classList.remove('group-screen-page')
  },
  methods: {
    onScaleChange () {
      this.$nextTick(() => {
        ;['leftCol', 'centerCol', 'rightCol'].forEach(ref => {
          const comp = this.$refs[ref]
          if (comp && comp.resizeCharts) comp.resizeCharts()
        })
      })
    },
    refreshTopKpi () {
      this.kpiList = applyScreenTopKpi(cloneKpiListTemplate(), {
        energy: this.energyManagement,
        parking: this.parkingManagement,
        fire: this.fireManagement,
        workOrder: this.workOrderManagement
      })
    },
    applyParkingData (data) {
      if (!data) {
        this.parkingManagement = null
        return
      }
      this.parkingManagement = {
        totalEnterCount: data.totalEnterCount,
        totalExitCount: data.totalExitCount,
        totalVehicleFlow: data.totalVehicleFlow,
        totalRevenue: data.totalRevenue,
        parkingLotRevenueList: Array.isArray(data.parkingLotRevenueList)
          ? data.parkingLotRevenueList
          : []
      }
    },
    async fetchScreenData () {
      const requestId = ++this.screenRequestId
      this.scopeSwitching = requestId > 1
      clearTimeout(this.scopeSwitchTimer)
      const scope = this.activeScope
      const period = this.activeTime
      const energyDto = buildPropertyScreenDto({ scope, period })
      const parkingDto = buildParkingScreenDto({ scope, period })
      const fireDto = buildPropertyScreenDto({ scope, period })
      const workOrderDto = buildPropertyScreenDto({ scope, period })

      await Promise.all([
        getEnergyManagement(energyDto).then(res => {
          if (requestId !== this.screenRequestId) return
          if (res && res.code === 200 && res.data) {
            this.energyManagement = res.data
          } else {
            this.energyManagement = null
          }
        }).catch(e => {
          if (requestId !== this.screenRequestId) return
          console.error('[group-screen] getEnergyManagement failed', e)
          this.energyManagement = null
        }),
        getParkingManagement(parkingDto).then(res => {
          if (requestId !== this.screenRequestId) return
          if (res && res.code === 200 && res.data) {
            this.applyParkingData(res.data)
          } else {
            this.parkingManagement = null
          }
        }).catch(e => {
          if (requestId !== this.screenRequestId) return
          console.error('[group-screen] getParkingManagement failed', e)
          this.parkingManagement = null
        }),
        getFireManagement(fireDto).then(res => {
          if (requestId !== this.screenRequestId) return
          if (res && res.code === 200 && res.data) {
            this.fireManagement = res.data
          } else {
            this.fireManagement = null
          }
        }).catch(e => {
          if (requestId !== this.screenRequestId) return
          console.error('[group-screen] getFireManagement failed', e)
          this.fireManagement = null
        }),
        getWorkOrderManagement(workOrderDto).then(res => {
          if (requestId !== this.screenRequestId) return
          if (res && res.code === 200 && res.data) {
            this.workOrderManagement = res.data
          } else {
            this.workOrderManagement = null
          }
        }).catch(e => {
          if (requestId !== this.screenRequestId) return
          console.error('[group-screen] getWorkOrderManagement failed', e)
          this.workOrderManagement = null
        })
      ])

      if (requestId !== this.screenRequestId) return
      this.refreshTopKpi()
      this.scopeSwitchTimer = setTimeout(() => {
        if (requestId === this.screenRequestId) {
          this.scopeSwitching = false
          this.initialLoading = false
        }
      }, 180)
    }
  }
}
</script>

<style lang="scss">
@import './styles/design-system.scss';
@import './styles/screen.scss';

html.group-screen-page,
body.group-screen-page {
  margin: 0;
  padding: 0;
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: auto;
  text-rendering: optimizeLegibility;
}

#app.group-screen-page {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.group-screen__refresh-target {
  transition: opacity 0.22s ease, filter 0.22s ease, transform 0.22s ease;
}

.group-screen__main.is-scope-switching {
  opacity: 0.72;
  filter: saturate(0.84);
  transform: translateY(2px);
}

.kpi-bar.is-scope-switching {
  opacity: 0.78;
  filter: saturate(0.86);
}

.group-screen__switch-status {
  position: absolute;
  z-index: 30;
  top: 10px;
  left: 50%;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 32px;
  padding: 0 16px;
  border: 1px solid rgba(109, 193, 192, 0.32);
  border-radius: 999px;
  background: rgba(7, 22, 39, 0.92);
  box-shadow:
    0 10px 22px rgba(2, 8, 16, 0.3),
    0 0 18px rgba(109, 193, 192, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  color: rgba(230, 242, 255, 0.92);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.4px;
  transform: translateX(-50%);
  pointer-events: none;

  i {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 2px solid rgba(109, 193, 192, 0.22);
    border-top-color: rgba(122, 214, 212, 0.95);
    animation: group-screen-status-spin 0.9s linear infinite;
  }
}

@keyframes group-screen-status-spin {
  to { transform: rotate(360deg); }
}

@keyframes group-screen-status-pulse {
  from { opacity: 0.42; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .group-screen__refresh-target,
  .group-screen__switch-status i {
    transition: none;
    animation: none;
  }
}
</style>
