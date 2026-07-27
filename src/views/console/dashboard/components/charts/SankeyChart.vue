<template>
  <div
    class="sankey-chart"
    :class="{ 'sankey-chart--empty': shouldShowEmpty }"
    style="cursor: pointer;"
    @click="handleChartClick"
  >
    <div class="chart-header">
        <div class="header-left">
          <div class="icon-box">
            <img class="icon-img" :src="require('../../image/Sangji.png')" :alt="$t('dashboard.sankey.title')" />
          </div>
          <div class="title-box">
            <h3>{{ $t('dashboard.sankey.title') }}</h3>
            <p>{{ $t('dashboard.sankey.subtitle') }}</p>
          </div>
        </div>
      </div>
    <div
      class="chart-body"
      v-loading="loading && !!currentManagerId"
      :element-loading-text="$t('dashboard.sankey.loading')"
      element-loading-spinner="el-icon-loading"
      element-loading-background="rgba(255,255,255,0.82)"
    >
      <div v-if="!shouldShowEmpty" ref="chartRef" key="sankey-chart" class="chart-container"></div>
      <div v-else class="chart-empty">
        <div class="empty-card">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M8 17h8" />
              <path d="M8 13h6" />
            </svg>
          </div>
          <div class="empty-title">{{ $t('dashboard.sankey.emptyTitle') }}</div>
          <div class="empty-sub">{{ $t('dashboard.sankey.emptySub') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import moment from 'moment'
import { mapGetters } from 'vuex'
import { getSimpleTenantList } from '@/api/useReport'
import { queryTenantSankey, isDemoManager } from '@/api/newDashboard'

const SANKEY_COLORS = [
  '#5B8FF9',
  '#61DDAA',
  '#F6BD16',
  '#7262FD',
  '#78D3F8',
  '#9661BC',
  '#F6903D',
  '#008685'
]

export default {
  name: 'SankeyChart',
  data () {
    return {
      chart: null,
      loading: false,
      tenantList: [],
      maxDisplayTenants: 6,
      sankeyData: null
    }
  },
  computed: {
    ...mapGetters('manager', ['currentManagerId']),
    shouldShowEmpty () {
      return !this.loading && (!this.sankeyData || !this.sankeyData.links || this.sankeyData.links.length === 0)
    }
  },
  watch: {
    currentManagerId: {
      handler () {
        this.loadAll()
      },
      immediate: true
    },
    '$i18n.locale' () {
      this.loadAll()
    }
  },
  mounted () {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    ensureChart () {
      if (this.chart) return
      const el = this.$refs.chartRef
      if (!el) return
      this.chart = echarts.init(el)

      this.chart.on('click', (params) => {
        if (params.componentType === 'series') {
          this.$router.push('/energy/electricity-sankey')
        }
      })
    },
    clearChart () {
      if (this.chart) {
        this.chart.clear()
        this.chart.dispose()
        this.chart = null
      }
    },
    buildOption () {
      const option = {
        animation: true,
        animationDuration: 750,
        animationDurationUpdate: 500,
        animationEasing: 'cubicOut',
        animationEasingUpdate: 'cubicOut',
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#E2E8F0',
          textStyle: { color: '#1E293B', fontSize: 11 }
        },
        series: [
          {
            type: 'sankey',
            layout: 'none',
            emphasis: {
              focus: 'adjacency'
            },
            nodeAlign: 'justify',
            nodeGap: 14,
            nodeWidth: 16,
            draggable: false,
            data: (this.sankeyData && this.sankeyData.nodes) ? this.sankeyData.nodes : [],
            links: (this.sankeyData && this.sankeyData.links) ? this.sankeyData.links : [],
            lineStyle: {
              color: 'gradient',
              opacity: 0.26,
              curveness: 0.45
            },
            label: {
              color: '#475569',
              fontSize: 11,
              fontWeight: 500,
              width: 88,
              overflow: 'truncate',
              ellipsis: '…'
            },
            /* 略增大左右留白，减轻「整图被横向扯开」的视觉 */
            left: '4%',
            right: '18%',
            top: '8%',
            bottom: '8%'
          }
        ]
      }
      return option
    },
    renderChart () {
      if (this.shouldShowEmpty) {
        this.clearChart()
        return
      }
      this.ensureChart()
      if (!this.chart) return
      this.chart.setOption(this.buildOption(), true)
      requestAnimationFrame(() => this.chart && this.chart.resize())
    },
    async loadAll () {
      if (!this.currentManagerId) {
        this.tenantList = []
        this.sankeyData = null
        this.loading = false
        await this.$nextTick()
        this.renderChart()
        return
      }

      this.loading = true
      this.sankeyData = null
      try {
        if (isDemoManager(this.currentManagerId)) {
          this.tenantList = [
            { tenantId: 101, tenantName: 'A3号楼·制造车间' },
            { tenantId: 102, tenantName: 'B2号楼·冷链仓' },
            { tenantId: 103, tenantName: '研发中心·实验室' },
            { tenantId: 104, tenantName: '智慧园区·孵化器' }
          ]
          const mock = {
            managerName: this.$t('dashboard.sankey.parkTotal'),
            privateTotalElec: 6200,
            shareTotalElec: 1800,
            tenantInfoDtoList: this.tenantList,
            meterUseDtoList: [
              { bindType: 1, bindId: 101, meterElec: 2100 },
              { bindType: 1, bindId: 102, meterElec: 1800 },
              { bindType: 1, bindId: 103, meterElec: 1450 },
              { bindType: 1, bindId: 104, meterElec: 850 }
            ],
            shareUseDtoList: [
              {
                shareTenantDtoList: [
                  { tenantId: 101, tenantShareElec: 420 },
                  { tenantId: 102, tenantShareElec: 380 },
                  { tenantId: 103, tenantShareElec: 320 },
                  { tenantId: 104, tenantShareElec: 280 }
                ]
              }
            ]
          }
          const processed = this.processSankeyData(mock)
          this.sankeyData = processed
          return
        }
        const { data } = await getSimpleTenantList({
          managerId: this.currentManagerId,
          tenantStatus: 0
        })
        this.tenantList = data || []

        if (!this.tenantList.length) {
          this.sankeyData = null
          return
        }

        const res = await queryTenantSankey({
          managerId: this.currentManagerId,
          tenantIdList: this.tenantList.map(t => t.tenantId),
          queryDate: moment().subtract(1, 'days').format('YYYY-MM-DD')
        })

        const raw = (res && res.data) ? res.data : res
        const processed = this.processSankeyData(raw)
        this.sankeyData = processed && processed.links && processed.links.length ? processed : null
      } catch (e) {
        this.tenantList = []
        this.sankeyData = null
      } finally {
        this.loading = false
        await this.$nextTick()
        this.renderChart()
        this.handleResize()
      }
    },
    processSankeyData (data) {
      if (!data) return null

      const Ld = this.$t('dashboard.sankey.dedicated')
      const Ls = this.$t('dashboard.sankey.shared')
      const Lo = this.$t('dashboard.sankey.otherTenants')
      const Lp = this.$t('dashboard.sankey.parkTotal')

      const nodes = []
      const links = []

      const totalNodeName = data.managerName
        ? this.$displayDynamicName(data.managerName, 22)
        : Lp
      const privateTotalElec = data.privateTotalElec || 0
      const shareTotalElec = data.shareTotalElec || 0

      nodes.push({ name: totalNodeName, itemStyle: { color: '#1890ff' } })

      if (privateTotalElec > 0) {
        nodes.push({ name: Ld, itemStyle: { color: '#52c41a' } })
        links.push({ source: totalNodeName, target: Ld, value: privateTotalElec })
      }

      if (shareTotalElec > 0) {
        nodes.push({ name: Ls, itemStyle: { color: '#faad14' } })
        links.push({ source: totalNodeName, target: Ls, value: shareTotalElec })
      }

      const tenantPrivateMap = new Map()
      const tenantShareMap = new Map()

      if (data.tenantInfoDtoList && Array.isArray(data.tenantInfoDtoList)) {
        data.tenantInfoDtoList.forEach((tenant) => {
          tenantPrivateMap.set(tenant.tenantId, { tenantId: tenant.tenantId, tenantName: tenant.tenantName, totalElec: 0 })
          tenantShareMap.set(tenant.tenantId, { tenantId: tenant.tenantId, tenantName: tenant.tenantName, totalElec: 0 })
        })
      }

      if (data.meterUseDtoList && Array.isArray(data.meterUseDtoList)) {
        data.meterUseDtoList.forEach((meter) => {
          if (meter.bindType === 1 && meter.bindId) {
            const tenantData = tenantPrivateMap.get(meter.bindId)
            if (tenantData) tenantData.totalElec += meter.meterElec || 0
          }
        })
      }

      if (data.shareUseDtoList && Array.isArray(data.shareUseDtoList)) {
        data.shareUseDtoList.forEach((share) => {
          if (share.shareTenantDtoList && Array.isArray(share.shareTenantDtoList)) {
            share.shareTenantDtoList.forEach((tenantShare) => {
              const tenantData = tenantShareMap.get(tenantShare.tenantId)
              if (tenantData && tenantShare.tenantShareElec > 0) tenantData.totalElec += tenantShare.tenantShareElec
            })
          }
        })
      }

      const privateArray = Array.from(tenantPrivateMap.values())
        .filter(t => t.totalElec > 0)
        .sort((a, b) => b.totalElec - a.totalElec)

      let displayPrivate = privateArray
      let othersPrivateElec = 0
      if (privateArray.length > this.maxDisplayTenants) {
        displayPrivate = privateArray.slice(0, this.maxDisplayTenants - 1)
        const others = privateArray.slice(this.maxDisplayTenants - 1)
        othersPrivateElec = others.reduce((sum, t) => sum + t.totalElec, 0)
      }

      displayPrivate.forEach((tenant, index) => {
        const color = SANKEY_COLORS[index % SANKEY_COLORS.length]
        const nodeName = this.$displayDynamicName(tenant.tenantName, 14)
        if (!nodes.find(n => n.name === nodeName)) nodes.push({ name: nodeName, itemStyle: { color } })
        links.push({ source: Ld, target: nodeName, value: tenant.totalElec })
      })

      if (othersPrivateElec > 0) {
        if (!nodes.find(n => n.name === Lo)) nodes.push({ name: Lo, itemStyle: { color: '#c0c4cc' } })
        links.push({ source: Ld, target: Lo, value: othersPrivateElec })
      }

      const shareArray = Array.from(tenantShareMap.values())
        .filter(t => t.totalElec > 0)
        .sort((a, b) => b.totalElec - a.totalElec)

      if (shareTotalElec > 0 && shareArray.length > 0) {
        let displayShare = shareArray
        let othersShareElec = 0

        if (shareArray.length > this.maxDisplayTenants) {
          displayShare = shareArray.slice(0, this.maxDisplayTenants - 1)
          const others = shareArray.slice(this.maxDisplayTenants - 1)
          othersShareElec = others.reduce((sum, t) => sum + t.totalElec, 0)
        }

        displayShare.forEach((tenant, index) => {
          const color = SANKEY_COLORS[index % SANKEY_COLORS.length]
          const nodeName = this.$displayDynamicName(tenant.tenantName, 14)
          if (!nodes.find(n => n.name === nodeName)) nodes.push({ name: nodeName, itemStyle: { color } })
          links.push({ source: Ls, target: nodeName, value: tenant.totalElec })
        })

        if (othersShareElec > 0) {
          if (!nodes.find(n => n.name === Lo)) nodes.push({ name: Lo, itemStyle: { color: '#c0c4cc' } })
          links.push({ source: Ls, target: Lo, value: othersShareElec })
        }
      }

      if (links.length === 0) return null

      return { nodes, links }
    },
    handleResize () {
      if (!this.chart || this.shouldShowEmpty) return
      const el = this.$refs.chartRef
      if (!el) return
      const w = el.clientWidth
      let h = el.clientHeight
      if (!Number.isFinite(w) || !Number.isFinite(h) || w < 2 || h < 2) return
      h = Math.min(h, 1600)
      this.chart.resize({ width: Math.min(w, 2400), height: h })
    },
    handleChartClick () {
      this.$router.push('/energy/electricity-sankey')
    }
  }
}
</script>

<style lang="scss" scoped>
.sankey-chart {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.sankey-chart--empty {
  align-self: flex-start;
  width: 100%;
  height: auto !important;
  max-height: min(320px, 36vh);
}

.sankey-chart--empty .chart-body {
  flex: 1 1 auto;
  min-height: 180px;
  max-height: min(280px, 34vh);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-header {
  display: flex;
  align-items: center;
  padding: 9px 12px;
  border-bottom: 1px solid #F1F5F9;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .icon-box {
    width: 28px;
    height: 28px;
    background: #E0F2FE;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 16px;
      color: #0284C7;
    }

    .icon-img {
      width: 16px;
      height: 16px;
      object-fit: contain;
      display: block;
    }
  }

  .title-box {
    h3 {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }

    p {
      font-size: 10px;
      color: #94A3B8;
      margin: 2px 0 0;
    }
  }
}

.chart-container {
  flex: 1;
  height: 100%;
  min-height: 0;
  width: 100%;
  max-width: min(100%, 1120px);
  margin-left: auto;
  margin-right: auto;
  padding: 6px;
  box-sizing: border-box;
}

.chart-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chart-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.sankey-chart--empty .chart-empty {
  position: relative;
  inset: auto;
  flex: 0 0 auto;
  width: 100%;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-card {
  width: min(360px, 100%);
  padding: 12px 12px 10px;
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px dashed rgba(226, 232, 240, 1);
  text-align: center;
}

.empty-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  background: transparent;
}

.empty-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
}

.empty-sub {
  margin-top: 2px;
  font-size: 10px;
  color: #94A3B8;
}
</style>
