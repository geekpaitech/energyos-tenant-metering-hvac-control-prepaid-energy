<template>
  <transition name="unit-energy-fade">
    <section
      v-if="visible"
      class="unit-energy-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unit-energy-title"
      @click.self="close"
    >
      <div class="unit-energy-dialog">
        <header class="unit-energy-dialog__header">
          <div class="unit-energy-dialog__heading">
            <span class="unit-energy-dialog__icon" aria-hidden="true"><i class="el-icon-data-analysis" /></span>
            <div>
              <h2 id="unit-energy-title">单位面积能耗明细</h2>
              <p>查看各项目建筑面积、总用电量及单位面积能耗 · {{ activeScope }} · {{ activeTime }}</p>
            </div>
          </div>
          <div class="unit-energy-dialog__header-actions">
            <button
              type="button"
              class="unit-energy-dialog__export"
              :disabled="loading || exporting"
              @click="exportExcel"
            >
              <i :class="exporting ? 'el-icon-loading' : 'el-icon-download'" aria-hidden="true" />
              {{ exporting ? '导出中' : '导出' }}
            </button>
            <button type="button" class="unit-energy-dialog__close" aria-label="关闭详情弹窗" @click="close">
              <i class="el-icon-close" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div class="unit-energy-dialog__body" :aria-busy="loading ? 'true' : 'false'">
          <div class="unit-energy-table">
            <div class="unit-energy-table__head">
              <span>序号</span><span class="is-name">项目名称</span><span>业态</span><span>建筑面积（m²）</span><span>总用电量（kWh）</span><span>单位面积能耗（kWh/m²）</span>
            </div>
            <div v-if="!loading && !rows.length && !errorMessage" class="unit-energy-empty">暂无单位面积能耗明细数据</div>
            <div v-for="(row, index) in rows" :key="row.id" class="unit-energy-table__row">
              <span>{{ index + 1 }}</span>
              <span class="is-name" :title="row.managerName">{{ row.managerName }}</span>
              <span>{{ bizTypeText(row.bizType) }}</span>
              <span class="is-number">{{ formatNumber(row.coveredArea) }}</span>
              <span class="is-number">{{ formatNumber(row.electricityValue) }}</span>
              <span class="is-consumption">{{ formatNumber(row.unitAreaEnergyConsumption, 4) }}</span>
            </div>
          </div>

          <div v-if="loading" class="unit-energy-state" role="status" aria-live="polite">
            <i class="el-icon-loading" aria-hidden="true" /><span>详情数据加载中…</span>
          </div>
          <div v-else-if="errorMessage" class="unit-energy-state unit-energy-state--error">
            <i class="el-icon-warning-outline" aria-hidden="true" />
            <span>{{ errorMessage }}</span>
            <button type="button" @click="fetchData">重新加载</button>
          </div>
        </div>
      </div>
    </section>
  </transition>
</template>

<script>
import { queryUnitAreaEnergyConsumptionDetails } from '@/api/groupScreen'
import { buildPropertyScreenDto } from '../utils/screenQuery'
import * as XLSX from 'xlsx'

export default {
  name: 'UnitAreaEnergyDialog',
  props: {
    visible: { type: Boolean, default: false },
    activeScope: { type: String, default: '全部' },
    activeTime: { type: String, default: '本月' }
  },
  data () {
    return {
      rows: [],
      loading: false,
      exporting: false,
      errorMessage: '',
      requestId: 0
    }
  },
  watch: {
    visible (value) {
      if (value) this.fetchData()
    },
    activeScope () {
      if (this.visible) this.fetchData()
    },
    activeTime () {
      if (this.visible) this.fetchData()
    }
  },
  mounted () {
    window.addEventListener('keydown', this.handleKeydown)
  },
  beforeDestroy () {
    window.removeEventListener('keydown', this.handleKeydown)
    this.requestId += 1
  },
  methods: {
    async fetchData () {
      const requestId = ++this.requestId
      this.loading = true
      this.errorMessage = ''
      try {
        const params = buildPropertyScreenDto({ scope: this.activeScope, period: this.activeTime })
        const rows = await queryUnitAreaEnergyConsumptionDetails(params)
        if (requestId !== this.requestId) return
        this.rows = rows
      } catch (error) {
        if (requestId !== this.requestId) return
        this.rows = []
        this.errorMessage = error && error.message ? error.message : '单位面积能耗明细获取失败'
      } finally {
        if (requestId === this.requestId) this.loading = false
      }
    },
    exportExcel () {
      if (!this.rows.length) {
        this.$message.warning('暂无可导出的单位面积能耗数据')
        return
      }
      this.exporting = true
      try {
        const headers = ['序号', '项目名称', '业态', '建筑面积（m²）', '总用电量（kWh）', '单位面积能耗（kWh/m²）']
        const data = this.rows.map((row, index) => [
          index + 1,
          row.managerName,
          this.bizTypeText(row.bizType),
          this.formatNumber(row.coveredArea),
          this.formatNumber(row.electricityValue),
          this.formatNumber(row.unitAreaEnergyConsumption, 4)
        ])
        const sheet = XLSX.utils.aoa_to_sheet([headers, ...data])
        sheet['!cols'] = [
          { wch: 8 },
          { wch: 24 },
          { wch: 14 },
          { wch: 20 },
          { wch: 22 },
          { wch: 28 }
        ]
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, sheet, '单位面积能耗明细')
        XLSX.writeFile(workbook, `单位面积能耗明细_${this.exportTimestamp()}.xlsx`)
        this.$message.success(`已导出 ${this.rows.length} 条单位面积能耗数据`)
      } catch (error) {
        console.error('[group-screen] unit area energy export failed', error)
        this.$message.error('单位面积能耗明细导出失败，请稍后重试')
      } finally {
        this.exporting = false
      }
    },
    exportTimestamp () {
      const now = new Date()
      const pad = value => String(value).padStart(2, '0')
      return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    },
    close () {
      this.requestId += 1
      this.loading = false
      this.$emit('close')
    },
    handleKeydown (event) {
      if (this.visible && event.key === 'Escape') this.close()
    },
    bizTypeText (value) {
      return { 1: '产业园', 2: '商办', 3: '公寓' }[Number(value)] || '--'
    },
    formatNumber (value, digits = 2) {
      if (value == null || value === '' || !Number.isFinite(Number(value))) return '--'
      return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: digits })
    }
  }
}
</script>

<style scoped lang="scss">
@import '../styles/design-system.scss';

.unit-energy-layer {
  position: absolute !important;
  z-index: 87 !important;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 92px 120px 54px;
  box-sizing: border-box;
  background: rgba(3, 13, 28, 0.72);
  backdrop-filter: blur(2px);
}

.unit-energy-dialog {
  display: flex;
  flex-direction: column;
  width: 1180px;
  height: 670px;
  min-width: 0;
  min-height: 0;
  padding: 0 22px 20px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid rgba(104, 165, 202, 0.54);
  border-radius: 10px;
  background: #0b223d;
  box-shadow: 0 24px 64px rgba(0, 7, 20, 0.55);
  color: #edf5fb;
}

.unit-energy-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 78px;
  border-bottom: 1px solid rgba(113, 166, 199, 0.24);
}

.unit-energy-dialog__heading {
  display: flex;
  align-items: center;
  gap: 13px;

  h2 { margin: 0; color: #f4f8fc; font-size: 21px; font-weight: 600; letter-spacing: 0.4px; }
  p { margin: 5px 0 0; color: rgba(199, 218, 232, 0.72); font-size: 12px; }
}

.unit-energy-dialog__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(107, 174, 210, 0.4);
  border-radius: 8px;
  background: #102f4e;
  color: #8cc9e4;
  font-size: 20px;
}

.unit-energy-dialog__header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.unit-energy-dialog__export {
  height: 34px;
  padding: 0 17px;
  border: 1px solid #4a8baa;
  border-radius: 5px;
  background: #174b68;
  color: #e8f5fb;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;

  &:hover { border-color: rgba(125, 190, 220, 0.78); color: #fff; }
  &:disabled { border-color: rgba(111, 164, 197, 0.2); color: rgba(201, 220, 232, 0.45); cursor: not-allowed; }
  i { margin-right: 4px; }
}

.unit-energy-dialog__close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid rgba(112, 164, 196, 0.32);
  border-radius: 7px;
  background: #0c2945;
  color: #c4d8e5;
  font-size: 17px;
  cursor: pointer;

  &:hover,
  &:focus-visible { border-color: rgba(130, 194, 224, 0.68); color: #fff; outline: none; }
}

.unit-energy-dialog__body {
  position: relative;
  flex: 1;
  min-height: 0;
  margin-top: 14px;
}

.unit-energy-table {
  height: 100%;
  overflow: auto;
  border: 1px solid rgba(104, 158, 190, 0.18);
  border-radius: 7px;
  background: #091f37;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: #0a2139; }
  &::-webkit-scrollbar-thumb { border: 2px solid #0a2139; border-radius: 8px; background: #315776; }
}

.unit-energy-table__head,
.unit-energy-table__row {
  display: grid;
  align-items: center;
  grid-template-columns: 70px minmax(230px, 1.35fr) 110px repeat(3, minmax(170px, 1fr));
  min-height: 48px;
  border-bottom: 1px solid rgba(105, 155, 185, 0.12);
  box-sizing: border-box;

  > span { min-width: 0; padding: 0 12px; overflow: hidden; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
  .is-name { text-align: left; }
}

.unit-energy-table__head {
  position: sticky;
  z-index: 2;
  top: 0;
  min-height: 42px;
  background: #12314e;
  color: rgba(210, 226, 237, 0.88);
  font-size: 12px;
  font-weight: 600;
}

.unit-energy-table__row {
  color: rgba(231, 240, 246, 0.9);
  font-size: 12px;

  &:nth-child(odd) { background: rgba(23, 55, 82, 0.2); }
  .is-name { color: #eef6fb; font-weight: 500; }
  .is-number { color: #dcecf5; font-family: $ds-font-num; font-weight: 600; }
  .is-consumption { color: #80c6df; font-family: $ds-font-num; font-weight: 600; }
}

.unit-energy-empty {
  display: grid;
  place-items: center;
  min-height: 260px;
  color: rgba(190, 211, 225, 0.55);
  font-size: 13px;
}

.unit-energy-state {
  position: absolute;
  z-index: 4;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  background: rgba(7, 27, 48, 0.82);
  color: #c8dce8;
  font-size: 13px;

  &--error {
    flex-direction: column;
    color: #d9b184;
    i { font-size: 22px; }
    button { padding: 5px 14px; border: 1px solid rgba(119, 173, 203, 0.4); border-radius: 4px; background: #12334f; color: #e7f0f6; cursor: pointer; }
  }
}

.unit-energy-fade-enter-active,
.unit-energy-fade-leave-active { transition: opacity 0.2s ease; }
.unit-energy-fade-enter,
.unit-energy-fade-leave-to { opacity: 0; }
</style>
