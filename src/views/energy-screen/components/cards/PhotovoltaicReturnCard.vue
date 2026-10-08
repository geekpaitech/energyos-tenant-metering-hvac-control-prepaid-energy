<template>
  <energy-panel
    title="光伏动态收益分析"
    class="photovoltaic-return-card"
    :class="{ 'is-drillable': drillable }"
    @click.native="handleDrilldown"
  >
    <template #title>
      <span class="photovoltaic-return-card__title-icon"><energy-icon name="solar" /></span>
      <span>光伏动态收益分析</span>
    </template>
    <div class="pv-return-analysis">
      <div class="pv-return-analysis__top">
        <section class="pv-return-highlight" aria-label="预计年收益">
          <h3>年收益动态预估</h3>
          <div class="pv-return-highlight__value">
            <span class="pv-return-highlight__icon"><energy-icon name="growth" /></span>
            <div class="pv-return-highlight__copy">
              <strong>{{ annualReturnWan }}</strong>
              <span>万元/年</span>
            </div>
          </div>
          <p>按上月表计电费年化测算</p>
          <p>电费单价：0.6474 元/kWh</p>
        </section>

        <section class="pv-return-metrics" aria-label="光伏投资核心指标">
          <article class="pv-return-metric tone-blue">
            <span class="pv-return-metric__icon"><energy-icon name="investment" /></span>
            <div>
              <span>总投入</span>
              <strong>{{ investmentWan }}<small>万元</small></strong>
            </div>
          </article>
          <article class="pv-return-metric tone-gold">
            <span class="pv-return-metric__icon"><energy-icon name="solar" /></span>
            <div>
              <span>建设参数</span>
              <strong class="is-capacity">{{ capacityKwp }}<small>kWp</small></strong>
            </div>
          </article>
          <article class="pv-return-metric tone-violet">
            <span class="pv-return-metric__icon"><energy-icon name="percentage" /></span>
            <div>
              <span>收益率</span>
              <strong>{{ annualReturnRate }}<small>%</small></strong>
            </div>
          </article>
          <article class="pv-return-metric tone-green">
            <span class="pv-return-metric__icon"><energy-icon name="load" /></span>
            <div>
              <span>预计投入回收周期</span>
              <strong>{{ paybackYears }}<small>年</small></strong>
              <em v-if="hasReturnData">按上月收益水平测算</em>
              <em v-else>等待上月账单数据</em>
            </div>
          </article>
        </section>
      </div>

      <section class="pv-return-flow" aria-label="光伏收益测算过程">
        <article class="pv-return-flow__item tone-blue">
          <span class="pv-return-flow__icon"><energy-icon name="bolt" /></span>
          <div>
            <span>月均发电量</span>
            <strong>{{ monthlyGenerationKwh }}<small>kWh</small></strong>
            <em>≈ {{ monthlyGenerationMwh }} MWh</em>
          </div>
        </article>
        <energy-icon class="pv-return-flow__arrow is-blue" name="flow-arrow" />
        <article class="pv-return-flow__item tone-green">
          <span class="pv-return-flow__icon"><energy-icon name="yuan" /></span>
          <div>
            <span>上月表计电费</span>
            <strong>{{ monthlyReturnYuan }}<small>元</small></strong>
            <em>≈ {{ monthlyReturnWan }} 万元</em>
          </div>
        </article>
        <energy-icon class="pv-return-flow__arrow is-green" name="flow-arrow" />
        <article class="pv-return-flow__item tone-gold">
          <span class="pv-return-flow__icon"><energy-icon name="savings" /></span>
          <div>
            <span>预计年收益</span>
            <strong>{{ annualReturnYuan }}<small>元/年</small></strong>
            <em>≈ {{ annualReturnWan }} 万元/年</em>
          </div>
        </article>
      </section>
    </div>
  </energy-panel>
</template>

<script>
import moment from 'moment'
import { settleSettleTenantStatistics } from '@/api/settle'
import EnergyPanel from '../EnergyPanel.vue'
import EnergyIcon from '../EnergyIcon.vue'

const PHOTOVOLTAIC_MANAGER_ID = 1000107

export default {
  name: 'PhotovoltaicReturnCard',
  components: { EnergyPanel, EnergyIcon },
  inject: {
    energyScreenDrilldown: {
      default: null
    }
  },
  props: {
    model: { type: Object, required: true },
    drillable: { type: Boolean, default: false }
  },
  data () {
    return {
      monthlyElectricityReturnYuan: null
    }
  },
  computed: {
    hasReturnData () {
      return Number.isFinite(this.monthlyElectricityReturnYuan)
    },
    annualReturnYuanValue () {
      return this.hasReturnData ? this.monthlyElectricityReturnYuan * 12 : null
    },
    investmentWan () {
      return this.formatNumber(Number(this.model.investmentYuan) / 10000, 0)
    },
    capacityKwp () {
      return this.formatNumber(this.model.capacityKwp, 2)
    },
    monthlyGenerationKwh () {
      return this.formatNumber(this.model.monthlyGenerationKwh, 2)
    },
    monthlyGenerationMwh () {
      return this.formatNumber(Number(this.model.monthlyGenerationKwh) / 1000, 2)
    },
    monthlyReturnYuan () {
      return this.formatNullableNumber(this.monthlyElectricityReturnYuan, 2)
    },
    monthlyReturnWan () {
      return this.hasReturnData ? this.formatNumber(this.monthlyElectricityReturnYuan / 10000, 2) : '--'
    },
    annualReturnYuan () {
      return this.formatNullableNumber(this.annualReturnYuanValue, 2)
    },
    annualReturnWan () {
      return this.hasReturnData ? this.formatNumber(this.annualReturnYuanValue / 10000, 2) : '--'
    },
    annualReturnRate () {
      const investment = Number(this.model.investmentYuan)
      return this.hasReturnData && investment > 0
        ? this.formatNumber((this.annualReturnYuanValue / investment) * 100, 1)
        : '--'
    },
    paybackYears () {
      const investment = Number(this.model.investmentYuan)
      return this.hasReturnData && this.annualReturnYuanValue > 0 && investment > 0
        ? this.formatNumber(investment / this.annualReturnYuanValue, 1)
        : '--'
    }
  },
  mounted () {
    this.loadPreviousMonthReturn()
  },
  methods: {
    previousMonthRange () {
      const previousMonth = moment().subtract(1, 'month')
      return {
        startDate: previousMonth.clone().startOf('month').format('YYYY-MM-DD'),
        endDate: previousMonth.clone().endOf('month').format('YYYY-MM-DD')
      }
    },
    async loadPreviousMonthReturn () {
      const range = this.previousMonthRange()
      try {
        const response = await settleSettleTenantStatistics({
          managerId: PHOTOVOLTAIC_MANAGER_ID,
          rid: '',
          tenantType: 3,
          payType: null,
          payStatus: '',
          withdrawStatus: '',
          settleWay: '0,1,2,3,4,5,10',
          status: '',
          endDate: range.endDate,
          startDate: range.startDate
        })
        const rawMeterElectricityFee = response && response.data ? response.data['表计电费'] : null
        const meterElectricityFee = Number(rawMeterElectricityFee)
        const hasMeterElectricityFee = rawMeterElectricityFee !== null &&
          rawMeterElectricityFee !== undefined &&
          rawMeterElectricityFee !== '' &&
          Number.isFinite(meterElectricityFee)
        this.monthlyElectricityReturnYuan = response && response.data && Number(response.code) === 200 && hasMeterElectricityFee
          ? meterElectricityFee
          : null
      } catch (error) {
        this.monthlyElectricityReturnYuan = null
        console.error('[energy-screen] photovoltaic return statistics load failed', error)
      }
    },
    handleDrilldown () {
      if (!this.drillable || !this.energyScreenDrilldown) return
      this.energyScreenDrilldown('photovoltaic')
    },
    formatNumber (value, digits) {
      return Number(value).toLocaleString('zh-CN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      })
    },
    formatNullableNumber (value, digits) {
      return Number.isFinite(value) ? this.formatNumber(value, digits) : '--'
    }
  }
}
</script>
