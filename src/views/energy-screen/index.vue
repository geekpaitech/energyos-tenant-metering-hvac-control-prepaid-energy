<template>
  <screen-scale @scale-change="onScaleChange">
    <div class="energy-screen">
      <energy-header
        class="energy-screen__header"
        :weather="screenData.weather"
        :managers="managerList"
        :current-manager-id="currentManagerId"
        :loading="screenLoading"
        @manager-change="handleManagerChange"
      />
      <kpi-strip class="energy-screen__kpis" :items="screenData.kpis" />

      <main class="energy-screen__main">
        <left-column
          ref="leftColumn"
          :trend="screenData.left.trend"
          :structure="screenData.left.structure"
          :costs="screenData.left.costs"
        />
        <energy-flow :data="screenData.flow" />
        <right-column
          :arrears="screenData.right.arrears"
          :photovoltaic="screenData.right.photovoltaic"
          :device-status="screenData.right.deviceStatus"
        />
      </main>

      <footer-strip class="energy-screen__footer" :data="screenData.footer" />
    </div>
  </screen-scale>
</template>

<script>
import { mapGetters } from 'vuex'
import ScreenScale from './components/ScreenScale.vue'
import EnergyHeader from './components/EnergyHeader.vue'
import KpiStrip from './components/KpiStrip.vue'
import LeftColumn from './components/modules/LeftColumn.vue'
import EnergyFlow from './components/modules/EnergyFlow.vue'
import RightColumn from './components/modules/RightColumn.vue'
import FooterStrip from './components/FooterStrip.vue'
import { createEnergyScreenSkeleton, getEnergyScreenOverview, queryEnergyScreenManagers } from './api/energyScreen'

export default {
  name: 'GroupEnergyScreen',
  components: { ScreenScale, EnergyHeader, KpiStrip, LeftColumn, EnergyFlow, RightColumn, FooterStrip },
  data () {
    return {
      screenData: createEnergyScreenSkeleton(),
      screenRequestId: 0,
      screenLoading: false
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId', 'managerList'])
  },
  watch: {
    currentManagerId: {
      handler () {
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
      if (this.currentManagerId && this.managerList.length) return
      try {
        const response = await queryEnergyScreenManagers()
        if (!response || String(response.code) !== '200' || !Array.isArray(response.data)) return
        const managers = response.data
        this.$store.commit('manager/SET_MANAGER_LIST', managers)

        const savedManagerId = window.localStorage.getItem('selectedManagerId')
        const selectedManager = managers.find(item => String(item.managerId) === String(savedManagerId)) ||
          managers.find(item => Number(item.isDefault) === 1) ||
          managers[0]
        if (!selectedManager) return

        this.$store.commit('manager/SET_CURRENT_MANAGER_ID', selectedManager.managerId)
        this.$store.commit('manager/SET_CURRENT_MANAGER', selectedManager)
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
        const overview = await getEnergyScreenOverview(managerId)
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
    handleManagerChange (managerId) {
      if (String(managerId) === String(this.currentManagerId)) return
      const manager = this.managerList.find(item => String(item.managerId) === String(managerId))
      if (!manager) return
      this.$store.commit('manager/SET_CURRENT_MANAGER_ID', manager.managerId)
      this.$store.commit('manager/SET_CURRENT_MANAGER', manager)
    },
    onScaleChange () {
      this.$nextTick(() => {
        const left = this.$refs.leftColumn
        if (left && left.resizeCharts) left.resizeCharts()
      })
    }
  }
}
</script>

<style lang="scss">
@import './styles/screen.scss';
</style>
